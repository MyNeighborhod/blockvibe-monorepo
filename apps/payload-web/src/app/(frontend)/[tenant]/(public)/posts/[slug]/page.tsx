import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, Calendar, Newspaper, Sparkles, Tag, User } from "lucide-react"

import { RelatedPosts } from "@/blocks/RelatedPosts/Component"
import { PayloadRedirects } from "@/components/PayloadRedirects"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import { draftMode } from "next/headers"
import React, { cache } from "react"
import RichText from "@/components/RichText"
import { formatDateTime } from "@/utilities/formatDateTime"
import { formatAuthors } from "@/utilities/formatAuthors"

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
      "generateStaticParams failed in [tenant]/posts/[slug]/page.tsx:",
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
  const decodedSlug = decodeURIComponent(slug)
  const url = "/posts/" + decodedSlug

  const payload = await getPayload({ config: configPromise })

  const post = await queryPostBySlug({ slug: decodedSlug, tenant })

  if (!post) return <PayloadRedirects url={url} />

  // Resolve tenant for sidebar query
  const tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenant } }, { domain: { equals: tenant } }],
    },
    limit: 1,
  })

  const tenantId = tenantDoc.docs[0]?.id
  const tenantName = tenantDoc.docs[0]?.name || "North of Grand"

  // Fetch recent posts for sidebar
  const recentPostsResult = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 5,
    sort: "-publishedAt",
    overrideAccess: false,
    where: tenantId ? { tenant: { equals: tenantId } } : undefined,
  })

  const recentSidebarPosts = recentPostsResult.docs
  const hasAuthors = post.populatedAuthors && post.populatedAuthors.length > 0 && formatAuthors(post.populatedAuthors) !== ""

  return (
    <article className="pt-10 pb-24 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <PageClient />
      <PayloadRedirects disableNotFound url={url} />
      {draft && <LivePreviewListener />}

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header Banner */}
        <div className="mb-10 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tenantName} Blog & News</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Latest Neighborhood Updates
            </h1>
          </div>

          <Link
            href="/posts/archive"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors group self-start sm:self-auto"
          >
            <span>View All Posts ({recentPostsResult.totalDocs})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 2-Column Layout matching /posts main template */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Column: Full Post Card */}
          <main className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
              {/* Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                {post.categories && post.categories.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {post.categories.map((category, index) => {
                      if (typeof category === "object" && category !== null) {
                        return (
                          <span
                            key={category.id || index}
                            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60"
                          >
                            <Tag className="w-3 h-3" />
                            {category.title || "Category"}
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                    <BookOpen className="w-3.5 h-3.5" />
                    Article
                  </span>
                )}

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {hasAuthors && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {formatAuthors(post.populatedAuthors)}
                    </span>
                  )}
                  {post.publishedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(post.publishedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-8 leading-tight">
                {post.title}
              </h2>

              {/* Body */}
              <div className="prose dark:prose-invert max-w-none">
                {post.content && <RichText data={post.content} enableGutter={false} />}
              </div>

              {/* Related Posts */}
              {post.relatedPosts && post.relatedPosts.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <RelatedPosts
                    docs={post.relatedPosts.filter((post) => typeof post === "object")}
                  />
                </div>
              )}
            </div>
          </main>

          {/* Sidebar Column: Recent Posts Panel */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Recent Posts</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {recentSidebarPosts.length}
                </span>
              </div>

              {recentSidebarPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentSidebarPosts.map((item, idx) => {
                    const isCurrent = item.slug === post.slug
                    return (
                      <Link
                        key={item.id || idx}
                        href={`/posts/${item.slug}`}
                        className={`group block p-4 rounded-2xl transition-all duration-200 border ${
                          isCurrent
                            ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 pointer-events-none"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          {isCurrent ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                              Current Post
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              {item.publishedAt ? formatDateTime(item.publishedAt) : ""}
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>

                        {!isCurrent && (
                          <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Read article</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-4 text-center">No recent posts found.</p>
              )}

              {/* Show All Posts Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/posts/archive"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white font-medium text-sm transition-all shadow-sm"
                >
                  <span>Show All Posts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = "", tenant } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug, tenant })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug, tenant }: { slug: string; tenant: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

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
    where: {
      and: [
        { slug: { equals: slug } },
        ...(tenantId ? [{ tenant: { equals: tenantId } }] : []),
      ],
    },
  })

  return result.docs[0] || null
})
