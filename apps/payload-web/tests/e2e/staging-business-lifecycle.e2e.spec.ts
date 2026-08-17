import { test, expect } from "@playwright/test"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"
import { getSuperadminCredentials } from "../helpers/testCredentials"
import { createAuthenticatedApiContext, loginFrontendTenant } from "../helpers/login"

test.describe("Staging & Local Business Lifecycle (Pending Staging Area -> Admin Approval -> Public View)", () => {
  let nogBaseURL: string
  const timestamp = Date.now()
  const testBizName = `Staging Cafe - ${timestamp}`
  const testBizEmail = `staging-cafe-${timestamp}@example.com`
  const mockLogoPath = path.join("/tmp", `staging-logo-${timestamp}.png`)

  test.beforeAll(async ({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")

    fs.writeFileSync(
      mockLogoPath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVGPU5CYII=",
        "base64",
      ),
    )
  })

  test.afterAll(async () => {
    if (fs.existsSync(mockLogoPath)) {
      fs.unlinkSync(mockLogoPath)
    }
  })

  test("Complete lifecycle: register business -> verify hidden pending -> admin approves in dashboard -> verified public view -> remove", async ({
    page,
  }) => {
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    await page.fill("#name", testBizName)
    await page.fill("#address", "1234 Grand Ave, Des Moines, IA")
    await page.fill("#email", testBizEmail)
    await page.fill("#about", "Freshly baked artisan pastries and coffee in North of Grand.")

    const logoInput = page.locator("#logo")
    if ((await logoInput.count()) > 0) {
      await logoInput.setInputFiles(mockLogoPath)
    }

    await page.getByRole("button", { name: /Submit business/i }).click()

    await expect(
      page.getByText(/Thanks! Your listing was submitted and will appear after approval./i),
    ).toBeVisible({ timeout: 15000 })

    await page.goto(`${nogBaseURL}/businesses`)
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("button", { name: new RegExp(testBizName, "i") })).toHaveCount(0)

    const isLocal = !isRemoteTestEnv()
    if (isLocal) {
      const { getPayload } = await import("payload")
      const config = (await import("../../src/payload.config.js")).default
      const payload = await getPayload({ config })

      const found = await payload.find({
        collection: "businesses",
        where: { email: { equals: testBizEmail } },
      })

      expect(found.docs.length).toBeGreaterThan(0)
      await payload.update({
        collection: "businesses",
        id: found.docs[0].id,
        data: { appearOnNOG: true },
      })
    } else {
      const creds = getSuperadminCredentials()
      expect(creds).not.toBeNull()

      // Form login so dashboard SSR gets a real browser session cookie.
      await loginFrontendTenant(page, creds!.email, creds!.password, { baseURL: nogBaseURL })
      await page.goto(`${nogBaseURL}/dashboard/crm`)
      await page.waitForLoadState("networkidle")
      await expect(page.getByRole("heading", { name: /Resident Directory/i })).toBeVisible({
        timeout: 15000,
      })

      await page.getByRole("button", { name: /Local Businesses/i }).click()
      const row = page.locator("tr", { hasText: testBizName })
      await expect(row).toBeVisible({ timeout: 15000 })
      const toggle = row.locator("input.crm-business-approval-toggle")
      await expect(toggle).toBeVisible()
      // Controlled React checkbox: click + wait for label (check() fails when state flips async).
      if (!(await toggle.isChecked())) {
        await toggle.click()
      }
      await expect(row.getByText(/Approved/i)).toBeVisible({ timeout: 15000 })
      await expect(toggle).toBeChecked({ timeout: 5000 })
    }

    await page.goto(`${nogBaseURL}/businesses`)
    await page.waitForLoadState("networkidle")

    const bizCard = page.getByRole("button", { name: new RegExp(testBizName, "i") })
    await expect(bizCard).toBeVisible({ timeout: 15000 })
    await bizCard.click()

    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("dialog")).toContainText(testBizName)
    await expect(page.getByRole("dialog")).toContainText("1234 Grand Ave")

    if (isLocal) {
      const { getPayload } = await import("payload")
      const config = (await import("../../src/payload.config.js")).default
      const payload = await getPayload({ config })
      await payload.delete({
        collection: "businesses",
        where: { email: { equals: testBizEmail } },
      })
    } else {
      const creds = getSuperadminCredentials()
      expect(creds).not.toBeNull()
      const api = await createAuthenticatedApiContext(nogBaseURL, creds!.email, creds!.password)
      try {
        const searchRes = await api.get(
          `/api/businesses?where[email][equals]=${encodeURIComponent(testBizEmail)}`,
        )
        expect(searchRes.ok()).toBeTruthy()
        const data = await searchRes.json()
        if (data.docs?.length > 0) {
          const delRes = await api.delete(`/api/businesses/${data.docs[0].id}`)
          expect(delRes.ok(), `Cleanup DELETE failed: ${delRes.status()}`).toBeTruthy()
        }
      } finally {
        await api.dispose()
      }
    }
  })
})
