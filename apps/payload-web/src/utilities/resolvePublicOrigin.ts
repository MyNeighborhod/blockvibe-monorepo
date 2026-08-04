function isLocalHost(value: string): boolean {
  return (
    value.includes("0.0.0.0") ||
    value.includes("127.0.0.1") ||
    value.includes("localhost")
  )
}

/** Resolve the public site origin from request headers (custom domain aware). */
export function resolvePublicOriginFromRequest(req: Request): string {
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const cleanHost = hostHeader.split(":")[0]
  const proto = req.headers.get("x-forwarded-proto") || "https"

  if (cleanHost && !isLocalHost(cleanHost)) {
    return `${proto}://${cleanHost}`
  }

  const fromEnv = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "")
  if (fromEnv && !isLocalHost(fromEnv)) {
    return fromEnv
  }

  return "https://www.northofgranddsm.org"
}

/** Resolve public origin from Next.js header map (server actions / route handlers). */
export function resolvePublicOriginFromHeaders(headers: Headers): string {
  const hostHeader = headers.get("x-forwarded-host") || headers.get("host") || ""
  const cleanHost = hostHeader.split(":")[0]
  const proto = headers.get("x-forwarded-proto") || "https"

  if (cleanHost && !isLocalHost(cleanHost)) {
    return `${proto}://${cleanHost}`
  }

  const fromEnv = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "")
  if (fromEnv && !isLocalHost(fromEnv)) {
    return fromEnv
  }

  return "https://www.northofgranddsm.org"
}
