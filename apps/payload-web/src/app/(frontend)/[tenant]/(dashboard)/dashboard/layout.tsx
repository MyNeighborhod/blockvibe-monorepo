import React from "react"
import { redirect, notFound } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { getUserTenantIds } from "@/access/roles"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { DashboardNavbar } from "@/components/DashboardNavbar"

type Args = {
  children: React.ReactNode
  params: Promise<{
    tenant: string
  }>
}

export default async function DashboardLayout({ children, params }: Args) {
  const { tenant: tenantSlug } = await params

  // 1. Authenticate user, redirecting to login if missing session
  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  // 2. Non-staff users belong on profile, not the admin dashboard (check before approval
  // logout paths so parallel RSC requests do not clear valid contributor sessions)
  const isStaff = user.role === "superadmin" || user.role === "admin" || user.role === "editor"
  if (!isStaff) {
    redirect(`/profile`)
  }

  // 3. Security validation: Ensure user is approved
  const isApprovedUser = user.role === "superadmin" || user.status === "approved"
  if (!isApprovedUser) {
    redirect(`/login`)
  }

  // 4. Resolve tenant details
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) {
    notFound()
  }

  // 4. Security validation: Ensure user has access to this tenant if not superadmin
  if (user.role !== "superadmin") {
    const userTenantIds = getUserTenantIds(user)
    if (!userTenantIds.includes(tenant.id)) {
      redirect(`/login`)
    }
  }

  return (
    <div data-dashboard className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      <DashboardSidebar user={user} tenantSlug={tenantSlug} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardNavbar user={user} tenant={tenant} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/10 relative">{children}</main>
      </div>
    </div>
  )
}
