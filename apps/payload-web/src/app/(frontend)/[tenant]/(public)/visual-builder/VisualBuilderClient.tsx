"use client"

import React, { useState } from "react"
import { Puck, type Config as PuckConfig } from "@puckeditor/core"
import "@puckeditor/core/dist/index.css"
import { Button } from "@/components/ui/button"

const puckConfig: PuckConfig = {
  components: {
    HeroBlock: {
      fields: {
        heading: { type: "text" },
        subheading: { type: "textarea" },
        align: {
          type: "select",
          options: [
            { label: "Left Aligned", value: "left" },
            { label: "Centered", value: "center" },
          ],
        },
        buttonText: { type: "text" },
        buttonLink: { type: "text" },
      },
      defaultProps: {
        heading: "North of Grand Neighborhood",
        subheading: "Connecting neighbors, supporting local businesses, and hosting community events.",
        align: "center",
        buttonText: "Browse Businesses",
        buttonLink: "/businesses",
      },
      render: ({ heading, subheading, align, buttonText, buttonLink }) => (
        <section className={`py-12 px-6 bg-emerald-50/60 rounded-2xl border border-emerald-100/70 text-${align || "center"}`}>
          <h2 className="text-3xl md:text-4xl font-serif text-[#42514c] font-semibold mb-3">{heading}</h2>
          <p className="text-base text-[#7b8c89] max-w-xl mx-auto mb-6 leading-relaxed">{subheading}</p>
          {buttonText && (
            <a
              href={buttonLink || "#"}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#47773e] text-white font-medium shadow-sm hover:bg-[#3b6333] transition-colors"
            >
              {buttonText}
            </a>
          )}
        </section>
      ),
    },
    ContentBlock: {
      fields: {
        title: { type: "text" },
        content: { type: "textarea" },
      },
      defaultProps: {
        title: "About Our Community Association",
        content: "The North of Grand Neighborhood Association is dedicated to preserving our historic neighborhood character while fostering vibrant local commerce.",
      },
      render: ({ title, content }) => (
        <section className="py-8 px-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-serif text-[#42514c] font-semibold mb-3">{title}</h3>
          <p className="text-base text-gray-600 leading-relaxed">{content}</p>
        </section>
      ),
    },
    SectionSplitter: {
      fields: {
        layout: {
          type: "select",
          options: [
            { label: "50 / 50 Two Columns", value: "50/50" },
            { label: "33 / 33 / 33 Three Columns", value: "33/33/33" },
          ],
        },
      },
      defaultProps: {
        layout: "50/50",
      },
      render: ({ layout }) => (
        <div className={`grid gap-6 ${layout === "33/33/33" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
          <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-2">Column 1 Content</h4>
            <p className="text-sm text-slate-500">Drag or edit section content inside column 1.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-2">Column 2 Content</h4>
            <p className="text-sm text-slate-500">Drag or edit section content inside column 2.</p>
          </div>
          {layout === "33/33/33" && (
            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-2">Column 3 Content</h4>
              <p className="text-sm text-slate-500">Drag or edit section content inside column 3.</p>
            </div>
          )}
        </div>
      ),
    },
    DirectoryBanner: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
      },
      defaultProps: {
        title: "Explore Local Shops & Services",
        description: "Support local. Discover restaurants, repair shops, and community organizations right in North of Grand.",
      },
      render: ({ title, description }) => (
        <div className="p-8 bg-gradient-to-r from-teal-800 to-emerald-900 text-white rounded-2xl shadow-md">
          <h3 className="text-2xl font-semibold mb-2">{title}</h3>
          <p className="text-emerald-100 text-sm max-w-lg mb-4">{description}</p>
          <a href="/businesses" className="inline-block bg-white text-emerald-900 px-4 py-2 rounded-md font-medium text-sm">
            View Directory →
          </a>
        </div>
      ),
    },
  },
}

const initialData = {
  content: [
    {
      type: "HeroBlock",
      props: {
        heading: "North of Grand Visual Builder",
        subheading: "Drag blocks, split sections into columns, and edit content visually.",
        align: "center",
        buttonText: "Browse Business Directory",
        buttonLink: "/businesses",
      },
    },
    {
      type: "SectionSplitter",
      props: {
        layout: "50/50",
      },
    },
    {
      type: "DirectoryBanner",
      props: {
        title: "Explore Local Shops & Services",
        description: "Support local. Discover restaurants, repair shops, and community organizations right in North of Grand.",
      },
    },
  ],
  root: {},
}

export function VisualBuilderClient({ tenantSlug }: { tenantSlug: string }) {
  const [data, setData] = useState(initialData)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const handleSave = (savedData: any) => {
    setData(savedData)
    setSaveStatus("Saved visual layout successfully!")
    setTimeout(() => setSaveStatus(null), 3000)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-900 px-2 py-0.5 rounded text-xs uppercase font-extrabold">Visual Builder</span>
            Tenant: <span className="text-emerald-400">{tenantSlug}</span>
          </h1>
          <p className="text-xs text-slate-400">Drag-and-drop website layout builder for Payload CMS pages</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && <span className="text-xs text-emerald-400 font-medium">{saveStatus}</span>}
          <a href="/admin" className="text-xs text-slate-300 hover:text-white underline">
            Back to Admin
          </a>
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 min-h-[750px]">
        <Puck config={puckConfig} data={data} onPublish={handleSave} />
      </div>
    </div>
  )
}
