import crypto from "crypto"
import type { BroadcastDeliveryResult } from "./types.js"

const BROADCAST_COMPLETION_TTL_SECONDS = 3600

export interface BroadcastCompletionClaims {
  broadcastId: number
  tenantId: number
  iat: number
  exp: number
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url")
}

export function getBroadcastCompletionSigningSecret(): string {
  const secret = process.env.EMAIL_SERVICE_SIGNING_SECRET || process.env.PAYLOAD_SECRET
  if (!secret) {
    throw new Error("EMAIL_SERVICE_SIGNING_SECRET is not configured.")
  }
  return secret
}

export function mintBroadcastCompletionToken(
  input: { broadcastId: number; tenantId: number },
  secret = getBroadcastCompletionSigningSecret()
): string {
  const now = Math.floor(Date.now() / 1000)
  const claims: BroadcastCompletionClaims = {
    broadcastId: input.broadcastId,
    tenantId: input.tenantId,
    iat: now,
    exp: now + BROADCAST_COMPLETION_TTL_SECONDS,
  }
  const payloadB64 = base64UrlEncode(JSON.stringify(claims))
  return `${payloadB64}.${signPayload(payloadB64, secret)}`
}

export class BroadcastCompletionTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BroadcastCompletionTokenError"
  }
}

export function verifyBroadcastCompletionToken(
  token: string,
  secret = getBroadcastCompletionSigningSecret()
): BroadcastCompletionClaims {
  const parts = token.split(".")
  if (parts.length !== 2) {
    throw new BroadcastCompletionTokenError("Malformed completion token.")
  }

  const [payloadB64, signature] = parts
  const expected = signPayload(payloadB64, secret)
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new BroadcastCompletionTokenError("Invalid completion token signature.")
  }

  const claims = JSON.parse(base64UrlDecode(payloadB64)) as BroadcastCompletionClaims
  const now = Math.floor(Date.now() / 1000)
  if (!claims.exp || claims.exp < now) {
    throw new BroadcastCompletionTokenError("Completion token has expired.")
  }
  if (!claims.broadcastId || !claims.tenantId) {
    throw new BroadcastCompletionTokenError("Completion token is missing required claims.")
  }
  return claims
}

export function resolveBroadcastDeliveryStatus(
  result: BroadcastDeliveryResult
): "completed" | "partial" | "failed" {
  if (result.sentCount === 0 && result.failedCount > 0) return "failed"
  if (result.failedCount > 0) return "partial"
  return "completed"
}

export interface BroadcastCompletionRequest {
  broadcastId: number
  tenantId: number
  jobId: string
  sentCount: number
  failedCount: number
  failedEmails: string[]
}
