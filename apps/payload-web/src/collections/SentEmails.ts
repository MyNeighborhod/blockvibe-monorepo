import type { CollectionConfig } from "payload"
import { isSuperAdmin, isApproved } from "../access/roles"

export const SentEmails: CollectionConfig = {
  slug: "sent_emails",
  labels: {
    singular: "Sent Email",
    plural: "Sent Emails",
  },
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["emailId", "date", "to", "subject", "isTransactional", "tenant", "s3Uri"],
    description: "Audit log of all sent emails with S3 bucket archives.",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user)) return true
      if (isApproved(user)) {
        if ((user as any)?.role === "admin" || (user as any)?.role === "editor") return true
      }
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return true // Allow internal email archiving service
      return isSuperAdmin(user) || isApproved(user)
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user)
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user)
    },
  },
  fields: [
    {
      name: "emailId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "ULID identifier for the sent email.",
      },
    },
    {
      name: "date",
      type: "date",
      required: true,
      index: true,
      admin: {
        description: "Timestamp when email was sent.",
      },
    },
    {
      name: "to",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "Recipient email address.",
      },
    },
    {
      name: "subject",
      type: "text",
      required: true,
      admin: {
        description: "Email subject line.",
      },
    },
    {
      name: "isTransactional",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "True for transactional emails (receipts/alerts), false for broadcasts/newsletters.",
      },
    },
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      admin: {
        description: "Associated tenant.",
      },
    },
    {
      name: "s3Uri",
      type: "text",
      required: true,
      admin: {
        description: "S3 URI path to the stored email.json archive (e.g. s3://outgoing_emails_prod/nog/2026-08-05/2026-08-05T07-29-05_01KZ.../email.json).",
      },
    },
  ],
  timestamps: true,
}
