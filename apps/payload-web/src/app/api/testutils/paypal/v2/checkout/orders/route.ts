import { NextResponse } from "next/server"
import { ulid } from "ulid"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const mockOrderId = `MOCK-ORD-${ulid().slice(-10)}`
  const siteOrigin =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") || "http://localhost:3000"

  return NextResponse.json({
    id: mockOrderId,
    intent: body.intent || "CAPTURE",
    status: "CREATED",
    purchase_units: body.purchase_units || [],
    links: [
      {
        href: `${siteOrigin}/membership/signup?mockPayPalOrder=${mockOrderId}`,
        rel: "payer-action",
        method: "GET",
      },
      {
        href: `${siteOrigin}/api/testutils/paypal/v2/checkout/orders/${mockOrderId}`,
        rel: "self",
        method: "GET",
      },
    ],
  })
}
