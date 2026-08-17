/**
 * How to run this script:
 * pnpm tsx src/scripts/generate-tenant.ts --slug=<slug> --name="<Name>" --domain="<domain>" --template="<light|dark>"
 *
 * Example:
 * pnpm tsx src/scripts/generate-tenant.ts --slug=oakwood --name="Oakwood Community" --domain="www.oakwooddsm.org" --template=light
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import fs from "fs"
import path from "path"
import {
  getTemplateHome,
  getTemplateContact,
  getTemplatePost,
  getTemplateHeader,
  getTemplateFooter,
} from "../templating/tenant-template"

function generatePassword(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let pass = ""
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

async function fetchFile(url: string) {
  try {
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
  } catch (error) {
    console.warn(`Error fetching ${url}, using fallback transparent PNG`, error)
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
  // 1. Parse arguments
  const args = process.argv.slice(2)
  const params: Record<string, string> = {}
  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const parts = arg.slice(2).split("=")
      const key = parts[0]
      const value = parts.slice(1).join("=")
      params[key] = value
    }
  })

  const slug = params.slug
  if (!slug) {
    console.error("Error: --slug option is required.")
    console.log(
      'Usage: pnpm tsx src/scripts/generate-tenant.ts --slug=<slug> [--name="<Name>"] [--domain="<domain>"] [--template="<light|dark>"]',
    )
    process.exit(1)
  }

  // Validate slug structure
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    console.error("Error: --slug must contain only lowercase letters, numbers, and hyphens.")
    process.exit(1)
  }

  const name = params.name || `${slug.charAt(0).toUpperCase() + slug.slice(1)} Tenant`
  const domain = params.domain || `www.${slug}.org`
  const templateTheme = params.template === "dark" ? "dark" : "light"

  console.log(`Generating Tenant: ${name} (${slug})`)

  // 2. Manage environment variables
  const slugUpper = slug.toUpperCase().replace(/-/g, "_")
  const usernameEnvKey = `TENANT_${slugUpper}_USERNAME`
  const passwordEnvKey = `TENANT_${slugUpper}_PASSWORD`

  let tenantUsername = process.env[usernameEnvKey] || `admin@${slug}.blockvibe.org`
  let tenantPassword = process.env[passwordEnvKey] || ""

  if (!tenantPassword) {
    tenantPassword = generatePassword(8)
    const envPath = path.resolve(process.cwd(), ".env")
    let envContent = ""
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8")
    }
    const envLinesToAdd = `
# Credentials for ${slug} Tenant
${usernameEnvKey}=${tenantUsername}
${passwordEnvKey}=${tenantPassword}
`
    if (!envContent.includes(usernameEnvKey)) {
      fs.appendFileSync(envPath, envLinesToAdd, "utf-8")
      console.log(`Saved credentials to .env file:`)
      console.log(`  ${usernameEnvKey}=${tenantUsername}`)
      console.log(`  ${passwordEnvKey}=${tenantPassword}`)
    }
  } else {
    console.log(`Reusing existing credentials from .env: ${tenantUsername}`)
  }

  // 3. Connect to database
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  // 4. Clean up existing tenant of the same slug if present
  const existingTenant = await payload.find({
    collection: "tenants",
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  if (existingTenant.docs.length > 0) {
    const tenant = existingTenant.docs[0]
    payload.logger.info(`Cleaning up existing data for Tenant: ${name} (ID: ${tenant.id})...`)

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

    // Find and delete the tenant admin user
    await payload.delete({
      collection: "users",
      where: {
        email: { equals: tenantUsername },
      },
    })

    // Remove the tenant mapping from all other users
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
    payload.logger.info(`Old tenant data cleaned.`)
  }

  // 5. Create the new Tenant document
  payload.logger.info(`Creating Tenant record...`)
  const newTenant = await payload.create({
    collection: "tenants",
    data: {
      name,
      slug,
      domain,
      template: templateTheme,
    },
  })

  // 6. Create the tenant admin user
  payload.logger.info(`Creating Tenant Admin User: ${tenantUsername}...`)
  const tenantAdmin = await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Admin`,
      email: tenantUsername,
      password: tenantPassword,
      role: "admin",
      status: "approved",
      tenants: [
        {
          tenant: newTenant.id,
        },
      ],
    },
  })

  // Link the superadmin to the new tenant
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
      .filter((id) => id !== newTenant.id)

    payload.logger.info(`Mapping Superadmin to new Tenant`)
    await payload.update({
      collection: "users",
      id: superAdmin.id,
      context: { isSeeding: true },
      data: {
        tenants: [...currentTenantIds.map((id) => ({ tenant: id })), { tenant: newTenant.id }],
      },
    })
  }

  // 7. Seed template assets
  payload.logger.info(`Fetching default template media assets...`)
  const [imageBuffer, heroBuffer] = await Promise.all([
    fetchFile(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post2.webp",
    ),
    fetchFile(
      "https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-hero1.webp",
    ),
  ])

  payload.logger.info(`Uploading media items...`)
  const [mediaImage, mediaHero] = await Promise.all([
    payload.create({
      collection: "media",
      data: {
        alt: `${name} Welcome Post Image`,
        tenant: newTenant.id,
      },
      file: imageBuffer,
    }),
    payload.create({
      collection: "media",
      data: {
        alt: `${name} Welcome Hero Image`,
        tenant: newTenant.id,
      },
      file: heroBuffer,
    }),
  ])

  // Find or use global contact form
  const formsResult = await payload.find({
    collection: "forms",
    limit: 1,
  })
  const contactForm = formsResult.docs[0]

  // Seed default pages
  payload.logger.info(`Seeding default pages from templates...`)
  const homePageData = getTemplateHome({
    tenantId: newTenant.id,
    tenantSlug: slug,
    tenantName: name,
    heroImageId: mediaHero.id,
    postImageId: mediaImage.id,
  })

  const homePage = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: homePageData,
  })

  const contactPageData = getTemplateContact({
    tenantId: newTenant.id,
    tenantSlug: slug,
    tenantName: name,
    contactFormId: contactForm?.id || null,
  })

  const contactPage = await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: contactPageData,
  })

  // Seed welcome post
  const welcomePostData = getTemplatePost({
    tenantId: newTenant.id,
    tenantSlug: slug,
    tenantName: name,
    heroImageId: mediaHero.id,
    postImageId: mediaImage.id,
    beaverdaleAdminUser: tenantAdmin,
  })

  await payload.create({
    collection: "posts",
    depth: 0,
    context: { disableRevalidate: true },
    data: welcomePostData,
  })

  // Seed navigation Header and Footer
  payload.logger.info(`Seeding Header and Footer structures...`)
  const headerData = getTemplateHeader({
    tenantId: newTenant.id,
    tenantSlug: slug,
    tenantName: name,
    contactPageId: contactPage.id,
  })

  const footerData = getTemplateFooter({
    tenantId: newTenant.id,
    tenantSlug: slug,
    tenantName: name,
  })

  await Promise.all([
    payload.create({
      collection: "header",
      context: { disableRevalidate: true },
      data: headerData,
    }),
    payload.create({
      collection: "footer",
      context: { disableRevalidate: true },
      data: footerData,
    }),
  ])

  console.log(`\n======================================================`)
  console.log(` tenant "${slug}" successfully generated!`)
  console.log(`======================================================`)
  console.log(`  Tenant Name: ${name}`)
  console.log(`  Admin User:  ${tenantUsername}`)
  console.log(`  Password:    ${tenantPassword}`)
  console.log(`  Domain:      http://${slug}.localhost:3000`)
  console.log(`  Admin URL:   http://${slug}.localhost:3000/admin`)
  console.log(`======================================================\n`)

  process.exit(0)
}

run().catch((err) => {
  console.error("Error during tenant generation:", err)
  process.exit(1)
})
