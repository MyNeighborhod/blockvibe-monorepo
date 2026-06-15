import type { Metadata } from "next/types"

import { CollectionArchive } from "@/components/CollectionArchive"
import { PageRange } from "@/components/PageRange"
import { Pagination } from "@/components/Pagination"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import React from "react"
import PageClient from "./page.client"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const tenants = await payload.find({
      collection: "tenants",
      limit: 1000,
      select: {
        slug: true,
      },
    })

    return tenants.docs.map((doc) => ({
      tenant: doc.slug,
    }))
  } catch (error) {
    console.warn(
      "generateStaticParams failed in [tenant]/posts/page.tsx, returning empty list:",
      error,
    )
    return []
  }
}

export default async function Page({ params: paramsPromise }: Args) {
  const { tenant } = await paramsPromise
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

  const posts = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 12,
    overrideAccess: false,
    where: tenantId ? { tenant: { equals: tenantId } } : undefined,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Posts`,
  }
}
