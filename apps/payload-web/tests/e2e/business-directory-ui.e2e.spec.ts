import { test, expect } from "@playwright/test"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Business Directory UI smoke", () => {
  test("NOG directory renders Avenues-style filters and cards", async ({ page, baseURL }) => {
    const nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    await page.goto(`${nogBaseURL}/businesses`)

    await expect(page.getByRole("heading", { name: /Businesses of North Of Grand/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Add your business/i })).toBeVisible()
    await expect(page.getByRole("button", { name: "All" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Food & Drink", exact: true })).toBeVisible()

    // Demo seed or any approved listing
    const card = page.locator("h3").first()
    await expect(card).toBeVisible()
    await card.click()
    await expect(page.locator("article h2").first()).toBeVisible()
    await page.locator("article").getByRole("button", { name: "Close" }).click()

    await expect(page.locator('a.nav-link[href="/businesses"]').first()).toBeVisible()
  })
})
