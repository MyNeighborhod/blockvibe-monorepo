import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // Find User by email
    const usersResult = await payload.find({
      collection: "users",
      where: { email: { equals: email.trim().toLowerCase() } },
      limit: 1,
    })

    if (usersResult.docs.length === 0) {
      return NextResponse.json({ found: false, message: "No account found matching this email address." })
    }

    const user = usersResult.docs[0]
    const accountId = (user as any).accountId

    // Find Membership record
    const membershipResult = await payload.find({
      collection: "memberships" as any,
      where: { accountId: { equals: accountId } },
      limit: 1,
    })

    const membership = membershipResult.docs[0] || null

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountId,
      },
      membership: membership
        ? {
            tier: membership.tier,
            status: membership.status,
            isAnnualPayingMember: membership.isAnnualPayingMember,
            totalPaidCurrentYear: membership.totalPaidCurrentYear,
            validUntil: membership.validUntil,
            phone: membership.phone,
            address: membership.address,
          }
        : null,
    })
  } catch (error: any) {
    console.error("Member lookup error:", error)
    return NextResponse.json({ error: error.message || "Failed to lookup membership." }, { status: 500 })
  }
}
