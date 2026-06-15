import React from "react"
import { redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function SettingsDashboardStub({ params }: Args) {
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
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Adjust neighborhood dashboard properties and access scopes.
        </p>
      </div>

      <Card className="backdrop-blur-md bg-card/60 border border-border/40">
        <CardHeader>
          <CardTitle className="font-serif">Global Configuration</CardTitle>
          <CardDescription>Step 11: Access Control Audit & Settings</CardDescription>
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Dashboard Settings Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            This workspace will host role access control auditing, domain mapping, and theme
            preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
