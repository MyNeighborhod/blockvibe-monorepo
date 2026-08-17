import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Broadcast } from "@/payload-types"

function parseFailedEmails(value: Broadcast["failedEmails"]): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((email): email is string => typeof email === "string")
  }
  return []
}

function statusLabel(status: Broadcast["status"]): string {
  switch (status) {
    case "queued":
      return "Queued"
    case "processing":
      return "Processing"
    case "completed":
      return "Completed"
    case "partial":
      return "Partially failed"
    case "failed":
      return "Failed"
    default:
      return status || "Unknown"
  }
}

function statusClass(status: Broadcast["status"]): string {
  switch (status) {
    case "completed":
      return "text-green-700 bg-green-50 border-green-200"
    case "partial":
      return "text-amber-800 bg-amber-50 border-amber-200"
    case "failed":
      return "text-red-700 bg-red-50 border-red-200"
    case "queued":
    case "processing":
      return "text-blue-700 bg-blue-50 border-blue-200"
    default:
      return "text-muted-foreground bg-muted border-border"
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

interface BroadcastStatusLogProps {
  broadcasts: Broadcast[]
}

export function BroadcastStatusLog({ broadcasts }: BroadcastStatusLogProps) {
  if (broadcasts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery log</CardTitle>
          <CardDescription>No broadcasts sent yet for this neighborhood.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery log</CardTitle>
        <CardDescription>
          Per-send delivery results for this neighborhood, including failed addresses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {broadcasts.map((broadcast) => {
          const failedEmails = parseFailedEmails(broadcast.failedEmails)
          const recipientTotal = Array.isArray(broadcast.recipients)
            ? broadcast.recipients.length
            : 0

          return (
            <div key={broadcast.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{broadcast.subject}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(broadcast.createdAt)}</p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass(broadcast.status)}`}
                >
                  {statusLabel(broadcast.status)}
                </span>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Delivery</span>
                  <p className="font-medium uppercase">{broadcast.delivery}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Recipients</span>
                  <p className="font-medium">{recipientTotal}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sent</span>
                  <p className="font-medium text-green-700">{broadcast.sentCount ?? 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Failed</span>
                  <p className="font-medium text-red-700">{broadcast.failedCount ?? 0}</p>
                </div>
              </div>

              {failedEmails.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">Failed addresses</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {failedEmails.map((email) => (
                      <li key={email} className="font-mono break-all">
                        {email}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
