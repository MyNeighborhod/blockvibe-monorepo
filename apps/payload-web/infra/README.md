# Infrastructure & Deployment

## One-command deploy (day-to-day)

From the project root, after initial setup is complete:

```bash
./infra/deploy.sh
```

This builds the Docker image **on your machine** (not on EC2), syncs media, uploads config, and restarts the server.

| Flag / script                    | When to use                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `./infra/deploy.sh`              | Full deploy: app + media + Caddy + env                              |
| `./infra/deploy.sh --skip-media` | Code-only deploy (faster)                                           |
| `./infra/sync-media.sh`          | Media-only sync, no rebuild                                         |
| `./infra/push-db-to-prod.sh`     | **Replace production DB** with local (source of truth) + sync media |
| `pnpm seed:prod-content`         | Seed prod **content only** (platform home + NOG users) via SSH tunnel |
| `./infra/sync-prod-schema.sh`    | Pull prod DB → schema push locally → push back (no full content replace) |

### Local DB → production (source of truth)

When local content is canonical and you want production to match:

```bash
./infra/push-db-to-prod.sh
```

This dumps local Postgres, uploads to EC2, replaces the production database, restarts the app container, and rsyncs `public/media/`.

Use `--yes` to skip the confirmation prompt, `--skip-media` for database only.

## First-time setup (once per environment)

1. **Provision AWS** (Terraform):

   ```bash
   cd infra/
   cp terraform.tfvars.example terraform.tfvars   # edit with your values
   terraform init
   terraform apply
   ```

2. **Create production env**:

   ```bash
   cp .env.production.example .env.production   # fill in secrets
   ```

3. **Deploy**:

   ```bash
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
