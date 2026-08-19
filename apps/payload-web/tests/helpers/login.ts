import type { APIRequestContext, Page } from "@playwright/test"
import { expect, request as playwrightRequest } from "@playwright/test"

function isStaffRole(role: string | null | undefined): boolean {
  return role === "superadmin" || role === "admin" || role === "editor"
}

function resolveOrigin(page: Page, baseURL?: string): string {
  if (baseURL) return new URL(baseURL).origin
  const current = page.url()
  if (current && current.startsWith("http")) return new URL(current).origin
  throw new Error("loginFrontendTenant requires an absolute page URL or baseURL")
}

/**
 * Logs in via the tenant login form so the browser document session cookie is set
 * the same way a real user would (needed for SSR dashboard routes).
 */
export async function loginFrontendTenant(
  page: Page,
  email: string,
  password: string,
  opts?: { baseURL?: string },
): Promise<void> {
  const origin = resolveOrigin(page, opts?.baseURL)
  await page.goto(`${origin}/login`)
  await page.waitForLoadState("domcontentloaded")
  await page.locator('input[type="email"], #email').fill(email)
  await page.locator('input[type="password"], #password').fill(password)
  await page.getByRole("button", { name: /Sign In/i }).click()
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 })
}

/**
 * Authenticated Payload REST context for remote e2e (staging/prod).
 * Prefer this over Playwright's isolated `request` fixture after `page` login —
 * and over assuming `page.request` cookies always authorize collection updates.
 */
export async function createAuthenticatedApiContext(
  baseURL: string,
  email: string,
  password: string,
): Promise<APIRequestContext> {
  const origin = new URL(baseURL).origin
  const ctx = await playwrightRequest.newContext({ baseURL: origin })
  const loginRes = await ctx.post("/api/users/login", {
    data: { email, password },
  })
  if (!loginRes.ok()) {
    console.error(
      `createAuthenticatedApiContext login failed (${loginRes.status()}):`,
      await loginRes.text(),
    )
  }
  expect(loginRes.ok()).toBeTruthy()
  const data = await loginRes.json()
  expect(isStaffRole(data.user?.role)).toBeTruthy()
  return ctx
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
  await page.waitForLoadState("domcontentloaded")

  const inputs = page.locator("form input:visible")
  await inputs.first().waitFor({ state: "visible" })
  await inputs.nth(0).fill(user.email)
  await inputs.nth(1).fill(user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => url.pathname.startsWith("/admin"))
}
