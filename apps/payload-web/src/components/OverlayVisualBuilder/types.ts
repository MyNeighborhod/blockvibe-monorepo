import type { Page } from "@/payload-types"

export type PageBlock = Page["layout"][0]

export type BlockTypeKey =
  | "content"
  | "cta"
  | "mediaBlock"
  | "archive"
  | "formBlock"
  | "slideshowBlock"
  | "fileListBlock"
  | "contactBlock"
  | "pdfBlock"

export interface BlockTemplateDefinition {
  type: BlockTypeKey
  title: string
  description: string
  category: "Hero & Banner" | "Content & Layout" | "Media & Gallery" | "Interactive & Dynamic"
  icon: string
  defaultData: Record<string, any>
}
