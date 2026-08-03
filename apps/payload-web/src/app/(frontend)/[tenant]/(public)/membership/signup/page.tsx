"use client"

import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function MembershipForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlIntent = searchParams.get("intent")
  const urlEmail = searchParams.get("email")

  const [intent, setIntent] = useState<"new" | "renewal" | "donation">(
    urlIntent === "renewal" || urlIntent === "donation" ? urlIntent : "new"
  )
  const [customAmount, setCustomAmount] = useState<number | string>(50)

  // Merchandise Add-ons
  const [includeTshirt, setIncludeTshirt] = useState(false)
  const [tshirtSize, setTshirtSize] = useState("M")
  const [includeMug, setIncludeMug] = useState(false)
  const [includeMagnet, setIncludeMagnet] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: urlEmail || "",
    phone: "",
    address: "",
    tier: "individual", // 'individual' | 'household'
    paymentMethod: "paypal", // 'paypal' | 'check'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paypalData, setPaypalData] = useState<{
    orderId: string
    approvalUrl?: string
    accountId: string
    userId: string | number
  } | null>(null)

  const baseAmount =
    intent === "donation"
      ? Number(customAmount) || 0
      : formData.tier === "household"
      ? 20 // Default or dynamic
      : 10 // Default or dynamic

  const merchTotal =
    (includeTshirt ? 25 : 0) + (includeMug ? 15 : 0) + (includeMagnet ? 5 : 0)
  const calculatedTotal = baseAmount + merchTotal

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const merchNotes = [
      includeTshirt ? `T-Shirt (Size: ${tshirtSize})` : null,
      includeMug ? "Mug ($15)" : null,
      includeMagnet ? "Car Magnet ($5)" : null,
    ]
      .filter(Boolean)
      .join(", ")

    try {
      const res = await fetch("/api/membership/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          intent,
          customAmount: calculatedTotal,
          notes: merchNotes ? `Merchandise: ${merchNotes}` : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request.")
      }

      if (formData.paymentMethod === "paypal") {
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl
          return
        }
        setPaypalData(data)
      } else {
        router.push(
          `/membership/thank-you?accountId=${data.accountId}&method=check&tier=${formData.tier}&intent=${intent}`
        )
      }
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleSimulatedPayPalConfirm = async () => {
    if (!paypalData) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/membership/confirm-paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: paypalData.orderId,
          accountId: paypalData.accountId,
          userId: paypalData.userId,
          tier: formData.tier,
          notes: `${intent.toUpperCase()} via PayPal UI modal`,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "PayPal payment confirmation failed.")
      }

      router.push(
        `/membership/thank-you?accountId=${result.accountId}&method=paypal&status=${result.status}&paymentId=${result.paymentId}&intent=${intent}`
      )
    } catch (err: unknown) {
      setError((err as Error).message || "PayPal confirmation failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
        {/* Intent Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700 p-1.5 mb-8">
          <button
            type="button"
            onClick={() => setIntent("new")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              intent === "new"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Become a Member
          </button>
          <button
            type="button"
            onClick={() => setIntent("renewal")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              intent === "renewal"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Renew Membership
          </button>
          <button
            type="button"
            onClick={() => setIntent("donation")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              intent === "donation"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Merchandise / Donation
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {intent === "new" && "New Community Membership"}
            {intent === "renewal" && "Renew Annual Membership Dues"}
            {intent === "donation" && "Order Merchandise or Donate"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {intent === "donation"
              ? "Your contributions directly fund neighborhood events like our Annual Garage Sale & National Night Out."
              : "Keep your membership active to support North of Grand and unlock neighborhood privileges."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!paypalData ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Oak Street"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {intent !== "donation" ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Select Membership Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.tier === "individual"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value="individual"
                      checked={formData.tier === "individual"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 dark:text-white">Individual Member</div>
                    <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                      $10 <span className="text-sm font-normal text-slate-500">/ year</span>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.tier === "household"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value="household"
                      checked={formData.tier === "household"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 dark:text-white">Household Member</div>
                    <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                      $20 <span className="text-sm font-normal text-slate-500">/ year</span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Select Donation Amount ($)
                </label>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[15, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomAmount(amt)}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${
                        Number(customAmount) === amt
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom Amount ($)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Optional Merchandise Add-ons */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Add Official North of Grand Merchandise (Optional)
              </h3>
              <div className="space-y-3">
                {/* T-Shirt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTshirt}
                      onChange={(e) => setIncludeTshirt(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-900 dark:text-white">NOG T-Shirt (+$25)</span>
                  </label>
                  {includeTshirt && (
                    <select
                      value={tshirtSize}
                      onChange={(e) => setTshirtSize(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="S">Size Small (S)</option>
                      <option value="M">Size Medium (M)</option>
                      <option value="L">Size Large (L)</option>
                      <option value="XL">Size Extra Large (XL)</option>
                      <option value="2XL">Size 2XL</option>
                    </select>
                  )}
                </div>

                {/* Mug */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMug}
                      onChange={(e) => setIncludeMug(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-900 dark:text-white">NOG Coffee Mug (+$15)</span>
                  </label>
                </div>

                {/* Magnet */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMagnet}
                      onChange={(e) => setIncludeMagnet(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-900 dark:text-white">NOG Car Magnet / Badge (+$5)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Total Calculation Display */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="font-bold text-slate-900 dark:text-white">Total Order Amount:</span>
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                ${calculatedTotal}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Choose How to Pay
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                    formData.paymentMethod === "paypal"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === "paypal"}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Credit / Debit Card or PayPal
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Pay online instantly via PayPal (accepts Credit Cards, Debit Cards, or PayPal balance).
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                    formData.paymentMethod === "check"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="check"
                    checked={formData.paymentMethod === "check"}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      I will pay cash / check / other ways later
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Become a member now without paying upfront. Creates your account profile & ULID immediately.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : formData.paymentMethod === "check"
                ? `Register Now ($${calculatedTotal} - Pay Cash/Check Later)`
                : `Pay $${calculatedTotal} Online via PayPal / Card`}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">
                PayPal Order Created
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Order ID: <code className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{paypalData.orderId}</code>
              </p>
            </div>

            <button
              onClick={handleSimulatedPayPalConfirm}
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Finalizing Payment..." : "Complete PayPal Payment"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MembershipSignupPageWrapper() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading membership options...</div>}>
      <MembershipForm />
    </Suspense>
  )
}
