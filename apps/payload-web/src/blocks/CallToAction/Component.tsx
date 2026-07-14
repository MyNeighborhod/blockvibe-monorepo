import React from "react"

import type { CallToActionBlock as CTABlockProps } from "@/payload-types"

import RichText from "@/components/RichText"
import { CMSLink } from "@/components/Link"

export const CallToActionBlock: React.FC<CTABlockProps & { path?: string }> = ({
  links,
  richText,
  path,
}) => {
  return (
    <div className="container" data-live-preview-path={path}>
      <div className="bg-card rounded border border-border p-4 flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div
          className="max-w-[48rem] flex items-center"
          data-live-preview-path={path ? `${path}.richText` : undefined}
        >
          {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
        </div>
        <div className="flex flex-col gap-8">
          {(links || []).map(({ link }, i) => {
            return (
              <div key={i} data-live-preview-path={path ? `${path}.links.${i}.link` : undefined}>
                <CMSLink size="lg" {...link} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
