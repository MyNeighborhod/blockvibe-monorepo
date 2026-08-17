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

  // 2. Non-staff or non-business users belong on profile, not the dashboard
  const isAuthorized =
    user.role === "superadmin" ||
    user.role === "admin" ||
    user.role === "editor" ||
    user.memberType === "business"

  if (!isAuthorized) {
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

  // 5. Security validation: Ensure user has access to this tenant if not superadmin
  if (user.role !== "superadmin") {
    const userTenantIds = getUserTenantIds(user)
    if (!userTenantIds.includes(tenant.id)) {
      redirect(`/login`)
    }
  }

  const instanceColor = process.env.APP_INSTANCE_COLOR || "LOCAL / STANDALONE"
  const isBlue = instanceColor.toUpperCase() === "BLUE"
  const isGreen = instanceColor.toUpperCase() === "GREEN"

  return (
    <div data-dashboard className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      <DashboardSidebar user={user} tenantSlug={tenantSlug} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardNavbar user={user} tenant={tenant} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/10 relative flex flex-col justify-between">
          <div>{children}</div>
          
          {/* Admin Instance Indicator at bottom of dashboard */}
          <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>BlockVibe Multi-Tenant Platform</div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                isBlue
                  ? "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                  : isGreen
                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              }`}
            >
              <span className="animate-pulse">⚡</span> Active Instance: {instanceColor}
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
