/**
 * Run the Payload template seed (demo posts, media, default tenant).
 * Requires a superadmin user — run seed-superadmin-password.ts first.
 *
 * Usage: pnpm tsx src/scripts/seed-template.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { createLocalReq, getPayload } from "payload"
import { seed } from "../endpoints/seed"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: "users",
    where: { role: { equals: "superadmin" } },
    limit: 1,
  })

  const superadmin = users.docs[0]
  if (!superadmin) {
    throw new Error("No superadmin found. Run: pnpm tsx src/scripts/seed-superadmin-password.ts")
  }

  const req = await createLocalReq({ user: superadmin }, payload)
  await seed({ payload, req })

  payload.logger.info("Template seed complete.")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error running template seed:", err)
  process.exit(1)
})
