import type { CollectionConfig } from "payload"

export const TenantEmailQuotas: CollectionConfig = {
  slug: "tenant-email-quotas",
  admin: {
    useAsTitle: "tenant",
    defaultColumns: ["tenant", "monthlyEmailLimit", "emailsSentThisMonth"],
  },
  access: {
    // Read: allow superadmin or any user who belongs to the tenant
    read: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).role === "superadmin") return true

      const userTenants = (user as any).tenants?.map((t: any) => typeof t.tenant === "object" ? t.tenant.id : t.tenant) || []
      return {
        tenant: {
          in: userTenants,
        },
      }
    },
    // Only superadmin can create/update/delete
    create: ({ req: { user } }) => (user as any)?.role === "superadmin",
    update: ({ req: { user } }) => (user as any)?.role === "superadmin",
    delete: ({ req: { user } }) => (user as any)?.role === "superadmin",
  },
  fields: [
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      unique: true,
      required: true,
      admin: {
        description: "The tenant associated with this email quota.",
      },
    },
    {
      name: "monthlyEmailLimit",
      type: "number",
      defaultValue: 500,
      required: true,
      admin: {
        description: "Monthly limit of emails this tenant can send (Super Admin only).",
      },
    },
    {
      name: "emailsSentThisMonth",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        description: "Number of emails sent by this tenant during the current calendar month.",
      },
    },
    {
      name: "lastEmailResetMonth",
      type: "text",
      admin: {
        description: "Tracks the last reset month (YYYY-MM) for self-healing counter reset.",
      },
    },
  ],
}
