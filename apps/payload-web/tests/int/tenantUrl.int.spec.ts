import { describe, expect, it } from "vitest"
import { expectedNogExampleHost, getTenantURL, isRemoteTestEnv } from "../helpers/tenantUrl"

describe("tenantUrl helpers", () => {
  it("maps localhost base URL to tenant subdomains", () => {
    expect(getTenantURL("http://localhost:3000", "nog")).toBe("http://nog.localhost:3000/")
  })

  it("maps info.blockvibe.org to tenant subdomains on blockvibe.org", () => {
    expect(getTenantURL("https://info.blockvibe.org", "nog")).toBe("https://nog.blockvibe.org/")
    expect(getTenantURL("https://info.blockvibe.org", "twin-suns")).toBe(
      "https://twin-suns.blockvibe.org/",
    )
  })

  it("returns the expected NOG example host per environment", () => {
    expect(expectedNogExampleHost("http://localhost:3000")).toBe("nog.localhost")
    expect(expectedNogExampleHost("https://info.blockvibe.org")).toBe("nog.blockvibe.org")
  })

  it("detects remote Playwright environments", () => {
    const original = process.env.PLAYWRIGHT_BASE_URL
    process.env.PLAYWRIGHT_BASE_URL = "https://info.blockvibe.org"
    expect(isRemoteTestEnv()).toBe(true)
    process.env.PLAYWRIGHT_BASE_URL = "http://localhost:3000"
    expect(isRemoteTestEnv()).toBe(false)
    process.env.PLAYWRIGHT_BASE_URL = original
  })
})
