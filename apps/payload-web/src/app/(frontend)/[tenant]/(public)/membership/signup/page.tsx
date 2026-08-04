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
  const [customAmount, setCustomAmount] = useState<number | string>(10)
  const [isCustomDonation, setIsCustomDonation] = useState(false)
  const [paymentSupportEmail, setPaymentSupportEmail] = useState("northofgrandpresident@gmail.com")
  const [enableBusinessMemberships, setEnableBusinessMemberships] = useState(false)

  // Merchandise Add-ons
  const [includeTshirt, setIncludeTshirt] = useState(false)
  const [tshirtStyle, setTshirtStyle] = useState("Tee Shirt") // 'Tee Shirt' | 'Tank Top'
  const [tshirtSize, setTshirtSize] = useState("M")

  const [includeMug, setIncludeMug] = useState(false)
  const [includeMedallion, setIncludeMedallion] = useState(false)
  const [includeTote, setIncludeTote] = useState(false)
  const [includeMagnet, setIncludeMagnet] = useState(false)

  const [includeOldTshirt, setIncludeOldTshirt] = useState(false)
  const [oldTshirtSize, setOldTshirtSize] = useState("M")

  const [formData, setFormData] = useState({
    name: "",
    email: urlEmail || "",
    phone: "",
    street: "",
    city: "Des Moines",
    state: "IA",
    zipCode: "50312",
    address: "",
    tier: "individual", // 'individual' | 'household' | 'business'
    businessTierSlug: "local-sponsor", // 'local-sponsor' | 'community-champion'
    recurringFrequency: "annual", // 'annual' | 'one_time'
    paymentMethod: "paypal", // 'paypal' | 'check'
    agreeEmails: true,
    password: "",
    createAccount: true,
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
    (includeTshirt ? 25 : 0) +
    (includeMug ? 15 : 0) +
    (includeMedallion ? 35 : 0) +
    (includeTote ? 10 : 0) +
    (includeMagnet ? 2 : 0) +
    (includeOldTshirt ? 10 : 0)

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
      includeTshirt ? `T-Shirt/Tank Top (${tshirtStyle}, Size: ${tshirtSize}) - $25` : null,
      includeMug ? "Mug ($15)" : null,
      includeMedallion ? "Medallion ($35)" : null,
      includeTote ? "Tote ($10)" : null,
      includeMagnet ? "Magnet ($2)" : null,
      includeOldTshirt ? `Old Tee Shirt Design (Limited Sizes: ${oldTshirtSize}) - $10` : null,
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
          {/* 501(c)(3) Non-Profit Badge */}
          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm">
              501c3
            </span>
            <div>
              <div className="font-bold">Registered 501(c)(3) Non-Profit Organization</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300/80">
                All donations and membership dues support North of Grand community projects. Contributions are tax-deductible to the extent allowed by law.
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {error}
            </div>
          )}

          {!paypalData ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selector (Residential vs Business) */}
              {intent !== "donation" && enableBusinessMemberships && (
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
                      Account Password (Optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Choose password (or reset anytime via email)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address: Street, City, State, ZIP */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="1234 42nd Street"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Des Moines"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="IA"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="50312"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeEmails"
                      checked={formData.agreeEmails}
                      onChange={(e) => setFormData({ ...formData, agreeEmails: e.target.checked })}
                      className="w-5 h-5 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        I agree to receive neighborhood email updates, newsletters, and announcements.
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        (Transactional emails like payment receipts and account confirmations will always be sent.)
                      </div>
                    </div>
                  </label>
                </div>

                {intent === "donation" && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="createAccount"
                        checked={formData.createAccount}
                        onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                        className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Also create a neighborhood account for me based on my email address.
                        </span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          (Allows you to log into the neighborhood portal anytime with {formData.email || "your email"}.)
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Tier Selection for Residential vs Business */}
              {intent !== "donation" ? (
                <>
                  {memberCategory === "residential" ? (
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
                  )}

                  {/* Payment Type & Frequency (Recurring vs One-Time) */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Payment Type & Frequency *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                          formData.recurringFrequency === "annual"
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="recurringFrequency"
                          value="annual"
                          required
                          checked={formData.recurringFrequency === "annual"}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            🔄 Yearly Recurring Payment
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Annual membership dues (renews each year).
                          </div>
                        </div>
                      </label>

                      <label
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                          formData.recurringFrequency === "one_time"
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="recurringFrequency"
                          value="one_time"
                          required
                          checked={formData.recurringFrequency === "one_time"}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            💳 One-Time Payment
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Single 1-year contribution without auto-renew.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Select Donation Amount ($)
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      🔒 One-Time Payment (No recurring fees)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDonation(false)
                        setCustomAmount(10)
                      }}
                      className={`p-4 rounded-xl border-2 font-bold transition-all text-center ${
                        !isCustomDonation && Number(customAmount) === 10
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-2xl font-extrabold">$10</div>
                      <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Standard Contribution
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDonation(true)
                        if (customAmount === 10) setCustomAmount(0)
                      }}
                      className={`p-4 rounded-xl border-2 font-bold transition-all text-center ${
                        isCustomDonation || (Number(customAmount) !== 10 && customAmount !== "")
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-2xl font-extrabold">Other Amount</div>
                      <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Enter custom donation (or $0 for merch only)
                      </div>
                    </button>
                  </div>

                  {(isCustomDonation || (Number(customAmount) !== 10 && customAmount !== "")) && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Enter Custom Amount ($) — Enter 0 if ordering merchandise only
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-lg">$</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customAmount}
                          onChange={(e) => {
                            const val = e.target.value
                            setCustomAmount(val === "" ? "" : Math.max(0, Number(val)))
                          }}
                          placeholder="e.g. 0 or 25"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Merchandise Add-ons */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Add Official Merchandise (Optional)
                  </h3>
                  <p className="mt-1 text-sm font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-2">
                    <span>⚠️</span>
                    <span><strong>Please check merch availability first</strong> before completing your payment by reaching out to <strong>northofgrandpresident@gmail.com</strong>.</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Tee Shirt / Tank Top */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 gap-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTshirt}
                        onChange={(e) => setIncludeTshirt(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Tee Shirt / Tank Top (+$25)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Available in sizes S to 2XL</div>
                      </div>
                    </label>

                    {includeTshirt && (
                      <div className="flex items-center space-x-2 pl-8 sm:pl-0">
                        <select
                          value={tshirtStyle}
                          onChange={(e) => setTshirtStyle(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold"
                        >
                          <option value="Tee Shirt">Tee Shirt</option>
                          <option value="Tank Top">Tank Top</option>
                        </select>
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
                      </div>
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
                        <div className="font-bold text-slate-900 dark:text-white">Coffee Mug (+$15)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Classic ceramic neighborhood mug</div>
                      </div>
                    </label>
                  </div>

                  {/* Medallion */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMedallion}
                        onChange={(e) => setIncludeMedallion(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Medallion (+$35)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Custom commemorative medallion</div>
                      </div>
                    </label>
                  </div>

                  {/* Tote */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTote}
                        onChange={(e) => setIncludeTote(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Tote Bag (+$10)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Reusable canvas tote bag</div>
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
                        <div className="font-bold text-slate-900 dark:text-white">Magnet (+$2)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Full color neighborhood magnet</div>
                      </div>
                    </label>
                  </div>

                  {/* Old Tee Shirt Design */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 gap-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOldTshirt}
                        onChange={(e) => setIncludeOldTshirt(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Old Tee Shirt Design (+$10)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Limited sizes available</div>
                      </div>
                    </label>

                    {includeOldTshirt && (
                      <select
                        value={oldTshirtSize}
                        onChange={(e) => setOldTshirtSize(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold shrink-0 self-start sm:self-auto"
                      >
                        <option value="S">Size S</option>
                        <option value="M">Size M</option>
                        <option value="L">Size L</option>
                        <option value="XL">Size XL</option>
                        <option value="2XL">Size 2XL</option>
                      </select>
                    )}
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
                  {loading
                    ? "Processing..."
                    : intent === "donation"
                    ? formData.createAccount
                      ? "Register Account & Complete Donation"
                      : `Complete Donation ($${calculatedTotal.toFixed(2)})`
                    : intent === "renewal"
                    ? "Renew Membership Dues"
                    : "Complete Registration"}
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
