import React from "react"
import { redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function FundraisingDashboardStub({ params }: Args) {
  const { tenant: tenantSlug } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  const allowedRoles = ["superadmin", "admin"]
  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(`/dashboard`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">
          Fundraising & Support
        </h1>
        <p className="text-muted-foreground">
          Manage your supporter accounts and view community funding targets.
        </p>
      </div>

      <Card className="backdrop-blur-md bg-card/60 border border-border/40">
        <CardHeader>
          <CardTitle className="font-sans">Supporter Status</CardTitle>
          <CardDescription>Step 7: Fundraising Tiers & PayPal Connection</CardDescription>
        </CardHeader>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Fundraising Status Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            This workspace will host supporter tier assignments, PayPal account configuration, and
            return URLs in Step 7.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
