export { getPlatformServerURLFromHost, getTenantURL } from "@/utilities/tenantUrl"

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"

/** True when Playwright targets a remote (non-local) deployment. */
export function isRemoteTestEnv(): boolean {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
  return !baseURL.includes("localhost") && !baseURL.includes("127.0.0.1")
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
