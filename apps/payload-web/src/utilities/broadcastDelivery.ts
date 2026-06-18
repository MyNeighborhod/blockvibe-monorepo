import type { BroadcastDeliveryResult } from "@blockvibe/email-contracts"
import { resolveBroadcastDeliveryStatus } from "@blockvibe/email-contracts"
import type { Payload } from "payload"

export async function finalizeBroadcastDeliveryLog(
  payload: Payload,
  broadcastId: number,
  result: BroadcastDeliveryResult,
  jobId?: string
): Promise<void> {
  await payload.update({
    collection: "broadcasts",
    id: broadcastId,
    data: {
      status: resolveBroadcastDeliveryStatus(result),
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      failedEmails: result.failedEmails,
      ...(jobId ? { jobId } : {}),
    },
    overrideAccess: true,
  })
}
