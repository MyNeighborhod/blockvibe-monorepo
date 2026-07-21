import type { CollectionConfig } from "payload"
import { isApproved } from "../access/roles"

export const CRMFields: CollectionConfig = {
  slug: "crm-fields",
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      return isApproved(user)
    },
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
    useAsTitle: "label",
    defaultColumns: ["label", "key", "fieldType", "createdAt"],
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "key",
      type: "text",
      required: true,
      admin: {
        description: "The unique key (camelCase) used for database queries (e.g. hasDog, membershipTier).",
      },
    },
    {
      name: "fieldType",
      type: "select",
      required: true,
      defaultValue: "text",
      options: [
        { label: "Text", value: "text" },
        { label: "Number", value: "number" },
        { label: "Checkbox", value: "checkbox" },
        { label: "Dropdown Select", value: "select" },
      ],
    },
    {
      name: "options",
      type: "array",
      admin: {
        condition: (_, siblingData) => siblingData?.fieldType === "select",
        description: "List of options for the dropdown selector.",
      },
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}
