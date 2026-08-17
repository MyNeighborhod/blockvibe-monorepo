import React from "react"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { InviteForm } from "./InviteForm"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type PageProps = {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InvitePage({ params, searchParams }: PageProps) {
  const { tenant } = await params
  const { token } = await searchParams

  let invite: any = null
  let errorMessage: string | null = null

  if (!token || typeof token !== "string") {
    errorMessage = "Missing or invalid invitation token."
  } else {
    try {
      console.log("INVITE PAGE DEBUG: token =", token)
      const payload = await getPayload({ config: configPromise })
      const result = await payload.find({
        collection: "invites",
        where: {
          and: [{ token: { equals: token } }, { status: { equals: "pending" } }],
        },
        limit: 1,
        overrideAccess: true,
      })
      console.log("INVITE PAGE DEBUG: result docs length =", result.docs.length)
      if (result.docs.length > 0) {
        console.log("INVITE PAGE DEBUG: found invite doc =", result.docs[0])
        invite = result.docs[0]
      } else {
        errorMessage = `This invitation is invalid, has expired, or has already been accepted. (Token: ${token}, Found: ${result.docs.length})`
      }
    } catch (err: any) {
      console.error("Failed to look up invitation:", err)
      errorMessage = `An error occurred while verifying the invitation: ${err.message || err}`
    }
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-background to-muted/30 p-4 md:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10 text-center py-6">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xl font-bold">
                ✕
              </div>
            </div>
            <CardTitle className="text-3xl font-serif">Invitation Error</CardTitle>
            <CardDescription className="text-muted-foreground/80 mt-2">
              Unable to proceed with setup
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full py-6">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-background to-muted/30 p-4 md:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <InviteForm inviteId={invite.id} initialName={invite.name} email={invite.email} />
    </div>
  )
}
