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

const snapshotDir = path.join(process.cwd(), "dbsnapshots")
if (!fs.existsSync(snapshotDir)) {
  console.error("Error: dbsnapshots directory does not exist.")
  process.exit(1)
}

// Read command line argument if provided
const requestedArg = process.argv[2]
const requestedFile = requestedArg && requestedArg.trim() !== "" ? requestedArg.trim() : undefined

let snapshotPath = ""
let selectedSnapshot = ""

if (requestedFile) {
  // Check if it's a direct path
  if (fs.existsSync(requestedFile)) {
    snapshotPath = path.resolve(requestedFile)
    selectedSnapshot = path.basename(snapshotPath)
  } else {
    // Check inside dbsnapshots directory
    const directPathInDir = path.join(snapshotDir, requestedFile)
    if (fs.existsSync(directPathInDir)) {
      snapshotPath = directPathInDir
      selectedSnapshot = requestedFile
    } else {
      // Try finding files containing this query string
      const allFiles = fs
        .readdirSync(snapshotDir)
        .filter((file) => file.startsWith("snapshot_") && file.endsWith(".sql"))
      const matches = allFiles.filter((file) => file.includes(requestedFile))
      if (matches.length === 1) {
        snapshotPath = path.join(snapshotDir, matches[0])
        selectedSnapshot = matches[0]
      } else if (matches.length > 1) {
        console.error(`Error: Multiple snapshots matched the query "${requestedFile}":`)
        matches.forEach((m) => console.error(`  - ${m}`))
        process.exit(1)
      } else {
        console.error(`Error: Could not find snapshot matching "${requestedFile}".`)
        console.error("Available snapshots:")
        const sortedFiles = allFiles.sort((a, b) => b.localeCompare(a))
        sortedFiles.forEach((f) => console.error(`  - ${f}`))
        process.exit(1)
      }
    }
  }
} else {
  // Default: Get the latest snapshot file
  const files = fs
    .readdirSync(snapshotDir)
    .filter((file) => file.startsWith("snapshot_") && file.endsWith(".sql"))
    .sort((a, b) => b.localeCompare(a)) // Sort descending to get the latest first

  if (files.length === 0) {
    console.error("Error: No snapshot files found in dbsnapshots directory.")
    process.exit(1)
  }

  selectedSnapshot = files[0]
  snapshotPath = path.join(snapshotDir, selectedSnapshot)
}

console.log(`Restoring database from ${requestedFile ? "specified" : "latest"} snapshot...`)
console.log(`Source File: dbsnapshots/${selectedSnapshot}`)
console.log(`Target DB: ${databaseUrl.replace(/:[^:@\n]+@/, ":****@")}`) // Mask credentials

try {
  // Step 1: Drop and recreate schema public to ensure a clean slate
  console.log("Re-creating public schema to ensure clean slate...")
  const dropSchemaCmd = `psql "${databaseUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"`
  execSync(dropSchemaCmd, { stdio: "inherit" })

  // Step 2: Restore dump
  console.log("Executing psql restore...")
  execSync(`psql "${databaseUrl}" -f "${snapshotPath}"`, { stdio: "inherit" })

  console.log(`\n✅ Database successfully restored from dbsnapshots/${selectedSnapshot}`)
} catch (error: any) {
  console.error("\n❌ Failed to restore database:", error.message)
  process.exit(1)
}
