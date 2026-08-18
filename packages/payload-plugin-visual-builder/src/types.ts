import type { Config } from "payload"

export interface VisualBuilderPluginConfig {
  /**
   * Enable visual builder for specific collections (defaults to ['pages'])
   */
  collections?: string[]
  /**
   * Custom field key for storing visual builder layout JSON
   */
  fieldKey?: string
  /**
   * Enable inline canvas editing mode
   */
  enableInlineEditing?: boolean
}

export type VisualBlockProps = {
  title?: string
  heading?: string
  subheading?: string
  content?: string
  align?: "left" | "center" | "right"
  columns?: "50/50" | "33/33/33" | "100"
  imageUrl?: string
  buttonText?: string
  buttonLink?: string
}
