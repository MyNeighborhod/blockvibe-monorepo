import { Banner } from "@payloadcms/ui/elements/Banner"
import React from "react"
import Link from "next/link"

import { SeedButton } from "./SeedButton"
import "./index.scss"

const baseClass = "before-dashboard"

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>
      <div style={{ marginTop: "16px", marginBottom: "24px" }}>
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
      {"Pro Tip: This block is a "}
      <a
        href="https://payloadcms.com/docs/custom-components/overview"
        rel="noopener noreferrer"
        target="_blank"
      >
        custom component
      </a>
      , you can remove it at any time by updating your <strong>payload.config</strong>.
    </div>
  )
}

export default BeforeDashboard
