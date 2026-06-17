import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { isRemoteTestEnv } from "./tenantUrl"

function loadProdEnv(): Record<string, string> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
  const envFile = baseURL.includes("staging") ? ".env.staging" : ".env.production"
  const prodEnvPath = path.resolve(process.cwd(), envFile)
  if (!fs.existsSync(prodEnvPath)) {
    return {}
  }
  return dotenv.parse(fs.readFileSync(prodEnvPath))
}

/** Superadmin credentials for admin.e2e (local seed or prod login). */
export function getSuperadminCredentials(): { email: string; password: string } | null {
  const prodConfig = isRemoteTestEnv() ? loadProdEnv() : {}

  const email =
    prodConfig.TEST_USER_EMAIL ||
    prodConfig.LOCAL_SUPERADMIN_USERNAME ||
    process.env.TEST_USER_EMAIL ||
    process.env.LOCAL_SUPERADMIN_USERNAME

  const password =
    prodConfig.TEST_USER_PASSWORD ||
    prodConfig.LOCAL_SUPERADMIN_PASSWORD ||
    process.env.TEST_USER_PASSWORD ||
    process.env.LOCAL_SUPERADMIN_PASSWORD

  if (!email || !password) {
    return null
  }

  return { email, password }
}
