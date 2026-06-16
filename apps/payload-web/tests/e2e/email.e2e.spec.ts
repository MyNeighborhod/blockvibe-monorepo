import { test, expect } from "@playwright/test"
import "dotenv/config"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Email Broadcaster Campaign E2E Flow", () => {
  let nogBaseURL: string

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Admin can log in, select eugen8@gmail.com from resident list, and send broadcast communication", async ({
    browser,
  }) => {
    const adminContext = await browser.newContext({ baseURL: nogBaseURL })
    const adminPage = await adminContext.newPage()

    const adminEmail = process.env.TENANT_NOG_USERNAME
    const adminPassword = process.env.TENANT_NOG_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // 1. Log in as NOG Admin
    await adminPage.goto("/login")
    await adminPage.fill("input[type='email']", adminEmail)
    await adminPage.fill("input[type='password']", adminPassword)
    await adminPage.click("button[type='submit']")
    await adminPage.waitForURL("**/dashboard")

    // 2. Navigate to Email Broadcaster
    await adminPage.click("a:has-text('Email Broadcaster')")
    await adminPage.waitForURL("**/dashboard/email")
    await expect(adminPage.locator("h1:has-text('Email Broadcaster')")).toBeVisible()

    // 3. Clear existing selections (Deselect All)
    const deselectButton = adminPage.locator("button:has-text('Deselect All')")
    // If Deselect All is visible/present, click it. If only Select All is shown, no action needed or click it depending on state.
    // Let's click 'Deselect All' if it's there.
    if (await deselectButton.isVisible()) {
      await deselectButton.click()
    }

    // 4. Select ONLY eugen8@gmail.com
    const targetEmail = "eugen8@gmail.com"
    const checkbox = adminPage.locator(`input[id="resident-checkbox-${targetEmail}"]`)
    await expect(checkbox).toBeVisible()
    
    // Ensure it is checked
    if (!(await checkbox.isChecked())) {
      await checkbox.check()
    }

    // Ensure other checkboxes (like john or johanna neighbor) are unchecked
    const otherCheckboxes = adminPage.locator("input[type='checkbox']").and(adminPage.locator(`:not([id="resident-checkbox-${targetEmail}"])`))
    const count = await otherCheckboxes.count()
    for (let i = 0; i < count; i++) {
      const cb = otherCheckboxes.nth(i)
      if (await cb.isChecked()) {
        await cb.uncheck()
      }
    }

    // 5. Compose the communication details
    await adminPage.fill("input[id='broadcast-subject']", "Important NOG Community Update")
    await adminPage.fill(
      "textarea[id='broadcast-message']",
      "Hello, this is an official community announcement sent via the Email Broadcaster tool to verify our AWS SES delivery flow to residents."
    )

    // 6. Send communication
    await adminPage.click("button:has-text('Send Communication')")

    // 7. Assert success notification
    await expect(
      adminPage.locator("text=/Communication sent successfully to 1 residents/i")
    ).toBeVisible()

    await adminContext.close()
  })
})
