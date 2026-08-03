import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { PaymentService } from "@/services/payment/paymentService"
import { isSuperAdmin, isApproved } from "@/access/roles"

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth(req)

    // Ensure user is authorized admin
    if (!user || (!isSuperAdmin(user) && ((user as any)?.role !== "admin" || !isApproved(user)))) {
      return NextResponse.json({ error: "Unauthorized access. Admin rights required." }, { status: 403 })
    }

    const body = await req.json()
    const { accountId, amount, provider = "check", providerTransactionId, tier = "individual", notes } = body

    if (!accountId || !amount) {
      return NextResponse.json({ error: "accountId and amount are required." }, { status: 400 })
    }

    // Find User by accountId
    const usersResult = await payload.find({
      collection: "users",
      where: { accountId: { equals: accountId } },
      limit: 1,
    })

    if (usersResult.docs.length === 0) {
      return NextResponse.json({ error: "No user account found matching accountId." }, { status: 444 })
    }

    const userId = usersResult.docs[0].id

    const paymentService = new PaymentService()
    const result = await paymentService.recordManualPayment({
      accountId,
      userId,
      tier,
      provider,
      amount: parseFloat(amount),
      providerTransactionId,
      notes,
      recordedByUserId: user.id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Manual payment recording error:", error)
    return NextResponse.json({ error: error.message || "Failed to record manual payment." }, { status: 500 })
  }
}
