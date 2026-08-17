/**
 * How to run this script:
 * pnpm tsx src/scripts/seed-beaverdale.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import { home } from "../endpoints/seed/home"
import { contact as contactPageData } from "../endpoints/seed/contact-page"
import { post2 } from "../endpoints/seed/post-2"

async function fetchFile(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}`)
  }
  const data = await res.arrayBuffer()
  return {
    name: url.split("/").pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split(".").pop()}`,
    size: data.byteLength,
  }
}

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  payload.logger.info("Initializing Seeding for Beaverdale...")

  // Clean up existing Beaverdale admin user if they exist
  const beaverdaleAdminEmail =
    process.env.TENANT_BEAVERDALE_USERNAME || "admin@beaverdale.blockvibe.org"
  await payload.delete({
    collection: "users",
    where: {
      email: { equals: beaverdaleAdminEmail },
    },
  })

  // 1. Clean up existing Beaverdale Tenant data
  const existingTenant = await payload.find({
    collection: "tenants",
    where: {
      slug: { equals: "beaverdale" },
    },
    limit: 1,
  })

  if (existingTenant.docs.length > 0) {
    const tenant = existingTenant.docs[0]
    payload.logger.info(`Cleaning up existing data for Beaverdale Tenant ID: ${tenant.id}...`)

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

    // Find all users linked to this tenant and remove the association first
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
        context: { isSeeding: true },
        data: {
          tenants: updatedTenants.map((id) => ({ tenant: id })),
        },
      })
    }

    await payload.delete({
      collection: "tenants",
      id: tenant.id,
    })
    payload.logger.info("Old Beaverdale Tenant data cleaned.")
  }

  // 2. Fetch media assets
  payload.logger.info("Fetching media assets...")
  const [imageBuffer, heroBuffer] = await Promise.all([
    fetchFile(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post2.webp",
    ),
    fetchFile(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-hero1.webp",
    ),
  ])

  // 3. Create Tenant
  payload.logger.info("Creating Beaverdale Tenant...")
  const tenant = await payload.create({
    collection: "tenants",
    data: {
      name: "Beaverdale Neighborhood Association",
      slug: "beaverdale",
      domain: "www.beaverdale.org",
      template: "dark",
    },
  })

  // 4. Create tenant-specific admin user & link superadmin
  const beaverdaleAdminPassword = process.env.TENANT_BEAVERDALE_PASSWORD || "password1234"

  payload.logger.info(`Creating Beaverdale Admin User: ${beaverdaleAdminEmail}`)
  const beaverdaleAdminUser = await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: "Beaverdale Admin",
      email: beaverdaleAdminEmail,
      password: beaverdaleAdminPassword,
      role: "admin",
      status: "approved",
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

    payload.logger.info(`Mapping Superadmin to Beaverdale Tenant`)
    await payload.update({
      collection: "users",
      id: superAdmin.id,
      context: { isSeeding: true },
      data: {
        tenants: [...currentTenantIds.map((id) => ({ tenant: id })), { tenant: tenant.id }],
      },
    })
  }

  // Find or create global contact form
  const formsResult = await payload.find({
    collection: "forms",
    limit: 1,
  })
  const contactForm = formsResult.docs[0]

  // 5. Seed Beaverdale contents
  payload.logger.info("Seeding Beaverdale content pages, posts, and media...")

  const [mediaImage, mediaHero] = await Promise.all([
    payload.create({
      collection: "media",
      data: {
        alt: "Beaverdale Post Image",
        tenant: tenant.id,
      },
      file: imageBuffer,
    }),
    payload.create({
      collection: "media",
      data: {
        alt: "Beaverdale Hero Image",
        tenant: tenant.id,
      },
      file: heroBuffer,
    }),
  ])

  // Create post
  const postData = post2({
    heroImage: mediaImage,
    blockImage: mediaImage,
    author: beaverdaleAdminUser,
  })
  await payload.create({
    collection: "posts",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      ...postData,
      title: "Beaverdale Fall Festival",
      slug: "beaverdale-fall-festival",
      meta: {
        ...postData.meta,
        title: "Beaverdale Fall Festival",
        description: "Discover the schedule, vendors, and events for this year's Fall Festival.",
      },
      tenant: tenant.id,
    },
  })

  // Create home & contact pages
  const homePageData: any = home({ heroImage: mediaHero, metaImage: mediaImage })

  // Customize Beaverdale specific hero title, description and meta details
  if (homePageData.hero?.richText?.root?.children?.[0]?.children?.[0]) {
    homePageData.hero.richText.root.children[0].children[0].text =
      "Beaverdale Neighborhood Association"
  }
  if (homePageData.hero?.richText?.root?.children?.[1]) {
    homePageData.hero.richText.root.children[1].children = [
      {
        type: "text",
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: "Welcome to Beaverdale! Famous for our brick homes, quiet streets, and annual Beaverdale Fall Festival. Explore our events list and community resources below.",
        version: 1,
      },
    ]
  }
  if (homePageData.meta) {
    homePageData.meta.title = "Beaverdale Neighborhood Association"
    homePageData.meta.description =
      "Welcome to the official website of the Beaverdale Neighborhood Association."
  }

  const [homePage, contactPage] = await Promise.all([
    payload.create({
      collection: "pages",
      depth: 0,
      context: { disableRevalidate: true },
      data: {
        ...homePageData,
        title: "Beaverdale Neighborhood Association",
        slug: "home",
        tenant: tenant.id,
      },
    }),
    payload.create({
      collection: "pages",
      depth: 0,
      context: { disableRevalidate: true },
      data: {
        ...contactPageData({ contactForm }),
        tenant: tenant.id,
      },
    }),
  ])

  // Create header and footer
  await Promise.all([
    payload.create({
      collection: "header",
      context: { disableRevalidate: true },
      data: {
        tenant: tenant.id,
        navItems: [
          {
            link: {
              type: "custom",
              label: "Posts",
              url: "/posts",
            },
          },
          {
            link: {
              type: "reference",
              label: "Contact",
              reference: {
                relationTo: "pages",
                value: contactPage.id,
              },
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
        navItems: [
          {
            link: {
              type: "custom",
              label: "Admin",
              url: "/admin",
            },
          },
          {
            link: {
              type: "custom",
              label: "Source Code",
              newTab: true,
              url: "https://github.com/MyNeighborhod",
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info("Beaverdale Tenant Seeded Successfully!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error during Beaverdale seeding:", err)
  process.exit(1)
})
