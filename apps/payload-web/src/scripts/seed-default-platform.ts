/**
 * Seed the default (platform) tenant homepage, header, footer, and space request form.
 * Safe to run against production — only touches the default tenant and the shared form.
 *
 * Usage:
 *   pnpm tsx src/scripts/seed-default-platform.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import {
  getNogShowcaseUrl,
  lexicalRichText,
  richHeading,
  richParagraph,
} from "./seed-helpers"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  const nogShowcaseUrl = getNogShowcaseUrl()
  payload.logger.info(`Seeding default platform tenant (showcase URL: ${nogShowcaseUrl})...`)

  const defaultTenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "default" } },
    limit: 1,
  })

  let defaultTenantDoc = defaultTenants.docs[0]
  if (!defaultTenantDoc) {
    payload.logger.info("Creating default platform tenant...")
    defaultTenantDoc = await payload.create({
      collection: "tenants",
      data: {
        name: "BlockVibe Platform",
        slug: "default",
        template: "light",
      },
    })
  }

  payload.logger.info("Cleaning up existing default tenant pages, header, and footer...")
  for (const collection of ["header", "footer", "pages"] as const) {
    try {
      await payload.delete({
        collection,
        where: { tenant: { equals: defaultTenantDoc.id } },
        context: { disableRevalidate: true },
      })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      payload.logger.error(`Failed to delete default tenant ${collection}: ${message}`)
    }
  }

  payload.logger.info("Recreating Space Request Form...")
  try {
    await payload.delete({
      collection: "forms",
      where: { title: { equals: "Space Request Form" } },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    payload.logger.error(`Failed to delete space request form: ${message}`)
  }

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

  payload.logger.info("Creating default platform homepage...")
  await payload.create({
    collection: "pages",
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      _status: "published",
      title: "BlockVibe Platform - Home",
      slug: "home",
      tenant: defaultTenantDoc.id,
      hero: { type: "none" },
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
                url: nogShowcaseUrl,
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

  payload.logger.info("Creating default platform header and footer...")
  await Promise.all([
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
              url: nogShowcaseUrl,
            },
          },
        ],
      },
    }),
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

  payload.logger.info("Default platform tenant seeded successfully.")
  process.exit(0)
}

run().catch((err) => {
  console.error("Error seeding default platform:", err)
  if (err && typeof err === "object" && "data" in err) {
    console.error("Validation details:", JSON.stringify((err as { data: unknown }).data, null, 2))
  }
  process.exit(1)
})
