"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { disconnectGmailAction, updateEmailDeliveryDefaultAction } from "./actions"
import type { EmailDeliveryMethod } from "@/utilities/gmailOAuth"
import { mapGoogleOAuthError } from "@/utilities/gmailOAuth"

interface GmailEmailSettingsProps {
  tenantId: number
  tenantSlug: string
  gmailSenderEmail?: string | null
  gmailConnectedAt?: string | Date | null
  emailDeliveryDefault?: EmailDeliveryMethod | null
  isGoogleConfigured: boolean
  callbackUrl: string
  flash?: { type: "success" | "error"; code?: string; detail?: string }
  showAdminGuide: boolean
}

export function GmailEmailSettings({
  tenantId,
  tenantSlug,
  gmailSenderEmail,
  gmailConnectedAt,
  emailDeliveryDefault,
  isGoogleConfigured,
  callbackUrl,
  flash,
  showAdminGuide,
}: GmailEmailSettingsProps) {
  const connected = Boolean(gmailSenderEmail && gmailConnectedAt)
  const [delivery, setDelivery] = useState<EmailDeliveryMethod>(emailDeliveryDefault || "ses")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    flash?.type === "error"
      ? flash.detail || mapGoogleOAuthError(flash.code)
      : null
  )
  const [success, setSuccess] = useState<string | null>(
    flash?.type === "success" ? "Gmail connected successfully." : null
  )
  const [isPending, startTransition] = useTransition()

  const connectUrl = `/api/integrations/gmail/connect?tenantId=${tenantId}&tenantSlug=${encodeURIComponent(
    tenantSlug
  )}`

  const handleDisconnect = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await disconnectGmailAction(tenantId)
      if (res.success) {
        setSuccess("Gmail disconnected.")
        setDelivery("ses")
      } else {
        setError(res.error || "Failed to disconnect.")
      }
    })
  }

  const handleDeliveryChange = (next: EmailDeliveryMethod) => {
    setDelivery(next)
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await updateEmailDeliveryDefaultAction(tenantId, next)
      if (!res.success) {
        setError(res.error || "Failed to save default.")
        setDelivery(emailDeliveryDefault || "ses")
      } else {
        setSuccess("Default delivery method updated.")
      }
    })
  }

  return (
    <Card className="backdrop-blur-md bg-card/60 border border-border/40">
      <CardHeader>
        <CardTitle className="font-sans">Email delivery</CardTitle>
        <CardDescription>
          Send broadcasts from the platform address (SES) or your neighborhood&apos;s connected Gmail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg border border-error bg-error/10 text-error text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg border border-success bg-success/10 text-success text-sm">
            {success}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Default send method</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="delivery-default"
                checked={delivery === "ses"}
                disabled={isPending}
                onChange={() => handleDeliveryChange("ses")}
              />
              Platform (SES) — info@blockvibe.org
            </label>
            <label
              className={`flex items-center gap-2 text-sm ${connected ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
            >
              <input
                type="radio"
                name="delivery-default"
                checked={delivery === "gmail"}
                disabled={isPending || !connected}
                onChange={() => handleDeliveryChange("gmail")}
              />
              Neighborhood Gmail
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Gmail connection</p>
          {connected ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">Connected as</span> {gmailSenderEmail}
              </p>
              {gmailConnectedAt && (
                <p>
                  <span className="text-foreground font-medium">Since</span>{" "}
                  {new Date(gmailConnectedAt).toLocaleString()}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={handleDisconnect}
                >
                  Disconnect Gmail
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={connectUrl}>Reconnect</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect a Google account to send from your neighborhood&apos;s own address.
              </p>
              {isGoogleConfigured ? (
                <Button type="button" asChild disabled={isPending}>
                  <a href={connectUrl}>Connect Gmail</a>
                </Button>
              ) : (
                <p className="text-sm text-error">
                  Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID and
                  GOOGLE_CLIENT_SECRET in the environment.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/email" className="text-primary hover:underline">
            Open Email Broadcaster →
          </Link>
        </div>

        {showAdminGuide && (
          <details className="rounded-lg border border-border/40 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">
              Setup &amp; troubleshooting
            </summary>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-5">
              <li>
                While the Google app is in <strong>Testing</strong>, only emails listed under{" "}
                <strong>Audience → Test users</strong> can connect.
              </li>
              <li>
                OAuth callback URL (must match Google Cloud redirect URIs):
                <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs text-foreground">
                  {callbackUrl}
                </code>
              </li>
              <li>Enable Gmail API and add scope <code>gmail.send</code> under Data Access.</li>
              <li>
                JavaScript origins use the site root only (no path): e.g.{" "}
                <code>http://localhost:3000</code>
              </li>
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
