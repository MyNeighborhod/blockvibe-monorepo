import crypto from "crypto"
import {
  refreshGoogleAccessToken as refreshTokenFromContracts,
  sendGmailHtmlEmail as sendGmailFromContracts,
  type EmailDeliveryMethod,
} from "@blockvibe/email-contracts"
import { getServerSideURL } from "./getURL"
import { getPlatformServerURLFromHost } from "./tenantUrl"

export type { EmailDeliveryMethod }

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
export const GOOGLE_USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email"
export const GMAIL_OAUTH_SCOPES = `${GMAIL_SEND_SCOPE} ${GOOGLE_USERINFO_EMAIL_SCOPE}`
const OAUTH_STATE_TTL_SECONDS = 600

export interface GmailOAuthState {
  tenantId: number
  tenantSlug: string
  userId: number
  exp: number
  nonce: string
}

function getStateSecret(): string {
  return process.env.PAYLOAD_SECRET || process.env.EMAIL_SERVICE_SIGNING_SECRET || "fallback-secret"
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac("sha256", getStateSecret()).update(payloadB64).digest("base64url")
}

export function getGmailCallbackUrl(request?: Request): string {
  if (request) {
    const url = new URL(request.url)
    const host = request.headers.get("host") || url.host
    const [hostname, port] = host.split(":")
    const protocol =
      request.headers.get("x-forwarded-proto") === "http" ? "http:" : url.protocol || "https:"
    const base = getPlatformServerURLFromHost(hostname, protocol, port)
    return `${base.replace(/\/$/, "")}/api/integrations/gmail/callback`
  }
  return `${getServerSideURL().replace(/\/$/, "")}/api/integrations/gmail/callback`
}

export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured.")
  }
  return { clientId, clientSecret }
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function mintGmailOAuthState(input: {
  tenantId: number
  tenantSlug: string
  userId: number
}): string {
  const now = Math.floor(Date.now() / 1000)
  const claims: GmailOAuthState = {
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    userId: input.userId,
    exp: now + OAUTH_STATE_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  }
  const payloadB64 = base64UrlEncode(JSON.stringify(claims))
  return `${payloadB64}.${signPayload(payloadB64)}`
}

export function verifyGmailOAuthState(state: string): GmailOAuthState {
  const parts = state.split(".")
  if (parts.length !== 2) {
    throw new Error("Invalid OAuth state.")
  }
  const [payloadB64, signature] = parts
  const expected = signPayload(payloadB64)
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("Invalid OAuth state signature.")
  }

  const claims = JSON.parse(base64UrlDecode(payloadB64)) as GmailOAuthState
  const now = Math.floor(Date.now() / 1000)
  if (!claims.exp || claims.exp < now) {
    throw new Error("OAuth state has expired.")
  }
  if (!claims.tenantId || !claims.tenantSlug || !claims.userId) {
    throw new Error("OAuth state is missing required fields.")
  }
  return claims
}

export function buildGoogleAuthorizeUrl(state: string, request?: Request): string {
  const { clientId } = getGoogleOAuthConfig()
  const redirectUri = getGmailCallbackUrl(request)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

export async function exchangeGoogleAuthCode(
  code: string,
  request?: Request
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleOAuthConfig()
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGmailCallbackUrl(request),
      grant_type: "authorization_code",
    }),
  })

  const data = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string }
  if (!response.ok) {
    const message = data.error_description || data.error || "Token exchange failed."
    throw new Error(message)
  }
  return data
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = (await response.json()) as { email?: string; error?: { message?: string } }
  if (!response.ok || !data.email) {
    throw new Error(data.error?.message || "Could not read Google account email.")
  }
  return data.email
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  return refreshTokenFromContracts(refreshToken)
}

export async function sendGmailHtmlEmail(params: {
  accessToken: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<string> {
  return sendGmailFromContracts(params)
}

export function mapGoogleOAuthError(code: string | null | undefined): string {
  switch (code) {
    case "access_denied":
      return "Google authorization was cancelled."
    case "redirect_uri_mismatch":
      return "Redirect URI mismatch. Ensure Google OAuth client redirect URIs include the callback URL shown below."
    case "invalid_grant":
      return "Authorization expired or was already used. Try connecting again."
    case "missing_refresh_token":
      return "Google did not return a new refresh token. Disconnect BlockVibe in your Google Account permissions, then connect again — or use Reconnect if you already had Gmail linked."
    case "not_configured":
      return "Google OAuth is not configured on this server (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)."
    case "unauthorized":
      return "You must be logged in as a neighborhood admin to connect Gmail."
    case "forbidden":
      return "You are not authorized to manage email settings for this neighborhood."
    default:
      return code ? `Gmail connection failed (${code}).` : "Gmail connection failed."
  }
}
