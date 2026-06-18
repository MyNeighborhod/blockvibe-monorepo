import nodemailer from "nodemailer"
import type { CampaignJobMessage } from "@blockvibe/email-contracts"
import { buildBroadcastEmailHtml } from "@blockvibe/email-contracts"

const SEND_DELAY_MS = 100

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getUnsubscribeSecret(): string {
  return process.env.PAYLOAD_SECRET || "fallback-secret"
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || "",
        }
      : undefined,
  })
}

export async function sendCampaignEmails(message: CampaignJobMessage): Promise<void> {
  const transporter = createTransporter()
  const fromAddress = process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org"
  const fromName = process.env.SMTP_FROM_NAME || "BlockVibe"
  const { campaign } = message
  const unsubscribeSecret = getUnsubscribeSecret()

  let sent = 0
  for (const email of campaign.recipientEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage: campaign.html,
      host: campaign.host,
      tenantSlug: campaign.tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: campaign.subject,
      html,
    })

    sent += 1
    if (SEND_DELAY_MS > 0 && sent < campaign.recipientEmails.length) {
      await sleep(SEND_DELAY_MS)
    }
  }

  console.info("[email-worker] campaign delivered", {
    jobId: message.jobId,
    tenantId: message.claims.tenantId,
    sent,
  })
}
