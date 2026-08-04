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
      street,
      city,
      state: addressState,
      zipCode,
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

    if (!email || !name) {
      return NextResponse.json({ error: "Name and Email are required." }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const paymentService = new PaymentService()

    // Resolve tenant from DB to determine dynamic multi-tenant siteOrigin
    const rawHost = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").replace(/^www\./, "").split(":")[0]
    const refererHeader = req.headers.get("referer") || ""
    let refHostname = ""
    if (refererHeader) {
      try {
        refHostname = new URL(refererHeader).hostname.replace(/^www\./, "")
      } catch {}
    }

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "blockvibe.org"
    const stagingDomain = process.env.NEXT_PUBLIC_STAGING_DOMAIN || "staging.blockvibe.org"

    let slugFromSubdomain = ""
    if (rawHost.includes(`.${platformDomain}`)) {
      slugFromSubdomain = rawHost.replace(`.${platformDomain}`, "").split(":")[0]
    } else if (rawHost.includes(`.${stagingDomain}`)) {
      slugFromSubdomain = rawHost.replace(`.${stagingDomain}`, "").split(":")[0]
    } else if (refHostname.includes(`.${platformDomain}`)) {
      slugFromSubdomain = refHostname.replace(`.${platformDomain}`, "").split(":")[0]
    } else if (refHostname.includes(`.${stagingDomain}`)) {
      slugFromSubdomain = refHostname.replace(`.${stagingDomain}`, "").split(":")[0]
    }

    const tenantMatches = await payload.find({
      collection: "tenants",
      where: {
        or: [
          ...(rawHost ? [{ domain: { equals: rawHost } }] : []),
          ...(refHostname ? [{ domain: { equals: refHostname } }] : []),
          ...(slugFromSubdomain && slugFromSubdomain !== "default" && slugFromSubdomain !== "localhost" ? [{ slug: { equals: slugFromSubdomain } }] : []),
          ...(body.tenantSlug ? [{ slug: { equals: body.tenantSlug } }] : []),
        ],
      },
      limit: 1,
    })

    const matchedTenant = tenantMatches.docs[0]
    let siteOrigin = ""
    if (matchedTenant) {
      if (matchedTenant.domain && matchedTenant.domain.trim()) {
        const cleanDomain = matchedTenant.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
        siteOrigin = `https://${cleanDomain}`
      } else if (matchedTenant.slug) {
        siteOrigin = `https://${matchedTenant.slug}.${platformDomain}`
      }
    }

    if (!siteOrigin || siteOrigin.includes("0.0.0.0") || siteOrigin.includes("127.0.0.1")) {
      if (refererHeader) {
        try {
          const refUrl = new URL(refererHeader)
          if (!refUrl.hostname.includes("0.0.0.0") && !refUrl.hostname.includes("127.0.0.1")) {
            siteOrigin = refUrl.origin
          }
        } catch {}
      }
    }

    if (!siteOrigin || siteOrigin.includes("0.0.0.0") || siteOrigin.includes("127.0.0.1")) {
      siteOrigin = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") || "https://www.northofgranddsm.org"
    }

    // 1. Find or create user
    const normalizedEmail = email.trim().toLowerCase()
    const existingUsers = await payload.find({
      collection: "users",
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    })

    const userTenantData = matchedTenant ? [{ tenant: matchedTenant.id }] : undefined

    let userRecord = existingUsers.docs[0]

    if (!userRecord) {
      userRecord = await payload.create({
        collection: "users",
        data: {
          email: normalizedEmail,
          name,
          password: customPassword && customPassword.trim() ? customPassword.trim() : `P@ss-${Math.random().toString(36).slice(-8)}${Date.now()}`,
          role: "contributor",
          status: "approved",
          isNeighbor: true,
          memberType: memberCategory === "business" ? "business" : "residential",
          unsubscribed: agreeEmails === false,
          ...(userTenantData ? { tenants: userTenantData } : {}),
        },
      })
    } else {
      const existingTenants = (userRecord as any).tenants || []
      let updatedTenants = existingTenants
      if (matchedTenant) {
        const hasTenant = existingTenants.some((t: any) => {
          const id = typeof t.tenant === "object" && t.tenant !== null ? t.tenant.id : t.tenant
          return id === matchedTenant.id
        })
        if (!hasTenant) {
          updatedTenants = [...existingTenants, { tenant: matchedTenant.id }]
        }
      }

      userRecord = await payload.update({
        collection: "users",
        id: userRecord.id,
        data: {
          status: "approved",
          unsubscribed: agreeEmails === false,
          tenants: updatedTenants,
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

      const fullAddress =
        address ||
        [street, city, addressState, zipCode].filter((s) => s && String(s).trim() !== "").join(", ")

      const membershipData = {
        memberCategory,
        tier,
        businessTierSlug: businessTierSlug || undefined,
        recurringFrequency: recurringFrequency || "annual",
        phone: phone || "",
        address: fullAddress || "",
        street: street || "",
        city: city || "",
        state: addressState || "",
        zipCode: zipCode || "",
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
