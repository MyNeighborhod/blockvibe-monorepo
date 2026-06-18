import type { CampaignJobMessage, BroadcastDeliveryResult } from "@blockvibe/email-contracts"
import {
  buildBroadcastEmailHtml,
  refreshGoogleAccessToken,
  removeGmailSentLabel,
  sendGmailHtmlEmail,
} from "@blockvibe/email-contracts"
import nodemailer from "nodemailer"
import { reportBroadcastCompletion } from "./reportBroadcastCompletion.js"

const SEND_DELAY_MS = 100

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function emptyResult(): BroadcastDeliveryResult {
  return { sentCount: 0, failedCount: 0, failedEmails: [] }
}

function getUnsubscribeSecret(): string {
  return process.env.PAYLOAD_SECRET || "fallback-secret"
}

function createSesTransporter() {
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

async function deliverToRecipient(params: {
  email: string
  result: BroadcastDeliveryResult
  send: () => Promise<void>
}): Promise<void> {
  try {
    await params.send()
    params.result.sentCount += 1
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[email-worker] delivery failed", { email: params.email, message })
    params.result.failedCount += 1
    params.result.failedEmails.push(params.email)
  }
}

async function sendSesCampaign(message: CampaignJobMessage): Promise<BroadcastDeliveryResult> {
  const transporter = createSesTransporter()
  const fromAddress = process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org"
  const fromName = process.env.SMTP_FROM_NAME || "BlockVibe"
  const { campaign } = message
  const unsubscribeSecret = getUnsubscribeSecret()
  const result = emptyResult()

  let processed = 0
  for (const email of campaign.recipientEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage: campaign.html,
      host: campaign.host,
      tenantSlug: campaign.tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    await deliverToRecipient({
      email,
      result,
      send: async () => {
        await transporter.sendMail({
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject: campaign.subject,
          html,
        })
      },
    })

    processed += 1
    if (SEND_DELAY_MS > 0 && processed < campaign.recipientEmails.length) {
      await sleep(SEND_DELAY_MS)
    }
  }

  return result
}

async function sendGmailCampaign(message: CampaignJobMessage): Promise<BroadcastDeliveryResult> {
  const { campaign } = message
  const gmail = campaign.gmail
  if (!gmail?.refreshToken || !gmail.senderEmail) {
    throw new Error("Gmail credentials are required for gmail delivery.")
  }

  const unsubscribeSecret = getUnsubscribeSecret()
  const accessToken = await refreshGoogleAccessToken(gmail.refreshToken)
  const result = emptyResult()

  let processed = 0
  for (const email of campaign.recipientEmails) {
    const html = buildBroadcastEmailHtml({
      resolvedMessage: campaign.html,
      host: campaign.host,
      tenantSlug: campaign.tenantSlug,
      recipientEmail: email,
      unsubscribeSecret,
    })

    await deliverToRecipient({
      email,
      result,
      send: async () => {
        const messageId = await sendGmailHtmlEmail({
          accessToken,
          from: gmail.senderEmail,
          to: email,
          subject: campaign.subject,
          html,
        })
        if (gmail.skipSentFolder) {
          await removeGmailSentLabel(accessToken, messageId)
        }
      },
    })

    processed += 1
    if (SEND_DELAY_MS > 0 && processed < campaign.recipientEmails.length) {
      await sleep(SEND_DELAY_MS)
    }
  }

  return result
}

export async function sendCampaignEmails(
  message: CampaignJobMessage,
  options?: { completionToken?: string }
): Promise<BroadcastDeliveryResult> {
  const delivery = message.campaign.delivery ?? "ses"
  const result =
    delivery === "gmail" ? await sendGmailCampaign(message) : await sendSesCampaign(message)

  console.info("[email-worker] campaign delivered", {
    jobId: message.jobId,
    tenantId: message.claims.tenantId,
    delivery,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
  })

  const broadcastId = message.campaign.broadcastId
  const completionToken = options?.completionToken
  if (broadcastId && completionToken) {
    try {
      await reportBroadcastCompletion({
        host: message.campaign.host,
        completionToken,
        body: {
          broadcastId,
          tenantId: message.claims.tenantId,
          jobId: message.jobId,
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          failedEmails: result.failedEmails,
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Completion callback failed"
      console.error("[email-worker] broadcast completion callback failed", {
        broadcastId,
        jobId: message.jobId,
        message: msg,
      })
    }
  }

  return result
}
