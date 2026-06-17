"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/utilities/ui"
import Link from "next/link"
import React, { useState, useEffect } from "react"

import type { Page, Post } from "@/payload-types"

type CMSLinkType = {
  appearance?: "inline" | ButtonProps["variant"]
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: "pages" | "posts"
    value: Page | Post | string | number
  } | null
  size?: ButtonProps["size"] | null
  type?: "custom" | "reference" | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = "inline",
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const rawHref =
    type === "reference" && typeof reference?.value === "object" && reference.value.slug
      ? `${reference?.relationTo !== "pages" ? `/${reference?.relationTo}` : ""}/${
          reference.value.slug
        }`
      : url

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  let resolvedHref = rawHref || null

  if (isMounted && rawHref && typeof window !== "undefined") {
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
    const stagingDomain = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"

    // Escape dots for regex
    const platformDomainEscaped = platformDomain.replace(/\./g, "\\.")
    const stagingDomainEscaped = stagingDomain.replace(/\./g, "\\.")

    // Match if rawHref points to a tenant subdomain of localhost, platform, or staging domains
    const regexStr = `^(https?:\\/\\/)([^.]+)\\.(localhost|${platformDomainEscaped}|${stagingDomainEscaped})`
    const regex = new RegExp(regexStr)
    const subdomainMatch = rawHref.match(regex)

    if (subdomainMatch) {
      const protocol = window.location.protocol
      const currentHost = window.location.hostname
      const currentPort = window.location.port
      const tenantSlug = subdomainMatch[2]

      if (currentHost === "localhost" || currentHost === "127.0.0.1") {
        resolvedHref = `${protocol}//${tenantSlug}.localhost:${currentPort || "3000"}`
      } else if (currentHost.endsWith(stagingDomain)) {
        resolvedHref = `${protocol}//${tenantSlug}.${stagingDomain}`
      } else if (currentHost.endsWith(platformDomain)) {
        resolvedHref = `${protocol}//${tenantSlug}.${platformDomain}`
      } else {
        // Fallback for custom domains or default domains
        resolvedHref = `${protocol}//${tenantSlug}.${platformDomain}`
      }
    }
  }

  if (!resolvedHref) return null

  const size = appearance === "link" ? "clear" : sizeFromProps
  const newTabProps = newTab ? { rel: "noopener noreferrer", target: "_blank" } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === "inline") {
    return (
      <Link className={cn(className)} href={resolvedHref || ""} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={resolvedHref || ""} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
