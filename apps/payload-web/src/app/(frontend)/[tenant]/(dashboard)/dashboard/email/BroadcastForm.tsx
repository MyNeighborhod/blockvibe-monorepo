"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { sendBroadcastAction } from "./actions"

interface Resident {
  id: number
  name?: string | null
  email: string
  role?: string | null
}

interface BroadcastFormProps {
  residents: Resident[]
  tenantId: string | number
}

export function BroadcastForm({ residents, tenantId }: BroadcastFormProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleToggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    )
  }

  const handleToggleAll = () => {
    if (selectedEmails.length === residents.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(residents.map((r) => r.email))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await sendBroadcastAction(selectedEmails, subject, message, tenantId)
      if (res.success) {
        setSuccess(`Communication sent successfully to ${res.count} residents!`)
        setSubject("")
        setMessage("")
        setSelectedEmails([])
      } else {
        setError(res.error || "Failed to send communication.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Recipient Selection */}
        <Card className="md:col-span-1 backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Select Residents</CardTitle>
            <CardDescription>Choose which community residents will receive this broadcast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedEmails.length} selected / {residents.length} total
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggleAll}
                className="text-xs text-primary hover:underline h-auto p-0"
              >
                {selectedEmails.length === residents.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {residents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No residents found.</p>
              ) : (
                residents.map((resident) => {
                  const isChecked = selectedEmails.includes(resident.email)
                  return (
                    <div
                      key={resident.email}
                      className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${
                        isChecked ? "bg-primary/5 border-primary/20" : "bg-transparent border-border/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`resident-checkbox-${resident.email}`}
                        checked={isChecked}
                        onChange={() => handleToggleEmail(resident.email)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor={`resident-checkbox-${resident.email}`}
                        className="flex flex-col gap-0.5 cursor-pointer text-sm font-normal text-foreground select-none flex-1"
                      >
                        <span className="font-medium text-foreground">{resident.name || "Unnamed Resident"}</span>
                        <span className="text-xs text-muted-foreground">{resident.email}</span>
                      </Label>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column: Subject & Message Composer */}
        <Card className="md:col-span-2 backdrop-blur-md bg-card/60 border border-border/40">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Compose Announcement</CardTitle>
            <CardDescription>Write the subject and message body for the email campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-subject">Subject</Label>
              <Input
                id="broadcast-subject"
                placeholder="Important Neighborhood Update"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-message">Message Content</Label>
              <textarea
                id="broadcast-message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={10}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
            <Button type="submit" disabled={loading || selectedEmails.length === 0} className="font-medium">
              {loading ? "Sending Broadcast..." : "Send Communication"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
