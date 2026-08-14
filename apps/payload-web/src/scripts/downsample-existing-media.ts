import fs from "fs"
import path from "path"
import sharp from "sharp"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaBaseDir = path.resolve(dirname, "../../public/media")

const MAX_DIMENSION = 2560
const QUALITY = 82

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

    try {
      const metadata = await sharp(fullPath).metadata()
      const orientation = metadata.orientation || 1
      const width = metadata.width || 0
      const height = metadata.height || 0
      const stats = fs.statSync(fullPath)

      const needsRotation = orientation > 1
      const needsDownsample = width > MAX_DIMENSION || height > MAX_DIMENSION

      if (!needsRotation && !needsDownsample) {
        continue
      }

      console.log(
        `\nFixing image: ${path.relative(mediaBaseDir, fullPath)} (Orientation: ${orientation}, Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB, Dim: ${width}x${height})`
      )

      const tempPath = `${fullPath}.tmp`
      let sharpInstance = sharp(fullPath).rotate() // Automatically auto-rotates based on EXIF orientation!

      if (needsDownsample) {
        sharpInstance = sharpInstance.resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
      }

      if (ext === ".jpg" || ext === ".jpeg") {
        sharpInstance = sharpInstance.jpeg({ quality: QUALITY, mozjpeg: true })
      } else if (ext === ".png") {
        sharpInstance = sharpInstance.png({ quality: QUALITY, compressionLevel: 8 })
      }

      await sharpInstance.toFile(tempPath)
      fs.renameSync(tempPath, fullPath)

      const newStats = fs.statSync(fullPath)
      console.log(
        `✓ Fixed orientation/size: ${(stats.size / 1024 / 1024).toFixed(2)} MB -> ${(newStats.size / 1024 / 1024).toFixed(2)} MB`
      )
    } catch (err) {
      console.error(`Error processing ${fullPath}:`, err)
    }
  }
}

async function run() {
  console.log(`Starting media orientation fix and downsampling in: ${mediaBaseDir}`)
  await processDirectory(mediaBaseDir)
  console.log("\nMedia processing complete!")
}

run()
