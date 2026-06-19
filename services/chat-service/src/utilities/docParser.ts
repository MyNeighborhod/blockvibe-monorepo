import fs from "fs"
import path from "path"

let cachedDocsContext: string | null = null

export function getDocsContext(): string {
  if (cachedDocsContext !== null) {
    return cachedDocsContext
  }

  // Fallback chain: environment variable -> local docs directory
  const docsDir = process.env.DOCS_DIR || path.join(process.cwd(), "docs")
  let context = ""

  function readDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
      return
    }

    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip hidden directories (like .git, .next) or test-results
        if (file.startsWith(".") || file === "node_modules" || file === "test-results") {
          continue
        }
        readDirectory(fullPath)
      } else if (file.endsWith(".md")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8")
          const relativePath = path.relative(docsDir, fullPath)
          context += `\n\n--- DOCUMENT: ${relativePath} ---\n${content}`
        } catch (err) {
          console.error(`Error reading doc file ${fullPath}:`, err)
        }
      }
    }
  }

  if (fs.existsSync(docsDir)) {
    console.log(`Parsing documentation from: ${docsDir}`)
    readDirectory(docsDir)
    console.log(`Successfully loaded documentation (${Buffer.byteLength(context)} bytes).`)
  } else {
    console.warn(`Documentation directory not found at: ${docsDir}`)
  }

  cachedDocsContext = context
  return cachedDocsContext
}

/** Clear the in-memory cache (useful for testing or hot-reloading) */
export function clearDocsCache(): void {
  cachedDocsContext = null
}
