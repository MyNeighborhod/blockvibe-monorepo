import type { Metadata } from "next"

import { PayloadRedirects } from "@/components/PayloadRedirects"
import configPromise from "@payload-config"
import { getPayload, type RequiredDataFromCollectionSlug } from "payload"
import { draftMode } from "next/headers"
import React, { cache } from "react"
import { homeStatic } from "@/endpoints/seed/home-static"

import { RenderBlocks } from "@/blocks/RenderBlocks"
import { RenderHero } from "@/heros/RenderHero"
import { generateMeta } from "@/utilities/generateMeta"
import PageClient from "./page.client"
import { LivePreviewListener } from "@/components/LivePreviewListener"
import { isDefaultNogTenant } from "@/utilities/resolveTenantSlug"

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const pages = await payload.find({
      collection: "pages",
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      depth: 1,
      select: {
        slug: true,
        tenant: true,
      },
    })

    const params = pages.docs
      ?.filter((doc) => {
        return doc.slug !== "home"
      })
      .map((doc) => {
        const tenantSlug =
          typeof doc.tenant === "object" && doc.tenant !== null ? doc.tenant.slug : "default"
        return {
          tenant: tenantSlug,
          slug: doc.slug,
        }
      })

    return params
  } catch (error) {
    console.warn(
      "generateStaticParams failed in [tenant]/[slug]/page.tsx, returning empty list:",
      error,
    )
    return []
  }
}

type Args = {
  params: Promise<{
    tenant: string
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = "home", tenant } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = "/" + decodedSlug
  let page: RequiredDataFromCollectionSlug<"pages"> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
    tenant,
  })

  // Remove this code once your website is seeded
  if (!page && slug === "home") {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = "home", tenant } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
    tenant,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug, tenant }: { slug: string; tenant: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  // 1. Resolve tenant ID
  let tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenant } }, { domain: { equals: tenant } }],
    },
    limit: 1,
  })

  if (tenantDoc.docs.length === 0 && isDefaultNogTenant(tenant)) {
    tenantDoc = await payload.find({
      collection: "tenants",
      where: { slug: { equals: "nog" } },
      limit: 1,
    })
  }

  const tenantId = tenantDoc.docs[0]?.id

  if (!tenantId) {
    return null
  }

  // 2. Query page matching slug and tenant ID
  const result = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      and: [{ slug: { equals: slug } }, { tenant: { equals: tenantId } }],
    },
  })

  return result.docs?.[0] || null
})
