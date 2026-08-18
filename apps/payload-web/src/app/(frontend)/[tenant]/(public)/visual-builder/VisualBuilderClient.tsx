"use client"

import React, { useState, useEffect, Fragment } from "react"
import { Puck, type Config as PuckConfig } from "@puckeditor/core"
import "@puckeditor/core/dist/index.css"

import { ContentBlock } from "@/blocks/Content/Component"
import { SlideshowBlock } from "@/blocks/SlideshowBlock/Component"
import { MediaBlock } from "@/blocks/MediaBlock/Component"
import { ContactBlock } from "@/blocks/ContactBlock/Component"
import { IframeBlock } from "@/blocks/IframeBlock/Component"
import { CallToActionBlock } from "@/blocks/CallToAction/Component"
import { FileListBlock } from "@/blocks/FileListBlock/Component"
import { PdfBlock } from "@/blocks/PdfBlock/Component"

function ClientRenderBlocks({ blocks }: { blocks: any[] }) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null

  const clientComponents: Record<string, React.FC<any>> = {
    content: ContentBlock,
    slideshowBlock: SlideshowBlock,
    mediaBlock: MediaBlock,
    contactBlock: ContactBlock,
    iframeBlock: IframeBlock,
    cta: CallToActionBlock,
    fileListBlock: FileListBlock,
    pdfBlock: PdfBlock,
  }

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block
        const Component = clientComponents[blockType]
        if (Component) {
          return (
            <div key={index} className="mb-8">
              <Component {...block} disableInnerContainer />
            </div>
          )
        }

        // Fallback for custom or unknown block types
        return (
          <div key={index} className="p-6 my-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-serif font-bold text-lg text-[#42514c] capitalize">{blockType || "Content Block"}</h4>
            <p className="text-sm text-slate-500 mt-1">Section block from Payload CMS</p>
          </div>
        )
      })}
    </Fragment>
  )
}

const puckConfig: PuckConfig = {
  components: {
    PageLayoutBlock: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Page Layout",
      },
      render: ({ _rawBlocks, title }) => (
        <div className="theme-nog w-full bg-white text-[#42514c] font-sans">
          {_rawBlocks && Array.isArray(_rawBlocks) && _rawBlocks.length > 0 ? (
            <div className="container mx-auto px-4 py-6">
              <ClientRenderBlocks blocks={_rawBlocks} />
            </div>
          ) : (
            <div className="container mx-auto px-4 py-12 text-center text-gray-500">
              <h2 className="text-3xl font-serif font-bold text-[#42514c] mb-2">{title}</h2>
              <p>Drag blocks from the left sidebar to add sections to this page.</p>
            </div>
          )}
        </div>
      ),
    },

    ContentSection: {
      fields: {
        title: { type: "text" },
        text: { type: "textarea" },
      },
      defaultProps: {
        title: "About Our Neighborhood",
        text: "North of Grand is a vibrant community in Des Moines, Iowa.",
      },
      render: ({ title, text }) => (
        <div className="theme-nog py-6 px-4 max-w-4xl mx-auto my-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-serif text-[#42514c] font-bold mb-3">{title}</h3>
          <p className="text-base text-[#42514c] leading-relaxed">{text}</p>
        </div>
      ),
    },

    DirectoryBanner: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
      },
      defaultProps: {
        title: "Explore Local Shops & Services",
        description: "Support local. Discover restaurants, repair shops, and community organizations right in North of Grand.",
        buttonText: "Browse Business Directory →",
      },
      render: ({ title, description, buttonText }) => (
        <div className="theme-nog py-10 px-8 max-w-5xl mx-auto my-6 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white rounded-2xl shadow-lg">
          <h3 className="text-3xl font-serif font-bold mb-3">{title}</h3>
          <p className="text-emerald-100 text-base max-w-xl mb-6 leading-relaxed">{description}</p>
          <a href="/businesses" className="inline-block bg-white text-[#1b4332] font-semibold px-6 py-3 rounded-lg shadow hover:bg-emerald-50 transition-colors">
            {buttonText}
          </a>
        </div>
      ),
    },
  },
}

interface PageItem {
  id: string | number
  title: string
  slug: string
  tenant?: any
  visualBuilderData?: any
  layout?: any[]
  hero?: any
}

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
    if (page.visualBuilderData && page.visualBuilderData.content && page.visualBuilderData.content.length > 0) {
      setData(page.visualBuilderData)
      return
    }

    // Load the EXACT raw Payload layout blocks directly into Puck canvas!
    const generatedContent: any[] = [
      {
        type: "PageLayoutBlock",
        props: {
          id: `page-layout-${page.id}`,
          title: page.title,
          _rawBlocks: page.layout,
        },
      },
    ]

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
      <div className="max-w-7xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-900 px-2 py-0.5 rounded text-xs uppercase font-extrabold">Visual Builder</span>
            Tenant: <span className="text-emerald-400">{tenantSlug || "nog"}</span>
          </h1>
          <p className="text-xs text-slate-400">Rendering real website components & Lexical RichText blocks directly in canvas.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300">CMS Page:</label>
            <select
              value={selectedPageId}
              onChange={(e) => handlePageChange(e.target.value)}
              className="bg-slate-900 text-emerald-300 border border-slate-600 text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {loading && <option>Loading pages...</option>}
              {pages.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  📄 {p.title} ({p.slug})
                </option>
              ))}
            </select>
          </div>

          {saveStatus && <span className="text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-950/60 rounded border border-emerald-800/80">{saveStatus}</span>}

          <a href="/admin" className="text-xs text-slate-300 hover:text-white underline">
            Back to Admin
          </a>
        </div>
      </div>

      <div className="bg-white text-[#42514c] rounded-xl overflow-hidden shadow-2xl border border-slate-700 min-h-[750px]">
        <Puck config={puckConfig} data={data} onPublish={handleSave} key={selectedPageId || "default"} />
      </div>
    </div>
  )
}
