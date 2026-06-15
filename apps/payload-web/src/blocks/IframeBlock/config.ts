import type { Block } from "payload"

export const IframeBlock: Block = {
  slug: "iframeBlock",
  interfaceName: "IframeBlock",
  fields: [
    {
      name: "iframeUrl",
      type: "text",
      required: true,
      label: "Iframe Embed URL",
    },
    {
      name: "height",
      type: "number",
      defaultValue: 500,
      required: true,
      label: "Height (in pixels)",
    },
    {
      name: "title",
      type: "text",
      label: "Iframe Accessibility Title",
    },
  ],
  labels: {
    plural: "Iframe Blocks",
    singular: "Iframe Block",
  },
}
