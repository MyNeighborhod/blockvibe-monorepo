# BlockVibe CRM Implementation Plan (Approach A: Isolated Frontend Dashboard)

This document details the implementation plan for adding lightweight CRM features (Residents & Businesses directory, and a newsletter/email broadcast tool) to the BlockVibe multi-tenant platform.

To maintain simplicity and prevent non-technical neighborhood administrators from being confused by the core Payload CMS `/admin` panel, we will implement **Approach A**: a completely isolated frontend portal at `/[tenant]/dashboard`.

---

## 1. User Interface Wireframe

Below is the design mockup for the custom frontend dashboard showing the Directory and the Email Composer drawer:

![CRM Dashboard Mockup](./crm_dashboard_mockup.png)

---

## 2. Database Collection Design

We will define a unified `Contacts` collection in Payload CMS. Using a unified collection makes searching, filtering, and multi-selection for email broadcasts simpler and cleaner.

### Collection Schema: `contacts`
* **File:** `src/collections/Contacts.ts`
* **Fields:**
  * `name` (Text, Required) - Full name of the resident or name of the business.
  * `type` (Select, Required) - Options: `['resident', 'business']`.
  * `email` (Email, Required, Unique within the tenant scope).
  * `phone` (Text, Optional).
  * `unsubscribed` (Checkbox, Default: `false`) - Indicates if the contact opted out of emails.
  * `tenant` (Relationship to `tenants` collection) - Automatically injected and handled by the `@payloadcms/plugin-multi-tenant` plugin.

### Hiding from Technical `/admin` Sidebar
To keep the standard admin panel clean, we will hide the raw `contacts` list from standard users. It will only be visible to Super Admins.
```typescript
// inside Contacts collection config
admin: {
  hidden: ({ user }) => {
    // Only show to super-admins in the back-office
    const SUPER_ADMIN_EMAILS = ['eugen8@gmail.com'];
    return !user?.email || !SUPER_ADMIN_EMAILS.includes(user.email);
  }
}
```

---

## 3. Directory & Component Structure

We will add the following pages and components under the `(frontend)` app group:

```
src/
├── collections/
│   └── Contacts.ts             # [NEW] Contacts database schema
├── app/
│   └── (frontend)/
│       └── [tenant]/
│           ├── dashboard/      # [NEW] Isolated Frontend Portal
│           │   ├── layout.tsx  # Checks auth, renders sidebar
│           │   ├── page.tsx    # Dashboard home / stats
│           │   └── crm/        # Directory list & composer
│           │       └── page.tsx
│           └── unsubscribe/    # [NEW] Public opt-out route
│               └── page.tsx    
```

---

## 4. Security & Access Control

1. **Authentication:**
   We will verify user sessions inside `src/app/(frontend)/[tenant]/dashboard/layout.tsx` using Payload's native authentication helper:
   ```typescript
   import { getPayload } from 'payload'
   import configPromise from '@payload-config'
   import { headers } from 'next/headers'
   import { redirect } from 'next/navigation'

   const payload = await getPayload({ config: configPromise })
   const { user } = await payload.auth({ headers: await headers() })

   if (!user) {
     redirect(`/${tenant}/login`)
   }
   ```

2. **Tenant Scoping:**
   We must ensure the logged-in user has permission to manage the current `tenant`.
   * The `@payloadcms/plugin-multi-tenant` plugin automatically restricts user accounts to specific tenants.
   * If a user is registered under `nog` (North of Grand), their database queries for `contacts` are automatically filtered to only return Contacts matching the `nog` tenant ID.

---

## 5. Outbound Email, Opt-In, and Unsubscribe Architecture

To support the email workflows (newsletters, invites, and campaigns) across different tenants, the platform implements a **Dual-Delivery Pipeline** option while strictly maintaining opt-in and unsubscribe compliance regardless of the chosen delivery channel.

### Dual-Adapter Delivery Options

1. **Option A: Global AWS SES SMTP (Platform Fallback)**
   * **Scope:** Used by all tenants by default. Emails are sent from the verified system domain (e.g., `info@blockvibe.org` or `noreply@mail.blockvibe.org`) using the shared credentials configured in `src/payload.config.ts`.
   * **Domain Verification:** Restricted to verified identities in the platform's AWS account.

2. **Option B: Tenant-Connected Gmail API via OAuth2 (Custom Mailer)**
   * **Scope:** Enabled when a neighborhood association (tenant) connects their own Google Workspace or Gmail account via OAuth2 on the dashboard settings.
   * **Mechanics:** Nodemailer dynamically initializes the transport configuration for the tenant using a securely stored `gmailRefreshToken` on the `Tenant` record, allowing them to send emails directly from their own address (e.g., `president@northofgrand.org`).

---

### Permissive Opt-In Rules

To comply with anti-spam standards (like CAN-SPAM and bulk sender requirements), the platform enforces strict opt-in verification:
* **Approved Resident Members:** Only registered neighbors with status `approved` are eligible to receive neighborhood broadcasts or newsletters.
* **Pending Invites:** If an admin manually adds a resident or business contact, the record enters a `pending-invite` status. The system is restricted from sending any transactional notifications, community newsletters, or broadcasts to that address. Only a single, initial invitation email can be sent; further emails are blocked until the recipient actively accepts the invite to confirm their opt-in.
* **Newsletter/Public Opt-In:** Newsletter signups on public landing pages must explicitly submit through the `forms` collection before receiving communications.

---

### Opt-Out (Unsubscribe) Execution & Compliance

All outbound emails, whether sent via **AWS SES** or **Gmail API**, MUST enforce the unsubscribe mechanism:

1. **One-Click Native Opt-Out (RFC 8058)**
   * Every sent email includes `List-Unsubscribe` and `List-Unsubscribe-Post` SMTP headers. This allows mail clients (like Gmail or Yahoo) to display a native "Unsubscribe" button at the top of the interface.
   * Native client clicks trigger a background POST to `/api/unsubscribe-oneclick` which marks the resident's record as `unsubscribed: true` without requiring web UI interactions.

2. **Secure Footer Unsubscribe URL**
   * Every email template appends a customized HTML footer:
     ```html
     <p style="font-size: 12px; color: #666; text-align: center;">
       You are receiving this because you are registered as a resident or business in the neighborhood.
       <a href="https://{{tenant_domain}}/unsubscribe?email={{email_address}}&token={{opt_out_token}}">Unsubscribe</a>
     </p>
     ```
   * The `opt_out_token` is a cryptographic HMAC hash of the user's email and the `PAYLOAD_SECRET` to prevent URL tampering.
   * Clicking the link directs the user to `src/app/(frontend)/[tenant]/unsubscribe/page.tsx` which verifies the token and sets the contact/user `unsubscribed` flag to `true`.

3. **Database Suppression**
   * Before any broadcast campaign is dispatched, the server-side campaign script (`sendBroadcastAction`) queries the resident list and filters out any contacts/users where `unsubscribed` is `true`.

4. **Bounces and Complaints Suppression**
   * **AWS SES:** SNS webhooks listen for bounce and spam complaints, triggering a POST callback that automatically marks the affected email as `unsubscribed` in the database.
   * **Gmail OAuth:** Bounces arrive in the tenant's inbox (as standard "Mailer-Daemon" bounce alerts), and the platform can optionally monitor Gmail API callbacks to mark failed addresses as unsubscribed in the background.

---

## 6. Implementation Status & Checklist

The limited CRM and Email Broadcaster system has been implemented directly on top of the native `Users` collection to act as the primary resident directory and email manager:

- [x] **Step 1: Resident Directory & CRM Foundation**
  - Utilized the `Users` collection which has built-in `isNeighbor`, `role`, and `tenants` fields.
  - Seeding scripts (`seed-nog.ts` and `seed-nog-users.ts`) map neighborhood administrators and resident users to their respective tenant associations.
- [x] **Step 2: SMTP Configuration (AWS SES / Mailpit)**
  - Configured nodemailer transporter options in `src/payload.config.ts`.
  - Corrected production SSL/TLS connection behavior: STARTTLS on SMTP port 587 requires `SMTP_SECURE=false`.
- [x] **Step 3: Email Broadcaster Page & Campaign Composer**
  - Implemented the page at [EmailDashboard](file:///Users/eugen/dev/blockvibe/blockvibe-monorepo/apps/payload-web/src/app/(frontend)/[tenant]/(dashboard)/dashboard/email/page.tsx).
  - Built the interactive [BroadcastForm](file:///Users/eugen/dev/blockvibe/blockvibe-monorepo/apps/payload-web/src/app/(frontend)/[tenant]/(dashboard)/dashboard/email/BroadcastForm.tsx) allowing admins to select specific recipients via checkboxes (with a Select/Deselect All helper), compose the Subject and Message, and submit.
- [x] **Step 4: Server Action & Quota Enforcement**
  - Built the [sendBroadcastAction](file:///Users/eugen/dev/blockvibe/blockvibe-monorepo/apps/payload-web/src/app/(frontend)/[tenant]/(dashboard)/dashboard/email/actions.ts) server action.
  - Validates inputs, initializes/retrieves tenant-email-quotas, ensures the monthly broadcast volume limit is not exceeded, and increments the count upon successful transmission.
  - Propagates transmission failures to ensure E2E validation.
- [x] **Step 5: End-to-End Test Suite Validation**
  - Created the [email.e2e.spec.ts](file:///Users/eugen/dev/blockvibe/blockvibe-monorepo/apps/payload-web/tests/e2e/email.e2e.spec.ts) Playwright spec to verify the entire flow: logging in as NOG admin, navigating to the broadcaster, selecting only `eugen8@gmail.com`, composing a message, and verifying successful transmission.

