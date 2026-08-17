/**
 * Seed a few approved demo businesses for local visual validation.
 * pnpm exec tsx src/scripts/seed-nog-directory-demo.ts
 */
import "dotenv/config"
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
    const existing = await payload.find({
      collection: "businesses",
      where: {
        and: [{ tenant: { equals: nog.id } }, { email: { equals: demo.email } }],
      },
      limit: 1,
    })
    if (existing.docs.length) {
      console.log("skip existing", demo.name)
      continue
    }
    const catId = bySlug.get(demo.categorySlug)
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
        tenant: nog.id,
        categories: catId ? [catId] : [],
      },
    })
    console.log("created", demo.name)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
