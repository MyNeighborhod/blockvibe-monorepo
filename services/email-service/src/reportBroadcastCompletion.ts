import type { BroadcastCompletionRequest } from "@blockvibe/email-contracts"

export async function reportBroadcastCompletion(params: {
  host: string
  completionToken: string
  body: BroadcastCompletionRequest
}): Promise<void> {
  const protocol = params.host.includes("localhost") ? "http" : "https"
  const url = `${protocol}://${params.host}/api/email/broadcasts/complete`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.completionToken}`,
    },
    body: JSON.stringify(params.body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(text || `Broadcast completion callback failed (${response.status}).`)
  }
}
