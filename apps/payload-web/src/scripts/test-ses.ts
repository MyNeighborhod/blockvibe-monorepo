/**
 * Local SES SMTP smoke test. Never hardcode credentials here.
 *
 * Usage (from apps/payload-web, with .env.production or .env.staging loaded):
 *   SMTP_USER=... SMTP_PASS=... pnpm exec tsx src/scripts/test-ses.ts
 * Or: dotenv -e .env.production -- pnpm exec tsx src/scripts/test-ses.ts
 */
import nodemailer from "nodemailer"

async function main() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const host = process.env.SMTP_HOST || "email-smtp.us-east-1.amazonaws.com"
  const port = parseInt(process.env.SMTP_PORT || "587", 10)
  const secure = process.env.SMTP_SECURE === "true"
  const fromAddress = process.env.SMTP_FROM_ADDRESS || "info@blockvibe.org"
  const fromName = process.env.SMTP_FROM_NAME || "BlockVibe Test"
  const to = process.env.SES_TEST_TO || process.env.SMTP_TEST_TO

  if (!user || !pass) {
    console.error(
      "Missing SMTP_USER / SMTP_PASS. Set them from your local env file (never commit secrets).",
    )
    process.exit(1)
  }
  if (!to) {
    console.error("Missing SES_TEST_TO (recipient for the smoke test).")
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  console.log(`Sending test email via ${host}:${port} as ${fromAddress} → ${to}...`)
  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject: "AWS SES Test Email",
      text: "This is a test email sent from the blockvibe AWS SES configuration to verify SMTP credentials.",
      html: "<b>This is a test email sent from the blockvibe AWS SES configuration to verify SMTP credentials.</b>",
    })
    console.log("Email sent successfully!")
    console.log("Message ID:", info.messageId)
  } catch (error) {
    console.error("Error sending email:", error)
    process.exit(1)
  }
}

void main()
