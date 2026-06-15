import type { CollectionAfterChangeHook } from "payload"

import { revalidateTag } from "next/cache"

export const revalidateHeader: CollectionAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    try {
      payload.logger.info(`Revalidating header`)

      revalidateTag("global_header", "max")
    } catch (err) {
      payload.logger.error({ err, message: `Error revalidating header` })
    }
  }

  return doc
}
