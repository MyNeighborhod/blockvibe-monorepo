"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error("Sign-out failed:", err)
      setLoggingOut(false)
    }
  }

  return (
    <Button type="button" onClick={handleLogout} disabled={loggingOut} className={className}>
      {loggingOut ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
