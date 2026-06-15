import type { Metadata } from "next"

import { cn } from "@/utilities/ui"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { Playfair_Display, Gentium_Book_Plus, Montserrat, Quicksand, Nunito } from "next/font/google"
import React from "react"
import fs from "fs"
import path from "path"

import { AdminBar } from "@/components/AdminBar"
import { Providers } from "@/providers"
import { InitTheme } from "@/providers/Theme/InitTheme"
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph"
import { draftMode, headers } from "next/headers"
import { getTenantBySlug } from "@/utilities/getGlobals"
import { isNorthOfGrandTenant } from "@/utilities/resolveTenantSlug"

import "../globals.css"
import { notFound } from "next/navigation"
import { getServerSideURL } from "@/utilities/getURL"

// Multitenant routing depends on request host headers; static generation causes runtime errors.
export const dynamic = "force-dynamic"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
})

const gentium = Gentium_Book_Plus({
  subsets: ["latin"],
  variable: "--font-gentium",
  weight: ["400", "700"],
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "700"],
})

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["500", "600", "700"],
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "600", "700"],
})

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { isEnabled } = await draftMode()
  const tenant = await getTenantBySlug(tenantSlug)

  if (!tenant) {
    return notFound()
  }

  const useNogChrome = isNorthOfGrandTenant(tenant)
  const themeClass = useNogChrome ? "theme-nog" : `theme-${tenant.slug}`

  const cssSlug = useNogChrome ? "nog" : tenantSlug
  const cssFullPath = path.join(process.cwd(), "public", "css", cssSlug, "theme.css")
  const hasCustomCss = fs.existsSync(cssFullPath)

  return (
    <html
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        playfair.variable,
        gentium.variable,
        montserrat.variable,
        quicksand.variable,
        nunito.variable,
      )}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme defaultTheme={tenant.template || "auto"} />
        <noscript>
          <style>{`
            html {
              opacity: 1 !important;
            }
          `}</style>
        </noscript>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        {hasCustomCss && <link href={`/css/${cssSlug}/theme.css`} rel="stylesheet" />}
      </head>
      <body className={cn(themeClass)} data-tenant-chrome={useNogChrome ? "nog" : undefined}>
        <Providers theme={(tenant.template || "auto") as any}>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          {children}
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: "summary_large_image",
    creator: "@payloadcms",
  },
}
