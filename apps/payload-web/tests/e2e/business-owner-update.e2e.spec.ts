import { test, expect } from "@playwright/test"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"
import { getSuperadminCredentials } from "../helpers/testCredentials"
import { createAuthenticatedApiContext, loginFrontendTenant } from "../helpers/login"

test.describe("Business Owner Dashboard Update Flow", () => {
  let nogBaseURL: string
  const timestamp = Date.now()
  const testBizName = `Owner Cafe - ${timestamp}`
  const testBizEmail = `owner-cafe-${timestamp}@example.com`
  const updatedAbout = `Updated about: Premier coffee shop in North of Grand serving local pastries since 2026. [Ref ${timestamp}]`
  const updatedAddress = `999 Ingersoll Ave, Des Moines, IA`
  const mockLogoPath = path.join("/tmp", `owner-logo-${timestamp}.png`)

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

  test("Business owner logs in, updates address & description in Dashboard, and updates display publicly", async ({
    page,
  }) => {
    // 1. Publicly register business
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    await page.fill("#name", testBizName)
    await page.fill("#address", "100 Original Street")
    await page.fill("#email", testBizEmail)
    await page.fill("#about", "Original description before owner update.")

    const logoInput = page.locator("#logo")
    if ((await logoInput.count()) > 0) {
      await logoInput.setInputFiles(mockLogoPath)
    }

    const submitBtn = page.getByRole("button", { name: /Submit business/i })
    await submitBtn.click()
    await expect(page.getByText(/listing was submitted/i)).toBeVisible({ timeout: 15000 })

    // 2. Approve business so it is active
    const testOwnerPassword = "OwnerPassword123!"
    const isLocal = !isRemoteTestEnv()
    if (isLocal) {
      const { getPayload } = await import("payload")
      const config = (await import("../../src/payload.config.js")).default
      const payload = await getPayload({ config })

      const found = await payload.find({
        collection: "businesses",
        where: { email: { equals: testBizEmail } },
      })
      if (found.docs.length > 0) {
        await payload.update({
          collection: "businesses",
          id: found.docs[0].id,
          data: { appearOnNOG: true },
        })
      }

      const foundUsers = await payload.find({
        collection: "users",
        where: { email: { equals: testBizEmail } },
      })
      if (foundUsers.docs.length > 0) {
        await payload.update({
          collection: "users",
          id: foundUsers.docs[0].id,
          data: { password: testOwnerPassword },
        })
      }
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
        expect(data.docs.length).toBeGreaterThan(0)
        const patchRes = await api.patch(`/api/businesses/${data.docs[0].id}`, {
          data: { appearOnNOG: true },
        })
        expect(patchRes.ok(), `Approve PATCH failed: ${patchRes.status()}`).toBeTruthy()

        const usersRes = await api.get(
          `/api/users?where[email][equals]=${encodeURIComponent(testBizEmail)}&limit=1`,
        )
        expect(usersRes.ok()).toBeTruthy()
        const users = await usersRes.json()
        expect(users.docs.length).toBeGreaterThan(0)
        const pwdRes = await api.patch(`/api/users/${users.docs[0].id}`, {
          data: { password: testOwnerPassword },
        })
        expect(pwdRes.ok(), `Set owner password failed: ${pwdRes.status()}`).toBeTruthy()
      } finally {
        await api.dispose()
      }
    }

    // 3. Log into Dashboard with business owner account via /login page UI
    await loginFrontendTenant(page, testBizEmail, testOwnerPassword, { baseURL: nogBaseURL })
    await page.goto(`${nogBaseURL}/dashboard/my-business`)
    await page.waitForLoadState("networkidle")

    // Fill updated details in dashboard form
    const aboutTextarea = page.locator("#biz-about")
    await expect(aboutTextarea).toBeVisible({ timeout: 15000 })
    await aboutTextarea.fill(updatedAbout)

    const addressInput = page.locator("#biz-address")
    await addressInput.fill(updatedAddress)

    // Save profile changes
    const saveBtn = page.getByRole("button", { name: /Save Business Profile/i })
    await saveBtn.click()

    // Assert success banner
    await expect(page.getByText(/Business profile updated successfully!/i)).toBeVisible({
      timeout: 10000,
    })

    // 5. Verify public directory reflects updated address & description
    await page.goto(`${nogBaseURL}/businesses`)
    await page.waitForLoadState("networkidle")

    const bizCard = page.getByRole("button", { name: new RegExp(testBizName, "i") })
    await expect(bizCard).toBeVisible()
    await bizCard.click()

    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("dialog")).toContainText(updatedAbout)
    await expect(page.getByRole("dialog")).toContainText(updatedAddress)

    // 6. Cleanup test business
    if (isLocal) {
      const { getPayload } = await import("payload")
      const config = (await import("../../src/payload.config.js")).default
      const payload = await getPayload({ config })
      await payload.delete({
        collection: "businesses",
        where: { email: { equals: testBizEmail } },
      })
    } else {
      const cleanupCreds = getSuperadminCredentials()
      expect(cleanupCreds).not.toBeNull()
      const api = await createAuthenticatedApiContext(
        nogBaseURL,
        cleanupCreds!.email,
        cleanupCreds!.password,
      )
      try {
        const searchRes = await api.get(
          `/api/businesses?where[email][equals]=${encodeURIComponent(testBizEmail)}`,
        )
        if (searchRes.ok()) {
          const data = await searchRes.json()
          if (data.docs?.length > 0) {
            await api.delete(`/api/businesses/${data.docs[0].id}`)
          }
        }
      } finally {
        await api.dispose()
      }
    }
  })
})
