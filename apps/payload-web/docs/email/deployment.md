# Email system — deployment & operations

How to deploy and operate BlockVibe email: **payload-web** on EC2 (Docker), the **email worker** on AWS Lambda (CDK), Postgres (`email_srv` + CMS), and Google OAuth.

**Architecture reference:** [architecture.md](./architecture.md)

---

## 1. What runs where

| Component | Runtime | Deploy method |
| --------- | ------- | ------------- |
| **payload-web** (Next.js + Payload) | EC2 Docker container | `./infra/deploy.sh` |
| **email worker** (`services/email-service`) | AWS Lambda | `pnpm email-service:deploy` (CDK) |
| **Postgres CMS** (`public` schema) | EC2 Docker (`db` / `db-staging`) | Schema auto-sync on app start; or `push-db-to-prod.sh` |
| **`email_srv` schema** (Gmail tokens) | Same Postgres | `pnpm --filter @blockvibe/email-srv db:migrate` (separate from Payload) |

**payload-web is not Lambda.** Only the background email worker is Lambda. Gmail OAuth connect/callback and the Broadcaster UI always run in the Next.js app on EC2 (or locally in dev).

---

## 2. Monorepo layout

```
packages/
  email-contracts/     # Shared types, enqueue tokens, Gmail API helpers, HTML builder
  email-srv/             # Drizzle + email_srv.email_account (OAuth refresh tokens)

services/
  email-service/         # Lambda invoke-handler + local Express (port 4001)
    infra/               # AWS CDK app
    scripts/bundle-lambda.mjs

apps/payload-web/        # OAuth routes, Broadcaster, delivery log UI, Lambda client
  docs/email/            # This documentation
  infra/                 # EC2 deploy (Terraform + deploy.sh)
```

---

## 3. Environment variables

### payload-web (`.env` / `.env.staging` / `.env.production`)

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `GOOGLE_CLIENT_ID` | Gmail | OAuth client |
| `GOOGLE_CLIENT_SECRET` | Gmail | OAuth client |
| `NEXT_PUBLIC_SERVER_URL` | Always | OAuth callback base (no trailing slash) |
| `PAYLOAD_SECRET` | Always | JWT, unsubscribe HMAC |
| `EMAIL_SERVICE_SIGNING_SECRET` | Worker path | HMAC enqueue + completion tokens. If unset at Lambda deploy, `PAYLOAD_SECRET` is used as fallback |
| `EMAIL_LAMBDA_FUNCTION_NAME` | Staging/prod worker | e.g. `blockvibe-email-staging-send` |
| `AWS_REGION` | Worker path | Lambda client region (`us-east-1`) |
| `EMAIL_SERVICE_URL` | Local only | e.g. `http://localhost:4001` — use instead of Lambda locally |
| `SMTP_*` | SES inline fallback | Only when worker env vars are **not** set |

### Lambda worker (set by CDK from deploy env file)

| Variable | Source at deploy |
| -------- | ---------------- |
| `EMAIL_SERVICE_SIGNING_SECRET` | `.env.staging` / `.env.production` (or `PAYLOAD_SECRET` fallback) |
| `PAYLOAD_SECRET` | Same env file |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Same env file (Gmail path) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, … | Same env file (SES path) |

---

## 4. Deploy email worker (Lambda via CDK)

### One-time: CDK bootstrap

```bash
cd services/email-service/infra
pnpm install
pnpm exec cdk bootstrap
```

### Deploy by stage

From monorepo root:

```bash
# Staging (reads apps/payload-web/.env.staging)
pnpm email-service:deploy --staging

# Production (reads apps/payload-web/.env.production)
pnpm email-service:deploy --prod
```

The script:

1. Builds `@blockvibe/email-contracts` + bundles Lambda with esbuild
2. Runs `cdk deploy` for stack `BlockvibeEmail-{stage}`
3. Creates function `blockvibe-email-{stage}-send` (256 MB, 300s timeout, 3-day logs)

**CDK details:** [services/email-service/infra/README.md](../../../../services/email-service/infra/README.md)

### After Lambda deploy

Add to the **payload-web** env file on EC2 (uploaded by `deploy.sh`):

```bash
EMAIL_LAMBDA_FUNCTION_NAME=blockvibe-email-staging-send
EMAIL_SERVICE_SIGNING_SECRET=<same value used for Lambda deploy>
AWS_REGION=us-east-1
```

Terraform already grants EC2 `lambda:InvokeFunction` on `arn:aws:lambda:us-east-1:*:function:blockvibe-email-*`.

---

## 5. Deploy payload-web (EC2)

From `apps/payload-web`:

```bash
open -a Docker   # build runs locally

# Staging
./infra/deploy.sh --staging --skip-media

# Production
./infra/deploy.sh --skip-media
```

This uploads `.env.staging` or `.env.production`, rebuilds the Docker image, and restarts containers. It does **not** deploy Lambda — run §4 separately when worker code changes.

**Full infra cheat sheet:** [infra/README.md](../../infra/README.md)

---

## 6. Database migrations

### `email_srv` (Gmail OAuth tokens)

Required before Gmail connect works in an environment:

```bash
# Local
pnpm --filter @blockvibe/email-srv db:migrate

# Staging (SSH tunnel — see packages/email-srv/README.md)
DATABASE_URL="postgres://postgres:${DB_PASSWORD}@127.0.0.1:15433/blockvibe-staging" \
  pnpm --filter @blockvibe/email-srv db:migrate
```

### CMS schema (broadcasts delivery fields, etc.)

Payload syncs collection schema on app startup. After adding fields to `src/collections/Broadcasts.ts`, redeploy payload-web; no separate migration CLI for CMS tables.

To copy a full local DB to staging:

```bash
./infra/push-db-to-prod.sh --staging --yes
```

---

## 7. Google Cloud (per environment)

Add redirect URIs and origins for each host you deploy:

| Environment | Callback URI |
| ----------- | ------------ |
| Local | `http://localhost:3000/api/integrations/gmail/callback` |
| Staging | `https://staging.blockvibe.org/api/integrations/gmail/callback` |
| Production | `https://info.blockvibe.org/api/integrations/gmail/callback` |

While the OAuth app is in **Testing** mode, only **Test users** in Google Audience can connect.

See [architecture.md §4](./architecture.md#4-google-cloud-setup-one-time-platform) for the full checklist.

---

## 8. Staging deploy checklist (email)

Use this after merging email-related changes:

```bash
# 1. email_srv migration (if drizzle/ changed)
#    … tunnel + db:migrate (see packages/email-srv/README.md)

# 2. Lambda worker
pnpm email-service:deploy --staging

# 3. Verify .env.staging has:
#    GOOGLE_CLIENT_*, EMAIL_LAMBDA_FUNCTION_NAME, EMAIL_SERVICE_SIGNING_SECRET, AWS_REGION, SMTP_*

# 4. payload-web
cd apps/payload-web && ./infra/deploy.sh --staging --skip-media

# 5. Smoke test
#    - Login at https://nog.staging.blockvibe.org
#    - Settings → Connect Gmail (reconnect if scopes changed)
#    - Broadcaster → send test → check Delivery log on same page
#    - CloudWatch: log group for blockvibe-email-staging-send
```

---

## 9. Local development

### Minimal (inline send, no worker)

```bash
docker compose up -d postgres
pnpm --filter @blockvibe/email-srv db:migrate
pnpm --filter payload-web dev
```

With `EMAIL_LAMBDA_FUNCTION_NAME` **unset**, broadcasts send **inline** in the Next.js server action (browser waits; fine for small lists).

### With local worker (matches staging/prod)

```bash
pnpm email-service:build
EMAIL_SERVICE_SIGNING_SECRET=dev-secret pnpm email-service:dev   # :4001

# In apps/payload-web/.env:
EMAIL_SERVICE_URL=http://localhost:4001
EMAIL_SERVICE_SIGNING_SECRET=dev-secret
```

---

## 10. Delivery log (operations)

Each send creates a row in the **`broadcasts`** collection (tenant-scoped). Admins see the last 20 on **Dashboard → Email → Delivery log**.

| Status | Meaning |
| ------ | ------- |
| `queued` | Worker invoke accepted; send not finished |
| `processing` | Inline send in progress |
| `completed` | All recipients succeeded |
| `partial` | Some succeeded, some failed |
| `failed` | None succeeded |

Failed addresses are stored in `failedEmails` (JSON array). The worker reports results via `POST /api/email/broadcasts/complete` with a signed **completion token**.

Details: [architecture.md §7.3](./architecture.md#73-broadcasts-delivery-log)

---

## 11. Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Broadcaster returns success but no email | CloudWatch logs for `blockvibe-email-{stage}-send`; Lambda env `SMTP_*` / `GOOGLE_*` |
| Delivery log stuck on **Queued** | Worker failed before callback; completion token / `EMAIL_SERVICE_SIGNING_SECRET` mismatch between Lambda and payload-web |
| Gmail connect 404 / redirect error | `NEXT_PUBLIC_SERVER_URL` matches Google redirect URI; tenant URL uses `getTenantURL()` |
| `User not authorized` on send | Admin role + tenant membership |
| Docker build hangs on `node:22.17.0-alpine` | `deploy.sh` uses `--pull=false`; tag local `node:22-alpine` as `node:22.17.0-alpine` if needed |

---

## Related docs

- [architecture.md](./architecture.md) — system design, flows, data model
- [docs/email-service/readme.md](../email-service/readme.md) — worker security & cost
- [packages/email-srv/README.md](../../../packages/email-srv/README.md) — OAuth token DB migrations
- [production-flows.md](../deployment/production-flows.md) — general prod DB/deploy flows
