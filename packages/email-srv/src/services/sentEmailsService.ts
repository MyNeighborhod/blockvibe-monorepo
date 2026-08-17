import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { ulid } from "ulid"
import fs from "fs"
import path from "path"
import { sql } from "drizzle-orm"
import { getEmailSrvDb } from "../client/index.js"
import { sentEmails, type NewSentEmailRow, type SentEmailRow } from "../schema/schema.js"

export type ArchiveEmailInput = {
  to: string
  from: string
  subject: string
  html: string
  text?: string
  isTransactional?: boolean
  tenantSlug?: string
  emailAccountId?: number
}

let s3ClientInstance: S3Client | null = null
let tableInitialized = false

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1"
    s3ClientInstance = new S3Client({ region })
  }
  return s3ClientInstance
}

function resolveBucketName(): string {
  if (process.env.S3_OUTGOING_EMAILS_BUCKET) {
    return process.env.S3_OUTGOING_EMAILS_BUCKET
  }
  const isProd = process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_STAGING_DOMAIN
  return isProd ? "outgoing_emails_prod" : "outgoing_emails_staging"
}

export async function ensureSentEmailsTable(): Promise<void> {
  if (tableInitialized) return
  try {
    const db = getEmailSrvDb()
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS "email_srv";
      CREATE TABLE IF NOT EXISTS "email_srv"."sent_emails" (
        "id" SERIAL PRIMARY KEY,
        "email_id" TEXT NOT NULL UNIQUE,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "to_address" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "is_transactional" BOOLEAN NOT NULL DEFAULT true,
        "tenant_slug" TEXT NOT NULL,
        "email_account_id" INTEGER,
        "s3_uri" TEXT NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_sent_emails_email_account_id" ON "email_srv"."sent_emails" ("email_account_id");
      CREATE INDEX IF NOT EXISTS "idx_sent_emails_to_address" ON "email_srv"."sent_emails" ("to_address");
      CREATE INDEX IF NOT EXISTS "idx_sent_emails_date" ON "email_srv"."sent_emails" ("date");
    `)
    tableInitialized = true
  } catch (err: any) {
    console.error("[@blockvibe/email-srv] Error initializing sent_emails table:", err)
  }
}

export async function archiveSentEmailInMicroservice(
  input: ArchiveEmailInput,
): Promise<{ emailId: string; s3Uri: string; record?: SentEmailRow }> {
  const emailId = ulid()
  const now = new Date()
  const isoDate = now.toISOString()
  const dateFolder = isoDate.split("T")[0] // YYYY-MM-DD
  const tenantSlug = (input.tenantSlug || "nog").toLowerCase().replace(/[^a-z0-9_-]/g, "_")
  const bucketName = resolveBucketName()

  // S3 Key format: {tenantSlug}/{YYYY-MM-DD}/{emailId}/email.json
  const s3Key = `${tenantSlug}/${dateFolder}/${emailId}/email.json`
  const s3Uri = `s3://${bucketName}/${s3Key}`

  const emailJsonPayload = {
    emailId,
    to: input.to,
    from: input.from,
    subject: input.subject,
    isTransactional: input.isTransactional ?? true,
    tenantSlug,
    emailAccountId: input.emailAccountId || null,
    sentAt: isoDate,
    html: input.html,
    text: input.text || "",
  }

  const jsonBody = JSON.stringify(emailJsonPayload, null, 2)

  // 1. Upload email.json to AWS S3 (with local fallback if S3 credentials missing)
  try {
    const s3 = getS3Client()
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: jsonBody,
        ContentType: "application/json",
      }),
    )
    console.log(`[@blockvibe/email-srv] Uploaded email artifact ${emailId} to ${s3Uri}`)
  } catch (s3Err: any) {
    console.warn(`[@blockvibe/email-srv] S3 upload skipped (${s3Err.message}). Writing to local fallback directory.`)
    try {
      const localDir = path.join(process.cwd(), "public", "outgoing_emails", tenantSlug, dateFolder, emailId)
      fs.mkdirSync(localDir, { recursive: true })
      fs.writeFileSync(path.join(localDir, "email.json"), jsonBody, "utf-8")
    } catch (fsErr) {
      console.error("[@blockvibe/email-srv] Local fallback file write error:", fsErr)
    }
  }

  // 2. Ensure schema & table exist, then insert into email_srv.sent_emails
  let record: SentEmailRow | undefined = undefined
  try {
    await ensureSentEmailsTable()
    const db = getEmailSrvDb()
    const newRow: NewSentEmailRow = {
      emailId,
      date: now,
      to: input.to,
      subject: input.subject,
      isTransactional: input.isTransactional ?? true,
      tenantSlug,
      emailAccountId: input.emailAccountId || null,
      s3Uri,
    }
    const inserted = await db.insert(sentEmails).values(newRow).returning()
    record = inserted[0]
    console.log(`[@blockvibe/email-srv] Inserted record into email_srv.sent_emails for ${emailId}`)
  } catch (dbErr: any) {
    console.error("[@blockvibe/email-srv] Database insert error in sent_emails:", dbErr)
  }

  return { emailId, s3Uri, record }
}
