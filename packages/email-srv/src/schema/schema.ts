import type { EmailProvider } from "../types/index.js"
import {
  integer,
  pgSchema,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const emailSrvSchema = pgSchema("email_srv")

export const emailAccounts = emailSrvSchema.table("email_account", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().unique(),
  provider: text("provider").notNull().default("gmail").$type<EmailProvider>(),
  senderEmail: text("sender_email").notNull(),
  refreshToken: text("refresh_token").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  connectedByUserId: integer("connected_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
})

export type EmailAccountRow = typeof emailAccounts.$inferSelect
export type NewEmailAccountRow = typeof emailAccounts.$inferInsert
