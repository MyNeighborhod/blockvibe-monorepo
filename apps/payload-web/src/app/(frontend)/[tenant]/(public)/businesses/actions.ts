"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import crypto from "crypto"
import { z } from "zod"
import {
  DEFAULT_DIRECTORY_FIELD_CONFIG,
  isFieldEnabled,
  resolveFieldConfig,
  type DirectoryCoreFieldKey,
} from "@/directory/constants"

export async function getDirectoryBootstrapAction(tenantId: string | number) {
  try {
    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    const payload = await getPayload({ config: configPromise })

    const tenant = await payload.findByID({
      collection: "tenants",
      id: numericTenantId,
    })

    if (!tenant || !(tenant as any).enableBusinessDirectory) {
      return {
        success: true,
        enabled: false,
        businesses: [],
        categories: [],
        customFields: [],
        directorySettings: null,
      }
    }

    const [businesses, categories, customFields] = await Promise.all([
      payload.find({
        collection: "businesses",
        where: {
          and: [
            { tenant: { equals: numericTenantId } },
            { appearOnNOG: { equals: true } },
          ],
        },
        sort: "name",
        limit: 500,
        depth: 1,
      }),
      payload.find({
        collection: "business-categories",
        where: { tenant: { equals: numericTenantId } },
        sort: "sortOrder",
        limit: 100,
        depth: 0,
      }),
      payload.find({
        collection: "directory-fields",
        where: { tenant: { equals: numericTenantId } },
        sort: "label",
        limit: 100,
        depth: 0,
      }),
    ])

    return {
      success: true,
      enabled: true,
      businesses: businesses.docs,
      categories: categories.docs,
      customFields: customFields.docs,
      directorySettings: (tenant as any).directorySettings || {
        pageTitle: "Businesses",
        pageIntro: "",
        allowPublicRegistration: true,
        showInNav: true,
        fieldConfig: DEFAULT_DIRECTORY_FIELD_CONFIG,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to load directory.",
      enabled: false,
      businesses: [],
      categories: [],
      customFields: [],
      directorySettings: null,
    }
  }
}

/** @deprecated Prefer getDirectoryBootstrapAction */
export async function getBusinessesAction(tenantId: string | number, approvedOnly = true) {
  try {
    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    const payload = await getPayload({ config: configPromise })

    const whereCondition: any = {
      tenant: { equals: numericTenantId },
    }

    if (approvedOnly) {
      whereCondition.appearOnNOG = { equals: true }
    }

    const result = await payload.find({
      collection: "businesses",
      where: whereCondition,
      limit: 1000,
      depth: 1,
    })

    return {
      success: true,
      businesses: result.docs,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to retrieve businesses.",
    }
  }
}

function sanitizeInput(str: string): string {
  if (typeof str !== "string") return ""
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<[^>]*>?/gm, "")
    .trim()
}

const registerBusinessSchema = z.object({
  name: z
    .string()
    .transform(sanitizeInput)
    .pipe(z.string().min(2).max(120)),
  address: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(250)),
  website: z
    .string()
    .optional()
    .transform((val) => sanitizeInput(val || ""))
    .transform((val) => {
      if (!val) return ""
      return val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`
    })
    .pipe(z.string().max(250)),
  about: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(1500)),
  email: z
    .string()
    .optional()
    .transform((v) => sanitizeInput(v || "").toLowerCase())
    .pipe(z.string().max(250)),
  phone: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(40)),
  hours: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(150)),
  facebook: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(250)),
  instagram: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(250)),
  categoryIds: z.array(z.union([z.string(), z.number()])).optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
  logoName: z.string().optional().transform((val) => sanitizeInput(val || "logo.png")),
  logoMime: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim().toLowerCase() : "image/png"))
    .pipe(
      z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"], {
        message: "Invalid image format. Allowed formats: PNG, JPG, WEBP, GIF.",
      }),
    ),
  coverName: z.string().optional().transform((val) => sanitizeInput(val || "cover.png")),
  coverMime: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim().toLowerCase() : "image/png")),
})

async function createMediaFromBase64(
  payload: any,
  numericTenantId: number,
  opts: { alt: string; base64: string; name: string; mime: string },
) {
  const base64Data = (opts.base64 || "").replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  if (buffer.length === 0 || buffer.length > MAX_FILE_SIZE) {
    throw new Error(`${opts.alt} is required and file size must not exceed 5MB.`)
  }

  return payload.create({
    collection: "media",
    data: {
      alt: opts.alt,
      tenant: numericTenantId,
    },
    file: {
      name: opts.name,
      data: buffer,
      mimetype: opts.mime,
      size: buffer.length,
    },
  })
}

export async function registerBusinessAction(
  tenantId: string | number,
  data: {
    name: string
    address?: string
    website?: string
    about?: string
    email?: string
    phone?: string
    hours?: string
    facebook?: string
    instagram?: string
    categoryIds?: (string | number)[]
    customAttributes?: Record<string, any>
    logoBase64?: string
    logoName?: string
    logoMime?: string
    coverBase64?: string
    coverName?: string
    coverMime?: string
    recaptchaToken?: string
  },
) {
  try {
    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    const payload = await getPayload({ config: configPromise })

    if (process.env.RECAPTCHA_SECRET_KEY) {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY
      if (!data.recaptchaToken) {
        throw new Error("reCAPTCHA verification is required.")
      }
      try {
        const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: secretKey,
            response: data.recaptchaToken,
          }),
        })
        const captchaData = await verifyRes.json()
        if (!captchaData.success) {
          throw new Error("reCAPTCHA verification failed. Please try again.")
        }
      } catch (err: any) {
        if (err.message?.includes("reCAPTCHA")) throw err
        throw new Error("Unable to verify reCAPTCHA. Please try again.")
      }
    }

    const tenant = await payload.findByID({
      collection: "tenants",
      id: numericTenantId,
    })

    if (!(tenant as any)?.enableBusinessDirectory) {
      throw new Error("Business directory is not enabled for this neighborhood.")
    }

    const settings = (tenant as any).directorySettings || {}
    if (settings.allowPublicRegistration === false) {
      throw new Error("Public business registration is disabled.")
    }

    const fieldMap = resolveFieldConfig(settings.fieldConfig)
    const requireField = (key: DirectoryCoreFieldKey) =>
      isFieldEnabled(fieldMap, key) && fieldMap.get(key)?.required && fieldMap.get(key)?.showInRegistration !== false

    const parseResult = registerBusinessSchema.safeParse(data)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new Error(firstIssue?.message || "Invalid registration input.")
    }

    const parsed = parseResult.data

    if (requireField("name") && !parsed.name) throw new Error("Business name is required.")
    if (requireField("address") && !parsed.address) throw new Error("Address is required.")
    if (requireField("website") && !parsed.website) throw new Error("Website is required.")
    if (requireField("about") && (!parsed.about || parsed.about.length < 10)) {
      throw new Error("About description must be at least 10 characters.")
    }
    if (requireField("email") && !parsed.email) throw new Error("Email is required.")
    if (parsed.email && !z.string().email().safeParse(parsed.email).success) {
      throw new Error("Please enter a valid email address.")
    }
    if (requireField("phone") && !parsed.phone) throw new Error("Phone is required.")
    if (requireField("logo") && !data.logoBase64) throw new Error("Logo is required.")
    if (requireField("coverImage") && !data.coverBase64) throw new Error("Cover image is required.")

    let logoId: string | number | undefined
    if (data.logoBase64) {
      const mediaDoc = await createMediaFromBase64(payload, numericTenantId, {
        alt: `${parsed.name} Logo`,
        base64: data.logoBase64,
        name: parsed.logoName,
        mime: parsed.logoMime,
      })
      logoId = mediaDoc.id
    }

    let coverId: string | number | undefined
    if (data.coverBase64) {
      const coverMime = (data.coverMime || "image/png").toLowerCase()
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(coverMime)) {
        throw new Error("Invalid cover image format.")
      }
      const mediaDoc = await createMediaFromBase64(payload, numericTenantId, {
        alt: `${parsed.name} Cover`,
        base64: data.coverBase64,
        name: parsed.coverName,
        mime: coverMime,
      })
      coverId = mediaDoc.id
    }

    const businessDoc = await payload.create({
      collection: "businesses",
      data: {
        name: parsed.name,
        address: parsed.address || undefined,
        website: parsed.website || undefined,
        about: parsed.about || undefined,
        email: parsed.email || undefined,
        phone: parsed.phone || undefined,
        hours: parsed.hours || undefined,
        facebook: parsed.facebook || undefined,
        instagram: parsed.instagram || undefined,
        categories: (parsed.categoryIds || []).map((id) =>
          typeof id === "string" ? parseInt(id, 10) : id,
        ),
        customAttributes: parsed.customAttributes || {},
        logo: logoId as number | undefined,
        coverImage: coverId as number | undefined,
        appearOnNOG: false,
        tenant: numericTenantId,
      },
    })

    if (parsed.email) {
      const existingUsers = await payload.find({
        collection: "users",
        where: { email: { equals: parsed.email } },
        limit: 1,
      })

      if (existingUsers.docs.length > 0) {
        const existingUser = existingUsers.docs[0]
        const tenants = existingUser.tenants || []
        const hasTenant = tenants.some((t: any) => {
          const tId = typeof t.tenant === "object" ? t.tenant.id : t.tenant
          return tId === numericTenantId
        })
        const updatedTenants = hasTenant ? tenants : [...tenants, { tenant: numericTenantId }]

        await payload.update({
          collection: "users",
          id: existingUser.id,
          data: {
            memberType: "business",
            tenants: updatedTenants,
          },
        })
      } else {
        const randomPassword = crypto.randomBytes(16).toString("hex")
        await payload.create({
          collection: "users",
          data: {
            email: parsed.email,
            name: parsed.name,
            role: "contributor",
            status: "approved",
            password: randomPassword,
            memberType: "business",
            tenants: [{ tenant: numericTenantId }],
          },
        })
      }
    }

    return {
      success: true,
      business: businessDoc,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to register business.",
    }
  }
}
