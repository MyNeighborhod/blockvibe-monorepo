/**
 * How to run this script:
 * pnpm tsx src/scripts/seed-nog.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"

// Helper to construct Lexical Rich Text JSON structure simply
function lexicalRichText(children: any[]): any {
  return {
    root: {
      type: "root",
      children: children,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  }
}

function richParagraph(text: string): any {
  return {
    type: "paragraph",
    children: [
      {
        type: "text",
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: text,
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

function richHeading(text: string, tag: "h1" | "h2" | "h3" = "h2"): any {
  return {
    type: "heading",
    children: [
      {
        type: "text",
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: text,
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    tag: tag,
    version: 1,
  }
}

// Fetch file with transparent PNG fallback to make seeding bulletproof
async function fetchFile(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Status ${res.status}`)
    }
    const data = await res.arrayBuffer()
    const filename = url.split("/").pop()?.split("?")[0] || `file-${Date.now()}`
    const ext = filename.split(".").pop()?.toLowerCase() || ""

    let mimetype = "image/png"
    if (ext === "pdf") {
      mimetype = "application/pdf"
    } else if (ext === "docx") {
      mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    } else if (ext === "doc") {
      mimetype = "application/msword"
    } else if (ext === "jpeg" || ext === "jpg") {
      mimetype = "image/jpeg"
    } else if (ext === "webp") {
      mimetype = "image/webp"
    } else if (ext === "png") {
      mimetype = "image/png"
    }

    return {
      name: filename,
      data: Buffer.from(data),
      mimetype,
      size: data.byteLength,
    }
  } catch (error) {
    console.warn(`Error fetching ${url}, using transparent fallback:`, error)
    // 1x1 Transparent PNG
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    )
    return {
      name: "placeholder.png",
      data: dummyPng,
      mimetype: "image/png",
      size: dummyPng.byteLength,
    }
  }
}

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  payload.logger.info("Initializing Seeding for NOG (North Of Grand)...")

  // Clean up existing NOG admin and neighbor users if they exist
  const nogAdminEmail = process.env.TENANT_NOG_USERNAME || "admin@nog.blockvibe.org"
  const nogNeighborEmail =
    process.env.TENANT_NOG_NEIGHBOR_USERNAME || "neighbor_john@nog.blockvibe.org"
  const nogNeighborJohannaEmail =
    process.env.TENANT_NOG_NEIGHBOR_JOHANNA_USERNAME || "neighbor_johanna@nog.blockvibe.org"
  await payload.delete({
    collection: "users",
    where: {
      or: [
        { email: { equals: nogAdminEmail } },
        { email: { equals: nogNeighborEmail } },
        { email: { equals: nogNeighborJohannaEmail } },
      ],
    },
  })

  // 1. Clean up existing NOG Tenant data
  const existingTenants = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: "nog" } }, { domain: { equals: "www.northofgranddsm.org" } }],
    },
    limit: 100,
  })

  for (const tenant of existingTenants.docs) {
    payload.logger.info(`Cleaning up existing data for NOG Tenant ID: ${tenant.id}...`)

    console.log("Deleting headers...")
    await payload.delete({
      collection: "header",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    console.log("Deleting footers...")
    await payload.delete({
      collection: "footer",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    console.log("Deleting pages...")
    await payload.delete({
      collection: "pages",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    console.log("Deleting posts...")
    await payload.delete({
      collection: "posts",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    console.log("Deleting media...")
    await payload.delete({
      collection: "media",
      where: { tenant: { equals: tenant.id } },
    })

    console.log("Deleting invites...")
    await payload.delete({
      collection: "invites",
      where: { tenant: { equals: tenant.id } },
    })

    // Find all users linked to this tenant and remove the association first
    console.log("Finding tenant users...")
    const usersToUpdate = await payload.find({
      collection: "users",
      where: {
        "tenants.tenant": { equals: tenant.id },
      },
      limit: 1000,
    })

    console.log(`Updating ${usersToUpdate.docs.length} users to remove tenant mapping...`)
    for (const user of usersToUpdate.docs) {
      const updatedTenants = (user.tenants || [])
        .map((t: any) =>
          typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant,
        )
        .filter((id) => id !== tenant.id)

      await payload.update({
        collection: "users",
        id: user.id,
        context: { isSeeding: true },
        data: {
          tenants: updatedTenants.map((id) => ({ tenant: id })),
        },
      })
    }

    console.log("Deleting tenant...")
    await payload.delete({
      collection: "tenants",
      id: tenant.id,
    })
    payload.logger.info(`Old NOG Tenant ID ${tenant.id} cleaned.`)
  }

  // 2. Fetch media assets from the live site
  payload.logger.info("Fetching live media assets from northofgranddsm.org...")
  const [
    logoHeaderFile,
    logoFooterFile,
    homePhotoFile,
    boardPhotoFile,
    merch1File,
    merch2File,
    merch3File,
    slide1File,
    slide2File,
    slide3File,
    slide4File,
    slide5File,
    slide6File,
    slide7File,
    minutesMayFile,
    minutesMarFile,
    minutesFebFile,
    minutesJanFile,
    bylawsFile,
  ] = await Promise.all([
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/4/1/5/141517828/published/northofgrand-badge-color-blue.png?1723053124",
    ),
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/4/1/5/141517828/northofgrand-wordmark-color_orig.jpg",
    ),
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/4/1/5/141517828/editor/10690313-728536740515884-9046556421403047408-n.jpg?1723053527",
    ),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-board_orig.jpg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/4/1/5/141517828/img-7286_orig.jpg"),
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/4/1/5/141517828/northofgrand-badge-color-white-1-1_orig.png",
    ),
    fetchFile("https://www.northofgranddsm.org/uploads/1/4/1/5/141517828/img-7444_orig.jpg"),
    // Slides
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-architech.jpg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-art-walk.jpg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-breakdancing.jpg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-bridge.jpg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-couple.jpeg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-music-art-walk.jpg"),
    fetchFile("https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog-night-out.jpg"),
    // Minutes
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/05_may_2026_nog_general_meeting_minutes.docx",
    ),
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/03_mar_2026_nog_board_of_directors_meeting_minutes__1_.docx",
    ),
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/02_2026_nog_board_of_directors_meeting_minutes__1_.docx",
    ),
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/01_2026_nog_board_of_directors_meeting_minutes__1_.docx",
    ),
    // Bylaws
    fetchFile(
      "https://www.northofgranddsm.org/uploads/1/5/5/3/155377114/nog_bylaws_-_proposed_march_2026.pdf",
    ),
  ])

  // 3. Create Tenant
  payload.logger.info("Creating NOG Tenant...")
  const tenant = await payload.create({
    collection: "tenants",
    data: {
      name: "North Of Grand Des Moines",
      slug: "nog",
      domain: "www.northofgranddsm.org",
      template: "light",
    },
  })

  // Ensure Default Platform Tenant exists
  const defaultTenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "default" } },
    limit: 1,
  })
  let defaultTenantDoc: any
  if (defaultTenants.docs.length === 0) {
    payload.logger.info("Creating Default Platform Tenant...")
    defaultTenantDoc = await payload.create({
      collection: "tenants",
      data: {
        name: "BlockVibe Platform",
        slug: "default",
        template: "light",
      },
    })
  } else {
    defaultTenantDoc = defaultTenants.docs[0]
  }

  // Clean up default tenant's pages, headers, footers, and Space Request Form to prevent duplicates
  if (defaultTenantDoc) {
    payload.logger.info("Cleaning up existing default tenant pages/headers/footers...")
    try {
      await payload.delete({
        collection: "header",
        where: { tenant: { equals: defaultTenantDoc.id } },
        context: { disableRevalidate: true },
      })
      payload.logger.info("Deleted default tenant header.")
    } catch (e: any) {
      payload.logger.error("Failed to delete default tenant header: " + e.message)
      if (e.cause) payload.logger.error("Cause: " + e.cause.message)
    }

    try {
      await payload.delete({
        collection: "footer",
        where: { tenant: { equals: defaultTenantDoc.id } },
        context: { disableRevalidate: true },
      })
      payload.logger.info("Deleted default tenant footer.")
    } catch (e: any) {
      payload.logger.error("Failed to delete default tenant footer: " + e.message)
      if (e.cause) payload.logger.error("Cause: " + e.cause.message)
    }

    try {
      await payload.delete({
        collection: "pages",
        where: { tenant: { equals: defaultTenantDoc.id } },
        context: { disableRevalidate: true },
      })
      payload.logger.info("Deleted default tenant pages.")
    } catch (e: any) {
      payload.logger.error("Failed to delete default tenant pages: " + e.message)
      if (e.cause) payload.logger.error("Cause: " + e.cause.message)
    }
  }

  payload.logger.info("Deleting existing Space Request Forms...")
  try {
    await payload.delete({
      collection: "forms",
      where: { title: { equals: "Space Request Form" } },
    })
    payload.logger.info("Deleted existing Space Request Forms.")
  } catch (e: any) {
    payload.logger.error("Failed to delete space request form: " + e.message)
    if (e.cause) payload.logger.error("Cause: " + e.cause.message)
  }

  // 4. Create tenant-specific admin user, neighbor user & link superadmin
  const nogAdminPassword = process.env.TENANT_NOG_PASSWORD || "password1234"
  const nogNeighborPassword = process.env.TENANT_NOG_NEIGHBOR_PASSWORD || "neighbor1234"

  payload.logger.info(`Creating NOG Admin User: ${nogAdminEmail}`)
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "NOG Admin",
      email: nogAdminEmail,
      password: nogAdminPassword,
      role: "admin",
      status: "approved",
      tenants: [
        {
          tenant: tenant.id,
        },
      ],
    },
  })

  payload.logger.info(`Creating NOG Neighbor User: ${nogNeighborEmail}`)
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "John Neighbor",
      email: nogNeighborEmail,
      password: nogNeighborPassword,
      role: "contributor",
      status: "approved",
      isNeighbor: true,
      household: "John & Johanna Household",
      tenants: [
        {
          tenant: tenant.id,
        },
      ],
    },
  })

  const nogNeighborJohannaPassword =
    process.env.TENANT_NOG_NEIGHBOR_JOHANNA_PASSWORD || "neighbor1234"

  payload.logger.info(`Creating NOG Neighbor Wife User: ${nogNeighborJohannaEmail}`)
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Johanna Neighbor",
      email: nogNeighborJohannaEmail,
      password: nogNeighborJohannaPassword,
      role: "contributor",
      status: "approved",
      isNeighbor: true,
      household: "John & Johanna Household",
      tenants: [
        {
          tenant: tenant.id,
        },
      ],
    },
  })

  const superAdminEmail = process.env.LOCAL_SUPERADMIN_USERNAME || "eugen8@gmail.com"
  const superAdminUsers = await payload.find({
    collection: "users",
    where: {
      email: { equals: superAdminEmail },
    },
    limit: 1,
  })

  if (superAdminUsers.docs.length > 0) {
    const superAdmin = superAdminUsers.docs[0]
    const currentTenantIds = (superAdmin.tenants || [])
      .map((t: any) => (typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant))
      .filter((id) => id !== tenant.id)

    payload.logger.info(`Mapping Superadmin to NOG Tenant`)
    await payload.update({
      collection: "users",
      id: superAdmin.id,
      context: { isSeeding: true },
      data: {
        tenants: [...currentTenantIds.map((id) => ({ tenant: id })), { tenant: tenant.id }],
      },
    })
  }

  // 5. Create media items in Payload sequentially to prevent connection exhaustion and deadlocks
  payload.logger.info("Uploading media items sequentially...")
  const mediaItemsToCreate = [
    { alt: "North of Grand Blue Badge Logo", file: logoHeaderFile },
    { alt: "North of Grand Green Wordmark Logo", file: logoFooterFile },
    { alt: "North of Grand Historic House", file: homePhotoFile },
    { alt: "North of Grand 2026 Board Members", file: boardPhotoFile },
    { alt: "North of Grand Merch T-Shirt", file: merch1File },
    { alt: "North of Grand Badge White Logo", file: merch2File },
    { alt: "North of Grand Merch Mug", file: merch3File },
    { alt: "North of Grand Slide 1", file: slide1File },
    { alt: "North of Grand Slide 2", file: slide2File },
    { alt: "North of Grand Slide 3", file: slide3File },
    { alt: "North of Grand Slide 4", file: slide4File },
    { alt: "North of Grand Slide 5", file: slide5File },
    { alt: "North of Grand Slide 6", file: slide6File },
    { alt: "North of Grand Slide 7", file: slide7File },
    { alt: "May 2026 General Meeting Minutes", file: minutesMayFile },
    { alt: "March 2026 Board Meeting Minutes", file: minutesMarFile },
    { alt: "February 2026 Board Meeting Minutes", file: minutesFebFile },
    { alt: "January 2026 Board Meeting Minutes", file: minutesJanFile },
    { alt: "North of Grand Bylaws (Updated 2026)", file: bylawsFile },
  ]

  const mediaDocs: any[] = []
  for (const item of mediaItemsToCreate) {
    payload.logger.info(`Uploading media: ${item.alt}...`)
    const doc = await payload.create({
      collection: "media",
      data: { alt: item.alt, tenant: tenant.id },
      file: item.file,
    })
    mediaDocs.push(doc)
  }

  const [
    logoHeaderDoc,
    logoFooterDoc,
    homePhotoDoc,
    boardPhotoDoc,
    merch1Doc,
    merch2Doc,
    merch3Doc,
    slide1Doc,
    slide2Doc,
    slide3Doc,
    slide4Doc,
    slide5Doc,
    slide6Doc,
    slide7Doc,
    minutesMayDoc,
    minutesMarDoc,
    minutesFebDoc,
    minutesJanDoc,
    bylawsDoc,
  ] = mediaDocs

  // Delete existing forms to prevent duplicate/stale entries
  payload.logger.info("Deleting existing NOG Forms...")
  await payload.delete({
    collection: "forms",
    where: {
      or: [
        { title: { equals: "NOG Newsletter Signup Form" } },
        { title: { equals: "NOG General Contact Form" } },
      ],
    },
  })

  // Create NOG forms
  payload.logger.info("Creating NOG Newsletter Signup Form...")
  const newsletterForm = await payload.create({
    collection: "forms",
    data: {
      title: "NOG Newsletter Signup Form",
      submitButtonLabel: "Subscribe to Newsletter",
      confirmationType: "message",
      confirmationMessage: lexicalRichText([richHeading("Thank you for subscribing!", "h3")]),
      fields: [
        {
          name: "email",
          blockName: "email",
          blockType: "email",
          label: "Email Address",
          required: true,
          width: 100,
        },
      ],
    },
  })

  payload.logger.info("Creating NOG General Contact Form...")
  const contactForm = await payload.create({
    collection: "forms",
    data: {
      title: "NOG General Contact Form",
      submitButtonLabel: "Submit Message",
      confirmationType: "message",
      confirmationMessage: lexicalRichText([
        richHeading("Your message was sent!", "h3"),
        richParagraph("We'll get back to you soon."),
      ]),
      fields: [
        {
          name: "firstName",
          blockName: "firstName",
          blockType: "text",
          label: "First Name",
          required: true,
          width: 50,
        },
        {
          name: "lastName",
          blockName: "lastName",
          blockType: "text",
          label: "Last Name",
          required: false,
          width: 50,
        },
        {
          name: "email",
          blockName: "email",
          blockType: "email",
          label: "Email Address",
          required: true,
          width: 100,
        },
        {
          name: "comment",
          blockName: "comment",
          blockType: "textarea",
          label: "Message / Comment",
          required: true,
          width: 100,
        },
      ],
    },
  })

  // 6. Create Pages
  payload.logger.info("Creating pages...")

  // Home Page
  const homeDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "North Of Grand - Home",
      slug: "home",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Home Intro Content",
          blockType: "content",
          columns: [
            {
              type: "media",
              size: "oneThird",
              media: homePhotoDoc.id,
            },
            {
              type: "text",
              size: "twoThirds",
              richText: lexicalRichText([
                richParagraph(
                  "Welcome to the Historic District of North of Grand. The neighborhood is nestled in the heart of Des Moines, Iowa between 31st & 42nd street from Hwy 235 to Grand Ave.",
                ),
                richHeading("North of Grand Neighborhood Association", "h1"),
                richHeading("Mission Statement", "h3"),
                richParagraph(
                  "Our Mission is to strengthen relationships and improve quality of life for all residents and businesses in the North of Grand neighborhood. We commit to enhancing livability and revitalizing our historic neighborhood through opportunities of civic engagement. We advocate on behalf of North of Grand’s diverse residents as a liaison with local governments to preserve and uphold our community’s vibrant characteristics.",
                ),
              ]),
            },
          ],
        },
        {
          blockName: "Upcoming Events Content",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("Upcoming Events:"),
                richHeading("NoG Quarterly Meeting: Sunday, May 17th, 4pm-5:30pm", "h3"),
                richParagraph("Tentative Agenda:"),
                richParagraph("1. Welcome and Introductions"),
                richParagraph("2. Summer activities preview with Des Moines Parks and Rec"),
                richParagraph("3. Presentation of NoG Association Board Strategic Plan"),
                richParagraph(
                  "We have a vision for how our neighborhood can improve over the coming years and want to hear from you!",
                ),
                richParagraph("4. Announcement of updated NoG Association structure"),
                richParagraph("5. Community Notes and Event Announcements"),
                richParagraph(
                  "We will also have a live feed of the meeting through the Facebook event.",
                ),
              ]),
            },
          ],
        },
      ],
      meta: {
        title: "North Of Grand - Home",
        description: "Welcome to the Historic District of North of Grand, Des Moines, Iowa.",
      },
    },
  })

  // About Page
  const aboutDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "About - North Of Grand",
      slug: "about",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Slideshow",
          blockType: "slideshowBlock",
          images: [
            { image: slide1Doc.id },
            { image: slide2Doc.id },
            { image: slide3Doc.id },
            { image: slide4Doc.id },
            { image: slide5Doc.id },
            { image: slide6Doc.id },
            { image: slide7Doc.id },
          ],
        },
        {
          blockName: "About Info Content",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("About North of Grand"),
                richParagraph(
                  "Nestled within the vibrant cityscape of Des Moines, Iowa, the North of Grand neighborhood offers a harmonious blend of urban convenience and historic charm. Characterized by tree-lined streets and an eclectic mix of architectural styles, our cozy neighborhood boasts a distinct personality that captivates residents and visitors alike. From quaint boutique shops and unique bars & eateries, to lively community events like Ingersoll Live, North of Grand provides a dynamic living experience. Its proximity to downtown Des Moines ensures easy access to cultural attractions, dining options, and employment opportunities, while maintaining a serene residential atmosphere.",
                ),
                richHeading("Our Mission"),
                richParagraph(
                  "Our Mission is to strengthen relationships and improve quality of life for all residents and businesses in the North of Grand neighborhood. We commit to enhancing livability and revitalizing our historic neighborhood through opportunities of civic engagement. We advocate on behalf of North of Grand’s diverse residents as a liaison with local governments to preserve and uphold our community’s vibrant characteristics.",
                ),
                richHeading("Meet Our 2026 Board Members"),
              ]),
            },
          ],
        },
        {
          blockName: "Board Members Image Block",
          blockType: "content",
          columns: [
            {
              type: "media",
              size: "full",
              media: boardPhotoDoc.id,
            },
          ],
        },
      ],
      meta: {
        title: "About - North Of Grand",
        description:
          "Meet the board members and learn about the mission of North of Grand Des Moines.",
      },
    },
  })

  // Yearly Calendar Page
  const calendarDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Yearly Calendar - North Of Grand",
      slug: "yearly-calendar",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Google Calendar Block",
          blockType: "iframeBlock",
          iframeUrl:
            "https://calendar.google.com/calendar/embed?src=northofgrandpresident%40gmail.com&ctz=America%2FChicago",
          height: 600,
          title: "North Of Grand Google Calendar",
        },
        {
          blockName: "Social Media CTA",
          blockType: "cta",
          richText: lexicalRichText([
            richHeading("Prefer Social Updates?"),
            richParagraph(
              "Check out our Facebook page for detailed descriptions of meetings and local events.",
            ),
          ]),
          links: [
            {
              link: {
                type: "custom",
                label: "View Facebook Page",
                url: "https://www.facebook.com/North.of.Grand.DSM/?viewas=100000686899395",
                appearance: "default",
              },
            },
          ],
        },
      ],
      meta: {
        title: "Yearly Calendar - North Of Grand",
        description: "Check out the North of Grand yearly calendar and events.",
      },
    },
  })

  // Membership Page
  const membershipDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Membership - North Of Grand",
      slug: "membership",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Membership Copy Block",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("Membership"),
                richParagraph("Individual: $10"),
                richParagraph("Household: $20"),
                richParagraph("Payable though Venmo, Paypal or cash"),
                richHeading("Donations", "h3"),
                richParagraph(
                  "Donations & merchandise purchases help us put on community events such as our Annual Garage Sale and National Night Out. We are really hoping to grow our community engagement opportunities in the future and your participation directly impacts our community.",
                ),
                richHeading("How to Order:", "h3"),
                richParagraph(
                  "Please send an email to northofgrandpresident@gmail.com and request which size and item you'd like to purchase. You can either pay in cash upon pickup or we can send you a Paypal invoice through your email address.",
                ),
                richParagraph("Tshirts $25"),
                richParagraph("Mug $15"),
                richParagraph("Donation $____"),
              ]),
            },
          ],
        },
        {
          blockName: "Merchandise Images Block",
          blockType: "content",
          columns: [
            { type: "media", size: "oneThird", media: merch1Doc.id },
            { type: "media", size: "oneThird", media: merch2Doc.id },
            { type: "media", size: "oneThird", media: merch3Doc.id },
          ],
        },
      ],
      meta: {
        title: "Membership - North Of Grand",
        description: "Support North of Grand by becoming a member or buying merchandise.",
      },
    },
  })

  // Archives and Documents Page
  const archivesDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Archives and Documents - North Of Grand",
      slug: "archives-and-documents",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Minutes List",
          blockType: "fileListBlock",
          title: "Past Board Meeting Minutes",
          files: [
            { file: minutesMayDoc.id, description: "05_may_2026_nog_general_meeting_minutes.docx" },
            {
              file: minutesMarDoc.id,
              description: "03_mar_2026_nog_board_of_directors_meeting_minutes__1_.docx",
            },
            {
              file: minutesFebDoc.id,
              description: "02_2026_nog_board_of_directors_meeting_minutes__1_.docx",
            },
            {
              file: minutesJanDoc.id,
              description: "01_2026_nog_board_of_directors_meeting_minutes__1_.docx",
            },
          ],
        },
        {
          blockName: "Bylaws File",
          blockType: "fileListBlock",
          title: "Association Bylaws (updated 2026)",
          files: [{ file: bylawsDoc.id, description: "Proposed and updated amendments for 2026." }],
        },
      ],
      meta: {
        title: "Archives and Documents - North Of Grand",
        description: "Access past board meeting minutes and bylaws for North of Grand association.",
      },
    },
  })

  // Contact Page
  const contactDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Contact - North Of Grand",
      slug: "contact",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Contact Header Block",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("Contact Us"),
                richParagraph("We look forward to hearing from you!"),
              ]),
            },
          ],
        },
        {
          blockName: "Mailing List signup Form",
          blockType: "formBlock",
          enableIntro: true,
          introContent: lexicalRichText([
            richHeading("Join our mailing list!", "h3"),
            richParagraph("*we do not sell or share your info"),
          ]),
          form: newsletterForm.id,
        },
        {
          blockName: "General Question Form",
          blockType: "formBlock",
          enableIntro: true,
          introContent: lexicalRichText([richHeading("Have a question?", "h3")]),
          form: contactForm.id,
        },
        {
          blockName: "Map Embed",
          blockType: "iframeBlock",
          iframeUrl:
            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000.0!2d-93.66485899999999!3d41.5903345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87ee99b7b7a1dfa1%3A0xe10839e55ad0ba78!2sNorth%20of%20Grand%2C%20Des%20Moines%2C%20IA!5e0!3m2!1sen!2sus!4v1717650000000!5m2!1sen!2sus",
          height: 350,
          title: "North Of Grand Des Moines Area Map",
        },
        {
          blockName: "Social Links",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richParagraph("Connect with us on Facebook for news and community discussion."),
              ]),
              enableLink: true,
              link: {
                type: "custom",
                label: "Facebook Page",
                url: "https://www.facebook.com/North.of.Grand.DSM/",
                appearance: "default",
              },
            },
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richParagraph("Send an email directly to the association president."),
              ]),
              enableLink: true,
              link: {
                type: "custom",
                label: "Email President",
                url: "mailto:northofgrandpresident@gmail.com",
                appearance: "default",
              },
            },
          ],
        },
      ],
      meta: {
        title: "Contact - North Of Grand",
        description: "Get in touch with the North of Grand neighborhood association.",
      },
    },
  })
  // Create space request form using Payload Form Builder
  payload.logger.info("Creating Space Request Form...")
  const spaceRequestForm = await payload.create({
    collection: "forms",
    data: {
      title: "Space Request Form",
      submitButtonLabel: "Submit Space Request",
      confirmationType: "message",
      confirmationMessage: lexicalRichText([
        richHeading("Request Submitted!", "h2"),
        richParagraph("Thank you! Your neighborhood request has been submitted successfully."),
      ]),
      fields: [
        {
          name: "tenantName",
          blockName: "tenantName",
          blockType: "text",
          label: "Neighborhood / Tenant Name",
          required: true,
          width: 100,
        },
        {
          name: "email",
          blockName: "email",
          blockType: "email",
          label: "Contact Email",
          required: true,
          width: 50,
        },
        {
          name: "phone",
          blockName: "phone",
          blockType: "text",
          label: "Phone Number",
          required: true,
          width: 50,
        },
        {
          name: "address",
          blockName: "address",
          blockType: "text",
          label: "Full Mailing Address",
          required: true,
          width: 100,
        },
        {
          name: "website",
          blockName: "website",
          blockType: "text",
          label: "Existing Website (Optional)",
          required: false,
          width: 100,
        },
      ],
    },
  })

  // Seeding Default Platform Tenant Home Page
  payload.logger.info("Creating default platform homepage...")
  const defaultHomeDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "BlockVibe Platform - Home",
      slug: "home",
      tenant: defaultTenantDoc.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "BlockVibe Hero Section",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("One platform for your neighborhood", "h1"),
                richParagraph(
                  "BlockVibe provides neighborhood associations with the digital tools they need to connect residents, build community trust, run democratic polls, and secure support.",
                ),
              ]),
            },
          ],
        },
        {
          blockName: "See BlockVibe in Action Box",
          blockType: "cta",
          richText: lexicalRichText([
            richHeading("See BlockVibe in Action"),
            richParagraph(
              "Explore our showcase site modeled for the North of Grand neighborhood in Des Moines, Iowa.",
            ),
          ]),
          links: [
            {
              link: {
                type: "custom",
                label: "Visit Site",
                url: "http://nog.localhost:3000",
                appearance: "default",
              },
            },
          ],
        },
        {
          blockName: "BlockVibe Capabilities Grid Part 1",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richHeading("Modern Site Builder", "h3"),
                richParagraph(
                  "Launch a clean public website for your association with custom themes, static pages, contact forms, and layouts.",
                ),
              ]),
            },
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richHeading("Resident CRM & Directory", "h3"),
                richParagraph(
                  "Maintain a secure registry of neighbors, track registered members vs mailing contacts, and manage roles in one workspace.",
                ),
              ]),
            },
          ],
        },
        {
          blockName: "BlockVibe Capabilities Grid Part 2",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richHeading("Email Broadcaster", "h3"),
                richParagraph(
                  "Compose and send announcements directly to your verified neighborhood contact list using AWS SES.",
                ),
              ]),
            },
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richHeading("Democratic Voting", "h3"),
                richParagraph(
                  "Run secure board elections, budget approvals, and community opinion polls with one ballot per member rules.",
                ),
              ]),
            },
          ],
        },
        {
          blockName: "BlockVibe Capabilities Grid Part 3",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richHeading("Lightweight Support Drives", "h3"),
                richParagraph(
                  "Accept annual or monthly contributions directly into your association's own PayPal account without platform fees.",
                ),
              ]),
            },
            {
              type: "text",
              size: "half",
              richText: lexicalRichText([
                richHeading("Secure & Privacy-First", "h3"),
                richParagraph(
                  "Your community data belongs to you. Built with strict role permissions, SSL encryption, and high data safety protocols.",
                ),
              ]),
            },
          ],
        },
        {
          blockName: "BlockVibe Tenant Request Form",
          blockType: "formBlock",
          enableIntro: true,
          introContent: lexicalRichText([
            richHeading("Bring BlockVibe to Your Neighborhood", "h2"),
            richParagraph(
              "Submit a request to set up a digital workspace for your neighborhood association.",
            ),
          ]),
          form: spaceRequestForm.id,
        },
      ],
      meta: {
        title: "BlockVibe - Operating System for Neighborhood Associations",
        description:
          "One platform for your neighborhood: website, member directory, email, polls, and recurring support.",
      },
    },
  })

  // 7. Create Header and Footer globals (linked to the newly created pages and logos)
  payload.logger.info("Seeding Header and Footer...")
  await Promise.all([
    // NOG Header
    payload.create({
      collection: "header",
      context: { disableRevalidate: true },
      data: {
        tenant: tenant.id,
        logoImage: logoHeaderDoc.id,
        navItems: [
          {
            link: {
              type: "reference",
              label: "HOME",
              reference: { relationTo: "pages", value: homeDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "ABOUT",
              reference: { relationTo: "pages", value: aboutDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "YEARLY CALENDAR",
              reference: { relationTo: "pages", value: calendarDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "MEMBERSHIP",
              reference: { relationTo: "pages", value: membershipDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "ARCHIVES AND DOCUMENTS",
              reference: { relationTo: "pages", value: archivesDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "CONTACT",
              reference: { relationTo: "pages", value: contactDoc.id },
            },
          },
        ],
      },
    }),
    // NOG Footer
    payload.create({
      collection: "footer",
      context: { disableRevalidate: true },
      data: {
        tenant: tenant.id,
        logoImage: logoFooterDoc.id,
        navItems: [
          {
            link: {
              type: "custom",
              label: "Admin Portal",
              url: "/admin",
            },
          },
          {
            link: {
              type: "custom",
              label: "Real Website Reference",
              newTab: true,
              url: "https://www.northofgranddsm.org/",
            },
          },
        ],
      },
    }),
    // Default Platform Header
    payload.create({
      collection: "header",
      context: { disableRevalidate: true },
      data: {
        tenant: defaultTenantDoc.id,
        navItems: [
          {
            link: {
              type: "custom",
              label: "Showcase Site",
              url: "http://nog.localhost:3000",
            },
          },
        ],
      },
    }),
    // Default Platform Footer
    payload.create({
      collection: "footer",
      context: { disableRevalidate: true },
      data: {
        tenant: defaultTenantDoc.id,
        navItems: [
          {
            link: {
              type: "custom",
              label: "Admin Portal",
              url: "/admin",
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info("Tenant and Platform Seeded Successfully with custom pages and live assets!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error during NOG seeding:", err)
  if (err && typeof err === "object" && "data" in err) {
    console.error("Validation details:", JSON.stringify((err as any).data, null, 2))
  }
  process.exit(1)
})
