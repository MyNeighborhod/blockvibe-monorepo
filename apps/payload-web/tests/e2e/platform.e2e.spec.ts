import { test, expect } from "@playwright/test"
import { expectedNogExampleHost, getTenantURL } from "../helpers/tenantUrl"

test.describe("BlockVibe Platform Landing Page E2E Tests", () => {
  test("1. Renders the platform homepage correctly", async ({ page }) => {
    await page.goto("/")

    await expect(page).toHaveTitle(/BlockVibe - Operating System for Neighborhood Associations/i)

    await expect(page.locator("text=One platform for your neighborhood")).toBeVisible()
    await expect(page.locator("text=See BlockVibe in Action")).toBeVisible()
    await expect(page.locator("text=Visit Site")).toBeVisible()

    await expect(page.locator("text=Bring BlockVibe to Your Neighborhood")).toBeVisible()
    await expect(page.locator("label:has-text('Neighborhood / Tenant Name')")).toBeVisible()
    await expect(page.locator("label:has-text('Contact Email')")).toBeVisible()
    await expect(page.locator("label:has-text('Phone Number')")).toBeVisible()
    await expect(page.locator("label:has-text('Full Mailing Address')")).toBeVisible()
  })

  test("2. Displays correct NOG example link dynamically", async ({ page, baseURL }) => {
    await page.goto("/")

    const exampleLink = page.locator("a:has-text('Visit Site')")
    await expect(exampleLink).toBeVisible()

    const href = await exampleLink.getAttribute("href")
    expect(href).toContain(expectedNogExampleHost(baseURL || "http://localhost:3000"))
  })

  test("3. Submits the Space Request Form successfully", async ({ page }) => {
    await page.goto("/")

    await page.fill("input[name='tenantName']", "Test E2E Neighborhood")
    await page.fill("input[name='email']", "e2etest@example.com")
    await page.fill("input[name='phone']", "555-123-4567")
    await page.fill("input[name='address']", "123 Main St, Anytown, IA")

    await page.click("button:has-text('Submit Space Request')")

    await expect(page.locator("text=Request Submitted!")).toBeVisible()
    await expect(
      page.locator("text=Thank you! Your neighborhood request has been submitted successfully."),
    ).toBeVisible()
  })

  test("4. Standard NOG website homepage loads on nog subdomain", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")

    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/")

    await expect(page.locator("text=One platform for your neighborhood")).toBeHidden()
    await expect(page.locator("text=North Of Grand").first()).toBeVisible()

    await context.close()
  })
})
