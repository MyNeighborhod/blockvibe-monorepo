import type { Block } from "payload"

export const PdfBlock: Block = {
  slug: "pdfBlock",
  interfaceName: "PdfBlock",
  fields: [
    {
      name: "pdfFile",
      type: "upload",
      relationTo: "media",
      required: true,
      label: "PDF File",
    },
    {
      name: "height",
      type: "number",
      defaultValue: 600,
      required: true,
      label: "Viewer Height (in pixels)",
    },
    {
      name: "title",
      type: "text",
      label: "Viewer Title / Description",
    },
  ],
  labels: {
    plural: "PDF Viewer Blocks",
    singular: "PDF Viewer Block",
  },
}
