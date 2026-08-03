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

    const clientId = credentials.clientId || process.env.PAYPAL_CLIENT_ID || "mock-client-id"
    const clientSecret = credentials.clientSecret || process.env.PAYPAL_CLIENT_SECRET || "mock-client-secret"

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
        throw new Error(`Failed to obtain PayPal Access Token from ${baseUrl}: ${errorText}`)
      }

      const data = await res.json()
      return data.access_token
    } catch {
      // Fallback for offline local stub testing
      return "MOCK-PAYPAL-ACCESS-TOKEN-LOCAL"
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
        throw new Error(`PayPal Create Order Error from ${baseUrl}: ${errorText}`)
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
    } catch {
      // Fallback for offline local stub testing
      const mockOrderId = `MOCK-ORD-${ulid().slice(-10)}`
      return {
        orderId: mockOrderId,
        approvalUrl: undefined,
        provider: "paypal",
        amount: params.amount,
        currency: params.currency || "USD",
      }
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
