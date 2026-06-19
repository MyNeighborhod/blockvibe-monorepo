import * as esbuild from "esbuild"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const here = path.dirname(fileURLToPath(import.meta.url))
const serviceRoot = path.join(here, "..")
const outDir = path.join(serviceRoot, "dist", "lambda")
const monorepoRoot = path.join(serviceRoot, "..", "..")
const sourceDocsDir = path.join(monorepoRoot, "apps", "payload-web", "docs")
const destDocsDir = path.join(outDir, "docs")

fs.mkdirSync(outDir, { recursive: true })

// 1. Bundle TypeScript handler
console.log("Bundling chat-service Lambda via esbuild...")
await esbuild.build({
  entryPoints: [path.join(serviceRoot, "src", "lambda.ts")],
  outfile: path.join(outDir, "lambda.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  minify: true,
  mainFields: ["module", "main"],
  logLevel: "info",
})

// 2. Copy documentation files into the bundle
if (fs.existsSync(sourceDocsDir)) {
  console.log(`Copying documentation from ${sourceDocsDir} to ${destDocsDir}...`)
  if (fs.existsSync(destDocsDir)) {
    fs.rmSync(destDocsDir, { recursive: true, force: true })
  }
  fs.cpSync(sourceDocsDir, destDocsDir, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src)
      // Ignore hidden files and build/test directories
      return !base.startsWith(".") && base !== "node_modules" && base !== "test-results"
    },
  })
  console.log("✓ Documentation copied successfully.")
} else {
  console.warn(`WARNING: Source docs directory not found at: ${sourceDocsDir}`)
}

console.log(`Lambda bundling complete. Files written to ${outDir}`)
