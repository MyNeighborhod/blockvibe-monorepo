import type { CampaignJobMessage } from "@blockvibe/email-contracts"
import { processCampaignJob } from "./processCampaign.js"

/** Optional SQS worker — only if you enable EMAIL_CAMPAIGN_QUEUE_URL + worker Lambda later. */
export async function handler(event: { Records?: Array<{ body: string }> }): Promise<void> {
  for (const record of event.Records ?? []) {
    const job = JSON.parse(record.body) as CampaignJobMessage
    await processCampaignJob(job)
  }
}
