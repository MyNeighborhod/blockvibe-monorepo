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

const dbsnapshotsDir = path.join(process.cwd(), "dbsnapshots")
const localDir = path.join(dbsnapshotsDir, "local")
const prodDir = path.join(dbsnapshotsDir, "prod")

if (!fs.existsSync(dbsnapshotsDir)) {
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
    selectedSnapshot = path.relative(dbsnapshotsDir, snapshotPath)
  } else {
    // Check inside local directory first
    const pathInLocal = path.join(localDir, requestedFile)
    const pathInProd = path.join(prodDir, requestedFile)
    if (fs.existsSync(pathInLocal)) {
      snapshotPath = pathInLocal
      selectedSnapshot = `local/${requestedFile}`
    } else if (fs.existsSync(pathInProd)) {
      snapshotPath = pathInProd
      selectedSnapshot = `prod/${requestedFile}`
    } else {
      // Find files recursively across both folders
      const allFiles: { name: string; path: string }[] = []
      if (fs.existsSync(localDir)) {
        fs.readdirSync(localDir)
          .filter((file) => file.startsWith("snapshot_") && file.endsWith(".sql"))
          .forEach((file) => allFiles.push({ name: `local/${file}`, path: path.join(localDir, file) }))
      }
      if (fs.existsSync(prodDir)) {
        fs.readdirSync(prodDir)
          .filter((file) => file.startsWith("snapshot_") && file.endsWith(".sql"))
          .forEach((file) => allFiles.push({ name: `prod/${file}`, path: path.join(prodDir, file) }))
      }

      const matches = allFiles.filter((file) => file.name.includes(requestedFile))
      if (matches.length === 1) {
        snapshotPath = matches[0].path
        selectedSnapshot = matches[0].name
      } else if (matches.length > 1) {
        console.error(`Error: Multiple snapshots matched the query "${requestedFile}":`)
        matches.forEach((m) => console.error(`  - ${m.name}`))
        process.exit(1)
      } else {
        console.error(`Error: Could not find snapshot matching "${requestedFile}".`)
        console.error("Available snapshots:")
        const sortedFiles = allFiles.sort((a, b) => b.name.localeCompare(a.name))
        sortedFiles.forEach((f) => console.error(`  - ${f.name}`))
        process.exit(1)
      }
    }
  }
} else {
  // Default: Get the latest snapshot file from the local directory
  const localFiles = fs.existsSync(localDir)
    ? fs.readdirSync(localDir)
        .filter((file) => file.startsWith("snapshot_") && file.endsWith(".sql"))
        .sort((a, b) => b.localeCompare(a))
    : []

  if (localFiles.length === 0) {
    console.error("Error: No snapshot files found in dbsnapshots/local directory.")
    process.exit(1)
  }

  selectedSnapshot = `local/${localFiles[0]}`
  snapshotPath = path.join(localDir, localFiles[0])
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
