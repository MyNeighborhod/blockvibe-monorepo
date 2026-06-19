"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { headers } from "next/headers"
import crypto from "crypto"

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
