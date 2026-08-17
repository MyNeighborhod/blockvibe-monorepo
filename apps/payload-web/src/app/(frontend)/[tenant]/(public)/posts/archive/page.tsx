import type { Metadata } from "next/types"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CollectionArchive } from "@/components/CollectionArchive"
import { PageRange } from "@/components/PageRange"
import { Pagination } from "@/components/Pagination"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import React from "react"

type Args = {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    page?: string
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
    console.warn("generateStaticParams failed in [tenant]/posts/archive/page.tsx:", error)
    return []
  }
}

export default async function ArchivePage({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
  const { tenant } = await paramsPromise
  const searchParams = await searchParamsPromise
  const currentPage = searchParams?.page ? parseInt(searchParams.page, 10) : 1

  const payload = await getPayload({ config: configPromise })

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
    page: currentPage,
    sort: "-publishedAt",
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
    <div className="pt-12 pb-24 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Latest Feature</span>
        </Link>

        <div className="prose dark:prose-invert max-w-none mb-6">
          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            All Posts Archive
          </h1>
        </div>

        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CollectionArchive posts={posts.docs} />

        <div className="mt-12">
          {posts.totalPages > 1 && posts.page && (
            <Pagination page={posts.page} totalPages={posts.totalPages} />
          )}
        </div>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `All Posts Archive | Blog`,
  }
}
