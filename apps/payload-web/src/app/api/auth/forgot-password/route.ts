import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { resolvePublicOriginFromRequest } from "@/utilities/resolvePublicOrigin"
import { resolveTenantSlugFromHost } from "@/utilities/resolveTenantSlug"
import { resolveTransactionalEmailFrom, sendTransactionalEmail } from "@/utilities/transactionalEmail"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const token = await payload.forgotPassword({
      collection: "users",
      data: { email },
      disableEmail: true,
      overrideAccess: true,
    })

    if (!token) {
      return NextResponse.json({ success: true })
    }

    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
    const tenantSlug = resolveTenantSlugFromHost(hostHeader.split(":")[0])

    const tenantResult = await payload.find({
      collection: "tenants",
      where: { slug: { equals: tenantSlug } },
      limit: 1,
    })
    const tenant = tenantResult.docs[0] ?? null
    const from = resolveTransactionalEmailFrom(tenant)
    const origin = resolvePublicOriginFromRequest(req)
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`

    await sendTransactionalEmail(payload, {
      to: email,
      subject: `Reset your password — ${from.name}`,
      tenant,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Reset your password</h2>
          <p style="color: #334155; font-size: 16px; line-height: 24px;">
            You requested a password reset for your ${from.name} account. Click the button below to choose a new password.
          </p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 500; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 20px;">
            This link expires in one hour. If you did not request a password reset, you can ignore this email.
          </p>
          <p style="color: #64748b; font-size: 12px;">
            If the button does not work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 })
  }
}
