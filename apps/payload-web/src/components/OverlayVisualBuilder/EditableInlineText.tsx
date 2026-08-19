"use client"

import React, { useRef, useEffect } from "react"
import { useOverlayVisualBuilder } from "./OverlayVisualBuilderContext"

interface EditableInlineTextProps {
  value: string
  onChange: (newValue: string) => void
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"
  className?: string
  placeholder?: string
}

export const EditableInlineText: React.FC<EditableInlineTextProps> = ({
  value,
  onChange,
  as: Component = "span",
  className = "",
  placeholder = "Click to type...",
}) => {
  const { isEditing } = useOverlayVisualBuilder()
  const ref = useRef<HTMLElement>(null)

  // Keep DOM element text synced with state when not actively focused
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = value || ""
    }
  }, [value])

  if (!isEditing) {
    return <Component className={className}>{value}</Component>
  }

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText
    onChange(text)
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText.trim()
    onChange(text)
  }

  return (
    <Component
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      data-placeholder={placeholder}
      className={`${className} cursor-text rounded border border-dashed border-cyan-400/60 hover:border-cyan-400 focus:border-solid focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none px-1 transition-all duration-150 relative group/inline`}
      title="Click to edit text in place"
    />
  )
}
