import { redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function VotesDashboardStub({ params }: Args) {
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
          Voting & Polls
        </h1>
        <p className="text-muted-foreground">
          Participate in neighborhood surveys, board votes, or budget polls.
        </p>
      </div>

      <Card className="backdrop-blur-md bg-card/60 border border-border/40">
        <CardHeader>
          <CardTitle className="font-serif">Active Ballots</CardTitle>
          <CardDescription>Step 9: Polls (Create & Vote)</CardDescription>
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
              <path d="m9 12 2 2 4-4" />
              <rect width="18" height="18" x="3" y="3" rx="2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Voting & Polls Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            This workspace will render active questionnaires, radio ballot inputs, and results
            telemetry in Step 9.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
