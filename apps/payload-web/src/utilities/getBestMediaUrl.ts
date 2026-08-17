import type { Media } from "@/payload-types"
import { getMediaUrl } from "./getMediaUrl"

export type MediaSizeKey = "thumbnail" | "square" | "small" | "medium" | "large" | "xlarge" | "og"

/**
 * Returns the best media URL for a given preferred size variant.
 * Falls back to highest quality variants first (large -> medium -> xlarge -> master URL -> small -> thumbnail).
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

    // 2. Try high-res fallbacks
    const highResPriority: MediaSizeKey[] = ["large", "medium", "xlarge"]
    for (const sizeKey of highResPriority) {
      if (sizes[sizeKey]?.url) {
        return getMediaUrl(sizes[sizeKey]!.url, cacheTag)
      }
    }
  }

  // 3. Fall back to original master URL (ensures full resolution for images without large variants)
  if (media.url) {
    return getMediaUrl(media.url, cacheTag)
  }

  // 4. Final fallback to small/thumbnail if master url is unavailable
  if (sizes) {
    if (sizes.small?.url) return getMediaUrl(sizes.small.url, cacheTag)
    if (sizes.thumbnail?.url) return getMediaUrl(sizes.thumbnail.url, cacheTag)
  }

  return ""
}
