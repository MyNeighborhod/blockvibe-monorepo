import { headers } from "next/headers"

import { resolveTenantSlugFromHost } from "./resolveTenantSlug"

/** Tenant slug for the current request (set by middleware or derived from Host). */
export async function getRequestTenantSlug(): Promise<string> {
  const requestHeaders = await headers()
  const fromMiddleware = requestHeaders.get("x-tenant-slug")

  if (fromMiddleware) {
    return fromMiddleware
  }

  const host = requestHeaders.get("host") || ""
  return resolveTenantSlugFromHost(host.split(":")[0])
}
