import React from "react"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { notFound, redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteModal } from "./InviteModal"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function CRMDashboard({ params }: Args) {
  const { tenant: tenantSlug } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  const allowedRoles = ["superadmin", "admin", "editor"]
  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(`/dashboard`)
  }

  const tenant = await getTenantBySlug(tenantSlug)

  if (!tenant) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Resident Directory
          </h1>
          <p className="text-muted-foreground">
            Manage neighborhood residents, business logs, and registration tags.
          </p>
        </div>
        <InviteModal tenantId={tenant.id} />
      </div>

      <Card className="backdrop-blur-md bg-card/60 border border-border/40">
        <CardHeader>
          <CardTitle className="font-serif">Directory List</CardTitle>
          <CardDescription>Step 2: Contacts Collection & Directory List</CardDescription>
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">CRM Feature Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            This workspace will host the interactive contacts lookup, pagination grid, and search
            filters in the next implementation step.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
