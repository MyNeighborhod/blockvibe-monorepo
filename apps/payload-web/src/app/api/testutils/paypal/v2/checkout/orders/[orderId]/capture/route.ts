import { NextResponse } from "next/server"
import { ulid } from "ulid"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const mockCaptureId = `MOCK-CAP-${ulid().slice(-10)}`

  return NextResponse.json({
    id: orderId || "MOCK-ORDER-12345",
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [
            {
              id: mockCaptureId,
              status: "COMPLETED",
              amount: {
                currency_code: "USD",
                value: "10.00",
              },
            },
          ],
        },
      },
    ],
  })
}
