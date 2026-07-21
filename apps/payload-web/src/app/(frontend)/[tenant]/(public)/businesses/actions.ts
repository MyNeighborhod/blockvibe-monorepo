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

    // 1. Create Media document for Logo
    // Decode base64 image data (remove data prefix if present)
    const base64Data = data.logoBase64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    
    const mediaDoc = await payload.create({
      collection: "media",
      data: {
        alt: `${data.name} Logo`,
        tenant: numericTenantId,
      },
      file: {
        name: data.logoName,
        data: buffer,
        mimetype: data.logoMime,
        size: buffer.length,
      },
    })

    if (!mediaDoc.id) {
      throw new Error("Failed to create media logo document.")
    }

    // 2. Create Business record
    const businessDoc = await payload.create({
      collection: "businesses",
      data: {
        name: data.name,
        address: data.address,
        website: data.website,
        about: data.about,
        email: data.email,
        hours: data.hours || "",
        logo: mediaDoc.id,
        appearOnNOG: false,
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
