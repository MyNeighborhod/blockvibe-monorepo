import type {
  PayPalCredentials,
  CreateOrderParams,
  CreateOrderResult,
  CaptureOrderParams,
} from "../types"

export class PayPalProvider {
  private getBaseUrl(environment: "sandbox" | "live"): string {
    return environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com"
  }

  private async getAccessToken(credentials: PayPalCredentials): Promise<string> {
    const { clientId, clientSecret, environment } = credentials
    if (!clientId || !clientSecret) {
      throw new Error("PayPal Client ID and Client Secret must be configured in Payment Settings.")
    }

    const baseUrl = this.getBaseUrl(environment)
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to obtain PayPal Access Token: ${errorText}`)
    }

    const data = await res.json()
    return data.access_token
  }

  async createOrder(
    credentials: PayPalCredentials,
    params: CreateOrderParams
  ): Promise<CreateOrderResult> {
    const accessToken = await this.getAccessToken(credentials)
    const baseUrl = this.getBaseUrl(credentials.environment)

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.accountId,
          description: `${params.tier.toUpperCase()} Annual Membership Dues`,
          amount: {
            currency_code: params.currency || "USD",
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Community Membership",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
      },
    }

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`PayPal Create Order Error: ${errorText}`)
    }

    const orderData = await res.json()
    const approvalLink = orderData.links?.find((link: any) => link.rel === "approve")?.href

    return {
      orderId: orderData.id,
      approvalUrl: approvalLink,
      provider: "paypal",
      amount: params.amount,
      currency: params.currency || "USD",
    }
  }

  async captureOrder(
    credentials: PayPalCredentials,
    params: CaptureOrderParams
  ): Promise<{ captureId: string; amount: number; status: "completed" | "failed" }> {
    const accessToken = await this.getAccessToken(credentials)
    const baseUrl = this.getBaseUrl(credentials.environment)

    const res = await fetch(`${baseUrl}/v2/checkout/orders/${params.orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`PayPal Capture Order Error: ${errorText}`)
    }

    const data = await res.json()
    if (data.status === "COMPLETED") {
      const captureObj = data.purchase_units?.[0]?.payments?.captures?.[0]
      const capturedAmount = captureObj ? parseFloat(captureObj.amount.value) : 0
      return {
        captureId: captureObj?.id || data.id,
        amount: capturedAmount,
        status: "completed",
      }
    }

    return {
      captureId: data.id,
      amount: 0,
      status: "failed",
    }
  }
}
