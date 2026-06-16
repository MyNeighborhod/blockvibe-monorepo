"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import crypto from "crypto"

export async function unsubscribeAction(email: string, token: string) {
  try {
    if (!email || !token) {
      throw new Error("Email and token are required.")
    }

    const secret = process.env.PAYLOAD_SECRET || "fallback-secret"
    const expectedToken = crypto.createHmac("sha256", secret).update(email).digest("hex")

    if (token !== expectedToken) {
      throw new Error("Invalid unsubscribe token.")
    }

    const payload = await getPayload({ config: configPromise })

    // Find the user with this email
    const usersResult = await payload.find({
      collection: "users",
      where: {
        email: { equals: email },
      },
      limit: 1,
    })

    const userRecord = usersResult.docs[0]
    if (!userRecord) {
      throw new Error("User not found.")
    }

    // Update the user's unsubscribed field
    await payload.update({
      collection: "users",
      id: userRecord.id,
      data: {
        unsubscribed: true,
      },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to unsubscribe." }
  }
}
