import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  // 1. Get NOG tenant
  const nogTenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })

  const nogTenant = nogTenants.docs[0]
  if (!nogTenant) {
    throw new Error("NOG tenant not found")
  }

  // 2. Fetch page 216 data from local DB
  let page216: any = null
  try {
    page216 = await payload.findByID({
      collection: "pages",
      id: 216,
    })
  } catch (_e) {
    const pages = await payload.find({
      collection: "pages",
      where: { slug: { equals: "north-of-grand-blog" } },
      limit: 1,
    })
    page216 = pages.docs[0]
  }

  if (page216) {
    console.log("Found Page 216:", page216.title)
  }

  // 3. Create or update Post in 'posts' collection
  const existingPosts = await payload.find({
    collection: "posts",
    where: {
      and: [
        { tenant: { equals: nogTenant.id } },
        { slug: { equals: "national-neighborhood-night-out-2026" } },
      ],
    },
    limit: 1,
  })

  // Extract rich text content & slideshow from Page 216 if present
  let slideshowImages: any[] = [287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302].map(id => ({ image: id }))
  if (page216?.layout) {
    const slideshowBlock = page216.layout.find((b: any) => b.blockType === "slideshowBlock")
    if (slideshowBlock?.images?.length > 0) {
      slideshowImages = slideshowBlock.images
        .map((item: any) => ({
          image: typeof item.image === "object" ? item.image?.id : item.image,
        }))
        .filter((item: any) => Boolean(item.image))
    }
  }

  const baseRichText = page216?.layout?.[0]?.columns?.[0]?.richText || {
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
              text: "We didn't let a little bit of rain keep us from having a blast at the 2026 National Neighborhood Night Out on Tuesday, August 4th.",
            },
          ],
        },
      ],
    },
  }

  // Ensure root children has the slideshowBlock
  const rootChildren = [...(baseRichText.root?.children || [])]
  const hasSlideshow = rootChildren.some((child: any) => child.type === "block" && child.fields?.blockType === "slideshowBlock")
  if (!hasSlideshow) {
    rootChildren.push({
      type: "block",
      version: 2,
      format: "",
      fields: {
        id: "slideshow-night-out",
        blockType: "slideshowBlock",
        images: slideshowImages,
      },
    })
  }

  const contentWithSlideshow = {
    ...baseRichText,
    root: {
      ...baseRichText.root,
      children: rootChildren,
    },
  }

  let postDoc: any = null
  if (existingPosts.docs.length > 0) {
    postDoc = existingPosts.docs[0]
    await payload.update({
      collection: "posts",
      id: postDoc.id,
      data: {
        content: contentWithSlideshow,
      },
    })
    console.log("Updated Post with Slideshow:", postDoc.id)
  } else {
    postDoc = await payload.create({
      collection: "posts",
      data: {
        title: "2026 National Neighborhood Night Out",
        slug: "national-neighborhood-night-out-2026",
        tenant: nogTenant.id as number,
        _status: "published",
        content: contentWithSlideshow,
        publishedAt: new Date().toISOString(),
      },
    })
    console.log("Created Post with Slideshow:", postDoc.id, postDoc.title)
  }

  // 4. Update Header for NOG to include BLOG link -> /posts
  const headers = await payload.find({
    collection: "header",
    where: { tenant: { equals: nogTenant.id } },
    limit: 1,
  })

  if (headers.docs.length > 0) {
    const headerDoc = headers.docs[0]
    const navItems = headerDoc.navItems || []

    const hasBlogLink = navItems.some(
      (item: any) =>
        item.link?.url === "/posts" || item.link?.label?.toUpperCase() === "BLOG",
    )

    if (!hasBlogLink) {
      navItems.push({
        link: {
          type: "custom",
          label: "BLOG",
          url: "/posts",
        },
      })

      await payload.update({
        collection: "header",
        id: headerDoc.id,
        data: {
          navItems,
        },
      })
      console.log("Updated NOG Header with BLOG link -> /posts")
    } else {
      console.log("Header already has BLOG link")
    }
  }

  console.log("✓ Done setting up Blog post and Header nav link for localhost!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error in setup-nog-blog:", err)
  process.exit(1)
})
