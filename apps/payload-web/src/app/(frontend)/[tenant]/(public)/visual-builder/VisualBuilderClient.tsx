"use client"

import React, { useState, useEffect } from "react"
import { Puck, type Config as PuckConfig } from "@puckeditor/core"
import "@puckeditor/core/dist/index.css"

import { RenderBlocks } from "@/blocks/RenderBlocks"
import { RenderHero } from "@/heros/RenderHero"

const puckConfig: PuckConfig = {
  components: {
    HeroSection: {
      fields: {
        type: {
          type: "select",
          options: [
            { label: "High Impact (Large Image)", value: "highImpact" },
            { label: "Medium Impact", value: "mediumImpact" },
            { label: "Low Impact (Title Only)", value: "lowImpact" },
          ],
        },
        heading: { type: "text" },
        subheading: { type: "textarea" },
      },
      defaultProps: {
        type: "mediumImpact",
        heading: "North of Grand Neighborhood",
        subheading: "Connecting neighbors, supporting local businesses, and hosting community events.",
      },
      render: (props) => (
        <div className="py-6">
          <RenderHero
            type={props.type || "mediumImpact"}
            richText={{
              root: {
                type: "root",
                children: [
                  {
                    type: "h1",
                    version: 1,
                    children: [{ type: "text", version: 1, text: props.heading || "North of Grand Neighborhood" }],
                  },
                  {
                    type: "p",
                    version: 1,
                    children: [{ type: "text", version: 1, text: props.subheading || "" }],
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 1,
              },
            }}
          />
        </div>
      ),
    },

    ContentBlock: {
      fields: {
        title: { type: "text" },
        richTextHTML: { type: "textarea" },
      },
      defaultProps: {
        title: "About Our Community",
        richTextHTML: "The North of Grand Neighborhood Association is dedicated to preserving our historic character and supporting local commerce.",
      },
      render: ({ title, richTextHTML }) => (
        <section className="py-8 px-6 max-w-4xl mx-auto my-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {title && <h2 className="text-3xl font-serif text-[#42514c] font-semibold mb-4">{title}</h2>}
          <div className="prose prose-emerald max-w-none text-[#42514c] leading-relaxed text-base">
            <p>{richTextHTML}</p>
          </div>
        </section>
      ),
    },

    SlideshowSection: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Neighborhood Photo Gallery",
      },
      render: ({ title }) => (
        <div className="py-8 px-6 max-w-5xl mx-auto my-6 bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden text-center">
          <h3 className="text-2xl font-serif font-semibold mb-2">{title || "Photo Gallery"}</h3>
          <p className="text-emerald-300 text-sm mb-6">Interactive Community Slideshow Carousel</p>
          <div className="aspect-video max-w-3xl mx-auto bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 font-medium">
            🖼️ [Slideshow Gallery Carousel Component]
          </div>
        </div>
      ),
    },

    ContactSection: {
      fields: {
        title: { type: "text" },
        email: { type: "text" },
        address: { type: "text" },
      },
      defaultProps: {
        title: "Get in Touch with NOG",
        email: "info@northofgrand.org",
        address: "Des Moines, Iowa",
      },
      render: ({ title, email, address }) => (
        <div className="py-10 px-8 max-w-4xl mx-auto my-6 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
          <h3 className="text-2xl font-serif text-[#42514c] font-semibold mb-3">{title}</h3>
          <p className="text-sm text-[#7b8c89] mb-4">Have questions or want to get involved? Reach out anytime!</p>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-emerald-900">
            <span className="bg-white px-4 py-2 rounded-lg border border-emerald-100 shadow-sm">📧 {email}</span>
            <span className="bg-white px-4 py-2 rounded-lg border border-emerald-100 shadow-sm">📍 {address}</span>
          </div>
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
        <div className="py-10 px-8 max-w-5xl mx-auto my-6 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white rounded-2xl shadow-lg">
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
        const res = await fetch("/api/pages?depth=2&limit=100")
        if (!res.ok) throw new Error("Failed to fetch pages")
        const json = await res.json()
        const allPages: PageItem[] = json.docs || []
        
        // Filter pages for active tenant if multi-tenant
        const filteredPages = allPages.filter((p) => {
          if (!p.tenant) return true
          const pageTenantSlug = typeof p.tenant === "object" ? p.tenant.slug : p.tenant
          return !tenantSlug || pageTenantSlug === tenantSlug
        })

        const displayPages = filteredPages.length > 0 ? filteredPages : allPages
        setPages(displayPages)

        // Find About page or first page
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

    // Convert page layout blocks into Puck canvas format
    const generatedContent: any[] = []

    if (page.hero && page.hero.type && page.hero.type !== "none") {
      generatedContent.push({
        type: "HeroSection",
        props: {
          id: "hero-1",
          type: page.hero.type,
          heading: page.title,
          subheading: "Welcome to " + page.title,
        },
      })
    }

    if (page.layout && Array.isArray(page.layout)) {
      page.layout.forEach((block, idx) => {
        if (block.blockType === "content") {
          generatedContent.push({
            type: "ContentBlock",
            props: {
              id: `content-${idx}`,
              title: block.title || page.title,
              richTextHTML: "Detailed community page content section",
            },
          })
        } else if (block.blockType === "slideshowBlock") {
          generatedContent.push({
            type: "SlideshowSection",
            props: {
              id: `slideshow-${idx}`,
              title: block.title || "Photo Gallery",
            },
          })
        } else if (block.blockType === "contactBlock") {
          generatedContent.push({
            type: "ContactSection",
            props: {
              id: `contact-${idx}`,
              title: "Contact Us",
              email: "info@northofgrand.org",
            },
          })
        }
      })
    }

    if (generatedContent.length === 0) {
      generatedContent.push({
        type: "HeroSection",
        props: {
          id: "hero-default",
          type: "mediumImpact",
          heading: page.title,
          subheading: `Visual Layout Editor for ${page.title} (${page.slug})`,
        },
      })
      generatedContent.push({
        type: "ContentBlock",
        props: {
          id: "content-default",
          title: page.title,
          richTextHTML: `Editing content for ${page.title} on ${tenantSlug || "nog"} tenant site.`,
        },
      })
      generatedContent.push({
        type: "DirectoryBanner",
        props: {
          id: "directory-default",
          title: "Explore North of Grand Businesses",
          description: "Discover local restaurants, services, and shops in the neighborhood.",
        },
      })
    }

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
          <p className="text-xs text-slate-400">Select any CMS Page below to visually build and drag-and-drop sections in real-time.</p>
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
