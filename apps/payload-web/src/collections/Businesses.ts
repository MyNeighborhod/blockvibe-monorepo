import type { CollectionConfig } from "payload"

export const Businesses: CollectionConfig = {
  slug: "businesses",
  access: {
    read: () => true,
    create: () => true, // Anyone can submit their business
    update: ({ req: { user } }) => {
      const isStaff = user?.role === "superadmin" || user?.role === "admin" || user?.role === "editor"
      return isStaff
    },
    delete: ({ req: { user } }) => {
      const isStaff = user?.role === "superadmin" || user?.role === "admin" || user?.role === "editor"
      return isStaff
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "website", "appearOnNOG"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "address",
      type: "text",
      required: true,
    },
    {
      name: "website",
      type: "text",
      required: true,
    },
    {
      name: "about",
      type: "textarea",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "hours",
      type: "text",
      required: false,
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "appearOnNOG",
      type: "checkbox",
      defaultValue: false,
      label: "Appear on NOG",
    },
  ],
}
