"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { sendBroadcastAction, uploadBroadcastImageAction } from "./actions"
import { DEFAULT_BROADCAST_MESSAGE_HTML } from "./broadcastDefaults"
import { RichTextEditor } from "@/components/RichTextEditor"

import type { EmailDeliveryMethod } from "@/utilities/gmailOAuth"

interface Resident {
  id: number
  name?: string | null
  email: string
  role?: string | null
}

interface BroadcastFormProps {
  residents: Resident[]
  tenantId: string | number
  gmailConnected: boolean
  defaultDelivery: EmailDeliveryMethod
}

export function BroadcastForm({
  residents,
  tenantId,
  gmailConnected,
  defaultDelivery,
}: BroadcastFormProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState(DEFAULT_BROADCAST_MESSAGE_HTML)
  const [delivery, setDelivery] = useState<EmailDeliveryMethod>(defaultDelivery)
  const [skipGmailSentFolder, setSkipGmailSentFolder] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("tenantId", String(tenantId))

    const res = await uploadBroadcastImageAction(formData)
    if (!res.success) {
      throw new Error(res.error || "Failed to upload image.")
    }

    return res.url
  }

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
      const res = await sendBroadcastAction(
        selectedEmails,
        subject,
        message,
        tenantId,
        delivery,
        skipGmailSentFolder
      )
      if (res.success) {
        const count = res.count
        if ("queued" in res && res.queued) {
          setSuccess(
            `Broadcast queued for ${count} recipient${count === 1 ? "" : "s"}. Check the delivery log for results.`
          )
        } else if ("failedCount" in res && res.failedCount && res.failedCount > 0) {
          const sentCount = "sentCount" in res ? res.sentCount ?? count : count
          setSuccess(
            `Sent ${sentCount} of ${count}. ${res.failedCount} failed — see delivery log.`
          )
        } else {
          setSuccess(
            `Communication sent successfully to ${count} residents via ${delivery === "gmail" ? "Gmail" : "SES"}!`
          )
        }
        setSubject("")
        setMessage(DEFAULT_BROADCAST_MESSAGE_HTML)
        setSelectedEmails([])
        window.location.reload()
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
            <CardTitle className="font-sans text-lg">Select Residents</CardTitle>
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
            <CardTitle className="font-sans text-lg">Compose Announcement</CardTitle>
            <CardDescription>Write the subject and message body for the email campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 pb-4 border-b border-border/40">
              <Label>Send via</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery === "ses"}
                    onChange={() => setDelivery("ses")}
                  />
                  Platform (SES)
                </label>
                <label
                  className={`flex items-center gap-2 text-sm ${gmailConnected ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery === "gmail"}
                    disabled={!gmailConnected}
                    onChange={() => setDelivery("gmail")}
                  />
                  Neighborhood Gmail
                </label>
              </div>
              {!gmailConnected && (
                <p className="text-xs text-muted-foreground">
                  <Link href="/dashboard/settings" className="text-primary hover:underline">
                    Connect Gmail in Settings
                  </Link>{" "}
                  to enable this option.
                </p>
              )}
              {delivery === "gmail" && gmailConnected && (
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="skip-gmail-sent"
                    checked={skipGmailSentFolder}
                    onCheckedChange={(checked) => setSkipGmailSentFolder(checked === true)}
                  />
                  <Label htmlFor="skip-gmail-sent" className="text-sm font-normal leading-snug cursor-pointer">
                    Don&apos;t save to Gmail Sent folder
                    <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                      Recipients still receive the email. Reconnect Gmail in Settings if this fails after a scope
                      update.
                    </span>
                  </Label>
                </div>
              )}
            </div>
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
              <p className="text-xs text-muted-foreground">
                The default heading is editable — delete or replace it if you prefer a different title.
              </p>
              <RichTextEditor
                id="broadcast-message"
                value={message}
                onChange={setMessage}
                placeholder="Write your message below the heading..."
                uploadImage={handleUploadImage}
                onUploadError={setError}
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
