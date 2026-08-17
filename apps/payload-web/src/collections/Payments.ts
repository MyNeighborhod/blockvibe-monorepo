import type { CollectionConfig } from "payload"
import { isSuperAdmin, isApproved } from "../access/roles"

export const Payments: CollectionConfig = {
  slug: "payments",
  admin: {
    useAsTitle: "paymentId",
    defaultColumns: ["user", "paymentId", "accountId", "provider", "amount", "status", "paidAt"],
    description: "Payment transaction ledger for auto and manual payments.",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user)) return true
      if (isApproved(user)) {
        if ((user as any)?.role === "admin" || (user as any)?.role === "editor") return true
        return {
          user: {
            equals: user.id,
          },
        } as any
      }
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return true // Allow API/PaymentService
      return isSuperAdmin(user) || isApproved(user)
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user) || ((user as any)?.role === "admin" && isApproved(user))
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user) || ((user as any)?.role === "admin" && isApproved(user))
    },
  },
  fields: [
    {
      name: "paymentId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "ULID transaction identifier.",
      },
    },
    {
      name: "accountId",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "ULID account identifier matching User/Membership record.",
      },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "provider",
      type: "select",
      defaultValue: "paypal",
      options: [
        { label: "PayPal", value: "paypal" },
        { label: "Paper Check", value: "check" },
        { label: "Cash", value: "cash" },
        { label: "Manual Adjustment", value: "manual" },
        { label: "Other", value: "other" },
      ],
      required: true,
    },
    {
      name: "providerTransactionId",
      type: "text",
      admin: {
        description: "PayPal Order/Capture ID, or paper Check Number.",
      },
    },
    {
      name: "amount",
      type: "number",
      required: true,
      admin: {
        description: "Transaction amount in USD.",
      },
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "USD",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "completed",
      options: [
        { label: "Completed", value: "completed" },
        { label: "Pending", value: "pending" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ],
      required: true,
    },
    {
      name: "paidAt",
      type: "date",
      required: true,
    },
    {
      name: "notes",
      type: "textarea",
      admin: {
        description: "Optional notes (e.g. check details, bank memo, manual override reason).",
      },
    },
    {
      name: "recordedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        description: "Admin user who recorded manual check/cash payment.",
      },
    },
  ],
  timestamps: true,
}
