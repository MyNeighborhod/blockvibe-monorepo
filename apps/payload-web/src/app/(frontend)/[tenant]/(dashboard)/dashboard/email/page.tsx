import React from "react"
import { notFound, redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { getEmailAccountForTenant, isEmailAccountConnected } from "@/utilities/emailSrvAccount"
import type { EmailDeliveryMethod } from "@/utilities/gmailOAuth"
import { BroadcastForm } from "./BroadcastForm"
import { BroadcastStatusLog } from "./BroadcastStatusLog"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function EmailDashboard({ params }: Args) {
  const { tenant: tenantSlug } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  const allowedRoles = ["superadmin", "admin"]
  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(`/dashboard`)
  }

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) {
    notFound()
  }

  // Fetch all users associated with this tenant who have not unsubscribed
  const payload = await getPayload({ config: configPromise })
  const residentsResult = await payload.find({
    collection: "users",
    where: {
      "tenants.tenant": {
        equals: tenant.id,
      },
      unsubscribed: {
        not_equals: true,
      },
    },
    sort: "name",
    limit: 100,
  })

  const residents = residentsResult.docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
  }))

  const emailAccount = await getEmailAccountForTenant(tenant.id)

  const broadcastsResult = await payload.find({
    collection: "broadcasts",
    where: {
      tenant: {
        equals: tenant.id,
      },
    },
    sort: "-createdAt",
    limit: 20,
    depth: 0,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">
          Email Broadcaster
        </h1>
        <p className="text-muted-foreground">
          Send custom announcements, notifications, or newsletters to residents in your
          neighborhood.
        </p>
      </div>

      <BroadcastForm
        residents={residents}
        tenantId={tenant.id}
        gmailConnected={isEmailAccountConnected(emailAccount)}
        defaultDelivery={(tenant.emailDeliveryDefault as EmailDeliveryMethod) || "ses"}
      />

      <BroadcastStatusLog broadcasts={broadcastsResult.docs} />
    </div>
  )
}
