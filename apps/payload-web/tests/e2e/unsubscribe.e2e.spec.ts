import { test, expect } from "@playwright/test"
import "dotenv/config"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Unsubscribe & Opt-out E2E Flow", () => {
  let nogBaseURL: string

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Resident can click unsubscribe, see success screen, and admin no longer sees them in email directory", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const page = await context.newPage()

    // 1. Generate secure HMAC unsubscribe token for John Neighbor
    const email = "neighbor_john@nog.blockvibe.org"
    
    // Resolve PAYLOAD_SECRET based on whether we are testing local or production
    let secret = process.env.PAYLOAD_SECRET || "fallback-secret"
    const isProd = process.env.PLAYWRIGHT_BASE_URL && !process.env.PLAYWRIGHT_BASE_URL.includes("localhost")
    if (isProd) {
      const prodEnvPath = path.resolve(process.cwd(), ".env.production")
      if (fs.existsSync(prodEnvPath)) {
        const prodConfig = dotenv.parse(fs.readFileSync(prodEnvPath))
        if (prodConfig.PAYLOAD_SECRET) {
          secret = prodConfig.PAYLOAD_SECRET
        }
      }
    }
    
    const token = crypto.createHmac("sha256", secret).update(email).digest("hex")

    // 2. Navigate to the unsubscribe page
    await page.goto(`/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`)

    // 3. Assert unsubscribe success card renders
    await expect(page.locator("text=/Unsubscribed Successfully/i")).toBeVisible()
    await expect(
      page.locator("text=/no longer receive broadcast emails/i")
    ).toBeVisible()

    // 4. Log in as NOG Admin and navigate to Email Broadcaster
    const adminPage = await context.newPage()
    const adminEmail = process.env.TENANT_NOG_USERNAME
    const adminPassword = process.env.TENANT_NOG_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
    }

    await adminPage.goto("/login")
    await adminPage.fill("input[type='email']", adminEmail)
    await adminPage.fill("input[type='password']", adminPassword)
    await adminPage.click("button[type='submit']")
    await adminPage.waitForURL("**/dashboard")

    await adminPage.click("a:has-text('Email Broadcaster')")
    await adminPage.waitForURL("**/dashboard/email")

    // 5. Verify that John Neighbor (neighbor_john@nog.blockvibe.org) is NO LONGER visible/selectable in the checklist
    const johnCheckbox = adminPage.locator(`input[id="resident-checkbox-${email}"]`)
    await expect(johnCheckbox).not.toBeVisible()

    await context.close()
  })
})
