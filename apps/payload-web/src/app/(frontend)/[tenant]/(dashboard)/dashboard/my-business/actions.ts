"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { getMeUser } from "@/utilities/getMeUser"
import { z } from "zod"

function sanitizeInput(str: string): string {
  if (typeof str !== "string") return ""
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<[^>]*>?/gm, "")
    .trim()
}

const updateBusinessSchema = z.object({
  name: z.string().transform(sanitizeInput).pipe(z.string().min(2).max(120)),
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
  phone: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(40)),
  hours: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(150)),
  facebook: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(250)),
  instagram: z.string().optional().transform((v) => sanitizeInput(v || "")).pipe(z.string().max(250)),
})

export async function getMyBusinessAction(tenantId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    const payload = await getPayload({ config: configPromise })

    const isStaff = user.role === "superadmin" || user.role === "admin" || user.role === "editor"

    const whereConditions: any[] = [
      { tenant: { equals: numericTenantId } },
      { email: { equals: user.email } },
    ]

    let result = await payload.find({
      collection: "businesses",
      where: {
        and: whereConditions,
      },
      limit: 1,
      depth: 2,
    })

    // If staff user and no business found by email, return latest business in tenant for admin convenience
    if (result.docs.length === 0 && isStaff) {
      result = await payload.find({
        collection: "businesses",
        where: { tenant: { equals: numericTenantId } },
        limit: 1,
        depth: 2,
      })
    }

    if (result.docs.length === 0) {
      return {
        success: true,
        business: null,
        message: "No registered business found for your account.",
      }
    }

    return {
      success: true,
      business: result.docs[0],
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to load business profile.",
    }
  }
}

export async function updateMyBusinessAction(
  tenantId: string | number,
  businessId: string | number,
  data: {
    name: string
    address?: string
    website?: string
    about?: string
    phone?: string
    hours?: string
    facebook?: string
    instagram?: string
    logoBase64?: string
    logoName?: string
    logoMime?: string
    coverBase64?: string
    coverName?: string
    coverMime?: string
  },
) {
  try {
    const { user } = await getMeUser()
    if (!user) {
      throw new Error("Unauthorized. Please log in.")
    }

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    const numericBusinessId = typeof businessId === "string" ? parseInt(businessId, 10) : businessId
    const payload = await getPayload({ config: configPromise })

    const businessDoc = await payload.findByID({
      collection: "businesses",
      id: numericBusinessId,
    })

    if (!businessDoc) {
      throw new Error("Business record not found.")
    }

    const isStaff = user.role === "superadmin" || user.role === "admin" || user.role === "editor"
    const isOwner = businessDoc.email?.toLowerCase() === user.email.toLowerCase()

    if (!isStaff && !isOwner) {
      throw new Error("You do not have permission to edit this business.")
    }

    const parseResult = updateBusinessSchema.safeParse(data)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new Error(firstIssue?.message || "Invalid update data.")
    }

    const parsed = parseResult.data

    let logoId: number | undefined
    if (data.logoBase64) {
      const base64Data = data.logoBase64.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      const media = await payload.create({
        collection: "media",
        data: {
          alt: `${parsed.name} Logo`,
          tenant: numericTenantId,
        },
        file: {
          name: data.logoName || "logo.png",
          data: buffer,
          mimetype: data.logoMime || "image/png",
          size: buffer.length,
        },
      })
      logoId = media.id
    }

    let coverId: number | undefined
    if (data.coverBase64) {
      const base64Data = data.coverBase64.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      const media = await payload.create({
        collection: "media",
        data: {
          alt: `${parsed.name} Cover`,
          tenant: numericTenantId,
        },
        file: {
          name: data.coverName || "cover.png",
          data: buffer,
          mimetype: data.coverMime || "image/png",
          size: buffer.length,
        },
      })
      coverId = media.id
    }

    const updatePayload: any = {
      name: parsed.name,
      address: parsed.address || undefined,
      website: parsed.website || undefined,
      about: parsed.about || undefined,
      phone: parsed.phone || undefined,
      hours: parsed.hours || undefined,
      facebook: parsed.facebook || undefined,
      instagram: parsed.instagram || undefined,
    }

    if (logoId) updatePayload.logo = logoId
    if (coverId) updatePayload.coverImage = coverId

    const updated = await payload.update({
      collection: "businesses",
      id: numericBusinessId,
      data: updatePayload,
    })

    return {
      success: true,
      message: "Business profile updated successfully!",
      business: updated,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to update business profile.",
    }
  }
}
