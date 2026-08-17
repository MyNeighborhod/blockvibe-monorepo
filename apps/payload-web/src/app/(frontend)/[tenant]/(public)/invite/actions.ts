"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function acceptInviteAction(
  name: string,
  password: string,
  inviteId: string | number,
) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Retrieve invite details
    const invite = await payload.findByID({
      collection: "invites",
      id: inviteId,
      overrideAccess: true,
    })

    if (!invite || invite.status !== "pending") {
      throw new Error("This invitation is invalid or has already been accepted.")
    }

    // Resolve tenant ID
    const tenantId =
      typeof invite.tenant === "object" && invite.tenant !== null ? invite.tenant.id : invite.tenant

    if (tenantId == null) {
      throw new Error("This invitation is missing a valid tenant.")
    }

    // Create User bypassing the staging area logic via context overrides
    await payload.create({
      collection: "users",
      data: {
        name,
        email: invite.email,
        password,
        role: "contributor",
        status: "approved", // Pre-approved by admin invitation
        tenants: [{ tenant: tenantId }],
      },
      req: {
        context: {
          isSeeding: true, // Bypasses staging status/role coercion
        },
      } as any,
    })

    // Update invite status to accepted
    await payload.update({
      collection: "invites",
      id: inviteId,
      data: {
        status: "accepted",
      },
      overrideAccess: true,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to accept invitation." }
  }
}
