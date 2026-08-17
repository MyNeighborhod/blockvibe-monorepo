import React from "react"
import { FileText, Download, ExternalLink, Eye } from "lucide-react"
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

export const PdfBlock: React.FC<PdfBlockType> = ({ pdfFile, height = 650, title }) => {
  if (!pdfFile || typeof pdfFile !== "object") return null

  let fileUrl = pdfFile.url || ""
  if (fileUrl && fileUrl.startsWith("http://")) {
    fileUrl = fileUrl.replace("http://", "https://")
  }

  const filename = pdfFile.filename || "document.pdf"
  const sizeStr = formatBytes(pdfFile.filesize)
  const displayTitle = title || pdfFile.alt || filename

  return (
    <div className="container my-8 flex flex-col gap-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold truncate text-slate-900 dark:text-white" title={displayTitle}>
              {displayTitle}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {sizeStr && `${sizeStr} • `}PDF Document
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </a>
          <a
            href={fileUrl}
            download={filename}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Embedded PDF Viewer Container */}
      <div
        className="w-full overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl shadow-md bg-slate-50 dark:bg-slate-900 flex flex-col relative"
        style={{ height: `${height || 650}px` }}
      >
        <object
          data={`${fileUrl}#view=FitH&toolbar=1`}
          type="application/pdf"
          className="w-full h-full"
        >
          <iframe
            src={`${fileUrl}#toolbar=1`}
            title={displayTitle}
            className="w-full h-full border-0"
            scrolling="yes"
            loading="lazy"
          >
            <div className="p-8 text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Your browser cannot display inline PDFs.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Click here to view PDF ({filename})</span>
              </a>
            </div>
          </iframe>
        </object>
      </div>
    </div>
  )
}
