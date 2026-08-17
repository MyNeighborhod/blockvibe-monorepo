/**
 * Enable the Business Directory feature for the NOG tenant and seed default categories.
 *
 * Usage (from apps/payload-web, with local DATABASE_URL):
 *   pnpm exec tsx src/scripts/enable-nog-directory.ts
 */
import "dotenv/config"
import { getPayload } from "payload"
import config from "../payload.config"
import {
  DEFAULT_DIRECTORY_FIELD_CONFIG,
  DEFAULT_NOG_BUSINESS_CATEGORIES,
} from "../directory/constants"
import {
  ensureApprovedBusinessesMailingList,
  ensureResidentCategoryCrmField,
} from "../directory/crmBootstrap"

async function main() {
  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: "nog" } }, { slug: { equals: "default" } }],
    },
    limit: 5,
  })

  const nog =
    found.docs.find((t) => t.slug === "nog") ||
    found.docs.find((t) => t.slug === "default") ||
    found.docs[0]

  if (!nog) {
    throw new Error("No NOG/default tenant found.")
  }

  await payload.update({
    collection: "tenants",
    id: nog.id,
    data: {
      enableBusinessDirectory: true,
      directorySettings: {
        pageTitle: "Businesses of North Of Grand",
        pageIntro:
          "Support local. Explore shops, restaurants, and services right here in our neighborhood.",
        allowPublicRegistration: true,
        showInNav: true,
        fieldConfig: DEFAULT_DIRECTORY_FIELD_CONFIG,
      },
    },
  })

  const existingCats = await payload.find({
    collection: "business-categories",
    where: { tenant: { equals: nog.id } },
    limit: 1,
  })

  if (existingCats.docs.length === 0) {
    for (let i = 0; i < DEFAULT_NOG_BUSINESS_CATEGORIES.length; i++) {
      const cat = DEFAULT_NOG_BUSINESS_CATEGORIES[i]
      await payload.create({
        collection: "business-categories",
        data: {
          title: cat.title,
          slug: cat.slug,
          sortOrder: i,
          tenant: nog.id,
        },
      })
    }
    console.log(`Seeded ${DEFAULT_NOG_BUSINESS_CATEGORIES.length} categories for tenant ${nog.slug}`)
  } else {
    console.log("Categories already present — skipped seed")
  }

  await ensureApprovedBusinessesMailingList(payload, nog.id)
  await ensureResidentCategoryCrmField(payload, nog.id)
  console.log("Ensured Approved Businesses mailing list + Resident Category CRM field")

  console.log(`Enabled Business Directory for tenant slug=${nog.slug} id=${nog.id}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
