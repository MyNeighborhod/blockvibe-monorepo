import crypto from "crypto"
import type {
  CampaignJobMessage,
  DirectCampaignInvokeEvent,
  EnqueueCampaignRequest,
  EnqueueCampaignResponse,
} from "@blockvibe/email-contracts"
import {
  assertCanEnqueueForTenant,
  verifyEnqueueToken,
} from "@blockvibe/email-contracts"
import { sendCampaignEmails } from "./sendCampaignEmails.js"

/**
 * Process one campaign job (SES today, Gmail OAuth later).
 * Shared by direct Lambda invoke and optional SQS worker.
 */
export async function processCampaignJob(
  message: CampaignJobMessage,
  options?: { completionToken?: string }
): Promise<void> {
  console.info("[email-worker] processing campaign", {
    jobId: message.jobId,
    tenantId: message.claims.tenantId,
    senderUserId: message.claims.sub,
    recipientCount: message.campaign.recipientEmails.length,
    subject: message.campaign.subject,
    broadcastId: message.campaign.broadcastId,
  })

  await sendCampaignEmails(message, options)
}

export async function runDirectCampaignInvoke(
  event: DirectCampaignInvokeEvent
): Promise<EnqueueCampaignResponse> {
  const claims = verifyEnqueueToken(event.token)
  assertCanEnqueueForTenant(claims)

  if (claims.tenantId !== event.tenantId) {
    throw new Error("Token tenant does not match request tenantId.")
  }

  if (!event.campaign.subject?.trim() || !event.campaign.html?.trim()) {
    throw new Error("Subject and html are required.")
  }

  if (!event.campaign.recipientEmails?.length) {
    throw new Error("At least one recipient email is required.")
  }

  const delivery = event.campaign.delivery ?? "ses"
  if (delivery === "gmail") {
    if (!event.campaign.gmail?.refreshToken || !event.campaign.gmail?.senderEmail) {
      throw new Error("Gmail refresh token and sender email are required for gmail delivery.")
    }
  }

  const jobId = crypto.randomUUID()
  const message: CampaignJobMessage = {
    jobId,
    claims,
    campaign: event.campaign,
    enqueuedAt: new Date().toISOString(),
  }

  try {
    await processCampaignJob(message, { completionToken: event.completionToken })
  } catch (err: unknown) {
    const broadcastId = event.campaign.broadcastId
    if (broadcastId && event.completionToken) {
      const { reportBroadcastCompletion } = await import("./reportBroadcastCompletion.js")
      const failedEmails = event.campaign.recipientEmails
      try {
        await reportBroadcastCompletion({
          host: event.campaign.host,
          completionToken: event.completionToken,
          body: {
            broadcastId,
            tenantId: event.tenantId,
            jobId,
            sentCount: 0,
            failedCount: failedEmails.length,
            failedEmails,
          },
        })
      } catch (reportErr: unknown) {
        console.error("[email-invoke] failed to report catastrophic campaign failure", reportErr)
      }
    }
    throw err
  }

  return {
    jobId,
    status: "queued",
    recipientCount: event.campaign.recipientEmails.length,
  }
}
