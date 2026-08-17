import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    scope: "https://api.paypal.com/v1/payments/.*",
    access_token: "MOCK-PAYPAL-ACCESS-TOKEN-LOCAL",
    token_type: "Bearer",
    app_id: "APP-MOCK-LOCAL-TESTING",
    expires_in: 32400,
    nonce: "mock-nonce-123456",
  })
}
