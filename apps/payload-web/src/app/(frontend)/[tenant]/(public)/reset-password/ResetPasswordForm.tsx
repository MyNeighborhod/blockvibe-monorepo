"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is missing or invalid. Request a new link from the sign-in page.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || data.error || "Failed to reset password.")
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md backdrop-blur-md bg-card/75 border border-border/40 shadow-2xl relative z-10">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-serif tracking-tight">Set a new password</CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Choose a new password for your account
        </CardDescription>
      </CardHeader>
      {success ? (
        <CardContent className="text-center space-y-4">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            Your password has been updated. Redirecting to sign in…
          </p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg border border-error bg-error/10 text-error text-sm font-medium"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="bg-background/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full py-6" disabled={loading}>
              {loading ? "Updating…" : "Update Password"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Back to Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
