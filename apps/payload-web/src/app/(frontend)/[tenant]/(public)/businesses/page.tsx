import React from "react"
import { notFound } from "next/navigation"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { isDefaultNogTenant } from "@/utilities/resolveTenantSlug"
import { getBusinessesAction } from "./actions"
import BusinessesClient from "./BusinessesClient"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { tenant: tenantSlug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  // 1. Resolve tenant ID
  let tenantDoc = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: tenantSlug } }, { domain: { equals: tenantSlug } }],
    },
    limit: 1,
  })

  if (tenantDoc.docs.length === 0 && isDefaultNogTenant(tenantSlug)) {
    tenantDoc = await payload.find({
      collection: "tenants",
      where: {
        slug: { equals: "nog" },
      },
      limit: 1,
    })
  }

  const tenant = tenantDoc.docs[0]
  if (!tenant) {
    notFound()
  }

  // 2. Fetch businesses
  const res = await getBusinessesAction(tenant.id)
  const initialBusinesses = res.success && res.businesses ? res.businesses : []

  return (
    <BusinessesClient
      initialBusinesses={initialBusinesses as any}
      tenantId={tenant.id}
      tenantSlug={tenant.slug || ""}
      tenantName={tenant.name || ""}
    />
  )
}
