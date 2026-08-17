import configPromise from "@payload-config"
import { NextResponse } from "next/server"
import { getPayload } from "payload"
import {
  exchangeGoogleAuthCode,
  fetchGoogleAccountEmail,
  verifyGmailOAuthState,
} from "@/utilities/gmailOAuth"
import { getEmailAccountForTenant, upsertEmailAccountForTenant } from "@/utilities/emailSrvAccount"
import { getPlatformServerURLFromHost, getTenantURL } from "@/utilities/tenantUrl"

function peekTenantSlugFromState(state: string | null): string | undefined {
  if (!state) return undefined
  try {
    const [payloadB64] = state.split(".")
    if (!payloadB64) return undefined
    const claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      tenantSlug?: string
    }
    return typeof claims.tenantSlug === "string" ? claims.tenantSlug : undefined
  } catch {
    return undefined
  }
}

function resolveRedirectTenantSlug(state: string | null, fallback = "default"): string {
  return peekTenantSlugFromState(state) || fallback
}

function settingsRedirect(request: Request, tenantSlug: string, params: Record<string, string>) {
  const requestUrl = new URL(request.url)
  const host = request.headers.get("host") || requestUrl.host
  const [hostname, port] = host.split(":")
  const protocol =
    request.headers.get("x-forwarded-proto") === "http" ? "http:" : requestUrl.protocol || "https:"
  const platformBase = getPlatformServerURLFromHost(hostname, protocol, port)
  const tenantBase = getTenantURL(platformBase, tenantSlug)
  const redirectUrl = new URL("/dashboard/settings", tenantBase)
  for (const [key, value] of Object.entries(params)) {
    redirectUrl.searchParams.set(key, value)
  }
  return NextResponse.redirect(redirectUrl)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const oauthError = url.searchParams.get("error")
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (oauthError) {
    const tenantSlug = resolveRedirectTenantSlug(state)
    return settingsRedirect(request, tenantSlug, {
      gmail: "error",
      code: oauthError === "redirect_uri_mismatch" ? "redirect_mismatch" : oauthError,
    })
  }

  if (!code || !state) {
    const tenantSlug = resolveRedirectTenantSlug(state)
    return settingsRedirect(request, tenantSlug, { gmail: "error", code: "missing_code" })
  }

  let tenantSlug = "default"
  try {
    const claims = verifyGmailOAuthState(state)
    tenantSlug = claims.tenantSlug

    const tokenResponse = await exchangeGoogleAuthCode(code, request)
    let refreshToken = tokenResponse.refresh_token
    if (!refreshToken) {
      const existing = await getEmailAccountForTenant(claims.tenantId)
      refreshToken = existing?.refreshToken ?? undefined
    }
    if (!refreshToken) {
      return settingsRedirect(request, tenantSlug, {
        gmail: "error",
        code: "missing_refresh_token",
      })
    }

    const senderEmail = await fetchGoogleAccountEmail(tokenResponse.access_token)

    const payload = await getPayload({ config: configPromise })

    await upsertEmailAccountForTenant({
      tenantId: claims.tenantId,
      senderEmail,
      refreshToken,
      connectedByUserId: claims.userId,
    })

    await payload.update({
      collection: "tenants",
      id: claims.tenantId,
      data: {
        emailDeliveryDefault: "gmail",
      },
      overrideAccess: true,
    })

    return settingsRedirect(request, tenantSlug, { gmail: "connected" })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "callback_failed"
    const codeParam =
      message.includes("redirect_uri") || message.includes("Redirect URI")
        ? "redirect_mismatch"
        : "callback_failed"
    return settingsRedirect(request, tenantSlug, {
      gmail: "error",
      code: codeParam,
      detail: message,
    })
  }
}

export const dynamic = "force-dynamic"
