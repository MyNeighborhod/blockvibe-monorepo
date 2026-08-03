import { describe, it, expect } from "vitest"
import { ulid } from "ulid"
import { ManualCheckProvider } from "@/services/payment/providers/manualCheckProvider"

describe("Payment Service Unit & Integration Tests", () => {
  it("generates valid ULID account identifiers", () => {
    const accountId = ulid()
    expect(accountId).toBeDefined()
    expect(typeof accountId).toBe("string")
    expect(accountId.length).toBe(26)
  })

  it("processes manual check payment structure", () => {
    const provider = new ManualCheckProvider()
    const result = provider.processManualPayment({
      accountId: ulid(),
      userId: 1,
      tier: "individual",
      provider: "check",
      amount: 100,
      providerTransactionId: "CHK-10023",
      notes: "Test paper check",
    })

    expect(result.status).toBe("completed")
    expect(result.amount).toBe(100)
    expect(result.providerTransactionId).toBe("CHK-10023")
    expect(result.paymentId).toBeDefined()
  })
})
