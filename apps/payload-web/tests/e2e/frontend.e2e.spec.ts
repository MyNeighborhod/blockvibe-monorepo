import { test, expect } from "@playwright/test"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Frontend", () => {
  test("can load homepage", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/BlockVibe/i)
    const heading = page.locator("h1").first()
    await expect(heading).toHaveText("One platform for your neighborhood")
  })

  test("can load NOG tenant homepage", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/")
    await expect(page).toHaveTitle(/North Of Grand/i)

    // Verify header is present
    const header = page.locator("header").first()
    await expect(header).toBeVisible()

    await context.close()
  })

  test("renders data-live-preview-path attributes for visual page building", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/")
    await expect(page).toHaveTitle(/North Of Grand/i)

    // Verify that the layout content block exists and has the live preview path attribute
    const block = page.locator('[data-live-preview-path="layout.0"]')
    await expect(block).toBeVisible()

    // Verify that a column inside layout block 0 has the live preview path attribute
    const column = page.locator('[data-live-preview-path="layout.0.columns.0"]')
    await expect(column).toBeVisible()

    await context.close()
  })
})
