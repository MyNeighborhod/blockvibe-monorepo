import { getPayload } from "payload"
import config from "../../src/payload.config.js"

export const testUser = {
  email: "dev@payloadcms.com",
  password: "test",
}

import { isRemoteTestEnv } from "./tenantUrl"

const isLocal = !isRemoteTestEnv()

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  if (!isLocal) {
    console.log("Skipping database seeding for remote/production domain testing.")
    return
  }

  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: "users",
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: "users",
    context: { isSeeding: true },
    data: {
      ...testUser,
      role: "superadmin",
      status: "approved",
    },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  if (!isLocal) {
    console.log("Skipping database cleanup for remote/production domain testing.")
    return
  }

  const payload = await getPayload({ config })

  await payload.delete({
    collection: "users",
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
