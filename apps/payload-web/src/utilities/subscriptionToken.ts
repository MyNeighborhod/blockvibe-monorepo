import { getPayload } from "payload"
import configPromise from "@payload-config"
import crypto from "crypto"

export function validateSubscriptionToken(email: string, token: string) {
  if (!email || !token) {
    throw new Error("Email and token are required.")
  }

  const secret = process.env.PAYLOAD_SECRET || "fallback-secret"
  const expectedToken = crypto.createHmac("sha256", secret).update(email).digest("hex")

  if (token !== expectedToken) {
    throw new Error("Invalid subscription token.")
  }
}

export async function findUserByEmail(email: string) {
  const payload = await getPayload({ config: configPromise })
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

  return { payload, userRecord }
}
