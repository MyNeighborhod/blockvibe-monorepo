import express from "express"
import cors from "cors"
import { requireAuth } from "./middleware/auth.js"
import { handleChat } from "./controllers/chat.js"

export function createApp(): express.Application {
  const app = express()

  // Enable CORS for dashboard subdomains and local development
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow request with no origin (like mobile apps or curl) or matching blockvibe.org
        if (
          !origin ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.endsWith("blockvibe.org")
        ) {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
      },
      credentials: true,
    })
  )

  app.use(express.json({ limit: "2mb" }))

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "chat-service" })
  })

  // Secure API endpoint using JWT requireAuth middleware
  app.post("/api/chat", requireAuth as any, handleChat as any)

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const message = err instanceof Error ? err.message : "Internal Server Error"
      console.error("Unhandled server error:", err)
      if (!res.headersSent) {
        res.status(500).json({ error: message })
      }
    }
  )

  return app
}
