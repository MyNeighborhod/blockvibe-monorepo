import { test, expect } from "@playwright/test"
import path from "path"
import fs from "fs"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"
import { getSuperadminCredentials } from "../helpers/testCredentials"
import { loginFrontendTenant } from "../helpers/login"

test.describe("Business CRM Ingestion & Owner Password Management E2E", () => {
  let nogBaseURL: string
  const mockLogoPath = path.resolve(process.cwd(), "tests/fixtures/test-logo.png")

  test.beforeAll(() => {
    const dir = path.dirname(mockLogoPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(mockLogoPath)) {
      const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      fs.writeFileSync(mockLogoPath, Buffer.from(pngBase64, "base64"))
    }
  })

  test.beforeEach(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Approved business email syncs to CRM & Owner can set password & request reset link", async ({
    page,
    request,
  }) => {
    const timestamp = Date.now()
    const testBizName = `CRM Biz ${timestamp}`
    const testBizEmail = `crm-owner-${timestamp}@example.com`
    const initialPassword = `InitialPassword123!`
    const updatedPassword = `UpdatedPassword456!`

    // 1. Register business on public site
    await page.goto(`${nogBaseURL}/businesses`)
    await page.waitForLoadState("networkidle")
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addBtn = page.getByRole("button", { name: /Add your business/i })
    await expect(addBtn).toBeVisible({ timeout: 15000 })
    await addBtn.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible({ timeout: 15000 })

    await page.locator("#name").fill(testBizName)
    await page.locator("#email").fill(testBizEmail)
    await page.locator("#about").fill("Comprehensive CRM and password management test business listing.")
    await page.locator("#address").fill("100 CRM Plaza, Des Moines, IA")

    const logoInput = page.locator("#logo")
    if ((await logoInput.count()) > 0) {
      await logoInput.setInputFiles(mockLogoPath)
    }

    const submitBtn = page.getByRole("button", { name: /Submit business/i })
    await submitBtn.click()

    await expect(
      page.getByText(/Thanks! Your listing was submitted/i),
    ).toBeVisible({ timeout: 15000 })

    // 2. Approve business & set known initial password for test
    const isLocal = !isRemoteTestEnv()
    let payload: any = null
    let numericTenantId = 1

    if (isLocal) {
      const { getPayload } = await import("payload")
      const config = (await import("../../src/payload.config.js")).default
      payload = await getPayload({ config })

      const nogTenantDocs = await payload.find({
        collection: "tenants",
        where: { slug: { equals: "nog" } },
      })
      numericTenantId = nogTenantDocs.docs[0].id

      // Find business created above
      const found = await payload.find({
        collection: "businesses",
        where: { email: { equals: testBizEmail } },
      })

      if (found.docs.length > 0) {
        await payload.update({
          collection: "businesses",
          id: found.docs[0].id,
          data: { appearOnNOG: true },
          overrideAccess: true,
        })
      }

      // Set password on the user doc so we can test logging in
      const foundUsers = await payload.find({
        collection: "users",
        where: { email: { equals: testBizEmail } },
      })
      if (foundUsers.docs.length > 0) {
        await payload.update({
          collection: "users",
          id: foundUsers.docs[0].id,
          data: { password: initialPassword, status: "approved", memberType: "business" },
          overrideAccess: true,
        })
      }
    }

    // 3. Verify business contact is ingested & visible in CRM directory
    if (isLocal && payload) {
      const testAdminEmail = `admin-pwd-${timestamp}@example.com`
      const testAdminPassword = `AdminPassword123!`

      await payload.create({
        collection: "users",
        data: {
          email: testAdminEmail,
          password: testAdminPassword,
          name: "Test Admin Pwd",
          role: "superadmin",
          status: "approved",
          memberType: "residential",
          tenants: [{ tenant: numericTenantId }],
        },
        overrideAccess: true,
      })

      await page.goto(`${nogBaseURL}/login`)
      await page.waitForLoadState("domcontentloaded")
      await page.locator('input[type="email"], #email').fill(testAdminEmail)
      await page.locator('input[type="password"], #password').fill(testAdminPassword)
      await page.getByRole("button", { name: /Sign In/i }).click()
      await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 15000 })

      await page.goto(`${nogBaseURL}/dashboard/crm`)
      await page.waitForLoadState("networkidle")
      await expect(page.locator(`text=${testBizEmail}`)).toBeVisible({ timeout: 15000 })
    }

    // 4. Log in as Business Owner & update password on Dashboard Profile
    await page.goto(`${nogBaseURL}/login`)
    await page.waitForLoadState("networkidle")
    await page.fill("#email", testBizEmail)
    await page.fill("#password", initialPassword)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 15000 })
    await page.goto(`${nogBaseURL}/dashboard/my-business`)
    await page.waitForLoadState("networkidle")

    const newPwdInput = page.locator("#new-password")
    await expect(newPwdInput).toBeVisible({ timeout: 15000 })
    await newPwdInput.fill(updatedPassword)
    await page.locator("#confirm-new-password").fill(updatedPassword)

    const updatePwdBtn = page.getByRole("button", { name: /Update Account Password/i })
    await updatePwdBtn.click()

    await expect(page.getByText(/Password updated successfully!/i)).toBeVisible({ timeout: 15000 })

    // 5. Verify Business Owner can log out and sign in with newly set password
    await page.goto(`${nogBaseURL}/login`)
    await page.waitForLoadState("networkidle")
    await page.fill("#email", testBizEmail)
    await page.fill("#password", updatedPassword)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 15000 })

    // 6. Test Forgot Password API endpoint for business owner email
    const forgotRes = await request.post(`${nogBaseURL}/api/auth/forgot-password`, {
      data: { email: testBizEmail },
    })
    expect(forgotRes.ok()).toBeTruthy()
    const forgotData = await forgotRes.json()
    expect(forgotData.success).toBeTruthy()
  })
})
