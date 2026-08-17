/**
 * Add the Calendar heading to the NOG yearly-calendar page if missing.
 *
 * Usage: pnpm exec tsx src/scripts/update-nog-calendar-page.ts
 */
import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { lexicalRichText, richHeading } from "./seed-helpers"

async function main() {
  const payload = await getPayload({ config: configPromise })

  const tenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })

  const tenant = tenants.docs[0]
  if (!tenant) {
    throw new Error("NOG tenant not found")
  }

  const pages = await payload.find({
    collection: "pages",
    where: {
      and: [{ slug: { equals: "yearly-calendar" } }, { tenant: { equals: tenant.id } }],
    },
    limit: 1,
  })

  const page = pages.docs[0]
  if (!page) {
    throw new Error("yearly-calendar page not found")
  }

  const layout = page.layout || []
  const hasCalendarHeader = layout.some(
    (block) => block.blockType === "content" && block.blockName === "Calendar Header",
  )

  if (hasCalendarHeader) {
    payload.logger.info("Calendar heading already exists on yearly-calendar page")
    process.exit(0)
  }

  await payload.update({
    collection: "pages",
    id: page.id,
    data: {
      layout: [
        {
          blockName: "Calendar Header",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([richHeading("Calendar")]),
            },
          ],
        },
        ...layout,
      ],
    },
  })

  payload.logger.info(`Added Calendar heading to yearly-calendar page (id: ${page.id})`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
