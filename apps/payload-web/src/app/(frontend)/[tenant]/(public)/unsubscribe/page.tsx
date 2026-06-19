"use client"

import React, { useEffect, useState, use } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { unsubscribeAction } from "./actions"

type PageProps = {
  params: Promise<{
    tenant: string
  }>
}

export default function UnsubscribePage({ params }: PageProps) {
  const { tenant } = use(params)
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function performUnsubscribe() {
      if (!email || !token) {
        setError("Invalid unsubscribe link. Missing email or token.")
        setLoading(false)
        return
      }

      try {
        const result = await unsubscribeAction(email, token)
        if (result.success) {
          setSuccess(true)
        } else {
          setError(result.error || "Failed to unsubscribe.")
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    performUnsubscribe()
  }, [email, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-background to-muted/30 p-4 md:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10 text-center py-6">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {loading && (
              <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            )}
            {!loading && success && (
              <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center text-2xl font-bold animate-bounce">
                ✓
              </div>
            )}
            {!loading && error && (
              <div className="h-12 w-12 rounded-full bg-error/20 text-error flex items-center justify-center text-2xl font-bold">
                ✕
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-serif">
            {loading
              ? "Processing Request"
              : success
                ? "Unsubscribed Successfully"
                : "Unable to Unsubscribe"}
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 mt-2">
            {loading
              ? "We are processing your opt-out request..."
              : success
                ? "You will no longer receive broadcast emails from this neighborhood."
                : "We encountered an error processing your unsubscribe request."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-8">
          {loading && (
            <p className="text-sm text-muted-foreground">
              Please wait while we update your preferences in our neighborhood registry.
            </p>
          )}
          {!loading && success && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your email <strong className="text-foreground">{email}</strong> has been removed from
              our active announcement list.
            </p>
          )}
          {!loading && error && (
            <div className="p-3.5 rounded-lg border border-error bg-error/10 text-error text-sm font-medium leading-normal">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {!loading && success && email && token && (
            <Button asChild variant="outline" className="w-full py-6">
              <Link
                href={`/resubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`}
              >
                Resubscribe to Emails
              </Link>
            </Button>
          )}
          <Button asChild className="w-full py-6">
            <Link href={`/${tenant}`}>Go to Neighborhood Homepage</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
