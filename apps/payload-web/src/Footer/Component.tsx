import { getCachedGlobal, getTenantId, getTenant } from "@/utilities/getGlobals"
import Link from "next/link"
import React from "react"

import { ThemeSelector } from "@/providers/Theme/ThemeSelector"
import { CMSLink } from "@/components/Link"
import { Logo } from "@/components/Logo/Logo"
import { shouldUseNogChrome } from "@/utilities/resolveTenantSlug"

export async function Footer() {
  const tenantId = await getTenantId()
  const tenant = await getTenant()
  const footerData = await getCachedGlobal("footer", tenantId, 1)()

  const navItems = footerData?.navItems || []
  const isNog = shouldUseNogChrome(tenant)
  const logoImage = (footerData as any)?.logoImage
  const logoUrl = logoImage && typeof logoImage === "object" ? logoImage.url : null

  if (isNog) {
    return (
      <footer className="mt-auto border-t border-border bg-white text-gray-700 py-12">
        <div className="container flex flex-col items-center gap-6">
          {logoUrl && (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="North Of Grand Wordmark"
                className="max-h-14 w-auto object-contain mx-auto"
              />
            </div>
          )}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink
                  className="text-[#0a3840] hover:text-[#47773e] font-medium transition-colors"
                  key={i}
                  {...link}
                />
              )
            })}
          </nav>
          <div className="text-xs text-gray-400 mt-4 text-center">
            &copy; {new Date().getFullYear()} North Of Grand Neighborhood Association. All Rights
            Reserved.
          </div>
        </div>
      </footer>
    )
  }

  if (tenant?.slug === "default") {
    return (
      <footer className="mt-auto border-t border-gray-200 bg-gray-50 py-10">
        <div className="container max-w-4xl mx-auto px-4 flex flex-col gap-5">
          <nav
            aria-label="Legal and platform links"
            className="flex flex-wrap justify-center md:justify-start items-center gap-x-5 gap-y-2 text-sm font-medium"
          >
            <Link
              href="/terms"
              className="text-gray-800 hover:text-emerald-700 underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
            <span className="text-gray-300 select-none" aria-hidden="true">|</span>
            <Link
              href="/privacy"
              className="text-gray-800 hover:text-emerald-700 underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            {navItems.map(({ link }, i) => (
              <React.Fragment key={i}>
                <span className="text-gray-300 select-none" aria-hidden="true">|</span>
                <CMSLink
                  className="text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline transition-colors"
                  {...link}
                />
              </React.Fragment>
            ))}
          </nav>
          <p className="text-center md:text-left text-xs text-gray-500">
            © {new Date().getFullYear()} BlockVibe · Tidier LLC
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between items-center">
        <Link className="flex items-center" href="/">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={tenant?.name || "Logo"}
              className="max-h-12 w-auto object-contain"
            />
          ) : (
            <Logo />
          )}
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
