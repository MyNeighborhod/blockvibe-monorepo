import type { Block } from "payload"

export const FileListBlock: Block = {
  slug: "fileListBlock",
  interfaceName: "FileListBlock",
  fields: [
    {
      name: "title",
      type: "text",
      label: "Title",
    },
    {
      name: "files",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "file",
          type: "relationship",
          relationTo: "media",
          required: true,
          label: "Media File",
        },
        {
          name: "description",
          type: "text",
          label: "Custom File Description (Optional)",
        },
      ],
    },
  ],
  labels: {
    plural: "File List Blocks",
    singular: "File List Block",
  },
}
