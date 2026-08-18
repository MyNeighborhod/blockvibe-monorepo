"use client"

import React from "react"
import type { PageItem } from "./utils"

interface HeaderProps {
  tenantSlug: string
  pages: PageItem[]
  selectedPageId: string
  onPageChange: (pageId: string) => void
  loading: boolean
  saveStatus: string | null
}

export function VisualBuilderHeader({
  tenantSlug,
  pages,
  selectedPageId,
  onPageChange,
  loading,
  saveStatus,
}: HeaderProps) {
  return (
    <div className="max-w-7xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 select-none">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="bg-emerald-500 text-slate-900 px-2 py-0.5 rounded text-xs uppercase font-extrabold">Visual Builder</span>
          Tenant: <span className="text-emerald-400">{tenantSlug || "nog"}</span>
        </h1>
        <p className="text-xs text-slate-400">Two-way synchronized with Payload CMS block layouts & column grids.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300">CMS Page:</label>
          <select
            value={selectedPageId}
            onChange={(e) => onPageChange(e.target.value)}
            className="bg-slate-900 text-emerald-300 border border-slate-600 text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {loading && <option>Loading pages...</option>}
            {pages.map((p) => (
              <option key={p.id} value={String(p.id)}>
                📄 {p.title} ({p.slug})
              </option>
            ))}
          </select>
        </div>

        {saveStatus && (
          <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 bg-emerald-950/80 rounded border border-emerald-800/80 animate-pulse">
            {saveStatus}
          </span>
        )}

        <a href="/admin" className="text-xs text-slate-300 hover:text-white underline font-medium">
          Back to Admin
        </a>
      </div>
    </div>
  )
}
