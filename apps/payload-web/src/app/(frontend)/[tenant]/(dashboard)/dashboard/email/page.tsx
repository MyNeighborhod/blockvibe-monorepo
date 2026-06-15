import { redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function EmailDashboardStub({ params }: Args) {
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
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Email Broadcaster
        </h1>
        <p className="text-muted-foreground">
          Send custom news, announcements, or notifications to residents.
        </p>
      </div>

      <Card className="backdrop-blur-md bg-card/60 border border-border/40">
        <CardHeader>
          <CardTitle className="font-serif">Campaign Composer</CardTitle>
          <CardDescription>Step 4: Email Composer (Single, Group, Broadcast)</CardDescription>
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
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Email Broadcaster Feature Coming Soon
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            This workspace will host the slide-out compose drawer, AWS SES integration, and
            anti-spam verification in Step 4.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
