import { test, expect } from "@playwright/test"
import { login } from "../helpers/login"
import "dotenv/config"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Multi-tenant Login and Admin Panel Verification", () => {
  test("NOG Tenant Admin can login and view dashboard controls", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    const email = process.env.TENANT_NOG_USERNAME
    const password = process.env.TENANT_NOG_PASSWORD

    if (!email || !password) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // Attempt login using relative path (resolved against targetBaseURL)
    await login({ page, user: { email, password } })

    // Verify admin panel controls are visible
    const dashboardLink = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardLink).toBeVisible()

    const pagesLink = page.locator('a[href="/admin/collections/pages"]').first()
    await expect(pagesLink).toBeVisible()

    const postsLink = page.locator('a[href="/admin/collections/posts"]').first()
    await expect(postsLink).toBeVisible()

    await context.close()
  })

  test("Beaverdale Tenant Admin can login and view dashboard controls", async ({
    browser,
    baseURL,
  }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "beaverdale")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    const email = process.env.TENANT_BEAVERDALE_USERNAME
    const password = process.env.TENANT_BEAVERDALE_PASSWORD

    if (!email || !password) {
      throw new Error("TENANT_BEAVERDALE_USERNAME or TENANT_BEAVERDALE_PASSWORD not defined in env")
    }

    // Attempt login using relative path (resolved against targetBaseURL)
    await login({ page, user: { email, password } })

    // Verify admin panel controls are visible
    const dashboardLink = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardLink).toBeVisible()

    const pagesLink = page.locator('a[href="/admin/collections/pages"]').first()
    await expect(pagesLink).toBeVisible()

    const postsLink = page.locator('a[href="/admin/collections/posts"]').first()
    await expect(postsLink).toBeVisible()

    await context.close()
  })
})
