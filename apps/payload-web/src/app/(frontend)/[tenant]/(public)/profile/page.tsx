import React from "react"
import { redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SignOutButton } from "@/components/SignOutButton"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function ProfilePage({ params }: Args) {
  const { tenant: tenantSlug } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  return (
    <div className="min-h-screen py-24 flex items-center justify-center bg-radial from-background to-muted/30 p-4 md:p-8 animate-fade-in">
      <Card className="w-full max-w-md backdrop-blur-md bg-card/65 border border-border/40 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 font-serif text-2xl font-bold shadow-inner">
            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <CardTitle className="font-serif text-2xl">
            {user.name || "Neighborhood Member"}
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Membership Dues & Yearly Expiration Banner */}
          {(() => {
            const expirationDate = (user as any)?.membershipExpiresAt
              ? new Date((user as any).membershipExpiresAt)
              : new Date(new Date(user.createdAt || Date.now()).getTime() + 365 * 24 * 60 * 60 * 1000)
            
            const isExpired = Date.now() > expirationDate.getTime()
            const formattedDate = expirationDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })

            return (
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Annual Dues
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    isExpired ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {isExpired ? "Expired" : "Active"}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-300">
                  Membership dues yearly expiration on: <strong className="text-emerald-400 block text-sm mt-0.5 font-bold">{formattedDate}</strong>
                </div>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-xs rounded-lg shadow">
                  <Link href={`/membership/signup?intent=renewal&email=${encodeURIComponent(user.email)}`}>
                    🔄 Renew Membership Dues
                  </Link>
                </Button>
              </div>
            )
          })()}

          <div className="rounded-lg bg-muted/40 p-4 border border-border/20 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Role:</span>
              <span className="font-semibold capitalize text-foreground">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approval Status:</span>
              <span className="px-2.5 py-0.5 rounded bg-success/20 text-success text-xs font-bold capitalize">
                {user.status}
              </span>
            </div>
            {user.isNeighbor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Community Badge:</span>
                <span className="px-2.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold capitalize">
                  Neighbor
                </span>
              </div>
            )}
            {(user as any).household && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Household:</span>
                <span className="font-semibold text-foreground">{(user as any).household}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="text-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "--"}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <SignOutButton className="w-full py-6 text-sm font-semibold transition-all shadow-md bg-primary hover:bg-primary/95 text-primary-foreground" />

            {(user.role === "superadmin" || user.role === "admin" || user.role === "editor") && (
              <Button
                asChild
                variant="outline"
                className="w-full py-6 text-sm font-semibold transition-all border-border hover:bg-muted/50"
              >
                <Link href={`/${tenantSlug}/dashboard`}>Go to Admin Dashboard</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
