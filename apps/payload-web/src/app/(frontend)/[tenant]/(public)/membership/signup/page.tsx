"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail"

function MembershipForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlIntent = searchParams.get("intent")
  const urlEmail = searchParams.get("email")

  const [intent, setIntent] = useState<"new" | "renewal" | "donation">(
    urlIntent === "renewal" || urlIntent === "donation" ? urlIntent : "new"
  )
  const [memberCategory, setMemberCategory] = useState<"residential" | "business">("residential")
  const [customAmount, setCustomAmount] = useState<number | string>(50)
  const [paymentSupportEmail, setPaymentSupportEmail] = useState("northofgrandpresident@gmail.com")

  useEffect(() => {
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.paymentSupportEmail) {
          setPaymentSupportEmail(data.paymentSupportEmail)
        }
      })
      .catch(() => {})
  }, [])

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
    tier: "individual", // 'individual' | 'household' | 'business'
    businessTierSlug: "local-sponsor", // 'local-sponsor' | 'community-champion'
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

  const getBusinessAmount = (slug: string) => {
    if (slug === "community-champion") return 250
    return 100
  }

  const baseAmount =
    intent === "donation"
      ? Number(customAmount) || 0
      : memberCategory === "business"
      ? getBusinessAmount(formData.businessTierSlug)
      : formData.tier === "household"
      ? 20
      : 10

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
          memberCategory,
          tier: memberCategory === "business" ? "business" : formData.tier,
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

  const handleConfirmPayPal = async () => {
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
          tier: memberCategory === "business" ? "business" : formData.tier,
          memberCategory,
          businessTierSlug: formData.businessTierSlug,
          notes: "Captured via Stub/Online PayPal Flow",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to capture payment.")
      }

      router.push(
        `/membership/thank-you?accountId=${data.accountId}&method=paypal&tier=${formData.tier}&intent=${intent}`
      )
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to confirm PayPal payment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            North of Grand Neighborhood Association
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-900 dark:text-white">
            {intent === "new"
              ? "New Community Membership"
              : intent === "renewal"
              ? "Renew Membership Dues"
              : "Order Merchandise or Donate"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Support local projects, community events, and garage sale initiatives.
          </p>
        </div>

        {/* Intent Tabs */}
        <div className="flex rounded-2xl bg-slate-200 dark:bg-slate-800 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setIntent("new")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              intent === "new"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            🏡 New Member
          </button>
          <button
            type="button"
            onClick={() => setIntent("renewal")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              intent === "renewal"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            🔄 Renew Dues
          </button>
          <button
            type="button"
            onClick={() => setIntent("donation")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              intent === "donation"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            👕 Merch & Donate
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {error}
            </div>
          )}

          {!paypalData ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selector (Residential vs Business) */}
              {intent !== "donation" && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Member Type Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMemberCategory("residential")
                        setFormData({ ...formData, tier: "individual" })
                      }}
                      className={`p-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        memberCategory === "residential"
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      🏠 Residential Member
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMemberCategory("business")
                        setFormData({ ...formData, tier: "business", businessTierSlug: "local-sponsor" })
                      }}
                      className={`p-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        memberCategory === "business"
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      🏢 Business Member / Sponsor
                    </button>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">
                  {memberCategory === "business" ? "Business Contact Information" : "Member Information"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number (Optional)
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
              </div>

              {/* Tier Selection for Residential vs Business */}
              {intent !== "donation" ? (
                memberCategory === "residential" ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Select Residential Tier
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
                      Select Business Sponsorship Tier
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.businessTierSlug === "local-sponsor"
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="businessTierSlug"
                          value="local-sponsor"
                          checked={formData.businessTierSlug === "local-sponsor"}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                          Local Business Sponsor
                        </div>
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                          $100 <span className="text-sm font-normal text-slate-500">/ year</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Includes directory listing & website sponsorship logo.
                        </p>
                      </label>

                      <label
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.businessTierSlug === "community-champion"
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="businessTierSlug"
                          value="community-champion"
                          checked={formData.businessTierSlug === "community-champion"}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                          Community Champion
                        </div>
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                          $250 <span className="text-sm font-normal text-slate-500">/ year</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Includes banner placement at Annual Garage Sale & National Night Out.
                        </p>
                      </label>
                    </div>
                  </div>
                )
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
                </div>
              )}

              {/* Optional Merchandise Add-ons */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Official Merchandise (Optional)
                </h3>

                <div className="space-y-3">
                  {/* T-Shirt */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTshirt}
                        onChange={(e) => setIncludeTshirt(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">NOG T-Shirt (+$25)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Available in sizes S to 2XL</div>
                      </div>
                    </label>

                    {includeTshirt && (
                      <select
                        value={tshirtSize}
                        onChange={(e) => setTshirtSize(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                      >
                        <option value="S">Size S</option>
                        <option value="M">Size M</option>
                        <option value="L">Size L</option>
                        <option value="XL">Size XL</option>
                        <option value="2XL">Size 2XL</option>
                      </select>
                    )}
                  </div>

                  {/* Mug */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMug}
                        onChange={(e) => setIncludeMug(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">NOG Coffee Mug (+$15)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Classic ceramic neighborhood mug</div>
                      </div>
                    </label>
                  </div>

                  {/* Magnet */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMagnet}
                        onChange={(e) => setIncludeMagnet(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Car Magnet / Badge (+$5)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Weatherproof full color vinyl</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment Method
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                      formData.paymentMethod === "paypal"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
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
                      <div className="font-bold text-slate-900 dark:text-white">Credit / Debit Card or PayPal</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Instant online processing
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                      formData.paymentMethod === "check"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
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
                      <div className="font-bold text-slate-900 dark:text-white">Pay Cash / Check Later</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Register profile now & pay offline
                      </div>
                    </div>
                  </label>
                </div>

                {/* Support Email Notice */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-3">
                  <span className="text-lg">✉️</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Need help or running into payment issues?</span>
                    <div>
                      Feel free to contact the North of Grand President:{" "}
                      <ObfuscatedEmail email={paymentSupportEmail} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Total & Submit Button */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Due
                  </div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    ${calculatedTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg text-base disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Complete Registration"}
                </button>
              </div>
            </form>
          ) : (
            /* Inline Confirmation Modal for Stub/PayPal */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  PayPal Order Created
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Order ID: <span className="font-mono font-bold text-slate-900 dark:text-white">{paypalData.orderId}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm max-w-md mx-auto space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Account ID (ULID):</span>
                  <span className="font-mono font-bold text-xs">{paypalData.accountId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Total Amount:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">${calculatedTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handleConfirmPayPal}
                  disabled={loading}
                  className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "Confirming..." : "Complete PayPal Payment"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MembershipSignupPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading signup...</div>}>
      <MembershipForm />
    </Suspense>
  )
}
