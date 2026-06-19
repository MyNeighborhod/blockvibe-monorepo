import React from "react"
import { notFound, redirect } from "next/navigation"
import { getMeUser } from "@/utilities/getMeUser"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { ChatInterface } from "./ChatInterface"

type Args = {
  params: Promise<{
    tenant: string
  }>
}

export default async function ChatDashboard({ params }: Args) {
  const { tenant: tenantSlug } = await params

  // Verify the user is logged in
  const { user } = await getMeUser({
    nullUserRedirect: `/login`,
  })

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) {
    notFound()
  }

  // Get the chat service URL from environment (fallback to localhost:4002)
  const chatServiceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">
          Platform AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Ask questions about the BlockVibe platform, configuration, and site management. Paste screenshots directly into the chat for troubleshooting support.
        </p>
      </div>

      <div className="flex-1 min-h-[500px]">
        <ChatInterface chatServiceUrl={chatServiceUrl} />
      </div>
    </div>
  )
}
