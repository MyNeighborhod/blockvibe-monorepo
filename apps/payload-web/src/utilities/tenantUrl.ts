const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
const STAGING_DOMAIN = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"

/**
 * Platform apex URL for OAuth callbacks and other cross-tenant server URLs.
 * Tenant hosts (e.g. nog.staging.blockvibe.org) map to the environment apex.
 */
export function getPlatformServerURLFromHost(
  hostname: string,
  protocol: string = "https:",
  port?: string,
): string {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : ":3000"
    return `http://localhost${portSuffix}`
  }

  if (hostname === STAGING_DOMAIN || hostname.endsWith(`.${STAGING_DOMAIN}`)) {
    return `${protocol}//${STAGING_DOMAIN}`
  }

  if (
    hostname === PLATFORM_DOMAIN ||
    hostname === `info.${PLATFORM_DOMAIN}` ||
    hostname.endsWith(`.${PLATFORM_DOMAIN}`)
  ) {
    return `${protocol}//${PLATFORM_DOMAIN}`
  }

  const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : ""
  return `${protocol}//${hostname}${portSuffix}`
}

/**
 * Build a tenant-scoped base URL from the platform server URL.
 * - Local: http://localhost:3000 + nog → http://nog.localhost:3000
 * - Prod:  https://info.blockvibe.org + nog → https://nog.blockvibe.org
 * - Staging: https://staging.blockvibe.org + nog → https://nog.staging.blockvibe.org
 */
export function getTenantURL(baseURL: string, slug: string): string {
  const url = new URL(baseURL)

  if (slug === "default") {
    return url.toString()
  }

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    url.hostname = `${slug}.localhost`
    return url.toString()
  }

  if (url.hostname === STAGING_DOMAIN) {
    url.hostname = `${slug}.${STAGING_DOMAIN}`
    return url.toString()
  }
  if (url.hostname.endsWith(`.${STAGING_DOMAIN}`)) {
    url.hostname = `${slug}.${STAGING_DOMAIN}`
    return url.toString()
  }

  if (url.hostname === PLATFORM_DOMAIN || url.hostname === `info.${PLATFORM_DOMAIN}`) {
    url.hostname = `${slug}.${PLATFORM_DOMAIN}`
    return url.toString()
  }

  if (url.hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    url.hostname = `${slug}.${PLATFORM_DOMAIN}`
    return url.toString()
  }

  url.hostname = `${slug}.${url.hostname}`
  return url.toString()
}
