import { test, expect, type Page } from "@playwright/test"
import "dotenv/config"
import crypto from "crypto"
import { getTenantURL } from "../helpers/tenantUrl"
import { getPayloadSecretForE2E } from "../helpers/payloadSecret"

const JOHN_EMAIL = "neighbor_john@nog.blockvibe.org"

function buildUnsubscribeToken(email: string): string {
  const secret = getPayloadSecretForE2E()
  return crypto.createHmac("sha256", secret).update(email).digest("hex")
}

/** Reset a resident's subscription so the unsubscribe flow can be exercised repeatedly. */
async function ensureUserSubscribed(page: Page, email: string): Promise<void> {
  const usersResponse = await page.request.get(
    `/api/users?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
  )
  expect(usersResponse.ok()).toBeTruthy()

  const usersData = await usersResponse.json()
  const user = usersData.docs?.[0]
  if (!user) {
    throw new Error(`User ${email} not found — run seed-nog-users against this environment.`)
  }

  if (user.unsubscribed) {
    const patchResponse = await page.request.patch(`/api/users/${user.id}`, {
      data: { unsubscribed: false },
    })
    expect(patchResponse.ok()).toBeTruthy()
  }
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

  test("Resident can click unsubscribe, see success screen, and admin no longer sees them in email directory", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: nogBaseURL })
    const adminPage = await context.newPage()

    // 1. Admin logs in and ensures John is subscribed (idempotent setup for repeat runs)
    await loginNogAdmin(adminPage)
    await ensureUserSubscribed(adminPage, JOHN_EMAIL)

    // 2. Pre-condition: John appears in the Email Broadcaster resident list
    await openEmailBroadcaster(adminPage)
    const johnCheckbox = adminPage.locator(`input[id="resident-checkbox-${JOHN_EMAIL}"]`)
    await expect(johnCheckbox).toBeVisible()

    // 3. Resident visits the unsubscribe link (simulates clicking footer link in an email)
    const unsubscribePage = await context.newPage()
    const token = buildUnsubscribeToken(JOHN_EMAIL)
    await unsubscribePage.goto(
      `/unsubscribe?email=${encodeURIComponent(JOHN_EMAIL)}&token=${token}`,
    )

    // 4. Assert unsubscribe success card renders
    await expect(unsubscribePage.locator("text=/Unsubscribed Successfully/i")).toBeVisible()
    await expect(
      unsubscribePage.locator("text=/no longer receive broadcast emails/i"),
    ).toBeVisible()

    // 5. Post-condition: admin reloads Email Broadcaster and John is no longer listed
    await adminPage.reload()
    await expect(adminPage.locator("h1:has-text('Email Broadcaster')")).toBeVisible()
    await expect(johnCheckbox).not.toBeVisible()

    await context.close()
  })
})
