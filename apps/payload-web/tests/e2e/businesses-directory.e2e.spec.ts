import { test, expect } from "@playwright/test"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"
import { getPayload } from "payload"
import config from "../../src/payload.config.js"

test.describe("Business Directory & CRM Broadcaster E2E Flow", () => {
  let nogBaseURL: string
  const isLocal = !isRemoteTestEnv()
  const testEmail = "cafe@greenmeadows.org"
  const mockLogoPath = path.join("/tmp", "test-logo.png")

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    
    // Create mock logo image
    fs.writeFileSync(
      mockLogoPath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      ),
    )
  })

  test.afterAll(async () => {
    // Local database cleanup
    if (isLocal) {
      const payload = await getPayload({ config })
      
      // Delete Business
      await payload.delete({
        collection: "businesses",
        where: {
          email: { equals: testEmail },
        },
      })
      
      // Delete user
      await payload.delete({
        collection: "users",
        where: {
          email: { equals: testEmail },
        },
      })

      // Delete mailing list
      await payload.delete({
        collection: "mailing-lists",
        where: {
          name: { equals: "NOG Businesses" },
        },
      })

      // Delete broadcast
      await payload.delete({
        collection: "broadcasts",
        where: {
          subject: { equals: "Welcome Local Businesses" },
        },
      })
    }

    // Delete mock file
    if (fs.existsSync(mockLogoPath)) {
      fs.unlinkSync(mockLogoPath)
    }
  })

  test("Anonymous can register business, and Admin can broadcast to businesses mailing list", async ({
    browser,
  }) => {
    if (isLocal) {
      const payload = await getPayload({ config })
      // Run pre-test database cleanup
      await payload.delete({
        collection: "businesses",
        where: { email: { equals: testEmail } },
      })
      await payload.delete({
        collection: "users",
        where: { email: { equals: testEmail } },
      })
      await payload.delete({
        collection: "mailing-lists",
        where: { name: { equals: "NOG Businesses" } },
      })
      await payload.delete({
        collection: "broadcasts",
        where: { subject: { equals: "Welcome Local Businesses" } },
      })
    }

    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    // 1. Visit Businesses Directory Page (Public)
    await page.goto("/businesses")
    await expect(page.locator("h1:has-text('Businesses of North Of Grand')")).toBeVisible()

    // 2. Open Registration Modal
    await page.click("button:has-text('Add Your Business')")
    await expect(page.locator("h2:has-text('Add Your Business')")).toBeVisible()

    // 3. Fill out Registration Form
    await page.setInputFiles("input[type='file']", mockLogoPath)
    await page.fill("input[id='name']", "Green Meadows Cafe")
    await page.fill("input[id='address']", "123 Grand Ave, Des Moines, IA")
    await page.fill("input[id='website']", "https://greenmeadowscafe.com")
    await page.fill("input[id='email']", testEmail)
    await page.fill("textarea[id='about']", "A local organic neighborhood coffee spot.")
    await page.fill("input[id='hours']", "7 AM - 4 PM")

    // Submit
    await page.click("button[type='submit']")

    // Verify Success Message
    await expect(page.locator("text=/successfully/i")).toBeVisible()
    await page.waitForTimeout(2500) // wait for modal auto-close
    
    // Reload the page to clear local state and verify it is not visible without admin approval
    await page.reload()
    await expect(page.locator("h3:has-text('Green Meadows Cafe')")).not.toBeVisible()

    // 4. Log in as NOG Admin
    const adminEmail = process.env.TENANT_NOG_USERNAME
    const adminPassword = process.env.TENANT_NOG_PASSWORD
    if (!adminEmail || !adminPassword) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    // Auto-accept confirmation dialogs for UI cleanup
    page.on("dialog", (dialog) => dialog.accept())

    await page.goto("/login")
    await page.fill("input[type='email']", adminEmail)
    await page.fill("input[type='password']", adminPassword)
    await page.click("button[type='submit']")
    await page.waitForURL("**/dashboard")

    // 5. Go to CRM and Approve Business
    await page.click("a:has-text('Directory (CRM)')")
    await page.waitForURL("**/dashboard/crm")
    await page.click("button:has-text('Local Businesses')")
    
    // Find the new business row and toggle the checkbox to approve it
    const approveToggle = page.locator("tr:has-text('Green Meadows Cafe') input.crm-business-approval-toggle").first()
    await expect(approveToggle).toBeVisible()
    if (!(await approveToggle.isChecked())) {
      await approveToggle.click()
      await expect(approveToggle).toBeChecked()
    }

    // 6. Verify that it is now visible publicly
    await page.goto("/businesses")
    await expect(page.locator("h3:has-text('Green Meadows Cafe')").first()).toBeVisible()

    // 7. Go back to CRM and Create Mailing List
    await page.goto("/dashboard/crm")
    await page.click("button:has-text('Mailing Lists')")

    // Pre-clean mailing list if already exists
    const preListDelete = page.locator("div:has-text('NOG Businesses') button:has-text('Delete')").first()
    if (await preListDelete.isVisible().catch(() => false)) {
      await preListDelete.click()
      await page.waitForTimeout(500)
    }

    await page.click("button:has-text('Create Mailing List')")

    await page.fill("input[id='listName']", "NOG Businesses")
    await page.fill("input[id='listDesc']", "Local Businesses of North of Grand")
    await page.selectOption("select[id='listSelectType']", "dynamic")

    // Configure rule: memberType equals business
    await page.selectOption("select.rule-field-select", "memberType")
    await page.selectOption("select.rule-operator-select", "equals")
    await page.selectOption("select.rule-value-select", "business")

    // Verify dynamic preview list shows our Cafe
    await page.waitForTimeout(500)
    await expect(page.locator(".preview-member-item:has-text('cafe@greenmeadows.org')")).toBeVisible()

    await page.click("button:has-text('Save List')")
    await expect(page.locator("h3:has-text('NOG Businesses')")).toBeVisible()

    // 8. Go to Email Broadcaster and target the list
    await page.click("a:has-text('Email Broadcaster')")
    await page.waitForURL("**/dashboard/email")

    await page.selectOption("select[id='target-list']", { label: "Mailing List: NOG Businesses (dynamic)" })
    await page.waitForTimeout(500)

    // Verify checked email
    const checkbox = page.locator(`input[id="resident-checkbox-${testEmail}"]`)
    await expect(checkbox).toBeChecked()

    // Select Platform (SES) to ensure mail delivery is tested
    await page.locator('input[name="delivery"]').first().check()

    // 9. Compose and send communication
    await page.fill("input[id='broadcast-subject']", "Welcome Local Businesses")
    const editor = page.locator("[id='broadcast-message']")
    await editor.focus()
    await page.evaluate(() => {
      const el = document.getElementById("broadcast-message")
      if (el) {
        el.innerHTML = "<p>Hello Business Owners, welcome to our community list!</p>"
        el.dispatchEvent(new Event("input", { bubbles: true }))
      }
    })

    await page.click("button:has-text('Send Communication')")
    await expect(
      page.locator(
        "text=/Communication sent successfully|Broadcast queued/i",
      ),
    ).toBeVisible()

    // 10. Self-Cleaning Step: Remove test-created business and mailing list via UI
    await page.goto("/dashboard/crm")
    await page.click("button:has-text('Local Businesses')")
    const postBizDelete = page.locator("tr:has-text('Green Meadows Cafe') button:has-text('Delete')")
    const bizCount = await postBizDelete.count()
    for (let i = 0; i < bizCount; i++) {
      const btn = postBizDelete.first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(500)
      }
    }

    await page.click("button:has-text('Mailing Lists')")
    const postListDelete = page.locator("div:has-text('NOG Businesses') button:has-text('Delete')")
    const listCount = await postListDelete.count()
    for (let i = 0; i < listCount; i++) {
      const btn = postListDelete.first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(500)
      }
    }

    await page.close()
    await context.close()
  })
})
