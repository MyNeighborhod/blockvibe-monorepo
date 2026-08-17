"use client"
import { cn } from "@/utilities/ui"
import useClickableCard from "@/utilities/useClickableCard"
import Link from "next/link"
import React, { Fragment } from "react"

import type { Post } from "@/payload-types"

import { Media } from "@/components/Media"

export type CardPostData = Pick<Post, "slug" | "categories" | "meta" | "title" | "heroImage">

export const Card: React.FC<{
  alignItems?: "center"
  className?: string
  doc?: CardPostData
  relationTo?: "posts"
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title, heroImage } = doc || {}
  const { description, image: metaImage } = meta || {}
  const imageToUse = metaImage || heroImage

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, " ") // replace non-breaking space with white space
  const href = `/${relationTo}/${slug}`

  return (
    <article
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer transition-shadow hover:shadow-md",
        className,
      )}
      /* eslint-disable-next-line react-hooks/refs */
      ref={card.ref}
    >
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted/30">
        {imageToUse && typeof imageToUse !== "string" && (
          <Media resource={imageToUse} size="33vw" className="w-full h-full object-cover" />
        )}
        {!imageToUse && (
          <div className="w-full h-full bg-gradient-to-br from-emerald-950/20 via-slate-900/10 to-slate-950/20 flex items-center justify-center p-6 border-b border-border/30">
            <img
              src="/media/northofgrand-badge-color-blue-1.png"
              alt="North of Grand"
              className="max-h-16 w-auto object-contain opacity-75 drop-shadow-sm"
              onError={(e) => {
                // Fallback to text badge if media path differs
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}
      </div>
      <div className="p-4">
        {showCategories && hasCategories && (
          <div className="uppercase text-sm mb-4">
            {categories?.map((category, index) => {
              if (typeof category === "object") {
                const { title: titleFromCategory } = category

                const categoryTitle = titleFromCategory || "Untitled category"

                const isLast = index === categories.length - 1

                return (
                  <Fragment key={index}>
                    {categoryTitle}
                    {!isLast && <Fragment>, &nbsp;</Fragment>}
                  </Fragment>
                )
              }

              return null
            })}
          </div>
        )}
        {titleToUse && (
          <div className="prose">
            <h3>
              {/* eslint-disable-next-line react-hooks/refs */}
              <Link className="not-prose" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {description && <div className="mt-2">{description && <p>{sanitizedDescription}</p>}</div>}
      </div>
    </article>
  )
}
