import { cn } from "@/utilities/ui"
import { mapsDirectionsUrl } from "@/directory/constants"

type MediaLike = { url?: string | null; alt?: string | null } | string | number | null | undefined

export type DirectoryBusiness = {
  id: string | number
  name: string
  slug?: string | null
  address?: string | null
  website?: string | null
  about?: string | null
  email?: string | null
  phone?: string | null
  hours?: string | null
  facebook?: string | null
  instagram?: string | null
  logo?: MediaLike
  coverImage?: MediaLike
  categories?: Array<
    { id: string | number; title?: string | null; slug?: string | null } | string | number
  > | null
  customAttributes?: Record<string, unknown> | null
}

export function mediaUrl(media: MediaLike): string | null {
  if (!media || typeof media !== "object") return null
  return media.url || null
}

/** Cover photo vs logo-only: logos should not use object-cover (looks cropped/broken). */
export function cardMediaPresentation(biz: Pick<DirectoryBusiness, "logo" | "coverImage">): {
  mode: "photo" | "logo" | "monogram"
  photoUrl: string | null
  logoUrl: string | null
} {
  const logoUrl = mediaUrl(biz.logo)
  const coverUrl = mediaUrl(biz.coverImage)
  if (coverUrl && logoUrl && coverUrl !== logoUrl) {
    return { mode: "photo", photoUrl: coverUrl, logoUrl }
  }
  if (coverUrl && !logoUrl) {
    return { mode: "photo", photoUrl: coverUrl, logoUrl: null }
  }
  if (logoUrl) {
    return { mode: "logo", photoUrl: null, logoUrl }
  }
  return { mode: "monogram", photoUrl: null, logoUrl: null }
}

export function normalizeSocialUrl(value: string, kind: "facebook" | "instagram"): string {
  if (value.startsWith("http")) return value
  if (kind === "facebook") return `https://facebook.com/${value.replace(/^@/, "")}`
  return `https://instagram.com/${value.replace(/^@/, "")}`
}

export function categoryIdsOf(biz: DirectoryBusiness): string[] {
  if (!biz.categories?.length) return []
  return biz.categories.map((c) => (typeof c === "object" && c ? String(c.id) : String(c)))
}

export function categoryTitlesOf(biz: DirectoryBusiness): string[] {
  if (!biz.categories?.length) return []
  return biz.categories
    .map((c) => (typeof c === "object" && c ? c.title || "" : ""))
    .filter(Boolean) as string[]
}

export function businessDetailPath(slug: string): string {
  return `/businesses/${encodeURIComponent(slug)}`
}

export { mapsDirectionsUrl, cn }
