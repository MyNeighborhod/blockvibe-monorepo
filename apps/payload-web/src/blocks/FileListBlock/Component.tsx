import React from "react"
import { FileText, Download } from "lucide-react"
import type { Media } from "@/payload-types"

export type FileListBlockType = {
  blockType?: "fileListBlock"
  title?: string | null
  files: {
    file: Media | number | string
    description?: string | null
  }[]
}

function formatBytes(bytes?: number | null, decimals = 1) {
  if (!bytes) return ""
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const FileListBlock: React.FC<FileListBlockType> = ({ title, files }) => {
  if (!files || files.length === 0) return null

  return (
    <div className="w-full my-8 flex flex-col gap-6">
      {title && <h3 className="text-xl font-serif font-semibold text-gray-800">{title}</h3>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((item, index) => {
          const media = item.file
          if (typeof media !== "object" || !media) return null
          const name = media.filename || "document"
          const sizeStr = formatBytes(media.filesize)
          const url = media.url || ""
          const description = item.description || media.alt || ""

          return (
            <div
              key={media.id || index}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-gray-800" title={name}>
                    {name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sizeStr && `${sizeStr} `}
                    {description && `• ${description}`}
                  </p>
                </div>
              </div>
              <a
                href={url}
                className="p-2 bg-teal-50 hover:bg-teal-100 rounded text-teal-800 transition-colors"
                title="Download Document"
                download
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
