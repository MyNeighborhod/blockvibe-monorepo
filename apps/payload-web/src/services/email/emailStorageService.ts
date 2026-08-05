import type { Payload } from "payload"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { ulid } from "ulid"
import fs from "fs"
import path from "path"
import type { Tenant } from "@/payload-types"

export type ArchiveEmailParams = {
  to: string
  from: string
  subject: string
  html: string
  text?: string
  isTransactional?: boolean
  tenant?: Partial<Tenant> | number | string | null
  tenantSlug?: string
}

let s3ClientInstance: S3Client | null = null

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

export async function archiveSentEmail(
  payload: Payload,
  params: ArchiveEmailParams,
): Promise<{ emailId: string; s3Uri: string }> {
  const emailId = ulid()
  const now = new Date()
  const isoDate = now.toISOString()
  const dateFolder = isoDate.split("T")[0] // YYYY-MM-DD

  let resolvedTenantId: number | undefined = undefined
  let tenantSlug = params.tenantSlug || "nog"

  if (params.tenant) {
    if (typeof params.tenant === "object") {
      resolvedTenantId = params.tenant.id
      if (params.tenant.slug) tenantSlug = params.tenant.slug
    } else if (typeof params.tenant === "number") {
      resolvedTenantId = params.tenant
    }
  }

  // Sanitize tenant slug for S3 path
  const safeTenantSlug = tenantSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "_")
  const bucketName = resolveBucketName()

  // Key format: {tenantSlug}/{YYYY-MM-DD}/{emailId}/email.json
  const s3Key = `${safeTenantSlug}/${dateFolder}/${emailId}/email.json`
  const s3Uri = `s3://${bucketName}/${s3Key}`

  const emailPayload = {
    emailId,
    to: params.to,
    from: params.from,
    subject: params.subject,
    isTransactional: params.isTransactional ?? true,
    tenantSlug: safeTenantSlug,
    sentAt: isoDate,
    html: params.html,
    text: params.text || "",
  }

  const jsonBody = JSON.stringify(emailPayload, null, 2)

  // 1. Attempt upload to AWS S3
  try {
    const client = getS3Client()
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: jsonBody,
        ContentType: "application/json",
      }),
    )
    console.log(`[EmailStorage] Uploaded email ${emailId} to ${s3Uri}`)
  } catch (s3Error: any) {
    console.warn(`[EmailStorage] AWS S3 upload skipped/failed (${s3Error.message}). Saving to local fallback directory.`)

    // Local fallback disk storage
    try {
      const localDir = path.join(process.cwd(), "public", "outgoing_emails", safeTenantSlug, dateFolder, emailId)
      fs.mkdirSync(localDir, { recursive: true })
      fs.writeFileSync(path.join(localDir, "email.json"), jsonBody, "utf-8")
    } catch (fsErr) {
      console.error("[EmailStorage] Local filesystem write error:", fsErr)
    }
  }

  // 2. Create database record in sent_emails collection
  try {
    await payload.create({
      collection: "sent_emails" as any,
      data: {
        emailId,
        date: isoDate,
        to: params.to,
        subject: params.subject,
        isTransactional: params.isTransactional ?? true,
        tenant: resolvedTenantId,
        s3Uri,
      },
    })
    console.log(`[EmailStorage] Created sent_emails DB record for ${emailId}`)
  } catch (dbError: any) {
    console.error("[EmailStorage] Error creating sent_emails DB record:", dbError)
  }

  return { emailId, s3Uri }
}
