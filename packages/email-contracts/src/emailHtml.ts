import crypto from "crypto"

export function buildUnsubscribeToken(email: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(email).digest("hex")
}

export function buildBroadcastEmailHtml(params: {
  resolvedMessage: string
  host: string
  tenantSlug: string
  recipientEmail: string
  unsubscribeSecret: string
}): string {
  const { resolvedMessage, host, tenantSlug, recipientEmail, unsubscribeSecret } = params
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const token = buildUnsubscribeToken(recipientEmail, unsubscribeSecret)
  const unsubscribeUrl = `${protocol}://${host}/${tenantSlug}/unsubscribe?email=${encodeURIComponent(
    recipientEmail
  )}&token=${token}`

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="color: #334155; font-size: 16px; line-height: 24px;">${resolvedMessage}</div>
      <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="color: #64748b; font-size: 12px; text-align: center;">
        Sent via ${host} to registered residents of your neighborhood association.
      </p>
      <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 12px;">
        If you no longer wish to receive these emails, you can 
        <a href="${unsubscribeUrl}" style="color: #0284c7; text-decoration: underline;">unsubscribe here</a>.
      </p>
    </div>
  `
}
