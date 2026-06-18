import nodemailer from "nodemailer"
import type { Payload } from "payload"
import { buildBroadcastEmailHtml } from "./broadcastEmailHtml"
import { getGoogleOAuthConfig } from "./gmailOAuth"
import type { EmailDeliveryMethod } from "./gmailOAuth"

export async function sendBroadcastEmails(params: {
  payload: Payload
  delivery: EmailDeliveryMethod
  gmailRefreshToken?: string | null
  gmailSenderEmail?: string | null
  activeEmails: string[]
  subject: string
  resolvedMessage: string
  host: string
  tenantSlug: string
}): Promise<void> {
  const {
    payload,
    delivery,
    gmailRefreshToken,
    gmailSenderEmail,
    activeEmails,
    subject,
    resolvedMessage,
    host,
    tenantSlug,
  } = params

  if (delivery === "gmail") {
    if (!gmailRefreshToken || !gmailSenderEmail) {
      throw new Error("Connect Gmail in Settings before sending via Neighborhood Gmail.")
    }
    const { clientId, clientSecret } = getGoogleOAuthConfig()
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: gmailSenderEmail,
        clientId,
        clientSecret,
        refreshToken: gmailRefreshToken,
      },
    })

    for (const email of activeEmails) {
      const html = buildBroadcastEmailHtml({
        resolvedMessage,
        host,
        tenantSlug,
        recipientEmail: email,
      })
      try {
        await transporter.sendMail({
          from: gmailSenderEmail,
          to: email,
          subject,
          html,
        })
      } catch (emailError: unknown) {
        const message = emailError instanceof Error ? emailError.message : String(emailError)
        payload.logger.error({ err: emailError }, `Gmail broadcast failed for ${email}`)
        throw new Error(`Email delivery failed for ${email}: ${message}`)
      }
    }
    return
  }

  for (const email of activeEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage,
      host,
      tenantSlug,
      recipientEmail: email,
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
