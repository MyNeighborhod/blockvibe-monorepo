import dotenv from "dotenv"
dotenv.config()

import fs from "fs"
import path from "path"
import { getPayload } from "payload"

async function run() {
  const configPromise = (await import("../payload.config")).default
  const config = await configPromise
  const payload = await getPayload({ config })

  console.log("Exporting Paying Members and Mailing List Signups from Production DB...")

  // 1. Fetch Memberships & Linked Payments & Users
  const memberships = await payload.find({
    collection: "memberships" as any,
    limit: 500,
    depth: 2,
    overrideAccess: true,
  })

  const payments = await payload.find({
    collection: "payments" as any,
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })

  const memberRows: any[] = []

  for (const m of memberships.docs) {
    const userObj = typeof (m as any).user === "object" ? (m as any).user : null
    if (!userObj) continue

    const userEmail = (userObj.email || "").toLowerCase()
    if (userEmail.includes("blockvibe.org") || userEmail.includes("twin-suns.test") || userEmail.includes("example.com")) {
      continue // Skip system demo accounts
    }

    // Find payments for this user or accountId
    const userPayments = payments.docs.filter((p: any) => {
      const pUser = typeof p.user === "object" ? p.user?.id : p.user
      return pUser === userObj.id || p.accountId === (m as any).accountId
    })

    const totalPaid = userPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    const primaryPayment = userPayments[0] as any
    const paymentMethod = primaryPayment?.provider ? primaryPayment.provider.toUpperCase() : "Cash/Check"

    const name = userObj.name || "N/A"
    const phone = (m as any).phone || userObj.phone || "N/A"
    const street = (m as any).street || userObj.street || ""
    const city = (m as any).city || userObj.city || ""
    const state = (m as any).state || userObj.state || ""
    const zip = (m as any).zipCode || userObj.zipCode || ""
    
    let address = (m as any).address || userObj.address || ""
    if (!address && street) {
      address = `${street}, ${city}, ${state} ${zip}`.trim()
    }
    if (!address) address = "N/A"

    const tierRaw = (m as any).tier || "individual"
    const tierDisplay = tierRaw === "household" ? "Household ($20)" : "Individual ($10)"
    const duesAmount = (m as any).totalPaidCurrentYear || totalPaid || (tierRaw === "household" ? 20 : 10)
    const status = (m as any).status === "active" ? "Active" : "Pending"
    const regDate = (m as any).createdAt ? new Date((m as any).createdAt).toLocaleDateString() : "N/A"

    memberRows.push({
      name,
      email: userEmail,
      phone,
      address,
      tier: tierDisplay,
      amount: `$${duesAmount}`,
      method: paymentMethod,
      status,
      date: regDate,
    })
  }

  // 2. Fetch Contact Form Submissions
  const submissions = await payload.find({
    collection: "form-submissions" as any,
    limit: 500,
    overrideAccess: true,
  })

  const emailMap = new Map<string, any>()
  for (const s of submissions.docs) {
    const dataArr = (s as any).submissionData || []
    const entry: Record<string, string> = {
      createdAt: (s as any).createdAt || "",
    }
    for (const item of dataArr) {
      if (item.field) {
        entry[item.field] = String(item.value || "")
      }
    }
    const emailKey = (entry.email || "").toLowerCase().trim()
    if (emailKey && (!emailMap.has(emailKey) || entry.createdAt > emailMap.get(emailKey).createdAt)) {
      emailMap.set(emailKey, entry)
    }
  }

  const mailingListRows: any[] = []
  for (const [email, info] of emailMap.entries()) {
    const firstName = info.firstName || ""
    const lastName = info.lastName || ""
    const name = `${firstName} ${lastName}`.trim() || "N/A"
    const phone = info.phone || "N/A"
    const address = info.address || "N/A"
    const date = info.createdAt ? new Date(info.createdAt).toLocaleDateString() : "N/A"

    mailingListRows.push({
      name,
      email,
      phone,
      address,
      date,
    })
  }

  // Generate Markdown Content
  let md = `# North of Grand - Resident Signups & Membership Report\n`
  md += `*Report Generated on ${new Date().toLocaleDateString()}*\n\n`
  md += `---\n\n`

  md += `## 💳 Table 1: Registered Paying Members\n\n`
  md += `| Name | Email | Phone Number | Full Address | Membership Tier | Amount Paid | Method | Status | Date |\n`
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`

  for (const r of memberRows) {
    md += `| **${r.name}** | \`${r.email}\` | ${r.phone} | ${r.address} | ${r.tier} | ${r.amount} | ${r.method} | ${r.status} | ${r.date} |\n`
  }

  md += `\n---\n\n`

  md += `## 📧 Table 2: Email List & Contact Form Signups\n\n`
  md += `| Name | Email | Phone Number | Full Address | Signup Date |\n`
  md += `| :--- | :--- | :--- | :--- | :--- |\n`

  for (const m of mailingListRows) {
    md += `| **${m.name}** | \`${m.email}\` | ${m.phone} | ${m.address} | ${m.date} |\n`
  }

  const exportPath = path.join(process.cwd(), "NORTH_OF_GRAND_RESIDENT_SIGNUPS_REPORT.md")
  fs.writeFileSync(exportPath, md, "utf-8")
  console.log(`Markdown report exported successfully to: ${exportPath}`)

  process.exit(0)
}

run().catch((err) => {
  console.error("Export Error:", err)
  process.exit(1)
})
