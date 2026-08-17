import type { Access } from "payload"
import type { User } from "../payload-types"

export const isSuperAdmin = (user: User | null | undefined): boolean => {
  return (user as any)?.role === "superadmin"
}

export const isApproved = (user: User | null | undefined): boolean => {
  return isSuperAdmin(user) || (user as any)?.status === "approved"
}

export const getUserTenantIds = (user: User | null | undefined): number[] => {
  if (!user || !user.tenants) return []
  return user.tenants
    .map((t: any) => (typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant))
    .filter(Boolean)
}

// ==========================================
// 1. Users Collection Access Policies
// ==========================================

export const usersRead: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    if ((user as any)?.role === "admin") {
      const tenantIds = getUserTenantIds(user)
      if (tenantIds.length === 0) return false
      return {
        "tenants.tenant": {
          in: tenantIds,
        },
      } as any
    }
    // Editors and Contributors can only read themselves
    return {
      id: {
        equals: user.id,
      },
    } as any
  }

  return false
}

export const usersCreate: Access = ({ req: { user } }) => {
  // Anyone can sign up, hooks will sanitize values for anonymous users
  return true
}

export const usersUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    if ((user as any)?.role === "admin") {
      const tenantIds = getUserTenantIds(user)
      if (tenantIds.length === 0) return false
      return {
        and: [
          {
            "tenants.tenant": {
              in: tenantIds,
            },
          },
          {
            role: {
              not_equals: "superadmin",
            },
          },
        ],
      } as any
    }
    // Editors and Contributors can only update themselves
    return {
      id: {
        equals: user.id,
      },
    } as any
  }

  return false
}

export const usersDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user) && (user as any)?.role === "admin") {
    const tenantIds = getUserTenantIds(user)
    if (tenantIds.length === 0) return false
    return {
      and: [
        {
          "tenants.tenant": {
            in: tenantIds,
          },
        },
        {
          role: {
            not_equals: "superadmin",
          },
        },
      ],
    } as any
  }

  return false
}

// ==========================================
// 2. Pages Collection Access Policies
// ==========================================

export const pagesRead: Access = ({ req: { user } }) => {
  const publishedConstraint = {
    _status: {
      equals: "published",
    },
  }

  if (!user) return publishedConstraint as any
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const tenantIds = getUserTenantIds(user)
    if (tenantIds.length === 0) return publishedConstraint as any
    return {
      or: [
        publishedConstraint,
        {
          tenant: {
            in: tenantIds,
          },
        },
      ],
    } as any
  }

  return publishedConstraint as any
}

export const pagesCreate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const role = (user as any)?.role
    if (role === "admin" || role === "editor") {
      const tenantIds = getUserTenantIds(user)
      return tenantIds.length > 0
    }
  }

  return false
}

export const pagesUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const role = (user as any)?.role
    if (role === "admin" || role === "editor") {
      const tenantIds = getUserTenantIds(user)
      if (tenantIds.length === 0) return false
      return {
        tenant: {
          in: tenantIds,
        },
      } as any
    }
  }

  return false
}

export const pagesDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const role = (user as any)?.role
    if (role === "admin" || role === "editor") {
      const tenantIds = getUserTenantIds(user)
      if (tenantIds.length === 0) return false
      return {
        tenant: {
          in: tenantIds,
        },
      } as any
    }
  }

  return false
}

// ==========================================
// 3. Posts Collection Access Policies
// ==========================================

export const postsRead: Access = ({ req: { user } }) => {
  const publishedConstraint = {
    _status: {
      equals: "published",
    },
  }

  if (!user) return publishedConstraint as any
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const tenantIds = getUserTenantIds(user)
    if (tenantIds.length === 0) return publishedConstraint as any
    return {
      or: [
        publishedConstraint,
        {
          tenant: {
            in: tenantIds,
          },
        },
      ],
    } as any
  }

  return publishedConstraint as any
}

export const postsCreate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    return getUserTenantIds(user).length > 0
  }

  return false
}

export const postsUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const role = (user as any)?.role
    const tenantIds = getUserTenantIds(user)
    if (tenantIds.length === 0) return false

    if (role === "admin" || role === "editor") {
      return {
        tenant: {
          in: tenantIds,
        },
      } as any
    }

    if (role === "contributor") {
      return {
        and: [
          {
            tenant: {
              in: tenantIds,
            },
          },
          {
            or: [
              {
                authors: {
                  contains: user.id,
                },
              },
              {
                contributingEditors: {
                  contains: user.id,
                },
              },
            ],
          },
        ],
      } as any
    }
  }

  return false
}

export const postsDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const role = (user as any)?.role
    const tenantIds = getUserTenantIds(user)
    if (tenantIds.length === 0) return false

    if (role === "admin" || role === "editor") {
      return {
        tenant: {
          in: tenantIds,
        },
      } as any
    }

    if (role === "contributor") {
      return {
        and: [
          {
            tenant: {
              in: tenantIds,
            },
          },
          {
            authors: {
              contains: user.id,
            },
          },
        ],
      } as any
    }
  }

  return false
}

// ==========================================
// 4. Media Collection Access Policies
// ==========================================

export const mediaCreate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    return getUserTenantIds(user).length > 0
  }

  return false
}

export const mediaUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const tenantIds = getUserTenantIds(user)
    if (tenantIds.length === 0) return false
    return {
      tenant: {
        in: tenantIds,
      },
    } as any
  }

  return false
}

export const mediaDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isApproved(user)) {
    const role = (user as any)?.role
    if (role === "admin" || role === "editor") {
      const tenantIds = getUserTenantIds(user)
      if (tenantIds.length === 0) return false
      return {
        tenant: {
          in: tenantIds,
        },
      } as any
    }
  }

  return false
}
