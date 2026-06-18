import crypto from "crypto"
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"
import type { CampaignJobMessage, EnqueueCampaignRequest, EnqueueTokenClaims } from "@blockvibe/email-contracts"
import { processCampaignJob } from "../processCampaign.js"

const sqs = new SQSClient({})

export async function enqueueCampaignJob(
  claims: EnqueueTokenClaims,
  tenantId: number,
  campaign: EnqueueCampaignRequest,
  options?: { completionToken?: string }
): Promise<{ jobId: string; recipientCount: number }> {
  const jobId = crypto.randomUUID()
  const message: CampaignJobMessage = {
    jobId,
    claims,
    campaign,
    enqueuedAt: new Date().toISOString(),
  }

  const queueUrl = process.env.EMAIL_CAMPAIGN_QUEUE_URL
  if (!queueUrl) {
    await processCampaignJob(message, { completionToken: options?.completionToken })
    return { jobId, recipientCount: campaign.recipientEmails.length }
  }

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      ...(queueUrl.endsWith(".fifo")
        ? {
            MessageGroupId: String(tenantId),
            MessageDeduplicationId: jobId,
          }
        : {}),
    })
  )

  return { jobId, recipientCount: campaign.recipientEmails.length }
}
