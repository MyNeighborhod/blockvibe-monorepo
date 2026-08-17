import type { CollectionConfig } from "payload"
import crypto from "crypto"
import {
  sendBusinessDirectoryApprovalEmail,
} from "@/directory/crmBootstrap"

export const Businesses: CollectionConfig = {
  slug: "businesses",
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        const justApproved = Boolean(doc.appearOnNOG) && !previousDoc?.appearOnNOG

        if (!doc.appearOnNOG || !doc.email) return

        try {
          const email = String(doc.email).trim().toLowerCase()
          const tenantId =
            typeof doc.tenant === "object" && doc.tenant !== null ? doc.tenant.id : doc.tenant
          if (!tenantId) return

          const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId

          const existingUsers = await req.payload.find({
            collection: "users",
            where: { email: { equals: email } },
            limit: 1,
          })

          if (existingUsers.docs.length > 0) {
            const existingUser = existingUsers.docs[0]
            const tenants = existingUser.tenants || []
            const hasTenant = tenants.some((t: any) => {
              const tId = typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant
              return tId === numericTenantId
            })
            const updatedTenants = hasTenant ? tenants : [...tenants, { tenant: numericTenantId }]

            await req.payload.update({
              collection: "users",
              id: existingUser.id,
              data: {
                status: "approved",
                memberType: "business",
                tenants: updatedTenants,
              },
              overrideAccess: true,
            })
          } else {
            const randomPassword = crypto.randomBytes(16).toString("hex")
            await req.payload.create({
              collection: "users",
              data: {
                email,
                name: doc.name || "Business Owner",
                role: "contributor",
                status: "approved",
                password: randomPassword,
                memberType: "business",
                tenants: [{ tenant: numericTenantId }],
              },
              overrideAccess: true,
            })
          }

          if (justApproved) {
            const tenantDoc =
              typeof doc.tenant === "object" && doc.tenant !== null
                ? doc.tenant
                : await req.payload.findByID({
                    collection: "tenants",
                    id: numericTenantId,
                  })

            await sendBusinessDirectoryApprovalEmail(req.payload, {
              tenant: tenantDoc,
              businessName: doc.name || "Your business",
              email,
            })
          }
        } catch (err) {
          console.error("Failed to sync approved business to CRM users:", err)
        }
      },
    ],
  },
  access: {
    read: () => true,
    create: () => true, // Anyone can submit their business (when directory enabled)
    update: ({ req: { user } }) => {
      const isStaff = user?.role === "superadmin" || user?.role === "admin" || user?.role === "editor"
      return Boolean(isStaff)
    },
    delete: ({ req: { user } }) => {
      const isStaff = user?.role === "superadmin" || user?.role === "admin" || user?.role === "editor"
      return Boolean(isStaff)
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "website", "appearOnNOG"],
    description:
      "Local business listings for the public directory. Visibility is controlled by Appear in Directory.",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: false,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Hero / cover photo shown on directory cards and the detail view (Avenues-style).",
      },
    },
    {
      name: "address",
      type: "text",
      required: false,
    },
    {
      name: "phone",
      type: "text",
      required: false,
    },
    {
      name: "website",
      type: "text",
      required: false,
    },
    {
      name: "email",
      type: "email",
      required: false,
    },
    {
      name: "hours",
      type: "text",
      required: false,
    },
    {
      name: "about",
      type: "textarea",
      required: false,
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "business-categories",
      hasMany: true,
      admin: {
        description: "Used for public directory filter pills.",
      },
    },
    {
      name: "facebook",
      type: "text",
      required: false,
      admin: {
        description: "Full URL or page handle.",
      },
    },
    {
      name: "instagram",
      type: "text",
      required: false,
      admin: {
        description: "Full URL or @handle.",
      },
    },
    {
      name: "customAttributes",
      type: "json",
      admin: {
        description:
          "Values for custom Directory Fields (key → value). Prefer editing via the dashboard when possible.",
      },
    },
    {
      name: "appearOnNOG",
      type: "checkbox",
      defaultValue: false,
      label: "Appear in Directory",
      admin: {
        description:
          "When checked, this business is shown on the public directory (after Directory feature is enabled for the tenant).",
        position: "sidebar",
      },
    },
  ],
}
