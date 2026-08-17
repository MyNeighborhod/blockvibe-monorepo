import type { CollectionConfig } from "payload"

export const Businesses: CollectionConfig = {
  slug: "businesses",
  access: {
    read: () => true,
    create: () => true, // Anyone can submit their business (when directory enabled)
    update: ({ req: { user } }) => {
      const isStaff = user?.role === "superadmin" || user?.role === "admin" || user?.role === "editor"
      return Boolean(isStaff)
    },
    delete: ({ req: { user } }) => {
      const isStaff = user?.role === "superadmin" || user?.role === "admin" || user?.role === "editor"
      return Boolean(isStaff)
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "website", "appearOnNOG"],
    description:
      "Local business listings for the public directory. Visibility is controlled by Appear in Directory.",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: false,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Hero / cover photo shown on directory cards and the detail view (Avenues-style).",
      },
    },
    {
      name: "address",
      type: "text",
      required: false,
    },
    {
      name: "phone",
      type: "text",
      required: false,
    },
    {
      name: "website",
      type: "text",
      required: false,
    },
    {
      name: "email",
      type: "email",
      required: false,
    },
    {
      name: "hours",
      type: "text",
      required: false,
    },
    {
      name: "about",
      type: "textarea",
      required: false,
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "business-categories",
      hasMany: true,
      admin: {
        description: "Used for public directory filter pills.",
      },
    },
    {
      name: "facebook",
      type: "text",
      required: false,
      admin: {
        description: "Full URL or page handle.",
      },
    },
    {
      name: "instagram",
      type: "text",
      required: false,
      admin: {
        description: "Full URL or @handle.",
      },
    },
    {
      name: "customAttributes",
      type: "json",
      admin: {
        description:
          "Values for custom Directory Fields (key → value). Prefer editing via the dashboard when possible.",
      },
    },
    {
      name: "appearOnNOG",
      type: "checkbox",
      defaultValue: false,
      label: "Appear in Directory",
      admin: {
        description:
          "When checked, this business is shown on the public directory (after Directory feature is enabled for the tenant).",
        position: "sidebar",
      },
    },
  ],
}
