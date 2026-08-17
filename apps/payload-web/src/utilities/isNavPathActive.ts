/** True when pathname matches an internal nav href (e.g. /home ↔ /). */
export function isNavPathActive(pathname: string, href: string): boolean {
  if (!href.startsWith("/")) return false

  const normalized = pathname.replace(/\/$/, "") || "/"
  const hrefNorm = href.replace(/\/$/, "") || "/"

  if (hrefNorm === "/home" || hrefNorm === "/") {
    return normalized === "/" || normalized === "/home"
  }

  return normalized === hrefNorm || normalized.startsWith(`${hrefNorm}/`)
}
