import type { CollectionConfig, PayloadRequest } from "payload"
import crypto from "crypto"
import { slugField } from "payload"
import {
  sendBusinessDirectoryApprovalEmail,
} from "@/directory/crmBootstrap"

function slugifyBusinessName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "business"
}

async function ensureUniqueBusinessSlug(
  req: PayloadRequest,
  baseSlug: string,
  tenantId: string | number,
  excludeId?: string | number,
): Promise<string> {
  let candidate = baseSlug
  for (let i = 0; i < 50; i++) {
    const where: any = {
      and: [{ tenant: { equals: tenantId } }, { slug: { equals: candidate } }],
    }
    if (excludeId != null) {
      where.and.push({ id: { not_equals: excludeId } })
    }
    const existing = await req.payload.find({
      collection: "businesses",
      where,
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length === 0) return candidate
    candidate = `${baseSlug}-${i + 2}`
  }
  return `${baseSlug}-${Date.now().toString(36)}`
}

export const Businesses: CollectionConfig = {
  slug: "businesses",
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (!data) return data
        const name = data.name || originalDoc?.name
        const tenantId =
          data.tenant ??
          (typeof originalDoc?.tenant === "object" && originalDoc?.tenant !== null
            ? originalDoc.tenant.id
            : originalDoc?.tenant)

        if (!name || tenantId == null) return data

        const currentSlug = (data.slug || originalDoc?.slug || "").trim()
        if (operation === "create" || !currentSlug) {
          const base = slugifyBusinessName(String(name))
          data.slug = await ensureUniqueBusinessSlug(
            req,
            base,
            tenantId,
            operation === "update" ? originalDoc?.id : undefined,
          )
        }
        return data
      },
    ],
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
    create: () => true,
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
    defaultColumns: ["name", "slug", "email", "appearOnNOG"],
    description:
      "Local business listings for the public directory. Visibility is controlled by Appear in Directory.",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    slugField({
      useAsSlug: "name",
      // Unique per tenant via beforeChange; not globally unique.
      disableUnique: true,
      required: false,
      overrides: (field) => {
        const slugText = field.fields.find(
          (f) => typeof f === "object" && f && "name" in f && f.name === "slug",
        ) as any
        if (slugText?.admin) {
          slugText.admin.description =
            "URL path under /businesses/[slug]. Auto-generated from name if empty."
        }
        return field
      },
    }),
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
        description: "Hero / cover photo shown on directory cards and the detail page.",
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
