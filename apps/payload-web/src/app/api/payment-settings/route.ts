import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({ slug: "payment-settings" as any })

    return NextResponse.json({
      paymentSupportEmail: (settings as any)?.paymentSupportEmail || "northofgrandpresident@gmail.com",
      personalDuesFrequency: (settings as any)?.personalDuesFrequency || "annual",
      individualDuesAmount: (settings as any)?.individualDuesAmount || 10,
      householdDuesAmount: (settings as any)?.householdDuesAmount || 20,
      businessTiers: (settings as any)?.businessTiers || [],
      enablePayPal: (settings as any)?.enablePayPal ?? true,
      enableCheckPayment: (settings as any)?.enableCheckPayment ?? true,
      enableResidentialMemberships: (settings as any)?.enableResidentialMemberships ?? true,
      enableBusinessMemberships: (settings as any)?.enableBusinessMemberships ?? false,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        paymentSupportEmail: "northofgrandpresident@gmail.com",
        personalDuesFrequency: "annual",
        individualDuesAmount: 10,
        householdDuesAmount: 20,
        businessTiers: [],
        enablePayPal: true,
        enableCheckPayment: true,
        enableResidentialMemberships: true,
        enableBusinessMemberships: false,
      },
      { status: 200 }
    )
  }
}
