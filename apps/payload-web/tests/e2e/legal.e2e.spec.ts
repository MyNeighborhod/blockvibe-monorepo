import { test, expect } from "@playwright/test"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Legal Pages (Terms of Service & Privacy Policy)", () => {
  test("can load Terms of Service on the default platform domain", async ({ page }) => {
    await page.goto("/terms")
    await expect(page).toHaveTitle(/Terms of Service \| BlockVibe/)

    // Check that the title heading renders from the TSX file
    const mainHeading = page.locator("h1")
    await expect(mainHeading).toHaveText("Terms of Service")

    // Check that sections rendered from terms.md are present
    const firstSectionHeading = page.locator("h2").first()
    await expect(firstSectionHeading).toHaveText("1. Legal Entity & Binding Agreement")

    // Check transactional email policy and platform rules
    const termsBody = page.locator("body")
    await expect(termsBody).toContainText("Email Communications — Transactional Use Only")
    await expect(termsBody).toContainText("Invite-only contacts")
    await expect(termsBody).toContainText("Platform Sponsored Messages")
  })

  test("can load Privacy Policy on the default platform domain", async ({ page }) => {
    await page.goto("/privacy")
    await expect(page).toHaveTitle(/Privacy Policy \| BlockVibe/)

    const mainHeading = page.locator("h1")
    await expect(mainHeading).toHaveText("Privacy Policy")

    const firstSectionHeading = page.locator("h2").first()
    await expect(firstSectionHeading).toHaveText("1. Information We Collect")

    // Check transactional email policy reference
    const privacyBody = page.locator("body")
    await expect(privacyBody).toContainText("Amazon SNS webhooks")
    await expect(privacyBody).toContainText("transactional email")
  })

  test("returns 404 for Terms of Service on a neighborhood subdomain (e.g., NOG)", async ({
    browser,
    baseURL,
  }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    const response = await page.goto("/terms")
    expect(response?.status()).toBe(404)

    await context.close()
  })

  test("returns 404 for Privacy Policy on a neighborhood subdomain (e.g., NOG)", async ({
    browser,
    baseURL,
  }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    const response = await page.goto("/privacy")
    expect(response?.status()).toBe(404)

    await context.close()
  })
})
