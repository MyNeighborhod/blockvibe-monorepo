/**
 * Upsert Twin Suns tenant users for e2e (editor, contributor, pending, admin).
 * Safe to run against production when passwords in .env need to match tests.
 *
 * Usage: pnpm tsx src/scripts/seed-twin-suns-users.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  const tenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "twin-suns" } },
    limit: 1,
  })

  const tenant = tenants.docs[0]
  if (!tenant) {
    throw new Error("twin-suns tenant not found.")
  }

  const users = [
    {
      name: "Twin Suns Admin",
      email: process.env.TENANT_TWIN_SUNS_USERNAME || "admin@twin-suns.blockvibe.org",
      password: process.env.TENANT_TWIN_SUNS_PASSWORD || "oasis1234",
      role: "admin" as const,
      isNeighbor: false,
    },
    {
      name: "Twin Suns Editor",
      email: process.env.TENANT_TWIN_SUNS_EDITOR_USERNAME || "editor@twin-suns.blockvibe.org",
      password: process.env.TENANT_TWIN_SUNS_EDITOR_PASSWORD || "editor1234",
      role: "editor" as const,
      isNeighbor: false,
    },
    {
      name: "Twin Suns Contributor",
      email:
        process.env.TENANT_TWIN_SUNS_CONTRIBUTOR_USERNAME ||
        "contributor@twin-suns.blockvibe.org",
      password: process.env.TENANT_TWIN_SUNS_CONTRIBUTOR_PASSWORD || "contrib1234",
      role: "contributor" as const,
      isNeighbor: true,
      household: "Twin Suns Contributor Household",
    },
    {
      name: "Twin Suns Pending",
      email: process.env.TENANT_TWIN_SUNS_PENDING_USERNAME || "pending@twin-suns.blockvibe.org",
      password: process.env.TENANT_TWIN_SUNS_PENDING_PASSWORD || "pending1234",
      role: "contributor" as const,
      status: "pending" as const,
      isNeighbor: true,
    },
  ]

  const emails = users.map((u) => u.email)

  payload.logger.info("Removing existing Twin Suns e2e users...")
  await payload.delete({
    collection: "users",
    where: { email: { in: emails } },
  })

  for (const user of users) {
    payload.logger.info(`Creating ${user.email}`)
    await payload.create({
      collection: "users",
      context: { isSeeding: true },
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        status: user.status ?? "approved",
        isNeighbor: user.isNeighbor ?? false,
        household: user.household,
        tenants: [{ tenant: tenant.id }],
      },
    })
  }

  payload.logger.info("Twin Suns users seeded successfully.")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error seeding Twin Suns users:", err)
  process.exit(1)
})
