"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

export default function MembershipLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            North of Grand Neighborhood Association
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-slate-900 dark:text-white tracking-tight">
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
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">
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
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">
                Renew Membership
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Already a member? Easily pay your annual dues to extend your active status for another 365 days.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full text-center py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md"
            >
              Renew from Dashboard
            </Link>
          </div>

          {/* Card 3: Merchandise & Donation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between transform hover:-translate-y-1 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl mb-4">
                👕
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">
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
      </div>
    </div>
  )
}
