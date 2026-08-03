"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function MembershipLandingPage() {
  const [lookupEmail, setLookupEmail] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [memberResult, setMemberResult] = useState<any | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupEmail) return
    setLookupLoading(true)
    setLookupError(null)
    setMemberResult(null)

    try {
      const res = await fetch("/api/membership/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Lookup failed.")
      }

      if (!data.found) {
        setLookupError("No existing membership account found for that email address.")
      } else {
        setMemberResult(data)
      }
    } catch (err: unknown) {
      setLookupError((err as Error).message || "An unexpected error occurred.")
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            North of Grand Neighborhood Association
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Membership & Community Support
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-400">
            Donations & merchandise purchases help us put on community events such as our Annual Garage Sale and National Night Out. Your participation directly impacts our neighborhood.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: New Member */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between transform hover:-translate-y-1 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl mb-4">
                🏡
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Become a Member
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Join as an Individual ($10/yr) or Household ($20/yr) to support local projects and gain voting privileges.
              </p>
            </div>
            <Link
              href="/membership/signup?intent=new"
              className="w-full text-center py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md"
            >
              Become a Member
            </Link>
          </div>

          {/* Card 2: Renew Membership */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between transform hover:-translate-y-1 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-4">
                🔄
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Renew Membership
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Already a member? Easily pay your annual dues to extend your active status for another 365 days.
              </p>
            </div>
            <Link
              href="/membership/signup?intent=renewal"
              className="w-full text-center py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md"
            >
              Renew Dues
            </Link>
          </div>

          {/* Card 3: Merchandise & Donation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between transform hover:-translate-y-1 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl mb-4">
                👕
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Merchandise & Donate
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Get official North of Grand T-Shirts, Mugs, Magnets, or make a custom one-time donation.
              </p>
            </div>
            <Link
              href="/membership/signup?intent=donation"
              className="w-full text-center py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md"
            >
              Order Merch & Donate
            </Link>
          </div>
        </div>

        {/* Merchandise Showcase Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Official North of Grand Merchandise
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm">
              Show your neighborhood pride! You can order merchandise online or during membership registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Item 1: T-Shirt */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-600 text-center space-y-4">
              <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-600">
                <Image
                  src="/media/nog/img-7286_orig-1.jpg"
                  alt="North of Grand Merch T-Shirt"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">NOG T-Shirt</h3>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">$25</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Available in sizes S, M, L, XL, 2XL</p>
            </div>

            {/* Item 2: Badge / Magnet */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-600 text-center space-y-4">
              <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-600">
                <Image
                  src="/media/nog/northofgrand-badge-color-white-1-1_orig-1.png"
                  alt="North of Grand Badge Magnet"
                  fill
                  className="object-contain p-4"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Car Magnet / Badge</h3>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">$5</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weatherproof full color vinyl magnet</p>
            </div>

            {/* Item 3: Coffee Mug */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-600 text-center space-y-4">
              <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-600">
                <Image
                  src="/media/nog/img-7444_orig-1.jpg"
                  alt="North of Grand Merch Mug"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">NOG Coffee Mug</h3>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">$15</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Classic ceramic neighborhood mug</p>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/membership/signup?intent=donation"
              className="inline-block py-3.5 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md text-base"
            >
              Order Merchandise & Support NOG
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Pay via PayPal/Credit Card or select cash/check upon pickup. Email questions to <a href="mailto:northofgrandpresident@gmail.com" className="underline text-indigo-600 dark:text-indigo-400">northofgrandpresident@gmail.com</a>.
            </p>
          </div>
        </div>

        {/* Existing Member Quick Lookup Tool */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Check Your Membership Status & Account ID
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your email address below to look up your ULID Account ID and current expiration date.
            </p>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="email"
                required
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="Enter your email..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-white transition-all disabled:opacity-50"
              >
                {lookupLoading ? "Searching..." : "Lookup"}
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs">
                {lookupError}
              </div>
            )}

            {memberResult && (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-left space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Account Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{memberResult.user.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Account ID (ULID):</span>
                  <span className="font-mono text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                    {memberResult.user.accountId}
                  </span>
                </div>
                {memberResult.membership && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Annual Status:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {memberResult.membership.isAnnualPayingMember
                          ? "Active Annual Paying Member"
                          : "Pending / Inactive"}
                      </span>
                    </div>
                    {memberResult.membership.validUntil && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Valid Until:</span>
                        <span className="font-mono text-xs">
                          {new Date(memberResult.membership.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-600 text-center">
                  <Link
                    href={`/membership/signup?intent=renewal&email=${encodeURIComponent(memberResult.user.email)}`}
                    className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all"
                  >
                    Renew Dues Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
