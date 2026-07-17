"use client"

import React from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import type { Header as HeaderType } from "@/payload-types"

import { CMSLink } from "@/components/Link"

export const HeaderNav: React.FC<{ data: HeaderType; variant?: "default" | "nog" }> = ({
  data,
  variant = "default",
}) => {
  const navItems = data?.navItems || []
  const isNog = variant === "nog"

  const links = navItems.map(({ link }, i) =>
    isNog ? (
      <li key={i}>
        <CMSLink {...link} appearance="inline" className="nav-link" matchActive />
      </li>
    ) : (
      <CMSLink key={i} {...link} appearance="link" />
    ),
  )

  const search = (
    <Link href="/search" className="nav-search shrink-0" aria-label="Search">
      <SearchIcon className={isNog ? "w-5" : "w-5 text-primary"} />
    </Link>
  )

  if (isNog) {
    return (
      <div className="nog-nav-bar">
        <span className="nog-nav-line" aria-hidden="true" />
        <nav className="nog-nav">
          <ul>{links}</ul>
        </nav>
        <span className="nog-nav-line" aria-hidden="true" />
        {search}
      </div>
    )
  }

  return (
    <nav className="flex gap-3 items-center">
      {links}
      {search}
    </nav>
  )
}
