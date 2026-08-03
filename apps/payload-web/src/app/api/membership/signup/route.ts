import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { PaymentService } from "@/services/payment/paymentService"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, phone, address, tier = "individual", paymentMethod = "paypal" } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Name and Email are required." }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const paymentService = new PaymentService()

    // 1. Find or create user
    const existingUsers = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
    })

    let userRecord = existingUsers.docs[0]

    if (!userRecord) {
      userRecord = await payload.create({
        collection: "users",
        data: {
          email,
          name,
          role: "contributor",
          status: "pending",
          isNeighbor: true,
          memberType: "residential",
        },
      })
    }

    const accountId = (userRecord as any).accountId
    const userId = userRecord.id

    // 2. Ensure pending membership record exists
    const existingMembership = await payload.find({
      collection: "memberships" as any,
      where: { accountId: { equals: accountId } },
      limit: 1,
    })

    if (existingMembership.docs.length === 0) {
      await payload.create({
        collection: "memberships" as any,
        data: {
          accountId,
          user: userId,
          tier,
          status: "pending",
          isAnnualPayingMember: false,
          totalPaidCurrentYear: 0,
          phone: phone || "",
          address: address || "",
        },
      })
    } else {
      await payload.update({
        collection: "memberships" as any,
        id: existingMembership.docs[0].id,
        data: {
          phone: phone || existingMembership.docs[0].phone,
          address: address || existingMembership.docs[0].address,
          tier,
        },
      })
    }

    const duesAmount = await paymentService.getDuesAmount(tier)

    // 3. Initiate payment processing based on provider
    if (paymentMethod === "paypal") {
      const order = await paymentService.createPayPalOrder({
        accountId,
        userId,
        tier,
        amount: duesAmount,
      })

      return NextResponse.json({
        success: true,
        accountId,
        userId,
        orderId: order.orderId,
        approvalUrl: order.approvalUrl,
        duesAmount,
        paymentMethod: "paypal",
      })
    }

    // Pay by Check / Offline
    return NextResponse.json({
      success: true,
      accountId,
      userId,
      duesAmount,
      paymentMethod: "check",
      message: "Registration received! Please mail or submit your paper check or cash to complete annual dues.",
    })
  } catch (error: any) {
    console.error("Membership signup error:", error)
    return NextResponse.json({ error: error.message || "Failed to process signup." }, { status: 500 })
  }
}
