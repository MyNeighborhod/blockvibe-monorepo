"use client"

import React from "react"
import { useOverlayVisualBuilder } from "./OverlayVisualBuilderContext"

export const BlockInspectorDrawer: React.FC = () => {
  const {
    selectedBlockIndex,
    setSelectedBlockIndex,
    isDrawerOpen,
    setIsDrawerOpen,
    blocks,
    updateBlockData,
  } = useOverlayVisualBuilder()

  if (!isDrawerOpen || selectedBlockIndex === null || !blocks[selectedBlockIndex]) {
    return null
  }

  const block = blocks[selectedBlockIndex]
  const blockType = (block as any).blockType || "unknown"

  const handleFieldChange = (key: string, value: any) => {
    updateBlockData(selectedBlockIndex, { [key]: value })
  }

  // Helpers for nested Lexical text extractions/updates
  const getLexicalText = (richText: any): string => {
    try {
      if (!richText?.root?.children) return ""
      const textParts: string[] = []
      const extractText = (nodes: any[]) => {
        for (const n of nodes) {
          if (n.text) textParts.push(n.text)
          if (n.children) extractText(n.children)
        }
      }
      extractText(richText.root.children)
      return textParts.join("\n\n")
    } catch {
      return ""
    }
  }

  const setLexicalText = (plainText: string) => {
    const paragraphs = plainText.split("\n\n").filter(Boolean)
    const children = paragraphs.map((p, idx) => {
      if (idx === 0) {
        return {
          type: "heading",
          tag: "h2",
          format: "",
          indent: 0,
          version: 1,
          children: [{ type: "text", text: p, version: 1 }],
        }
      }
      return {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        children: [{ type: "text", text: p, version: 1 }],
      }
    })

    return {
      root: {
        type: "root",
        format: "",
        indent: 0,
        version: 1,
        children: children.length > 0 ? children : [{
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          children: [{ type: "text", text: plainText, version: 1 }],
        }],
      },
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-800 backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 px-6">
        <div className="flex items-center gap-2">
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
            {blockType}
          </span>
          <h3 className="font-semibold text-white">Edit Block #{selectedBlockIndex + 1}</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Body Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* CTA Block Editor */}
        {blockType === "cta" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Content Text (Headings & Description)
              </label>
              <textarea
                rows={4}
                value={getLexicalText((block as any).richText)}
                onChange={(e) => handleFieldChange("richText", setLexicalText(e.target.value))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                placeholder="Title and description text..."
              />
              <p className="mt-1 text-[11px] text-slate-400">
                First line is used as the H2 heading; remaining lines form paragraphs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Button Label</label>
              <input
                type="text"
                value={(block as any).links?.[0]?.link?.label || ""}
                onChange={(e) => {
                  const links = [...((block as any).links || [])]
                  if (!links[0]) links[0] = { link: {} }
                  links[0].link = { ...links[0].link, label: e.target.value }
                  handleFieldChange("links", links)
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                placeholder="Get Started"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Button Link URL</label>
              <input
                type="text"
                value={(block as any).links?.[0]?.link?.url || ""}
                onChange={(e) => {
                  const links = [...((block as any).links || [])]
                  if (!links[0]) links[0] = { link: {} }
                  links[0].link = { ...links[0].link, url: e.target.value, type: "custom" }
                  handleFieldChange("links", links)
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                placeholder="/contact"
              />
            </div>
          </div>
        )}

        {/* Content Block Editor */}
        {blockType === "content" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Column 1 Content
              </label>
              <textarea
                rows={6}
                value={getLexicalText((block as any).columns?.[0]?.richText)}
                onChange={(e) => {
                  const cols = [...((block as any).columns || [])]
                  if (!cols[0]) cols[0] = { size: "full" }
                  cols[0].richText = setLexicalText(e.target.value)
                  handleFieldChange("columns", cols)
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter section content..."
              />
            </div>
          </div>
        )}

        {/* Contact Block Editor */}
        {blockType === "contactBlock" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Section Title</label>
              <input
                type="text"
                value={(block as any).title || ""}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={(block as any).email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={(block as any).phone || ""}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
              <textarea
                rows={2}
                value={(block as any).address || ""}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={Boolean((block as any).showMap)}
                onChange={(e) => handleFieldChange("showMap", e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
              Show Interactive Google Map
            </label>
          </div>
        )}

        {/* Fallback for other blocks */}
        {!["cta", "content", "contactBlock"].includes(blockType) && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Editing raw block fields for <strong>{blockType}</strong>:
            </p>
            {Object.keys(block)
              .filter((key) => !["id", "blockType"].includes(key))
              .map((key) => {
                const val = (block as any)[key]
                if (typeof val === "object" && val !== null) return null
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-300 capitalize mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={val ?? ""}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex h-16 items-center justify-end gap-3 border-t border-slate-800 px-6">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(false)}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition shadow-md"
        >
          Done Editing
        </button>
      </div>
    </div>
  )
}
