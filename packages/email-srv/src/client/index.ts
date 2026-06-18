import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../schema/schema.js"

let pool: Pool | null = null
let db: NodePgDatabase<typeof schema> | null = null

function getConnectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required for @blockvibe/email-srv")
  }
  return url
}

export function getEmailSrvPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: getConnectionString() })
  }
  return pool
}

export function getEmailSrvDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getEmailSrvPool(), { schema })
  }
  return db
}

export async function closeEmailSrvPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}
