import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { resolvePayPalApiBaseUrl } from "@/services/payment/providers/paypalProvider"

describe("resolvePayPalApiBaseUrl", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.PAYPAL_API_BASE_URL
    delete process.env.PAYPAL_API_URL
    process.env.NODE_ENV = "production"
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("uses live PayPal API in production when local stub URL is configured", () => {
    process.env.PAYPAL_API_BASE_URL = "http://localhost:3000/api/testutils/paypal"
    expect(resolvePayPalApiBaseUrl("live")).toBe("https://api-m.paypal.com")
  })

  it("uses sandbox PayPal API in production when local stub URL is configured", () => {
    process.env.PAYPAL_API_BASE_URL = "http://127.0.0.1:3000/api/testutils/paypal"
    expect(resolvePayPalApiBaseUrl("sandbox")).toBe("https://api-m.sandbox.paypal.com")
  })

  it("allows local stub URL during development", () => {
    process.env.NODE_ENV = "development"
    process.env.PAYPAL_API_BASE_URL = "http://localhost:3000/api/testutils/paypal"
    expect(resolvePayPalApiBaseUrl("sandbox")).toBe("http://localhost:3000/api/testutils/paypal")
  })

  it("honors explicit production PayPal API override", () => {
    process.env.PAYPAL_API_BASE_URL = "https://api-m.paypal.com"
    expect(resolvePayPalApiBaseUrl("live")).toBe("https://api-m.paypal.com")
  })
})
