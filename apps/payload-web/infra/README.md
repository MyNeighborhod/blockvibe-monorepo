# Infrastructure & Deployment

## Routine production deploy (cheat sheet)

Run from **`apps/payload-web`** (all paths below are relative to that directory).

```bash
# 1. Docker must be running (build happens on your Mac, not EC2)
open -a Docker

# 2. Ship code — use --skip-media when only app code changed (most deploys)
./infra/deploy.sh --skip-media

# 3. Smoke-test the feature you changed (examples)
curl -sI https://nog.blockvibe.org/ | head -1
pnpm test:e2e:prod   # optional full suite
```

**Notes:**

- Deploy ships **your local working tree** (Docker build from disk). Commit/push to GitHub is separate — the server does not `git pull`.
- `deploy.sh` uploads `.env.production` → server `.env` on every run. Edit secrets locally before deploying if they changed.
- `deploy.sh` does **not** seed Postgres or run migrations. After schema changes, see [production-flows.md](../docs/deployment/production-flows.md).
- New tenant subdomain? Add the hostname to `infra/Caddyfile`, then deploy.

**Staging:** same flow with `./infra/deploy.sh --staging --skip-media` (uses `.env.staging`, `nog.staging.blockvibe.org`, etc.).

---

## One-command deploy (day-to-day)

From `apps/payload-web`, after initial setup is complete:

```bash
./infra/deploy.sh
```

This builds the Docker image **on your machine** (not on EC2), syncs media, uploads config, and restarts the server.

| Flag / script                         | When to use                                                         |
| ------------------------------------- | ------------------------------------------------------------------- |
| `./infra/deploy.sh`                   | Full deploy: app + media + Caddy + env                              |
| `./infra/deploy.sh --skip-media`      | Code-only deploy (faster; typical for bug fixes and features)       |
| `./infra/deploy.sh --staging`         | Full deploy to **staging** (`.env.staging`, port 3001)              |
| `./infra/deploy.sh --staging --skip-media` | Code-only staging deploy                                       |
| `./infra/sync-media.sh`               | Media-only sync, no rebuild                                         |
| `./infra/push-db-to-prod.sh`          | **Replace production DB** with local (source of truth) + sync media |
| `pnpm seed:prod-content`              | Seed prod **content only** (platform home + NOG users) via SSH tunnel |
| `./infra/sync-prod-schema.sh`         | Pull prod DB → schema push locally → push back (no full content replace) |

### What `deploy.sh` does

1. Reads EC2 IP from `terraform output`
2. `docker build --platform linux/amd64` locally (~2–3 min)
3. Saves image as `app.tar.gz` and SCPs it to EC2
4. Uploads `docker-compose.yml`, `.env.production` (or `.env.staging`), and `Caddyfile`
5. Rsyncs `public/media/` to EBS (unless `--skip-media`)
6. On EC2: `docker load`, `docker compose down && up -d`, reload Caddy

**Requires:** Docker Desktop running, SSH key at `~/.ssh/blockvibe_id_rsa` or `infra/id_rsa`, and `terraform apply` completed once in `infra/`.

### Local DB → production (source of truth)

When local content is canonical and you want production to match:

```bash
./infra/push-db-to-prod.sh
```

This dumps local Postgres, uploads to EC2, replaces the production database, restarts the app container, and rsyncs `public/media/`.

Use `--yes` to skip the confirmation prompt, `--skip-media` for database only.

## First-time setup (once per environment)

Run from `apps/payload-web`:

1. **Provision AWS** (Terraform):

   ```bash
   cd infra/
   cp terraform.tfvars.example terraform.tfvars   # edit with your values
   terraform init
   terraform apply
   cd ..
   ```

2. **Create production env**:

   ```bash
   cp .env.production.example .env.production   # fill in secrets
   ```

3. **Start Docker and deploy**:

   ```bash
   open -a Docker
   ./infra/deploy.sh
   ```

4. Open `https://<your-domain>` (from `terraform output domain_url`).

Full details: [docs/deployment/readme.md](../docs/deployment/readme.md) · **Day-to-day flows:** [production-flows.md](../docs/deployment/production-flows.md)

## Files in this directory

| File            | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `deploy.sh`           | Main deploy script                                        |
| `seed-prod-content.sh`| SSH tunnel + platform/NOG user seeds (also `pnpm seed:prod-content`) |
| `sync-prod-schema.sh` | Prod schema sync without full DB replace                  |
| `sync-media.sh`       | Sync `public/media/` to the server only                   |
| `Caddyfile`     | HTTPS + static `/media` serving (uploaded on each deploy) |
| `userdata.sh`   | EC2 first-boot provisioning (Docker, Caddy, swap)         |
| `main.tf`       | EC2, Elastic IP, security group, Cloudflare DNS (`*.blockvibe.org` wildcard + optional explicit A records) |

### DNS vs HTTPS

- **Cloudflare wildcard DNS** (`*.blockvibe.org`) works — any subdomain resolves to the Elastic IP without per-tenant DNS records.
- **Caddy HTTPS** does not use a wildcard — each tenant hostname must be listed in `Caddyfile` and deployed.

Full explanation and verification commands: [docs/deployment/readme.md § DNS and HTTPS](../docs/deployment/readme.md#7-dns-and-https-cloudflare--caddy).
