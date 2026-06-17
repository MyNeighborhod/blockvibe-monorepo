import type { Block } from "payload"

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

export const ContactBlock: Block = {
  slug: "contactBlock",
  interfaceName: "ContactBlock",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "newsletterForm",
          type: "relationship",
          relationTo: "forms",
          required: true,
          admin: {
            width: "50%",
          },
        },
        {
          name: "questionForm",
          type: "relationship",
          relationTo: "forms",
          required: true,
          admin: {
            width: "50%",
          },
        },
      ],
    },
    {
      name: "newsletterIntro",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      label: "Newsletter Intro Content",
    },
    {
      name: "questionIntro",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      label: "Question Form Intro Content",
    },
    {
      name: "showMap",
      type: "checkbox",
      defaultValue: true,
      label: "Show Interactive Map",
    },
    {
      type: "row",
      admin: {
        condition: (_, { showMap }) => Boolean(showMap),
      },
      fields: [
        {
          name: "mapLatitude",
          type: "number",
          defaultValue: 41.5903,
          required: true,
          admin: {
            width: "33%",
          },
        },
        {
          name: "mapLongitude",
          type: "number",
          defaultValue: -93.6648,
          required: true,
          admin: {
            width: "33%",
          },
        },
        {
          name: "mapZoom",
          type: "number",
          defaultValue: 14,
          required: true,
          admin: {
            width: "34%",
          },
        },
      ],
    },
    {
      name: "mapBoundaryGeoJSON",
      type: "textarea",
      label: "Map Boundary GeoJSON Polygon",
      admin: {
        condition: (_, { showMap }) => Boolean(showMap),
        description: "Paste a GeoJSON Feature or Polygon coordinate geometry to highlight the neighborhood boundary on the map.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "facebookUrl",
          type: "text",
          label: "Facebook URL",
          admin: {
            width: "50%",
          },
        },
        {
          name: "emailAddress",
          type: "text",
          label: "President/General Email Address",
          admin: {
            width: "50%",
          },
        },
      ],
    },
  ],
  graphQL: {
    singularName: "ContactBlock",
  },
  labels: {
    plural: "Contact Blocks",
    singular: "Contact Block",
  },
}
