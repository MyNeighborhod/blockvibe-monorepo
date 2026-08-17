/**
 * Update the NOG newsletter signup form field order and optional-contact copy.
 *
 * Usage (local): pnpm exec tsx src/scripts/update-nog-newsletter-form.ts
 * Usage (prod): run via SSH tunnel with DATABASE_URL pointing at production.
 */
import dotenv from "dotenv"
dotenv.config()

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { NOG_NEWSLETTER_FORM_TITLE, nogNewsletterFormFields } from "./nog-newsletter-form"

async function main() {
  const payload = await getPayload({ config: configPromise })

  const forms = await payload.find({
    collection: "forms",
    where: {
      title: {
        equals: NOG_NEWSLETTER_FORM_TITLE,
      },
    },
    limit: 1,
  })

  const form = forms.docs[0]
  if (!form) {
    throw new Error(`Form not found: ${NOG_NEWSLETTER_FORM_TITLE}`)
  }

  await payload.update({
    collection: "forms",
    id: form.id,
    data: {
      fields: nogNewsletterFormFields,
    },
  })

  payload.logger.info(`Updated "${NOG_NEWSLETTER_FORM_TITLE}" (id: ${form.id})`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
