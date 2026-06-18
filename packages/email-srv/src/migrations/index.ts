import path from "path"
import { fileURLToPath } from "url"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { getEmailSrvPool } from "../client/index.js"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

export function getMigrationsFolder(): string {
  return path.join(packageRoot, "drizzle")
}

export async function runEmailSrvMigrations(): Promise<void> {
  const pool = getEmailSrvPool()
  const db = drizzle(pool)
  await migrate(db, { migrationsFolder: getMigrationsFolder() })
}
