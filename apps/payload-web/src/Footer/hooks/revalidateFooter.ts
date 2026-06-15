import type { CollectionAfterChangeHook } from "payload"

import { revalidateTag } from "next/cache"

export const revalidateFooter: CollectionAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    try {
      payload.logger.info(`Revalidating footer`)

      revalidateTag("global_footer", "max")
    } catch (err) {
      payload.logger.error({ err, message: `Error revalidating footer` })
    }
  }

  return doc
}
