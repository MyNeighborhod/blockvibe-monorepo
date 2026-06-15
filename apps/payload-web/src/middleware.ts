import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { resolveTenantSlugFromHost } from "@/utilities/resolveTenantSlug"

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  // 1. Skip static assets, Next.js internal files, favicon, API, and admin routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/next") ||
    pathname.includes(".") // matches files with extensions like favicon.ico, webp, png, etc.
  ) {
    return NextResponse.next()
  }

  const host = request.headers.get("host") || ""
  const hostname = host.split(":")[0]
  const tenantSlug = resolveTenantSlugFromHost(hostname)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-slug", tenantSlug)

  return NextResponse.rewrite(new URL(`/${tenantSlug}${pathname}${url.search}`, request.url), {
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    // Match all routes except API and static assets
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
