import "dotenv/config"
import { getPayload } from "payload"
import config from "../payload.config"

const payload = await getPayload({ config })
console.log("DB keys:", Object.keys(payload.db))
console.log("DB proto keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(payload.db)))
process.exit(0)
