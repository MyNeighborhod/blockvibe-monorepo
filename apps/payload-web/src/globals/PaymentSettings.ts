import type { GlobalConfig } from "payload"
import { isSuperAdmin, isApproved } from "../access/roles"

export const PaymentSettings: GlobalConfig = {
  slug: "payment-settings",
  label: "Payment Settings",
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user) || ((user as any)?.role === "admin" && isApproved(user))
    },
  },
  fields: [
    {
      name: "paypalClientId",
      type: "text",
      label: "PayPal Client ID",
      admin: {
        description: "Client ID from PayPal Developer Portal.",
      },
    },
    {
      name: "paypalClientSecret",
      type: "text",
      label: "PayPal Client Secret",
      admin: {
        description: "Client Secret from PayPal Developer Portal.",
      },
    },
    {
      name: "paypalEnvironment",
      type: "select",
      defaultValue: "mock",
      options: [
        { label: "Mock Fake Server (Local Testing)", value: "mock" },
        { label: "Sandbox (Testing)", value: "sandbox" },
        { label: "Live (Production)", value: "live" },
      ],
      admin: {
        description: "PayPal API environment endpoint.",
      },
    },
    {
      name: "personalDuesFrequency",
      type: "select",
      defaultValue: "annual",
      options: [
        { label: "Annual Dues", value: "annual" },
        { label: "Monthly Dues", value: "monthly" },
      ],
      label: "Personal Member Charge Frequency",
    },
    {
      name: "individualDuesAmount",
      type: "number",
      defaultValue: 10,
      label: "Individual Member Dues Amount ($)",
    },
    {
      name: "householdDuesAmount",
      type: "number",
      defaultValue: 20,
      label: "Household Member Dues Amount ($)",
    },
    {
      name: "businessTiers",
      type: "array",
      label: "Named Business Membership Tiers",
      labels: {
        singular: "Business Tier",
        plural: "Business Tiers",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Tier Name",
        },
        {
          name: "slug",
          type: "text",
          required: true,
          label: "Tier Slug Identifier",
        },
        {
          name: "description",
          type: "textarea",
          label: "Tier Description & Sponsorship Benefits",
        },
        {
          name: "amount",
          type: "number",
          required: true,
          label: "Dues / Sponsorship Amount ($)",
        },
        {
          name: "frequency",
          type: "select",
          defaultValue: "yearly",
          options: [
            { label: "Yearly", value: "yearly" },
            { label: "Monthly", value: "monthly" },
            { label: "One-Time", value: "one_time" },
          ],
          label: "Charge Frequency",
        },
        {
          name: "active",
          type: "checkbox",
          defaultValue: true,
          label: "Active (Available on Signup)",
        },
      ],
    },
    {
      name: "enablePayPal",
      type: "checkbox",
      defaultValue: true,
      label: "Enable PayPal Payments",
    },
    {
      name: "enableCheckPayment",
      type: "checkbox",
      defaultValue: true,
      label: "Enable Check / Offline Payments",
    },
  ],
}
