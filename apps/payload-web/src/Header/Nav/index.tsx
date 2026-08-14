"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, SearchIcon, X } from "lucide-react"

import type { Header as HeaderType } from "@/payload-types"

import { CMSLink } from "@/components/Link"
import { cn } from "@/utilities/ui"

import { TopUtilityBar } from "@/components/TopUtilityBar"

type HeaderNavProps = {
  data: HeaderType
  variant?: "default" | "nog"
  logoUrl?: string | null
  tenantName?: string
  overDarkHero?: boolean
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  data,
  variant = "default",
  logoUrl,
  tenantName,
  overDarkHero = false,
}) => {
  const navItems = data?.navItems || []
  const isNog = variant === "nog"
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isNog) return

    const mediaQuery = window.matchMedia("(width >= 48rem)")
    const closeOnDesktop = () => {
      if (mediaQuery.matches) setIsMenuOpen(false)
    }

    mediaQuery.addEventListener("change", closeOnDesktop)
    return () => mediaQuery.removeEventListener("change", closeOnDesktop)
  }, [isNog])

  useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => { })
  }, [pathname])

  const authButton = user ? (
    <Link
      href="/dashboard"
      className={cn(
        "nav-link inline-flex items-center gap-1.5 font-bold tracking-wider text-[11px] uppercase transition-all",
        isNog ? "text-[#484848] hover:text-indigo-600" : "text-primary"
      )}
    >
      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
      </span>
      <span>MY DASHBOARD</span>
    </Link>
  ) : (
    <Link
      href="/login"
      className={cn(
        "nav-link inline-flex items-center gap-1 font-bold tracking-wider text-[11px] uppercase px-3 py-1.5 rounded-lg border transition-all",
        isNog
          ? "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          : "border-primary text-primary"
      )}
    >
      <span>LOGIN / SIGN UP</span>
    </Link>
  )

  const links = [
    ...navItems.map(({ link }, i) =>
      isNog ? (
        <li key={i}>
          <CMSLink {...link} appearance="inline" className="nav-link" matchActive />
        </li>
      ) : (
        <CMSLink key={i} {...link} appearance="link" />
      ),
    ),
  ]

  const search = (
    <Link href="/search" className="nav-search shrink-0" aria-label="Search">
      <SearchIcon className={isNog ? "w-5" : "w-5 text-primary"} />
    </Link>
  )

  if (isNog) {
    return (
      <>
        {/* Mobile: hamburger + centered logo */}
        <div className="nog-mobile-header">
          <button
            type="button"
            className="nog-mobile-menu-trigger"
            onClick={() => setIsMenuOpen(true)}
            aria-expanded={isMenuOpen}
            aria-controls="nog-mobile-drawer"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>

          <Link href="/" className="nog-mobile-logo">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenantName || "North Of Grand"}
                className="max-h-16 w-auto object-contain"
                loading="eager"
              />
            ) : (
              <span
                className={cn(
                  "font-serif text-xl font-bold tracking-widest no-underline",
                  overDarkHero ? "text-white" : "text-[#76b3b8]",
                )}
              >
                North Of Grand
              </span>
            )}
          </Link>

          <div className="nog-mobile-header-spacer" aria-hidden="true" />
        </div>

        {/* Desktop nav */}
        <div className="nog-nav-bar">
          <nav className="nog-nav">
            <ul>{links}</ul>
          </nav>
          {search}
        </div>

        {/* Mobile drawer */}
        {isMenuOpen && (
          <div className="nog-mobile-menu">
            <button
              type="button"
              className="nog-mobile-overlay"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            />
            <nav id="nog-mobile-drawer" className="nog-mobile-drawer" aria-label="Site navigation">
              <div className="nog-mobile-drawer-header">
                <button
                  type="button"
                  className="nog-mobile-menu-close"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </div>
              <ul>{links}</ul>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <TopUtilityBar />
              </div>
              <div className="nog-mobile-drawer-search">{search}</div>
            </nav>
          </div>
        )}
      </>
    )
  }

  return (
    <nav className="flex gap-3 items-center">
      {links}
      {search}
    </nav>
  )
}
