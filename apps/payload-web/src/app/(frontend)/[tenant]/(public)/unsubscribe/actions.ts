"use server"

import { findUserByEmail, validateSubscriptionToken } from "@/utilities/subscriptionToken"

export async function unsubscribeAction(email: string, token: string) {
  try {
    validateSubscriptionToken(email, token)
    const { payload, userRecord } = await findUserByEmail(email)

    await payload.update({
      collection: "users",
      id: userRecord.id,
      overrideAccess: true,
      data: {
        unsubscribed: true,
      },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to unsubscribe." }
  }
}
