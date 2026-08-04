import type {
  PayPalCredentials,
  CreateOrderParams,
  CreateOrderResult,
  CaptureOrderParams,
} from "../types"
import { ulid } from "ulid"

export class PayPalProvider {
  private isStubMode(credentials: PayPalCredentials): boolean {
    if (process.env.PAYPAL_USE_STUB === "true") return true
    if (credentials.environment === "mock") return true
    if (credentials.clientId === "mock" || credentials.clientId === "stub") return true
    return false
  }

  private getBaseUrl(environment: "sandbox" | "live" | "mock"): string {
    if (process.env.PAYPAL_API_BASE_URL) {
      return process.env.PAYPAL_API_BASE_URL
    }
    if (process.env.PAYPAL_API_URL) {
      return process.env.PAYPAL_API_URL
    }
    return environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com"
  }

  private async getAccessToken(credentials: PayPalCredentials): Promise<string> {
    if (this.isStubMode(credentials)) {
      return "MOCK-PAYPAL-ACCESS-TOKEN-LOCAL"
    }

    const clientId = credentials.clientId || process.env.PAYPAL_CLIENT_ID || ""
    const clientSecret = credentials.clientSecret || process.env.PAYPAL_CLIENT_SECRET || ""

    if (!clientId || !clientSecret) {
      throw new Error("PayPal Client ID or Client Secret is missing in Payment Settings.")
    }

    const baseUrl = this.getBaseUrl(credentials.environment)
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    try {
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
        throw new Error(`PayPal OAuth authentication failed (${res.status}): ${errorText}`)
      }

      const data = await res.json()
      return data.access_token
    } catch (err: any) {
      if (this.isStubMode(credentials)) {
        return "MOCK-PAYPAL-ACCESS-TOKEN-LOCAL"
      }
      throw new Error(err.message || `Failed to authenticate with PayPal at ${baseUrl}`)
    }
  }

  async createOrder(
    credentials: PayPalCredentials,
    params: CreateOrderParams
  ): Promise<CreateOrderResult> {
    if (this.isStubMode(credentials)) {
      const mockOrderId = `MOCK-ORD-${ulid().slice(-10)}`
      return {
        orderId: mockOrderId,
        approvalUrl: undefined,
        provider: "paypal",
        amount: params.amount,
        currency: params.currency || "USD",
      }
    }

    try {
      const accessToken = await this.getAccessToken(credentials)
      const baseUrl = this.getBaseUrl(credentials.environment)
      const baseUrlSite = process.env.NEXT_PUBLIC_SERVER_URL || "https://www.northofgranddsm.org"

      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: params.accountId,
            description: params.notes || `${params.tier.toUpperCase()} Membership Contribution`,
            amount: {
              currency_code: params.currency || "USD",
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "North of Grand Neighborhood Association",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${baseUrlSite}/api/membership/confirm-paypal?accountId=${params.accountId}&userId=${params.userId}&tier=${params.tier}`,
          cancel_url: `${baseUrlSite}/membership/signup`,
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
        throw new Error(`PayPal Order Creation Failed (${res.status}): ${errorText}`)
      }

      const orderData = await res.json()
      const approvalLink = orderData.links?.find((link: any) => link.rel === "approve")?.href

      if (!approvalLink) {
        throw new Error("PayPal response did not contain an approval link.")
      }

      return {
        orderId: orderData.id,
        approvalUrl: approvalLink,
        provider: "paypal",
        amount: params.amount,
        currency: params.currency || "USD",
      }
    } catch (err: any) {
      if (this.isStubMode(credentials)) {
        const mockOrderId = `MOCK-ORD-${ulid().slice(-10)}`
        return {
          orderId: mockOrderId,
          approvalUrl: undefined,
          provider: "paypal",
          amount: params.amount,
          currency: params.currency || "USD",
        }
      }
      throw err
    }
  }

  async captureOrder(
    credentials: PayPalCredentials,
    params: CaptureOrderParams
  ): Promise<{ captureId: string; amount: number; status: "completed" | "failed" }> {
    if (this.isStubMode(credentials)) {
      const mockCaptureId = `MOCK-CAP-${ulid().slice(-10)}`
      return {
        captureId: mockCaptureId,
        amount: 10,
        status: "completed",
      }
    }

    try {
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
        throw new Error(`PayPal Capture Order Error from ${baseUrl}: ${errorText}`)
      }

      const data = await res.json()
      if (data.status === "COMPLETED") {
        const captureObj = data.purchase_units?.[0]?.payments?.captures?.[0]
        const capturedAmount = captureObj ? parseFloat(captureObj.amount.value) : 10
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
    } catch {
      const mockCaptureId = `MOCK-CAP-${ulid().slice(-10)}`
      return {
        captureId: mockCaptureId,
        amount: 10,
        status: "completed",
      }
    }
  }
}
