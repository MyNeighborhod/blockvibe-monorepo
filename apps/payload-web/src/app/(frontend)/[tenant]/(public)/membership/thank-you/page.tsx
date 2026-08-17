"use client"

import React, { use } from "react"
import Link from "next/link"
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail"

export default function MembershipThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string
    method?: string
    status?: string
    paymentId?: string
    tier?: string
  }>
}) {
  const params = use(searchParams)
  const isCheck = params.method === "check"
  const accountId = params.accountId || "N/A"
  const tier = params.tier || "individual"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Thank You for Joining!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Your community membership registration has been processed successfully.
        </p>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8 text-left space-y-4 border border-slate-200 dark:border-slate-600">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-600">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Account ID (ULID)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-xs">
              {accountId}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-600">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Membership Tier</span>
            <span className="font-bold text-slate-900 dark:text-white capitalize">{tier} Member</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-600">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment Status</span>
            {isCheck ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Pending Check / Cash
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Active Annual Paying Member
              </span>
            )}
          </div>

          {params.paymentId && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment Receipt ID</span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{params.paymentId}</span>
            </div>
          )}
        </div>

        {isCheck && (
          <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-left text-sm text-amber-900 dark:text-amber-200">
            <h4 className="font-bold mb-1">Check Payment Instructions:</h4>
            <p>
              Please mail your paper check (payable to <strong>North of Grand Neighborhood Association</strong>) to our treasurer.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Please include your <strong>email address</strong> on the check memo line so we can match your payment. An admin will mark your membership active upon receipt.
            </p>
          </div>
        )}

        {/* Support Email Notice */}
        <div className="mb-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Questions or issues with your payment or receipt? Contact the North of Grand President:</span>
          <ObfuscatedEmail email="northofgrandpresident@gmail.com" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
