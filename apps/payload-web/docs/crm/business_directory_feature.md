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
| Detail | Shown in the detail panel |
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
- `coverImage` + `logo` support Avenues-style image-forward cards.
- Multi-tenant plugin scopes `businesses`, `business-categories`, and `directory-fields`.

## Public UX principles

- **Avenues patterns kept:** category pills, sort, image-led cards, detail contact/hours blocks, “add your business”.
- **NOG identity kept:** serif titles (`#42514c`), muted body (`#7b8c89`), teal accent (`#76b3b8`), soft radial wash — not Avenues black/cart chrome.
- Cards open an in-page detail panel (no full page reload); images use `loading="lazy"`.
+ Cards link to a dedicated detail page at `/businesses/[slug]` (Avenues-style layout, NOG styling); images use `loading="lazy"`.
+ Each listing has a `slug` (auto from name) used in the public URL.

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
- Public: `app/(frontend)/[tenant]/(public)/businesses/`
- Settings UI: `dashboard/settings/DirectorySettings.tsx`
- Constants: `src/directory/constants.ts`
