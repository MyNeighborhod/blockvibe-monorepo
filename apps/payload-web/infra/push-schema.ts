import "dotenv/config"
import { getPayload } from "payload"
import config from "../src/payload.config.js"

const payload = await getPayload({ config })
console.log("Schema push complete")
if (payload.db && typeof payload.db.destroy === "function") {
  await payload.db.destroy()
}

