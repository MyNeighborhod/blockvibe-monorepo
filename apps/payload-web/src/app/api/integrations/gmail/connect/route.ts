import configPromise from "@payload-config"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import { getPayload } from "payload"
import type { User } from "@/payload-types"
import { assertCanManageTenantEmailSettings } from "@/utilities/tenantEmailAccess"
import {
  buildGoogleAuthorizeUrl,
  isGoogleOAuthConfigured,
  mintGmailOAuthState,
} from "@/utilities/gmailOAuth"

async function getRequestUser(): Promise<User | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.auth({ headers: await headers() })
  return (result.user as User | null) ?? null
}

export async function GET(request: Request) {
  try {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.json(
        { message: "Google OAuth is not configured on this server." },
        { status: 503 },
      )
    }

    const user = await getRequestUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const tenantId = Number(url.searchParams.get("tenantId"))
    const tenantSlug = url.searchParams.get("tenantSlug")?.trim()

    if (!tenantId || !tenantSlug) {
      return NextResponse.json(
        { message: "tenantId and tenantSlug are required." },
        { status: 400 },
      )
    }

    assertCanManageTenantEmailSettings(user, tenantId)

    const state = mintGmailOAuthState({
      tenantId,
      tenantSlug,
      userId: user.id,
    })

    const authorizeUrl = buildGoogleAuthorizeUrl(state, request)
    return NextResponse.redirect(authorizeUrl)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start Gmail OAuth."
    return NextResponse.json({ message }, { status: 403 })
  }
}
