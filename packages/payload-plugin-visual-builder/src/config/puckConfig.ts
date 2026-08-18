import type { VisualBlockProps } from "../types.js"

export interface PuckBlockConfig {
  label: string
  fields: Record<string, { type: "text" | "textarea" | "select" | "radio"; options?: { label: string; value: string }[] }>
  defaultProps: VisualBlockProps
}

export const defaultPuckBlockDefinitions: Record<string, PuckBlockConfig> = {
  HeroBlock: {
    label: "Hero Header",
    fields: {
      heading: { type: "text" },
      subheading: { type: "textarea" },
      align: {
        type: "select",
        options: [
          { label: "Left Aligned", value: "left" },
          { label: "Centered", value: "center" },
        ],
      },
      buttonText: { type: "text" },
      buttonLink: { type: "text" },
    },
    defaultProps: {
      heading: "Welcome to Our Neighborhood",
      subheading: "Discover local events, community businesses, and upcoming initiatives.",
      align: "center",
      buttonText: "Explore Directory",
      buttonLink: "/businesses",
    },
  },
  ContentBlock: {
    label: "Rich Content Section",
    fields: {
      title: { type: "text" },
      content: { type: "textarea" },
    },
    defaultProps: {
      title: "About Our Community",
      content: "We bring neighbors and local business owners together with modern digital tools and shared directory listings.",
    },
  },
  SplitGridBlock: {
    label: "Section Splitter (Columns)",
    fields: {
      columns: {
        type: "select",
        options: [
          { label: "50 / 50 Split", value: "50/50" },
          { label: "3-Column Equal Split (33/33/33)", value: "33/33/33" },
          { label: "Full Width (100)", value: "100" },
        ],
      },
    },
    defaultProps: {
      columns: "50/50",
    },
  },
  MediaBlock: {
    label: "Media / Banner",
    fields: {
      title: { type: "text" },
      imageUrl: { type: "text" },
    },
    defaultProps: {
      title: "Featured Neighborhood Banner",
      imageUrl: "/media/nog/northofgrand-wordmark-color_orig-1.jpg",
    },
  },
}
