import { test, expect } from "@playwright/test"
import "dotenv/config"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"
import { getPayload } from "payload"
import config from "../../src/payload.config.js"

test.describe("CRM Mailing Lists and Custom Attributes E2E Flow", () => {
  let nogBaseURL: string
  const isLocal = !isRemoteTestEnv()

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test.afterAll(async () => {
    if (isLocal) {
      const payload = await getPayload({ config })
      // Delete CRM Fields and Mailing Lists created in test
      await payload.delete({
        collection: "mailing-lists",
        where: {
          name: { equals: "NOG Pet Owners" },
        },
      })
      await payload.delete({
        collection: "crm-fields",
        where: {
          key: { equals: "hasPet" },
        },
      })
    }
  })

  test("Admin can create custom fields, update resident profile, define dynamic mailing list, and select it in broadcaster", async ({
    browser,
  }) => {
    // 0. Local database cleanup before test runs
    if (isLocal) {
      const payload = await getPayload({ config })
      await payload.delete({
        collection: "mailing-lists",
        where: {
          name: { equals: "NOG Pet Owners" },
        },
      })
      await payload.delete({
        collection: "crm-fields",
        where: {
          key: { equals: "hasPet" },
        },
      })
    }

    const adminContext = await browser.newContext({ baseURL: nogBaseURL })
    const adminPage = await adminContext.newPage()

    const adminEmail = process.env.TENANT_NOG_USERNAME
    const adminPassword = process.env.TENANT_NOG_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // Setup dialog auto-accept for deletions
    adminPage.on("dialog", (dialog) => dialog.accept())

    // 1. Log in as NOG Admin
    await adminPage.goto("/login")
    await adminPage.fill("input[type='email']", adminEmail)
    await adminPage.fill("input[type='password']", adminPassword)
    await adminPage.click("button[type='submit']")
    await adminPage.waitForURL("**/dashboard")

    // 2. Navigate to Resident Directory
    await adminPage.click("a:has-text('Directory (CRM)')")
    await adminPage.waitForURL("**/dashboard/crm")
    await expect(adminPage.locator("h1:has-text('Resident Directory')")).toBeVisible()

    // Pre-cleanup custom field and mailing list if left over from previous runs
    await adminPage.click("button:has-text('Custom Attributes')")
    const preFieldDelete = adminPage.locator("tr:has-text('Has Pet') button:has-text('Delete')")
    const preFieldCount = await preFieldDelete.count()
    for (let i = 0; i < preFieldCount; i++) {
      const btn = preFieldDelete.first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await adminPage.waitForTimeout(500)
      }
    }

    await adminPage.click("button:has-text('Mailing Lists')")
    const preListDelete = adminPage.locator("div:has-text('NOG Pet Owners') button:has-text('Delete')")
    const preListCount = await preListDelete.count()
    for (let i = 0; i < preListCount; i++) {
      const btn = preListDelete.first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await adminPage.waitForTimeout(500)
      }
    }

    // 3. Create Custom CRM Field
    await adminPage.click("button:has-text('Custom Attributes')")
    await adminPage.click("button:has-text('Add Custom Field')")
    await adminPage.fill("input[id='fieldLabel']", "Has Pet")
    await adminPage.selectOption("select[id='fieldSelectType']", "checkbox")
    await adminPage.click("button:has-text('Save Field')")

    // Verify custom field was saved and appears in the list
    await expect(adminPage.locator("td:has-text('Has Pet')").first()).toBeVisible()

    // 4. Update Resident Profile with custom attribute
    await adminPage.click("button:has-text('Resident Directory')")
    
    // Search for eugen8@gmail.com in the search bar
    await adminPage.fill("input[placeholder*='Search by name']", "eugen8@gmail.com")
    await adminPage.waitForTimeout(1000) // wait for debounced search reload
    
    // Click edit on eugen8 resident
    await adminPage.click("tr:has-text('eugen8@gmail.com') button:has-text('Edit')")
    
    // Toggle the new dynamic "Has Pet" checkbox
    const customCheckbox = adminPage.locator("input[id='custom-hasPet']").first()
    await expect(customCheckbox).toBeVisible()
    if (!(await customCheckbox.isChecked())) {
      await customCheckbox.check()
    }
    
    await adminPage.click("button:has-text('Save Changes')")

    // 5. Create dynamic mailing list matching "Has Pet = true"
    await adminPage.click("button:has-text('Mailing Lists')")
    await adminPage.click("button:has-text('Create Mailing List')")
    await adminPage.fill("input[id='listName']", "NOG Pet Owners")
    await adminPage.fill("input[id='listDesc']", "Dynamic list for pet owners in NOG")
    await adminPage.selectOption("select[id='listSelectType']", "dynamic")
    // Configure rule
    await adminPage.selectOption("select.rule-field-select", "customAttributes.hasPet")
    await adminPage.selectOption("select.rule-operator-select", "equals")
    await adminPage.fill("input.rule-value-input", "true")
    
    // Wait for dynamic preview list to load and verify Eugen is shown
    await adminPage.waitForTimeout(500)
    await expect(adminPage.locator(".preview-member-item:has-text('eugen8@gmail.com')")).toBeVisible()
    
    await adminPage.click("button:has-text('Save List')")
    await expect(adminPage.locator("h3:has-text('NOG Pet Owners')")).toBeVisible()

    // 6. Go to Email Broadcaster and select the mailing list
    await adminPage.click("a:has-text('Email Broadcaster')")
    await adminPage.waitForURL("**/dashboard/email")
    
    // Select Target Audience dropdown
    await adminPage.selectOption("select[id='target-list']", { label: "Mailing List: NOG Pet Owners (dynamic)" })
    await adminPage.waitForTimeout(500) // Wait for evaluation action
    
    // Check that Eugen's checkbox is checked
    const checkbox = adminPage.locator("input[id='resident-checkbox-eugen8@gmail.com']")
    await expect(checkbox).toBeChecked()

    // 7. Self-Cleaning Step: Remove test-created custom field and mailing list via UI
    await adminPage.goto("/dashboard/crm")

    await adminPage.click("button:has-text('Custom Attributes')")
    const postFieldDelete = adminPage.locator("tr:has-text('Has Pet') button:has-text('Delete')")
    const postFieldCount = await postFieldDelete.count()
    for (let i = 0; i < postFieldCount; i++) {
      const btn = postFieldDelete.first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await adminPage.waitForTimeout(500)
      }
    }

    await adminPage.click("button:has-text('Mailing Lists')")
    const postListDelete = adminPage.locator("div:has-text('NOG Pet Owners') button:has-text('Delete')")
    const postListCount = await postListDelete.count()
    for (let i = 0; i < postListCount; i++) {
      const btn = postListDelete.first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await adminPage.waitForTimeout(500)
      }
    }

    await adminPage.close()
    await adminContext.close()
  })
})
