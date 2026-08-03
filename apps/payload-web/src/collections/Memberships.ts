import type { CollectionConfig } from "payload"
import { isSuperAdmin, isApproved } from "../access/roles"

export const Memberships: CollectionConfig = {
  slug: "memberships",
  admin: {
    useAsTitle: "accountId",
    defaultColumns: ["accountId", "tier", "status", "isAnnualPayingMember", "validUntil"],
    description: "Community member subscription and annual dues status tracking.",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user)) return true
      if (isApproved(user)) {
        if ((user as any)?.role === "admin" || (user as any)?.role === "editor") return true
        // Regular user reads their own
        return {
          user: {
            equals: user.id,
          },
        } as any
      }
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return true // Allow API/signup handler
      return isSuperAdmin(user) || isApproved(user)
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user) || ((user as any)?.role === "admin" && isApproved(user))
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user)
    },
  },
  fields: [
    {
      name: "accountId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "ULID account identifier matching User record.",
      },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        description: "Associated User account.",
      },
    },
    {
      name: "tier",
      type: "select",
      defaultValue: "individual",
      options: [
        { label: "Individual ($100/yr)", value: "individual" },
        { label: "Household ($150/yr)", value: "household" },
      ],
      required: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Active", value: "active" },
        { label: "Pending Payment", value: "pending" },
        { label: "Expired", value: "expired" },
      ],
      required: true,
    },
    {
      name: "isAnnualPayingMember",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Set to true when dues threshold ($X/yr) is met.",
      },
    },
    {
      name: "totalPaidCurrentYear",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Total dues amount paid within the last 365 days.",
      },
    },
    {
      name: "validUntil",
      type: "date",
      admin: {
        description: "Expiration date for annual membership.",
      },
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "address",
      type: "text",
    },
  ],
  timestamps: true,
}
