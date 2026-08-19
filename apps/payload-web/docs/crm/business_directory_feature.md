# Business Directory (tenant feature)

Tenant-enableable local business directory inspired by [The Avenues DSM businesses listing](https://www.theavenuesdsm.com/businesses/), styled for North Of Grand (Gentium/Playfair feel, `#76b3b8` accent, soft green-gray type) rather than copying Avenues chrome wholesale.

## Feature overview

```mermaid
flowchart TD
  Admin[Neighborhood admin] -->|Dashboard → Settings| Toggle[Enable Directory feature]
  Toggle -->|Seeds default categories if empty| Cats[Business Categories]
  Toggle -->|Core field matrix| Fields[directorySettings.fieldConfig]
  Admin -->|Add custom fields UI| Custom[directory-fields collection]
  Public[Visitor] -->|/businesses when enabled| Page[Public directory]
  Page -->|Filter pills / cards / detail| Biz[businesses appearOnNOG=true]
  Public -->|Add your business| Form[Registration form]
  Form -->|appearOnNOG=false| Pending[Pending listing]
  Admin -->|CRM Local Businesses tab| Approve[Appear in Directory]
  Approve --> Biz
```

## Enable for a tenant (UI)

1. Sign in as **admin** / **superadmin**.
2. Open **Dashboard → Settings**.
3. Under **Business Directory**, check **Enable Directory feature**.
4. Set page title / intro, public registration, and nav link as needed.
5. Click **Save directory settings**.
6. Visit `/businesses` on that tenant host.

First enable also seeds (when missing):

- Default **business categories**
- Dynamic mailing list **Approved Businesses** (`memberType equals business`)
- CRM custom field **Resident Category** (Landlord / Tenant / Homeowner Resident / HOA Board Member)

NOG is the first implementer: enable via Settings (or run `pnpm exec tsx src/scripts/enable-nog-directory.ts` locally).

## CRM sync, approval email, and passwords

```mermaid
flowchart TD
  Submit[Public: Add your business] -->|Creates business appearOnNOG=false| Pending[Pending listing]
  Submit -->|Upserts users contact| CRMEarly[CRM user memberType=business]
  Admin[Admin toggles Appear in Directory] -->|appearOnNOG=true| Hook[businesses afterChange]
  Hook -->|Upsert approved CRM user| CRM[CRM Directory]
  Hook -->|Once on transition to approved| Email[Approval email]
  Email --> Forgot[Login → Forgot password]
  Email --> MyBiz[Dashboard → My Business]
  CRM --> List[Mailing list: Approved Businesses]
```

### What happens when a business registers

1. A `businesses` document is created (**not** public yet).
2. A CRM `users` contact is created or updated with `memberType: business` and a random password (owner does not receive that password).

### What happens when an admin approves

1. Listing appears on `/businesses`.
2. CRM contact is marked approved / `memberType: business` again (idempotent).
3. Owner receives an email: you’re listed; use **Forgot password** on Login (or **My Business** after sign-in) to set a password.
4. They are included in the dynamic **Approved Businesses** mailing list via `memberType = business`.

### Password options for business owners

| Path | When to use |
| ---- | ----------- |
| **Login → Forgot password** | First-time password setup (recommended) |
| **Dashboard → My Business** | Change password anytime after login |
| **`/reset-password?token=…`** | Link from the forgot-password email |

## CRM groups (how admins segment contacts)

See also the short in-app help on **CRM → Mailing Lists**.

```mermaid
flowchart TB
  subgraph buckets [Built-in]
    MT[memberType: residential / business / other]
  end
  subgraph labels [Admin-defined labels]
    Tags[Contact tags: Landlord, Tenant, Homeowner…]
    Attr[Custom Attributes e.g. residentCategory]
  end
  subgraph targets [Who you email]
    Dyn[Dynamic mailing lists = rules]
    Stat[Static mailing lists = hand-picked]
  end
  MT --> Dyn
  Tags --> Dyn
  Attr --> Dyn
  Tags --> Stat
```

| Layer | Where | Example |
| ----- | ----- | ------- |
| **Member Type** | CRM Directory filter | Business vs Residential |
| **Tags** | Contact editor presets | Landlord, Tenant, Homeowner Resident |
| **Custom Attributes** | CRM → Custom Attributes | `residentCategory` select (seeded with Directory) |
| **Mailing Lists** | CRM → Mailing Lists | Dynamic: `memberType equals business` → **Approved Businesses** |

**Recommendation:** use Member Type for hard buckets, Tags/Attributes for admin groups, and Dynamic Lists for broadcasting. No separate “Groups” collection is required.

### Example: Landlords list

1. Ensure **Resident Category** exists (seeded when Directory is enabled), *or* use contact **tags**.
2. Create mailing list → type **Dynamic** → rule `customAttributes.residentCategory equals Landlord` (or tag filter when using tags).
3. Broadcaster → select that list.

## Configure core fields (UI)

In **Settings → Business Directory → Core fields**, toggle per field:

| Column | Meaning |
| ------ | ------- |
| On | Field is part of the directory schema UX |
| Required | Required on the public registration form |
| Card | Shown on directory cards |
| Detail | Shown on `/businesses/[slug]` |
| Form | Shown on “Add your business” |

Core keys: name, logo, coverImage, address, phone, email, website, hours, about, categories, facebook, instagram.

**Save directory settings** after changing the matrix.

## Add custom fields (UI)

1. Enable Directory.
2. In **Custom directory fields**, enter **Label**, **camelCase key**, and type (text / number / checkbox / select / url).
3. Click **Add field**.
4. Values are stored on each business under `customAttributes[key]` and appear on the registration form / detail view according to field flags (editable in Payload Admin → Directory Fields for advanced options).

## Categories (UI)

**Settings → Categories**: add or delete filter pills. Assign categories on each business in Payload Admin or during registration (when Categories is enabled on the form).

## Architecture

```mermaid
flowchart LR
  subgraph tenantCfg [Tenant]
    E[enableBusinessDirectory]
    S[directorySettings]
  end
  subgraph colls [Tenant-scoped collections]
    B[businesses]
    C[business-categories]
    D[directory-fields]
  end
  E --> Public[/businesses]
  E --> CRM[CRM Local Businesses tab]
  E --> Nav[Optional nav link]
  S --> Public
  C --> Public
  D --> Public
  B --> Public
```

### Data model notes

- Visibility flag remains `appearOnNOG` in the database (label: **Appear in Directory**) for backward compatibility.
- `coverImage` + `logo` support image-forward cards.
- Multi-tenant plugin scopes `businesses`, `business-categories`, and `directory-fields`.

## Public UX principles

- **Avenues patterns kept:** category pills, sort, image-led cards, contact/hours on the first viewport of detail, “add your business”.
- **NOG identity kept:** serif titles (`#42514c`), muted body (`#7b8c89`), teal accent (`#76b3b8`), soft radial wash — not Avenues black/cart chrome.
- Cards link to a dedicated detail page at `/businesses/[slug]` (contact/hours left, media right on desktop; media first on mobile).
- Each listing has a `slug` (auto from name) used in the public URL.
- Directory list loads **10** businesses at a time; scrolling loads more with a bottom spinner until all results are shown.
- Cards truncate About; full founder/origin-style copy lives on the detail page.

## How admins edit the directory

Admins manage the feature in three places. Use the lightest surface that fits the job.

### 1. Dashboard → Settings → Business Directory

**Who:** neighborhood **admin** / **superadmin**  
**URL:** `/dashboard/settings` (Business Directory card)

| Task | What to do |
| ---- | ---------- |
| Turn the feature on/off | Check **Enable Directory feature** → **Save directory settings** |
| Page title & intro | Edit fields → Save |
| Public registration | Toggle **Allow public registration** → Save |
| Nav link | Toggle **Show in nav** → Save |
| Which fields appear where | **Core fields** matrix (On / Required / Card / Detail / Form) → Save |
| Filter categories | **Categories**: add title or delete a pill |
| Extra registration fields | **Custom directory fields**: label, camelCase key, type → **Add field** |

Changes here affect every listing’s public form and card/detail layout for that tenant. They do **not** edit an individual business’s name, hours, or logo.

### 2. Dashboard → CRM → Local Businesses

**Who:** neighborhood **admin** / **superadmin** (tab only when Directory is enabled)  
**URL:** `/dashboard/crm` → **Local Businesses**

| Task | What to do |
| ---- | ---------- |
| Approve a new listing | Open the business → turn on **Appear in Directory** (sends approval email once) |
| Hide a listing | Turn **Appear in Directory** off |
| Review pending vs live | Use the CRM Local Businesses list / filters |
| Segment owners for email | Use CRM Member Type **business** and the seeded **Approved Businesses** mailing list |

This is the day-to-day approval queue after someone uses **Add your business** on the public site.

### 3. Payload Admin → Businesses (full listing edit)

**Who:** staff with Payload Admin access for the tenant  
**URL:** `/admin` → **Businesses** (collection)

| Task | What to do |
| ---- | ---------- |
| Create a listing manually | **Create new** → fill name, contact, hours, about, categories, logo/cover → set tenant → set **Appear in Directory** if it should go live |
| Edit copy, hours, address, socials | Open the document → change fields → Save |
| Change logo / cover | Upload or replace media on the document → Save |
| Fix slug / URL | Edit **slug** (must stay unique per tenant) → Save; public URL is `/businesses/[slug]` |
| Assign categories | Relationship to **Business Categories** |
| Custom attribute values | `customAttributes` JSON / fields matching directory-fields keys |

**Business Categories** and **Directory Fields** collections in Admin are for advanced edits (sort order, field flags) beyond the Settings UI.

### 4. Business owners (after approval)

**Who:** contact with `memberType: business`  
**URL:** Login (Forgot password first if needed) → **Dashboard → My Business**

Owners can update their own listing profile and password. They cannot enable Directory for the tenant or approve other businesses.

### Quick decision guide

| Goal | Go to |
| ---- | ----- |
| Enable Directory / change page copy / field matrix | **Settings → Business Directory** |
| Approve or unpublish a listing | **CRM → Local Businesses** |
| Rewrite About, swap logo, fix hours/slug | **Payload Admin → Businesses** (or owner **My Business**) |
| Add a filter pill category | **Settings → Categories** (or Admin → Business Categories) |

## Gating

| Surface | When directory disabled |
| ------- | ----------------------- |
| `/businesses` | `404` |
| Header “Businesses” | Hidden (unless already in CMS nav) |
| CRM “Local Businesses” | Tab hidden |
| Registration API | Rejects submissions |

## Related docs

- [CRM groups & segmentation](./crm_groups_and_segmentation.md)
- [Businesses directory & CRM (legacy overview)](./businesses_directory_and_crm.md)

## Related code

- Collections: `Businesses.ts`, `BusinessCategories.ts`, `DirectoryFields.ts`, `Tenants/index.ts`
- CRM bootstrap (mailing list, Resident Category, approval email): `src/directory/crmBootstrap.ts`
- Public list + detail: `app/(frontend)/[tenant]/(public)/businesses/` (incl. `[slug]/page.tsx`)
- Infinite scroll page size: `DIRECTORY_PAGE_SIZE` in `src/directory/constants.ts`
- Settings UI: `dashboard/settings/DirectorySettings.tsx`
- Demo seed (staging visuals): `src/scripts/seed-nog-directory-demo.ts` (+ Unsplash download script)
- Constants: `src/directory/constants.ts`
