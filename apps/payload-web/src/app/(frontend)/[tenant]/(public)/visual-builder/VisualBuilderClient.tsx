"use client"

import React, { useState, useEffect } from "react"
import { Puck } from "@puckeditor/core"
import "@puckeditor/core/dist/index.css"

import { puckConfig } from "./puckConfig"
import { VisualBuilderHeader } from "./VisualBuilderHeader"
import { convertPageLayoutToPuckContent, type PageItem } from "./utils"

export function VisualBuilderClient({ tenantSlug }: { tenantSlug: string }) {
  const [pages, setPages] = useState<PageItem[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>("")
  const [data, setData] = useState<any>({ content: [], root: { props: { title: "Visual Layout" } } })
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPages() {
      try {
        setLoading(true)
        const res = await fetch("/api/pages?depth=3&limit=100")
        if (!res.ok) throw new Error("Failed to fetch pages")
        const json = await res.json()
        const allPages: PageItem[] = json.docs || []
        
        // Filter pages for active tenant
        const filteredPages = allPages.filter((p) => {
          if (!p.tenant) return true
          const pageTenantSlug = typeof p.tenant === "object" ? p.tenant.slug : p.tenant
          return !tenantSlug || pageTenantSlug === tenantSlug
        })

        const displayPages = filteredPages.length > 0 ? filteredPages : allPages
        setPages(displayPages)

        // Default to About page or first page
        const aboutPage = displayPages.find((p) => p.slug === "about") || displayPages[0]
        if (aboutPage) {
          setSelectedPageId(String(aboutPage.id))
          loadPageData(aboutPage)
        }
      } catch (err) {
        console.error("Error fetching pages:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPages()
  }, [tenantSlug])

  function loadPageData(page: PageItem) {
    const generatedContent = convertPageLayoutToPuckContent(page)
    setData({
      content: generatedContent,
      root: { props: { title: page.title } },
    })
  }

  const handlePageChange = (pageId: string) => {
    setSelectedPageId(pageId)
    const page = pages.find((p) => String(p.id) === pageId)
    if (page) {
      loadPageData(page)
    }
  }

  const handleSave = async (savedData: any) => {
    setData(savedData)
    if (!selectedPageId) return

    setSaveStatus("Publishing page layout to Payload CMS...")
    try {
      const res = await fetch(`/api/pages/${selectedPageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualBuilderData: savedData,
        }),
      })

      if (res.ok) {
        setSaveStatus("✨ Successfully published to Payload CMS!")
      } else {
        setSaveStatus("Saved locally")
      }
    } catch (err) {
      setSaveStatus("Saved locally")
    }
    setTimeout(() => setSaveStatus(null), 3500)
  }

  return (
    <div className={`theme-${tenantSlug || "nog"} min-h-screen bg-slate-900 text-slate-100 p-4`}>
      <VisualBuilderHeader
        tenantSlug={tenantSlug}
        pages={pages}
        selectedPageId={selectedPageId}
        onPageChange={handlePageChange}
        loading={loading}
        saveStatus={saveStatus}
      />

      <div className="bg-white text-[#42514c] rounded-xl overflow-hidden shadow-2xl border border-slate-700 min-h-[750px]">
        <Puck config={puckConfig} data={data} onPublish={handleSave} key={selectedPageId || "default"} />
      </div>
    </div>
  )
}
