import type { DirectCampaignInvokeEvent } from "@blockvibe/email-contracts"
import { runDirectCampaignInvoke } from "./processCampaign.js"

/**
 * Production Lambda entrypoint (cost-minimized).
 * Invoked directly from EC2 payload-web via IAM — no API Gateway, no SQS.
 *
 * Use InvocationType "Event" for async fire-and-forget (recommended).
 */
export async function handler(event: DirectCampaignInvokeEvent) {
  try {
    return await runDirectCampaignInvoke(event)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Campaign invoke failed"
    console.error("[email-invoke]", message)
    throw err
  }
}
