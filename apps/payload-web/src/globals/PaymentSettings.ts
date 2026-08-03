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
      defaultValue: "sandbox",
      options: [
        { label: "Sandbox (Testing)", value: "sandbox" },
        { label: "Live (Production)", value: "live" },
      ],
      admin: {
        description: "PayPal API environment endpoint.",
      },
    },
    {
      name: "individualDuesAmount",
      type: "number",
      defaultValue: 10,
      label: "Individual Annual Dues ($)",
    },
    {
      name: "householdDuesAmount",
      type: "number",
      defaultValue: 20,
      label: "Household Annual Dues ($)",
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
