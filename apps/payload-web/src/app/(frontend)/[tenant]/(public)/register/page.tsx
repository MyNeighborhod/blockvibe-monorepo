"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tenantId, setTenantId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Resolve tenant ID on mount to ensure local/prod registration mapping is rock solid
  useEffect(() => {
    async function fetchTenant() {
      try {
        const response = await fetch(`/api/tenants?where[slug][equals]=${tenant}`)
        if (response.ok) {
          const data = await response.json()
          if (data.docs?.length > 0) {
            setTenantId(data.docs[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to prefetch tenant details:", err)
      }
    }
    if (tenant) {
      fetchTenant()
    }
  }, [tenant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: Record<string, any> = {
        name,
        email,
        password,
      }

      // If we resolved a tenant ID, pass it to ensure localhost/subdomain fallback is handled
      if (tenantId) {
        payload.tenants = [{ tenant: tenantId }]
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || "Registration failed. Please try again.")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-background to-muted/30 p-4 md:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10 text-center py-6">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center text-2xl font-bold animate-bounce">
                ✓
              </div>
            </div>
            <CardTitle className="text-3xl font-serif">Registration Successful!</CardTitle>
            <CardDescription className="text-muted-foreground/80 mt-2">
              Your account has been successfully created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To keep our neighborhood community secure, all new registrations are placed in a
              staging area for review.
              <strong> An administrator from the board will approve your access shortly.</strong>
            </p>
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

      <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <span className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold font-serif text-xl shadow-md">
              B
            </span>
          </div>
          <CardTitle className="text-3xl font-serif tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Join your neighborhood&apos;s digital platform
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg border border-error bg-error/10 text-error text-sm font-medium leading-normal animate-pulse"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background/50 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full py-6 text-sm font-medium transition-all"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
