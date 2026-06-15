import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

function isStaffRole(role: string | null | undefined): boolean {
  return role === "superadmin" || role === "admin" || role === "editor"
}

/**
 * Logs in via the tenant frontend API so the session cookie is stored reliably
 * before full-page navigations (e.g. dashboard access checks).
 */
export async function loginFrontendTenant(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const response = await page.request.post("/api/users/login", {
    data: { email, password },
  })
  expect(response.ok()).toBeTruthy()

  const data = await response.json()
  const destination = isStaffRole(data.user?.role) ? "/dashboard" : "/profile"
  await page.goto(destination)
  await page.waitForURL(`**${destination}`)
}

export interface LoginOptions {
  page: Page
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({ page, user }: LoginOptions): Promise<void> {
  await page.goto("/admin/login")
  await page.waitForLoadState("networkidle")

  const inputs = page.locator("form input:visible")
  await inputs.first().waitFor({ state: "visible" })
  await inputs.nth(0).fill(user.email)
  await inputs.nth(1).fill(user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => {
    const path = url.pathname
    return path === "/admin" || path === "/admin/"
  })

  const dashboardArtifact = page.locator('span[title="Dashboard"]')
  await expect(dashboardArtifact).toBeVisible()
}
