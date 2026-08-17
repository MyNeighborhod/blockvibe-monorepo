# M1 Product Presentation — Demo Script

A scene-by-scene guide for the **Blockvibe feature presentation**. The **default tenant** (`default` slug — `info.blockvibe.org` / `localhost`) is the product demo site: it showcases what neighborhood associations get, and the video leads directly into M1 engineering work.

**Companion docs:** [M1 scope](./m1_community_platform.md) · [Business plan alignment](../.docs_excluded/Business%20plan.md) · [Voting tech](./voting/tech_selection.md)

**Format:** one narrated walkthrough (~12–18 minutes). Each scene states what you show, what you say, and what we still need to build.

---

## Presentation concept

**Title (working):** *Blockvibe — one platform for your neighborhood*

**Story arc:** A board member onboards a new association, grows the member list, invites residents, communicates by email, runs a poll, and opens recurring support — all from one place, without juggling Wix + spreadsheets + PayPal + survey tools.

**Demo tenant:** `default` (platform / North of Grand template). In the video, treat it as **“Riverside Neighborhood Association”** (fictional) or keep **Blockvibe** as the product shell — your choice when recording.

**Two surfaces to show**

| Surface | URL (example) | Who uses it |
| --- | --- | --- |
| **Public site** | `https://info.blockvibe.org` | Residents, visitors |
| **Member / admin dashboard** | `https://info.blockvibe.org/default/dashboard` *(target)* | Board, treasurers, members |
| **CMS back-office** | `/admin` | Power users, superadmin *(briefly — not the hero)* |

The narrative should emphasize the **dashboard** for day-to-day association work. Payload `/admin` appears only for “under the hood” or until dashboard slices ship.

---

## Build status legend

Use these tags when prepping and recording. Be honest in the video — “coming next” is part of the pitch.

| Tag | Meaning |
| --- | --- |
| **✅ Live** | Works in the repo today |
| **🎬 Demo** | Show UI/mock or partial flow; may need seed data or staging |
| **🔨 M1** | Planned in M1; demo narrates the intended flow |
| **📋 Later** | Commercial MVP or post-M1 |

---

## Demo flow overview

| # | Scene | Duration | M1 step |
| --- | --- | --- | --- |
| 1 | Cold open — the problem | ~1 min | — |
| 2 | Public website tour | ~2 min | Step 6 |
| 3 | Onboard a new neighborhood | ~2 min | Foundation + Step 1 |
| 4 | Members area — rudimentary CRM | ~2 min | Steps 2–3 |
| 5 | Send invites → member accepts | ~2 min | Steps 2–3 |
| 6 | Email members (SES) | ~2 min | Step 4 |
| 7 | Create a poll → members vote | ~3 min | Steps 9–10 |
| 8 | Fundraising (recurring support) | ~2 min | Step 7 |
| 9 | Close — roadmap & pilot ask | ~1 min | — |

---

## Scene 1 — Cold open

**Show:** Quick montage or static slides — Wix tab, spreadsheet, PayPal, email inbox, paper minutes.

**Say:**

> Neighborhood boards run on five tools that don’t talk to each other. Blockvibe is one platform: website, member directory, email, polls, and recurring support — built for volunteer-run associations.

**Tag:** Narration only.

**Leads to:** Business case; no build required.

---

## Scene 2 — Public website

**Show:** Default tenant homepage — hero, about, posts, contact form, header/footer.

**Say:**

> Every association gets a modern public site on its own domain. Pages are built from blocks — hero, news, contact — no code. Branding and theme are per neighborhood.

**Highlight:**

- Layout blocks on pages/posts **✅ Live**
- Per-tenant theme / custom CSS **✅ Live**
- Contact form (form builder) **✅ Live**
- “Members” directory block on homepage **🔨 M1** (Step 5–6)
- Members-only page (login required) **🔨 M1** (Step 6)

**Leads to:** M1 site builder polish, member profile block.

---

## Scene 3 — Onboard a new neighborhood

**Show:** Superadmin creates a tenant (or narrate over Terraform + seed script for a second slug e.g. `riverside`).

**Walkthrough to demo:**

1. **Tenants** in `/admin`: name, slug, template (light/dark), domain **✅ Live**
2. Seed or generate tenant content (`generate-tenant.ts` or manual pages) **✅ Live**
3. Custom domain / DNS (Cloudflare + Caddy) — show diagram or `info.blockvibe.org` **✅ Live** (infra)
4. Dashboard welcome for the new tenant **🔨 M1** (Step 1)

**Say:**

> Onboarding a neighborhood takes minutes: create the tenant, pick a template, point DNS, publish the first pages. The board lands on a dashboard — not a generic CMS.

**Talking point for pilots:**

> Today we white-glove the first domains; self-serve “launch in a weekend” comes with commercial MVP.

**Leads to:** Step 1 dashboard shell; commercial MVP self-serve onboarding.

---

## Scene 4 — Members area (rudimentary CRM)

**Show:** Dashboard → **Directory** (target UI). Until built, show wireframe from [crm/implementation_plan.md](../crm/implementation_plan.md) or `/admin` Users + future Contacts list.

**Walkthrough to demo:**

1. Open **Members / Directory** — unified list **🔨 M1** (Steps 2–3)
2. **Add contact** — name, email, phone, address, type (resident / business) **🔨 M1**
3. Show **Registered ✓** column when a row links to an approved user **🔨 M1**
4. Search and filter **🔨 M1**
5. Optional: CSV import **📋 Later** (commercial MVP) — mention as “next”

**Say:**

> The CRM is intentionally simple. The board sees everyone: people on the list who haven’t logged in yet, and members with a checkmark when they’ve registered. Addresses and notes stay in one place for mailings and records.

**Contrast:** Not Salesforce — a directory + email list for volunteer boards.

**Leads to:** Steps 2–3 (`contacts` collection, directory UI, user linking).

---

## Scene 5 — Invites → member accepts

**Show:** End-to-end membership flow.

**Walkthrough to demo:**

1. Admin adds **Jane Doe** as contact (email only) **🔨 M1**
2. Admin clicks **Send invite** (email with link to register) **🔨 M1** *(or demo with manual “copy invite link” until built)*
3. Jane opens link → registration on tenant subdomain **✅ Live** (self-registration → `pending`)
4. Admin opens **Staging / pending users** → Approve → assign role `contributor` or `editor` **✅ Live** (`/admin` Users, filter `status: pending`)
5. Jane logs in → sees member dashboard **🔨 M1** (Step 1)
6. Directory row now shows **Registered ✓** **🔨 M1**

**Say:**

> Invites turn contacts into participants. Until someone registers, they’re a contact you can email. Once they accept and the board approves them, they’re a registered member with login — same person, one record.

**Note for recording:** Approval today is in Payload admin; the video should call out that the **dashboard** will own this workflow in M1.

**Leads to:** Invite email action (Step 4 email infra); approval UX in dashboard; Step 3 registered badge.

---

## Scene 6 — Email members (AWS SES)

**Show:** Dashboard → **Email** → compose.

**Walkthrough to demo:**

1. **Compose announcement** — subject + body **🔨 M1** (Step 4)
2. Recipients: **All members** / **Selected rows** / **All contacts** **🔨 M1**
3. Send via **AWS SES** (or Resend in dev) **🔨 M1** — show `.env` / payload email config briefly if useful
4. Footer with **Unsubscribe** link **🔨 M1**
5. Member receives email (show inbox on phone or second browser) **🎬 Demo**
6. Optional: email only **registered users** about an upcoming vote **🔨 M1**

**Say:**

> Boards need to reach everyone on the list — not only people who log in. Email goes through SES with unsubscribe on every message. You can mail the whole neighborhood or a hand-picked group.

**Do not claim yet:** open/click analytics, newsletter templates (**📋 Later**).

**Leads to:** Step 4 (SMTP/SES, composer, unsubscribe route).

---

## Scene 7 — Create a poll → members vote

**Show:** Dashboard → **Votes** + member ballot experience.

**Walkthrough to demo:**

1. Admin **Create poll** — title, description, open/close dates **🔨 M1** (Step 9)
2. Add questions: single choice (radio), multiple choice (checkbox), optional comment **🔨 M1**
   - Tech: hybrid **poll-forms** on Payload form builder ([tech_selection.md](./voting/tech_selection.md))
3. Set eligibility: **All approved members** or **Active contributors only** **🔨 M1** (Step 8)
4. **Open poll** — status `open` **🔨 M1**
5. Email members: “Vote now” (tie to Scene 6) **🔨 M1**
6. Member logs in → **Votes** → submits ballot once **🔨 M1**
7. Admin **Results** — live counts **🔨 M1**
8. **Export CSV** — download for board minutes **🔨 M1** (Step 10)
9. **Close poll** **🔨 M1**

**Say:**

> No more counting replies in email threads. The board publishes a poll, members vote once, and you export results for the minutes. Contributor-only votes are optional — useful when only supporting members decide certain questions.

**Honest limit:** Not a secret ballot in M1; exports include voter identity.

**Leads to:** Steps 8–10, voting tech selection.

---

## Scene 8 — Fundraising (recurring support)

**Show:** Public **Support us** page + admin **Contributors** list.

**Walkthrough to demo:**

1. Public page: **Monthly** and **Annual** tiers **🔨 M1** (Step 7)
2. Tenant connects **their own PayPal** (not Blockvibe’s account) **🔨 M1**
3. Member completes PayPal subscription **🎬 Demo** (sandbox)
4. Admin **Contributors** list — status Active, tier, amount **🔨 M1**
5. Manual status override (e.g. offline check) **🔨 M1**
6. Export contributors CSV for treasurer **🔨 M1**
7. Tie to voting: “Only contributors can vote on the budget poll” **🔨 M1** (Step 8)

**Say:**

> Associations keep their own PayPal. Blockvibe tracks who’s an active supporter and can gate certain polls to contributors. Platform billing and one-time dues come in commercial MVP.

**Leads to:** Step 7–8.

---

## Scene 9 — Close & call to action

**Show:** Dashboard home mock with counts — members, open polls, active contributors **🔨 M1**.

**Say:**

> Blockvibe is the operating system for volunteer neighborhoods: site, directory, email, polls, and recurring support in one place. We’re running pilot associations now and building toward self-serve launch.

**CTA options:**

- “Request a pilot” / contact email
- Link to `info.blockvibe.org`
- Teaser: events, documents, treasurer receipts — **📋 Later**

---

## Feature → M1 implementation map

| Demo scene | Primary M1 steps |
| --- | --- |
| Onboard neighborhood | Step 1 (dashboard), existing tenant + deploy |
| Members / CRM | Steps 2–3 |
| Invites & approval | Steps 2–3 + Step 4 (invite email) |
| Email (SES) | Step 4 |
| Polls & CSV | Steps 8–10 |
| Fundraising | Steps 7–8 |
| Public site & profiles | Steps 5–6 |

---

## Default tenant — presentation site structure

Suggested pages on **`default`** tenant for the live demo (create or rename as needed):

| Page / area | Purpose |
| --- | --- |
| **Home** | Product story + links into demo flows |
| **Features** | Section anchors: Website · Members · Email · Polls · Support |
| **For neighborhoods** | ICP, pilot CTA |
| **Support us** | Fundraising demo (Step 7) |
| **Contact** | Existing form block **✅** |
| **Dashboard** | Gated demo shell **🔨 M1** |

Optional blog post: “Why we built Blockvibe” for credibility.

---

## Recording prep checklist

**Environment**

- [ ] `default` tenant content seeded and polished for camera
- [ ] Second test user (Jane) for invite/approve flow
- [ ] SES (or sandbox) sending from verified domain
- [ ] PayPal sandbox connected for one successful subscription **🎬**
- [ ] Poll seeded or creatable in one take

**Accounts**

- [ ] Superadmin (you) — onboard + approve
- [ ] Tenant admin — directory + email + poll
- [ ] Member (Jane) — register, vote, optionally contribute

**Narration**

- [ ] Use build-status tags — don’t over-promise **✅** for **🔨** items
- [ ] Name the dashboard as the product UI; `/admin` as internal until migrated

**Post-production**

- [ ] Chapter markers per scene (YouTube timestamps)
- [ ] Link to pilot CTA under video

---

## One-paragraph summary (for video description)

Blockvibe is an all-in-one platform for neighborhood associations: public website, member directory, email announcements, lightweight polls, and recurring PayPal support. This demo follows a board onboarding a new neighborhood, adding members, sending invites, approving registrations, emailing the list via AWS SES, running a poll with CSV export, and opening a support drive — all scoped to one tenant. Features marked “coming in M1” match our active engineering milestone and pilot program.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-09 | Initial presentation script; default tenant as product demo site |
