import { test, expect, type Page } from "@playwright/test"
import "dotenv/config"
import crypto from "crypto"
import { getTenantURL } from "../helpers/tenantUrl"
import { getPayloadSecretForE2E } from "../helpers/payloadSecret"
import { expectResidentListed, expectResidentNotListed } from "../helpers/emailBroadcaster"

const JOHN_EMAIL = "neighbor_john@nog.blockvibe.org"

function buildSubscriptionToken(email: string): string {
  const secret = getPayloadSecretForE2E()
  return crypto.createHmac("sha256", secret).update(email).digest("hex")
}

/** Idempotent setup: ensure resident is subscribed via the public resubscribe route. */
async function ensureUserSubscribed(page: Page, email: string): Promise<void> {
  const token = buildSubscriptionToken(email)
  await page.goto(`/resubscribe?email=${encodeURIComponent(email)}&token=${token}`)
  await expect(page.locator("text=/Resubscribed Successfully/i")).toBeVisible()
}

async function loginNogAdmin(page: Page): Promise<void> {
  const adminEmail = process.env.TENANT_NOG_USERNAME
  const adminPassword = process.env.TENANT_NOG_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error("TENANT_NOG_USERNAME or TENANT_NOG_PASSWORD not defined in env")
  }

  await page.goto("/login")
  await page.fill("input[type='email']", adminEmail)
  await page.fill("input[type='password']", adminPassword)
  await page.click("button[type='submit']")
  await page.waitForURL("**/dashboard")
}

async function openEmailBroadcaster(page: Page): Promise<void> {
  await page.click("a:has-text('Email Broadcaster')")
  await page.waitForURL("**/dashboard/email")
  await expect(page.locator("h1:has-text('Email Broadcaster')")).toBeVisible()
}

test.describe("Unsubscribe & Opt-out E2E Flow", () => {
  let nogBaseURL: string

  test.beforeAll(({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
  })

  test("Resident can unsubscribe and resubscribe; admin email directory reflects both changes", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const setupPage = await context.newPage()
    const adminPage = await context.newPage()
    const token = buildSubscriptionToken(JOHN_EMAIL)

    // 1. Ensure John is subscribed (idempotent via public resubscribe route)
    await ensureUserSubscribed(setupPage, JOHN_EMAIL)

    // 2. Pre-condition: John appears in the Email Broadcaster resident list
    await loginNogAdmin(adminPage)
    await openEmailBroadcaster(adminPage)
    await expectResidentListed(adminPage, JOHN_EMAIL)

    // 3. Resident unsubscribes via secure link
    const unsubscribePage = await context.newPage()
    await unsubscribePage.goto(
      `/unsubscribe?email=${encodeURIComponent(JOHN_EMAIL)}&token=${token}`,
    )
    await expect(unsubscribePage.locator("text=/Unsubscribed Successfully/i")).toBeVisible()
    await expect(
      unsubscribePage.locator("text=/no longer receive broadcast emails/i"),
    ).toBeVisible()
    await expect(unsubscribePage.locator("a:has-text('Resubscribe to Emails')")).toBeVisible()

    // 4. Post-condition: John is removed from Email Broadcaster
    await adminPage.reload({ waitUntil: "networkidle" })
    await expect(adminPage.locator("h1:has-text('Email Broadcaster')")).toBeVisible()
    await expectResidentNotListed(adminPage, JOHN_EMAIL)

    // 5. Resident resubscribes via public link (also reachable from unsubscribe success screen)
    const resubscribePage = await context.newPage()
    await resubscribePage.goto(
      `/resubscribe?email=${encodeURIComponent(JOHN_EMAIL)}&token=${token}`,
    )
    await expect(resubscribePage.locator("text=/Resubscribed Successfully/i")).toBeVisible()
    await expect(
      resubscribePage.locator("text=/receive broadcast emails from this neighborhood again/i"),
    ).toBeVisible()

    // 6. Post-condition: John reappears in Email Broadcaster
    await adminPage.reload({ waitUntil: "networkidle" })
    await expect(adminPage.locator("h1:has-text('Email Broadcaster')")).toBeVisible()
    await expectResidentListed(adminPage, JOHN_EMAIL)

    await context.close()
  })
})
