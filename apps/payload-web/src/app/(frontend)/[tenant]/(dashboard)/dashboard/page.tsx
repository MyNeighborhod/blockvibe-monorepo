import React from "react"
import Link from "next/link"
import { getMeUser } from "@/utilities/getMeUser"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function DashboardPage({ params }: Args) {
  const { tenant: tenantSlug } = await params
  const me = await getMeUser().catch(() => null)
  const user = me?.user

  if (!user) {
    return null
  }

  const tenant = await getTenantBySlug(tenantSlug)
  const isStaff = user.role === "superadmin" || user.role === "admin" || user.role === "editor"
  const isAdmin = user.role === "superadmin" || user.role === "admin"

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Hello, {user.name || user.email}
        </h1>
        <p className="text-muted-foreground">
          Welcome to the {tenant?.name || "Neighborhood"} Organizer Portal. Manage your residents
          and activities here.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Contacts
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">--</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Directory list coming in Step 2
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Supporters
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">--</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              PayPal integration coming in Step 7
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Polls
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="m9 12 2 2 4-4" />
              <rect width="18" height="18" x="3" y="3" rx="2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">--</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Voting features coming in Step 9
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Campaigns Sent
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">--</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Email broadcaster coming in Step 4
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main layout split */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions Panel */}
        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader>
            <CardTitle className="font-sans">Quick Actions</CardTitle>
            <CardDescription>Get started with common neighborhood management tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {isStaff && (
              <Button asChild variant="outline" className="justify-start gap-2 h-11">
                <Link href={`/${tenantSlug}/dashboard/crm`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  Manage Resident Directory
                </Link>
              </Button>
            )}

            {isAdmin && (
              <>
                <Button asChild variant="outline" className="justify-start gap-2 h-11">
                  <Link href={`/${tenantSlug}/dashboard/email`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Compose Email Broadcast
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start gap-2 h-11">
                  <Link href={`/${tenantSlug}/dashboard/votes`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 12 2 2 4-4" />
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                    </svg>
                    Create a Neighborhood Poll
                  </Link>
                </Button>
              </>
            )}

            {!isStaff && !isAdmin && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No quick actions available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestone Progress Board */}
        <Card className="backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader>
            <CardTitle className="font-sans">Milestone 1 Progress</CardTitle>
            <CardDescription>Current features configuration state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Step 1: Dashboard Shell & Auth</span>
                <span className="px-2 py-0.5 rounded bg-success/20 text-success text-xs font-semibold">
                  Active
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-success h-1.5 rounded-full w-[100%]" />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Step 2: Directory & Contacts</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-semibold">
                  Pending
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-muted h-1.5 rounded-full w-0" />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Step 4: Outbound Email (SES)</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-semibold">
                  Pending
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-muted h-1.5 rounded-full w-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
