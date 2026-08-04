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
  MembershipTier,
  MemberCategory,
  RecurringFrequency,
} from "./types"

export class PaymentService {
  private paypalProvider = new PayPalProvider()
  private manualProvider = new ManualCheckProvider()

  private async getPayPalCredentials(): Promise<PayPalCredentials> {
    try {
      const payload = await getPayload({ config: configPromise })
      const settings = await payload.findGlobal({ slug: "payment-settings" as any })

      let clientId = (settings as any)?.paypalClientId || process.env.PAYPAL_CLIENT_ID || ""
      let clientSecret = (settings as any)?.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET || ""
      let environment = ((settings as any)?.paypalEnvironment || process.env.PAYPAL_ENVIRONMENT || "live") as "sandbox" | "live"

      // Fail-safe fallback to live production credentials if DB settings are empty or set to mock
      if (!clientId || clientId === "mock" || clientId === "stub") {
        clientId = "Ad8WBOLNrxmM9DooNvS9dFqFYPRnjlF944D_n-l2Em-CKCeVhJE5BAfr2ZkEW1XyQYIJluMIOfesL0qo"
        clientSecret = "EBNQTY6CVH30Wa_VtpCeMYKXehos062hJeemWl1pCIcFlAauY2j-tLzBI1nRCp3BP2CgPMAwLVJ8_sSC"
        environment = "live"
      }

      if (clientId && clientId.length > 20 && (environment === ("mock" as any))) {
        environment = "live"
      }

      return { clientId, clientSecret, environment }
    } catch {
      return {
        clientId: "Ad8WBOLNrxmM9DooNvS9dFqFYPRnjlF944D_n-l2Em-CKCeVhJE5BAfr2ZkEW1XyQYIJluMIOfesL0qo",
        clientSecret: "EBNQTY6CVH30Wa_VtpCeMYKXehos062hJeemWl1pCIcFlAauY2j-tLzBI1nRCp3BP2CgPMAwLVJ8_sSC",
        environment: "live",
      }
    }
  }

  async getDuesAmount(tier: MembershipTier, businessSlug?: string): Promise<number> {
    try {
      const payload = await getPayload({ config: configPromise })
      const settings = await payload.findGlobal({ slug: "payment-settings" as any })

      if (tier === "business" && businessSlug) {
        const businessTiers = (settings as any)?.businessTiers || []
        const matched = businessTiers.find((b: any) => b.slug === businessSlug)
        if (matched) return matched.amount
      }

      if (tier === "household") {
        return (settings as any)?.householdDuesAmount || 20
      }
      return (settings as any)?.individualDuesAmount || 10
    } catch {
      if (tier === "household") return 20
      return 10
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

    try {
      return await this.applyPaymentLedgerAndUpdateMembership({
        accountId: params.accountId,
        userId: params.userId,
        tier: params.tier,
        memberCategory: params.memberCategory,
        businessTierSlug: params.businessTierSlug,
        recurringFrequency: params.recurringFrequency,
        provider: "paypal",
        providerTransactionId: capture.captureId,
        amount: capture.amount,
        notes: params.notes || "PayPal Online Payment",
      })
    } catch (err: any) {
      console.error("[CRITICAL FAILURE] Payment captured via PayPal but post-processing failed:", err)

      try {
        const payload = await getPayload({ config: configPromise })
        await payload.sendEmail({
          to: "eugen8@gmail.com",
          subject: "🚨 ALERT: PayPal Payment Captured But Post-Processing Failed",
          html: `
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
              <h2 style="color: #dc2626;">🚨 Emergency Alert: Payment Post-Processing Failed</h2>
              <p>A payment was <strong>successfully captured via PayPal</strong>, but updating the database (payment ledger entry or activating membership status) encountered a failure.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="font-weight: bold; padding: 6px; width: 180px;">PayPal Transaction ID:</td><td>${capture.captureId}</td></tr>
                <tr><td style="font-weight: bold; padding: 6px;">Amount Captured:</td><td>$${capture.amount.toFixed(2)}</td></tr>
                <tr><td style="font-weight: bold; padding: 6px;">Account ID (ULID):</td><td>${params.accountId}</td></tr>
                <tr><td style="font-weight: bold; padding: 6px;">User ID:</td><td>${params.userId}</td></tr>
                <tr><td style="font-weight: bold; padding: 6px;">Tier:</td><td>${params.tier}</td></tr>
                <tr><td style="font-weight: bold; padding: 6px;">Error Trace:</td><td style="color: #dc2626; font-family: monospace;">${err.message || String(err)}</td></tr>
              </table>
              <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Please review the Payload CMS admin dashboard or database logs to verify this account.</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error("Failed to send emergency alert email to eugen8@gmail.com:", emailErr)
      }

      throw new Error(`Payment captured (${capture.captureId}) but post-processing error occurred: ${err.message}`)
    }
  }

  async recordManualPayment(params: RecordManualPaymentParams): Promise<ProcessedPaymentResult> {
    const manualResult = this.manualProvider.processManualPayment(params)
    return this.applyPaymentLedgerAndUpdateMembership({
      accountId: params.accountId,
      userId: params.userId,
      tier: params.tier,
      memberCategory: params.memberCategory,
      businessTierSlug: params.businessTierSlug,
      recurringFrequency: params.recurringFrequency,
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
    tier: MembershipTier
    memberCategory?: MemberCategory
    businessTierSlug?: string
    recurringFrequency?: RecurringFrequency
    provider: "paypal" | "check" | "cash" | "manual" | "other"
    providerTransactionId: string
    amount: number
    notes?: string
    recordedByUserId?: number | string
  }): Promise<ProcessedPaymentResult> {
    const payload = await getPayload({ config: configPromise })
    const paymentId = ulid()
    const paidAtDate = new Date()

    let parsedUserId: number | string = opts.userId
    if (typeof opts.userId === "string" && !isNaN(Number(opts.userId))) {
      parsedUserId = parseInt(opts.userId, 10)
    }

    if (!parsedUserId || (typeof parsedUserId === "number" && isNaN(parsedUserId))) {
      const userDoc = await payload.find({
        collection: "users",
        where: { accountId: { equals: opts.accountId } },
        limit: 1,
      })
      if (userDoc.docs[0]) {
        parsedUserId = userDoc.docs[0].id
      }
    }

    // 1. Save entry to Payments collection
    await payload.create({
      collection: "payments" as any,
      data: {
        paymentId,
        accountId: opts.accountId,
        user: parsedUserId,
        provider: opts.provider,
        providerTransactionId: opts.providerTransactionId,
        amount: opts.amount,
        currency: "USD",
        status: "completed",
        paidAt: paidAtDate.toISOString(),
        notes: opts.notes || "",
        recordedBy: opts.recordedByUserId ? (typeof opts.recordedByUserId === "string" && !isNaN(Number(opts.recordedByUserId)) ? parseInt(opts.recordedByUserId, 10) : opts.recordedByUserId) : undefined,
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
    const requiredDues = await this.getDuesAmount(opts.tier, opts.businessTierSlug)
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

    const membershipData = {
      memberCategory: opts.memberCategory || "residential",
      tier: opts.tier,
      businessTierSlug: opts.businessTierSlug || undefined,
      recurringFrequency: opts.recurringFrequency || "annual",
      status: "active",
      isAnnualPayingMember,
      totalPaidCurrentYear,
      validUntil: validUntilDate.toISOString(),
    }

    if (existingMembership.docs.length > 0) {
      const docId = existingMembership.docs[0].id
      await payload.update({
        collection: "memberships" as any,
        id: docId,
        data: membershipData,
      })
    } else {
      await payload.create({
        collection: "memberships" as any,
        data: {
          accountId: opts.accountId,
          user: opts.userId,
          ...membershipData,
        },
      })
    }

    // 4. Send Confirmation / 501(c)(3) Receipt Email ONLY for successful PayPal payment captures
    // Pay-later / Check options will NOT trigger a receipt email until a PayPal payment is confirmed
    if (opts.provider === "paypal") {
      try {
        const userRecord = await payload.findByID({
          collection: "users",
          id: parsedUserId as any,
        })

        if (userRecord && userRecord.email) {
          let orgName = "North of Grand Neighborhood Association"
          let is501c3 = true

          // Dynamically resolve Tenant legal details & 501(c)(3) status
          if (userRecord.tenants && userRecord.tenants.length > 0) {
            const tenantObj = userRecord.tenants[0] as any
            const tenantId = typeof tenantObj.tenant === "object" ? tenantObj.tenant?.id : tenantObj.tenant
            if (tenantId) {
              const tenantDoc = await payload.findByID({
                collection: "tenants" as any,
                id: tenantId,
              }).catch(() => null)

              if (tenantDoc) {
                orgName = (tenantDoc as any).organizationLegalName || tenantDoc.name || orgName
                is501c3 = typeof (tenantDoc as any).is501c3 === "boolean"
                  ? (tenantDoc as any).is501c3
                  : orgName.toLowerCase().includes("north of grand")
              }
            }
          }

          const dateStr = paidAtDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })

          const formattedAmount = `$${opts.amount.toFixed(2)}`
          const isDonation = opts.tier === "donation" || opts.notes?.toLowerCase().includes("donation")

          await payload.sendEmail({
            to: userRecord.email,
            subject: isDonation
              ? `Tax Receipt: Thank You for Your Donation to ${orgName}`
              : `Thank You for Your Payment - ${orgName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6366f1;">
                  <h1 style="color: #4f46e5; margin: 0; font-size: 22px;">${orgName}</h1>
                  <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Official Payment & Receipt</p>
                </div>

                <div style="padding: 20px 0;">
                  <p style="font-size: 16px;">Dear ${userRecord.name || "Neighbor"},</p>
                  <p style="font-size: 15px; line-height: 1.6;">
                    Thank you for your payment to <strong>${orgName}</strong>! Your support enables us to organize community events and maintain our neighborhood association.
                  </p>

                  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #334155; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Receipt Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Date:</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: bold;">${dateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Payment ID:</td>
                        <td style="padding: 6px 0; text-align: right; font-family: monospace;">${paymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Payment Method:</td>
                        <td style="padding: 6px 0; text-align: right; text-transform: capitalize;">${opts.provider}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                        <td style="padding: 6px 0; text-align: right; font-size: 18px; font-weight: bold; color: #16a34a;">${formattedAmount}</td>
                      </tr>
                    </table>
                  </div>

                  ${
                    is501c3
                      ? `
                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                      <strong>501(c)(3) Tax-Deductible Organization:</strong><br/>
                      ${orgName} is a registered 501(c)(3) non-profit organization. Your contribution is tax-deductible to the extent allowed by law. No goods or services were provided in exchange for this contribution.
                    </p>
                  </div>
                  `
                      : ""
                  }

                  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                    If you have any questions regarding this receipt, please contact your neighborhood association board.
                  </p>
                </div>

                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0;">${orgName}</p>
                  <p style="margin: 4px 0 0 0;">This is an automated transactional receipt for your records.</p>
                </div>
              </div>
            `,
          })
        }
      } catch (emailErr) {
        console.error("Failed to send PayPal receipt email:", emailErr)
      }
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
