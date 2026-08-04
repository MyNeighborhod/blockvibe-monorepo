import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Membership Flyer - North of Grand Neighborhood Association",
  description: "Printable membership flyer for North of Grand Neighborhood Association.",
}

export default function MembershipFlyerPage() {
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://www.northofgranddsm.org/membership/signup"

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 print:p-0 print:bg-white print:text-black">
      {/* Print Control Header (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/membership/signup"
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          ← Back to Signup Form
        </Link>
        <button
          onClick={() => {
            if (typeof window !== "undefined") window.print()
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          🖨️ Print This Flyer (1 Page)
        </button>
      </div>

      {/* 8.5 x 11 Printable Container */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 print:bg-white print:text-black rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
        {/* Header Badge */}
        <div className="text-center pb-6 border-b-2 border-indigo-600 print:border-indigo-600">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 print:bg-slate-100 print:text-indigo-900 mb-2">
            Registered 501(c)(3) Non-Profit Organization
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-indigo-950 dark:text-white print:text-indigo-950 tracking-tight">
            North of Grand Neighborhood Association
          </h1>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300 print:text-slate-700 mt-1">
            Become a Member & Build a Stronger Community Together
          </p>
        </div>

        {/* Hero / Mission Statement */}
        <div className="py-6 space-y-3 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white print:text-black">
            Why Join North of Grand?
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 print:text-slate-800">
            Your annual membership dues directly support neighborhood improvements, community events like the Annual Garage Sale, National Night Out, street tree plantings, safety initiatives, and advocacy for our residents. Every membership makes a difference!
          </p>
        </div>

        {/* Membership Tiers Box */}
        <div className="my-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/50 print:bg-slate-50 border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white print:text-black mb-4 text-center sm:text-left">
            Annual Membership Tiers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 print:bg-white border border-slate-200 dark:border-slate-600 shadow-sm">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500 print:text-slate-600">Individual</div>
              <div className="text-3xl font-black text-indigo-600 print:text-indigo-700 my-1">$10</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">Per resident / year</div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 print:bg-indigo-50 border-2 border-indigo-600 print:border-indigo-600 shadow-sm">
              <div className="text-xs uppercase font-bold tracking-wider text-indigo-700 print:text-indigo-800">Household</div>
              <div className="text-3xl font-black text-indigo-700 print:text-indigo-800 my-1">$20</div>
              <div className="text-xs text-indigo-900 dark:text-indigo-300 print:text-indigo-900 font-medium">Entire household / year</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 print:bg-white border border-slate-200 dark:border-slate-600 shadow-sm">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500 print:text-slate-600">Business / Sponsor</div>
              <div className="text-3xl font-black text-indigo-600 print:text-indigo-700 my-1">$100+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">Includes logo & directory listing</div>
            </div>
          </div>
        </div>

        {/* How to Join Section with QR Code */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="sm:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white print:text-black">
              2 Easy Ways to Join or Renew:
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <div>
                  <strong className="text-slate-900 dark:text-white print:text-black">Join Online (Fastest):</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-0.5">
                    Scan the QR code or visit: <br />
                    <span className="font-mono font-bold text-indigo-600 print:text-indigo-800 text-sm">
                      https://www.northofgranddsm.org/membership/signup
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <div>
                  <strong className="text-slate-900 dark:text-white print:text-black">Pay by Check (Mail or Hand Deliver):</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-0.5">
                    Make check payable to <strong>North of Grand Neighborhood Association</strong>. <br />
                    <em>Important:</em> Please write your <strong>email address</strong> on the check memo line so we can send your receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Column */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 print:bg-slate-50 border border-slate-200 dark:border-slate-600 text-center">
            <img
              src={qrCodeUrl}
              alt="Scan QR Code to Join North of Grand Neighborhood Association"
              className="w-36 h-36 rounded-lg shadow-sm border border-slate-300 print:border-slate-400"
            />
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 print:text-indigo-900 mt-2">
              Scan with Phone Camera
            </p>
            <p className="text-[10px] text-slate-500 print:text-slate-600">To Signup Online</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300 print:text-slate-800">
            North of Grand Neighborhood Association &bull; Des Moines, IA 50312
          </p>
          <p>
            Website: <strong>https://www.northofgranddsm.org</strong> &bull; Email: <strong>northofgrandpresident@gmail.com</strong>
          </p>
          <p className="text-[10px] text-slate-400 print:text-slate-500">
            Contributions to NOGNA are tax-deductible under IRS Section 501(c)(3).
          </p>
        </div>
      </div>
    </div>
  )
}
