import "dotenv/config"
import { getPayload } from "payload"
import config from "../src/payload.config.js"

const payload = await getPayload({ config })
if (payload.db && typeof payload.db.push === "function") {
  console.log("Running payload.db.push()...")
  await payload.db.push()
}
console.log("Schema push complete")
if (payload.db && typeof payload.db.destroy === "function") {
  await payload.db.destroy()
}
process.exit(0)

