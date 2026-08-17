import React from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { getTenantBySlug } from "@/utilities/getGlobals"
import {
  getGmailCallbackUrl,
  isGoogleOAuthConfigured,
  mapGoogleOAuthError,
} from "@/utilities/gmailOAuth"
import { getEmailAccountForTenant } from "@/utilities/emailSrvAccount"
import { GmailEmailSettings } from "./GmailEmailSettings"

type Args = {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    gmail?: string
    code?: string
    detail?: string
  }>
}

export default async function SettingsDashboardPage({ params, searchParams }: Args) {
  const { tenant: tenantSlug } = await params
  const query = await searchParams

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  const allowedRoles = ["superadmin", "admin"]
  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(`/dashboard`)
  }

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) {
    redirect(`/dashboard`)
  }

  const emailAccount = await getEmailAccountForTenant(tenant.id)

  const headersList = await headers()
  const host = headersList.get("host") || ""
  const callbackRequest = host
    ? new Request(`https://${host}/api/integrations/gmail/callback`, {
        headers: { host, "x-forwarded-proto": headersList.get("x-forwarded-proto") || "https" },
      })
    : undefined

  let flash: { type: "success" | "error"; code?: string; detail?: string } | undefined
  if (query.gmail === "connected") {
    flash = { type: "success" }
  } else if (query.gmail === "error") {
    flash = {
      type: "error",
      code: query.code,
      detail: query.detail || mapGoogleOAuthError(query.code),
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Neighborhood email delivery, Gmail OAuth, and broadcaster defaults.
        </p>
      </div>

      <GmailEmailSettings
        tenantId={tenant.id}
        tenantSlug={tenantSlug}
        gmailSenderEmail={emailAccount?.senderEmail}
        gmailConnectedAt={emailAccount?.connectedAt}
        emailDeliveryDefault={tenant.emailDeliveryDefault}
        isGoogleConfigured={isGoogleOAuthConfigured()}
        callbackUrl={getGmailCallbackUrl(callbackRequest)}
        flash={flash}
        showAdminGuide
      />
    </div>
  )
}
