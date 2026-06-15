import type { CollectionConfig } from "payload"
import { anyone } from "../access/anyone"
import { isApproved } from "../access/roles"

export const Invites: CollectionConfig = {
  slug: "invites",
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    read: anyone,
    update: anyone,
    delete: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "superadmin")
    },
  },
  admin: {
    defaultColumns: ["email", "name", "status", "tenant"],
    useAsTitle: "email",
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "token",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Expired", value: "expired" },
      ],
    },
  ],
  timestamps: true,
}
