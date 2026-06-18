import type { NextRequest } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import {
  verifyBroadcastCompletionToken,
  resolveBroadcastDeliveryStatus,
  type BroadcastCompletionRequest,
} from "@blockvibe/email-contracts"

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const completionToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : ""

    if (!completionToken) {
      return Response.json({ error: "Missing completion token." }, { status: 401 })
    }

    const body = (await req.json()) as BroadcastCompletionRequest
    const claims = verifyBroadcastCompletionToken(completionToken)

    if (claims.broadcastId !== body.broadcastId || claims.tenantId !== body.tenantId) {
      return Response.json({ error: "Completion token does not match request." }, { status: 403 })
    }

    const failedEmails = Array.isArray(body.failedEmails)
      ? body.failedEmails.filter((email) => typeof email === "string")
      : []

    const sentCount = Math.max(0, Number(body.sentCount) || 0)
    const failedCount = Math.max(0, Number(body.failedCount) || failedEmails.length)

    const payload = await getPayload({ config: configPromise })
    await payload.update({
      collection: "broadcasts",
      id: body.broadcastId,
      data: {
        status: resolveBroadcastDeliveryStatus({ sentCount, failedCount, failedEmails }),
        sentCount,
        failedCount,
        failedEmails,
        ...(body.jobId ? { jobId: body.jobId } : {}),
      },
      overrideAccess: true,
    })

    return Response.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Broadcast completion failed."
    return Response.json({ error: message }, { status: 400 })
  }
}
