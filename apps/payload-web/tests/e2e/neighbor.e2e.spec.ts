import { test, expect } from "@playwright/test"
import "dotenv/config"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Neighbor User Flow", () => {
  test("John Neighbor can log in via frontend and view their profile & household details", async ({
    browser,
    baseURL,
  }) => {
    // 1. Resolve NOG subdomain URL
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    // 2. Read seeded neighbor credentials from .env
    const email = process.env.TENANT_NOG_NEIGHBOR_USERNAME
    const password = process.env.TENANT_NOG_NEIGHBOR_PASSWORD

    if (!email || !password) {
      throw new Error(
        "TENANT_NOG_NEIGHBOR_USERNAME or TENANT_NOG_NEIGHBOR_PASSWORD not defined in env",
      )
    }

    // 3. Go to frontend login page
    await page.goto("/login")
    await expect(page).toHaveTitle(/Sign In \| BlockVibe/i, { timeout: 30000 })

    // 4. Fill credentials and submit
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // 5. Verify redirection from /dashboard directly to /profile (non-staff redirect)
    await page.waitForURL("**/profile")

    // 6. Verify profile card details are accurate
    const cardTitle = page.locator("h3.font-serif.text-2xl")
    await expect(cardTitle).toHaveText("John Neighbor")

    const emailDisplay = page.locator("text=" + email)
    await expect(emailDisplay).toBeVisible()

    // Verify role, status, and community badge
    await expect(page.locator("text=contributor")).toBeVisible()
    await expect(page.locator("text=approved")).toBeVisible()

    // Neighbor badge should be displayed
    const neighborBadge = page.getByText("Neighbor", { exact: true })
    await expect(neighborBadge).toBeVisible()

    // Household should be displayed
    const householdDisplay = page.locator("text=John & Johanna Household")
    await expect(householdDisplay).toBeVisible()

    // Go to Admin Dashboard button should NOT be visible to standard neighbors
    const adminDashboardButton = page.locator("text=Go to Admin Dashboard")
    await expect(adminDashboardButton).not.toBeVisible()

    await context.close()
  })

  test("Johanna Neighbor can log in via frontend and view their profile & household details", async ({
    browser,
    baseURL,
  }) => {
    // 1. Resolve NOG subdomain URL
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    // 2. Read seeded neighbor credentials from .env
    const email = process.env.TENANT_NOG_NEIGHBOR_JOHANNA_USERNAME
    const password = process.env.TENANT_NOG_NEIGHBOR_JOHANNA_PASSWORD

    if (!email || !password) {
      throw new Error(
        "TENANT_NOG_NEIGHBOR_JOHANNA_USERNAME or TENANT_NOG_NEIGHBOR_JOHANNA_PASSWORD not defined in env",
      )
    }

    // 3. Go to frontend login page
    await page.goto("/login")
    await expect(page).toHaveTitle(/Sign In \| BlockVibe/i, { timeout: 30000 })

    // 4. Fill credentials and submit
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // 5. Verify redirection from /dashboard directly to /profile (non-staff redirect)
    await page.waitForURL("**/profile")

    // 6. Verify profile card details are accurate
    const cardTitle = page.locator("h3.font-serif.text-2xl")
    await expect(cardTitle).toHaveText("Johanna Neighbor")

    const emailDisplay = page.locator("text=" + email)
    await expect(emailDisplay).toBeVisible()

    // Verify role, status, and community badge
    await expect(page.locator("text=contributor")).toBeVisible()
    await expect(page.locator("text=approved")).toBeVisible()

    // Neighbor badge should be displayed
    const neighborBadge = page.getByText("Neighbor", { exact: true })
    await expect(neighborBadge).toBeVisible()

    // Household should be displayed
    const householdDisplay = page.locator("text=John & Johanna Household")
    await expect(householdDisplay).toBeVisible()

    // Go to Admin Dashboard button should NOT be visible to standard neighbors
    const adminDashboardButton = page.locator("text=Go to Admin Dashboard")
    await expect(adminDashboardButton).not.toBeVisible()

    await context.close()
  })
})
