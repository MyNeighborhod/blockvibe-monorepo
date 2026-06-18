function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured.")
  }
  return { clientId, clientSecret }
}

function buildGmailRawMessage(params: {
  from: string
  to: string
  subject: string
  html: string
}): string {
  const message = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    params.html,
  ].join("\r\n")

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = getGoogleOAuthConfig()
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  const data = (await response.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to refresh Google access token.")
  }
  return data.access_token
}

export async function sendGmailHtmlEmail(params: {
  accessToken: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<string> {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: buildGmailRawMessage(params),
    }),
  })

  const data = (await response.json()) as { id?: string; error?: { message?: string } }
  if (!response.ok || !data.id) {
    throw new Error(data.error?.message || "Gmail API send failed.")
  }
  return data.id
}

export async function removeGmailSentLabel(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ removeLabelIds: ["SENT"] }),
    }
  )

  const data = (await response.json()) as { error?: { message?: string } }
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to remove message from Gmail Sent folder.")
  }
}
