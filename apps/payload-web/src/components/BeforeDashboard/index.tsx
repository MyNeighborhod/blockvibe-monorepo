import { Banner } from "@payloadcms/ui/elements/Banner"
import React from "react"
import Link from "next/link"

import { SeedButton } from "./SeedButton"
import "./index.scss"

const baseClass = "before-dashboard"

const BeforeDashboard: React.FC = () => {
  const instanceColor = process.env.APP_INSTANCE_COLOR || "LOCAL / STANDALONE"
  const isBlue = instanceColor.toUpperCase() === "BLUE"
  const isGreen = instanceColor.toUpperCase() === "GREEN"

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>

      {/* Active Server Instance Badge for Admins */}
      <div style={{ marginTop: "12px", marginBottom: "16px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            backgroundColor: isBlue ? "#1e3a8a" : isGreen ? "#064e3b" : "#1f2937",
            color: isBlue ? "#93c5fd" : isGreen ? "#6ee7b7" : "#e5e7eb",
            border: `1px solid ${isBlue ? "#3b82f6" : isGreen ? "#10b981" : "#4b5563"}`,
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            letterSpacing: "0.5px",
          }}
        >
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span>Active Server Instance: <strong>{instanceColor}</strong></span>
        </div>
      </div>

      <div style={{ marginTop: "8px", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <Link
          href="/visual-builder"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            backgroundColor: "#10b981",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "700",
            textDecoration: "none",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Launch Visual Website Builder
        </Link>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            textDecoration: "none",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="10" rx="1" />
            <rect width="7" height="5" x="3" y="15" rx="1" />
          </svg>
          Go to Community Dashboard
        </Link>
      </div>
      Here&apos;s what to do next:
      <ul className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {" with a few pages, posts, and projects to jump-start your new site, then "}
          <a href="/" target="_blank">
            visit your website
          </a>
          {" to see the results."}
        </li>
        <li>
          {"Modify your "}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            rel="noopener noreferrer"
            target="_blank"
          >
            collections
          </a>
          {" and add more "}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            fields
          </a>
          {" as needed. If you are new to Payload, we also recommend you check out the "}
          <a
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            rel="noopener noreferrer"
            target="_blank"
          >
            Getting Started
          </a>
          {" docs."}
        </li>
        <li>
          Commit and push your changes to the repository to trigger a redeployment of your project.
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
