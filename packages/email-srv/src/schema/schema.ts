import type { EmailProvider } from "../types/index.js"
import {
  boolean,
  index,
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

export const sentEmails = emailSrvSchema.table(
  "sent_emails",
  {
    id: serial("id").primaryKey(),
    emailId: text("email_id").notNull().unique(),
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    to: text("to_address").notNull(),
    subject: text("subject").notNull(),
    isTransactional: boolean("is_transactional").notNull().default(true),
    tenantSlug: text("tenant_slug").notNull(),
    emailAccountId: integer("email_account_id"),
    s3Uri: text("s3_uri").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_sent_emails_email_account_id").on(table.emailAccountId),
    index("idx_sent_emails_to_address").on(table.to),
    index("idx_sent_emails_date").on(table.date),
  ],
)

export type EmailAccountRow = typeof emailAccounts.$inferSelect
export type NewEmailAccountRow = typeof emailAccounts.$inferInsert

export type SentEmailRow = typeof sentEmails.$inferSelect
export type NewSentEmailRow = typeof sentEmails.$inferInsert
