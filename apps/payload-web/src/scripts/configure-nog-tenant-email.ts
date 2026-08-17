/**
 * Apply per-environment NOG tenant email + domain settings (no content wipe).
 *
 * Usage:
 *   # Staging DB (DATABASE_URL in .env.staging)
 *   dotenv -e .env.staging -- pnpm exec tsx src/scripts/configure-nog-tenant-email.ts --staging
 *
 *   # Production DB (DATABASE_URL in .env.production)
 *   dotenv -e .env.production -- pnpm exec tsx src/scripts/configure-nog-tenant-email.ts --production
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import configPromise from "@payload-config"
import {
  getNogTenantEmailDefaultsProduction,
  getNogTenantEmailDefaultsStaging,
} from "../config/tenantEmailDefaults"

const isStaging = process.argv.includes("--staging")
const isProduction = process.argv.includes("--production")

if (!isStaging && !isProduction) {
  console.error("Pass --staging or --production")
  process.exit(1)
}

const defaults = isStaging
  ? getNogTenantEmailDefaultsStaging()
  : getNogTenantEmailDefaultsProduction()

async function main() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })

  if (result.docs.length === 0) {
    console.error("NOG tenant (slug=nog) not found.")
    process.exit(1)
  }

  const tenant = result.docs[0]

  const updated = await payload.update({
    collection: "tenants",
    id: tenant.id,
    data: {
      domain: defaults.domain,
      organizationLegalName: defaults.organizationLegalName,
      is501c3: defaults.is501c3,
      transactionalEmailFrom: defaults.transactionalEmailFrom,
      transactionalEmailFromName: defaults.transactionalEmailFromName,
      emailDeliveryDefault: defaults.emailDeliveryDefault,
    },
  })

  console.log(`Updated NOG tenant (${isStaging ? "staging" : "production"}):`)
  console.log(`  domain: ${updated.domain}`)
  console.log(`  transactionalEmailFrom: ${updated.transactionalEmailFrom}`)
  console.log(`  transactionalEmailFromName: ${updated.transactionalEmailFromName}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
