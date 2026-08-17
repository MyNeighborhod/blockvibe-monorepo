/**
 * Seed approved demo businesses with high-res logos (when present) for visual validation.
 * Usage: pnpm exec tsx src/scripts/seed-nog-directory-demo.ts
 */
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getPayload } from "payload"
import config from "../payload.config"
import { DEMO_BUSINESSES } from "./seed-nog-directory-demo-data"

async function main() {
  const payload = await getPayload({ config })
  const tenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })
  const nog = tenants.docs[0]
  if (!nog) throw new Error("NOG tenant missing")

  const cats = await payload.find({
    collection: "business-categories",
    where: { tenant: { equals: nog.id } },
    limit: 50,
  })
  const bySlug = new Map(cats.docs.map((c) => [c.slug, c.id]))

  let created = 0
  let updated = 0

  for (const demo of DEMO_BUSINESSES) {
    let logoId: number | undefined

    if (demo.logoFilename) {
      const imageFilePath = path.join(process.cwd(), "public", "media", "nog", demo.logoFilename)
      if (fs.existsSync(imageFilePath)) {
        const existingMedia = await payload.find({
          collection: "media",
          where: {
            and: [{ tenant: { equals: nog.id } }, { filename: { equals: demo.logoFilename } }],
          },
          limit: 1,
        })

        if (existingMedia.docs.length > 0) {
          logoId = existingMedia.docs[0].id
        } else {
          const fileBuffer = fs.readFileSync(imageFilePath)
          const createdMedia = await payload.create({
            collection: "media",
            data: {
              alt: demo.alt || `${demo.name} Logo`,
              tenant: nog.id,
            },
            file: {
              data: fileBuffer,
              name: demo.logoFilename,
              mimetype: "image/png",
              size: fileBuffer.length,
            },
          })
          logoId = createdMedia.id
          console.log("created media logo", demo.logoFilename, "id=", logoId)
        }
      }
    }

    const existing = await payload.find({
      collection: "businesses",
      where: {
        and: [{ tenant: { equals: nog.id } }, { email: { equals: demo.email } }],
      },
      limit: 1,
    })

    const catId = bySlug.get(demo.categorySlug)
    const data = {
      name: demo.name,
      address: demo.address,
      about: demo.about,
      hours: demo.hours,
      website: demo.website,
      email: demo.email,
      phone: demo.phone,
      appearOnNOG: true as const,
      logo: logoId,
      categories: catId ? [catId] : [],
      tenant: nog.id,
    }

    if (existing.docs.length > 0) {
      const { tenant: _tenant, ...updateData } = data
      await payload.update({
        collection: "businesses",
        id: existing.docs[0].id,
        data: updateData,
      })
      updated += 1
      console.log("updated", demo.name)
    } else {
      await payload.create({
        collection: "businesses",
        data,
      })
      created += 1
      console.log("created", demo.name)
    }
  }

  console.log(
    `✓ Demo businesses seeded (${DEMO_BUSINESSES.length} total: ${created} created, ${updated} updated).`,
  )
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
