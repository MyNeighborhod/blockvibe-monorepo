/**
 * Per-environment defaults for tenant transactional email (seed + remote configure scripts).
 * Runtime sending always prefers tenant DB fields; these are used when seeding or migrating.
 */

export type TenantEmailDefaults = {
  domain: string
  organizationLegalName: string
  is501c3: boolean
  transactionalEmailFrom: string
  transactionalEmailFromName: string
  emailDeliveryDefault: "ses" | "gmail"
}

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
const STAGING_DOMAIN = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"

function platformFromAddress(): string {
  return process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org"
}

function platformFromName(): string {
  return process.env.SMTP_FROM_NAME || "BlockVibe"
}

/** Staging: NOG on nog.staging.blockvibe.org, mail from verified blockvibe.org SES identity. */
export function getNogTenantEmailDefaultsStaging(): TenantEmailDefaults {
  return {
    domain: `nog.${STAGING_DOMAIN}`,
    organizationLegalName: "North of Grand Neighborhood Association",
    is501c3: true,
    transactionalEmailFrom:
      process.env.TENANT_NOG_TRANSACTIONAL_EMAIL_FROM || platformFromAddress(),
    transactionalEmailFromName:
      process.env.TENANT_NOG_TRANSACTIONAL_EMAIL_FROM_NAME ||
      `${platformFromName()} — North of Grand (Staging)`,
    emailDeliveryDefault: "ses",
  }
}

/** Production: NOG custom domain + @northofgranddsm.org From (SES-verified). */
export function getNogTenantEmailDefaultsProduction(): TenantEmailDefaults {
  return {
    domain: "www.northofgranddsm.org",
    organizationLegalName: "North of Grand Neighborhood Association",
    is501c3: true,
    transactionalEmailFrom:
      process.env.TENANT_NOG_TRANSACTIONAL_EMAIL_FROM ||
      "northofgrandpresident@northofgranddsm.org",
    transactionalEmailFromName:
      process.env.TENANT_NOG_TRANSACTIONAL_EMAIL_FROM_NAME ||
      "North of Grand Neighborhood Association",
    emailDeliveryDefault: "ses",
  }
}

/** Production subdomain fallback when custom domain is not in use. */
export function getNogTenantSubdomainProduction(): string {
  return `nog.${PLATFORM_DOMAIN}`
}
