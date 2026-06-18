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
    update: () => false,
    delete: ({ req: { user } }) => {
      if (!user) return false
      return (user as any)?.role === "superadmin"
    },
  },
  admin: {
    defaultColumns: ["subject", "delivery", "status", "sentCount", "failedCount", "createdAt"],
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
        description: "JSON array of resident email addresses targeted by this broadcast.",
      },
    },
    {
      name: "delivery",
      type: "select",
      required: true,
      defaultValue: "ses",
      options: [
        { label: "Platform SES", value: "ses" },
        { label: "Neighborhood Gmail", value: "gmail" },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "queued",
      options: [
        { label: "Queued", value: "queued" },
        { label: "Processing", value: "processing" },
        { label: "Completed", value: "completed" },
        { label: "Partially failed", value: "partial" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        description: "Delivery progress for this broadcast.",
      },
    },
    {
      name: "sentCount",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        description: "Number of emails delivered successfully.",
      },
    },
    {
      name: "failedCount",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        description: "Number of emails that failed to send.",
      },
    },
    {
      name: "failedEmails",
      type: "json",
      defaultValue: [],
      admin: {
        description: "JSON array of recipient addresses that failed delivery.",
      },
    },
    {
      name: "jobId",
      type: "text",
      admin: {
        description: "Email worker job id (async sends).",
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
