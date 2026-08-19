import type { CollectionConfig } from "payload"
import { isApproved } from "../access/roles"

/**
 * Tenant-scoped custom fields for the Business Directory.
 * Values are stored on each business under `customAttributes` (JSON), keyed by `key`.
 */
export const DirectoryFields: CollectionConfig = {
  slug: "directory-fields",
  labels: {
    singular: "Directory Field",
    plural: "Directory Fields",
  },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    read: ({ req: { user } }) => {
      // Public registration + directory need to know which custom fields to show
      if (!user) return true
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
    defaultColumns: ["label", "key", "fieldType", "showInRegistration", "updatedAt"],
    description:
      "Add custom directory fields for your neighborhood (e.g. parking notes, dietary tags). Managed in Dashboard → Settings → Business Directory.",
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
        description: "Unique camelCase key stored in business customAttributes (e.g. acceptsReservations).",
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
        { label: "URL", value: "url" },
      ],
    },
    {
      name: "options",
      type: "array",
      admin: {
        condition: (_, siblingData) => siblingData?.fieldType === "select",
        description: "Options for dropdown fields.",
      },
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "required",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Require this field on the public registration form when shown there.",
      },
    },
    {
      name: "showInRegistration",
      type: "checkbox",
      defaultValue: true,
      label: "Show on registration form",
    },
    {
      name: "showOnCard",
      type: "checkbox",
      defaultValue: false,
      label: "Show on directory card",
    },
    {
      name: "showOnDetail",
      type: "checkbox",
      defaultValue: true,
      label: "Show on business detail view",
    },
  ],
  timestamps: true,
}
