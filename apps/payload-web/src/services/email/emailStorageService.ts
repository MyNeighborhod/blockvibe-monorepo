import { archiveSentEmailInMicroservice, type ArchiveEmailInput } from "@blockvibe/email-srv"
import type { Tenant } from "@/payload-types"

export type ArchiveEmailParams = {
  to: string
  from: string
  subject: string
  html: string
  text?: string
  isTransactional?: boolean
  tenant?: Partial<Tenant> | number | string | null
  tenantSlug?: string
}

export async function archiveSentEmail(
  params: ArchiveEmailParams,
): Promise<{ emailId: string; s3Uri: string }> {
  let tenantSlug = params.tenantSlug || "nog"

  if (params.tenant && typeof params.tenant === "object" && params.tenant.slug) {
    tenantSlug = params.tenant.slug
  }

  const input: ArchiveEmailInput = {
    to: params.to,
    from: params.from,
    subject: params.subject,
    html: params.html,
    text: params.text,
    isTransactional: params.isTransactional ?? true,
    tenantSlug,
  }

  const result = await archiveSentEmailInMicroservice(input)
  return { emailId: result.emailId, s3Uri: result.s3Uri }
}
