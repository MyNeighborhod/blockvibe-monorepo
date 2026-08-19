"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { Page } from "@/payload-types"
import { BLOCK_TEMPLATES } from "./templates"
import { savePageOverlayLayoutAction } from "./actions"
import type { BlockTypeKey } from "./types"

type PageBlock = Page["layout"][0]

interface OverlayVisualBuilderContextType {
  isEditing: boolean
  toggleEditing: () => void
  blocks: PageBlock[]
  selectedBlockIndex: number | null
  setSelectedBlockIndex: (index: number | null) => void
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void
  addInsertIndex: number | null
  openAddModal: (insertIndex?: number | null) => void
  closeAddModal: () => void
  isDirty: boolean
  isSaving: boolean
  saveMessage: string | null
  
  // Actions
  updateBlockData: (index: number, newBlockData: Partial<PageBlock>) => void
  moveBlock: (index: number, direction: "up" | "down") => void
  duplicateBlock: (index: number) => void
  deleteBlock: (index: number) => void
  addBlockTemplate: (templateType: BlockTypeKey, insertIndex?: number | null) => void
  savePage: () => Promise<void>
  resetPage: () => void
  
  pageId?: string | number
  pathName?: string
}

const OverlayVisualBuilderContext = createContext<OverlayVisualBuilderContextType | null>(null)

export const OverlayVisualBuilderProvider: React.FC<{
  children: React.ReactNode
  initialBlocks: PageBlock[]
  pageId?: string | number
  pathName?: string
  canEdit?: boolean
}> = ({ children, initialBlocks, pageId, pathName, canEdit = true }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks || [])
  const [initialState, setInitialState] = useState<PageBlock[]>(initialBlocks || [])
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addInsertIndex, setAddInsertIndex] = useState<number | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Sync initial blocks when page changes
  useEffect(() => {
    setBlocks(initialBlocks || [])
    setInitialState(initialBlocks || [])
    setIsDirty(false)
  }, [initialBlocks])

  const toggleEditing = () => {
    if (!canEdit) return
    setIsEditing((prev) => !prev)
    if (isEditing) {
      setIsDrawerOpen(false)
      setIsAddModalOpen(false)
    }
  }

  const updateBlockData = (index: number, newBlockData: Partial<PageBlock>) => {
    setBlocks((prev) => {
      const next = [...prev]
      if (next[index]) {
        next[index] = {
          ...next[index],
          ...newBlockData,
        } as PageBlock
      }
      return next
    })
    setIsDirty(true)
  }

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
    setIsDirty(true)
    if (selectedBlockIndex === index) {
      setSelectedBlockIndex(direction === "up" ? index - 1 : index + 1)
    }
  }

  const duplicateBlock = (index: number) => {
    setBlocks((prev) => {
      const next = [...prev]
      const source = next[index]
      if (!source) return prev
      const clone = JSON.parse(JSON.stringify(source))
      clone.id = `clone-${Date.now()}`
      if (clone.blockName) {
        clone.blockName = `${clone.blockName} (Copy)`
      }
      next.splice(index + 1, 0, clone as PageBlock)
      return next
    })
    setIsDirty(true)
  }

  const deleteBlock = (index: number) => {
    setBlocks((prev) => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
    setIsDirty(true)
    if (selectedBlockIndex === index) {
      setSelectedBlockIndex(null)
      setIsDrawerOpen(false)
    } else if (selectedBlockIndex !== null && selectedBlockIndex > index) {
      setSelectedBlockIndex(selectedBlockIndex - 1)
    }
  }

  const openAddModal = (insertIndex?: number | null) => {
    setAddInsertIndex(insertIndex ?? null)
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setAddInsertIndex(null)
  }

  const addBlockTemplate = (templateType: BlockTypeKey, insertIndex?: number | null) => {
    const template = BLOCK_TEMPLATES.find((t) => t.type === templateType)
    if (!template) return

    const newBlock = {
      ...JSON.parse(JSON.stringify(template.defaultData)),
      id: `block-${Date.now()}`,
    }

    setBlocks((prev) => {
      const next = [...prev]
      const targetPos = typeof insertIndex === "number" && insertIndex >= 0 ? insertIndex : next.length
      next.splice(targetPos, 0, newBlock as PageBlock)
      return next
    })

    setIsDirty(true)
    closeAddModal()

    // Automatically select the new block for editing
    const addedIndex = typeof insertIndex === "number" && insertIndex >= 0 ? insertIndex : blocks.length
    setSelectedBlockIndex(addedIndex)
    setIsDrawerOpen(true)
  }

  const savePage = async () => {
    if (!pageId) return
    setIsSaving(true)
    setSaveMessage(null)

    const res = await savePageOverlayLayoutAction(pageId, blocks, pathName || "/")
    setIsSaving(false)

    if (res.success) {
      setIsDirty(false)
      setInitialState(blocks)
      setSaveMessage("Saved successfully!")
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      alert(res.error || "Failed to save layout changes.")
    }
  }

  const resetPage = () => {
    if (confirm("Are you sure you want to discard all unsaved visual edits?")) {
      setBlocks(initialState)
      setIsDirty(false)
      setIsDrawerOpen(false)
      setSelectedBlockIndex(null)
    }
  }

  return (
    <OverlayVisualBuilderContext.Provider
      value={{
        isEditing,
        toggleEditing,
        blocks,
        selectedBlockIndex,
        setSelectedBlockIndex,
        isDrawerOpen,
        setIsDrawerOpen,
        isAddModalOpen,
        setIsAddModalOpen,
        addInsertIndex,
        openAddModal,
        closeAddModal,
        isDirty,
        isSaving,
        saveMessage,
        updateBlockData,
        moveBlock,
        duplicateBlock,
        deleteBlock,
        addBlockTemplate,
        savePage,
        resetPage,
        pageId,
        pathName,
      }}
    >
      {children}
    </OverlayVisualBuilderContext.Provider>
  )
}

export const useOverlayVisualBuilder = () => {
  const ctx = useContext(OverlayVisualBuilderContext)
  if (!ctx) {
    // Fallback stub for non-editing contexts
    return {
      isEditing: false,
      toggleEditing: () => {},
      blocks: [],
      selectedBlockIndex: null,
      setSelectedBlockIndex: () => {},
      isDrawerOpen: false,
      setIsDrawerOpen: () => {},
      isAddModalOpen: false,
      setIsAddModalOpen: () => {},
      addInsertIndex: null,
      openAddModal: () => {},
      closeAddModal: () => {},
      isDirty: false,
      isSaving: false,
      saveMessage: null,
      updateBlockData: () => {},
      moveBlock: () => {},
      duplicateBlock: () => {},
      deleteBlock: () => {},
      addBlockTemplate: () => {},
      savePage: async () => {},
      resetPage: () => {},
    }
  }
  return ctx
}
