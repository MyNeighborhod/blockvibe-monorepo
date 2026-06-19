import crypto from "crypto"
import type { Payload } from "payload"
import type { User } from "@/payload-types"

const DATA_IMAGE_SRC_RE =
  /src=(?:"|')(data:image\/(?:png|jpeg|jpg|gif|webp);base64,[^"']+)(?:"|')/gi

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/s)
  if (!match) return null

  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64"),
  }
}

export function buildBroadcastImagePublicUrl(
  host: string,
  tenantSlug: string,
  filename: string,
): string {
  const protocol = host.startsWith("localhost") ? "http" : "https"
  return `${protocol}://${host}/media/${tenantSlug}/${filename}`
}

export async function uploadBroadcastImageFile({
  payload,
  tenantId,
  tenantSlug,
  host,
  user,
  buffer,
  mime,
  originalName,
}: {
  payload: Payload
  tenantId: string | number
  tenantSlug: string
  host: string
  user: User
  buffer: Buffer
  mime: string
  originalName?: string
}): Promise<string> {
  const extFromName = originalName?.split(".").pop()?.toLowerCase()
  const ext = MIME_TO_EXT[mime] || extFromName || "png"
  const filename = `broadcast-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`

  try {
    const mediaDoc = await payload.create({
      collection: "media",
      data: {
        alt: "Broadcast image",
        tenant: typeof tenantId === "string" ? parseInt(tenantId, 10) : tenantId,
      },
      file: {
        name: filename,
        data: buffer,
        mimetype: mime,
        size: buffer.length,
      },
      user: user as any,
    })

    if (!mediaDoc.filename) {
      throw new Error("Image upload did not return a filename.")
    }

    return buildBroadcastImagePublicUrl(host, tenantSlug, mediaDoc.filename)
  } catch (err: any) {
    const detail = err?.message || "Unknown upload error"
    throw new Error(`Failed to upload image: ${detail}`)
  }
}

export async function resolveBroadcastImagesInHtml(
  html: string,
  {
    payload,
    tenantId,
    tenantSlug,
    host,
    user,
  }: {
    payload: Payload
    tenantId: string | number
    tenantSlug: string
    host: string
    user: User
  },
): Promise<string> {
  const dataUrls = [...html.matchAll(DATA_IMAGE_SRC_RE)].map((match) => match[1])
  if (dataUrls.length === 0) return html

  let resolved = html

  for (const dataUrl of dataUrls) {
    const parsed = parseDataUrl(dataUrl)
    if (!parsed) continue

    const publicUrl = await uploadBroadcastImageFile({
      payload,
      tenantId,
      tenantSlug,
      host,
      user,
      buffer: parsed.buffer,
      mime: parsed.mime,
    })

    resolved = resolved.split(dataUrl).join(publicUrl)
  }

  return resolved
}
