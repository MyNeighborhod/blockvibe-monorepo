import configPromise from "@payload-config"
import { NextResponse } from "next/server"
import { getPayload } from "payload"
import {
  exchangeGoogleAuthCode,
  fetchGoogleAccountEmail,
  mapGoogleOAuthError,
  verifyGmailOAuthState,
} from "@/utilities/gmailOAuth"
import { upsertEmailAccountForTenant } from "@/utilities/emailSrvAccount"
import { getServerSideURL } from "@/utilities/getURL"
import { getTenantURL } from "@/utilities/tenantUrl"

function settingsRedirect(tenantSlug: string, params: Record<string, string>) {
  const tenantBase = getTenantURL(getServerSideURL(), tenantSlug)
  const url = new URL("/dashboard/settings", tenantBase)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const oauthError = url.searchParams.get("error")
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (oauthError) {
    const tenantSlug = "default"
    return settingsRedirect(tenantSlug, {
      gmail: "error",
      code: oauthError === "redirect_uri_mismatch" ? "redirect_mismatch" : oauthError,
    })
  }

  if (!code || !state) {
    return settingsRedirect("default", { gmail: "error", code: "missing_code" })
  }

  let tenantSlug = "default"
  try {
    const claims = verifyGmailOAuthState(state)
    tenantSlug = claims.tenantSlug

    const tokenResponse = await exchangeGoogleAuthCode(code)
    if (!tokenResponse.refresh_token) {
      return settingsRedirect(tenantSlug, { gmail: "error", code: "missing_refresh_token" })
    }

    const senderEmail = await fetchGoogleAccountEmail(tokenResponse.access_token)

    const payload = await getPayload({ config: configPromise })

    await upsertEmailAccountForTenant({
      tenantId: claims.tenantId,
      senderEmail,
      refreshToken: tokenResponse.refresh_token,
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

    return settingsRedirect(tenantSlug, { gmail: "connected" })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "callback_failed"
    const codeParam =
      message.includes("redirect_uri") || message.includes("Redirect URI")
        ? "redirect_mismatch"
        : "callback_failed"
    return settingsRedirect(tenantSlug, { gmail: "error", code: codeParam, detail: message })
  }
}

export const dynamic = "force-dynamic"
