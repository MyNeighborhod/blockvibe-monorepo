"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { getMeUser } from "@/utilities/getMeUser"
import { revalidatePath } from "next/cache"
import type { Page } from "@/payload-types"

export async function savePageOverlayLayoutAction(
  pageId: string | number,
  layout: Page["layout"],
  pathName: string = "/",
) {
  try {
    const { user } = await getMeUser()
    if (!user) {
      throw new Error("Unauthorized: You must be logged in as staff to edit pages.")
    }

    const isStaff = Boolean(user.role && ["superadmin", "admin", "editor"].includes(user.role))
    if (!isStaff) {
      throw new Error("Unauthorized: Insufficient permissions to modify page layouts.")
    }

    const payload = await getPayload({ config: configPromise })

    const updatedPage = await payload.update({
      collection: "pages",
      id: pageId,
      data: {
        layout: layout as any,
      },
    })

    // Revalidate the frontend page cache
    revalidatePath(pathName)
    if (updatedPage.slug === "home") {
      revalidatePath("/")
    }

    return {
      success: true,
      page: updatedPage,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to save visual layout changes.",
    }
  }
}
