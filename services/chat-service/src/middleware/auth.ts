import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string | number
    role: string
    tenantId?: string | number
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" })
    return
  }

  const token = authHeader.substring(7)
  const secret = process.env.CHAT_SERVICE_SIGNING_SECRET

  if (!secret) {
    console.error("CHAT_SERVICE_SIGNING_SECRET environment variable is not defined.")
    res.status(500).json({ error: "Internal server authentication configuration error" })
    return
  }

  try {
    const decoded = jwt.verify(token, secret) as any
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      tenantId: decoded.tenantId,
    }
    next()
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}
