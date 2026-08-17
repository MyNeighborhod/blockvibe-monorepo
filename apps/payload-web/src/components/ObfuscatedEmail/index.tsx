"use client"

import React, { useState } from "react"

interface ObfuscatedEmailProps {
  email: string
  className?: string
}

export function ObfuscatedEmail({ email, className = "" }: ObfuscatedEmailProps) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const parts = email.split("@")
  const user = parts[0] || "northofgrandpresident"
  const domain = parts[1] || "gmail.com"

  const handleCopy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleOpenEmail = () => {
    window.location.href = `mailto:${email}`
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 font-semibold ${className}`}>
      {!revealed ? (
        <span className="inline-flex items-center gap-1">
          <span>{user}</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
            [at]
          </span>
          <span>{domain}</span>
        </span>
      ) : (
        <a
          href={`mailto:${email}`}
          className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700"
        >
          {email}
        </a>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all border border-slate-300 dark:border-slate-600 shadow-sm"
        title="Copy email to clipboard"
      >
        {copied ? "✓ Copied!" : "📋 Copy"}
      </button>

      {!revealed && (
        <button
          type="button"
          onClick={handleOpenEmail}
          className="text-xs text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 font-normal"
        >
          (open mail app)
        </button>
      )}
    </span>
  )
}
