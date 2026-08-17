import configPromise from "@payload-config"
import { getPayload } from "payload"
import { unstable_cache } from "next/cache"

import { getRequestTenantSlug } from "./tenantSlugFromRequest"
import { isDefaultNogTenant } from "./resolveTenantSlug"

async function findTenantBySlug(slug: string) {
  const payload = await getPayload({ config: configPromise })

  const bySlug = await payload.find({
    collection: "tenants",
    where: {
      or: [{ slug: { equals: slug } }, { domain: { equals: slug } }],
    },
    limit: 1,
  })

  if (bySlug.docs.length > 0) {
    return bySlug.docs[0]
  }

  // Legacy: production may still have slug `nog` before migration.
  if (isDefaultNogTenant(slug)) {
    const legacy = await payload.find({
      collection: "tenants",
      where: { slug: { equals: "nog" } },
      limit: 1,
    })
    if (legacy.docs.length > 0) {
      return legacy.docs[0]
    }
  }

  return null
}

export async function getTenantBySlug(slug: string): Promise<any | null> {
  try {
    return await findTenantBySlug(slug)
  } catch {
    return null
  }
}

export async function getTenantId(): Promise<string | number | null> {
  try {
    const slug = await getRequestTenantSlug()
    const tenant = await findTenantBySlug(slug)
    return tenant?.id ?? null
  } catch {
    return null
  }
}

export async function getTenant(): Promise<any | null> {
  try {
    const slug = await getRequestTenantSlug()
    return await findTenantBySlug(slug)
  } catch {
    return null
  }
}

async function getGlobal(slug: "header" | "footer", tenantId: string | number | null, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  if (!tenantId) {
    return null
  }

  const result = await payload.find({
    collection: slug,
    where: { tenant: { equals: tenantId } },
    depth,
    limit: 1,
  })

  return result.docs[0] || null
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug and tenant
 */
export const getCachedGlobal = (
  slug: "header" | "footer",
  tenantId: string | number | null,
  depth = 0,
) => {
  // if (process.env.NODE_ENV === 'development') {
  //   return async () => getGlobal(slug, tenantId, depth)
  // }
  return unstable_cache(
    async () => getGlobal(slug, tenantId, depth),
    [slug, String(tenantId || "default")],
    {
      tags: [`global_${slug}`, `tenant_${tenantId || "default"}`],
    },
  )
}
