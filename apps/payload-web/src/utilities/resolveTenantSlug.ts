const PLATFORM_DOMAIN = "blockvibe.org"

/** Hostname → tenant slug used in routes and database lookups. */
export function resolveTenantSlugFromHost(hostname: string): string {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "default"
  }

  if (hostname.endsWith(".localhost")) {
    const slug = hostname.split(".")[0]
    return slug
  }

  if (hostname === `info.${PLATFORM_DOMAIN}` || hostname === PLATFORM_DOMAIN) {
    return "default"
  }

  if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const slug = hostname.replace(`.${PLATFORM_DOMAIN}`, "")
    return slug
  }

  return hostname
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
