import React from "react"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { notFound, redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { InviteModal } from "./InviteModal"
import { CRMTabs } from "./CRMTabs"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function CRMDashboard({ params }: Args) {
  const { tenant: tenantSlug } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  const allowedRoles = ["superadmin", "admin", "editor"]
  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(`/dashboard`)
  }

  const tenant = await getTenantBySlug(tenantSlug)

  if (!tenant) {
    notFound()
  }

  // Fetch initial fields and mailing lists server-side
  const payload = await getPayload({ config: configPromise })
  
  const fieldsResult = await payload.find({
    collection: "crm-fields",
    where: {
      tenant: { equals: tenant.id },
    },
    limit: 100,
  })

  const listsResult = await payload.find({
    collection: "mailing-lists",
    where: {
      tenant: { equals: tenant.id },
    },
    limit: 100,
    depth: 1,
  })

  const fields = fieldsResult.docs.map((doc) => ({
    id: doc.id,
    label: doc.label,
    key: doc.key,
    fieldType: doc.fieldType,
    options: doc.options || [],
  }))

  const lists = listsResult.docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    description: doc.description,
    type: doc.type,
    members: doc.members || [],
    rules: doc.rules || [],
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">
            Resident Directory
          </h1>
          <p className="text-muted-foreground">
            Manage neighborhood residents, mailing lists, and custom attributes.
          </p>
        </div>
        <InviteModal tenantId={tenant.id} />
      </div>

      <CRMTabs
        tenantId={tenant.id}
        initialFields={fields as any}
        initialLists={lists as any}
      />
    </div>
  )
}
