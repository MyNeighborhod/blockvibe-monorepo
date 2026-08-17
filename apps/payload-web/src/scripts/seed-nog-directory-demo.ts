/**
 * Seed approved demo businesses with high-res logos and cover images for local visual validation.
 * Usage: pnpm exec tsx src/scripts/seed-nog-directory-demo.ts
 */
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getPayload } from "payload"
import config from "../payload.config"

const demos = [
  {
    name: "Grand Avenue Cafe",
    address: "3100 Grand Ave, Des Moines, IA",
    about: "Neighborhood coffee, pastries, and a sunny patio — a NOG morning staple.",
    hours: "Mon–Fri 7am–4pm · Sat–Sun 8am–3pm",
    website: "https://example.com/grand-ave-cafe",
    email: "demo-cafe@example.com",
    phone: "(515) 555-0101",
    categorySlug: "food-drink",
    logoFilename: "grand-avenue-cafe-logo.png",
    alt: "Grand Avenue Cafe Logo",
  },
  {
    name: "Ingersoll Book Nook",
    address: "2800 Ingersoll Ave, Des Moines, IA",
    about: "Independent books, local authors, and weekend story hours for families.",
    hours: "Tue–Sun 10am–6pm",
    website: "https://example.com/book-nook",
    email: "demo-books@example.com",
    phone: "(515) 555-0102",
    categorySlug: "shopping",
    logoFilename: "ingersoll-book-nook-logo.png",
    alt: "Ingersoll Book Nook Logo",
  },
  {
    name: "Studio North Wellness",
    address: "3500 Grand Ave, Des Moines, IA",
    about: "Yoga, massage, and community wellness classes for every body.",
    hours: "Daily 6am–8pm",
    website: "https://example.com/studio-north",
    email: "demo-wellness@example.com",
    phone: "(515) 555-0103",
    categorySlug: "health-wellness",
    logoFilename: "studio-north-wellness-logo.png",
    alt: "Studio North Wellness Logo",
  },
]

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

  for (const demo of demos) {
    let logoId: number | undefined

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
            alt: demo.alt,
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

    const existing = await payload.find({
      collection: "businesses",
      where: {
        and: [{ tenant: { equals: nog.id } }, { email: { equals: demo.email } }],
      },
      limit: 1,
    })

    const catId = bySlug.get(demo.categorySlug)
    if (existing.docs.length > 0) {
      await payload.update({
        collection: "businesses",
        id: existing.docs[0].id,
        data: {
          appearOnNOG: true,
          logo: logoId,
          // Don't duplicate logo as cover — card UI treats logo-only listings with contain + wash.
          coverImage: undefined,
          categories: catId ? [catId] : [],
        },
      })
      console.log("updated existing business logo", demo.name)
    } else {
      await payload.create({
        collection: "businesses",
        data: {
          name: demo.name,
          address: demo.address,
          about: demo.about,
          hours: demo.hours,
          website: demo.website,
          email: demo.email,
          phone: demo.phone,
          appearOnNOG: true,
          logo: logoId,
          tenant: nog.id,
          categories: catId ? [catId] : [],
        },
      })
      console.log("created business with logo", demo.name)
    }
  }

  console.log("✓ Demo businesses seeded with real logos successfully.")
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
