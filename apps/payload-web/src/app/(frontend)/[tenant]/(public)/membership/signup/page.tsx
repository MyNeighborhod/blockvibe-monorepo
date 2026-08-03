"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function MembershipSignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

    try {
      const res = await fetch("/api/membership/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to process signup.")
      }

      if (formData.paymentMethod === "paypal") {
        if (data.approvalUrl) {
          // If approval URL provided by PayPal, redirect user to PayPal
          window.location.href = data.approvalUrl
          return
        }
        // Save order session for inline confirmation / SDK
        setPaypalData(data)
      } else {
        // Pay by check -> Go directly to Thank You page
        router.push(
          `/membership/thank-you?accountId=${data.accountId}&method=check&tier=${formData.tier}`
        )
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
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
          notes: "Approved via PayPal UI modal",
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "PayPal payment confirmation failed.")
      }

      router.push(
        `/membership/thank-you?accountId=${result.accountId}&method=paypal&status=${result.status}&paymentId=${result.paymentId}`
      )
    } catch (err: any) {
      setError(err.message || "PayPal confirmation failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Join Community Membership
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Pay annual dues to support your neighborhood and unlock active member privileges.
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
                    $100 <span className="text-sm font-normal text-slate-500">/ year</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Annual membership dues for single resident neighbor.
                  </p>
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
                    $150 <span className="text-sm font-normal text-slate-500">/ year</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Annual dues covering all family members in household.
                  </p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
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
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">PayPal</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Credit card or PayPal Account
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
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
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Paper Check / Cash</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Mail check or pay at meeting
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
              {loading ? "Processing..." : "Proceed to Payment"}
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Click below to authorize & finalize payment with PayPal.
              </p>
            </div>

            <button
              onClick={handleSimulatedPayPalConfirm}
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Finalizing Payment..." : "Complete PayPal Payment ($" + (formData.tier === 'household' ? 150 : 100) + ")"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
