# Voting: Technology Selection

How to implement M1 voting (admin-created questionnaires, member ballots, CSV export) in the Blockvibe multi-tenant stack.

**Related:** [M1 community platform](../m1_community_platform.md) (§4 Voting, steps 9–10), [how_roles_work.md](../../how_roles_work.md)

**Decision:** **Hybrid approach** — extend `@payloadcms/plugin-form-builder` for questionnaire definition and ballot storage; add custom fields, hooks, and dashboard UI for voting rules.

---

## Context

The repo already ships:

- `@payloadcms/plugin-form-builder` with `forms` and `form-submissions` collections
- A frontend `FormBlock` (`src/blocks/Form/`) that POSTs to `/api/form-submissions`
- Contact forms as the reference pattern (`src/endpoints/seed/contact-form.ts`)

M1 voting needs more than generic forms:

- Authenticated members only (approved users; optionally active contributors)
- Exactly one ballot per member per poll
- Open / close schedule and poll lifecycle
- Per-tenant scoping
- Aggregated results and CSV export
- Admin cannot edit individual votes

---

## Options considered

### Option A — Form builder only (no extensions)

Use `forms` and `form-submissions` as-is. Admins build polls in the form builder; members submit via the existing `FormBlock`.

| Pros | Cons |
| --- | --- |
| Zero new collections | Public `create` on submissions — anyone can vote |
| Fastest to prototype | No voter identity on submissions |
| Reuses contact-form UX | Repeat submissions allowed |
| | No schedule, eligibility, or poll status |
| | `forms` not tenant-scoped today |
| | No CSV export or result aggregation |

**Verdict:** Not sufficient for M1 governance requirements.

---

### Option B — Hybrid: poll-forms on top of form builder ✅ Selected

Treat certain forms as **polls** by extending the plugin collections and submitting through authenticated dashboard flows.

| Pros | Cons |
| --- | --- |
| Reuses admin UI for building questions (select, checkbox, textarea) | Plugin not designed for voting — hooks required |
| Reuses `submissionData` shape for answers | Must add `radio` to frontend field map (plugin supports it; project does not render it yet) |
| One less collection to maintain vs greenfield | CSV export and results UI are custom |
| Aligns with existing contact-form infrastructure | Contact `FormBlock` must not be used for polls as-is |
| `formOverrides` / `formSubmissionOverrides` are built for this | |

**Verdict:** Best fit for M1 scope and team familiarity with Payload forms.

---

### Option C — Dedicated `polls` + `ballots` collections

Greenfield data model: `polls` (metadata + questions) and `ballots` (one row per vote).

| Pros | Cons |
| --- | --- |
| Schema matches domain exactly | Duplicates form-builder field types and admin UX |
| Easier to add advanced rules later (ranked choice, secret ballot) | More frontend work for ballot rendering |
| Clear separation from contact forms | Two parallel “form-like” systems to maintain |

**Verdict:** Reserve for a later milestone if M1 outgrows poll-forms (anonymous ballots, weighted votes, conditional questions).

---

## Decision summary

| Area | Choice |
| --- | --- |
| Questionnaire definition | `forms` collection via form builder plugin |
| Ballot storage | `form-submissions` collection |
| Voting rules | Custom fields + `beforeChange` hooks on both collections |
| Member submit UI | Dashboard route (`/[tenant]/dashboard/votes/[formId]`), not public `FormBlock` |
| Results & export | Custom dashboard + CSV endpoint over `form-submissions` |
| Tenant isolation | Add `forms` (and submissions) to `multiTenantPlugin` |

---

## What the plugin provides vs what we add

### Already available

| M1 need | Plugin / repo support |
| --- | --- |
| Admin builds questions | `forms` collection — field blocks in admin |
| Single choice | `select` (wired in `FormBlock`); `radio` in plugin, needs frontend component |
| Multiple choice | Multiple `checkbox` fields per form |
| Free-text comment | `textarea` |
| Store answers | `form-submissions.submissionData: [{ field, value }]` |
| Embed on a page | `formBlock` on pages (contact forms only — not for polls) |

### Gaps we close in the hybrid layer

| M1 need | Hybrid extension |
| --- | --- |
| Authentication | `submittedBy` → `users` on submissions; `access.create` requires logged-in approved user |
| One vote per member | `beforeChange` hook: reject duplicate `(form, submittedBy)` |
| Eligibility | Form field `eligibility`: approved members \| active contributors; hook calls `canVote()` |
| Schedule & lifecycle | On `forms`: `formType`, `status` (`draft` \| `open` \| `closed`), `opensAt`, `closesAt` |
| Tenant scope | `tenant` relationship + `multiTenantPlugin` entry for `forms` |
| Results & CSV | Dashboard aggregates `submissionData`; export flattens rows with `userId`, `submittedAt` |
| Governance | `access.update: false` on submissions (already default); admin closes poll via form `status` |

---

## Hybrid implementation outline

### 1. Extend `forms` (`formOverrides` in `formBuilderPlugin`)

```ts
// Conceptual fields added to forms collection
formType: 'contact' | 'poll'       // default 'contact'
status: 'draft' | 'open' | 'closed' // polls only
opensAt: date
closesAt: date
eligibility: 'approved-members' | 'active-contributors'
tenant: relationship → tenants      // or via multiTenantPlugin
```

Admins create polls the same way they create contact forms — add `select` / `checkbox` / `textarea` fields for each question.

### 2. Extend `form-submissions` (`formSubmissionOverrides`)

```ts
submittedBy: relationship → users  // required for poll submissions
tenant: relationship → tenants

beforeChange hooks:
  - require req.user
  - load parent form; assert formType === 'poll' && status === 'open'
  - assert now between opensAt and closesAt (if set)
  - assert canVote(user, tenant, form.eligibility)
  - assert no existing submission for (form, submittedBy)
```

### 3. Vote UI (dashboard, not public FormBlock)

- List open polls: `GET` forms where `formType === 'poll'` and `status === 'open'`
- Ballot page: reuse field components from `src/blocks/Form/fields.tsx`
  - Add `radio` component (enable in plugin `fields: { radio: true }`)
- Submit via server action or authenticated Local API — **not** anonymous `POST /api/form-submissions`

### 4. Results & CSV

- **Admin view:** group `submissionData` by `field` name; count distinct `value`s per question
- **CSV export:** query all submissions for `form = pollId`; columns e.g. `pollId`, `submissionId`, `userId`, `email`, `field`, `value`, `submittedAt`
- Document whether export includes voter identity (M1: yes — not a secret ballot)

### 5. Multi-tenant

Add to `multiTenantPlugin.collections`:

```ts
forms: {},
'form-submissions': {},
```

Ensure tenant admins only see polls and ballots for their tenant.

---

## Out of scope for this selection (later options)

Defer to Option C or a future milestone if needed:

- Secret / anonymous ballots
- Ranked-choice or approval voting
- Changing a vote after submit
- Conditional or branching questions
- Weighted votes by contributor tier

---

## Mapping to M1 implementation steps

| M1 step | Work |
| --- | --- |
| Step 8 — contributor eligibility | Shared `canVote(user, tenant)`; form `eligibility` field + submission hook |
| Step 9 — create & vote | `formOverrides` + `formSubmissionOverrides`; dashboard vote pages |
| Step 10 — CSV export | Export endpoint / admin action over `form-submissions` |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-09 | Initial tech selection; hybrid (poll-forms) chosen over form-only or greenfield polls |
