"use client"

import React from "react"
import { useOverlayVisualBuilder } from "./OverlayVisualBuilderContext"

interface BlockOverlayWrapperProps {
  children: React.ReactNode
  index: number
  blockType?: string
  blockName?: string
  id?: string
}

export const BlockOverlayWrapper: React.FC<BlockOverlayWrapperProps> = ({
  children,
  index,
  blockType,
  blockName,
  id,
}) => {
  const {
    isEditing,
    selectedBlockIndex,
    setSelectedBlockIndex,
    setIsDrawerOpen,
    moveBlock,
    duplicateBlock,
    deleteBlock,
    openAddModal,
    blocks,
  } = useOverlayVisualBuilder()

  if (!isEditing) {
    return <>{children}</>
  }

  const isSelected = selectedBlockIndex === index
  const isFirst = index === 0
  const isLast = index === blocks.length - 1

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBlockIndex(index)
    setIsDrawerOpen(true)
  }

  return (
    <div
      className={`group relative transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-cyan-500 ring-offset-4 ring-offset-background rounded-lg shadow-lg shadow-cyan-500/10"
          : "hover:ring-2 hover:ring-cyan-500/50 hover:ring-offset-2 hover:ring-offset-background rounded-lg"
      }`}
      id={id}
    >
      {/* Top Controls Overlay Pill */}
      <div className="absolute top-2 right-4 z-40 flex items-center gap-1 rounded-lg bg-slate-950/90 p-1 text-xs text-white shadow-xl border border-slate-700/60 opacity-90 group-hover:opacity-100 transition-opacity backdrop-blur-md">
        <span className="px-2 py-0.5 font-semibold text-cyan-400 border-r border-slate-800">
          {blockType ? blockType.replace(/([A-Z])/g, " $1").trim() : "Block"}
        </span>

        <button
          type="button"
          onClick={handleEditClick}
          className="flex items-center gap-1 rounded px-2 py-1 font-medium bg-cyan-600/90 text-white hover:bg-cyan-500 transition"
          title="Edit Fields & Content"
        >
          ✏️ Edit
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            moveBlock(index, "up")
          }}
          disabled={isFirst}
          className={`rounded p-1 transition ${
            isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-800 text-slate-200"
          }`}
          title="Move Up"
        >
          🔼
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            moveBlock(index, "down")
          }}
          disabled={isLast}
          className={`rounded p-1 transition ${
            isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-800 text-slate-200"
          }`}
          title="Move Down"
        >
          🔽
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            duplicateBlock(index)
          }}
          className="rounded p-1 hover:bg-slate-800 text-slate-200 transition"
          title="Duplicate Block"
        >
          📋
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm("Delete this section block?")) {
              deleteBlock(index)
            }
          }}
          className="rounded p-1 hover:bg-rose-950/60 text-rose-300 transition"
          title="Delete Block"
        >
          🗑️
        </button>
      </div>

      {/* Rendered Block Content */}
      <div className="pointer-events-auto">{children}</div>

      {/* Add Section Below Divider Indicator */}
      <div className="relative py-2 my-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-cyan-500/40"></div>
        </div>
        <button
          type="button"
          onClick={() => openAddModal(index + 1)}
          className="relative z-30 flex items-center gap-1.5 rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 hover:scale-105 transition-all"
        >
          ➕ Add Section Here
        </button>
      </div>
    </div>
  )
}
