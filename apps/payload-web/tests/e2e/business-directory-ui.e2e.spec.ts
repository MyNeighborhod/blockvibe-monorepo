import { test, expect } from "@playwright/test"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Business Directory UI smoke", () => {
  test("NOG directory renders filters and opens dedicated business pages", async ({ page, baseURL }) => {
    const nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    await page.goto(`${nogBaseURL}/businesses`)

    await expect(page.getByRole("heading", { name: /Businesses of North Of Grand/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Add your business/i })).toBeVisible()
    await expect(page.getByRole("button", { name: "All" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Food & Drink", exact: true })).toBeVisible()

    const card = page.locator("a[href^='/businesses/']").filter({ has: page.locator("h3") }).first()
    await expect(card).toBeVisible()
    const href = await card.getAttribute("href")
    expect(href).toMatch(/^\/businesses\/[^/?]+/)
    await card.click()
    await page.waitForURL(/\/businesses\/[^/]+$/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("link", { name: /All businesses/i })).toBeVisible()

    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator('a.nav-link[href="/businesses"]').first()).toBeVisible()
  })
})
