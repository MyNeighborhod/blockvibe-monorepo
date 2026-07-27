import { getPayload } from "payload"
import configPromise from "@payload-config"
import type { Where } from "payload"
import type { User } from "../payload-types"

/**
 * Compiles a list of CRM dynamic rules into a Payload Where query.
 * Supported operators: equals, not_equals, contains, exists, not_exists
 */
export function compileRulesToQuery(rules: any[]): Where {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return {}
  }

  const andConditions: Where[] = []

  for (const rule of rules) {
    const { field, operator, value } = rule
    if (!field || !operator) continue

    const condition: any = {}

    // Translate UI operators to Payload Where operators
    switch (operator) {
      case "equals":
        let typedValue: any = value
        if (value === "true") typedValue = true
        if (value === "false") typedValue = false
        condition[field] = { equals: typedValue }
        break
      case "not_equals":
        let typedNotValue: any = value
        if (value === "true") typedNotValue = true
        if (value === "false") typedNotValue = false
        condition[field] = { not_equals: typedNotValue }
        break
      case "contains":
        condition[field] = { contains: value }
        break
      case "exists":
        condition[field] = { exists: true }
        break
      case "not_exists":
        condition[field] = { exists: false }
        break
      default:
        condition[field] = { equals: value }
        break
    }

    andConditions.push(condition)
  }

  if (andConditions.length === 0) {
    return {}
  }

  if (andConditions.length === 1) {
    return andConditions[0]
  }

  return {
    and: andConditions,
  }
}

/**
 * Resolves all eligible users for a given Mailing List.
 * Filters out unsubscribed users and ensures they are associated with the tenant.
 */
export async function evaluateMailingList(
  mailingListId: string | number,
  tenantId: number
): Promise<User[]> {
  const payload = await getPayload({ config: configPromise })

  // 1. Fetch the mailing list
  const list = await payload.findByID({
    collection: "mailing-lists",
    id: mailingListId,
    depth: 1,
  })

  if (!list) {
    throw new Error("Mailing list not found.")
  }

  // Double check tenant match
  const listTenantId = typeof list.tenant === "object" && list.tenant !== null ? list.tenant.id : list.tenant
  if (listTenantId !== tenantId) {
    throw new Error("Unauthorized: Mailing list belongs to a different neighborhood.")
  }

  if (list.type === "static") {
    // Static list: resolve members directly
    const members = list.members || []
    const userIds = members.map((m: any) => typeof m === "object" && m !== null ? m.id : m)

    if (userIds.length === 0) {
      return []
    }

    // Query the users to verify they are active, subscribed, and belong to this tenant
    const usersResult = await payload.find({
      collection: "users",
      where: {
        id: { in: userIds },
        "tenants.tenant": { equals: tenantId },
        unsubscribed: { not_equals: true },
      },
      limit: 1000,
    })

    return usersResult.docs as User[]
  } else {
    // Dynamic list: evaluate rules and query users
    const rules = (list.rules as any[]) || []
    const rulesQuery = compileRulesToQuery(rules)

    // Merge with tenant check and unsubscribe suppression
    const finalQuery: Where = {
      and: [
        {
          "tenants.tenant": { equals: tenantId },
        },
        {
          unsubscribed: { not_equals: true },
        },
        rulesQuery,
      ],
    }

    const usersResult = await payload.find({
      collection: "users",
      where: finalQuery,
      limit: 1000,
    })

    return usersResult.docs as User[]
  }
}
