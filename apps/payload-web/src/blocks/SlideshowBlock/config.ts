import type { Block } from "payload"

export const SlideshowBlock: Block = {
  slug: "slideshowBlock",
  interfaceName: "SlideshowBlock",
  fields: [
    {
      name: "images",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "image",
          type: "relationship",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
  labels: {
    plural: "Slideshow Blocks",
    singular: "Slideshow Block",
  },
}
