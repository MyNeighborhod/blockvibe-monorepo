"use client"
import { useHeaderTheme } from "@/providers/HeaderTheme"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useEffect, useState } from "react"

import type { Header } from "@/payload-types"

import { Logo } from "@/components/Logo/Logo"
import { shouldUseNogChrome } from "@/utilities/resolveTenantSlug"
import { cn } from "@/utilities/ui"
import { HeaderNav } from "./Nav"

interface HeaderClientProps {
  data: Header
  tenant: any
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, tenant }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  const isNog = shouldUseNogChrome(tenant)
  const logoImage = (data as any)?.logoImage
  const logoUrl = logoImage && typeof logoImage === "object" ? logoImage.url : null
  const overDarkHero = theme === "dark"

  if (isNog) {
    return (
      <header
        className={cn(
          "container z-20 w-full",
          overDarkHero ? "absolute inset-x-0 top-0 mx-auto pt-6" : "relative pt-8",
        )}
        {...(overDarkHero ? { "data-theme": "dark" } : theme ? { "data-theme": theme } : {})}
      >
        <div className="flex flex-col items-center">
          {logoUrl ? (
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={tenant?.name || "North Of Grand"}
                className="max-h-28 w-auto object-contain mb-2"
                loading="eager"
              />
            </Link>
          ) : (
            <Link
              href="/"
              className={cn(
                "font-serif text-3xl font-bold tracking-widest mb-2 no-underline",
                overDarkHero ? "text-white" : "text-[#76b3b8]",
              )}
            >
              North Of Grand
            </Link>
          )}
          <div className="w-full border-t border-b border-[#e2e8f0] py-2 mt-4 flex justify-center">
            <HeaderNav data={data} />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="container relative z-20" {...(theme ? { "data-theme": theme } : {})}>
      <div className="py-8 flex items-center justify-between">
        <Link href="/">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={tenant?.name || "Logo"}
              className="max-h-12 w-auto object-contain"
              loading="eager"
            />
          ) : tenant?.slug === "default" ? (
            <span className="font-bold text-xl tracking-tight text-gray-900 flex items-center gap-2 select-none">
              <svg
                className="w-5 h-5 text-gray-900"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              BlockVibe
            </span>
          ) : (
            <Logo loading="eager" priority="high" className="invert dark:invert-0" />
          )}
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
