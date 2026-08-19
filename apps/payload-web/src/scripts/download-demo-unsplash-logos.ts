/**
 * Download Unsplash square crops for demo business logos into public/media/nog/.
 * Usage: pnpm exec tsx src/scripts/download-demo-unsplash-logos.ts
 */
import fs from "fs"
import path from "path"
import {
  SKIP_LOGO_EMAILS,
  UNSPLASH_LOGO_BY_EMAIL,
  logoFilenameForEmail,
  unsplashLogoUrl,
} from "./seed-nog-directory-demo-logos"

async function download(url: string, dest: string) {
  const res = await fetch(url, {
    headers: {
      // Unsplash CDN is happier with a real UA
      "User-Agent": "BlockVibeDemoSeed/1.0",
      Accept: "image/*",
    },
    redirect: "follow",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 2000) throw new Error(`Suspiciously small image (${buf.length}b) for ${url}`)
  fs.writeFileSync(dest, buf)
  return buf.length
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "media", "nog")
  fs.mkdirSync(outDir, { recursive: true })

  let ok = 0
  let skipped = 0
  const failures: string[] = []

  for (const [email, photoId] of Object.entries(UNSPLASH_LOGO_BY_EMAIL)) {
    if (SKIP_LOGO_EMAILS.has(email)) {
      skipped += 1
      continue
    }
    const filename = logoFilenameForEmail(email)
    if (!filename) continue
    const dest = path.join(outDir, filename)
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
      console.log("exists", filename)
      ok += 1
      continue
    }
    const url = unsplashLogoUrl(photoId)
    try {
      const size = await download(url, dest)
      console.log("downloaded", filename, `${Math.round(size / 1024)}kb`, photoId)
      ok += 1
    } catch (e: any) {
      console.error("FAIL", email, e.message)
      failures.push(email)
    }
  }

  console.log(`✓ logos: ${ok} ready, ${skipped} skipped (monogram examples), ${failures.length} failed`)
  if (failures.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
