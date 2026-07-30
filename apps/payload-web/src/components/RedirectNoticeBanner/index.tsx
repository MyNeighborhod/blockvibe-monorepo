"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function RedirectNoticeContent() {
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const isOldDomainParam = searchParams.get("from_old_domain") === "1"
    const isOldDomainReferrer =
      typeof document !== "undefined" &&
      document.referrer.includes("northofgrandneighborhood.org")

    if (isOldDomainParam || isOldDomainReferrer) {
      setIsVisible(true)
      setIsFading(false)

      // Clean query param from URL bar without page refresh
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        if (url.searchParams.has("from_old_domain") || url.searchParams.has("redirected")) {
          url.searchParams.delete("from_old_domain")
          url.searchParams.delete("redirected")
          window.history.replaceState({}, "", url.pathname + url.search)
        }
      }

      // Show for 5 full seconds (5000ms), then begin 1-second fade out (1000ms)
      const fadeTimer = setTimeout(() => {
        setIsFading(true)
      }, 5000)

      // Completely unmount after 6 seconds (6000ms)
      const unmountTimer = setTimeout(() => {
        setIsVisible(false)
      }, 6000)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(unmountTimer)
      }
    }
  }, [searchParams])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 bg-red-600 text-white text-sm font-medium text-center shadow-lg transition-all duration-1000 ease-in-out ${
        isFading ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
      }`}
      role="alert"
    >
      <div className="container max-w-4xl mx-auto flex items-center justify-between gap-2">
        <span className="mx-auto">
          📌 <strong>Web Address Updated:</strong> We have moved to <strong>www.northofgranddsm.org</strong>. Please update your bookmarks!
        </span>
        <button
          onClick={() => {
            setIsFading(true)
            setTimeout(() => setIsVisible(false), 300)
          }}
          className="ml-2 text-white hover:text-red-200 font-bold focus:outline-none px-2 py-0.5 rounded cursor-pointer"
          aria-label="Close notice"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export const RedirectNoticeBanner: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <RedirectNoticeContent />
    </Suspense>
  )
}
