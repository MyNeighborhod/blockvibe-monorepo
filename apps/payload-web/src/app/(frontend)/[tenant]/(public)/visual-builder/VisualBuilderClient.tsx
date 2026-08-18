"use client"

import React, { useState, useEffect } from "react"
import { Puck, type Config as PuckConfig } from "@puckeditor/core"
import "@puckeditor/core/dist/index.css"

import { SlideshowBlock } from "@/blocks/SlideshowBlock/Component"
import { ContactBlock } from "@/blocks/ContactBlock/Component"
import { IframeBlock } from "@/blocks/IframeBlock/Component"
import { CallToActionBlock } from "@/blocks/CallToAction/Component"

const puckConfig: PuckConfig = {
  components: {
    HeroSection: {
      fields: {
        title: { type: "text" },
        subheading: { type: "textarea" },
        align: {
          type: "select",
          options: [
            { label: "Left Aligned", value: "left" },
            { label: "Centered", value: "center" },
          ],
        },
      },
      defaultProps: {
        title: "North of Grand Neighborhood",
        subheading: "Connecting neighbors, supporting local businesses, and hosting community events.",
        align: "center",
      },
      render: ({ title, subheading, align }) => (
        <section className={`theme-nog py-10 px-8 my-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-${align || "center"}`}>
          <h1 className="text-3xl md:text-4xl font-serif text-[#42514c] font-bold mb-3">{title}</h1>
          <p className="text-base text-[#7b8c89] max-w-2xl mx-auto leading-relaxed">{subheading}</p>
        </section>
      ),
    },

    ContentSection: {
      fields: {
        title: { type: "text" },
        text: { type: "textarea" },
      },
      defaultProps: {
        title: "About Our Neighborhood",
        text: "The North of Grand neighborhood offers a harmonious blend of urban convenience and historic charm.",
      },
      render: ({ title, text }) => (
        <div className="theme-nog py-6 px-6 max-w-4xl mx-auto my-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {title && <h3 className="text-2xl font-serif text-[#42514c] font-bold mb-3">{title}</h3>}
          <div className="text-base text-[#42514c] leading-relaxed whitespace-pre-line">{text}</div>
        </div>
      ),
    },

    MediaSection: {
      fields: {
        title: { type: "text" },
        imageUrl: { type: "text" },
        caption: { type: "text" },
      },
      defaultProps: {
        title: "Meet Our 2026 Board Members",
        imageUrl: "/media/nog/nog-board_orig-1.jpg",
        caption: "North of Grand Board Members",
      },
      render: ({ title, imageUrl, caption }) => (
        <div className="theme-nog py-6 px-4 max-w-4xl mx-auto my-4 text-center">
          {title && <h3 className="text-2xl font-serif text-[#42514c] font-bold mb-4">{title}</h3>}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={caption || title || "Image"}
              className="w-full rounded-2xl border border-gray-200 shadow-md max-h-[600px] object-cover mx-auto"
            />
          )}
          {caption && <p className="text-xs text-slate-500 mt-2 font-serif italic">{caption}</p>}
        </div>
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
        <div className="theme-nog my-6 max-w-5xl mx-auto">
          <SlideshowBlock title={title} />
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
        <div className="theme-nog my-6 max-w-4xl mx-auto">
          <ContactBlock title={title} email={email} address={address} />
        </div>
      ),
    },

    IframeSection: {
      fields: {
        iframeUrl: { type: "text" },
        height: { type: "number" },
        title: { type: "text" },
      },
      defaultProps: {
        iframeUrl: "https://calendar.google.com/calendar/embed?src=northofgrandpresident%40gmail.com&ctz=America%2FChicago",
        height: 600,
        title: "Yearly Calendar",
      },
      render: ({ iframeUrl, height, title }) => (
        <div className="theme-nog my-6 max-w-5xl mx-auto">
          <IframeBlock iframeUrl={iframeUrl} height={height || 600} title={title} />
        </div>
      ),
    },

    CtaSection: {
      fields: {
        heading: { type: "text" },
        subheading: { type: "text" },
        buttonText: { type: "text" },
        buttonUrl: { type: "text" },
      },
      defaultProps: {
        heading: "Prefer Social Updates?",
        subheading: "Check out our Facebook page for detailed descriptions of meetings and local events.",
        buttonText: "View Facebook Page",
        buttonUrl: "https://facebook.com",
      },
      render: ({ heading, subheading, buttonText, buttonUrl }) => (
        <div className="theme-nog py-8 px-8 max-w-4xl mx-auto my-6 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-serif font-bold mb-2">{heading}</h3>
            <p className="text-emerald-100 text-sm">{subheading}</p>
          </div>
          {buttonText && (
            <a
              href={buttonUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-emerald-950 px-6 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              {buttonText}
            </a>
          )}
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

function extractTextFromRichText(richTextObj: any): string {
  if (!richTextObj) return ""
  if (typeof richTextObj === "string") return richTextObj

  const paragraphs: string[] = []
  function traverse(node: any) {
    if (!node) return
    if (node.text) {
      paragraphs.push(node.text)
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  if (richTextObj.root) {
    traverse(richTextObj.root)
  }
  return paragraphs.join("\n\n")
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

    // Convert EACH item in page.layout into a SEPARATE, EDITABLE Puck block item!
    const generatedContent: any[] = []

    if (page.hero && page.hero.type && page.hero.type !== "none") {
      generatedContent.push({
        type: "HeroSection",
        props: {
          id: `hero-${page.id}`,
          title: page.title,
          subheading: `Welcome to ${page.title}`,
          align: "center",
        },
      })
    }

    if (page.layout && Array.isArray(page.layout)) {
      page.layout.forEach((block, idx) => {
        const blockId = `block-${page.id}-${idx}`

        if (block.blockType === "content") {
          if (block.columns && Array.isArray(block.columns)) {
            block.columns.forEach((col: any, cIdx: number) => {
              if (col.type === "media" && col.media) {
                const mediaObj = typeof col.media === "object" ? col.media : null
                generatedContent.push({
                  type: "MediaSection",
                  props: {
                    id: `${blockId}-col-${cIdx}-media`,
                    title: mediaObj?.alt || "Image Section",
                    imageUrl: mediaObj?.url || "/media/nog/nog-board_orig-1.jpg",
                    caption: mediaObj?.alt || "",
                  },
                })
              } else if (col.richText) {
                const textContent = extractTextFromRichText(col.richText)
                generatedContent.push({
                  type: "ContentSection",
                  props: {
                    id: `${blockId}-col-${cIdx}-text`,
                    title: col.title || (cIdx === 0 ? "About North of Grand" : "Our Mission"),
                    text: textContent || "Community content section",
                  },
                })
              }
            })
          }
        } else if (block.blockType === "slideshowBlock") {
          generatedContent.push({
            type: "SlideshowSection",
            props: {
              id: `${blockId}-slideshow`,
              title: block.title || "Neighborhood Photo Gallery",
            },
          })
        } else if (block.blockType === "contactBlock") {
          generatedContent.push({
            type: "ContactSection",
            props: {
              id: `${blockId}-contact`,
              title: block.title || "Get in Touch with NOG",
              email: block.email || "info@northofgrand.org",
              address: block.address || "Des Moines, Iowa",
            },
          })
        } else if (block.blockType === "iframeBlock") {
          generatedContent.push({
            type: "IframeSection",
            props: {
              id: `${blockId}-iframe`,
              iframeUrl: block.iframeUrl || "https://calendar.google.com/calendar/embed?src=northofgrandpresident%40gmail.com",
              height: block.height || 600,
              title: block.title || "Yearly Calendar",
            },
          })
        } else if (block.blockType === "cta") {
          generatedContent.push({
            type: "CtaSection",
            props: {
              id: `${blockId}-cta`,
              heading: "Prefer Social Updates?",
              subheading: "Check out our Facebook page for detailed descriptions of meetings and local events.",
              buttonText: "View Facebook Page",
              buttonUrl: "https://facebook.com",
            },
          })
        }
      })
    }

    if (generatedContent.length === 0) {
      generatedContent.push({
        type: "ContentSection",
        props: {
          id: `default-${page.id}`,
          title: page.title,
          text: `Visual editing layout for ${page.title} (${page.slug})`,
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
          <p className="text-xs text-slate-400">Click any block on the canvas to select and edit its text, images, and settings on the right panel.</p>
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
