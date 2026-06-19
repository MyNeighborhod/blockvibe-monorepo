import { test, expect } from "@playwright/test"
import "dotenv/config"
import { loginFrontendTenant } from "../helpers/login"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Frontend Tenant Dashboard & Auth E2E Tests", () => {
  let nogBaseURL: string

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("1. Unauthenticated users are redirected to login", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    // Go to dashboard - should redirect to /login
    await page.goto("/dashboard")
    await page.waitForURL("**/login")

    // Assert login card elements are visible
    await expect(page.locator("text=Welcome back")).toBeVisible()
    await expect(page.locator("button[type='submit']")).toBeVisible()

    await context.close()
  })

  test("2. Tenant Admin can login, view dashboard shell, and navigate sub-routes", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    const email = process.env.TENANT_NOG_USERNAME
    const password = process.env.TENANT_NOG_PASSWORD

    if (!email || !password) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // Navigate to login page
    await page.goto("/login")
    await page.fill("input[type='email']", email)
    await page.fill("input[type='password']", password)
    await page.click("button[type='submit']")

    // Check we landed on dashboard
    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Welcome to the")).toBeVisible()

    // Assert Sidebar navigation links exist
    await expect(page.locator("a:has-text('Overview')")).toBeVisible()
    await expect(page.locator("a:has-text('Directory (CRM)')")).toBeVisible()
    await expect(page.locator("a:has-text('Email Broadcaster')")).toBeVisible()
    await expect(page.locator("a:has-text('Voting & Polls')")).toBeVisible()
    await expect(page.locator("a:has-text('Fundraising Status')")).toBeVisible()
    await expect(page.locator("a:has-text('Settings')")).toBeVisible()

    // Assert Navbar contains logout
    await expect(page.locator("button:has-text('Sign Out')")).toBeVisible()

    // Navigate to CRM Stub
    await page.click("a:has-text('Directory (CRM)')")
    await page.waitForURL("**/dashboard/crm")
    await expect(page.locator("h1:has-text('Resident Directory')")).toBeVisible()
    await expect(page.locator("text=CRM Feature Coming Soon")).toBeVisible()

    // Navigate to Email Stub
    await page.click("a:has-text('Email Broadcaster')")
    await page.waitForURL("**/dashboard/email")
    await expect(page.locator("h1:has-text('Email Broadcaster')")).toBeVisible()

    // Navigate to Voting Stub
    await page.click("a:has-text('Voting & Polls')")
    await page.waitForURL("**/dashboard/votes")
    await expect(page.locator("h1:has-text('Voting & Polls')")).toBeVisible()

    await context.close()
  })

  test("3. Self-registration staging flow (new user is pending and blocked)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    // Unique email for this run
    const testEmail = `test_${Date.now()}@example.com`
    const testPassword = "TestPassword123!"

    // Navigate to Register
    await page.goto("/register")
    await page.fill("input[placeholder='Jane Doe']", "Playwright Test User")
    await page.fill("input[type='email']", testEmail)
    await page.fill("input[type='password']", testPassword)
    await page.click("button[type='submit']")

    // Verify success screen
    await page.waitForSelector("text=Registration Successful!")
    await expect(page.locator("text=staging area")).toBeVisible()

    // Click Return to Sign In
    await page.click("text=Return to Sign In")
    await page.waitForURL("**/login")

    // Try logging in with the newly created pending user
    await page.fill("input[type='email']", testEmail)
    await page.fill("input[type='password']", testPassword)
    await page.click("button[type='submit']")

    // Check we get blocked and redirected/notified
    await expect(page.locator("text=pending approval by the neighborhood board")).toBeVisible()

    await context.close()
  })

  test("4. Logging out deletes session and blocks dashboard access", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    const email = process.env.TENANT_NOG_USERNAME
    const password = process.env.TENANT_NOG_PASSWORD

    // Login
    await page.goto("/login")
    await page.fill("input[type='email']", email!)
    await page.fill("input[type='password']", password!)
    await page.click("button[type='submit']")
    await page.waitForURL("**/dashboard")

    // Click logout
    await page.click("button:has-text('Sign Out')")
    await page.waitForURL("**/login")

    // Attempt to access dashboard again - should redirect to login
    await page.goto("/dashboard")
    await page.waitForURL("**/login")

    await context.close()
  })

  test("5. Editor cannot see or access fundraising and settings/support", async ({
    browser,
    baseURL,
  }) => {
    // twin-suns has seeded editor user: editor@twin-suns.blockvibe.org / editor1234
    const twinSunsBaseURL = getTenantURL(baseURL || "http://localhost:3000", "twin-suns")
    const context = await browser.newContext({ baseURL: twinSunsBaseURL })
    const page = await context.newPage()

    // Login as editor
    await page.goto("/login")
    await page.fill("input[type='email']", "editor@twin-suns.blockvibe.org")
    await page.fill("input[type='password']", "editor1234")
    await page.click("button[type='submit']")

    // Check we landed on dashboard
    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Welcome to the")).toBeVisible()

    // Assert Sidebar navigation links exist for Overview, Directory
    await expect(page.locator("a:has-text('Overview')")).toBeVisible()
    await expect(page.locator("a:has-text('Directory (CRM)')")).toBeVisible()

    // Assert "Email Broadcaster", "Voting & Polls", "Fundraising Status", and "Settings" do NOT exist in sidebar
    await expect(page.locator("a:has-text('Email Broadcaster')")).toBeHidden()
    await expect(page.locator("a:has-text('Voting & Polls')")).toBeHidden()
    await expect(page.locator("a:has-text('Fundraising Status')")).toBeHidden()
    await expect(page.locator("a:has-text('Settings')")).toBeHidden()

    // Attempt to navigate directly to /dashboard/email - should redirect back to /dashboard
    await page.goto("/dashboard/email")
    await page.waitForURL("**/dashboard")
    await expect(page.locator("a:has-text('Email Broadcaster')")).toBeHidden()

    // Attempt to navigate directly to /dashboard/votes - should redirect back to /dashboard
    await page.goto("/dashboard/votes")
    await page.waitForURL("**/dashboard")
    await expect(page.locator("a:has-text('Voting & Polls')")).toBeHidden()

    // Attempt to navigate directly to /dashboard/fundraising - should redirect back to /dashboard
    await page.goto("/dashboard/fundraising")
    await page.waitForURL("**/dashboard")
    await expect(page.locator("a:has-text('Fundraising Status')")).toBeHidden()

    // Attempt to navigate directly to /dashboard/settings - should redirect back to /dashboard
    await page.goto("/dashboard/settings")
    await page.waitForURL("**/dashboard")
    await expect(page.locator("a:has-text('Settings')")).toBeHidden()

    await context.close()
  })

  test("6. Contributor is redirected to profile and cannot access dashboard", async ({
    browser,
    baseURL,
  }) => {
    // twin-suns has seeded contributor user: contributor@twin-suns.blockvibe.org / contrib1234
    const twinSunsBaseURL = getTenantURL(baseURL || "http://localhost:3000", "twin-suns")
    const context = await browser.newContext({ baseURL: twinSunsBaseURL })
    const page = await context.newPage()

    await loginFrontendTenant(page, "contributor@twin-suns.blockvibe.org", "contrib1234")
    await expect(page.locator("text=Twin Suns Contributor").first()).toBeVisible()
    await expect(page.getByText("contributor", { exact: true })).toBeVisible()
    await expect(page.getByText("Neighbor", { exact: true })).toBeVisible()

    // Attempt to navigate directly to /dashboard - should redirect back to /profile
    await page.goto("/dashboard")
    await page.waitForURL("**/profile")

    // Attempt to navigate directly to /dashboard/crm - should redirect back to /profile
    await page.goto("/dashboard/crm")
    await page.waitForURL("**/profile")

    // Attempt to navigate directly to /dashboard/votes - should redirect back to /profile
    await page.goto("/dashboard/votes")
    await page.waitForURL("**/profile")

    // Attempt to navigate directly to /dashboard/fundraising - should redirect back to /profile
    await page.goto("/dashboard/fundraising")
    await page.waitForURL("**/profile")

    // Attempt to navigate directly to /dashboard/settings - should redirect back to /profile
    await page.goto("/dashboard/settings")
    await page.waitForURL("**/profile")

    await context.close()
  })

  test("7. Contributor can login and see their own profile page directly", async ({
    browser,
    baseURL,
  }) => {
    const twinSunsBaseURL = getTenantURL(baseURL || "http://localhost:3000", "twin-suns")
    const context = await browser.newContext({ baseURL: twinSunsBaseURL })
    const page = await context.newPage()

    // Login as contributor
    await page.goto("/login")
    await page.fill("input[type='email']", "contributor@twin-suns.blockvibe.org")
    await page.fill("input[type='password']", "contrib1234")
    await page.click("button[type='submit']")

    // Check we landed on profile page
    await page.waitForURL("**/profile")
    await expect(page.locator("text=Twin Suns Contributor").first()).toBeVisible()
    await expect(page.getByText("contributor", { exact: true })).toBeVisible()
    await expect(page.getByText("Neighbor", { exact: true })).toBeVisible()

    // Assert that the Admin Dashboard link is NOT visible for contributors
    await expect(page.locator("text=Go to Admin Dashboard")).toBeHidden()

    await context.close()
  })

  test("8. NOG Admin can login, navigate to profile page, see details, and return to dashboard", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    const email = process.env.TENANT_NOG_USERNAME
    const password = process.env.TENANT_NOG_PASSWORD

    if (!email || !password) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // Login as NOG Admin
    await page.goto("/login")
    await page.fill("input[type='email']", email)
    await page.fill("input[type='password']", password)
    await page.click("button[type='submit']")

    // Should land on dashboard
    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Welcome to the")).toBeVisible()

    // Navigate to profile page
    await page.goto("/profile")
    await page.waitForURL("**/profile")

    // Assert profile page elements
    await expect(page.locator("text=NOG Admin").first()).toBeVisible()
    await expect(page.getByText("admin", { exact: true })).toBeVisible()
    await expect(page.getByText("Neighbor", { exact: true })).toBeVisible()

    // Assert that the Go to Admin Dashboard link is visible and clickable
    const dashboardLink = page.locator("text=Go to Admin Dashboard")
    await expect(dashboardLink).toBeVisible()
    await dashboardLink.click()

    // Assert we returned to dashboard
    await page.waitForURL("**/dashboard")

    await context.close()
  })
})
