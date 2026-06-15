import { test, expect } from "@playwright/test"
import "dotenv/config"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("User Invite & Acceptance Staging Flow E2E (Failing TDD Spec)", () => {
  let nogBaseURL: string

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Admin can send invite, user can accept it and access their profile", async ({
    browser,
  }) => {
    // ==========================================
    // Phase 1: Tenant Admin logs in and sends invite
    // ==========================================
    const adminContext = await browser.newContext({ baseURL: nogBaseURL })
    const adminPage = await adminContext.newPage()

    const adminEmail = process.env.TENANT_NOG_USERNAME
    const adminPassword = process.env.TENANT_NOG_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // Login as Admin
    await adminPage.goto("/login")
    await adminPage.fill("input[type='email']", adminEmail)
    await adminPage.fill("input[type='password']", adminPassword)
    await adminPage.click("button[type='submit']")
    await adminPage.waitForURL("**/dashboard")

    // Go to Directory/CRM
    await adminPage.click("a:has-text('Directory (CRM)')")
    await adminPage.waitForURL("**/dashboard/crm")

    // Click "Invite Resident" button to open the invite form/modal
    await adminPage.click("button:has-text('Invite Resident')")

    // Fill in invite details
    const inviteeName = "Invited Resident"
    const inviteeEmail = `invited_${Date.now()}@example.com`
    await adminPage.fill("input[name='inviteName']", inviteeName)
    await adminPage.fill("input[name='inviteEmail']", inviteeEmail)

    // Click Send Invite (Triggers SES delivery & invites db record creation)
    await adminPage.click("button:has-text('Send Invite')")

    // Assert success notification
    await expect(adminPage.locator("text=/Invite sent successfully/i")).toBeVisible()
    await adminContext.close()

    // ==========================================
    // Phase 2: Retrieve Invite URL from database/API
    // ==========================================
    // We query the mock/real invites API to get the token created for the inviteeEmail
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    const invitesResponse = await page.request.get(
      `/api/invites?where[email][equals]=${inviteeEmail}`,
    )
    expect(invitesResponse.ok()).toBe(true)
    const invitesData = await invitesResponse.json()

    expect(invitesData.docs).toBeDefined()
    expect(invitesData.docs.length).toBeGreaterThan(0)
    const inviteToken = invitesData.docs[0].token

    // ==========================================
    // Phase 3: Invitee accepts the invite
    // ==========================================
    // Navigate to the invite acceptance URL
    await page.goto(`/invite?token=${inviteToken}`)

    // Assert the email input is pre-populated and read-only/disabled
    const emailInput = page.locator("input[type='email']")
    if (!(await emailInput.isVisible())) {
      console.log("INVITE PAGE FAILED TO LOAD FORM. BODY INNER TEXT:")
      console.log(await page.locator("body").innerText())
    }
    await expect(emailInput).toHaveValue(inviteeEmail)
    await expect(emailInput).toBeDisabled() // or haveAttribute('readonly')

    // Enter details and submit password
    await page.fill("input[name='name']", inviteeName)
    await page.fill("input[name='password']", "SecureInvPass123!")
    await page.click("button[type='submit']")

    // Check redirection to dashboard/profile
    await page.waitForURL("**/profile")

    // Assert new user is logged in and sees their profile details
    await expect(page.locator(`text=${inviteeName}`).first()).toBeVisible()
    await expect(page.getByText("contributor", { exact: true })).toBeVisible()
    await expect(page.getByText("Neighbor", { exact: true })).toBeVisible()

    await context.close()
  })
})
