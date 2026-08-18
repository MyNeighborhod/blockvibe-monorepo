"use client"

import React, { useState, useEffect } from "react"
import { Image as ImageIcon, Check, X, Search, FileImage } from "lucide-react"

interface MediaItem {
  id: string | number
  filename: string
  url: string
  alt?: string
  category?: string
  tenant?: any
  mimeType?: string
  filesize?: number
  sizes?: any
}

interface MediaPickerFieldProps {
  value: string
  onChange: (url: string) => void
  label?: string
  tenantSlug?: string
}

export function MediaPickerField({ value, onChange, label = "Image URL", tenantSlug = "nog" }: MediaPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/media?depth=2&limit=200")
      if (!res.ok) throw new Error("Failed to fetch media")
      const json = await res.json()
      const allDocs: MediaItem[] = json.docs || []

      // Filter media for tenant, while strictly excluding directory uploads (/directory/ subfolder or category === 'directory')
      const tenantFiltered = allDocs.filter((doc) => {
        // 1. Exclude directory uploads
        if (doc.category === "directory" || (doc.url && doc.url.includes("/directory/"))) {
          return false
        }

        // 2. Include tenant-matched or global/seed media
        if (!tenantSlug) return true
        if (doc.url && (doc.url.includes(`/media/${tenantSlug}/`) || doc.url.includes("/media/global/"))) return true

        if (doc.tenant) {
          const docTenantSlug = typeof doc.tenant === "object" ? doc.tenant.slug : doc.tenant
          if (docTenantSlug && docTenantSlug !== tenantSlug && docTenantSlug !== "global") {
            return false
          }
        }

        return true
      })

      setMediaList(tenantFiltered)
    } catch (err) {
      console.error("Error loading tenant media items:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen, tenantSlug])

  const filteredMedia = mediaList.filter((m) => {
    const term = search.toLowerCase()
    return (m.filename && m.filename.toLowerCase().includes(term)) || (m.alt && m.alt.toLowerCase().includes(term))
  })

  return (
    <div className="w-full my-2 font-sans select-none">
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>}

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/media/image.jpg"
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition-colors shrink-0"
        >
          <FileImage className="w-3.5 h-3.5" />
          Browse
        </button>
      </div>

      {value && (
        <div className="mt-2 relative w-full h-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
          <img src={value} alt="Preview" className="max-h-full max-w-full object-contain" />
        </div>
      )}

      {/* Media Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">
                  Media Library <span className="text-emerald-400 text-xs font-normal">({tenantSlug})</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${tenantSlug} tenant media...`}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">{filteredMedia.length} files available</span>
            </div>

            {/* Media Grid */}
            <div className="p-4 overflow-y-auto flex-1 min-h-[350px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                  Loading tenant media...
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No media files found. (Directory uploads in /media/{tenantSlug}/directory/ are isolated and hidden).
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((media) => {
                    const isSelected = value === media.url
                    return (
                      <button
                        type="button"
                        key={media.id}
                        onClick={() => {
                          onChange(media.url)
                          setIsOpen(false)
                        }}
                        className={`group relative rounded-xl border overflow-hidden p-2 text-left transition-all bg-white flex flex-col justify-between ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 shadow-md"
                            : "border-slate-200 hover:border-emerald-400 hover:shadow-md"
                        }`}
                      >
                        <div className="w-full h-28 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative mb-2">
                          <img
                            src={media.url}
                            alt={media.alt || media.filename}
                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 truncate w-full" title={media.filename}>
                          {media.filename}
                        </p>
                        {media.alt && <p className="text-[10px] text-slate-400 truncate w-full">{media.alt}</p>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
              <span>Directory uploaded assets isolated in /media/{tenantSlug}/directory/</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
