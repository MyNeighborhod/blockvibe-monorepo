# Production flows

Day-to-day workflows for **info.blockvibe.org** (platform) and **nog.blockvibe.org** (North Of Grand showcase tenant) on the single EC2 deployment.

Related docs:

- [Deployment guide](readme.md) — architecture, first-time setup, troubleshooting
- [infra/README.md](../../infra/README.md) — script quick reference
- [src/scripts/README.md](../../src/scripts/README.md) — seeding mental model & safety

---

## What runs in production

| Layer | Location | Updated by |
| ----- | -------- | ---------- |
| **App code** | Docker image `blockvibe-app:latest` on EC2 | `./infra/deploy.sh` |
| **Env secrets** | `/home/ubuntu/app/.env` (from `.env.production`) | `deploy.sh` upload |
| **Postgres data** | Docker volume on EC2 | Seeds, `push-db-to-prod.sh`, admin UI |
| **Media files** | `/var/www/blockvibe/media` on EBS | `deploy.sh`, `sync-media.sh`, admin uploads |
| **DNS** | Cloudflare (`*.blockvibe.org` wildcard + optional explicit A records) | `terraform apply` |
| **HTTPS / domains** | Caddy (`infra/Caddyfile`) — explicit host list, not a DNS wildcard | `deploy.sh` reload |

`deploy.sh` **does not** migrate the database or seed CMS content. After a code deploy, if the app expects new tables/columns, run a schema or DB flow below.

### Live domains (current)

| URL | Tenant slug | Purpose |
| --- | ----------- | ------- |
| `https://info.blockvibe.org` | `default` | Platform landing, legal pages, space request form |
| `https://nog.blockvibe.org` | `nog` | NOG neighborhood site + tenant dashboard |

Other subdomains in `infra/Caddyfile` may exist but are not part of the primary prod verification set.

---

## Flow overview

```mermaid
flowchart TB
  subgraph deploy [Ship code]
    D1[./infra/deploy.sh] --> D2[Build image locally]
    D2 --> D3[SCP + docker compose up]
    D3 --> D4[Reload Caddy]
  end

  subgraph data [Update data]
    S1[pnpm seed:prod-content] --> S2[SSH tunnel → targeted CMS seed]
    P1[./infra/push-db-to-prod.sh] --> P2[Replace entire prod DB]
    M1[./infra/sync-prod-schema.sh] --> M2[Prod dump → schema push local → push back]
  end

  subgraph verify [Verify]
    V1[pnpm test:e2e:prod]
    V2[curl https://info.blockvibe.org]
  end

  deploy --> data
  data --> verify
```

---

## 1. Deploy application code

**When:** You changed TypeScript/React/Payload config and want production to run the new build.

```bash
./infra/deploy.sh              # app + media + Caddy + .env.production
./infra/deploy.sh --skip-media # faster when only code changed
```

**What happens:**

1. `docker build --platform linux/amd64` on your machine
2. Image saved as tarball → SCP to EC2 → `docker load`
3. `public/media/` rsynced to `/var/www/blockvibe/media` (unless `--skip-media`)
4. `docker-compose.yml`, `.env.production`, `Caddyfile` uploaded
5. `docker compose down && up -d`, Caddy reloaded

**Does not:** touch Postgres content, run migrations, or invalidate Next.js cache inside a running container beyond restart.

**Typical follow-up:** If the deploy added collections/fields, run [Flow 4 — Schema sync](#4-schema-sync-after-code-change). If the site shows wrong CMS text, run [Flow 2 — Seed content in place](#2-seed-content-in-place).

---

## 2. Seed content in place

**When:** Production DB is fine structurally, but you need to fix **platform landing** (`info`) or **NOG user accounts** (`nog` e2e creds) without replacing the whole database.

```bash
pnpm seed:prod-content
```

**What happens:**

1. SSH tunnel: local port `15432` → EC2 Postgres `5432`
2. `seed-default-platform.ts` — default tenant home, form, header/footer
3. `seed-nog-users.ts` — `admin@nog.blockvibe.org` + neighbor users (passwords from `.env`)
4. Tunnel closed

**Confirm the right DB:**

```text
Using database: postgres://postgres:***@127.0.0.1:15432/blockvibe-multitenant
```

Port `15432` = production via tunnel. Port `5432` in `.env` = local only.

**After seeding**, restart the app if pages look stale:

```bash
ssh -i infra/id_rsa ubuntu@$(cd infra && terraform output -raw instance_public_ip) \
  "cd /home/ubuntu/app && sudo docker compose restart payload"
```

**Does not:** re-seed NOG pages/posts/media. For a full NOG rebuild, use [Flow 3](#3-replace-production-db-from-local) locally first.

Details: [src/scripts/README.md](../../src/scripts/README.md)

---

## 3. Replace production DB from local

**When:** Local database is **source of truth** for all content (full snapshot promote).

```bash
# Optional: refresh local content first
pnpm tsx src/scripts/seed-nog.ts

./infra/push-db-to-prod.sh           # prompts for confirmation
./infra/push-db-to-prod.sh --yes     # non-interactive
./infra/push-db-to-prod.sh --yes --skip-media   # DB only
```

**What happens:**

1. `pg_dump` of local `.env` `DATABASE_URL` → `dbsnapshots/snapshot_*.sql`
2. Upload to EC2; **stop** `payload` container
3. Backup prod DB to `/home/ubuntu/backups/pre-push-*.sql` (keeps last 7)
4. `DROP SCHEMA public CASCADE` on prod → load snapshot
5. Start `payload`; rsync `public/media/` to EBS (unless `--skip-media`)

**Warning:** Replaces **entire** production database. Use `--yes` only when intentional.

**Pre-built snapshot:**

```bash
./infra/push-db-to-prod.sh --yes --skip-media dbsnapshots/schema_ready_prod.sql
```

---

## 4. Schema sync after code change

**When:** You deployed new code that expects **new tables/columns**, prod returns 500s (missing relations), but you want to **keep prod row data**.

```bash
./infra/deploy.sh --skip-media    # ship new code first
./infra/sync-prod-schema.sh       # or --yes to skip confirm
```

**What happens:**

1. Dump prod DB over SSH → `dbsnapshots/prod_*.sql`
2. Restore into **local** Postgres (`DROP SCHEMA public CASCADE`)
3. Run `infra/push-schema.ts` (Payload schema push against current code)
4. Dump local DB → push back via `push-db-to-prod.sh`

**Requires:** local Postgres running, `.env` `DATABASE_URL` pointing at local DB.

**Note:** This briefly wipes your **local** DB while processing. Prod is replaced only at the final push step (with backup).

---

## 5. Media-only sync

**When:** Files on disk changed locally (new uploads in `public/media/`) but app image unchanged.

```bash
./infra/sync-media.sh
```

Or as part of full deploy (without rebuild):

```bash
./infra/deploy.sh --skip-media   # still rebuilds image; use sync-media.sh for media alone
```

**Pull prod → local** (e.g. after admin uploaded on production):

```bash
rsync -avz -e "ssh -i infra/id_rsa" \
  ubuntu@$(cd infra && terraform output -raw instance_public_ip):/var/www/blockvibe/media/ \
  ./public/media/
```

---

## 6. Verify production

### Smoke check

```bash
curl -sI https://info.blockvibe.org | head -1
curl -sL https://info.blockvibe.org | rg -o 'One platform|Payload Website Template' | head -1
curl -sI https://nog.blockvibe.org | head -1
```

Expect `200` and platform copy on `info`, NOG content on `nog`.

### E2E (nog + info scope)

```bash
pnpm test:e2e:prod
```

Uses `PLAYWRIGHT_BASE_URL=https://info.blockvibe.org`. Runs all specs in `tests/e2e/`.

Credentials come from `.env` (`TENANT_NOG_*`, neighbor passwords). Tests do **not** seed prod from the runner.

Full suite (includes admin, invite, other tenants):

```bash
pnpm test:e2e:prod
```

See [tests/README.md](../../tests/README.md).

---

## Common sequences

### A. Routine code release (no schema change)

```bash
git pull
./infra/deploy.sh --skip-media
pnpm test:e2e:prod
```

### B. Code release with new Payload collections/fields

```bash
./infra/deploy.sh --skip-media
./infra/sync-prod-schema.sh --yes
ssh -i infra/id_rsa ubuntu@$(cd infra && terraform output -raw instance_public_ip) \
  "cd /home/ubuntu/app && sudo docker compose restart payload"
pnpm test:e2e:prod
```

### C. Fix platform landing or NOG test users only

```bash
pnpm seed:prod-content
ssh -i infra/id_rsa ubuntu@$(cd infra && terraform output -raw instance_public_ip) \
  "cd /home/ubuntu/app && sudo docker compose restart payload"
pnpm test:e2e:prod
```

### D. Promote full local environment to prod

```bash
pnpm tsx src/scripts/seed-nog.ts    # optional: refresh local
./infra/push-db-to-prod.sh --yes
./infra/deploy.sh --skip-media      # if code also changed
pnpm test:e2e:prod
```

### E. New tenant subdomain

DNS and HTTPS are separate steps. Wildcard DNS does **not** automatically enable HTTPS.

| Layer | Wildcard? | What to do for a new tenant |
| ----- | --------- | --------------------------- |
| **DNS** (Cloudflare) | Yes — `*.blockvibe.org` works | Usually nothing; verify with `dig +short A <slug>.blockvibe.org` |
| **HTTPS** (Caddy) | No — explicit host list only | Add hostname to `infra/Caddyfile` and redeploy |

1. Create tenant in Payload (slug matches subdomain, e.g. `twin-suns` → `twin-suns.blockvibe.org`)
2. Add `twin-suns.blockvibe.org` (or your slug) to `infra/Caddyfile`
3. `./infra/deploy.sh --skip-media`
4. Seed users/content if needed (`pnpm seed:prod-content` or tenant-specific script)
5. Verify:

   ```bash
   dig +short A twin-suns.blockvibe.org     # → Elastic IP (DNS wildcard)
   curl -sI https://twin-suns.blockvibe.org/ # → HTTP/2 200 (only after Caddy step)
   ```

If DNS resolves but HTTPS fails with a TLS error, the hostname is missing from `Caddyfile` — not a Cloudflare problem.

See [readme.md § DNS and HTTPS](readme.md#7-dns-and-https-cloudflare--caddy) for full details and verification results.

---

## Prerequisites (all flows)

| Requirement | Check |
| ----------- | ----- |
| Terraform applied | `cd infra && terraform output instance_public_ip` |
| SSH key | `infra/id_rsa` or `~/.ssh/blockvibe_id_rsa` |
| Production secrets | `.env.production` (uploaded by deploy) |
| Local secrets / test creds | `.env` (`TENANT_NOG_*`, local `DATABASE_URL`) |
| Docker Desktop | Running for `deploy.sh` image build |
| Local Postgres | Running for `sync-prod-schema.sh` and local seeds |

---

## What not to do

| Action | Why |
| ------ | --- |
| Run `seed-nog.ts` with prod `DATABASE_URL` | Wipes and rebuilds entire NOG tenant on production |
| `source .env` before manual prod `DATABASE_URL` | Overwrites tunnel URL; seeds hit localhost |
| Assume `deploy.sh` migrates DB | It does not — use schema sync or push-db |
| Run `push-db-to-prod.sh` casually | Full prod DB replace; backup is created but still disruptive |

---

## SSH & logs (quick reference)

```bash
IP=$(cd infra && terraform output -raw instance_public_ip)
ssh -i infra/id_rsa ubuntu@$IP

# On server:
cd /home/ubuntu/app
sudo docker compose logs -f payload
sudo docker compose logs -f db
sudo systemctl status caddy
ls /var/www/blockvibe/media/
ls /home/ubuntu/backups/
```
