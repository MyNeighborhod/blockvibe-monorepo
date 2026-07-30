"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import crypto from "crypto"

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
      depth: 1, // Resolve logo relations so filename/URL is retrieved
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

import { z } from "zod"

/** Helper to sanitize text fields: strip HTML tags, remove control characters/null bytes, and trim whitespace */
function sanitizeInput(str: string): string {
  if (typeof str !== "string") return ""
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove ASCII control characters
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .trim()
}

/** Zod Schema for Backend Business Registration Validation & Sanitization */
const registerBusinessSchema = z.object({
  name: z
    .string()
    .transform(sanitizeInput)
    .pipe(
      z
        .string()
        .min(2, "Business name must be at least 2 characters.")
        .max(120, "Business name must be 120 characters or less.")
    ),
  address: z
    .string()
    .transform(sanitizeInput)
    .pipe(
      z
        .string()
        .min(5, "Address must be at least 5 characters.")
        .max(250, "Address must be 250 characters or less.")
    ),
  website: z
    .string()
    .transform(sanitizeInput)
    .transform((val) => (val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`))
    .pipe(
      z
        .string()
        .max(250, "Website URL must be 250 characters or less.")
        .url("Please enter a valid website URL.")
    ),
  about: z
    .string()
    .transform(sanitizeInput)
    .pipe(
      z
        .string()
        .min(10, "About description must be at least 10 characters.")
        .max(1500, "About description must be 1500 characters or less.")
    ),
  email: z
    .string()
    .transform(sanitizeInput)
    .pipe(
      z
        .string()
        .email("Please enter a valid email address.")
        .max(250, "Email must be 250 characters or less.")
    )
    .transform((val) => val.toLowerCase()),
  hours: z
    .string()
    .optional()
    .transform((val) => sanitizeInput(val || ""))
    .pipe(z.string().max(150, "Hours description must be 150 characters or less.")),
  logoName: z
    .string()
    .optional()
    .transform((val) => sanitizeInput(val || "logo.png")),
  logoMime: z
    .string()
    .transform((val) => (val || "image/png").toLowerCase())
    .pipe(
      z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"], {
        message: "Invalid image format. Allowed formats: PNG, JPG, WEBP, GIF.",
      })
    ),
})

export async function registerBusinessAction(
  tenantId: string | number,
  data: {
    name: string
    address: string
    website: string
    about: string
    email: string
    hours?: string
    logoBase64: string
    logoName: string
    logoMime: string
  }
) {
  try {
    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    const payload = await getPayload({ config: configPromise })

    // 1. Zod Backend Schema Validation & Sanitization
    const parseResult = registerBusinessSchema.safeParse(data)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new Error(firstIssue?.message || "Invalid registration input.")
    }

    const { name, address, website, about, email, hours, logoName, logoMime } = parseResult.data

    // Decode base64 image data (remove data prefix if present)
    const base64Data = (data.logoBase64 || "").replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Limit maximum logo upload size to 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (buffer.length === 0 || buffer.length > MAX_FILE_SIZE) {
      throw new Error("Logo image is required and file size must not exceed 5MB.")
    }

    // 2. Create Media document for Logo
    const mediaDoc = await payload.create({
      collection: "media",
      data: {
        alt: `${name} Logo`,
        tenant: numericTenantId,
      },
      file: {
        name: logoName,
        data: buffer,
        mimetype: logoMime,
        size: buffer.length,
      },
    })

    if (!mediaDoc.id) {
      throw new Error("Failed to create media logo document.")
    }

    // 3. Create Business record (hardcode appearOnNOG: false for admin vetting)
    const businessDoc = await payload.create({
      collection: "businesses",
      data: {
        name,
        address,
        website,
        about,
        email,
        hours,
        logo: mediaDoc.id,
        appearOnNOG: false, // Strict vetting guard: Unapproved business NEVER appears publicly
        tenant: numericTenantId,
      },
    })

    // 3. Ensure CRM user exists with memberType = "business"
    const existingUsers = await payload.find({
      collection: "users",
      where: {
        email: { equals: data.email },
      },
      limit: 1,
    })

    if (existingUsers.docs.length > 0) {
      const existingUser = existingUsers.docs[0]
      const tenants = existingUser.tenants || []
      const hasTenant = tenants.some((t: any) => {
        const tId = typeof t.tenant === "object" ? t.tenant.id : t.tenant
        return tId === numericTenantId
      })
      const updatedTenants = hasTenant
        ? tenants
        : [...tenants, { tenant: numericTenantId }]

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
          email: data.email,
          name: data.name,
          role: "contributor",
          status: "approved",
          password: randomPassword,
          memberType: "business",
          tenants: [{ tenant: numericTenantId }],
        },
      })
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
