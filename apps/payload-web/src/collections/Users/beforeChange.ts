import type { CollectionBeforeChangeHook } from "payload"
import { isSuperAdmin, getUserTenantIds } from "../../access/roles"

import { ulid } from "ulid"

export const usersBeforeChangeHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const { user, payload } = req

  // Auto-assign accountId ULID if missing
  if (!data.accountId) {
    data.accountId = ulid()
  }

  // Allow bypass for seed scripts
  if (req.context?.isSeeding) {
    return data
  }

  // 1. First-time registration logic (bootstrap first user)
  if (operation === "create") {
    const existingUsers = await payload.find({
      collection: "users",
      limit: 1,
    })
    if (existingUsers.totalDocs === 0) {
      // Allow first user to be superadmin and approved
      data.role = "superadmin"
      data.status = "approved"
      return data
    }
  }

  // 2. Anonymous / Self-registration (no logged-in user) — create only.
  if (!user) {
    if (operation === "create") {
      if (!data.role) data.role = "contributor"
      if (!data.status) data.status = "approved"

      // Detect tenant from request context (host or referer)
      const host = (req.headers?.get?.("host") || "").replace(/^www\./, "").split(":")[0]
      const referer = req.headers?.get?.("referer") || ""
      let slug = ""
      let refHost = ""

      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
      const stagingDomain = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"

      if (host.includes(".localhost")) {
        slug = host.split(".")[0]
      } else if (host.includes(`.${platformDomain}`)) {
        slug = host.replace(`.${platformDomain}`, "").split(":")[0]
      } else if (host.includes(`.${stagingDomain}`)) {
        slug = host.replace(`.${stagingDomain}`, "").split(":")[0]
      }

      if (referer) {
        try {
          const refUrl = new URL(referer)
          refHost = refUrl.hostname.replace(/^www\./, "")
          if (refHost.includes(".localhost")) {
            slug = refHost.split(".")[0]
          } else if (refHost.includes(`.${platformDomain}`)) {
            slug = refHost.replace(`.${platformDomain}`, "").split(":")[0]
          } else if (refHost.includes(`.${stagingDomain}`)) {
            slug = refHost.replace(`.${stagingDomain}`, "").split(":")[0]
          }
        } catch (e) {
          // url parse failure
        }
      }

      const tenantsResult = await payload.find({
        collection: "tenants",
        where: {
          or: [
            ...(host ? [{ domain: { equals: host } }] : []),
            ...(refHost ? [{ domain: { equals: refHost } }] : []),
            ...(slug && slug !== "default" && slug !== "localhost" ? [{ slug: { equals: slug } }] : []),
          ],
        },
        limit: 1,
      })

      if (tenantsResult.docs.length > 0) {
        data.tenants = [{ tenant: tenantsResult.docs[0].id }]
      }
    }
    return data
  }

  // 3. Logged-in user modifications
  if (isSuperAdmin(user)) {
    // Superadmin has complete freedom
    return data
  }

  const userRole = (user as any)?.role

  if (userRole === "admin") {
    // Tenant Admin restrictions
    const adminTenantIds = getUserTenantIds(user)

    // Cannot create or promote anyone to superadmin
    if (data.role === "superadmin") {
      data.role = originalDoc ? originalDoc.role : "contributor"
    }

    // Ensure they only associate the user with tenants they manage
    if (data.tenants) {
      data.tenants = data.tenants.filter((t: any) => {
        const tId = typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant
        return adminTenantIds.includes(tId)
      })
    }

    // If updating an existing user, check if that user is a superadmin
    if (originalDoc && originalDoc.role === "superadmin") {
      // Block modifying superadmins
      return originalDoc
    }
  } else {
    // Editor or Contributor editing themselves (since access control only lets them edit themselves)
    // Block editing fields that affect privileges
    if (originalDoc) {
      data.role = originalDoc.role
      data.status = originalDoc.status
      data.tenants = originalDoc.tenants
    } else {
      // Fallback defaults for safety
      data.role = "contributor"
      data.status = "pending"
    }
  }

  return data
}
