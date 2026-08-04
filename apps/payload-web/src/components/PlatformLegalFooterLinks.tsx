import Link from "next/link"

/** Cross-links shown at the bottom of platform legal pages and in the site footer. */
export function PlatformLegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Legal pages"
      className={`flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-2 text-sm font-medium ${className}`}
    >
      <Link
        href="/"
        className="text-gray-600 hover:text-emerald-700 underline-offset-4 hover:underline"
      >
        BlockVibe Home
      </Link>
      <span className="text-gray-300 select-none" aria-hidden="true">|</span>
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
    </nav>
  )
}
