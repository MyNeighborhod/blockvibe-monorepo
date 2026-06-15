import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import dotenv from "dotenv"

// Load environment variables from .env
dotenv.config()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("Error: DATABASE_URL is not defined in the environment or .env file.")
  process.exit(1)
}

// Ensure dbsnapshots directory exists
const snapshotDir = path.join(process.cwd(), "dbsnapshots")
if (!fs.existsSync(snapshotDir)) {
  fs.mkdirSync(snapshotDir, { recursive: true })
}

// Generate timestamp (YYYYMMDD_HHMMSS)
const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2, "0")
const day = String(now.getDate()).padStart(2, "0")
const hours = String(now.getHours()).padStart(2, "0")
const minutes = String(now.getMinutes()).padStart(2, "0")
const seconds = String(now.getSeconds()).padStart(2, "0")

const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`
const filename = `snapshot_${timestamp}.sql`
const outputPath = path.join(snapshotDir, filename)

console.log("Taking database snapshot...")
console.log(`Source DB: ${databaseUrl.replace(/:[^:@\n]+@/, ":****@")}`) // Mask credentials
console.log(`Target File: dbsnapshots/${filename}`)

try {
  // Execute pg_dump command
  execSync(`pg_dump --dbname="${databaseUrl}" -f "${outputPath}"`, { stdio: "inherit" })
  console.log(`\n✅ Database snapshot successfully created at dbsnapshots/${filename}`)
} catch (error: any) {
  console.error("\n❌ Failed to take database snapshot:", error.message)
  process.exit(1)
}
