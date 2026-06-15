# Database seeding scripts

Scripts in this folder write CMS content and users into Postgres via Payload's local API.

**There is no interactive “prod or localhost?” prompt.** The target database is always whatever `DATABASE_URL` points at when the script starts. You choose the target by **which command you run** and **which env vars are set**.

See also: [docs/deployment/readme.md](../../docs/deployment/readme.md) (production deploy) and [development.md](../../development.md) (local dev).

---

## Mental model

```
You run a seed command
        │
        ├─► pnpm seed:prod-content
        │         └─► SSH tunnel → prod Postgres (127.0.0.1:15432)
        │             DATABASE_URL set by infra/seed-prod-content.sh
        │
        └─► pnpm seed:default-platform / seed:nog-users / tsx seed-nog.ts
                  └─► DATABASE_URL from .env → local Docker Postgres
```

Payload needs two env vars to connect:

| Variable | Role |
| -------- | ---- |
| `DATABASE_URL` | **Which database** to read/write |
| `PAYLOAD_SECRET` | Must match that environment (`.env` locally, `.env.production` on prod) |

Optional URL helpers (for platform landing CTAs):

| Variable | Role |
| -------- | ---- |
| `NEXT_PUBLIC_SERVER_URL` | Platform base URL (`http://localhost:3000` or `https://info.blockvibe.org`) |
| `NOG_SHOWCASE_URL` | Override showcase link (default: derived from server URL → `nog.localhost:3000` or `https://nog.blockvibe.org`) |

User passwords for seeded accounts come from `.env` (`TENANT_NOG_*`, etc.).

---

## Commands

### Localhost (default)

Uses `DATABASE_URL` from `.env` (typically `postgres://postgres:local@127.0.0.1:5432/04-payload-multitenant`).

| Command | Scope | Destructive? |
| ------- | ----- | ------------ |
| `pnpm tsx src/scripts/seed-nog.ts` | **Full** NOG tenant: pages, posts, media, users, **and** default platform home | **Yes** — wipes and rebuilds `nog` tenant |
| `pnpm seed:default-platform` | Default tenant only (`info` landing page, space request form, header/footer) | **Yes** — replaces default tenant pages/globals |
| `pnpm seed:nog-users` | NOG admin + neighbor users only | **Partial** — deletes/recreates those three users |
| `pnpm tsx src/scripts/seed-beaverdale.ts` | Full Beaverdale tenant | **Yes** — wipes and rebuilds `beaverdale` |

Run from the project root while local Postgres is up (`docker compose up -d` in the repo root).

### Production

```bash
pnpm seed:prod-content
```

Runs `infra/seed-prod-content.sh`, which:

1. Reads prod credentials from `.env.production` (`DB_PASSWORD`, `PAYLOAD_SECRET`)
2. Opens an SSH tunnel: local `15432` → EC2 Postgres `5432`
3. Sets `DATABASE_URL` to the tunnel (**after** loading `.env`, so local `DATABASE_URL` does not win)
4. Sets `NEXT_PUBLIC_SERVER_URL=https://info.blockvibe.org` and `NOG_SHOWCASE_URL=https://nog.blockvibe.org`
5. Runs `seed-default-platform` + `seed-nog-users`
6. Closes the tunnel

Confirm you see:

```text
Using database: postgres://postgres:***@127.0.0.1:15432/blockvibe-multitenant
```

That port (`15432`) means **production via tunnel**, not your local Docker DB.

**Requires:** Terraform applied, SSH key (`infra/id_rsa` or `~/.ssh/blockvibe_id_rsa`), `.env.production`, and `.env` with `TENANT_NOG_*` credentials.

---

## Safety notes

### Do not run the wrong script against the wrong database

| Mistake | Risk |
| ------- | ---- |
| Run `seed-nog.ts` while `DATABASE_URL` points at prod | Wipes and rebuilds the entire NOG tenant on production |
| Run `pnpm seed:default-platform` with prod `DATABASE_URL` exported manually | Replaces platform homepage and form on prod (may be intended, but know what you're doing) |
| `source .env` before a manual prod `DATABASE_URL` | Local `.env` overwrites the tunnel URL — writes go to localhost (see below) |

`infra/seed-prod-content.sh` sets `DATABASE_URL` **after** sourcing `.env` specifically to avoid that bug.

### Script severity

- **`seed-nog.ts`** — Heavy. Deletes nog tenant data, refetches live media, recreates everything. Use for **local dev resets**, not routine prod updates.
- **`seed:prod-content`** — Narrow. Only default platform tenant content + NOG user accounts. Safe for fixing `info.blockvibe.org` landing and nog e2e users.
- **`push-db-to-prod.sh`** — Nuclear. Replaces the **entire** production database with your local dump. Different tool; use when local is source of truth for everything.

### After seeding production

- Restart the app container if the site still shows stale content (Next.js cache):
  ```bash
  ssh -i infra/id_rsa ubuntu@$(cd infra && terraform output -raw instance_public_ip) \
    "cd /home/ubuntu/app && sudo docker compose restart payload"
  ```
- `deploy.sh` does **not** run seeds or migrations. Schema changes may need `infra/sync-prod-schema.sh`; content changes use the seed scripts above or `push-db-to-prod.sh`.

### Credentials

Seed scripts read `TENANT_NOG_USERNAME`, `TENANT_NOG_PASSWORD`, neighbor passwords, etc. from `.env`. Keep prod and local passwords aligned with what e2e tests expect (`tests/README.md`).

---

## What each script does

### `seed-nog.ts` (full local reset)

1. Deletes and recreates the **nog** tenant (pages, posts, media, headers, footers, invites)
2. Ensures **default** platform tenant exists; seeds platform homepage + space request form
3. Creates NOG admin, neighbor users, uploads media from northofgranddsm.org
4. Seeds NOG pages, posts, header, footer

### `seed-default-platform.ts` (platform / `info` only)

1. Ensures tenant slug `default` exists
2. Deletes existing default tenant pages, header, footer
3. Recreates Space Request Form, platform homepage, header, footer
4. Showcase CTA URL from `getNogShowcaseUrl()` in `seed-helpers.ts`

### `seed-nog-users.ts` (users only)

1. Finds existing `nog` tenant (fails if missing — run `seed-nog.ts` first locally)
2. Deletes and recreates NOG admin + John/Johanna neighbor users with `.env` passwords

### `seed-beaverdale.ts`

Same pattern as `seed-nog.ts` but for the `beaverdale` tenant.

### `migrate-nog-to-default.ts`

One-time migration if production still has platform content on slug `nog` instead of `default`:

```bash
pnpm tsx src/scripts/migrate-nog-to-default.ts
```

Then redeploy media if needed (`./infra/sync-media.sh` or `./infra/deploy.sh`).

---

## Production flows

For deploy, seed, schema sync, DB push, media, and verification against **info** / **nog**:

→ **[docs/deployment/production-flows.md](../../docs/deployment/production-flows.md)**

---

## Related infra scripts

| Script | Purpose |
| ------ | ------- |
| `infra/seed-prod-content.sh` | Prod wrapper for `seed-default-platform` + `seed-nog-users` |
| `infra/push-db-to-prod.sh` | Full local DB → prod replace |
| `infra/sync-prod-schema.sh` | Pull prod DB, schema-push locally, push back (migrations without full content replace) |

---

## Quick decision guide

| Goal | Command |
| ---- | ------- |
| Fresh local dev with full NOG site | `pnpm tsx src/scripts/seed-nog.ts` |
| Fix local `info` landing only | `pnpm seed:default-platform` |
| Fix prod `info` landing + nog users | `pnpm seed:prod-content` |
| Copy entire local DB to prod | `./infra/push-db-to-prod.sh` |
| Reset local neighbor login passwords | `pnpm seed:nog-users` |
