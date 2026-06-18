import { Body, Controller, Middlewares, Post, Request, Route, SuccessResponse, Tags } from "tsoa"
import type {
  EnqueueCampaignRequest,
  EnqueueCampaignResponse,
  EnqueueTokenClaims,
} from "@blockvibe/email-contracts"
import { authenticateEnqueueToken } from "../middleware/authenticateEnqueueToken.js"
import type { AuthenticatedRequest } from "../middleware/authentication.js"
import { enqueueCampaignJob } from "../services/queueService.js"

interface EnqueueCampaignBody extends EnqueueCampaignRequest {
  /** Must match tenantId claim inside the Bearer enqueue token */
  tenantId: number
  completionToken?: string
}

@Route("campaigns")
@Tags("Campaigns")
export class CampaignsController extends Controller {
  /**
   * Enqueue a tenant email broadcast for asynchronous delivery (SES or Gmail worker).
   * Callable only from payload-web with a short-lived signed enqueue token.
   */
  @Post()
  @Middlewares(authenticateEnqueueToken)
  @SuccessResponse(202, "Accepted")
  public async enqueueCampaign(
    @Body() body: EnqueueCampaignBody,
    @Request() req: AuthenticatedRequest
  ): Promise<EnqueueCampaignResponse> {
    const claims = req.enqueueClaims as EnqueueTokenClaims

    if (!body.subject?.trim() || !body.html?.trim()) {
      this.setStatus(400)
      throw new Error("Subject and html are required.")
    }

    if (!body.recipientEmails?.length) {
      this.setStatus(400)
      throw new Error("At least one recipient email is required.")
    }

    const { jobId, recipientCount } = await enqueueCampaignJob(claims, body.tenantId, {
      subject: body.subject,
      html: body.html,
      recipientEmails: body.recipientEmails,
      host: body.host,
      tenantSlug: body.tenantSlug,
      delivery: body.delivery,
      gmail: body.gmail,
      broadcastId: body.broadcastId,
    }, { completionToken: body.completionToken })

    this.setStatus(202)
    return {
      jobId,
      status: "queued",
      recipientCount,
    }
  }
}
