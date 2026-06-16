import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { isRemoteTestEnv } from "./tenantUrl"

/** Resolve PAYLOAD_SECRET for HMAC token generation in e2e tests. */
export function getPayloadSecretForE2E(): string {
  if (isRemoteTestEnv()) {
    const prodEnvPath = path.resolve(process.cwd(), ".env.production")
    if (fs.existsSync(prodEnvPath)) {
      const prodConfig = dotenv.parse(fs.readFileSync(prodEnvPath))
      if (prodConfig.PAYLOAD_SECRET) {
        return prodConfig.PAYLOAD_SECRET
      }
    }
  }

  return process.env.PAYLOAD_SECRET || "fallback-secret"
}
