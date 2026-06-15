import type { CollectionAfterChangeHook } from "payload"

import { revalidateTag } from "next/cache"

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  try {
    payload.logger.info(`Revalidating redirects`)

    revalidateTag("redirects", "max")
  } catch (err) {
    payload.logger.error({ err, message: `Error revalidating redirects` })
  }

  return doc
}
