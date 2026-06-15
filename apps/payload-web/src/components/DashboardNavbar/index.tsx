"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import type { User, Tenant } from "@/payload-types"
import { Button } from "@/components/ui/button"

interface DashboardNavbarProps {
  user: User
  tenant: Tenant
}

export function DashboardNavbar({ user, tenant }: DashboardNavbarProps) {
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

  // Helper to get initials
  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  // Format role label
  const formatRole = (role?: string | null) => {
    if (!role) return "Member"
    if (role === "superadmin") return "Super Admin"
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <header className="h-16 border-b border-border bg-card/45 backdrop-blur-md flex items-center justify-between px-6 select-none relative z-25">
      {/* Left side: Tenant Identity */}
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-lg font-semibold text-foreground tracking-tight">
          {tenant.name || "Neighborhood Portal"}
        </h2>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          {tenant.slug}
        </span>
      </div>

      {/* Right side: User Profile & Actions */}
      <div className="flex items-center gap-4">
        {/* User Info Capsule */}
        <div className="flex items-center gap-3 px-1 py-1 sm:pr-3 rounded-full bg-muted/30 border border-border/30">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold font-mono">
            {getInitials(user.name)}
          </div>
          <div className="hidden sm:block text-left leading-none">
            <p className="text-xs font-semibold text-foreground">{user.name || user.email}</p>
            <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
              {formatRole(user.role)}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          disabled={loggingOut}
          className="text-xs h-9 font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          {loggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </header>
  )
}
