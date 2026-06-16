import "dotenv/config"
import { getPayload } from "payload"
import config from "../src/payload.config.js"

type SchemaDb = {
  push?: () => Promise<void>
  destroy?: () => Promise<void>
}

const payload = await getPayload({ config })
const db = payload.db as SchemaDb | undefined

if (db?.push) {
  console.log("Running payload.db.push()...")
  await db.push()
}
console.log("Schema push complete")
if (db?.destroy) {
  await db.destroy()
}
process.exit(0)

