export type PaymentProviderType = "paypal" | "check" | "cash" | "manual" | "other"

export type MembershipTier = "individual" | "household" | "business" | string
export type MemberCategory = "residential" | "business"
export type RecurringFrequency = "annual" | "monthly" | "yearly" | "one_time"

export interface BusinessTierConfig {
  id?: string
  name: string
  slug: string
  description?: string
  amount: number
  frequency: RecurringFrequency
  active?: boolean
}

export interface CreateOrderParams {
  accountId: string
  userId: number | string
  tier: MembershipTier
  memberCategory?: MemberCategory
  businessTierSlug?: string
  recurringFrequency?: RecurringFrequency
  amount: number
  currency?: string
  notes?: string
  userEmail?: string
  /** Public site origin for PayPal return/cancel URLs (e.g. https://www.northofgranddsm.org). */
  siteOrigin?: string
}

export interface CreateOrderResult {
  orderId: string
  approvalUrl?: string
  provider: PaymentProviderType
  amount: number
  currency: string
}

export interface CaptureOrderParams {
  orderId: string
  accountId: string
  userId: number | string
  tier: MembershipTier
  memberCategory?: MemberCategory
  businessTierSlug?: string
  recurringFrequency?: RecurringFrequency
  notes?: string
}

export interface RecordManualPaymentParams {
  accountId: string
  userId: number | string
  tier: MembershipTier
  memberCategory?: MemberCategory
  businessTierSlug?: string
  recurringFrequency?: RecurringFrequency
  provider: "check" | "cash" | "manual" | "other"
  amount: number
  providerTransactionId?: string
  notes?: string
  recordedByUserId?: number | string
}

export interface ProcessedPaymentResult {
  success: boolean
  paymentId: string
  accountId: string
  amount: number
  status: "completed" | "pending" | "failed"
  isAnnualPayingMember: boolean
  validUntil: string
  message?: string
}

export interface PayPalCredentials {
  clientId: string
  clientSecret: string
  environment: "sandbox" | "live" | "mock"
}
