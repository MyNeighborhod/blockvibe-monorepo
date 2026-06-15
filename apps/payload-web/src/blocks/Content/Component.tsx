import { cn } from "@/utilities/ui"
import React from "react"
import RichText from "@/components/RichText"

import type { ContentBlock as ContentBlockProps } from "@/payload-types"

import { CMSLink } from "../../components/Link"
import { Media } from "../../components/Media"

export const ContentBlock: React.FC<ContentBlockProps> = (props) => {
  const { columns } = props

  const colsSpanClasses = {
    full: "12",
    half: "6",
    oneThird: "4",
    twoThirds: "8",
  }

  return (
    <div className="container my-16">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { type = "text", enableLink, link, richText, media, size } = col

            return (
              <div
                className={cn(`col-span-4 lg:col-span-${colsSpanClasses[size!]}`, {
                  "md:col-span-2": size !== "full",
                })}
                key={index}
              >
                {type === "text" && richText && <RichText data={richText} enableGutter={false} />}

                {type === "text" && enableLink && <CMSLink {...link} />}

                {type === "media" && media && (
                  <Media
                    imgClassName="border border-border rounded-[0.8rem] w-full"
                    resource={media}
                  />
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
