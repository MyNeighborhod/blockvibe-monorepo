"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { getMeUser } from "@/utilities/getMeUser"
import { assertCanManageTenantEmailSettings } from "@/utilities/tenantEmailAccess"
import type { EmailDeliveryMethod } from "@/utilities/gmailOAuth"
import {
  deleteEmailAccountForTenant,
  getEmailAccountForTenant,
  isEmailAccountConnected,
} from "@/utilities/emailSrvAccount"

export async function disconnectGmailAction(tenantId: number) {
  try {
    const { user } = await getMeUser()
    assertCanManageTenantEmailSettings(user, tenantId)

    const payload = await getPayload({ config: configPromise })
    await deleteEmailAccountForTenant(tenantId)

    await payload.update({
      collection: "tenants",
      id: tenantId,
      data: {
        emailDeliveryDefault: "ses",
      },
      user,
    })

    return { success: true as const }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to disconnect Gmail."
    return { success: false as const, error: message }
  }
}

export async function updateEmailDeliveryDefaultAction(
  tenantId: number,
  delivery: EmailDeliveryMethod,
) {
  try {
    const { user } = await getMeUser()
    assertCanManageTenantEmailSettings(user, tenantId)

    if (delivery !== "ses" && delivery !== "gmail") {
      throw new Error("Invalid delivery method.")
    }

    const payload = await getPayload({ config: configPromise })

    if (delivery === "gmail") {
      const account = await getEmailAccountForTenant(tenantId)
      if (!isEmailAccountConnected(account)) {
        throw new Error("Connect Gmail before setting it as the default delivery method.")
      }
    }

    await payload.update({
      collection: "tenants",
      id: tenantId,
      data: { emailDeliveryDefault: delivery },
      user,
    })

    return { success: true as const }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update delivery default."
    return { success: false as const, error: message }
  }
}
