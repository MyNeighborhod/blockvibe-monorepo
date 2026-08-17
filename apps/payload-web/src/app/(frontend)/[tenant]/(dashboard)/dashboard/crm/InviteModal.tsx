"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { sendInviteAction } from "./actions"

interface InviteModalProps {
  tenantId: string | number
}

export function InviteModal({ tenantId }: InviteModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await sendInviteAction(name, email, tenantId)
      if (res.success) {
        setSuccess("Invite sent successfully!")
        setName("")
        setEmail("")
      } else {
        setError(res.error || "Failed to send invitation.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button onClick={() => setIsOpen(!isOpen)} className="font-medium">
        Invite Resident
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border border-border/80 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-lg"
            >
              ✕
            </button>
            <CardHeader>
              <CardTitle className="font-sans text-2xl">Invite Resident</CardTitle>
              <CardDescription>
                Invite a neighborhood resident to join the community portal. They will receive an
                email to choose a password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg border border-error bg-error/10 text-error text-sm font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-lg border border-success bg-success/10 text-success text-sm font-medium">
                    {success}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="inviteName">Resident Full Name</Label>
                  <Input
                    id="inviteName"
                    name="inviteName"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Resident Email Address</Label>
                  <Input
                    id="inviteEmail"
                    name="inviteEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Invite"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
