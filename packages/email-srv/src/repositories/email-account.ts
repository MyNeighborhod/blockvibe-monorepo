import { eq } from "drizzle-orm"
import { getEmailSrvDb } from "../client/index.js"
import { emailAccounts } from "../schema/schema.js"
import type { EmailAccountRecord, UpsertEmailAccountInput } from "../types/index.js"

function mapRow(row: typeof emailAccounts.$inferSelect): EmailAccountRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    provider: row.provider,
    senderEmail: row.senderEmail,
    refreshToken: row.refreshToken,
    connectedAt: row.connectedAt,
    connectedByUserId: row.connectedByUserId,
  }
}

export async function getEmailAccountByTenantId(
  tenantId: number
): Promise<EmailAccountRecord | null> {
  const db = getEmailSrvDb()
  const rows = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.tenantId, tenantId))
    .limit(1)

  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function upsertEmailAccount(
  input: UpsertEmailAccountInput
): Promise<EmailAccountRecord> {
  const db = getEmailSrvDb()
  const provider = input.provider ?? "gmail"
  const now = new Date()

  const rows = await db
    .insert(emailAccounts)
    .values({
      tenantId: input.tenantId,
      provider,
      senderEmail: input.senderEmail,
      refreshToken: input.refreshToken,
      connectedAt: now,
      connectedByUserId: input.connectedByUserId ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: emailAccounts.tenantId,
      set: {
        provider,
        senderEmail: input.senderEmail,
        refreshToken: input.refreshToken,
        connectedAt: now,
        connectedByUserId: input.connectedByUserId ?? null,
        updatedAt: now,
      },
    })
    .returning()

  return mapRow(rows[0])
}

export async function deleteEmailAccountByTenantId(tenantId: number): Promise<void> {
  const db = getEmailSrvDb()
  await db.delete(emailAccounts).where(eq(emailAccounts.tenantId, tenantId))
}
