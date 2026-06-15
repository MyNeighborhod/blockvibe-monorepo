/**
 * How to run this script:
 * pnpm tsx src/scripts/seed-twin-suns.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import fs from "fs"
import path from "path"

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

// Fetch file with transparent PNG fallback
async function fetchFile(url: string, customName?: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Status ${res.status}`)
    }
    const data = await res.arrayBuffer()
    const lastSegment = url.split("/").pop()?.split("?")[0] || `file-${Date.now()}`

    let filename = customName ? `${customName}.jpg` : lastSegment
    let ext = lastSegment.includes(".") ? lastSegment.split(".").pop() || "jpg" : "jpg"

    if (!filename.includes(".")) {
      filename = `${filename}.jpg`
    }

    return {
      name: filename,
      data: Buffer.from(data),
      mimetype: `image/${ext === "jpeg" || ext === "jpg" ? "jpeg" : ext === "webp" ? "webp" : ext === "png" ? "png" : "jpeg"}`,
      size: data.byteLength,
    }
  } catch (error) {
    console.warn(`Error fetching ${url}, using transparent fallback:`, error)
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

function readLocalFile(filePath: string, name: string) {
  try {
    const data = fs.readFileSync(filePath)
    const ext = filePath.split(".").pop() || "jpg"
    return {
      name: `${name}.${ext}`,
      data: data,
      mimetype: `image/${ext === "jpeg" || ext === "jpg" ? "jpeg" : ext === "webp" ? "webp" : ext === "png" ? "png" : "jpeg"}`,
      size: data.byteLength,
    }
  } catch (error) {
    console.warn(`Error reading local file ${filePath}, using fallback:`, error)
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    )
    return {
      name: `${name}.png`,
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

  payload.logger.info("Initializing Seeding for Twin Suns Oasis...")

  // Clean up existing admin user if they exist
  const twinSunsAdminEmail =
    process.env.TENANT_TWIN_SUNS_USERNAME || "admin@twin-suns.blockvibe.org"
  await payload.delete({
    collection: "users",
    where: {
      email: { equals: twinSunsAdminEmail },
    },
  })

  // 1. Clean up existing Twin Suns Tenant data
  const existingTenant = await payload.find({
    collection: "tenants",
    where: {
      slug: { equals: "twin-suns" },
    },
    limit: 1,
  })

  if (existingTenant.docs.length > 0) {
    const tenant = existingTenant.docs[0]
    payload.logger.info(`Cleaning up existing data for Twin Suns Tenant ID: ${tenant.id}...`)

    await payload.delete({
      collection: "pages",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    await payload.delete({
      collection: "posts",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    await payload.delete({
      collection: "media",
      where: { tenant: { equals: tenant.id } },
    })

    await payload.delete({
      collection: "header",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    await payload.delete({
      collection: "footer",
      where: { tenant: { equals: tenant.id } },
      context: { disableRevalidate: true },
    })

    // Find all users linked to this tenant and remove the association
    const usersToUpdate = await payload.find({
      collection: "users",
      where: {
        "tenants.tenant": { equals: tenant.id },
      },
      limit: 1000,
    })

    for (const user of usersToUpdate.docs) {
      const updatedTenants = (user.tenants || [])
        .map((t: any) =>
          typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant,
        )
        .filter((id) => id !== tenant.id)

      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          tenants: updatedTenants.map((id) => ({ tenant: id })),
        },
      })
    }

    await payload.delete({
      collection: "tenants",
      id: tenant.id,
    })
    payload.logger.info("Old Twin Suns Tenant data cleaned.")
  }

  // 2. Fetch beautiful space and desert media assets from Unsplash
  payload.logger.info("Fetching space and desert themed media assets...")
  const [
    logoHeaderFile,
    logoFooterFile,
    homePhotoFile, // Desert dunes
    vaporatorPhotoFile, // Rusty metal structure
    boardPhotoFile, // Group of people / crew
    postPhotoFile, // Space sky
  ] = await Promise.all([
    // Local pixel-art logo image
    readLocalFile(
      path.resolve(process.cwd(), "src/scripts/twin-suns-logo.jpg"),
      "twin-suns-logo-header",
    ),
    // Footer logo
    readLocalFile(
      path.resolve(process.cwd(), "src/scripts/twin-suns-logo.jpg"),
      "twin-suns-logo-footer",
    ),
    // Desert dunes at sunset
    fetchFile(
      "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1200&q=80",
      "twin-suns-hero",
    ),
    // Sci-fi moisture vaporator look
    fetchFile(
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
      "twin-suns-vaporator",
    ),
    // Board members / crew
    fetchFile(
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
      "twin-suns-board",
    ),
    // Galaxy nebula for posts
    fetchFile(
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
      "twin-suns-post",
    ),
  ])

  // 3. Create Tenant
  payload.logger.info("Creating Twin Suns Tenant...")
  const tenant = await payload.create({
    collection: "tenants",
    data: {
      name: "Twin Suns Oasis Association",
      slug: "twin-suns",
      domain: "www.twisunoasis.org",
      template: "dark", // Set theme to dark
    },
  })

  // 4. Create tenant-specific admin user & link superadmin
  const twinSunsAdminPassword = process.env.TENANT_TWIN_SUNS_PASSWORD || "oasis1234"

  payload.logger.info(`Creating/Recreating Twin Suns Admin User: ${twinSunsAdminEmail}`)
  const adminUser = await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Twin Suns Admin",
      email: twinSunsAdminEmail,
      password: twinSunsAdminPassword,
      role: "admin",
      status: "approved",
      tenants: [
        {
          tenant: tenant.id,
        },
      ],
    },
  })

  // Create Editor
  const twinSunsEditorEmail = "editor@twin-suns.blockvibe.org"
  await payload.delete({
    collection: "users",
    where: { email: { equals: twinSunsEditorEmail } },
  })
  payload.logger.info(`Creating Twin Suns Editor User: ${twinSunsEditorEmail}`)
  const editorUser = await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Twin Suns Editor",
      email: twinSunsEditorEmail,
      password: "editor1234",
      role: "editor",
      status: "approved",
      tenants: [
        {
          tenant: tenant.id,
        },
      ],
    },
  })

  // Create Contributor (Approved)
  const twinSunsContributorEmail = "contributor@twin-suns.blockvibe.org"
  await payload.delete({
    collection: "users",
    where: { email: { equals: twinSunsContributorEmail } },
  })
  payload.logger.info(`Creating Twin Suns Contributor User: ${twinSunsContributorEmail}`)
  const contributorUser = await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Twin Suns Contributor",
      email: twinSunsContributorEmail,
      password: "contrib1234",
      role: "contributor",
      status: "approved",
      tenants: [
        {
          tenant: tenant.id,
        },
      ],
    },
  })

  // Create Staging (Pending) User
  const twinSunsPendingEmail = "pending@twin-suns.blockvibe.org"
  await payload.delete({
    collection: "users",
    where: { email: { equals: twinSunsPendingEmail } },
  })
  payload.logger.info(`Creating Twin Suns Pending User: ${twinSunsPendingEmail}`)
  const pendingUser = await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Twin Suns Pending Registration",
      email: twinSunsPendingEmail,
      password: "pending1234",
      role: "contributor",
      status: "pending",
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

    payload.logger.info(`Mapping Superadmin to Twin Suns Tenant`)
    await payload.update({
      collection: "users",
      id: superAdmin.id,
      context: { isSeeding: true },
      data: {
        role: "superadmin",
        status: "approved",
        tenants: [...currentTenantIds.map((id) => ({ tenant: id })), { tenant: tenant.id }],
      },
    })
  } else {
    payload.logger.info(`Creating Superadmin User: ${superAdminEmail}`)
    await payload.create({
      collection: "users",
      context: { isSeeding: true },
      data: {
        name: "Super Admin",
        email: superAdminEmail,
        password: process.env.LOCAL_SUPERADMIN_PASSWORD || "admin1234",
        role: "superadmin",
        status: "approved",
        tenants: [{ tenant: tenant.id }],
      },
    })
  }

  // 5. Create media items in Payload
  payload.logger.info("Uploading media items...")
  const [
    logoHeaderDoc,
    logoFooterDoc,
    homePhotoDoc,
    vaporatorPhotoDoc,
    boardPhotoDoc,
    postPhotoDoc,
  ] = await Promise.all([
    payload.create({
      collection: "media",
      data: { alt: "Twin Suns Amber Glyphs Logo", tenant: tenant.id },
      file: logoHeaderFile,
    }),
    payload.create({
      collection: "media",
      data: { alt: "Twin Suns Amber Glyph Small", tenant: tenant.id },
      file: logoFooterFile,
    }),
    payload.create({
      collection: "media",
      data: { alt: "Red desert canyons of the twin star system", tenant: tenant.id },
      file: homePhotoFile,
    }),
    payload.create({
      collection: "media",
      data: { alt: "Communal Moisture Vaporator unit", tenant: tenant.id },
      file: vaporatorPhotoFile,
    }),
    payload.create({
      collection: "media",
      data: { alt: "Twin Suns Council Members 2026", tenant: tenant.id },
      file: boardPhotoFile,
    }),
    payload.create({
      collection: "media",
      data: { alt: "Outer Rim Galaxy Nebula", tenant: tenant.id },
      file: postPhotoFile,
    }),
  ])

  // Find or use global contact form
  const formsResult = await payload.find({
    collection: "forms",
    limit: 1,
  })
  const contactForm = formsResult.docs[0]

  // 6. Create Pages
  payload.logger.info("Creating pages...")

  // Home Page
  const homeDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Twin Suns Oasis - Home",
      slug: "home",
      tenant: tenant.id,
      hero: {
        type: "highImpact",
        media: homePhotoDoc.id,
        richText: lexicalRichText([
          richHeading("Twin Suns Oasis Association", "h1"),
          richParagraph("Moisture, Community, and Harmony in the Outer Rim."),
        ]),
        links: [
          {
            link: {
              type: "custom",
              appearance: "default",
              label: "Announcements",
              url: "/posts",
            },
          },
          {
            link: {
              type: "custom",
              appearance: "outline",
              label: "Water Registry",
              url: "/membership",
            },
          },
        ],
      },
      layout: [
        {
          blockName: "Home Intro Content",
          blockType: "content",
          columns: [
            {
              type: "media",
              size: "oneThird",
              media: vaporatorPhotoDoc.id,
            },
            {
              type: "text",
              size: "twoThirds",
              richText: lexicalRichText([
                richHeading("Out of the World Sanctuary"),
                richParagraph(
                  "Nestled within the deep, copper-toned canyons of a remote desert world at the edge of the Outer Rim, Twin Suns Oasis began as a modest settlement clustered around three ancient moisture vaporators.",
                ),
                richParagraph(
                  "Today, it is a vibrant commune of moisture farmers, scrap-salvagers, and retired orbital pilots who have chosen a peaceful life under our twin stars, away from the heavy-handed control of the Sovereign Core.",
                ),
                richParagraph(
                  "The Association is dedicated to maintaining our shared atmospheric collection grid, resolving scrap-salvage boundaries, and keeping Beggar’s Canyon safe for all inhabitants.",
                ),
              ]),
            },
          ],
        },
        {
          blockName: "Features & Rules",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "oneThird",
              richText: lexicalRichText([
                richHeading("Vaporator Grid", "h3"),
                richParagraph(
                  "We collectively own and service 12 heavy-duty condenser towers. Regular filter purges keep our community water tanks at 99.8% purity.",
                ),
              ]),
            },
            {
              type: "text",
              size: "oneThird",
              richText: lexicalRichText([
                richHeading("Flight Speed Limits", "h3"),
                richParagraph(
                  "Hover-skiffs and T-16 sport flyers must maintain sub-sonic speeds (under 40 knots) while flying through residential canyon zones.",
                ),
              ]),
            },
            {
              type: "text",
              size: "oneThird",
              richText: lexicalRichText([
                richHeading("Cantina Nights", "h3"),
                richParagraph(
                  "Join us at the Oasis Lounge every solar-Tuesday for synth-harmonica sessions. Half-priced blue milk and roasted spice bread for residents.",
                ),
              ]),
            },
          ],
        },
      ],
      meta: {
        title: "Twin Suns Oasis Association",
        description:
          "Moisture, Community, and Harmony in the Outer Rim. Welcome to our dome commune.",
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
      title: "About - Twin Suns Oasis",
      slug: "about",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "About Info Content",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("Our History & Mission"),
                richParagraph(
                  "Twin Suns Oasis was founded in the year 842 following the Great Orbital Shift. A band of star-travelers seeking independence landed in the Canyon of Whispers and established a small moisture collective. Our survival depends on collaboration, resource conservation, and self-reliance.",
                ),
                richParagraph(
                  "Our mission is to maintain the critical machinery of our community, protect our residents from desert nomads, and cultivate a peaceful, welcoming outpost for all free species of the galaxy.",
                ),
                richHeading("Meet the Oasis Council Members"),
              ]),
            },
          ],
        },
        {
          blockName: "Council Photo Block",
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
        title: "About - Twin Suns Oasis",
        description:
          "Learn about the history, council members, and mission of the Twin Suns Oasis settlement.",
      },
    },
  })

  // Cantina Calendar Page
  const calendarDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Oasis Calendar - Twin Suns Oasis",
      slug: "cantina-calendar",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Calendar Block",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("Oasis Event Calendar"),
                richParagraph(
                  "Check our frequency channel or the cantina board for event coordinate details.",
                ),
                richHeading("Dune-Nomad Trade Bazaar: Solar-Sunday, 14:00", "h3"),
                richParagraph(
                  "Exchange scrap metal and mechanical parts with local canyon clans. Peacekeepers will be on-site to ensure neutral trading.",
                ),
                richHeading("Beggar’s Canyon Speed Trials: Solar-Friday, 18:00", "h3"),
                richParagraph(
                  "Watch our finest local pilots navigate their customized hover-skiffs through the needle-eye rocks. Safety shielding required.",
                ),
                richHeading("Grid Purge Maintenance: Solar-Thursday, 02:00 - 04:00", "h3"),
                richParagraph(
                  "Water pressure will drop slightly during this time as the moisture vaporators cycle their central filters.",
                ),
              ]),
            },
          ],
        },
      ],
      meta: {
        title: "Events & Calendar - Twin Suns Oasis",
        description:
          "Check the scheduling for trade bazaars, skiff races, and maintenance windows.",
      },
    },
  })

  // Water Rights & Membership Page
  const membershipDoc = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "Water Rights & Merch - Twin Suns Oasis",
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
                richHeading("Water Allotments & Association Support"),
                richParagraph(
                  "Maintaining high-performance vaporator grids requires regular power cells and copper coils. Residents support our community through voluntary water credit contributions:",
                ),
                richParagraph(
                  "• Single Dome Dweller: 10 Credits / solar-month (includes basic vaporator allotment)",
                ),
                richParagraph(
                  "• Household Dome Unit: 20 Credits / solar-month (includes full family dome allotment)",
                ),
                richHeading("Outpost Merchandise", "h3"),
                richParagraph(
                  "All credits and purchases directly fund the canyon protective grid and community lounge facilities. Send your order via frequency to the President's office:",
                ),
                richParagraph("• Oasis Flight Jackets: 25 Credits (sizes S, M, L, XL)"),
                richParagraph(
                  "• Twin Suns Cyber Mug: 15 Credits (insulated, heat-resistant, great for warm blue milk)",
                ),
                richParagraph("• Geothermal Project Donation: 50 Credits"),
              ]),
            },
          ],
        },
      ],
      meta: {
        title: "Water Rights & Membership - Twin Suns Oasis",
        description:
          "Manage your moisture vaporator allocations and support the canyon defensive grid.",
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
      title: "Contact - Twin Suns Oasis",
      slug: "contact",
      tenant: tenant.id,
      hero: {
        type: "none",
      },
      layout: [
        {
          blockName: "Contact Section Block",
          blockType: "content",
          columns: [
            {
              type: "text",
              size: "full",
              richText: lexicalRichText([
                richHeading("Contact the Council"),
                richParagraph(
                  "Report sandstorm damage, request a vaporator diagnostic, or alert peacekeepers of safety concerns in the canyons.",
                ),
              ]),
            },
          ],
        },
        ...(contactForm
          ? [
              {
                blockName: "Contact Form Block",
                blockType: "formBlock" as const,
                enableIntro: false,
                form: contactForm.id as number,
              },
            ]
          : []),
      ],
      meta: {
        title: "Contact - Twin Suns Oasis",
        description: "Send a message to the Twin Suns Oasis council.",
      },
    },
  })

  // 7. Seed welcome post
  payload.logger.info("Seeding welcome post...")
  await payload.create({
    collection: "posts",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      slug: "dune-nomad-treaty-signed",
      _status: "published",
      title: "Dune-Nomad Peace Treaty Signed",
      tenant: tenant.id,
      authors: [adminUser.id as number],
      contributingEditors: [contributorUser.id as number],
      heroImage: postPhotoDoc.id,
      content: lexicalRichText([
        richHeading("Peace in the Canyons"),
        richParagraph(
          "The Council is pleased to announce a formal commerce agreement with the leaders of the canyon nomadic clans.",
        ),
        richParagraph(
          "Under the new treaty, the clans will have designated trading booths at our bi-weekly Trade Bazaar. In return, they have agreed to bypass our residential dome perimeters and respect our moisture vaporator buffer zones.",
        ),
        richParagraph(
          "This ensures a safer environment for our homesteads and marks a new era of peaceful trade in our sector.",
        ),
      ]),
      meta: {
        title: "Dune-Nomad Peace Treaty Signed",
        description:
          "Read about the new trade and security agreement with the desert nomadic clans.",
        image: postPhotoDoc.id,
      },
    },
  })

  // 8. Create Header and Footer globals
  payload.logger.info("Seeding Header and Footer...")
  await Promise.all([
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
              label: "Home",
              reference: { relationTo: "pages", value: homeDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "About",
              reference: { relationTo: "pages", value: aboutDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "Cantina Calendar",
              reference: { relationTo: "pages", value: calendarDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "Water & Merch",
              reference: { relationTo: "pages", value: membershipDoc.id },
            },
          },
          {
            link: {
              type: "reference",
              label: "Contact",
              reference: { relationTo: "pages", value: contactDoc.id },
            },
          },
        ],
      },
    }),
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
              label: "Outer Rim Net",
              newTab: true,
              url: "https://unsplash.com",
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info("Twin Suns Tenant Seeded Successfully with custom pages and sci-fi assets!")

  console.log(`\n======================================================`)
  console.log(` tenant "twin-suns" successfully generated!`)
  console.log(`======================================================`)
  console.log(`  Tenant Name: Twin Suns Oasis Association`)
  console.log(`  Admin User:  ${twinSunsAdminEmail}`)
  console.log(`  Password:    ${twinSunsAdminPassword}`)
  console.log(`  Domain:      http://twin-suns.localhost:3000`)
  console.log(`  Admin URL:   http://twin-suns.localhost:3000/admin`)
  console.log(`======================================================\n`)

  process.exit(0)
}

run().catch((err) => {
  console.error("Error during Twin Suns seeding:", err)
  process.exit(1)
})
