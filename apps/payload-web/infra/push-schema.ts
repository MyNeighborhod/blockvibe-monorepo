import "dotenv/config"
import { getPayload } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import baseConfig from "../src/payload.config.js"

/**
 * Force a Payload Postgres schema push (ignores push:false in payload.config).
 * Used by sync-schema.sh / local development after collection field changes.
 */
async function main() {
  const config = await Promise.resolve(baseConfig)
  const forced = {
    ...config,
    db: postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URL || "",
      },
      push: true,
    }),
  }

  console.log("Running schema push (push:true)…")
  const payload = await getPayload({ config: forced as any })
  console.log("Schema push complete")

  const db = payload.db as { destroy?: () => Promise<void> }
  if (typeof db.destroy === "function") {
    await db.destroy()
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
