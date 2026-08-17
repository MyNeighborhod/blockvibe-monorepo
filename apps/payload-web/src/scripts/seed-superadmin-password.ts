/**
 * Set superadmin password from LOCAL_SUPERADMIN_* or TEST_USER_* env vars.
 * Use after prod deploy so admin.e2e can log in with .env credentials.
 *
 * Usage: pnpm tsx src/scripts/seed-superadmin-password.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"

async function run() {
  const email = process.env.TEST_USER_EMAIL || process.env.LOCAL_SUPERADMIN_USERNAME
  const password = process.env.TEST_USER_PASSWORD || process.env.LOCAL_SUPERADMIN_PASSWORD

  if (!email || !password) {
    throw new Error("Set TEST_USER_* or LOCAL_SUPERADMIN_* in environment.")
  }

  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existing.docs.length === 0) {
    payload.logger.info(`Creating superadmin ${email}`)
    await payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        name: "Super Admin",
        email,
        password,
        role: "superadmin",
        status: "approved",
      },
    })
  } else {
    payload.logger.info(`Updating superadmin ${email}`)
    await payload.update({
      collection: "users",
      id: existing.docs[0].id,
      overrideAccess: true,
      data: {
        password,
        role: "superadmin",
        status: "approved",
        loginAttempts: 0,
        lockUntil: null,
      },
    })
  }

  payload.logger.info("Superadmin password synced.")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error syncing superadmin password:", err)
  process.exit(1)
})
