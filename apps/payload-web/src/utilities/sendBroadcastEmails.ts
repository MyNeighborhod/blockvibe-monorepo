import type { Payload } from "payload"
import { buildBroadcastEmailHtml } from "@blockvibe/email-contracts"
import { refreshGoogleAccessToken, removeGmailSentLabel, sendGmailHtmlEmail } from "./gmailOAuth"

export async function sendBroadcastEmailsInline(params: {
  payload: Payload
  activeEmails: string[]
  subject: string
  resolvedMessage: string
  host: string
  tenantSlug: string
}): Promise<void> {
  const { payload, activeEmails, subject, resolvedMessage, host, tenantSlug } = params
  const unsubscribeSecret = process.env.PAYLOAD_SECRET || "fallback-secret"

  for (const email of activeEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage,
      host,
      tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    try {
      await payload.sendEmail({
        to: email,
        subject,
        html,
      })
    } catch (emailError: unknown) {
      const message = emailError instanceof Error ? emailError.message : String(emailError)
      payload.logger.error({ err: emailError }, `Broadcast email delivery failed for ${email}`)
      throw new Error(`Email delivery failed for ${email}: ${message}`)
    }
  }
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
  skipGmailSentFolder?: boolean
}): Promise<void> {
  const {
    payload,
    gmailRefreshToken,
    gmailSenderEmail,
    activeEmails,
    subject,
    resolvedMessage,
    host,
    tenantSlug,
    skipGmailSentFolder = false,
  } = params

  const unsubscribeSecret = process.env.PAYLOAD_SECRET || "fallback-secret"
  const accessToken = await refreshGoogleAccessToken(gmailRefreshToken)

  for (const email of activeEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage,
      host,
      tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    try {
      const messageId = await sendGmailHtmlEmail({
        accessToken,
        from: gmailSenderEmail,
        to: email,
        subject,
        html,
      })
      if (skipGmailSentFolder) {
        await removeGmailSentLabel(accessToken, messageId)
      }
    } catch (emailError: unknown) {
      const message = emailError instanceof Error ? emailError.message : String(emailError)
      payload.logger.error({ err: emailError }, `Gmail broadcast failed for ${email}`)
      throw new Error(`Email delivery failed for ${email}: ${message}`)
    }
  }
}
