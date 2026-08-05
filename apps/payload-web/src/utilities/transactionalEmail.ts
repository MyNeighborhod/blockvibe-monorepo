import type { Payload } from "payload"
import type { Tenant } from "@/payload-types"
import { archiveSentEmail } from "@/services/email/emailStorageService"

export type TransactionalEmailFrom = {
  address: string
  name: string
}

type TenantLike = Partial<Tenant> | null | undefined

/** Platform-wide fallback from environment (.env.staging / .env.production). */
function getPlatformTransactionalDefaults(): TransactionalEmailFrom {
  return {
    address: process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org",
    name: process.env.SMTP_FROM_NAME || "BlockVibe",
  }
}

/**
 * Resolve transactional From for a tenant.
 * Order: tenant DB fields → platform env (SMTP_FROM_ADDRESS / SMTP_FROM_NAME).
 */
export function resolveTransactionalEmailFrom(tenant?: TenantLike): TransactionalEmailFrom {
  const platform = getPlatformTransactionalDefaults()

  const address = tenant?.transactionalEmailFrom?.trim() || platform.address
  const name =
    tenant?.transactionalEmailFromName?.trim() ||
    tenant?.organizationLegalName?.trim() ||
    platform.name ||
    tenant?.name?.trim() ||
    "BlockVibe"

  return { address, name }
}

export function formatEmailFrom(from: TransactionalEmailFrom): string {
  const safeName = from.name.replace(/"/g, "")
  return `"${safeName}" <${from.address}>`
}

export async function sendTransactionalEmail(
  payload: Payload,
  params: {
    to: string
    subject: string
    html: string
    tenant?: TenantLike
    isTransactional?: boolean
  },
): Promise<void> {
  const from = resolveTransactionalEmailFrom(params.tenant)
  const formattedFrom = formatEmailFrom(from)

  await payload.sendEmail({
    to: params.to,
    subject: params.subject,
    html: params.html,
    from: formattedFrom,
  })

  // Archive sent email to AWS S3 & record in sent_emails collection
  try {
    await archiveSentEmail(payload, {
      to: params.to,
      from: formattedFrom,
      subject: params.subject,
      html: params.html,
      isTransactional: params.isTransactional ?? true,
      tenant: params.tenant,
    })
  } catch (archiveErr) {
    console.error("[sendTransactionalEmail] Failed to archive sent email:", archiveErr)
  }
}
