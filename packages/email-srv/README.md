# @blockvibe/email-srv

Postgres library for the `email_srv` schema (Gmail OAuth refresh tokens). Used by `payload-web`; not used by the Lambda email worker.

## Migrations

Schema changes live in `drizzle/`. Apply them **before** deploying Gmail OAuth features.

| Environment | How |
| ----------- | --- |
| Local | `pnpm --filter @blockvibe/email-srv db:migrate` (reads `apps/payload-web/.env`) |
| Staging / production | SSH tunnel + `DATABASE_URL` override (see below) |

Generate a new migration after editing `src/schema/schema.ts`:

```bash
pnpm --filter @blockvibe/email-srv db:generate
```

---

## Local

**Prerequisites:** Postgres running (`docker compose up -d postgres`), `DATABASE_URL` in `apps/payload-web/.env`.

```bash
pnpm --filter @blockvibe/email-srv db:migrate
```

Expected output: `email_srv migrations applied.`

Creates:

- schema `email_srv`
- table `email_srv.email_account`

---

## Staging

Staging Postgres is not reachable from your laptop directly. `.env.staging` uses the Docker hostname `db-staging:5432`, which only works **on the EC2 host**. From local, use an SSH tunnel (same pattern as `infra/seed-staging-full.sh`).

### 1. SSH key

Use one of:

- `apps/payload-web/infra/id_rsa` (repo fallback; what infra scripts use)
- `~/.ssh/blockvibes_id_rsa` (note the **s** — not `blockvibe_id_rsa`)
- SSH config host `blockvibe` (see `~/.ssh/config`)

### 2. Open tunnel

From `apps/payload-web/infra`:

```bash
cd apps/payload-web/infra
IP=$(terraform output -raw instance_public_ip)

# Option A — repo key
ssh -i ./id_rsa -o StrictHostKeyChecking=no -f -N -L 15433:127.0.0.1:5433 ubuntu@$IP

# Option B — SSH config alias
ssh -f -N -L 15433:127.0.0.1:5433 blockvibe
```

Local port `15433` → staging Postgres on the server (port `5433`).

### 3. Run migration

From the monorepo root:

```bash
DB_PASSWORD=$(grep '^DB_PASSWORD=' apps/payload-web/.env.staging | cut -d= -f2-)

DATABASE_URL="postgres://postgres:${DB_PASSWORD}@127.0.0.1:15433/blockvibe-staging" \
  pnpm --filter @blockvibe/email-srv db:migrate
```

### 4. Verify (optional)

```bash
PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -p 15433 -U postgres -d blockvibe-staging \
  -c '\d email_srv.email_account'
```

### 5. Close tunnel

```bash
pkill -f "15433:127.0.0.1:5433"
```

---

## Production

Same flow as staging, with production ports and database (see `infra/sync-schema.sh`):

| | Staging | Production |
| - | ------- | ---------- |
| Env file | `.env.staging` | `.env.production` |
| Local tunnel port | `15433` | `15432` |
| Remote Postgres port | `5433` | `5432` |
| Database name | `blockvibe-staging` | `blockvibe-multitenant` |

```bash
cd apps/payload-web/infra
IP=$(terraform output -raw instance_public_ip)
ssh -i ./id_rsa -f -N -L 15432:127.0.0.1:5432 ubuntu@$IP

DB_PASSWORD=$(grep '^DB_PASSWORD=' apps/payload-web/.env.production | cut -d= -f2-)

DATABASE_URL="postgres://postgres:${DB_PASSWORD}@127.0.0.1:15432/blockvibe-multitenant" \
  pnpm --filter @blockvibe/email-srv db:migrate
```

---

## Troubleshooting

| Error | Fix |
| ----- | --- |
| `DATABASE_URL is required` | Pass `DATABASE_URL=...` on the command line for staging/prod; local migrate reads `apps/payload-web/.env` |
| `Permission denied (publickey)` | Wrong SSH key — use `infra/id_rsa` or `~/.ssh/blockvibes_id_rsa` |
| `ECONNREFUSED 127.0.0.1:5432` | Start local Postgres: `docker compose up -d postgres` |
| `ECONNREFUSED 127.0.0.1:15433` | SSH tunnel not running — repeat step 2 |
| Migration fails: relation already exists | Table was created manually; on dev/staging you can drop `email_srv` and re-run, or mark the migration applied in Drizzle's `__drizzle_migrations` table |

**Note:** Payload CMS schema sync (`infra/sync-schema.sh`) does **not** create `email_srv`. Run this migration separately whenever `packages/email-srv/drizzle/` changes.
