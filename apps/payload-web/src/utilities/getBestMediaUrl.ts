import type { Media } from "@/payload-types"
import { getMediaUrl } from "./getMediaUrl"

export type MediaSizeKey = "thumbnail" | "square" | "small" | "medium" | "large" | "xlarge" | "og"

/**
 * Returns the best media URL for a given preferred size variant.
 * Falls back in order of preference: preferredSize -> large -> medium -> small -> raw master URL.
 */
export function getBestMediaUrl(
  media: Media | number | string | null | undefined,
  preferredSize: MediaSizeKey = "large",
): string {
  if (!media || typeof media !== "object") return ""

  const cacheTag = media.updatedAt
  const sizes = media.sizes as Record<string, { url?: string | null } | undefined> | undefined

  if (sizes) {
    // 1. Try preferred size if available
    if (sizes[preferredSize]?.url) {
      return getMediaUrl(sizes[preferredSize]!.url, cacheTag)
    }

    // 2. Fallback priorities if preferred size is missing
    const fallbackPriority: MediaSizeKey[] = ["large", "medium", "xlarge", "small", "thumbnail"]
    for (const sizeKey of fallbackPriority) {
      if (sizes[sizeKey]?.url) {
        return getMediaUrl(sizes[sizeKey]!.url, cacheTag)
      }
    }
  }

  // 3. Fallback to raw master URL
  return getMediaUrl(media.url, cacheTag)
}
