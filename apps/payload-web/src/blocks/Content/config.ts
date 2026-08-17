import type { Block, Field } from "payload"

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

import { link } from "@/fields/link"

const columnFields: Field[] = [
  {
    name: "type",
    type: "select",
    defaultValue: "text",
    options: [
      {
        label: "Text",
        value: "text",
      },
      {
        label: "Media",
        value: "media",
      },
    ],
  },
  {
    name: "size",
    type: "select",
    defaultValue: "oneThird",
    options: [
      {
        label: "One Third",
        value: "oneThird",
      },
      {
        label: "Half",
        value: "half",
      },
      {
        label: "Two Thirds",
        value: "twoThirds",
      },
      {
        label: "Full",
        value: "full",
      },
    ],
  },
  {
    name: "richText",
    type: "richText",
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: false,
    admin: {
      condition: (_, siblingData) => siblingData?.type !== "media",
    },
  },
  {
    name: "media",
    type: "upload",
    relationTo: "media",
    admin: {
      condition: (_, siblingData) => siblingData?.type === "media",
    },
  },
  {
    name: "enableLink",
    type: "checkbox",
    admin: {
      condition: (_, siblingData) => siblingData?.type !== "media",
    },
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return siblingData?.type !== "media" && Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
  fields: [
    {
      name: "columns",
      type: "array",
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
  ],
}
