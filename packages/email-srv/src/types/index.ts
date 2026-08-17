export type EmailProvider = "gmail"

export interface EmailAccountRecord {
  id: number
  tenantId: number
  provider: EmailProvider
  senderEmail: string
  refreshToken: string
  connectedAt: Date
  connectedByUserId: number | null
}

export interface UpsertEmailAccountInput {
  tenantId: number
  senderEmail: string
  refreshToken: string
  provider?: EmailProvider
  connectedByUserId?: number
}

export function isEmailAccountConnected(
  account: Pick<EmailAccountRecord, "senderEmail" | "refreshToken"> | null | undefined
): boolean {
  return Boolean(account?.refreshToken?.trim() && account?.senderEmail?.trim())
}
