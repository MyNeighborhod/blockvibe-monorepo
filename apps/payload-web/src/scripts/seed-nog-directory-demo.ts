/**
 * Seed approved demo businesses with logos (bundled PNGs or Unsplash JPGs) for visual validation.
 * Usage:
 *   pnpm exec tsx src/scripts/download-demo-unsplash-logos.ts
 *   pnpm exec tsx src/scripts/seed-nog-directory-demo.ts
 */
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getPayload } from "payload"
import config from "../payload.config"
import { DEMO_BUSINESSES } from "./seed-nog-directory-demo-data"
import {
  SKIP_LOGO_EMAILS,
  UNSPLASH_LOGO_BY_EMAIL,
  logoFilenameForEmail,
} from "./seed-nog-directory-demo-logos"

function mimeForFilename(filename: string) {
  const lower = filename.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  return "image/jpeg"
}

function resolveLogoFilename(demo: (typeof DEMO_BUSINESSES)[number]): string | undefined {
  if (SKIP_LOGO_EMAILS.has(demo.email)) return undefined
  if (demo.logoFilename) return demo.logoFilename
  if (UNSPLASH_LOGO_BY_EMAIL[demo.email]) {
    return logoFilenameForEmail(demo.email) || undefined
  }
  return undefined
}

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
  let logosAttached = 0
  let monograms = 0

  for (const demo of DEMO_BUSINESSES) {
    let logoId: number | null | undefined
    const logoFilename = resolveLogoFilename(demo)

    if (logoFilename) {
      const imageFilePath = path.join(process.cwd(), "public", "media", "nog", logoFilename)
      if (fs.existsSync(imageFilePath)) {
        const existingMedia = await payload.find({
          collection: "media",
          where: {
            and: [{ tenant: { equals: nog.id } }, { filename: { equals: logoFilename } }],
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
              alt: demo.alt || `${demo.name} logo`,
              tenant: nog.id,
            },
            file: {
              data: fileBuffer,
              name: logoFilename,
              mimetype: mimeForFilename(logoFilename),
              size: fileBuffer.length,
            },
          })
          logoId = createdMedia.id
          console.log("created media logo", logoFilename, "id=", logoId)
        }
        logosAttached += 1
      } else {
        console.warn("missing logo file", logoFilename, "for", demo.name)
        logoId = null
        monograms += 1
      }
    } else {
      logoId = null
      monograms += 1
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
      console.log("updated", demo.name, logoId ? `logo=${logoId}` : "(monogram)")
    } else {
      await payload.create({
        collection: "businesses",
        data,
      })
      created += 1
      console.log("created", demo.name, logoId ? `logo=${logoId}` : "(monogram)")
    }
  }

  console.log(
    `✓ Demo businesses seeded (${DEMO_BUSINESSES.length} total: ${created} created, ${updated} updated; ${logosAttached} with logos, ${monograms} monogram examples).`,
  )
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
