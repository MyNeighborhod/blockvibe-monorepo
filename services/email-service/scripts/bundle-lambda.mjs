import * as esbuild from "esbuild"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const here = path.dirname(fileURLToPath(import.meta.url))
const serviceRoot = path.join(here, "..")
const outDir = path.join(serviceRoot, "dist", "lambda")

fs.mkdirSync(outDir, { recursive: true })

await esbuild.build({
  entryPoints: [path.join(serviceRoot, "src", "invoke-handler.ts")],
  outfile: path.join(outDir, "invoke-handler.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  minify: true,
  mainFields: ["module", "main"],
  logLevel: "info",
})

console.log(`Lambda bundle written to ${outDir}/invoke-handler.js`)
