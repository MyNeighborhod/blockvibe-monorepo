import { test, expect } from "@playwright/test"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"

test.describe("CRM Simple Group & Tag Management E2E", () => {
  let nogBaseURL: string

  test.beforeEach(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Admin can tag resident with Landlord/Tenant/Custom tags and filter by quick group pills", async ({
    page,
  }) => {
    const isLocal = !isRemoteTestEnv()
    if (!isLocal) {
      test.skip(true, "CRM Tag tests require local database seeded access.")
      return
    }

    const timestamp = Date.now()
    const testAdminEmail = `admin-tags-${timestamp}@example.com`
    const testAdminPassword = `AdminPassword123!`
    const testResidentEmail = `resident-tags-${timestamp}@example.com`

    const { getPayload } = await import("payload")
    const config = (await import("../../src/payload.config.js")).default
    const payload = await getPayload({ config })

    const nogTenantDocs = await payload.find({
      collection: "tenants",
      where: { slug: { equals: "nog" } },
    })
    const nogTenantId = nogTenantDocs.docs[0].id

    await payload.create({
      collection: "users",
      data: {
        email: testAdminEmail,
        password: testAdminPassword,
        name: "Test Admin Tags",
        role: "superadmin",
        status: "approved",
        memberType: "residential",
        tenants: [{ tenant: nogTenantId }],
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: "users",
      data: {
        email: testResidentEmail,
        password: `ResidentPassword123!`,
        name: `Tagged Resident ${timestamp}`,
        role: "contributor",
        status: "approved",
        memberType: "residential",
        tenants: [{ tenant: nogTenantId }],
        customAttributes: {},
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

    await expect(page.getByRole("heading", { name: "Directory List" })).toBeVisible({
      timeout: 15000,
    })

    await page.fill('input[placeholder*="Search by name"]', testResidentEmail)
    await page.waitForTimeout(800)

    const editBtn = page.getByRole("button", { name: "Edit" }).first()
    await expect(editBtn).toBeVisible({ timeout: 15000 })
    await editBtn.click()

    await expect(page.getByText(/Edit Resident CRM Profile/i)).toBeVisible({ timeout: 15000 })

    const landlordBtn = page.locator('button:has-text("Landlord")').first()
    await expect(landlordBtn).toBeVisible({ timeout: 10000 })
    await landlordBtn.click()

    const customTagInput = page.locator("#custom-tag-input")
    await customTagInput.fill("VIP Donor")
    await page.getByRole("button", { name: "Add Tag" }).click()

    await page.getByRole("button", { name: "Save Changes" }).click()
    await page.waitForTimeout(1000)

    await page.fill('input[placeholder*="Search by name"]', testResidentEmail)
    await page.waitForTimeout(800)
    await expect(page.locator("tr", { hasText: testResidentEmail })).toContainText("VIP Donor")

    const landlordFilterChip = page.getByRole("button", { name: /^Landlords$/i })
    await landlordFilterChip.click()
    await page.waitForLoadState("networkidle")

    await expect(page.locator("table")).toContainText("Landlord")
  })
})
