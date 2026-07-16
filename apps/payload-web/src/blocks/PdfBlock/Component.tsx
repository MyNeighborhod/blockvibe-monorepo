import React from "react"
import { FileText, Download, Eye } from "lucide-react"
import type { Media } from "@/payload-types"

export type PdfBlockType = {
  blockType?: "pdfBlock"
  pdfFile: Media | number | string
  height?: number | null
  title?: string | null
}

function formatBytes(bytes?: number | null, decimals = 1) {
  if (!bytes) return ""
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const PdfBlock: React.FC<PdfBlockType> = ({ pdfFile, height = 600, title }) => {
  if (!pdfFile || typeof pdfFile !== "object") return null

  const fileUrl = pdfFile.url || ""
  const filename = pdfFile.filename || "document.pdf"
  const sizeStr = formatBytes(pdfFile.filesize)
  const displayTitle = title || pdfFile.alt || filename

  return (
    <div className="w-full my-8 flex flex-col gap-4">
      {/* Sleek top card with download / info */}
      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-white dark:bg-card shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-foreground" title={displayTitle}>
              {displayTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {sizeStr && `${sizeStr} • `}PDF Document
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-accent text-foreground transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </a>
          <a
            href={fileUrl}
            download={filename}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary hover:bg-primary/95 text-primary-foreground transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Embedded PDF Viewer container */}
      <div 
        className="w-full overflow-hidden border border-border rounded-lg shadow-md bg-zinc-100 dark:bg-zinc-950 flex flex-col"
        style={{ height: `${height || 600}px` }}
      >
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title={displayTitle}
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  )
}
