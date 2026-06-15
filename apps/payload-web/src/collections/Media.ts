import type {
  CollectionConfig,
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
  CollectionAfterReadHook,
} from "payload"

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

import { anyone } from "../access/anyone"
import { mediaCreate, mediaUpdate, mediaDelete } from "../access/roles"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const tenantSlugCache = new Map<string | number, string>()

async function getTenantSlug(req: any, tenantId: string | number): Promise<string> {
  if (tenantSlugCache.has(tenantId)) {
    return tenantSlugCache.get(tenantId)!
  }
  try {
    const tenant = await req.payload.findByID({
      collection: "tenants",
      id: tenantId,
      depth: 0,
    })
    const slug = tenant?.slug || "global"
    tenantSlugCache.set(tenantId, slug)
    return slug
  } catch (err) {
    return "global"
  }
}

const afterChangeHook: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === "create" || operation === "update") {
    let slug = "global"
    if (doc.tenant) {
      const tenantId = typeof doc.tenant === "object" ? doc.tenant.id : doc.tenant
      slug = await getTenantSlug(req, tenantId)
    }

    const baseDir = path.resolve(dirname, "../../public/media")
    const destDir = path.join(baseDir, slug)

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    // Move main file
    if (doc.filename) {
      const srcPath = path.join(baseDir, doc.filename)
      const destPath = path.join(destDir, doc.filename)
      if (fs.existsSync(srcPath) && srcPath !== destPath) {
        fs.renameSync(srcPath, destPath)
      }
    }

    // Move sizes
    if (doc.sizes) {
      for (const sizeKey of Object.keys(doc.sizes)) {
        const sizeFilename = doc.sizes[sizeKey]?.filename
        if (sizeFilename) {
          const srcPath = path.join(baseDir, sizeFilename)
          const destPath = path.join(destDir, sizeFilename)
          if (fs.existsSync(srcPath) && srcPath !== destPath) {
            fs.renameSync(srcPath, destPath)
          }
        }
      }
    }
  }
  return doc
}

const beforeDeleteHook: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const doc = await req.payload.findByID({
    collection: "media",
    id,
    req,
  })
  if (!doc) return

  let slug = "global"
  if (doc.tenant) {
    const tenantId = typeof doc.tenant === "object" ? doc.tenant.id : doc.tenant
    slug = await getTenantSlug(req, tenantId)
  }

  const baseDir = path.resolve(dirname, "../../public/media")
  const destDir = path.join(baseDir, slug)

  // Delete main file
  if (doc.filename) {
    const filePath = path.join(destDir, doc.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  // Delete sizes
  if (doc.sizes) {
    for (const sizeKey of Object.keys(doc.sizes)) {
      const sizeObj = (doc.sizes as Record<string, unknown>)[sizeKey]
      if (sizeObj && typeof sizeObj === "object" && "filename" in sizeObj) {
        const sizeFilename = (sizeObj as { filename?: string | null }).filename
        if (sizeFilename) {
          const filePath = path.join(destDir, sizeFilename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        }
      }
    }
  }
}

const afterReadHook: CollectionAfterReadHook = async ({ doc, req }) => {
  let slug = "global"
  if (doc.tenant) {
    const tenantId = typeof doc.tenant === "object" ? doc.tenant.id : doc.tenant
    slug = await getTenantSlug(req, tenantId)
  }

  if (doc.filename) {
    doc.url = `/media/${slug}/${doc.filename}`
  }

  if (doc.sizes) {
    for (const sizeKey of Object.keys(doc.sizes)) {
      const size = doc.sizes[sizeKey]
      if (size && size.filename) {
        size.url = `/media/${slug}/${size.filename}`
      }
    }
  }

  return doc
}

export const Media: CollectionConfig = {
  slug: "media",
  folders: true,
  access: {
    create: mediaCreate,
    delete: mediaDelete,
    read: anyone,
    update: mediaUpdate,
  },
  hooks: {
    afterChange: [afterChangeHook],
    beforeDelete: [beforeDeleteHook],
    afterRead: [afterReadHook],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      //required: true,
    },
    {
      name: "caption",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, "../../public/media"),
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
      },
      {
        name: "square",
        width: 500,
        height: 500,
      },
      {
        name: "small",
        width: 600,
      },
      {
        name: "medium",
        width: 900,
      },
      {
        name: "large",
        width: 1400,
      },
      {
        name: "xlarge",
        width: 1920,
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        crop: "center",
      },
    ],
  },
}
