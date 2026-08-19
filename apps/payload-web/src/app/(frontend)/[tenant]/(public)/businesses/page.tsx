import React from "react"
import { notFound } from "next/navigation"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { isDefaultNogTenant } from "@/utilities/resolveTenantSlug"
import { getDirectoryBootstrapAction } from "./actions"
import BusinessesClient from "./BusinessesClient"
import { DEFAULT_DIRECTORY_FIELD_CONFIG } from "@/directory/constants"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { tenant: tenantSlug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

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

  if (!(tenant as any).enableBusinessDirectory) {
    notFound()
  }

  const res = await getDirectoryBootstrapAction(tenant.id)
  if (!res.success || !res.enabled) {
    notFound()
  }

  return (
    <BusinessesClient
      initialBusinesses={(res.businesses || []) as any}
      initialHasNextPage={Boolean(res.hasNextPage)}
      initialTotalDocs={res.totalDocs || 0}
      initialPage={res.page || 1}
      categoryCounts={res.categoryCounts || { all: 0 }}
      categories={(res.categories || []) as any}
      customFields={(res.customFields || []) as any}
      directorySettings={
        (res.directorySettings as any) || {
          pageTitle: "Businesses",
          pageIntro: "",
          allowPublicRegistration: true,
          showInNav: true,
          fieldConfig: DEFAULT_DIRECTORY_FIELD_CONFIG,
        }
      }
      tenantId={tenant.id}
      tenantSlug={tenant.slug || ""}
      tenantName={tenant.name || ""}
    />
  )
}
