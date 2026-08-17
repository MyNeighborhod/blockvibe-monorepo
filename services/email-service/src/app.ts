import express from "express"
import { readFileSync, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import swaggerUi from "swagger-ui-express"
import { RegisterRoutes } from "./generated/routes.js"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp(): express.Application {
  const app = express()

  app.use(express.json({ limit: "2mb" }))

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "email-service" })
  })

  RegisterRoutes(app)

  const swaggerPath = path.join(dirname, "generated", "swagger.json")
  if (existsSync(swaggerPath)) {
    const swaggerDocument = JSON.parse(readFileSync(swaggerPath, "utf8"))
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  }

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const message = err instanceof Error ? err.message : "Internal Server Error"
      if (!res.headersSent) {
        res.status(500).json({ message })
      }
    }
  )

  return app
}
