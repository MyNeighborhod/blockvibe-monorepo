import crypto from "crypto"
import type { EmailEnqueueRole, EnqueueTokenClaims } from "./types.js"
import { ENQUEUE_TOKEN_TTL_SECONDS } from "./types.js"

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url")
}

export function getEnqueueSigningSecret(): string {
  const secret = process.env.EMAIL_SERVICE_SIGNING_SECRET
  if (!secret) {
    throw new Error("EMAIL_SERVICE_SIGNING_SECRET is not configured.")
  }
  return secret
}

export interface MintEnqueueTokenInput {
  userId: number
  role: EmailEnqueueRole
  tenantId: number
  tenantIds: number[]
  ttlSeconds?: number
}

export function mintEnqueueToken(
  input: MintEnqueueTokenInput,
  secret = getEnqueueSigningSecret()
): string {
  const now = Math.floor(Date.now() / 1000)
  const claims: EnqueueTokenClaims = {
    sub: input.userId,
    role: input.role,
    tenantId: input.tenantId,
    tenantIds: input.tenantIds,
    iat: now,
    exp: now + (input.ttlSeconds ?? ENQUEUE_TOKEN_TTL_SECONDS),
  }

  const payloadB64 = base64UrlEncode(JSON.stringify(claims))
  const signature = signPayload(payloadB64, secret)
  return `${payloadB64}.${signature}`
}

export class EnqueueTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EnqueueTokenError"
  }
}

export function verifyEnqueueToken(
  token: string,
  secret = getEnqueueSigningSecret()
): EnqueueTokenClaims {
  if (!token || typeof token !== "string") {
    throw new EnqueueTokenError("Missing enqueue token.")
  }

  const parts = token.split(".")
  if (parts.length !== 2) {
    throw new EnqueueTokenError("Malformed enqueue token.")
  }

  const [payloadB64, signature] = parts
  const expected = signPayload(payloadB64, secret)

  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new EnqueueTokenError("Invalid enqueue token signature.")
  }

  let claims: EnqueueTokenClaims
  try {
    claims = JSON.parse(base64UrlDecode(payloadB64)) as EnqueueTokenClaims
  } catch {
    throw new EnqueueTokenError("Invalid enqueue token payload.")
  }

  const now = Math.floor(Date.now() / 1000)
  if (!claims.exp || claims.exp < now) {
    throw new EnqueueTokenError("Enqueue token has expired.")
  }

  if (!claims.sub || !claims.tenantId || !claims.role) {
    throw new EnqueueTokenError("Enqueue token is missing required claims.")
  }

  return claims
}

export function assertCanEnqueueForTenant(claims: EnqueueTokenClaims): void {
  if (claims.role !== "admin" && claims.role !== "superadmin") {
    throw new EnqueueTokenError("Only admin or superadmin may enqueue campaigns.")
  }

  if (claims.role === "superadmin") {
    return
  }

  const allowed = claims.tenantIds ?? []
  if (!allowed.includes(claims.tenantId)) {
    throw new EnqueueTokenError("Admin is not authorized for this tenant.")
  }
}
