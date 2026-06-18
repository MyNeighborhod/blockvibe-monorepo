import type { NextFunction, Response } from "express"
import {
  assertCanEnqueueForTenant,
  verifyEnqueueToken,
  type EnqueueTokenClaims,
} from "@blockvibe/email-contracts"
import type { AuthenticatedRequest } from "./authentication.js"

function parseBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length).trim() || null
}

export function authenticateEnqueueToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = parseBearerToken(req.header("authorization"))
    if (!token) {
      res.status(401).json({ message: "Missing Bearer enqueue token." })
      return
    }

    const claims: EnqueueTokenClaims = verifyEnqueueToken(token)
    assertCanEnqueueForTenant(claims)

    if (claims.tenantId !== Number(req.body?.tenantId)) {
      res.status(403).json({ message: "Token tenant does not match request tenantId." })
      return
    }

    req.enqueueClaims = claims
    next()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized"
    res.status(401).json({ message })
  }
}
