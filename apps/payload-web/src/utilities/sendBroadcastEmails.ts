import type { BroadcastDeliveryResult } from "@blockvibe/email-contracts"
import { buildBroadcastEmailHtml } from "@blockvibe/email-contracts"
import type { Payload } from "payload"
import { refreshGoogleAccessToken, sendGmailHtmlEmail } from "./gmailOAuth"

function emptyResult(): BroadcastDeliveryResult {
  return { sentCount: 0, failedCount: 0, failedEmails: [] }
}

async function deliverToRecipient(params: {
  send: () => Promise<void>
  email: string
  payload: Payload
  result: BroadcastDeliveryResult
}): Promise<void> {
  try {
    await params.send()
    params.result.sentCount += 1
  } catch (emailError: unknown) {
    const message = emailError instanceof Error ? emailError.message : String(emailError)
    params.payload.logger.error(
      { err: emailError },
      `Broadcast email delivery failed for ${params.email}`
    )
    params.result.failedCount += 1
    params.result.failedEmails.push(params.email)
    if (message) {
      params.payload.logger.error(`Delivery error for ${params.email}: ${message}`)
    }
  }
}

export async function sendBroadcastEmailsInline(params: {
  payload: Payload
  activeEmails: string[]
  subject: string
  resolvedMessage: string
  host: string
  tenantSlug: string
}): Promise<BroadcastDeliveryResult> {
  const { payload, activeEmails, subject, resolvedMessage, host, tenantSlug } = params
  const unsubscribeSecret = process.env.PAYLOAD_SECRET || "fallback-secret"
  const result = emptyResult()

  for (const email of activeEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage,
      host,
      tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    await deliverToRecipient({
      payload,
      email,
      result,
      send: async () => {
        await payload.sendEmail({
          to: email,
          subject,
          html,
        })
      },
    })
  }

  return result
}

export async function sendBroadcastEmailsViaGmail(params: {
  payload: Payload
  gmailRefreshToken: string
  gmailSenderEmail: string
  activeEmails: string[]
  subject: string
  resolvedMessage: string
  host: string
  tenantSlug: string
}): Promise<BroadcastDeliveryResult> {
  const {
    payload,
    gmailRefreshToken,
    gmailSenderEmail,
    activeEmails,
    subject,
    resolvedMessage,
    host,
    tenantSlug,
  } = params

  const unsubscribeSecret = process.env.PAYLOAD_SECRET || "fallback-secret"
  const accessToken = await refreshGoogleAccessToken(gmailRefreshToken)
  const result = emptyResult()

  for (const email of activeEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage,
      host,
      tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    await deliverToRecipient({
      payload,
      email,
      result,
      send: async () => {
        await sendGmailHtmlEmail({
          accessToken,
          from: gmailSenderEmail,
          to: email,
          subject,
          html,
        })
      },
    })
  }

  return result
}
