import type { User } from "@/payload-types"
import { getUserTenantIds, isSuperAdmin } from "@/access/roles"

export function assertCanManageTenantEmailSettings(
  user: User | null | undefined,
  tenantId: number,
): void {
  if (!user) {
    throw new Error("You must be logged in.")
  }
  const role = user.role
  if (role !== "admin" && role !== "superadmin") {
    throw new Error("Only neighborhood admins may manage email settings.")
  }
  if (!isSuperAdmin(user) && !getUserTenantIds(user).includes(tenantId)) {
    throw new Error("You are not authorized for this neighborhood.")
  }
}
