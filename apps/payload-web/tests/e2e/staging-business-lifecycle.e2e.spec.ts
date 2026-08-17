import { test, expect } from "@playwright/test"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getTenantURL } from "../helpers/tenantUrl"
import { getSuperadminCredentials } from "../helpers/testCredentials"
import { loginFrontendTenant } from "../helpers/login"

test.describe("Staging & Local Business Lifecycle (Add, View, Remove)", () => {
  let nogBaseURL: string
  const timestamp = Date.now()
  const testBizName = `E2E Test Bakery - ${timestamp}`
  const testBizEmail = `e2e-bakery-${timestamp}@example.com`
  const mockLogoPath = path.join("/tmp", `test-logo-${timestamp}.png`)

  test.beforeAll(async ({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")

    // Create temporary 1x1 png image for logo upload test
    fs.writeFileSync(
      mockLogoPath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      ),
    )
  })

  test.afterAll(async () => {
    if (fs.existsSync(mockLogoPath)) {
      fs.unlinkSync(mockLogoPath)
    }
  })

  test("Complete lifecycle: register business -> approve & view -> remove business", async ({
    page,
    request,
  }) => {
    // 1. Go to public businesses page
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    // 2. Open "Add your business" modal & fill registration form
    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    // Fill form fields using element IDs
    await page.fill("#name", testBizName)
    await page.fill("#address", "1234 Grand Ave, Des Moines, IA")
    await page.fill("#email", testBizEmail)
    await page.fill("#about", "Freshly baked artisan pastries and coffee in North of Grand.")

    // Upload cover image & logo if present
    const coverInput = page.locator("#cover")
    if (await coverInput.count() > 0) {
      await coverInput.setInputFiles(mockLogoPath)
    }
    const logoInput = page.locator("#logo")
    if (await logoInput.count() > 0) {
      await logoInput.setInputFiles(mockLogoPath)
    }

    // Submit form
    const submitBtn = page.getByRole("button", { name: /Submit business/i })
    await submitBtn.click()

    // Expect success message
    await expect(page.getByText(/listing was submitted/i)).toBeVisible({ timeout: 15000 })

    // 3. Login as Admin & approve business
    const creds = getSuperadminCredentials()
    if (creds) {
      await loginFrontendTenant(page, creds.email, creds.password)

      // Fetch pending businesses via API and approve
      const searchRes = await request.get(`${nogBaseURL}/api/businesses?where[email][equals]=${testBizEmail}`)
      if (searchRes.ok()) {
        const data = await searchRes.json()
        if (data.docs && data.docs.length > 0) {
          const bizId = data.docs[0].id
          await request.patch(`${nogBaseURL}/api/businesses/${bizId}`, {
            data: { appearOnNOG: true },
          })
        }
      }
    }

    // 4. Go back to public directory and verify business appears & drawer opens
    await page.goto(`${nogBaseURL}/businesses`)
    await page.waitForLoadState("networkidle")

    const bizCard = page.getByRole("button", { name: new RegExp(testBizName, "i") })
    await expect(bizCard).toBeVisible({ timeout: 10000 })

    // Click card to open detail drawer
    await bizCard.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("dialog")).toContainText(testBizName)
    await expect(page.getByRole("dialog")).toContainText("1234 Grand Ave")

    // Close detail drawer
    const closeBtn = page.getByRole("dialog").getByRole("button").first()
    await closeBtn.click()

    // 5. Delete (remove) business
    if (creds) {
      const searchRes = await request.get(`${nogBaseURL}/api/businesses?where[email][equals]=${testBizEmail}`)
      if (searchRes.ok()) {
        const data = await searchRes.json()
        if (data.docs && data.docs.length > 0) {
          const bizId = data.docs[0].id
          const delRes = await request.delete(`${nogBaseURL}/api/businesses/${bizId}`)
          expect(delRes.ok()).toBeTruthy()
        }
      }
    }

    // 6. Reload businesses page & verify business was removed
    await page.goto(`${nogBaseURL}/businesses`)
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("button", { name: new RegExp(testBizName, "i") })).not.toBeVisible()
  })
})
