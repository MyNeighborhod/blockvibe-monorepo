import type { Request } from "express"
import type { EnqueueTokenClaims } from "@blockvibe/email-contracts"

export interface AuthenticatedRequest extends Request {
  enqueueClaims?: EnqueueTokenClaims
}

export function expressAuthentication(): Promise<EnqueueTokenClaims> {
  // Custom bearer verification runs in authenticateEnqueueToken middleware before tsoa handlers.
  return Promise.reject(new Error("Use authenticateEnqueueToken middleware."))
}
