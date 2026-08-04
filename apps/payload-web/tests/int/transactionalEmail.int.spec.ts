import { describe, expect, it } from "vitest"
import { resolveTransactionalEmailFrom } from "@/utilities/transactionalEmail"

describe("resolveTransactionalEmailFrom", () => {
  it("uses NOG defaults for nog tenant slug", () => {
    const from = resolveTransactionalEmailFrom({ slug: "nog", name: "North Of Grand" })
    expect(from.address).toBe("northofgrandpresident@northofgranddsm.org")
    expect(from.name).toBe("North of Grand Neighborhood Association")
  })

  it("prefers tenant transactionalEmailFrom fields when set", () => {
    const from = resolveTransactionalEmailFrom({
      slug: "nog",
      transactionalEmailFrom: "custom@northofgranddsm.org",
      transactionalEmailFromName: "Custom NOG",
    })
    expect(from.address).toBe("custom@northofgranddsm.org")
    expect(from.name).toBe("Custom NOG")
  })

  it("uses platform defaults for default tenant", () => {
    const from = resolveTransactionalEmailFrom({ slug: "default", name: "BlockVibe" })
    expect(from.address).toBe(process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org")
    expect(from.name).toBe(process.env.SMTP_FROM_NAME || "BlockVibe")
  })
})
