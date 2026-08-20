import { test, expect } from "@playwright/test"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Overlay Visual Builder Flow", () => {
  let nogBaseURL: string

  test.beforeAll(async ({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Admin can toggle Overlay Edit mode, add a Call to Action section, edit fields, and save page", async ({
    page,
  }) => {
    const adminEmail = process.env.TENANT_NOG_USERNAME || "eugen8@gmail.com"
    const adminPassword = process.env.TENANT_NOG_PASSWORD || "BlockVibeProdAdmin99!"

    // 1. Log in as Admin
    await page.goto(`${nogBaseURL}/login`)
    await page.fill("input[type='email']", adminEmail)
    await page.fill("input[type='password']", adminPassword)
    await page.click("button[type='submit']")
    await page.waitForURL("**/dashboard")

    // 2. Visit public home page
    await page.goto(`${nogBaseURL}/`)
    await page.waitForLoadState("networkidle")

    // 3. Verify top Floating Overlay Builder Toolbar is present
    const toggleBtn = page.getByRole("button", { name: /Edit Page Overlay/i })
    await expect(toggleBtn).toBeVisible({ timeout: 10000 })

    // 4. Activate Visual Edit Mode
    await toggleBtn.click()
    await expect(page.getByRole("button", { name: /View Page/i })).toBeVisible()

    // 5. Open Add Section modal
    await page.getByRole("button", { name: /Add Section/i }).first().click()
    await expect(page.getByRole("heading", { name: /Add New Section/i })).toBeVisible()

    // 6. Select Call To Action template
    await page.getByRole("button", { name: /Call To Action/i }).first().click()

    // 7. Verify block is added and Inspector Drawer opens
    await expect(page.getByRole("heading", { name: /Edit Block/i })).toBeVisible()

    // 8. Close drawer & Save page
    await page.getByRole("button", { name: /Done Editing/i }).click()
    await page.getByRole("button", { name: /Save Page/i }).click()
    await expect(page.getByText(/Saved successfully!/i)).toBeVisible({ timeout: 10000 })
  })
})
