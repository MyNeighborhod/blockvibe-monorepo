import { describe, expect, it } from "vitest"
import { resolveTransactionalEmailFrom } from "@/utilities/transactionalEmail"

describe("resolveTransactionalEmailFrom", () => {
  it("uses tenant DB transactional email fields when set", () => {
    const from = resolveTransactionalEmailFrom({
      slug: "nog",
      transactionalEmailFrom: "northofgrandpresident@northofgranddsm.org",
      transactionalEmailFromName: "North of Grand Neighborhood Association",
    })
    expect(from.address).toBe("northofgrandpresident@northofgranddsm.org")
    expect(from.name).toBe("North of Grand Neighborhood Association")
  })

  it("falls back to platform env defaults when tenant fields are empty", () => {
    const from = resolveTransactionalEmailFrom({ slug: "nog", name: "North Of Grand" })
    expect(from.address).toBe(process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org")
    expect(from.name).toBe(process.env.SMTP_FROM_NAME || "BlockVibe")
  })

  it("uses organizationLegalName before tenant name for display name", () => {
    const from = resolveTransactionalEmailFrom({
      slug: "nog",
      name: "North Of Grand",
      organizationLegalName: "North of Grand Neighborhood Association",
    })
    expect(from.name).toBe("North of Grand Neighborhood Association")
  })
})
