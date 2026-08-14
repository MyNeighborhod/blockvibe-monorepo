import fs from "fs"
import path from "path"
import sharp from "sharp"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaBaseDir = path.resolve(dirname, "../../public/media")

const SIZE_VARIANT_REGEX = /-\d+x\d+\.(jpg|jpeg|png|webp)$/i
const MAX_DIMENSION = 2560
const QUALITY = 82
const MIN_SIZE_BYTES = 1.5 * 1024 * 1024 // 1.5MB

async function processDirectory(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      await processDirectory(fullPath)
      continue
    }

    if (!entry.isFile()) continue

    const ext = path.extname(entry.name).toLowerCase()
    if (![".jpg", ".jpeg", ".png"].includes(ext)) continue

    // Skip pre-generated size variants (e.g. -1400x1867.jpg)
    if (SIZE_VARIANT_REGEX.test(entry.name)) continue

    const stats = fs.statSync(fullPath)
    if (stats.size < MIN_SIZE_BYTES) continue

    console.log(`\nProcessing master file: ${path.relative(mediaBaseDir, fullPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)

    try {
      const metadata = await sharp(fullPath).metadata()
      const width = metadata.width || 0
      const height = metadata.height || 0

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && ext !== ".png") {
        console.log(`Skipping: Dimensions (${width}x${height}) are already within limits.`)
        continue
      }

      const tempPath = `${fullPath}.tmp`
      let sharpInstance = sharp(fullPath).resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })

      if (ext === ".jpg" || ext === ".jpeg") {
        sharpInstance = sharpInstance.jpeg({ quality: QUALITY, mozjpeg: true })
      } else if (ext === ".png") {
        sharpInstance = sharpInstance.png({ quality: QUALITY, compressionLevel: 8 })
      }

      await sharpInstance.toFile(tempPath)
      const newStats = fs.statSync(tempPath)

      if (newStats.size < stats.size) {
        fs.renameSync(tempPath, fullPath)
        const savedPercent = (((stats.size - newStats.size) / stats.size) * 100).toFixed(1)
        console.log(
          `✓ Successfully downsampled: ${(stats.size / 1024 / 1024).toFixed(2)} MB -> ${(newStats.size / 1024 / 1024).toFixed(2)} MB (Saved ${savedPercent}%)`
        )
      } else {
        fs.unlinkSync(tempPath)
        console.log("No reduction achieved, keeping original.")
      }
    } catch (err) {
      console.error(`Error processing ${fullPath}:`, err)
    }
  }
}

async function run() {
  console.log(`Starting media downsampling in: ${mediaBaseDir}`)
  await processDirectory(mediaBaseDir)
  console.log("\nDownsampling complete!")
}

run()
