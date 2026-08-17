import React from "react"

export type IframeBlockType = {
  blockType?: "iframeBlock"
  iframeUrl: string
  height: number
  title?: string | null
}

export const IframeBlock: React.FC<IframeBlockType> = ({ iframeUrl, height, title }) => {
  if (!iframeUrl) return null

  return (
    <div className="container mt-8 mb-16">
      <div className="w-full overflow-hidden border border-border rounded-lg shadow-md bg-white">
        <iframe
          src={iframeUrl}
          title={title || "Embedded Content"}
          className="w-full border-0"
          style={{ height: `${height}px` }}
          scrolling="no"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
