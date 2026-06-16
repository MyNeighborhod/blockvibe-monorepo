import "dotenv/config"
import { getPayload } from "payload"
import config from "../src/payload.config.js"

const payload = await getPayload({ config })
const db = payload.db as {
  push?: (() => Promise<void>) | boolean
  destroy?: () => Promise<void>
} | undefined

const push = db?.push
if (typeof push === "function") {
  console.log("Running payload.db.push()...")
  await push()
}
console.log("Schema push complete")
if (typeof db?.destroy === "function") {
  await db.destroy()
}
process.exit(0)

