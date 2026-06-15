import type { RequiredDataFromCollectionSlug } from "payload"

export interface TemplateArgs {
  tenantId: unknown
  tenantSlug: string
  tenantName: string
  heroImageId?: unknown
  postImageId?: unknown
  contactFormId?: unknown
  contactPageId?: unknown
}

export const getTemplateHome = ({
  tenantId,
  tenantName,
  heroImageId,
  postImageId,
}: TemplateArgs): RequiredDataFromCollectionSlug<"pages"> => {
  return {
    slug: "home",
    _status: "published",
    title: `${tenantName} - Home`,
    tenant: tenantId as number,
    hero: {
      type: heroImageId ? "highImpact" : "none",
      links: [
        {
          link: {
            type: "custom",
            appearance: "default",
            label: "All posts",
            url: "/posts",
          },
        },
        {
          link: {
            type: "custom",
            appearance: "outline",
            label: "Contact",
            url: "/contact",
          },
        },
      ],
      media: (heroImageId as number) || undefined,
      richText: {
        root: {
          type: "root",
          children: [
            {
              type: "heading",
              children: [
                {
                  type: "text",
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: tenantName,
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              tag: "h1",
              version: 1,
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: `Welcome to the official website of the ${tenantName}. Explore our news, upcoming events, and contact details.`,
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
        },
      },
    },
    layout: [
      {
        blockName: "Features Column Block",
        blockType: "content" as const,
        columns: [
          {
            richText: {
              root: {
                type: "root",
                children: [
                  {
                    type: "heading",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Core Features",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    tag: "h2",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 1,
              },
            },
            size: "full",
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: "root",
                children: [
                  {
                    type: "heading",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Admin Dashboard",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    tag: "h3",
                    version: 1,
                  },
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: `Manage pages and content for ${tenantName} in the admin panel.`,
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 1,
              },
            },
            size: "oneThird",
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: "root",
                children: [
                  {
                    type: "heading",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Multi-Tenant Scoping",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    tag: "h3",
                    version: 1,
                  },
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "All layout pages, headers, footers, and uploads are isolated under your tenant profile.",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 1,
              },
            },
            size: "oneThird",
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: "root",
                children: [
                  {
                    type: "heading",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Dynamic Theme",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    tag: "h3",
                    version: 1,
                  },
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Fully responsive structures customized for light or dark layout styles.",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 1,
              },
            },
            size: "oneThird",
          },
        ],
      },
      ...(postImageId
        ? [
            {
              blockName: "Media Block",
              blockType: "mediaBlock" as const,
              media: postImageId as number,
            },
          ]
        : []),
      {
        blockName: "Archive Block",
        blockType: "archive" as const,
        categories: [],
        introContent: {
          root: {
            type: "root",
            children: [
              {
                type: "heading",
                children: [
                  {
                    type: "text",
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Recent Posts",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                tag: "h3",
                version: 1,
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Explore the latest updates and announcements from our community below.",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                textFormat: 0,
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            version: 1,
          },
        },
        populateBy: "collection",
        relationTo: "posts",
      },
    ],
    meta: {
      title: `${tenantName} - Home`,
      description: `Official home page for ${tenantName}.`,
    },
  }
}

export const getTemplateContact = ({
  tenantId,
  tenantName,
  contactFormId,
}: TemplateArgs): RequiredDataFromCollectionSlug<"pages"> => {
  return {
    slug: "contact",
    _status: "published",
    title: `Contact - ${tenantName}`,
    tenant: tenantId as number,
    hero: {
      type: "none",
    },
    layout: [
      {
        blockName: "Contact Text Block",
        blockType: "content" as const,
        columns: [
          {
            richText: {
              root: {
                type: "root",
                children: [
                  {
                    type: "heading",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Get In Touch",
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    tag: "h2",
                    version: 1,
                  },
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: `If you have questions or want to get involved with the ${tenantName}, drop us a line using the form below.`,
                        version: 1,
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                version: 1,
              },
            },
            size: "full",
          },
        ],
      },
      ...(contactFormId
        ? [
            {
              blockName: "Contact Form Block",
              blockType: "formBlock" as const,
              enableIntro: false,
              form: contactFormId as number,
            },
          ]
        : []),
    ],
    meta: {
      title: `Contact - ${tenantName}`,
      description: `Contact form and info for ${tenantName}.`,
    },
  }
}

export const getTemplatePost = ({
  tenantId,
  tenantName,
  heroImageId,
  postImageId,
  beaverdaleAdminUser, // Using author context or fallbacks
}: TemplateArgs & {
  beaverdaleAdminUser: { id: number | string }
}): RequiredDataFromCollectionSlug<"posts"> => {
  return {
    slug: "welcome-to-our-community",
    _status: "published",
    title: "Welcome to Our New Website!",
    tenant: tenantId as number,
    authors: [beaverdaleAdminUser.id as number],
    heroImage: (heroImageId as number) || (postImageId as number) || undefined,
    content: {
      root: {
        type: "root",
        children: [
          {
            type: "heading",
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: `We are thrilled to launch the new online home for the ${tenantName}!`,
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            tag: "h2",
            version: 1,
          },
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "This website is powered by a multi-tenant content management system. Our team can now edit text, customize page layouts, configure menus, and upload media easily.",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            textFormat: 0,
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
      },
    },
    meta: {
      title: "Welcome to Our New Website!",
      description: `Read the first post from ${tenantName} and explore our features.`,
      image: (heroImageId as number) || (postImageId as number) || undefined,
    },
  }
}

export const getTemplateHeader = ({
  tenantId,
  contactPageId,
}: TemplateArgs): RequiredDataFromCollectionSlug<"header"> => {
  return {
    tenant: tenantId as number,
    navItems: [
      {
        link: {
          type: "custom" as const,
          label: "Posts",
          url: "/posts",
        },
      },
      ...(contactPageId
        ? [
            {
              link: {
                type: "reference" as const,
                label: "Contact",
                reference: {
                  relationTo: "pages" as const,
                  value: contactPageId as number,
                },
              },
            },
          ]
        : []),
    ],
  }
}

export const getTemplateFooter = ({
  tenantId,
}: TemplateArgs): RequiredDataFromCollectionSlug<"footer"> => {
  return {
    tenant: tenantId as number,
    navItems: [
      {
        link: {
          type: "custom" as const,
          label: "Admin",
          url: "/admin",
        },
      },
    ],
  }
}
