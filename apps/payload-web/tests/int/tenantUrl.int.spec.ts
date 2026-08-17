import { describe, expect, it } from "vitest"
import {
  expectedNogExampleHost,
  getPlatformServerURLFromHost,
  getTenantURL,
  isRemoteTestEnv,
} from "../helpers/tenantUrl"

describe("tenantUrl helpers", () => {
  it("maps tenant hosts to platform apex for OAuth callbacks", () => {
    expect(getPlatformServerURLFromHost("nog.staging.blockvibe.org")).toBe(
      "https://staging.blockvibe.org",
    )
    expect(getPlatformServerURLFromHost("staging.blockvibe.org")).toBe(
      "https://staging.blockvibe.org",
    )
    expect(getPlatformServerURLFromHost("nog.blockvibe.org")).toBe("https://blockvibe.org")
    expect(getPlatformServerURLFromHost("blockvibe.org")).toBe("https://blockvibe.org")
    expect(getPlatformServerURLFromHost("nog.localhost", "http:", "3000")).toBe(
      "http://localhost:3000",
    )
  })

  it("maps localhost base URL to tenant subdomains", () => {
    expect(getTenantURL("http://localhost:3000", "nog")).toBe("http://nog.localhost:3000/")
  })

  it("maps blockvibe.org to tenant subdomains on blockvibe.org", () => {
    expect(getTenantURL("https://blockvibe.org", "nog")).toBe("https://nog.blockvibe.org/")
    expect(getTenantURL("https://blockvibe.org", "twin-suns")).toBe(
      "https://twin-suns.blockvibe.org/",
    )
    expect(getTenantURL("https://info.blockvibe.org", "nog")).toBe("https://nog.blockvibe.org/")
  })

  it("maps staging.blockvibe.org to tenant subdomains on staging.blockvibe.org", () => {
    expect(getTenantURL("https://staging.blockvibe.org", "nog")).toBe(
      "https://nog.staging.blockvibe.org/",
    )
    expect(getTenantURL("https://staging.blockvibe.org", "twin-suns")).toBe(
      "https://twin-suns.staging.blockvibe.org/",
    )
  })

  it("returns the expected NOG example host per environment", () => {
    expect(expectedNogExampleHost("http://localhost:3000")).toBe("nog.localhost")
    expect(expectedNogExampleHost("https://blockvibe.org")).toBe("nog.blockvibe.org")
    expect(expectedNogExampleHost("https://staging.blockvibe.org")).toBe(
      "nog.staging.blockvibe.org",
    )
  })

  it("detects remote Playwright environments", () => {
    const original = process.env.PLAYWRIGHT_BASE_URL
    process.env.PLAYWRIGHT_BASE_URL = "https://blockvibe.org"
    expect(isRemoteTestEnv()).toBe(true)
    process.env.PLAYWRIGHT_BASE_URL = "http://localhost:3000"
    expect(isRemoteTestEnv()).toBe(false)
    process.env.PLAYWRIGHT_BASE_URL = original
  })
})
