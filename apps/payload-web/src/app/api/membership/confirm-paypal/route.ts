import { NextResponse } from "next/server"
import { PaymentService } from "@/services/payment/paymentService"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, accountId, userId, tier = "individual", notes } = body

    if (!orderId || !accountId || !userId) {
      return NextResponse.json(
        { error: "orderId, accountId, and userId are required." },
        { status: 400 }
      )
    }

    const paymentService = new PaymentService()
    const result = await paymentService.capturePayPalOrder({
      orderId,
      accountId,
      userId,
      tier,
      notes,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("PayPal confirmation error:", error)
    return NextResponse.json({ error: error.message || "Failed to confirm PayPal payment." }, { status: 500 })
  }
}
