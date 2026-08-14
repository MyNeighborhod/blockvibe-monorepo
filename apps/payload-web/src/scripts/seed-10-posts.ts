import { getPayload } from "payload"
import configPromise from "../payload.config"

async function run() {
  const payload = await getPayload({ config: configPromise })

  console.log("Seeding 10 sample blog posts for North of Grand...")

  // Find NOG tenant ID
  const tenants = await payload.find({
    collection: "tenants",
    where: {
      slug: { equals: "nog" },
    },
    limit: 1,
  })

  const nogTenant = tenants.docs[0]
  if (!nogTenant) {
    console.error("NOG Tenant not found!")
    process.exit(1)
  }

  // Get available media IDs
  const mediaDocs = await payload.find({
    collection: "media",
    limit: 20,
  })
  const mediaIds = mediaDocs.docs.map((m: any) => m.id)
  const defaultMediaId = mediaIds[0] || null

  const postsData = [
    {
      title: "Spring Neighborhood Clean-Up Day & Recycling Drive",
      slug: "spring-neighborhood-clean-up-day-2026",
      date: "2026-03-15T09:00:00.000Z",
      summary: "Join neighbors this Saturday at Greenwood Park for our annual spring cleanup, electronics recycling, and tool swap.",
      mediaId: mediaIds[0] || defaultMediaId,
    },
    {
      title: "Ingersoll Avenue Streetscape Upgrade & Local Business Spotlight",
      slug: "ingersoll-avenue-streetscape-upgrade",
      date: "2026-04-02T10:30:00.000Z",
      summary: "Explore the newly renovated pedestrian walkways, patio dining additions, and vibrant murals along Ingersoll Avenue.",
      mediaId: mediaIds[1] || defaultMediaId,
    },
    {
      title: "Annual Summer Block Party Announcement & Volunteer Sign-Up",
      slug: "annual-summer-block-party-2026",
      date: "2026-04-20T14:00:00.000Z",
      summary: "Save the date! Live music, food trucks, and kids' activities are coming to 38th Street this July.",
      mediaId: mediaIds[2] || defaultMediaId,
    },
    {
      title: "North of Grand Historic Home Tour & Architectural Walk",
      slug: "historic-home-tour-architecture-walk",
      date: "2026-05-10T11:15:00.000Z",
      summary: "Step inside seven historic Craftsman bungalows and Tudor homes featuring restored original woodwork and stained glass.",
      mediaId: mediaIds[3] || defaultMediaId,
    },
    {
      title: "Community Garden Planting Guide for Des Moines Urban Gardeners",
      slug: "community-garden-planting-guide-2026",
      date: "2026-05-28T08:45:00.000Z",
      summary: "Tips from local master gardeners on soil preparation, pollinator plants, and heirloom tomatoes for North of Grand yards.",
      mediaId: mediaIds[4] || defaultMediaId,
    },
    {
      title: "Traffic Safety & Pedestrian Crosswalk Enhancements on Grand Ave",
      slug: "traffic-safety-pedestrian-crosswalk-enhancements",
      date: "2026-06-12T16:00:00.000Z",
      summary: "City council approves rapid rectangular flashing beacons and high-visibility crosswalk markings along Grand Avenue.",
      mediaId: mediaIds[5] || defaultMediaId,
    },
    {
      title: "Local Musician Showcase: Live at Greenwood Park Shell",
      slug: "local-musician-showcase-greenwood-park",
      date: "2026-06-30T18:30:00.000Z",
      summary: "Enjoy free Friday evening concerts under the canopy of oak trees with performances from neighborhood jazz and acoustic artists.",
      mediaId: mediaIds[6] || defaultMediaId,
    },
    {
      title: "Autumn Tree Planting Initiative & Urban Canopy Grant",
      slug: "autumn-tree-planting-initiative-canopy-grant",
      date: "2026-07-14T13:20:00.000Z",
      summary: "NOG receives a $15,000 urban forestry grant to plant 50 shade trees along residential rights-of-way this fall.",
      mediaId: mediaIds[7] || defaultMediaId,
    },
    {
      title: "Quarterly Neighborhood Town Hall: 2026 Vision & Budget Highlights",
      slug: "quarterly-neighborhood-town-hall-budget-highlights",
      date: "2026-07-28T19:00:00.000Z",
      summary: "Review key outcomes from our Q3 meeting including parks maintenance, grant allocations, and 2027 board elections.",
      mediaId: mediaIds[8] || defaultMediaId,
    },
    {
      title: "Winter Wonderland & Holiday Decoration Contest Winners",
      slug: "winter-wonderland-holiday-decoration-contest",
      date: "2026-08-05T12:00:00.000Z",
      summary: "Congratulations to our 2026 winners for best light display, most creative porch, and neighborhood spirit awards!",
      mediaId: mediaIds[9] || defaultMediaId,
    },
  ]

  for (const post of postsData) {
    const existing = await payload.find({
      collection: "posts",
      where: {
        and: [
          { slug: { equals: post.slug } },
          { tenant: { equals: nogTenant.id } },
        ],
      },
      limit: 1,
    })

    const richTextContent = {
      root: {
        type: "root",
        format: "",
        indent: 0,
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [
              {
                type: "text",
                version: 1,
                text: post.summary,
              },
            ],
          },
          {
            type: "heading",
            tag: "h2",
            version: 1,
            children: [
              {
                type: "text",
                version: 1,
                text: "Event & Neighborhood Highlights",
              },
            ],
          },
          {
            type: "paragraph",
            version: 1,
            children: [
              {
                type: "text",
                version: 1,
                text: "North of Grand continues to be one of Des Moines' most vibrant historic communities. Residents, local businesses, and volunteers come together to build stronger connections, preserve our historic tree-lined streets, and foster an inclusive neighborhood environment for all.",
              },
            ],
          },
        ],
      },
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: "posts",
        id: existing.docs[0].id,
        data: {
          title: post.title,
          heroImage: post.mediaId,
          content: richTextContent as any,
          _status: "published",
          publishedAt: post.date,
          tenant: nogTenant.id,
        },
      })
      console.log(`Updated post: ${post.title}`)
    } else {
      await payload.create({
        collection: "posts",
        data: {
          title: post.title,
          slug: post.slug,
          heroImage: post.mediaId,
          content: richTextContent as any,
          _status: "published",
          publishedAt: post.date,
          tenant: nogTenant.id,
        },
      })
      console.log(`Created post: ${post.title}`)
    }
  }

  console.log("✓ Successfully seeded 10 posts for North of Grand!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error seeding 10 posts:", err)
  process.exit(1)
})
