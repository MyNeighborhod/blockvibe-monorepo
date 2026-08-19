import { test, expect } from "@playwright/test"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getTenantURL } from "../helpers/tenantUrl"

test.describe("Business Registration Validation Matrix (Current & Future Rules)", () => {
  let nogBaseURL: string
  const timestamp = Date.now()
  const mockLogoPath = path.join("/tmp", `validation-logo-${timestamp}.png`)

  test.beforeAll(async ({ baseURL }) => {
    nogBaseURL = getTenantURL(baseURL || "http://localhost:3000", "nog")

    // Create temporary 1x1 png image
    fs.writeFileSync(
      mockLogoPath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVGPU5CYII=",
        "base64",
      ),
    )
  })

  test.afterAll(async () => {
    if (fs.existsSync(mockLogoPath)) {
      fs.unlinkSync(mockLogoPath)
    }
  })

  test("Validation 1: Empty required name triggers HTML5 & Zod validation", async ({
    page,
  }) => {
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    const nameInput = page.locator("#name")
    await expect(nameInput).toHaveAttribute("required", "")

    const submitBtn = page.getByRole("button", { name: /Submit business/i })
    await submitBtn.click()

    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.checkValidity())
    expect(isInvalid).toBeTruthy()
  })

  test("Validation 2: Description length constraint (< 10 chars) triggers error message", async ({
    page,
  }) => {
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    await page.fill("#name", "Valid Business Name")
    await page.fill("#address", "100 Ingersoll Ave")
    await page.fill("#email", "valid@example.com")
    await page.fill("#about", "Short") // Less than 10 chars

    // Disable native HTML5 form validation to verify JS & Zod error message banner
    await page.evaluate(() => {
      document.querySelector("form")?.setAttribute("novalidate", "true")
    })

    const submitBtn = page.getByRole("button", { name: /Submit business/i })
    await submitBtn.click()

    await expect(page.getByText(/About description must be at least 10 characters/i)).toBeVisible()
  })

  test("Validation 3: Invalid email format triggers email input validation", async ({
    page,
  }) => {
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    await page.fill("#name", "Valid Business Name")
    await page.fill("#address", "100 Ingersoll Ave")
    await page.fill("#email", "not-an-email-format")
    await page.fill("#about", "This is a valid long description for a local business.")

    const emailInput = page.locator("#email")
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity())
    expect(isInvalid).toBeTruthy()
  })

  test("Validation 4: Missing logo or cover image triggers image requirement error", async ({
    page,
  }) => {
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByRole("heading", { name: /Add your business/i })).toBeVisible()

    await page.fill("#name", "Valid Business Name")
    await page.fill("#address", "100 Ingersoll Ave")
    await page.fill("#email", "test-missing-image@example.com")
    await page.fill("#about", "This is a valid long description for a local business.")

    // Disable novalidate to bypass file input native required check
    await page.evaluate(() => {
      document.querySelector("form")?.setAttribute("novalidate", "true")
    })

    const submitBtn = page.getByRole("button", { name: /Submit business/i })
    await submitBtn.click()

    // Bypassing file upload triggers logo / cover required validation error
    await expect(page.getByText(/is required/i)).toBeVisible()
  })

  test("Validation 5: Spam & Bot Protection Notice is present in registration form", async ({
    page,
  }) => {
    await page.goto(`${nogBaseURL}/businesses`)
    await expect(page.locator("h1")).toContainText(/Businesses/i)

    const addButton = page.getByRole("button", { name: /Add your business/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByText(/Protected by Google reCAPTCHA/i)).toBeVisible()
  })
})
