/** Roles allowed to enqueue outbound email campaigns. */
export type EmailEnqueueRole = "admin" | "superadmin"

/** Claims embedded in the short-lived signed enqueue token (minted by payload-web). */
export interface EnqueueTokenClaims {
  /** Sender user id */
  sub: number
  role: EmailEnqueueRole
  /** Tenant the campaign is for */
  tenantId: number
  /** Tenant ids the sender belongs to (admins); superadmin may send for any tenant */
  tenantIds: number[]
  /** Unix seconds */
  iat: number
  /** Unix seconds */
  exp: number
}

export interface EnqueueCampaignRequest {
  subject: string
  html: string
  recipientEmails: string[]
  /** Request host used to build unsubscribe links, e.g. nog.blockvibe.org */
  host: string
  tenantSlug: string
}

export interface EnqueueCampaignResponse {
  jobId: string
  status: "queued"
  recipientCount: number
}

/** Payload for direct Lambda invoke from payload-web (no API Gateway). */
export interface DirectCampaignInvokeEvent {
  token: string
  tenantId: number
  campaign: EnqueueCampaignRequest
}

export interface CampaignJobMessage {
  jobId: string
  claims: EnqueueTokenClaims
  campaign: EnqueueCampaignRequest
  enqueuedAt: string
}

export const ENQUEUE_TOKEN_TTL_SECONDS = 300
