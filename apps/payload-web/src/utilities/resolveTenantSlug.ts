const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
const STAGING_DOMAIN = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.com"

/** Hostname → tenant slug used in routes and database lookups. */
export function resolveTenantSlugFromHost(hostname: string): string {
  const host = hostname.split(":")[0]

  // 1. Staging Domain: staging.blockvibe.com
  if (host === STAGING_DOMAIN) {
    return "default"
  }
  if (host.endsWith(`.${STAGING_DOMAIN}`)) {
    const slug = host.replace(`.${STAGING_DOMAIN}`, "")
    return slug
  }

  // 2. Production Domain: blockvibe.org
  if (host === PLATFORM_DOMAIN || host === `info.${PLATFORM_DOMAIN}`) {
    return "default"
  }
  if (host.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const slug = host.replace(`.${PLATFORM_DOMAIN}`, "")
    return slug
  }

  // 3. Local Dev fallback
  if (host === "localhost" || host === "127.0.0.1") {
    return "default"
  }
  if (host.endsWith(".localhost")) {
    const slug = host.split(".")[0]
    return slug
  }

  return host
}

/** True for the default / North of Grand tenant (current slug or legacy `nog`). */
export function isDefaultNogTenant(slug: string | null | undefined): boolean {
  return slug === "default" || slug === "nog"
}

type TenantLike = { slug?: string | null; name?: string | null } | null | undefined

/** True when the tenant record is North of Grand (not a generic Payload template default). */
export function isNorthOfGrandTenant(tenant: TenantLike): boolean {
  if (!tenant?.slug) return false
  return tenant.slug === "nog"
}

/** Use NOG header/footer chrome and theme when the tenant is actually North of Grand. */
export function shouldUseNogChrome(tenant: TenantLike): boolean {
  return isNorthOfGrandTenant(tenant)
}
