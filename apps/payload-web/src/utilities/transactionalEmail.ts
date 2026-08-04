import type { Payload } from "payload"
import type { Tenant } from "@/payload-types"

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
  },
): Promise<void> {
  const from = resolveTransactionalEmailFrom(params.tenant)

  await payload.sendEmail({
    to: params.to,
    subject: params.subject,
    html: params.html,
    from: formatEmailFrom(from),
  })
}
