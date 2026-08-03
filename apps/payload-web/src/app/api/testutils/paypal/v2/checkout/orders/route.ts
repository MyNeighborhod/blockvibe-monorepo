import { NextResponse } from "next/server"
import { ulid } from "ulid"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const mockOrderId = `MOCK-ORD-${ulid().slice(-10)}`

  return NextResponse.json({
    id: mockOrderId,
    intent: body.intent || "CAPTURE",
    status: "CREATED",
    purchase_units: body.purchase_units || [],
    links: [
      {
        href: `https://localhost:3000/api/testutils/paypal/checkoutnow?token=${mockOrderId}`,
        rel: "approve",
        method: "GET",
      },
    ],
  })
}
