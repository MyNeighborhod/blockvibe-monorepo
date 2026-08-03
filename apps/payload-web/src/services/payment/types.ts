export type PaymentProviderType = "paypal" | "check" | "cash" | "manual" | "other"

export type MembershipTier = "individual" | "household"

export interface CreateOrderParams {
  accountId: string
  userId: number | string
  tier: MembershipTier
  amount: number
  currency?: string
  notes?: string
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
  notes?: string
}

export interface RecordManualPaymentParams {
  accountId: string
  userId: number | string
  tier: MembershipTier
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
  environment: "sandbox" | "live"
}
