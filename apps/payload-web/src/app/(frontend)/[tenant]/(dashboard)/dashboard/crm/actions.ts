"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { headers } from "next/headers"
import crypto from "crypto"
import { getMeUser } from "@/utilities/getMeUser"
import { getUserTenantIds } from "@/access/roles"
import { evaluateMailingList, compileRulesToQuery } from "@/utilities/crmEvaluator"


export async function sendInviteAction(name: string, email: string, tenantId: string | number) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Resolve or initialize the tenant's email quota
    const quotas = await payload.find({
      collection: "tenant-email-quotas",
      where: {
        tenant: { equals: tenantId },
      },
      limit: 1,
    })

    let quota = quotas.docs[0]
    if (!quota) {
      quota = await payload.create({
        collection: "tenant-email-quotas",
        data: {
          tenant: typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId,
          monthlyEmailLimit: 500,
          emailsSentThisMonth: 0,
          lastEmailResetMonth: new Date().toISOString().slice(0, 7),
        },
      })
    }

    const currentMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
    let sent = quota.emailsSentThisMonth ?? 0
    const limit = quota.monthlyEmailLimit ?? 500

    if (quota.lastEmailResetMonth !== currentMonth) {
      sent = 0
      quota = await payload.update({
        collection: "tenant-email-quotas",
        id: quota.id,
        data: {
          emailsSentThisMonth: 0,
          lastEmailResetMonth: currentMonth,
        },
      })
    }

    if (sent >= limit) {
      throw new Error(
        `This neighborhood has reached its monthly email limit (${sent}/${limit}). Please contact a superadmin to increase the limit.`,
      )
    }

    // Check if user already exists
    const existingUsers = await payload.find({
      collection: "users",
      where: {
        email: { equals: email },
      },
      limit: 1,
    })

    if (existingUsers.totalDocs > 0) {
      throw new Error("A user with this email address already exists.")
    }

    // Check if a pending invite already exists
    const existingInvites = await payload.find({
      collection: "invites",
      where: {
        and: [{ email: { equals: email } }, { status: { equals: "pending" } }],
      },
      limit: 1,
    })

    if (existingInvites.totalDocs > 0) {
      throw new Error("A pending invitation has already been sent to this email.")
    }

    // Generate secure token
    const token = crypto.randomUUID()

    // Create Invite
    const inviteRecord = await payload.create({
      collection: "invites",
      data: {
        name,
        email,
        token,
        tenant: typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId,
        status: "pending",
      },
    })

    // Construct registration URL
    const reqHeaders = await headers()
    const host = reqHeaders.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const inviteUrl = `${protocol}://${host}/invite?token=${token}`

    // Send Email via Payload's transport configuration (invite record already created)
    try {
      await payload.sendEmail({
        to: email,
        subject: `Invitation to join ${host}`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to the Neighborhood Portal!</h2>
          <p style="color: #334155; font-size: 16px; line-height: 24px;">Hello ${name},</p>
          <p style="color: #334155; font-size: 16px; line-height: 24px;">You have been invited to join the neighborhood community platform. Click the button below to accept your invitation and set your password:</p>
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 500; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:<br/><a href="${inviteUrl}">${inviteUrl}</a></p>
        </div>
      `,
      })

      // Increment tenant sent count in the quota record
      await payload.update({
        collection: "tenant-email-quotas",
        id: quota.id,
        data: {
          emailsSentThisMonth: sent + 1,
        },
      })
    } catch (emailError: any) {
      payload.logger.error(
        { err: emailError },
        `Invite created for ${email} but email delivery failed. Deleting invite record ${inviteRecord.id}`,
      )
      // Delete invite record to allow retrying
      try {
        await payload.delete({
          collection: "invites",
          id: inviteRecord.id,
        })
      } catch (deleteError) {
        payload.logger.error(
          { err: deleteError },
          `Failed to delete failed invite record ${inviteRecord.id}`,
        )
      }
      throw new Error(`Email delivery failed: ${emailError.message || emailError}`)
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send invitation." }
  }
}

export async function getResidentsAction(
  tenantId: string | number,
  search?: string,
  type?: string,
  limit: number = 10,
  page: number = 1
) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized access to tenant directory.")
    }

    const payload = await getPayload({ config: configPromise })

    const whereQuery: any = {
      "tenants.tenant": {
        equals: numericTenantId,
      },
    }

    if (type && type !== "all") {
      whereQuery.memberType = {
        equals: type,
      }
    }

    if (search) {
      whereQuery.or = [
        { name: { contains: search } },
        { email: { contains: search } },
        { household: { contains: search } },
      ]
    }

    const result = await payload.find({
      collection: "users",
      where: whereQuery,
      limit,
      page,
      sort: "name",
    })

    return {
      success: true,
      docs: result.docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        role: doc.role,
        status: doc.status,
        isNeighbor: (doc as any).isNeighbor,
        household: (doc as any).household,
        memberType: (doc as any).memberType || "residential",
        customAttributes: (doc as any).customAttributes,
        unsubscribed: doc.unsubscribed,
      })),
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch residents." }
  }
}

export async function updateResidentAction(
  userId: string | number,
  tenantId: string | number,
  data: {
    name?: string
    memberType?: "residential" | "business" | "other"
    household?: string
    customAttributes?: any
  }
) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })

    // Check if target user belongs to this tenant
    const targetUser = await payload.findByID({
      collection: "users",
      id: userId,
    })

    const targetUserTenantIds = targetUser.tenants?.map((t: any) =>
      typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant
    ) || []

    if (!targetUserTenantIds.includes(numericTenantId)) {
      throw new Error("User does not belong to this neighborhood.")
    }

    const updated = await payload.update({
      collection: "users",
      id: userId,
      data: {
        name: data.name,
        memberType: data.memberType,
        household: data.household,
        customAttributes: data.customAttributes,
      },
    })

    return { success: true, user: updated }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update resident." }
  }
}

export async function getMailingListsAction(tenantId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: "mailing-lists",
      where: {
        tenant: { equals: numericTenantId },
      },
      limit: 100,
      depth: 1,
    })

    return { success: true, docs: result.docs }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch mailing lists." }
  }
}

export async function saveMailingListAction(
  tenantId: string | number,
  listData: {
    id?: string | number
    name: string
    description?: string
    type: "static" | "dynamic"
    members?: (string | number)[]
    rules?: any
  }
) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })

    const payloadData: any = {
      name: listData.name,
      description: listData.description,
      type: listData.type,
      tenant: numericTenantId,
    }

    if (listData.type === "static") {
      payloadData.members = listData.members || []
      payloadData.rules = null
    } else {
      payloadData.rules = listData.rules || []
      payloadData.members = []
    }

    let result
    if (listData.id) {
      result = await payload.update({
        collection: "mailing-lists",
        id: listData.id,
        data: payloadData,
      })
    } else {
      result = await payload.create({
        collection: "mailing-lists",
        data: payloadData,
      })
    }

    return { success: true, list: result }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save mailing list." }
  }
}

export async function deleteMailingListAction(tenantId: string | number, listId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    await payload.delete({
      collection: "mailing-lists",
      id: listId,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete mailing list." }
  }
}

export async function getCRMFieldsAction(tenantId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: "crm-fields",
      where: {
        tenant: { equals: numericTenantId },
      },
      limit: 100,
    })

    return { success: true, docs: result.docs }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch custom fields." }
  }
}

export async function saveCRMFieldAction(
  tenantId: string | number,
  fieldData: {
    id?: string | number
    label: string
    key: string
    fieldType: "text" | "number" | "checkbox" | "select"
    options?: { value: string }[]
  }
) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })

    const payloadData: any = {
      label: fieldData.label,
      key: fieldData.key,
      fieldType: fieldData.fieldType,
      tenant: numericTenantId,
    }

    if (fieldData.fieldType === "select") {
      payloadData.options = fieldData.options || []
    } else {
      payloadData.options = []
    }

    let result
    if (fieldData.id) {
      result = await payload.update({
        collection: "crm-fields",
        id: fieldData.id,
        data: payloadData,
      })
    } else {
      result = await payload.create({
        collection: "crm-fields",
        data: payloadData,
      })
    }

    return { success: true, field: result }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save custom field." }
  }
}

export async function deleteCRMFieldAction(tenantId: string | number, fieldId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    await payload.delete({
      collection: "crm-fields",
      id: fieldId,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete custom field." }
  }
}

export async function evaluateMailingListEmailsAction(tenantId: string | number, listId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const users = await evaluateMailingList(listId, numericTenantId)

    return {
      success: true,
      emails: users.map((u) => u.email),
      members: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        memberType: (u as any).memberType || "residential",
      })),
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to evaluate mailing list." }
  }
}

export async function evaluateRulesAction(tenantId: string | number, rules: any[]) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    const rulesQuery = compileRulesToQuery(rules)

    const finalQuery: any = {
      and: [
        {
          "tenants.tenant": { equals: numericTenantId },
        },
        {
          unsubscribed: { not_equals: true },
        },
        rulesQuery,
      ],
    }

    const usersResult = await payload.find({
      collection: "users",
      where: finalQuery,
      limit: 1000,
    })

    return {
      success: true,
      members: usersResult.docs.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        memberType: (u as any).memberType || "residential",
      })),
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to evaluate rules." }
  }
}

export async function getCRMBusinessesAction(tenantId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: "businesses",
      where: {
        tenant: { equals: numericTenantId },
      },
      limit: 1000,
      depth: 1,
    })

    return {
      success: true,
      businesses: result.docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        address: doc.address,
        website: doc.website,
        about: doc.about,
        hours: doc.hours || "",
        appearOnNOG: doc.appearOnNOG || false,
        logo: doc.logo,
      })),
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retrieve businesses for CRM." }
  }
}

export async function toggleBusinessNOGAction(
  tenantId: string | number,
  businessId: string | number,
  appear: boolean
) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.update({
      collection: "businesses",
      id: businessId,
      data: {
        appearOnNOG: appear,
      },
    })

    return {
      success: true,
      business: result,
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle NOG appearance." }
  }
}

export async function deleteCRMBusinessAction(tenantId: string | number, businessId: string | number) {
  try {
    const { user } = await getMeUser()
    if (!user) throw new Error("Unauthorized.")

    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId
    if (user.role !== "superadmin" && !getUserTenantIds(user).includes(numericTenantId)) {
      throw new Error("Unauthorized.")
    }

    const payload = await getPayload({ config: configPromise })
    
    const businessDoc = await payload.findByID({
      collection: "businesses",
      id: businessId,
    })

    if (businessDoc) {
      await payload.delete({
        collection: "businesses",
        id: businessId,
      })

      const logoId = typeof businessDoc.logo === "object" && businessDoc.logo !== null ? businessDoc.logo.id : businessDoc.logo
      if (logoId) {
        await payload.delete({
          collection: "media",
          id: logoId,
        })
      }
    }

    return {
      success: true,
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete business." }
  }
}

