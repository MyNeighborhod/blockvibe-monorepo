import {
  deleteEmailAccountByTenantId,
  getEmailAccountByTenantId,
  isEmailAccountConnected,
  upsertEmailAccount,
  type EmailAccountRecord,
} from "@blockvibe/email-srv"

export type TenantEmailAccount = EmailAccountRecord

export { isEmailAccountConnected }

export async function getEmailAccountForTenant(
  tenantId: number,
): Promise<TenantEmailAccount | null> {
  return getEmailAccountByTenantId(tenantId)
}

export async function upsertEmailAccountForTenant(input: {
  tenantId: number
  senderEmail: string
  refreshToken: string
  connectedByUserId?: number
}): Promise<TenantEmailAccount> {
  return upsertEmailAccount(input)
}

export async function deleteEmailAccountForTenant(tenantId: number): Promise<void> {
  return deleteEmailAccountByTenantId(tenantId)
}
