import { getPayload } from "payload"
import configPromise from "@payload-config"
import { ulid } from "ulid"
import { PayPalProvider } from "./providers/paypalProvider"
import { ManualCheckProvider } from "./providers/manualCheckProvider"
import type {
  PayPalCredentials,
  CreateOrderParams,
  CreateOrderResult,
  CaptureOrderParams,
  RecordManualPaymentParams,
  ProcessedPaymentResult,
} from "./types"

export class PaymentService {
  private paypalProvider = new PayPalProvider()
  private manualProvider = new ManualCheckProvider()

  private async getPayPalCredentials(): Promise<PayPalCredentials> {
    try {
      const payload = await getPayload({ config: configPromise })
      const settings = await payload.findGlobal({ slug: "payment-settings" as any })

      const clientId = (settings as any)?.paypalClientId || process.env.PAYPAL_CLIENT_ID || ""
      const clientSecret = (settings as any)?.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET || ""
      const environment = ((settings as any)?.paypalEnvironment || process.env.PAYPAL_ENVIRONMENT || "sandbox") as "sandbox" | "live"

      return { clientId, clientSecret, environment }
    } catch {
      return {
        clientId: process.env.PAYPAL_CLIENT_ID || "",
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
        environment: (process.env.PAYPAL_ENVIRONMENT || "sandbox") as "sandbox" | "live",
      }
    }
  }

  async getDuesAmount(tier: "individual" | "household"): Promise<number> {
    try {
      const payload = await getPayload({ config: configPromise })
      const settings = await payload.findGlobal({ slug: "payment-settings" as any })
      if (tier === "household") {
        return (settings as any)?.householdDuesAmount || 20
      }
      return (settings as any)?.individualDuesAmount || 10
    } catch {
      return tier === "household" ? 20 : 10
    }
  }

  async createPayPalOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const credentials = await this.getPayPalCredentials()
    return this.paypalProvider.createOrder(credentials, params)
  }

  async capturePayPalOrder(params: CaptureOrderParams): Promise<ProcessedPaymentResult> {
    const credentials = await this.getPayPalCredentials()
    const capture = await this.paypalProvider.captureOrder(credentials, params)

    if (capture.status !== "completed") {
      throw new Error("PayPal payment capture was not completed.")
    }

    return this.applyPaymentLedgerAndUpdateMembership({
      accountId: params.accountId,
      userId: params.userId,
      tier: params.tier,
      provider: "paypal",
      providerTransactionId: capture.captureId,
      amount: capture.amount,
      notes: params.notes || "PayPal Online Payment",
    })
  }

  async recordManualPayment(params: RecordManualPaymentParams): Promise<ProcessedPaymentResult> {
    const manualResult = this.manualProvider.processManualPayment(params)
    return this.applyPaymentLedgerAndUpdateMembership({
      accountId: params.accountId,
      userId: params.userId,
      tier: params.tier,
      provider: params.provider,
      providerTransactionId: manualResult.providerTransactionId,
      amount: params.amount,
      notes: params.notes || `Manual ${params.provider} payment recorded`,
      recordedByUserId: params.recordedByUserId,
    })
  }

  private async applyPaymentLedgerAndUpdateMembership(opts: {
    accountId: string
    userId: number | string
    tier: "individual" | "household"
    provider: "paypal" | "check" | "cash" | "manual" | "other"
    providerTransactionId: string
    amount: number
    notes?: string
    recordedByUserId?: number | string
  }): Promise<ProcessedPaymentResult> {
    const payload = await getPayload({ config: configPromise })
    const paymentId = ulid()
    const paidAtDate = new Date()

    // 1. Save entry to Payments collection
    await payload.create({
      collection: "payments" as any,
      data: {
        paymentId,
        accountId: opts.accountId,
        user: opts.userId,
        provider: opts.provider,
        providerTransactionId: opts.providerTransactionId,
        amount: opts.amount,
        currency: "USD",
        status: "completed",
        paidAt: paidAtDate.toISOString(),
        notes: opts.notes || "",
        recordedBy: opts.recordedByUserId || undefined,
      },
    })

    // 2. Query trailing 365 days of payments to check annual threshold
    const oneYearAgo = new Date(paidAtDate.getTime() - 365 * 24 * 60 * 60 * 1000)
    const recentPayments = await payload.find({
      collection: "payments" as any,
      where: {
        accountId: { equals: opts.accountId },
        status: { equals: "completed" },
        paidAt: { greater_than_equal: oneYearAgo.toISOString() },
      },
      limit: 100,
    })

    const totalPaidCurrentYear = recentPayments.docs.reduce((sum: number, doc: any) => sum + (doc.amount || 0), 0)
    const requiredDues = await this.getDuesAmount(opts.tier)
    const isAnnualPayingMember = totalPaidCurrentYear >= requiredDues

    const validUntilDate = new Date(paidAtDate.getTime() + 365 * 24 * 60 * 60 * 1000)

    // 3. Upsert Membership record
    const existingMembership = await payload.find({
      collection: "memberships" as any,
      where: {
        accountId: { equals: opts.accountId },
      },
      limit: 1,
    })

    if (existingMembership.docs.length > 0) {
      const docId = existingMembership.docs[0].id
      await payload.update({
        collection: "memberships" as any,
        id: docId,
        data: {
          tier: opts.tier,
          status: "active",
          isAnnualPayingMember,
          totalPaidCurrentYear,
          validUntil: validUntilDate.toISOString(),
        },
      })
    } else {
      await payload.create({
        collection: "memberships" as any,
        data: {
          accountId: opts.accountId,
          user: opts.userId,
          tier: opts.tier,
          status: "active",
          isAnnualPayingMember,
          totalPaidCurrentYear,
          validUntil: validUntilDate.toISOString(),
        },
      })
    }

    return {
      success: true,
      paymentId,
      accountId: opts.accountId,
      amount: opts.amount,
      status: "completed",
      isAnnualPayingMember,
      validUntil: validUntilDate.toISOString(),
      message: isAnnualPayingMember
        ? "Payment confirmed. You are an active annual paying member!"
        : "Payment recorded.",
    }
  }
}
