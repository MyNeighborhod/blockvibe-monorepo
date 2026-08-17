import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Newsletter Signup Flyer - North of Grand Neighborhood Association",
  description: "Printable flyer to sign up for the North of Grand Neighborhood Association newsletter.",
}

export default function NewsletterFlyerPage() {
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://www.northofgranddsm.org"

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 print:p-0 print:bg-white print:text-black">
      {/* Print Control Header (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          ← Back to Home
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
            Stay Connected &bull; Subscribe to Our Free Neighborhood Newsletter
          </p>
        </div>

        {/* Hero / Why Subscribe Section */}
        <div className="py-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white print:text-black text-center sm:text-left">
            Why Subscribe to Our Newsletter?
          </h2>
          <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 print:text-slate-800">
            Stay in the loop with everything happening in North of Grand! Our email newsletter brings community news, event reminders, and local resources straight to your inbox.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 print:bg-slate-50 border border-slate-200 dark:border-slate-600">
              <div className="text-2xl mb-1">🗞️</div>
              <h3 className="font-bold text-slate-900 dark:text-white print:text-black text-sm">Local News</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
                Updates on street safety, neighborhood improvements, and City of Des Moines initiatives.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 print:bg-slate-50 border border-slate-200 dark:border-slate-600">
              <div className="text-2xl mb-1">📅</div>
              <h3 className="font-bold text-slate-900 dark:text-white print:text-black text-sm">Community Events</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
                Annual Garage Sale, National Night Out, tree plantings, and social gatherings.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 print:bg-slate-50 border border-slate-200 dark:border-slate-600">
              <div className="text-2xl mb-1">📢</div>
              <h3 className="font-bold text-slate-900 dark:text-white print:text-black text-sm">Resident Voice</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
                Upcoming board meetings, volunteer opportunities, and ways to get involved.
              </p>
            </div>
          </div>
        </div>

        {/* How to Subscribe Box with QR Code */}
        <div className="my-6 p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 print:bg-slate-50 border-2 border-indigo-200 dark:border-indigo-800 print:border-indigo-600 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="sm:col-span-2 space-y-3">
            <h3 className="text-xl font-bold text-indigo-950 dark:text-white print:text-indigo-950">
              How to Subscribe (100% Free)
            </h3>
            
            <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200 print:text-slate-800">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-indigo-600 print:text-indigo-700">1.</span>
                <span>Scan the QR code with your phone camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-indigo-600 print:text-indigo-700">2.</span>
                <span>Enter your email address on our website:</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="font-mono font-bold text-indigo-600 print:text-indigo-800 text-base sm:text-lg">
                https://www.northofgranddsm.org
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-800 print:bg-white border border-slate-200 dark:border-slate-600 text-center shadow-sm">
            <img
              src={qrCodeUrl}
              alt="Scan QR Code to Subscribe to North of Grand Newsletter"
              className="w-36 h-36 rounded-lg border border-slate-300 print:border-slate-400"
            />
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 print:text-indigo-900 mt-2">
              Scan with Phone Camera
            </p>
            <p className="text-[10px] text-slate-500 print:text-slate-600">To Subscribe Online</p>
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
        </div>
      </div>
    </div>
  )
}
