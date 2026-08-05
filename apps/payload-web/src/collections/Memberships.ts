import type { CollectionConfig } from "payload"
import { isSuperAdmin, isApproved } from "../access/roles"

export const Memberships: CollectionConfig = {
  slug: "memberships",
  admin: {
    useAsTitle: "accountId",
    defaultColumns: ["user", "accountId", "memberCategory", "tier", "businessTierSlug", "status", "isAnnualPayingMember", "validUntil"],
    description: "Community member subscription and dues status tracking.",
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
      name: "memberCategory",
      type: "select",
      defaultValue: "residential",
      options: [
        { label: "Residential / Personal Member", value: "residential" },
        { label: "Business Member / Sponsor", value: "business" },
      ],
      required: true,
    },
    {
      name: "tier",
      type: "select",
      defaultValue: "individual",
      options: [
        { label: "Individual", value: "individual" },
        { label: "Household", value: "household" },
        { label: "Business Tier", value: "business" },
      ],
      required: true,
    },
    {
      name: "businessTierSlug",
      type: "text",
      label: "Business Tier Slug",
      admin: {
        description: "Slug of selected business tier (e.g. bronze, sponsor, gold).",
      },
    },
    {
      name: "recurringFrequency",
      type: "select",
      defaultValue: "annual",
      options: [
        { label: "Annual / Yearly", value: "annual" },
        { label: "Monthly", value: "monthly" },
        { label: "One-Time", value: "one_time" },
      ],
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
        description: "Set to true when required dues threshold is met.",
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
        description: "Expiration date for membership status.",
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
    {
      name: "street",
      type: "text",
    },
    {
      name: "city",
      type: "text",
    },
    {
      name: "state",
      type: "text",
    },
    {
      name: "zipCode",
      type: "text",
    },
  ],
  timestamps: true,
}
