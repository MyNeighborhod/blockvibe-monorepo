import type { BlockTemplateDefinition } from "./types"

export const BLOCK_TEMPLATES: BlockTemplateDefinition[] = [
  {
    type: "content",
    title: "Rich Text Content",
    description: "Multi-column text layout with optional CTA buttons, headings, and lists.",
    category: "Content & Layout",
    icon: "📝",
    defaultData: {
      blockType: "content",
      columns: [
        {
          size: "full",
          richText: {
            root: {
              type: "root",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  type: "heading",
                  tag: "h2",
                  format: "",
                  indent: 0,
                  version: 1,
                  children: [{ type: "text", text: "New Content Section", version: 1 }],
                },
                {
                  type: "paragraph",
                  format: "",
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: "text",
                      text: "Add your text content here. Click Edit on this block to customize text, layout columns, and links.",
                      version: 1,
                    },
                  ],
                },
              ],
            },
          },
          enableLink: false,
        },
      ],
    },
  },
  {
    type: "cta",
    title: "Call To Action",
    description: "High-visibility banner section with action buttons to drive conversions.",
    category: "Hero & Banner",
    icon: "🚀",
    defaultData: {
      blockType: "cta",
      richText: {
        root: {
          type: "root",
          format: "",
          indent: 0,
          version: 1,
          children: [
            {
              type: "heading",
              tag: "h2",
              format: "",
              indent: 0,
              version: 1,
              children: [{ type: "text", text: "Get Involved Today", version: 1 }],
            },
            {
              type: "paragraph",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  type: "text",
                  text: "Join our community initiative and help make a difference in North of Grand.",
                  version: 1,
                },
              ],
            },
          ],
        },
      },
      links: [
        {
          link: {
            type: "custom",
            url: "/contact",
            label: "Get Started",
            appearance: "default",
          },
        },
      ],
    },
  },
  {
    type: "mediaBlock",
    title: "Media & Image",
    description: "Featured image or video display with optional caption and aspect ratio controls.",
    category: "Media & Gallery",
    icon: "🖼️",
    defaultData: {
      blockType: "mediaBlock",
      position: "default",
    },
  },
  {
    type: "slideshowBlock",
    title: "Image Slideshow Gallery",
    description: "Interactive carousel gallery for showcasing multiple images and photos.",
    category: "Media & Gallery",
    icon: "🎞️",
    defaultData: {
      blockType: "slideshowBlock",
      autoplay: true,
      intervalSeconds: 5,
      slides: [],
    },
  },
  {
    type: "contactBlock",
    title: "Contact Information",
    description: "Display address, phone, email, and interactive Google Map location.",
    category: "Interactive & Dynamic",
    icon: "📞",
    defaultData: {
      blockType: "contactBlock",
      title: "Contact Us",
      description: "Reach out to our board or visit our neighborhood association office.",
      email: "info@blockvibe.org",
      phone: "(515) 555-0199",
      address: "1234 Grand Ave, Des Moines, IA 50309",
      showMap: true,
    },
  },
  {
    type: "archive",
    title: "Posts & News Archive",
    description: "Dynamic grid listing latest news posts, events, or neighborhood updates.",
    category: "Interactive & Dynamic",
    icon: "📰",
    defaultData: {
      blockType: "archive",
      populateBy: "collection",
      relationTo: "posts",
      limit: 6,
    },
  },
  {
    type: "fileListBlock",
    title: "Document & File Downloads",
    description: "List downloadable PDFs, minutes, or community guides for neighborhood members.",
    category: "Content & Layout",
    icon: "📄",
    defaultData: {
      blockType: "fileListBlock",
      title: "Community Documents",
      files: [],
    },
  },
]
