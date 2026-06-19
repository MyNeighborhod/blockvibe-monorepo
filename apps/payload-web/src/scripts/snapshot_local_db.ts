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

// Ensure dbsnapshots/local directory exists
const snapshotDir = path.join(process.cwd(), "dbsnapshots", "local")
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
console.log(`Target File: dbsnapshots/local/${filename}`)

try {
  // Execute pg_dump command
  execSync(`pg_dump --dbname="${databaseUrl}" -f "${outputPath}"`, { stdio: "inherit" })

  // Retrieve current Git commit info
  let gitCommit = "unknown"
  let gitSubject = ""
  try {
    gitCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim()
    gitSubject = execSync('git log -1 --format="%s"', { encoding: "utf8" }).trim()
  } catch (gitError) {
    // Ignore git errors if run outside a git repository or git not available
  }

  // Prepend Git commit info as a comment at the top of the SQL file
  const sqlContent = fs.readFileSync(outputPath, "utf8")
  const commentedContent = `-- Git Commit: ${gitCommit} (${gitSubject})\n\n${sqlContent}`
  fs.writeFileSync(outputPath, commentedContent, "utf8")

  console.log(`\n✅ Database snapshot successfully created at dbsnapshots/local/${filename}`)
} catch (error: any) {
  console.error("\n❌ Failed to take database snapshot:", error.message)
  process.exit(1)
}
