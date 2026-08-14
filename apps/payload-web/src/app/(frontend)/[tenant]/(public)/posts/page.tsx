import type { Metadata } from "next/types"
import Link from "next/link"
import { ArrowRight, BookOpen, Calendar, Newspaper, Sparkles } from "lucide-react"
import configPromise from "@payload-config"
import { getPayload } from "payload"
import React from "react"
import RichText from "@/components/RichText"
import PageClient from "./page.client"
import { formatDateTime } from "@/utilities/formatDateTime"

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
    console.warn("generateStaticParams failed in [tenant]/posts/page.tsx:", error)
    return []
  }
}

export default async function Page({ params: paramsPromise }: Args) {
  const { tenant } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  // Resolve tenant
  const tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenant } }, { domain: { equals: tenant } }],
    },
    limit: 1,
  })

  const tenantId = tenantDoc.docs[0]?.id
  const tenantName = tenantDoc.docs[0]?.name || "North of Grand"

  // Fetch recent posts (limit 6: 1 latest for main area + up to 5 for sidebar)
  const postsResult = await payload.find({
    collection: "posts",
    depth: 2,
    limit: 6,
    sort: "-publishedAt",
    overrideAccess: false,
    where: tenantId ? { tenant: { equals: tenantId } } : undefined,
  })

  const posts = postsResult.docs
  const latestPost = posts.length > 0 ? posts[0] : null
  const recentSidebarPosts = posts.slice(0, 5)

  return (
    <div className="pt-10 pb-24 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <PageClient />

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
            <span>View All Posts ({postsResult.totalDocs})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 2-Column Responsive Layout: Main Latest Article on Left (Stacked 1st on mobile), Sidebar on Right (Stacked AT END on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Column: Latest Featured Post (8 Cols on Desktop) */}
          <main className="lg:col-span-8 space-y-8">
            {latestPost ? (
              <article className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                    <BookOpen className="w-3.5 h-3.5" />
                    Latest Feature
                  </span>

                  {latestPost.publishedAt && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(latestPost.publishedAt)}
                    </span>
                  )}
                </div>

                {/* Article Title */}
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-8 leading-tight">
                  {latestPost.title}
                </h2>

                {/* Full Article Content */}
                <div className="prose dark:prose-invert max-w-none">
                  {latestPost.content && <RichText data={latestPost.content} enableGutter={false} />}
                </div>
              </article>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <Newspaper className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No articles published yet</h3>
                <p className="text-sm text-slate-500 mt-1">Check back soon for the latest neighborhood news!</p>
              </div>
            )}
          </main>

          {/* Sidebar Column: Recent Posts Panel (4 Cols on Desktop, Appears at END on Mobile) */}
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
                  {recentSidebarPosts.map((post, idx) => {
                    const isLatest = idx === 0
                    return (
                      <Link
                        key={post.id || idx}
                        href={`/posts/${post.slug}`}
                        className={`group block p-4 rounded-2xl transition-all duration-200 border ${
                          isLatest
                            ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          {isLatest ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                              Current Feature
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              {post.publishedAt ? formatDateTime(post.publishedAt) : ""}
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>

                        <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Read article</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
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
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Latest News & Blog | North of Grand`,
  }
}
