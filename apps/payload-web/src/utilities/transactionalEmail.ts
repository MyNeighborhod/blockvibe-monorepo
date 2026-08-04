import type { Payload } from "payload"
import type { Tenant } from "@/payload-types"

export type TransactionalEmailFrom = {
  address: string
  name: string
}

type TenantLike = Partial<Tenant> | null | undefined

const PLATFORM_DEFAULTS: TransactionalEmailFrom = {
  address: process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org",
  name: process.env.SMTP_FROM_NAME || "BlockVibe",
}

const SLUG_DEFAULTS: Record<string, TransactionalEmailFrom> = {
  nog: {
    address: process.env.NOG_SMTP_FROM_ADDRESS || "northofgrandpresident@northofgranddsm.org",
    name: process.env.NOG_SMTP_FROM_NAME || "North of Grand Neighborhood Association",
  },
  default: PLATFORM_DEFAULTS,
}

export function resolveTransactionalEmailFrom(tenant?: TenantLike): TransactionalEmailFrom {
  const slug = tenant?.slug || "default"
  const slugDefaults = SLUG_DEFAULTS[slug] || PLATFORM_DEFAULTS

  const address =
    tenant?.transactionalEmailFrom?.trim() || slugDefaults.address || PLATFORM_DEFAULTS.address

  const name =
    tenant?.transactionalEmailFromName?.trim() ||
    tenant?.organizationLegalName?.trim() ||
    slugDefaults.name ||
    tenant?.name?.trim() ||
    PLATFORM_DEFAULTS.name

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
