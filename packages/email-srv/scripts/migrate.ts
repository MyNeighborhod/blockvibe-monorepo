import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { closeEmailSrvPool } from "../src/client/index.js"
import { runEmailSrvMigrations } from "../src/migrations/index.js"

const packageRoot = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(packageRoot, "../../../apps/payload-web/.env") })
dotenv.config({ path: path.resolve(packageRoot, "../.env") })

async function main() {
  await runEmailSrvMigrations()
  console.log("email_srv migrations applied.")
  await closeEmailSrvPool()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
