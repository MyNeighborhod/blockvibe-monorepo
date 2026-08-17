"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/utilities/ui"

interface TopUtilityBarProps {
  overDarkHero?: boolean
  className?: string
}

export function TopUtilityBar({ overDarkHero = false, className }: TopUtilityBarProps) {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      })
      .catch(() => setUser(null))
  }, [pathname])

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch("/api/users/logout", { method: "POST" })
      setUser(null)
      router.push("/")
      router.refresh()
    } catch {
      window.location.href = "/logout"
    }
  }

  const textColor = overDarkHero
    ? "text-white/90 hover:text-white"
    : "text-[#484848] hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
  const dividerColor = overDarkHero ? "text-white/40" : "text-slate-300 dark:text-slate-600"

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider select-none",
        className,
      )}
    >
      {user ? (
        <>
          <Link
            href="/dashboard"
            className={cn("transition-colors flex items-center gap-1.5 no-underline", textColor)}
          >
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </span>
            <span>My Dashboard</span>
          </Link>
          <span className={dividerColor}>|</span>
          <button
            type="button"
            onClick={handleLogout}
            className={cn("transition-colors cursor-pointer bg-transparent border-0 p-0 font-semibold no-underline", textColor)}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={cn("transition-colors no-underline", textColor)}>
            Login
          </Link>
          <span className={dividerColor}>|</span>
          <Link href="/membership/signup" className={cn("transition-colors no-underline", textColor)}>
            Sign Up
          </Link>
        </>
      )}
    </div>
  )
}
