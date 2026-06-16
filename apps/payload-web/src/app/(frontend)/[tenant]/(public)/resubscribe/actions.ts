"use server"

import { findUserByEmail, validateSubscriptionToken } from "@/utilities/subscriptionToken"

export async function resubscribeAction(email: string, token: string) {
  try {
    validateSubscriptionToken(email, token)
    const { payload, userRecord } = await findUserByEmail(email)

    await payload.update({
      collection: "users",
      id: userRecord.id,
      data: {
        unsubscribed: false,
      },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to resubscribe." }
  }
}
