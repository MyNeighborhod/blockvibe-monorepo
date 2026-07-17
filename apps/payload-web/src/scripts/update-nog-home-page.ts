/**
 * Restructure the NOG home page to match the original site layout.
 *
 * Usage: pnpm exec tsx src/scripts/update-nog-home-page.ts
 */
import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { lexicalRichText, richHeading, richParagraph } from "./seed-helpers"

function buildHomeIntroLayout(homePhotoId: number) {
  return [
    {
      blockName: "Home Hero Heading",
      blockType: "content" as const,
      columns: [
        {
          type: "text" as const,
          size: "full" as const,
          richText: lexicalRichText([
            {
              ...richHeading("Our historic neighborhood.", "h1"),
              format: "center",
            },
          ]),
        },
      ],
    },
    {
      blockName: "Home Intro Content",
      blockType: "content" as const,
      columns: [
        {
          type: "media" as const,
          size: "oneThird" as const,
          media: homePhotoId,
        },
        {
          type: "text" as const,
          size: "twoThirds" as const,
          richText: lexicalRichText([
            richParagraph(
              "Welcome to the Historic District of North of Grand. The neighborhood is nestled in the heart of Des Moines, Iowa between 31st & 42nd street from Hwy 235 to Grand Ave.",
            ),
            richHeading("North of Grand Neighborhood Association", "h2"),
            richHeading("Mission Statement", "h3"),
            richParagraph(
              "Our Mission is to strengthen relationships and improve quality of life for all residents and businesses in the North of Grand neighborhood. We commit to enhancing livability and revitalizing our historic neighborhood through opportunities of civic engagement. We advocate on behalf of North of Grand’s diverse residents as a liaison with local governments to preserve and uphold our community’s vibrant characteristics.",
            ),
          ]),
        },
      ],
    },
  ]
}

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
      and: [{ slug: { equals: "home" } }, { tenant: { equals: tenant.id } }],
    },
    limit: 1,
    depth: 1,
  })

  const page = pages.docs[0]
  if (!page) {
    throw new Error("home page not found")
  }

  const existingLayout = page.layout || []
  const upcomingEventsBlock = existingLayout.find(
    (block) => block.blockName === "Upcoming Events Content",
  )

  const introBlock = existingLayout.find((block) => block.blockName === "Home Intro Content")
  const mediaId =
    introBlock?.blockType === "content"
      ? introBlock.columns?.find((column) => column.type === "media")?.media
      : null

  const homePhotoId =
    typeof mediaId === "object" && mediaId !== null && "id" in mediaId
      ? mediaId.id
      : typeof mediaId === "number"
        ? mediaId
        : null

  if (!homePhotoId) {
    throw new Error("Could not find home photo media on the existing home page")
  }

  const layout = [
    ...buildHomeIntroLayout(homePhotoId),
    ...(upcomingEventsBlock ? [upcomingEventsBlock] : []),
  ]

  await payload.update({
    collection: "pages",
    id: page.id,
    data: { layout },
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Updated NOG home page layout (id: ${page.id})`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
