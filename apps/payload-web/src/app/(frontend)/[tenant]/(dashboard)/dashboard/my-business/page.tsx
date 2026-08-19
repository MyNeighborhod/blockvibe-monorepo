import React from "react"
import { notFound, redirect } from "next/navigation"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { getMeUser } from "@/utilities/getMeUser"
import { getMyBusinessAction } from "./actions"
import { MyBusinessClient } from "./MyBusinessClient"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function MyBusinessPage({ params }: Args) {
  const { tenant: tenantSlug } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  if (!user) {
    redirect(`/login`)
  }

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) {
    notFound()
  }

  const result = await getMyBusinessAction(tenant.id)
  const business = result.success ? result.business : null

  return <MyBusinessClient tenantId={tenant.id} initialBusiness={business} />
}
