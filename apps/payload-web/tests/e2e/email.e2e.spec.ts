import { test, expect } from "@playwright/test"
import "dotenv/config"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"
import { expectResidentListed } from "../helpers/emailBroadcaster"
import { getPayload } from "payload"
import config from "../../src/payload.config.js"

test.describe("Email Broadcaster Campaign E2E Flow", () => {
  let nogBaseURL: string

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Admin can log in, select eugen8@gmail.com from resident list, and send broadcast communication", async ({
    browser,
  }) => {
    const isLocal = !isRemoteTestEnv()

    // 0. Local database cleanup before test runs
    if (isLocal) {
      const payload = await getPayload({ config })
      await payload.delete({
        collection: "broadcasts",
        where: {
          subject: { equals: "Important NOG Community Update" },
        },
      })
    }

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
    if (await deselectButton.isVisible()) {
      await deselectButton.click()
    }

    // 4. Select ONLY eugen8@gmail.com
    const targetEmail = "eugen8@gmail.com"
    await expectResidentListed(adminPage, targetEmail)
    const checkbox = adminPage.locator(`input[id="resident-checkbox-${targetEmail}"]`)
    
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

    // 4.5 Select Platform (SES) to ensure local SES/Mailpit delivery path is tested
    await adminPage.locator('input[name="delivery"]').first().check()

    // 5. Compose the communication details
    await adminPage.fill("input[id='broadcast-subject']", "Important NOG Community Update")
    
    // Focus the editor and insert rich text with a small picture (20x20 blue square)
    const editor = adminPage.locator("[id='broadcast-message']")
    await editor.focus()
    await adminPage.evaluate(() => {
      const el = document.getElementById("broadcast-message")
      if (el) {
        el.innerHTML = `
          <p>Hello, this is an <strong>official community announcement</strong> sent via the Email Broadcaster tool to verify our AWS SES delivery flow to residents.</p>
          <p>Here is an embedded picture for verification:</p>
          <img src="https://blockvibe.org/media/northofgrand-badge-color-blue.png" style="max-width: 100px; height: auto; border-radius: 8px; margin: 12px 0; display: block;" alt="Verification Badge" />
          <p>Best regards,<br/>The Neighborhood Board</p>
        `
        // Dispatch input event to trigger React state updates
        el.dispatchEvent(new Event("input", { bubbles: true }))
      }
    })

    // 6. Send communication
    await adminPage.click("button:has-text('Send Communication')")

    // 7. Assert success notification (supports either inline SES or async worker)
    await expect(
      adminPage.locator("text=/Communication sent successfully to 1 residents|Broadcast queued for 1 recipient/i")
    ).toBeVisible()

    // 8. Local database validation (check that broadcast was correctly logged)
    if (isLocal) {
      const payload = await getPayload({ config })
      const broadcastsResult = await payload.find({
        collection: "broadcasts",
        where: {
          subject: { equals: "Important NOG Community Update" },
        },
      })
      expect(broadcastsResult.docs.length).toBe(1)
      const broadcastDoc = broadcastsResult.docs[0]
      expect(broadcastDoc.subject).toBe("Important NOG Community Update")
      expect(broadcastDoc.message).toContain("Hello, this is an <strong>official community announcement</strong>")
      // Check that recipients JSON field contains our target email
      expect(JSON.stringify(broadcastDoc.recipients)).toContain("eugen8@gmail.com")
    }

    await adminContext.close()
  })
})
