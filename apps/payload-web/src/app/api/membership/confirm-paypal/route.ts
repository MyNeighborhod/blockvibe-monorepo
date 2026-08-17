import { NextResponse } from "next/server"
import { PaymentService } from "@/services/payment/paymentService"
import { resolvePublicOriginFromRequest } from "@/utilities/resolvePublicOrigin"

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
    return NextResponse.json(
      { error: error.message || "Failed to capture PayPal payment." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const origin = resolvePublicOriginFromRequest(req)
  const url = new URL(req.url)
  const token = url.searchParams.get("token") // PayPal Order ID
  const accountId = url.searchParams.get("accountId")
  const userId = url.searchParams.get("userId")
  const tier = (url.searchParams.get("tier") as any) || "individual"

  if (!token || !accountId || !userId) {
    return NextResponse.redirect(`${origin}/membership/signup?error=Missing+PayPal+confirmation+details`)
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
      `${origin}/membership/thank-you?accountId=${accountId}&method=paypal&tier=${tier}`
    )
  } catch (error: any) {
    console.error("PayPal return redirect capture error:", error)
    return NextResponse.redirect(
      `${origin}/membership/signup?error=${encodeURIComponent(error.message || "Failed to capture PayPal payment")}`
    )
  }
}
