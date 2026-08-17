import type { Payload } from "payload"
import {
  resolveTransactionalEmailFrom,
  sendTransactionalEmail,
} from "@/utilities/transactionalEmail"
import { getServerSideURL } from "@/utilities/getURL"

export const APPROVED_BUSINESSES_LIST_NAME = "Approved Businesses"

export const RESIDENT_CATEGORY_FIELD = {
  label: "Resident Category",
  key: "residentCategory",
  fieldType: "select" as const,
  options: [
    { value: "Landlord" },
    { value: "Tenant" },
    { value: "Homeowner Resident" },
    { value: "HOA Board Member" },
  ],
}

function tenantPublicOrigin(tenant: any): string {
  const domain = typeof tenant?.domain === "string" ? tenant.domain.trim() : ""
  if (domain && !domain.includes("localhost")) {
    const host = domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }
  const slug = tenant?.slug
  const base = getServerSideURL().replace(/\/$/, "")
  try {
    const url = new URL(base)
    if (slug && (url.hostname === "localhost" || url.hostname.endsWith("blockvibe.org"))) {
      // Prefer path-style or subdomain; staging/prod use subdomains
      if (url.hostname.includes("staging")) {
        return `https://${slug}.staging.blockvibe.org`
      }
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return `http://${slug}.localhost:${url.port || "3000"}`
      }
      return `https://${slug}.blockvibe.org`
    }
  } catch {
    // fall through
  }
  return base
}

function toNumericTenantId(tenantId: string | number): number {
  return typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
}

/** Ensure dynamic mailing list targeting memberType=business exists for the tenant. */
export async function ensureApprovedBusinessesMailingList(
  payload: Payload,
  tenantId: string | number,
): Promise<void> {
  const numericTenantId = toNumericTenantId(tenantId)
  const existing = await payload.find({
    collection: "mailing-lists",
    where: {
      and: [
        { tenant: { equals: numericTenantId } },
        { name: { equals: APPROVED_BUSINESSES_LIST_NAME } },
      ],
    },
    limit: 1,
  })

  if (existing.docs.length > 0) return

  await payload.create({
    collection: "mailing-lists",
    data: {
      name: APPROVED_BUSINESSES_LIST_NAME,
      description:
        "Auto-includes CRM contacts with Member Type = business (directory registrants and business members).",
      type: "dynamic",
      rules: [{ field: "memberType", operator: "equals", value: "business" }],
      tenant: numericTenantId,
    },
    overrideAccess: true,
  })
}

/** Seed Resident Category custom attribute if missing (Landlord / Tenant / Homeowner / …). */
export async function ensureResidentCategoryCrmField(
  payload: Payload,
  tenantId: string | number,
): Promise<void> {
  const numericTenantId = toNumericTenantId(tenantId)
  const existing = await payload.find({
    collection: "crm-fields",
    where: {
      and: [
        { tenant: { equals: numericTenantId } },
        { key: { equals: RESIDENT_CATEGORY_FIELD.key } },
      ],
    },
    limit: 1,
  })

  if (existing.docs.length > 0) return

  await payload.create({
    collection: "crm-fields",
    data: {
      label: RESIDENT_CATEGORY_FIELD.label,
      key: RESIDENT_CATEGORY_FIELD.key,
      fieldType: RESIDENT_CATEGORY_FIELD.fieldType,
      options: RESIDENT_CATEGORY_FIELD.options,
      tenant: numericTenantId,
    },
    overrideAccess: true,
  })
}

/** Email the business owner when their listing is approved for the public directory. */
export async function sendBusinessDirectoryApprovalEmail(
  payload: Payload,
  params: {
    tenant: any
    businessName: string
    email: string
  },
): Promise<void> {
  const { tenant, businessName, email } = params
  const from = resolveTransactionalEmailFrom(tenant)
  const origin = tenantPublicOrigin(tenant)
  const loginUrl = `${origin}/login`
  const myBusinessUrl = `${origin}/dashboard/my-business`
  const directoryUrl = `${origin}/businesses`

  await sendTransactionalEmail(payload, {
    to: email,
    subject: `You're listed in the ${from.name} business directory`,
    tenant,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">You're listed!</h2>
        <p style="color: #334155; font-size: 16px; line-height: 24px;">
          <strong>${escapeHtml(businessName)}</strong> is now approved and appears in the
          <a href="${directoryUrl}">neighborhood business directory</a>.
        </p>
        <p style="color: #334155; font-size: 16px; line-height: 24px;">
          Your email (<strong>${escapeHtml(email)}</strong>) is in our neighborhood CRM as a business contact.
          To sign in and manage your listing:
        </p>
        <ol style="color: #334155; font-size: 16px; line-height: 24px; padding-left: 20px;">
          <li>Open <a href="${loginUrl}">Login</a> and use <strong>Forgot password</strong> to set a password (recommended first time), or</li>
          <li>After signing in, open <a href="${myBusinessUrl}">My Business</a> to update your profile and change your password anytime.</li>
        </ol>
        <div style="margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #76b3b8; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 6px; display: inline-block;">
            Set your password / Sign in
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 20px;">
          If you did not submit this business, you can ignore this email.
        </p>
      </div>
    `,
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
