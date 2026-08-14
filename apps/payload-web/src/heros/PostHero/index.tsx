import { formatDateTime } from "src/utilities/formatDateTime"
import React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Tag } from "lucide-react"

import type { Post } from "@/payload-types"
import { Media } from "@/components/Media"
import { formatAuthors } from "@/utilities/formatAuthors"

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ""

  return (
    <div className="container max-w-[48rem] mx-auto pt-6 pb-2">
      {/* Back to Blog Link */}
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Blog</span>
      </Link>

      {/* Category Badges */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {categories.map((category, index) => {
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
      )}

      {/* Post Title */}
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4 leading-tight">
        {title}
      </h1>

      {/* Author & Published Date Metadata */}
      <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
        {hasAuthors && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatAuthors(populatedAuthors)}</span>
          </div>
        )}

        {publishedAt && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
          </div>
        )}
      </div>

      {/* Featured Image (if set) */}
      {heroImage && typeof heroImage !== "string" && (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800">
          <Media priority resource={heroImage} />
        </div>
      )}
    </div>
  )
}
