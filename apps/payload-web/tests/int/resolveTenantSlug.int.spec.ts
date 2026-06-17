import { describe, expect, it } from "vitest"

import {
  isNorthOfGrandTenant,
  resolveTenantSlugFromHost,
  shouldUseNogChrome,
} from "@/utilities/resolveTenantSlug"

describe("resolveTenantSlugFromHost", () => {
  it("maps plain localhost to default (platform template tenant)", () => {
    expect(resolveTenantSlugFromHost("localhost")).toBe("default")
    expect(resolveTenantSlugFromHost("127.0.0.1")).toBe("default")
  })

  it("maps localhost subdomains to their slug (nog.localhost -> nog)", () => {
    expect(resolveTenantSlugFromHost("nog.localhost")).toBe("nog")
    expect(resolveTenantSlugFromHost("beaverdale.localhost")).toBe("beaverdale")
  })

  it("maps production platform hosts", () => {
    expect(resolveTenantSlugFromHost("info.blockvibe.org")).toBe("default")
    expect(resolveTenantSlugFromHost("blockvibe.org")).toBe("default")
    expect(resolveTenantSlugFromHost("nog.blockvibe.org")).toBe("nog")
    expect(resolveTenantSlugFromHost("beaverdale.blockvibe.org")).toBe("beaverdale")
  })

  it("maps staging platform hosts", () => {
    expect(resolveTenantSlugFromHost("staging.blockvibe.org")).toBe("default")
    expect(resolveTenantSlugFromHost("nog.staging.blockvibe.org")).toBe("nog")
    expect(resolveTenantSlugFromHost("beaverdale.staging.blockvibe.org")).toBe("beaverdale")
  })
})

describe("template chrome selection", () => {
  it("uses Payload template chrome for generic default tenant", () => {
    const tenant = { slug: "default", name: "Default Tenant" }
    expect(isNorthOfGrandTenant(tenant)).toBe(false)
    expect(shouldUseNogChrome(tenant)).toBe(false)
  })

  it("uses NOG chrome for nog tenant", () => {
    const tenant = { slug: "nog", name: "North Of Grand Des Moines" }
    expect(isNorthOfGrandTenant(tenant)).toBe(true)
    expect(shouldUseNogChrome(tenant)).toBe(true)
  })

  it("does not use NOG chrome for platform default tenant", () => {
    const tenant = { slug: "default", name: "BlockVibe Platform" }
    expect(isNorthOfGrandTenant(tenant)).toBe(false)
    expect(shouldUseNogChrome(tenant)).toBe(false)
  })
})
