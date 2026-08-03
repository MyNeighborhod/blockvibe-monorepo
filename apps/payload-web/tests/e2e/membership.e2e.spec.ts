import { test, expect } from "@playwright/test"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Membership & Payment Flows (Stubbed PayPal & Offline)", () => {
  test("loads main membership landing page and merchandise gallery", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/membership")
    await expect(page.locator("h1")).toContainText(/Membership & Community Support/i)

    // Check merchandise items
    await expect(page.getByText("NOG T-Shirt")).toBeVisible()
    await expect(page.getByText("Car Magnet / Badge")).toBeVisible()
    await expect(page.getByText("NOG Coffee Mug")).toBeVisible()

    await context.close()
  })

  test("completes new member registration via stubbed PayPal", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/membership/signup?intent=new")
    await expect(page.locator("h1")).toContainText(/New Community Membership/i)

    // Fill out form
    await page.fill('input[name="name"]', "Test Neighbor Jane")
    await page.fill('input[name="email"]', `jane_${Date.now()}@example.com`)
    await page.fill('input[name="phone"]', "(555) 123-4567")
    await page.fill('input[name="address"]', "123 Grand Ave")

    // Select PayPal payment option (Credit / Debit Card or PayPal)
    await page.click('input[value="paypal"]')

    // Submit form to initiate fake PayPal order
    await page.click('button[type="submit"]')

    // Verify PayPal Fake Order response UI
    await expect(page.getByText(/PayPal Order Created/i)).toBeVisible()
    await expect(page.getByText(/Order ID:/i)).toBeVisible()

    // Complete PayPal payment
    await page.click("button:has-text('Complete PayPal Payment')")

    // Verify redirection to Thank You page
    await expect(page.locator("h1")).toContainText(/Thank You for Joining!/i)
    await expect(page.getByText(/Active Annual Paying Member/i)).toBeVisible()
    await expect(page.getByText(/Account ID \(ULID\)/i)).toBeVisible()

    await context.close()
  })

  test("completes new member registration via offline cash/check toggle", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/membership/signup?intent=new")

    // Fill out form
    await page.fill('input[name="name"]', "Test Neighbor Bob")
    await page.fill('input[name="email"]', `bob_${Date.now()}@example.com`)
    await page.fill('input[name="phone"]', "(555) 987-6543")
    await page.fill('input[name="address"]', "456 Oak Street")

    // Select Household tier
    await page.click('input[value="household"]')

    // Select offline toggle: "I will pay cash / check / other ways later"
    await page.click('input[value="check"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify immediate profile creation & check instructions
    await expect(page.locator("h1")).toContainText(/Thank You for Joining!/i)
    await expect(page.getByText(/Pending Check \/ Cash/i)).toBeVisible()
    await expect(page.getByText(/Check Payment Instructions:/i)).toBeVisible()

    await context.close()
  })

  test("completes one-time donation with merchandise add-ons via stubbed PayPal", async ({ browser, baseURL }) => {
    const targetBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")
    const context = await browser.newContext({ baseURL: targetBaseURL })
    const page = await context.newPage()

    await page.goto("/membership/signup?intent=donation")
    await expect(page.locator("h1")).toContainText(/Order Merchandise or Donate/i)

    // Fill out donor info
    await page.fill('input[name="name"]', "Generous Donor Alice")
    await page.fill('input[name="email"]', `alice_${Date.now()}@example.com`)

    // Select donation preset
    await page.click("button:has-text('$50')")

    // Add merchandise items
    await page.check('input[type="checkbox"]:near(:text("NOG T-Shirt"))')
    await page.check('input[type="checkbox"]:near(:text("NOG Coffee Mug"))')

    // Submit order
    await page.click('button[type="submit"]')

    // Complete PayPal payment
    await expect(page.getByText(/PayPal Order Created/i)).toBeVisible()
    await page.click("button:has-text('Complete PayPal Payment')")

    // Verify Thank You page
    await expect(page.locator("h1")).toContainText(/Thank You for Joining!/i)

    await context.close()
  })
})
