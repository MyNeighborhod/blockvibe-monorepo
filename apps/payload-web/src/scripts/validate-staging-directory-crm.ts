/**
 * One-off validation of directory CRM bootstrap against DATABASE_URL (staging tunnel).
 * Usage: DATABASE_URL=... PAYLOAD_SECRET=... pnpm exec tsx src/scripts/validate-staging-directory-crm.ts
 */
import "dotenv/config"
import { getPayload } from "payload"
import config from "../payload.config"

async function main() {
  const payload = await getPayload({ config })
  const tenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })
  const nog = tenants.docs[0]
  if (!nog) throw new Error("NOG tenant missing")

  console.log("tenant", {
    id: nog.id,
    slug: nog.slug,
    enableBusinessDirectory: (nog as any).enableBusinessDirectory,
  })

  const lists = await payload.find({
    collection: "mailing-lists",
    where: {
      and: [{ tenant: { equals: nog.id } }, { name: { equals: "Approved Businesses" } }],
    },
    limit: 5,
    overrideAccess: true,
  })
  console.log(
    "Approved Businesses list",
    lists.docs.map((d: any) => ({ id: d.id, type: d.type, rules: d.rules })),
  )

  const fields = await payload.find({
    collection: "crm-fields",
    where: {
      and: [{ tenant: { equals: nog.id } }, { key: { equals: "residentCategory" } }],
    },
    limit: 5,
    overrideAccess: true,
  })
  console.log(
    "Resident Category field",
    fields.docs.map((d: any) => ({ id: d.id, options: d.options })),
  )

  const biz = await payload.find({
    collection: "businesses",
    where: { and: [{ tenant: { equals: nog.id } }, { appearOnNOG: { equals: true } }] },
    limit: 3,
    overrideAccess: true,
  })
  console.log(
    "approved businesses",
    biz.totalDocs,
    biz.docs.map((d: any) => d.name),
  )

  const cats = await payload.find({
    collection: "business-categories",
    where: { tenant: { equals: nog.id } },
    limit: 10,
    overrideAccess: true,
  })
  console.log(
    "categories",
    cats.docs.map((d: any) => d.title),
  )

  if (lists.docs.length === 0) throw new Error("Missing Approved Businesses mailing list")
  if (fields.docs.length === 0) throw new Error("Missing Resident Category CRM field")
  if (!(nog as any).enableBusinessDirectory) throw new Error("Directory not enabled")

  console.log("OK: staging directory CRM bootstrap validated")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
