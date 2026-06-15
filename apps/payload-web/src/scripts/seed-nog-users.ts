/**
 * Upsert NOG tenant admin and neighbor users without re-seeding pages or media.
 * Safe to run against production when neighbor e2e credentials need to exist.
 *
 * Usage:
 *   pnpm tsx src/scripts/seed-nog-users.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  const nogTenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })

  const nogTenant = nogTenants.docs[0]
  if (!nogTenant) {
    throw new Error("NOG tenant not found. Run seed-nog.ts first or ensure nog tenant exists on this database.")
  }

  const nogAdminEmail = process.env.TENANT_NOG_USERNAME || "admin@nog.blockvibe.org"
  const nogNeighborEmail =
    process.env.TENANT_NOG_NEIGHBOR_USERNAME || "neighbor_john@nog.blockvibe.org"
  const nogNeighborJohannaEmail =
    process.env.TENANT_NOG_NEIGHBOR_JOHANNA_USERNAME || "neighbor_johanna@nog.blockvibe.org"

  const nogAdminPassword = process.env.TENANT_NOG_PASSWORD || "password1234"
  const nogNeighborPassword = process.env.TENANT_NOG_NEIGHBOR_PASSWORD || "neighbor1234"
  const nogNeighborJohannaPassword =
    process.env.TENANT_NOG_NEIGHBOR_JOHANNA_PASSWORD || "neighbor1234"

  payload.logger.info("Removing existing NOG admin and neighbor users (if any)...")
  await payload.delete({
    collection: "users",
    where: {
      or: [
        { email: { equals: nogAdminEmail } },
        { email: { equals: nogNeighborEmail } },
        { email: { equals: nogNeighborJohannaEmail } },
      ],
    },
  })

  payload.logger.info(`Creating NOG admin: ${nogAdminEmail}`)
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "NOG Admin",
      email: nogAdminEmail,
      password: nogAdminPassword,
      role: "admin",
      status: "approved",
      tenants: [{ tenant: nogTenant.id }],
    },
  })

  payload.logger.info(`Creating John Neighbor: ${nogNeighborEmail}`)
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "John Neighbor",
      email: nogNeighborEmail,
      password: nogNeighborPassword,
      role: "contributor",
      status: "approved",
      isNeighbor: true,
      household: "John & Johanna Household",
      tenants: [{ tenant: nogTenant.id }],
    },
  })

  payload.logger.info(`Creating Johanna Neighbor: ${nogNeighborJohannaEmail}`)
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Johanna Neighbor",
      email: nogNeighborJohannaEmail,
      password: nogNeighborJohannaPassword,
      role: "contributor",
      status: "approved",
      isNeighbor: true,
      household: "John & Johanna Household",
      tenants: [{ tenant: nogTenant.id }],
    },
  })

  payload.logger.info("NOG users seeded successfully.")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error seeding NOG users:", err)
  process.exit(1)
})
