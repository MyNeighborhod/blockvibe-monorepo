import { defineConfig } from "drizzle-kit"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

const packageRoot = path.dirname(fileURLToPath(import.meta.url))

// Load payload-web .env when migrating from the monorepo root.
dotenv.config({ path: path.resolve(packageRoot, "../../apps/payload-web/.env") })
dotenv.config({ path: path.resolve(packageRoot, ".env") })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for drizzle-kit (set in apps/payload-web/.env).")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  schemaFilter: ["email_srv"],
  strict: true,
})
