"use client"

import React from "react"
import { useFormFields } from "@payloadcms/ui"

export const VisualBuilderField: React.FC<{ path: string }> = () => {
  return (
    <div style={{ marginTop: "12px", marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--theme-elevation-400)",
          marginBottom: "8px",
        }}
      >
        Visual Website Builder
      </label>
      <a
        href="/visual-builder"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          padding: "10px 14px",
          backgroundColor: "#10b981",
          color: "#ffffff",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "700",
          textDecoration: "none",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          cursor: "pointer",
        }}
      >
        <span>🎨</span>
        <span>Edit Page with Visual Builder</span>
      </a>
      <p style={{ marginTop: "6px", fontSize: "11px", color: "#9ca3af" }}>
        Launch interactive drag-and-drop Puck canvas to edit sections visually.
      </p>
    </div>
  )
}

export default VisualBuilderField
