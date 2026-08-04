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
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token") // PayPal Order ID
  const accountId = url.searchParams.get("accountId")
  const userId = url.searchParams.get("userId")
  const tier = (url.searchParams.get("tier") as any) || "individual"

  if (!token || !accountId || !userId) {
    return NextResponse.redirect(`${url.origin}/membership/signup?error=Missing+PayPal+confirmation+details`)
  }

  try {
    const paymentService = new PaymentService()
    await paymentService.capturePayPalOrder({
      orderId: token,
      accountId,
      userId,
      tier,
      notes: "Captured via PayPal Web Checkout redirect",
    })

    return NextResponse.redirect(
      `${url.origin}/membership/thank-you?accountId=${accountId}&method=paypal&tier=${tier}`
    )
  } catch (error: any) {
    console.error("PayPal return redirect capture error:", error)
    return NextResponse.redirect(
      `${url.origin}/membership/signup?error=${encodeURIComponent(error.message || "Failed to capture PayPal payment")}`
    )
  }
}
