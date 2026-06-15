import { test, expect, Page } from "@playwright/test"
import { login } from "../helpers/login"
import { seedTestUser, cleanupTestUser, testUser } from "../helpers/seedUser"
import { isRemoteTestEnv } from "../helpers/tenantUrl"
import { getSuperadminCredentials } from "../helpers/testCredentials"

test.describe("Admin Panel", () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(120000)

    const superadmin = isRemoteTestEnv() ? getSuperadminCredentials() : null
    if (isRemoteTestEnv() && !superadmin) {
      testInfo.skip(
        true,
        "Set TEST_USER_EMAIL/TEST_USER_PASSWORD or LOCAL_SUPERADMIN_USERNAME/LOCAL_SUPERADMIN_PASSWORD for production admin tests",
      )
      return
    }

    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    const email = superadmin?.email ?? process.env.TEST_USER_EMAIL ?? testUser.email
    const password = superadmin?.password ?? process.env.TEST_USER_PASSWORD ?? testUser.password
    await login({ page, user: { email, password } })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test("can navigate to dashboard", async () => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/admin(\/)?$/)
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test("can navigate to list view", async () => {
    await page.goto("/admin/collections/users")
    await expect(page).toHaveURL(/\/admin\/collections\/users/)
    const listViewArtifact = page.locator("h1", { hasText: "Users" }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test("can navigate to edit view", async () => {
    await page.goto("/admin/collections/pages/create")
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
