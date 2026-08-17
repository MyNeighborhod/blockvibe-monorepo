/**
 * One-time migration: rename the NOG tenant slug to `default` and move media files.
 * Run against production or local DB before deploy if the tenant still uses slug `nog`.
 *
 *   npx tsx src/scripts/migrate-nog-to-default.ts
 */
import fs from "fs"
import path from "path"
import { getPayload } from "payload"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const payload = await getPayload({ config: await configPromise })

  const nogTenants = await payload.find({
    collection: "tenants",
    where: { slug: { equals: "nog" } },
    limit: 1,
  })

  if (nogTenants.docs.length === 0) {
    console.log("No tenant with slug 'nog' found — nothing to migrate.")
    return
  }

  const tenant = nogTenants.docs[0]
  console.log(`Migrating tenant ${tenant.id} (${tenant.name}) slug nog → default`)

  await payload.update({
    collection: "tenants",
    id: tenant.id,
    data: { slug: "default" },
  })

  const mediaDir = path.resolve(process.cwd(), "public/media")
  const nogDir = path.join(mediaDir, "nog")
  const defaultDir = path.join(mediaDir, "default")

  if (fs.existsSync(nogDir)) {
    if (fs.existsSync(defaultDir)) {
      console.log("Both public/media/nog and public/media/default exist — merging nog into default")
      for (const entry of fs.readdirSync(nogDir)) {
        const src = path.join(nogDir, entry)
        const dest = path.join(defaultDir, entry)
        if (!fs.existsSync(dest)) {
          fs.renameSync(src, dest)
        }
      }
      fs.rmdirSync(nogDir, { recursive: true })
    } else {
      fs.renameSync(nogDir, defaultDir)
      console.log("Renamed public/media/nog → public/media/default")
    }
  }

  console.log("✓ Migration complete. Redeploy or restart the app if running.")
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
