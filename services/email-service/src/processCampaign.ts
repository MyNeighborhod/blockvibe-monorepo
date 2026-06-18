import crypto from "crypto"
import type {
  CampaignJobMessage,
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
export async function processCampaignJob(message: CampaignJobMessage): Promise<void> {
  console.info("[email-worker] processing campaign", {
    jobId: message.jobId,
    tenantId: message.claims.tenantId,
    senderUserId: message.claims.sub,
    recipientCount: message.campaign.recipientEmails.length,
    subject: message.campaign.subject,
  })

  await sendCampaignEmails(message)
}

export interface DirectCampaignInvokeEvent {
  /** Short-lived HMAC token minted by payload-web */
  token: string
  tenantId: number
  campaign: EnqueueCampaignRequest
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

  const jobId = crypto.randomUUID()
  const message: CampaignJobMessage = {
    jobId,
    claims,
    campaign: event.campaign,
    enqueuedAt: new Date().toISOString(),
  }

  await processCampaignJob(message)

  return {
    jobId,
    status: "queued",
    recipientCount: event.campaign.recipientEmails.length,
  }
}
