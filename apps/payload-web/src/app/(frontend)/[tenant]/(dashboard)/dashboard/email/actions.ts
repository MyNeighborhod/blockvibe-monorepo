"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { headers } from "next/headers"
import { getMeUser } from "@/utilities/getMeUser"
import {
  resolveBroadcastImagesInHtml,
  uploadBroadcastImageFile,
} from "@/utilities/resolveBroadcastImages"
import { getUserTenantIds } from "@/access/roles"
import {
  dispatchBroadcastCampaign,
  getEmailEnqueueRole,
  shouldUseEmailService,
} from "@/utilities/emailServiceClient"
import {
  sendBroadcastEmailsInline,
  sendBroadcastEmailsViaGmail,
} from "@/utilities/sendBroadcastEmails"
import type { EmailDeliveryMethod } from "@/utilities/gmailOAuth"
import { mintBroadcastCompletionToken } from "@blockvibe/email-contracts"
import { finalizeBroadcastDeliveryLog } from "@/utilities/broadcastDelivery"
import { getEmailAccountForTenant, isEmailAccountConnected } from "@/utilities/emailSrvAccount"

const MAX_BROADCAST_IMAGE_BYTES = 5 * 1024 * 1024

export async function uploadBroadcastImageAction(formData: FormData) {
  try {
    const file = formData.get("file")
    const tenantIdRaw = formData.get("tenantId")
    if (!(file instanceof File) || typeof tenantIdRaw !== "string" || !tenantIdRaw) {
      return { success: false as const, error: "Missing image file or tenant." }
    }
    const tenantId = tenantIdRaw

    if (!file.type.startsWith("image/")) {
      return { success: false as const, error: "Only image files can be embedded." }
    }

    if (file.size > MAX_BROADCAST_IMAGE_BYTES) {
      return {
        success: false as const,
        error: "Image is too large. Please use a file under 5 MB.",
      }
    }

    const payload = await getPayload({ config: configPromise })
    const { user: senderUser } = await getMeUser()
    if (!senderUser) {
      return { success: false as const, error: "You must be logged in to upload images." }
    }

    const reqHeaders = await headers()
    const host = reqHeaders.get("host") || "localhost:3000"

    const tenantResult = await payload.findByID({
      collection: "tenants",
      id: parseInt(tenantId, 10),
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadBroadcastImageFile({
      payload,
      tenantId,
      tenantSlug: tenantResult.slug,
      host,
      user: senderUser,
      buffer,
      mime: file.type,
      originalName: file.name,
    })

    return { success: true as const, url }
  } catch (err: any) {
    return { success: false as const, error: err.message || "Failed to upload image." }
  }
}

export async function sendBroadcastAction(
  recipientEmails: string[],
  subject: string,
  message: string,
  tenantId: string | number,
  delivery: EmailDeliveryMethod = "ses",
) {
  try {
    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error("No recipients selected.")
    }
    if (!subject.trim()) {
      throw new Error("Subject is required.")
    }
    if (!message.trim()) {
      throw new Error("Message is required.")
    }

    const payload = await getPayload({ config: configPromise })

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

    const currentMonth = new Date().toISOString().slice(0, 7)
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

    if (sent + recipientEmails.length > limit) {
      throw new Error(
        `This neighborhood has insufficient monthly email quota (${sent}/${limit}) to send to ${recipientEmails.length} recipients.`,
      )
    }

    const reqHeaders = await headers()
    const host = reqHeaders.get("host") || "localhost:3000"

    const tenantResult = await payload.findByID({
      collection: "tenants",
      id: tenantId,
    })
    const tenantSlug = tenantResult.slug
    const numericTenantId = typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId

    const { user: senderUser } = await getMeUser()
    if (!senderUser) {
      throw new Error("You must be logged in to send a broadcast.")
    }

    const enqueueRole = getEmailEnqueueRole(senderUser as { role?: string | null })
    if (!enqueueRole) {
      throw new Error("Only neighborhood admins may send broadcasts.")
    }

    if (enqueueRole === "admin" && !getUserTenantIds(senderUser).includes(numericTenantId)) {
      throw new Error("You are not authorized to send broadcasts for this neighborhood.")
    }

    const resolvedMessage = await resolveBroadcastImagesInHtml(message, {
      payload,
      tenantId,
      tenantSlug,
      host,
      user: senderUser,
    })

    const activeUsers = await payload.find({
      collection: "users",
      where: {
        email: { in: recipientEmails },
        unsubscribed: { not_equals: true },
      },
      limit: 1000,
    })

    const activeEmails = activeUsers.docs.map((doc) => doc.email)
    if (activeEmails.length === 0) {
      throw new Error("No active (subscribed) recipients found in the selection.")
    }

    const useWorker = shouldUseEmailService()

    const broadcast = await payload.create({
      collection: "broadcasts",
      data: {
        subject,
        message: resolvedMessage,
        recipients: activeEmails,
        sender: senderUser.id,
        tenant: numericTenantId,
        delivery,
        status: useWorker ? "queued" : "processing",
        sentCount: 0,
        failedCount: 0,
        failedEmails: [],
      },
      user: senderUser,
    })

    const signedCompletionToken = mintBroadcastCompletionToken({
      broadcastId: broadcast.id,
      tenantId: numericTenantId,
    })

    const campaignBase = {
      subject,
      html: resolvedMessage,
      recipientEmails: activeEmails,
      host,
      tenantSlug,
      broadcastId: broadcast.id,
    }

    if (delivery === "gmail") {
      const emailAccount = await getEmailAccountForTenant(numericTenantId)
      if (!isEmailAccountConnected(emailAccount)) {
        throw new Error("Connect Gmail in Settings before sending via Neighborhood Gmail.")
      }

      if (useWorker) {
        await dispatchBroadcastCampaign({
          tenantId: numericTenantId,
          senderUserId: senderUser.id,
          role: enqueueRole,
          tenantIds: getUserTenantIds(senderUser),
          broadcastId: broadcast.id,
          completionToken: signedCompletionToken,
          campaign: {
            ...campaignBase,
            delivery: "gmail",
            gmail: {
              refreshToken: emailAccount!.refreshToken,
              senderEmail: emailAccount!.senderEmail,
            },
          },
        })
      } else {
        const result = await sendBroadcastEmailsViaGmail({
          payload,
          gmailRefreshToken: emailAccount!.refreshToken,
          gmailSenderEmail: emailAccount!.senderEmail,
          activeEmails,
          subject,
          resolvedMessage,
          host,
          tenantSlug,
        })
        await finalizeBroadcastDeliveryLog(payload, broadcast.id, result)
      }
    } else if (useWorker) {
      await dispatchBroadcastCampaign({
        tenantId: numericTenantId,
        senderUserId: senderUser.id,
        role: enqueueRole,
        tenantIds: getUserTenantIds(senderUser),
        broadcastId: broadcast.id,
        completionToken: signedCompletionToken,
        campaign: {
          ...campaignBase,
          delivery: "ses",
        },
      })
    } else {
      const result = await sendBroadcastEmailsInline({
        payload,
        activeEmails,
        subject,
        resolvedMessage,
        host,
        tenantSlug,
      })
      await finalizeBroadcastDeliveryLog(payload, broadcast.id, result)
    }

    await payload.update({
      collection: "tenant-email-quotas",
      id: quota.id,
      data: {
        emailsSentThisMonth: sent + activeEmails.length,
      },
    })

    if (useWorker) {
      return {
        success: true,
        count: activeEmails.length,
        queued: true,
        broadcastId: broadcast.id,
      }
    }

    const updated = await payload.findByID({
      collection: "broadcasts",
      id: broadcast.id,
      overrideAccess: true,
    })

    return {
      success: true,
      count: activeEmails.length,
      sentCount: updated.sentCount ?? 0,
      failedCount: updated.failedCount ?? 0,
      broadcastId: broadcast.id,
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send communication." }
  }
}
