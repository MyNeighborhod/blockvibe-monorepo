import { test, expect, Page } from "@playwright/test"
import { login } from "../helpers/login"
import { seedTestUser, cleanupTestUser, testUser } from "../helpers/seedUser"
import { isRemoteTestEnv } from "../helpers/tenantUrl"
import { getSuperadminCredentials } from "../helpers/testCredentials"

test.describe("Payment Settings Admin E2E Workflow", () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(120000)

    const superadmin = isRemoteTestEnv() ? getSuperadminCredentials() : null
    if (isRemoteTestEnv() && !superadmin) {
      testInfo.skip(
        true,
        "Set TEST_USER_EMAIL/TEST_USER_PASSWORD or LOCAL_SUPERADMIN_USERNAME/LOCAL_SUPERADMIN_PASSWORD for remote admin tests",
      )
      return
    }

    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    const email = superadmin?.email ?? process.env.TEST_USER_EMAIL ?? testUser.email
    const password = superadmin?.password ?? process.env.TEST_USER_PASSWORD ?? testUser.password
    await login({ page, user: { email, password } })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test("allows admin to configure payment support email, verifies public page updates, and restores DB clean state", async () => {
    const testSupportEmail = `e2e-support-${Date.now()}@blockvibe.org`
    const originalEmail = "northofgrandpresident@gmail.com"

    // 1. Navigate to Payment Settings Global in Admin
    await page.goto("/admin/globals/payment-settings")
    await page.waitForLoadState("networkidle")

    // Locate paymentSupportEmail input field
    const emailInput = page.locator('input[name="paymentSupportEmail"]')
    await expect(emailInput).toBeVisible({ timeout: 15000 })

    // Fill in test support email
    await emailInput.fill(testSupportEmail)

    // Click Save
    const saveButton = page.locator('button:has-text("Save"), button#action-save').first()
    await saveButton.click()

    // Wait for save confirmation Toast or URL
    await page.waitForTimeout(2000)

    try {
      // 2. Navigate to public signup page and verify dynamic setting
      await page.goto("/membership/signup")
      await page.waitForLoadState("networkidle")

      // Verify the updated test email appears on public frontend
      const emailLink = page.locator(`a[href="mailto:${testSupportEmail}"]`)
      await expect(emailLink).toBeVisible({ timeout: 15000 })
      await expect(emailLink).toContainText(testSupportEmail)
    } finally {
      // 3. Cleanup: Restore original payment support email to leave DB clean
      await page.goto("/admin/globals/payment-settings")
      await page.waitForLoadState("networkidle")

      const cleanupEmailInput = page.locator('input[name="paymentSupportEmail"]')
      await expect(cleanupEmailInput).toBeVisible({ timeout: 15000 })
      await cleanupEmailInput.fill(originalEmail)

      const cleanupSaveButton = page.locator('button:has-text("Save"), button#action-save').first()
      await cleanupSaveButton.click()
      await page.waitForTimeout(2000)
    }
  })
})
