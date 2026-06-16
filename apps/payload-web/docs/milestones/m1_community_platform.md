# Milestone 1: Community Platform

A neighborhood (tenant) gets a public website, a member directory, lightweight fundraising, democratic voting, and a simple CRM — all scoped per tenant and manageable by tenant admins without touching the core Payload `/admin` panel for day-to-day work.

**Audience:** neighborhood organizers, board members, and residents who contribute or vote.

**Principle:** ship in thin vertical slices. Each step below is independently deployable and builds on the previous one.

---

## Starting point (already in the repo)

- Multi-tenant routing and per-tenant themes
- Pages and posts with the layout builder (blocks: hero, content, CTA, media, etc.)
- Users with roles (`superadmin`, `admin`, `editor`, `contributor`) and approval staging (`pending` → `approved`)
- Self-registration tied to the active tenant from the request host

This milestone extends that foundation; it does not replace it.

---

## Feature overview

### 1. Basic site builder

Public-facing site each tenant controls without writing code.

- **Pages & navigation**
  - Create and reorder pages (home, about, contact, custom)
  - Draft / publish workflow (already exists — polish admin UX for tenant editors)
  - Per-tenant header and footer menus
- **Content blocks**
  - Reuse existing layout blocks (hero, rich text, media, CTA, archive)
  - Add tenant-specific blocks as needed (e.g. featured members, upcoming vote, fundraiser progress)
- **Member-visible areas**
  - Optional “members only” pages (gated by login + approved status)
  - Public profile pages at `/[tenant]/members/[slug]` (see §2)
- **Branding**
  - Tenant template (light / dark) and custom CSS per slug (already supported)
  - Logo, site title, and social links in header/footer globals

### 2. Member profiles

Residents and contributors have a presence on the site beyond a login account.

- **Profile record**
  - Display name, photo, short bio, optional links (website, social)
  - Visibility: `public` | `members-only` | `hidden`
  - Relationship to tenant (multi-tenant scoped)
- **Link to user account (optional)**
  - A profile may exist without a login
  - When linked to an approved `users` record, show a **Registered** badge in admin and on the public profile
- **Self-service**
  - Logged-in members can edit their own profile (name, bio, photo)
  - Admins can create or edit any profile
- **Directory integration**
  - Profiles appear in the member directory (see §5) with filters (registered vs contact-only)

### 3. Fundraising

Tenants run their own recurring support drive; each tenant connects **their own** PayPal account.

- **Contributor tiers**
  - **Annual** — one recurring yearly amount
  - **Monthly** — one recurring monthly amount
  - Tenant admin configures tier labels, suggested amounts, and public copy on a “Support us” page
- **PayPal connection (per tenant)**
  - Tenant admin connects their PayPal via OAuth or stores a PayPal subscription / billing plan ID (bring-your-own PayPal — no platform-wide payment pool)
  - Webhook or return URL confirms active subscription and maps it to a `Contributor` record
- **Contributor records**
  - Fields: member/profile link, tier (`annual` | `monthly`), amount, PayPal subscription ID, status, start date
  - Status lifecycle (admin can override):
    - `pending` — checkout started, not confirmed
    - `active` — recurring payment confirmed
    - `paused` — payment failed or member paused
    - `cancelled` — ended
    - `lapsed` — was active, now inactive
- **Admin controls**
  - List all contributors with status, tier, and amount
  - Manually change status (e.g. honour offline payments, fix webhook misses)
  - Export contributor list (CSV)
- **Contributor voting rights**
  - Tenant setting: “Only active contributors may vote” (on/off)
  - When on, voting endpoints check contributor status `active` in addition to approved membership
  - Contributors see their status and tier on their dashboard

### 4. Voting

Structured decisions: board elections, budget approval, neighbourhood polls.

- **Poll / questionnaire (admin-created)**
  - Title, description, optional cover image
  - Schedule: `opensAt`, `closesAt` (or manual close)
  - Status: `draft` | `open` | `closed`
  - One or more questions per poll:
    - Single choice (radio)
    - Multiple choice (checkbox)
    - Optional free-text comment per question
  - Eligibility rules (per poll):
    - All approved members
    - Active contributors only (ties to §3)
    - Custom member list (advanced — later step)
- **Member experience**
  - List open and past polls on `/[tenant]/dashboard/votes` (or public if configured)
  - One ballot per member per poll (enforced server-side)
  - Confirmation screen after submit; no vote changes after submit (v1)
- **Results**
  - Admin view: live counts while open; full breakdown when closed
  - **Export to CSV** — one row per ballot or per question (document format in implementation)
    - Columns: poll id, question, option, voter id (or anonymized token), timestamp
  - Optional: public results page after close (tenant setting)
- **Audit**
  - Admin cannot change individual votes; can only close poll or void entire poll with reason (logged)

### 5. Simple CRM

One place for admins to see everyone the neighbourhood knows — whether they log in or not.

- **Unified directory (admin view)**
  - Single list: members, contacts, and linked user accounts
  - Columns: name, email, phone, address (if any), type, registered ✓, contributor status, tags
- **Record types**
  - **User (registered)** — row linked to `users` with approved status; **Registered** checkmark in UI
  - **Contact** — no login; can still receive email and appear in directory
    - Subtypes: `resident`, `business` (or tags — keep flexible)
  - **Profile** — optional link to §2 member profile for public page
- **Contact fields**
  - Name (required), email, phone (optional)
  - **Mailing address** (optional): street, city, state, zip
  - `unsubscribed` flag for email compliance
  - Notes (admin-only)
- **Email from CRM**
  - **One contact** — compose to a single person
  - **Selected group** — multi-select rows → send
  - **All contacts** — every contact with email and not unsubscribed
  - **All users** — every approved user with email for this tenant
  - **All members** — union of contacts + users (dedupe by email)
  - Composer: subject, rich HTML body, preview, send
  - Every outbound message includes unsubscribe link (see [crm/implementation_plan.md](../crm/implementation_plan.md))
- **Dashboard home (tenant admin)**
  - Counts: members, contacts, active contributors, open polls
  - Shortcuts: add contact, compose email, create poll

---

## Suggested implementation track

Work through these in order. Each step is a shippable increment; later steps assume earlier ones exist.

### Step 1 — Tenant dashboard shell

Lay the UI foundation before new collections pile up.

- Route group: `/[tenant]/dashboard` with auth gate (approved users only)
- Sidebar: Directory, Email, Votes, Fundraising, Settings (stubs OK)
- Role check: `admin` and `editor` see CRM; `contributor` sees own profile and votes only
- Hide raw CRM collections from default Payload sidebar for tenant admins (keep superadmin access)

**Done when:** an approved admin can log in and land on an empty dashboard with navigation.

---

### Step 2 — Contacts collection & directory list

CRM data model first — everything else references people.

- `contacts` collection (tenant-scoped): name, email, phone, address, type, unsubscribed, notes
- Admin directory table: search, filter by type, pagination
- CSV import (optional stretch): upload spreadsheet → create contacts

**Done when:** admin can CRUD contacts and see them in the dashboard directory.

---

### Step 3 — Link users to directory (Registered checkmark)

Bridge auth users and CRM records.

- Show approved `users` in the same directory view
- **Registered** badge when `users` row exists and `status === approved`
- Optional: auto-create a `contacts` row on user approval (same email) or explicit “link to contact” action
- Dedupe by email in list UI

**Done when:** directory shows both contacts and users; registered users are visually distinct.

---

### Step 4 — Email composer (single, group, broadcast)

Outbound email before fundraising and voting need notifications.

- **Dual Transporters:** Support global SMTP / SES / Resend fallback in `payload.config.ts` (Option A) AND tenant-connected Gmail API via OAuth2 (Option B).
- **Compose drawer:** Pick recipients (one, multi-select, all contacts, all users, all members).
- **Server action:** Respect `unsubscribed` (suppression list), verify opt-in status, and append footer with secure unsubscribe URL.
- **Unsubscribe compliance:** Support RFC 8058 1-click unsubscribe headers alongside the public `/[tenant]/unsubscribe` page route.

**Done when:** Admin can email one contact, a selection, or everyone, with opt-out and opt-in rules honored uniformly across both delivery options.

---

### Step 5 — Member profiles

Public-facing identity on top of CRM/users.

- `member-profiles` collection (or extend contacts with profile fields)
- Fields: slug, display name, photo, bio, visibility, link to `users` and/or `contacts`
- Public page `/[tenant]/members/[slug]`
- Member self-edit for own profile; admin edits all

**Done when:** at least one public profile page works and directory links to it.

---

### Step 6 — Site builder polish & member blocks

Make the public site reflect the community features.

- “Members” block: grid of public profiles
- “Support us” page template (placeholder until Step 7)
- Members-only page access rule (approved login required)
- Document which blocks tenant editors should use (short guide in admin)

**Done when:** tenant can publish a homepage with a member grid and a gated page.

---

### Step 7 — Fundraising: tiers & PayPal connect

Payments without blocking the rest of the platform.

- Tenant settings: annual/monthly tier copy and amounts; PayPal credentials or plan IDs
- Public “Support us” page with tier choice → PayPal checkout
- `contributors` collection: profile/user link, tier, amount, PayPal subscription id, status
- Webhook or return-handler → set status `active` / `pending` / `lapsed`
- Admin contributor list + manual status override + CSV export

**Done when:** a test subscription creates a contributor row and admin can see and edit status.

---

### Step 8 — Contributor voting eligibility

Connect fundraising to governance.

- Tenant setting: `contributorsOnlyVoting` boolean
- Shared helper: `canVote(user, tenant)` checks approved + optional active contributor
- Show contributor status on member dashboard

**Done when:** with setting on, non-contributors get a clear message when opening a vote.

---

### Step 9 — Polls: create & vote

Core democratic feature. **Tech:** hybrid poll-forms — see [voting/tech_selection.md](./voting/tech_selection.md).

- Extend `forms` via `formOverrides`: `formType: poll`, schedule, status, eligibility
- Extend `form-submissions` via `formSubmissionOverrides`: `submittedBy`, hooks (one vote per user, eligibility, open window)
- Add `forms` + `form-submissions` to `multiTenantPlugin`
- Member UI: dashboard list of open polls, ballot form (reuse Form field components + `radio`)
- Admin UI: create/edit poll in form builder, open/close via `status`

**Done when:** admin creates a poll, member votes once, admin sees counts.

---

### Step 10 — Poll results & CSV export

Close the loop for reporting.

- Admin results view: aggregate `form-submissions.submissionData` per question
- Export CSV over submissions for a poll (document column format in tech selection doc)
- Optional public results page after `closed`

**Done when:** admin downloads CSV after closing a poll; file opens cleanly in Excel/Sheets.

---

### Step 11 — Hardening & launch checklist

Production-ready for a pilot neighbourhood.

- Access control audit per collection (tenant scope, role matrix)
- Rate limits on email send and vote submit
- E2E tests: register → approve → vote; contact → email → unsubscribe
- Admin docs: how to connect PayPal, run a poll, export results
- Privacy note: what is stored, who can export voter data

**Done when:** one pilot tenant runs a real poll and a small fundraising drive end-to-end.

---

## Out of scope for M1 (later milestones)

Keep these visible so we do not over-build M1.

- Platform-billed payments (Blockvibe holds funds) — M1 is bring-your-own PayPal only
- Secret ballot / anonymous voting — M1 ties ballots to user id (admin export includes voter)
- SMS or physical mail — email and optional address fields only
- Full marketing automation (drip campaigns, A/B tests)
- Mobile app — responsive web only
- Cross-tenant analytics for superadmin

---

## Product presentation

Scene-by-scene demo script for the default tenant presentation site and accompanying video: [m1_presentation.md](./m1_presentation.md).

---

## Dependencies & references

| Topic | Doc |
| --- | --- |
| Demo / video script | [m1_presentation.md](./m1_presentation.md) |
| Roles and approval | [how_roles_work.md](../how_roles_work.md) |
| Voting tech selection (hybrid poll-forms) | [voting/tech_selection.md](./voting/tech_selection.md) |
| CRM dashboard wireframe & email architecture | [crm/implementation_plan.md](../crm/implementation_plan.md) |
| Deployment | [deployment/readme.md](../deployment/readme.md) |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-09 | Initial M1 scope and 11-step implementation track |
