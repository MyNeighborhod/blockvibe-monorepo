import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import {
  mintEnqueueToken,
  type DirectCampaignInvokeEvent,
  type EmailEnqueueRole,
  type EnqueueCampaignRequest,
} from "@blockvibe/email-contracts"

export function shouldUseEmailService(): boolean {
  return Boolean(process.env.EMAIL_LAMBDA_FUNCTION_NAME || process.env.EMAIL_SERVICE_URL)
}

export function getEmailEnqueueRole(user: { role?: string | null }): EmailEnqueueRole | null {
  if (user.role === "superadmin") return "superadmin"
  if (user.role === "admin") return "admin"
  return null
}

export async function dispatchBroadcastCampaign(params: {
  tenantId: number
  senderUserId: number
  role: EmailEnqueueRole
  tenantIds: number[]
  campaign: EnqueueCampaignRequest
}): Promise<void> {
  const token = mintEnqueueToken({
    userId: params.senderUserId,
    role: params.role,
    tenantId: params.tenantId,
    tenantIds: params.tenantIds,
  })

  const lambdaName = process.env.EMAIL_LAMBDA_FUNCTION_NAME
  if (lambdaName) {
    const client = new LambdaClient({
      region: process.env.AWS_REGION || "us-east-1",
    })

    const event: DirectCampaignInvokeEvent = {
      token,
      tenantId: params.tenantId,
      campaign: params.campaign,
    }

    const result = await client.send(
      new InvokeCommand({
        FunctionName: lambdaName,
        InvocationType: "Event",
        Payload: Buffer.from(JSON.stringify(event)),
      })
    )

    const status = result.StatusCode ?? 0
    if (status < 200 || status >= 300) {
      throw new Error(`Email service rejected the campaign (status ${status}).`)
    }
    return
  }

  const baseUrl = process.env.EMAIL_SERVICE_URL?.replace(/\/$/, "")
  if (!baseUrl) {
    throw new Error("EMAIL_LAMBDA_FUNCTION_NAME or EMAIL_SERVICE_URL must be configured.")
  }

  const response = await fetch(`${baseUrl}/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tenantId: params.tenantId,
      ...params.campaign,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body || `Email service returned ${response.status}.`)
  }
}
