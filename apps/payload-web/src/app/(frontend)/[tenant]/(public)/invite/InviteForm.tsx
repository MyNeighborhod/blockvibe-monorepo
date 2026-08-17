"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
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
import { acceptInviteAction } from "./actions"

interface InviteFormProps {
  inviteId: string | number
  initialName: string
  email: string
}

export function InviteForm({ inviteId, initialName, email }: InviteFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create approved user and accept invite
      const res = await acceptInviteAction(name, password, inviteId)
      if (!res.success) {
        throw new Error(res.error || "Failed to process invitation acceptance.")
      }

      // 2. Perform client login to establish standard session cookies
      const loginResponse = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginResponse.json()
      if (!loginResponse.ok) {
        throw new Error(
          loginData.errors?.[0]?.message || "Failed to establish session after acceptance.",
        )
      }

      // 3. Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred.")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <span className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold font-serif text-xl shadow-md">
            B
          </span>
        </div>
        <CardTitle className="text-3xl font-serif tracking-tight">Accept Invitation</CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Create your account password to join the neighborhood portal
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg border border-error bg-error/10 text-error text-sm font-medium animate-pulse">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted text-muted-foreground border-border/40 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Doe"
              className="bg-background/50 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Choose Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 focus-visible:ring-primary"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full py-6 text-sm font-medium transition-all"
            disabled={loading}
          >
            {loading ? "Completing Setup..." : "Accept Invitation"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
