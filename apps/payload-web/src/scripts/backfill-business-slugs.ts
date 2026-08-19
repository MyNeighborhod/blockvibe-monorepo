/**
 * Backfill missing businesses.slug values (per tenant unique).
 *
 * Usage:
 *   pnpm exec tsx src/scripts/backfill-business-slugs.ts
 */
import "dotenv/config"
import { getPayload } from "payload"
import config from "../payload.config"

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "business"
  )
}

async function main() {
  const payload = await getPayload({ config })
  const all = await payload.find({
    collection: "businesses",
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  let updated = 0
  for (const doc of all.docs) {
    if ((doc as any).slug) continue
    const tenantId =
      typeof doc.tenant === "object" && doc.tenant !== null ? (doc.tenant as any).id : doc.tenant
    if (tenantId == null) continue

    const base = slugify(String(doc.name || "business"))
    let candidate = base
    for (let i = 0; i < 50; i++) {
      const clash = await payload.find({
        collection: "businesses",
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { slug: { equals: candidate } },
            { id: { not_equals: doc.id } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      if (clash.docs.length === 0) break
      candidate = `${base}-${i + 2}`
    }

    await payload.update({
      collection: "businesses",
      id: doc.id,
      data: { slug: candidate } as any,
      overrideAccess: true,
    })
    console.log(`slug ${doc.id} ${doc.name} -> ${candidate}`)
    updated++
  }

  console.log(`Backfilled ${updated} businesses`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
