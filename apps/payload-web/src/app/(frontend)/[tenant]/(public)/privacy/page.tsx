import React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import { marked } from "marked"

import { headers } from "next/headers"

export const metadata: Metadata = {
  title: "Privacy Policy | BlockVibe",
  description: "Privacy Policy for BlockVibe, operated by TIDIER, LLC.",
}

interface PageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { tenant } = await params

  // Enforce that the Privacy Policy is only accessible on the default/platform domain
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const hostname = host.split(":")[0]

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
  const stagingDomain = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"

  const isPlatformDomain =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === platformDomain ||
    hostname === `info.${platformDomain}` ||
    hostname === stagingDomain

  if (tenant !== "default" || !isPlatformDomain) {
    notFound()
  }

  // Load and parse the markdown document
  const filePath = path.join(
    process.cwd(),
    "src/app/(frontend)/[tenant]/(public)/privacy/privacy.md",
  )
  const markdown = fs.readFileSync(filePath, "utf8")
  const html = await marked.parse(markdown)

  return (
    <article className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header decoration bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-8 sm:p-12 md:p-16">
          <header className="mb-12 border-b border-gray-150 dark:border-zinc-800 pb-8 text-center sm:text-left">
            <span className="text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Legal Documentation
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400">
              Last Updated: June 10, 2026 &bull; Effective Immediately
            </p>
          </header>

          <div
            className="prose dark:prose-invert max-w-none text-gray-700 dark:text-zinc-300 leading-relaxed font-sans space-y-6"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </article>
  )
}
