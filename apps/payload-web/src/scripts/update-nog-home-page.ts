/**
 * Restructure and update the NOG home page to match the original site layout and latest upcoming events.
 *
 * Usage: pnpm exec tsx src/scripts/update-nog-home-page.ts
 */
import dotenv from "dotenv"

if (!process.env.DATABASE_URL) {
  dotenv.config()
}

import { getPayload } from "payload"
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

function buildUpcomingEventsLayout() {
  return {
    blockName: "Upcoming Events Content",
    blockType: "content" as const,
    columns: [
      {
        type: "text" as const,
        size: "full" as const,
        richText: lexicalRichText([
          richHeading("Upcoming Events:", "h2"),
          richHeading("2026 Summer Scavenger Hunt:", "h3"),
          richParagraph(
            "Throughout the months of June and July, keep an eye out for each of the following things in the North of Grand (NOG) Neighborhood. For each item in the photo sheet, enter the location of where you found that item. We're pretty flexible on the location descriptions. • Some are easier to find than others. • All can be seen from the sidewalk. • When you find an item, fill in the location on your entry",
          ),
          richHeading("Submitting Your Entry:", "h3"),
          richParagraph(
            "Submit your entry by July 31st to be entered into drawings for NoG Swag and donated prizes from NoG Businesses",
          ),
          richParagraph("Entries can be submitted in one of the following ways:"),
          richParagraph("• tinyurl.com/nogsummerscavengerhunt2026"),
          richParagraph(
            "• Paper copy (and then send a picture of your filled in map to northofgrandpresident@gmail.com)",
          ),
          richParagraph(
            "• DM NOG Neighborhood Association on Facebook to have a paper copy dropped off at your home in the NOG neighborhood",
          ),
          richParagraph(
            "• Email NOG Neighborhood Association to have a paper copy dropped off at your home in the NOG neighborhood",
          ),
          richHeading("Prize Entries:", "h3"),
          richParagraph("• 1-4 items found and recorded: 1 entry into the drawings"),
          richParagraph("• 5-8 items found and recorded: 2 entries into the drawings"),
          richParagraph(
            "• 9-12 items found and recorded: 3 entries into the drawings *Only one prize per person",
          ),
          richHeading("Neighborhood Night Out: Tuesday, August 4th", "h3"),
          richParagraph("Boesen the Florist Parking Lot 6-8pm"),
          richParagraph("Snacks! Games! Music! Raffle Prizes"),
          richParagraph("Come hang out with your neighbors"),
          richHeading("NoG Quarterly Meeting: Sunday, August 16th", "h3"),
          richParagraph("Price Chopper Cafe: 4-5:30pm"),
          richParagraph("More information to come"),
          richHeading("NoG Blood Drive: Friday, September 25th", "h3"),
          richParagraph("Price Chopper Parking lot 2-6pm"),
          richParagraph(
            "Appointment Sign up link: http://lifeserve-donor.prod.forcytesp.com/schedule-donation?date=2026-09-25&operation_id=546346&operation_type=drives",
          ),
        ]),
      },
    ],
  }
}

async function main() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

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

  const layout = [...buildHomeIntroLayout(homePhotoId), buildUpcomingEventsLayout()]

  await payload.update({
    collection: "pages",
    id: page.id,
    data: { layout },
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Updated NOG home page layout with latest upcoming events (id: ${page.id})`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
