import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { PaymentService } from "@/services/payment/paymentService"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      email,
      name,
      phone,
      address,
      tier = "individual",
      memberCategory = "residential",
      businessTierSlug,
      recurringFrequency,
      paymentMethod = "paypal",
      intent = "new", // 'new' | 'renewal' | 'donation'
      customAmount,
      agreeEmails = true,
      password: customPassword,
    } = body

    const siteOrigin = new URL(req.url).origin

    if (!email || !name) {
      return NextResponse.json({ error: "Name and Email are required." }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const paymentService = new PaymentService()

    // 1. Find or create user
    const normalizedEmail = email.trim().toLowerCase()
    const existingUsers = await payload.find({
      collection: "users",
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    })

    let userRecord = existingUsers.docs[0]

    if (!userRecord) {
      userRecord = await payload.create({
        collection: "users",
        data: {
          email: normalizedEmail,
          name,
          password: customPassword && customPassword.trim() ? customPassword.trim() : `P@ss-${Math.random().toString(36).slice(-8)}${Date.now()}`,
          role: "neighbor",
          status: "approved",
          isNeighbor: true,
          memberType: memberCategory === "business" ? "business" : "residential",
          unsubscribed: agreeEmails === false,
        },
      })
    } else {
      userRecord = await payload.update({
        collection: "users",
        id: userRecord.id,
        data: {
          status: "approved",
          unsubscribed: agreeEmails === false,
        },
      })
    }

    const accountId = (userRecord as any).accountId
    const userId = userRecord.id

    // Calculate charge amount
    let chargeAmount = 0
    if (intent === "donation") {
      chargeAmount = customAmount !== undefined && customAmount !== null && customAmount !== ""
        ? parseFloat(customAmount)
        : 10
    } else {
      chargeAmount = customAmount ? parseFloat(customAmount) : await paymentService.getDuesAmount(tier, businessTierSlug)
    }

    // 2. Ensure membership record exists (if membership or renewal)
    if (intent !== "donation") {
      const existingMembership = await payload.find({
        collection: "memberships" as any,
        where: { accountId: { equals: accountId } },
        limit: 1,
      })

      const membershipData = {
        memberCategory,
        tier,
        businessTierSlug: businessTierSlug || undefined,
        recurringFrequency: recurringFrequency || "annual",
        phone: phone || "",
        address: address || "",
      }

      if (existingMembership.docs.length === 0) {
        await payload.create({
          collection: "memberships" as any,
          data: {
            accountId,
            user: userId,
            ...membershipData,
            status: "pending",
            isAnnualPayingMember: false,
            totalPaidCurrentYear: 0,
          },
        })
      } else {
        await payload.update({
          collection: "memberships" as any,
          id: existingMembership.docs[0].id,
          data: membershipData,
        })
      }
    }

    // 3. Initiate payment processing based on provider
    if (paymentMethod === "paypal") {
      const order = await paymentService.createPayPalOrder({
        accountId,
        userId,
        tier: intent === "donation" ? "individual" : tier,
        memberCategory,
        businessTierSlug,
        recurringFrequency,
        amount: chargeAmount,
        notes: intent === "donation" ? "One-Time Donation" : `${intent.toUpperCase()} Dues`,
        siteOrigin,
      })

      return NextResponse.json({
        success: true,
        accountId,
        userId,
        orderId: order.orderId,
        approvalUrl: order.approvalUrl,
        duesAmount: chargeAmount,
        paymentMethod: "paypal",
        intent,
      })
    }

    // Pay by Check / Offline
    return NextResponse.json({
      success: true,
      accountId,
      userId,
      duesAmount: chargeAmount,
      paymentMethod: "check",
      intent,
      message:
        intent === "donation"
          ? "Thank you for your pledge to donate! Please mail your check."
          : "Registration received! Please mail or submit your paper check or cash to complete annual dues.",
    })
  } catch (error: any) {
    console.error("Membership signup error:", error)
    return NextResponse.json({ error: error.message || "Failed to process request." }, { status: 500 })
  }
}
