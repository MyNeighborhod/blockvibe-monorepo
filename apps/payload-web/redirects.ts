import type { NextConfig } from "next"

export const redirects: NextConfig["redirects"] = async () => {
  const internetExplorerRedirect = {
    destination: "/ie-incompatible.html",
    has: [
      {
        type: "header" as const,
        key: "user-agent",
        value: "(.*Trident.*)", // all ie browsers
      },
    ],
    permanent: false,
    source: "/:path((?!ie-incompatible.html$).*)", // all pages except the incompatibility page
  }

  const blogRedirect = {
    source: "/blog",
    destination: "/posts",
    permanent: true,
  }

  const blogSlugRedirect = {
    source: "/blog/:slug*",
    destination: "/posts/:slug*",
    permanent: true,
  }

  return [internetExplorerRedirect, blogRedirect, blogSlugRedirect]
}
