"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { headers } from "next/headers"
import crypto from "crypto"
import { getMeUser } from "@/utilities/getMeUser"

export async function sendBroadcastAction(
  recipientEmails: string[],
  subject: string,
  message: string,
  tenantId: string | number
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

    // Get tenant quota
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

    if (sent + recipientEmails.length > limit) {
      throw new Error(
        `This neighborhood has insufficient monthly email quota (${sent}/${limit}) to send to ${recipientEmails.length} recipients.`
      )
    }

    const reqHeaders = await headers()
    const host = reqHeaders.get("host") || "localhost:3000"

    const tenantResult = await payload.findByID({
      collection: "tenants",
      id: tenantId,
    })
    const tenantSlug = tenantResult.slug

    // Filter out recipientEmails that are unsubscribed
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

    // Send emails
    for (const email of activeEmails) {
      try {
        const token = crypto
          .createHmac("sha256", process.env.PAYLOAD_SECRET || "fallback-secret")
          .update(email)
          .digest("hex")

        const protocol = host.startsWith("localhost") ? "http" : "https"
        const unsubscribeUrl = `${protocol}://${host}/${tenantSlug}/unsubscribe?email=${encodeURIComponent(
          email
        )}&token=${token}`

        await payload.sendEmail({
          to: email,
          subject: subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-bottom: 16px;">Community Announcement</h2>
              <div style="color: #334155; font-size: 16px; line-height: 24px;">${message}</div>
              <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e2e8f0;" />
              <p style="color: #64748b; font-size: 12px; text-align: center;">
                Sent via ${host} to registered residents of your neighborhood association.
              </p>
              <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 12px;">
                If you no longer wish to receive these emails, you can 
                <a href="${unsubscribeUrl}" style="color: #0284c7; text-decoration: underline;">unsubscribe here</a>.
              </p>
            </div>
          `,
        })
      } catch (emailError: any) {
        payload.logger.error(
          { err: emailError },
          `Broadcast email delivery failed for ${email}`
        )
        throw new Error(`Email delivery failed for ${email}: ${emailError.message || emailError}`)
      }
    }

    // Update sent quota count
    await payload.update({
      collection: "tenant-email-quotas",
      id: quota.id,
      data: {
        emailsSentThisMonth: sent + activeEmails.length,
      },
    })

    // Save to the sent communications log (Broadcasts collection)
    const { user: senderUser } = await getMeUser()
    await payload.create({
      collection: "broadcasts",
      data: {
        subject,
        message, // HTML content
        recipients: activeEmails, // JSON array of emails
        sender: senderUser.id,
        tenant: typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId,
      },
      user: senderUser,
    })

    return { success: true, count: activeEmails.length }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send communication." }
  }
}
