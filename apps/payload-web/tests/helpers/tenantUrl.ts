const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"

/** True when Playwright targets a remote (non-local) deployment. */
export function isRemoteTestEnv(): boolean {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
  return !baseURL.includes("localhost") && !baseURL.includes("127.0.0.1")
}

/**
 * Build a tenant-scoped base URL from the Playwright base URL.
 * - Local: http://localhost:3000 + nog → http://nog.localhost:3000
 * - Prod:  https://blockvibe.org + nog → https://nog.blockvibe.org
 * - Staging: https://staging.blockvibe.org + nog → https://nog.staging.blockvibe.org
 */
export function getTenantURL(baseURL: string, slug: string): string {
  const url = new URL(baseURL)

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    url.hostname = `${slug}.localhost`
    return url.toString()
  }

  const stagingDomain = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"
  if (url.hostname === stagingDomain) {
    url.hostname = `${slug}.${stagingDomain}`
    return url.toString()
  }
  if (url.hostname.endsWith(`.${stagingDomain}`)) {
    url.hostname = `${slug}.${stagingDomain}`
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

/** Expected hostname for the NOG example-site link on the platform landing page. */
export function expectedNogExampleHost(baseURL: string): string {
  const url = new URL(baseURL)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return "nog.localhost"
  }
  const stagingDomain = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"
  if (url.hostname.endsWith(stagingDomain)) {
    return `nog.${stagingDomain}`
  }
  return `nog.${PLATFORM_DOMAIN}`
}
