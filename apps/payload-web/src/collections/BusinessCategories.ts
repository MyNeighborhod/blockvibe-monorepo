import type { CollectionConfig } from "payload"
import { slugField } from "payload"
import { isApproved } from "../access/roles"

export const BusinessCategories: CollectionConfig = {
  slug: "business-categories",
  labels: {
    singular: "Business Category",
    plural: "Business Categories",
  },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    description: "Categories used to filter the public business directory (when Directory is enabled).",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField({
      position: undefined,
    }),
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Lower numbers appear first in directory filter pills.",
      },
    },
  ],
  timestamps: true,
}
