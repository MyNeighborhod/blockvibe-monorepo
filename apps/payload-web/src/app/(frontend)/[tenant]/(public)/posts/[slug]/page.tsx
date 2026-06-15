import type { Metadata } from "next"

import { RelatedPosts } from "@/blocks/RelatedPosts/Component"
import { PayloadRedirects } from "@/components/PayloadRedirects"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import { draftMode } from "next/headers"
import React, { cache } from "react"
import RichText from "@/components/RichText"

import type { Post } from "@/payload-types"

import { PostHero } from "@/heros/PostHero"
import { generateMeta } from "@/utilities/generateMeta"
import PageClient from "./page.client"
import { LivePreviewListener } from "@/components/LivePreviewListener"

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const posts = await payload.find({
      collection: "posts",
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

    const params = posts.docs.map((doc) => {
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
      "generateStaticParams failed in [tenant]/posts/[slug]/page.tsx, returning empty list:",
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

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = "", tenant } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = "/posts/" + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug, tenant })

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === "object")}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = "", tenant } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug, tenant })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug, tenant }: { slug: string; tenant: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  // Resolve tenant ID
  const tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenant } }, { domain: { equals: tenant } }],
    },
    limit: 1,
  })

  const tenantId = tenantDoc.docs[0]?.id

  const result = await payload.find({
    collection: "posts",
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [{ slug: { equals: slug } }, ...(tenantId ? [{ tenant: { equals: tenantId } }] : [])],
    },
  })

  return result.docs?.[0] || null
})
