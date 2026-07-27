import type { CollectionConfig } from "payload"
import { isApproved } from "../access/roles"

export const MailingLists: CollectionConfig = {
  slug: "mailing-lists",
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
    useAsTitle: "name",
    defaultColumns: ["name", "type", "createdAt"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "static",
      options: [
        { label: "Static List (Manually Selected)", value: "static" },
        { label: "Dynamic List (Criteria Filtered)", value: "dynamic" },
      ],
    },
    {
      name: "members",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === "static",
        description: "Select members to include in this list.",
      },
    },
    {
      name: "rules",
      type: "json",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "dynamic",
        description: "Rules for dynamically including members (e.g. memberType = business).",
      },
    },
  ],
  timestamps: true,
}
