import type { CollectionConfig } from "payload"
import { isApproved } from "../access/roles"

export const Broadcasts: CollectionConfig = {
  slug: "broadcasts",
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any)?.role
      return isApproved(user) && (role === "admin" || role === "editor" || role === "superadmin")
    },
    update: () => false, // Sent communication logs should be immutable
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Only superadmin can delete logs for auditing/database maintenance
      return (user as any)?.role === "superadmin"
    },
  },
  admin: {
    defaultColumns: ["subject", "sender", "createdAt"],
    useAsTitle: "subject",
  },
  fields: [
    {
      name: "subject",
      type: "text",
      required: true,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
      admin: {
        description: "The HTML content of the broadcast email.",
      },
    },
    {
      name: "recipients",
      type: "json",
      required: true,
      admin: {
        description: "JSON array of resident email addresses who received this broadcast.",
      },
    },
    {
      name: "sender",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        description: "The user who drafted and sent this announcement.",
      },
    },
  ],
  timestamps: true,
}
