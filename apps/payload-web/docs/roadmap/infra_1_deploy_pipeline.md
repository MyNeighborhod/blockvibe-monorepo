# Infra Roadmap: Deploy Pipeline (v1 → v2)

Audit of the current self-hosted deployment pipeline and a prioritized backlog of improvements.

**Current stack:** Terraform (EC2 + EIP + Cloudflare DNS) → `deploy.sh` (local Docker build + SCP) → Caddy (TLS + static media) → Docker Compose (Next.js/Payload + Postgres).

**Related docs:** [deployment/readme.md](../deployment/readme.md), [infra/README.md](../../infra/README.md)

---

## Progress

| # | Item | Status |
| --- | --- | --- |
| — | **v1 pipeline** (Terraform, deploy, push-db, docs) | ✅ Shipped |
| 1 | Prod backup before DB push | ✅ Done |
| 2 | SSH open to the world | ⬜ Open |
| 3 | Terraform state local only | ⬜ Open |
| 4 | No rollback on bad deploys | ⬜ Open |
| 5 | Full downtime on every deploy | ⬜ Open |
| 6 | Preflight after Docker build (`deploy.sh`) | ⬜ Open |
| 7 | Caddyfile duplicated | ⬜ Open |
| 8 | `.env` uploaded on every deploy | ⬜ Open |
| 9 | `StrictHostKeyChecking=no` | ⬜ Open |
| 10 | No post-deploy health check | ⬜ Open |
| 11 | No CI/CD | ⬜ Open |
| 12 | No `pull-prod-db` | ⬜ Open |
| 13 | Image transport via `tar.gz` | ⬜ Acceptable for now |
| 14 | Postgres not backed up automatically (nightly) | ⬜ Open |
| 15 | `docker-compose.yml` has no healthchecks | ⬜ Open |

**Phase 1 (safety):** 1 of 4 done — next up: preflight (#6), smoke test (#10), payload-only recreate (#5).

---

## Shipped (v1 baseline)

Already in production before this roadmap; keep as-is.

| Area | What shipped |
| --- | --- |
| **Infra** | Terraform EC2 + EIP + Cloudflare DNS; `userdata.sh` (Docker, Caddy, swap) |
| **Deploy** | `deploy.sh` (local `linux/amd64` build → SCP → compose up); `--skip-media` |
| **Data sync** | `push-db-to-prod.sh` (local → prod DB + media); `sync-media.sh` |
| **Local DB workflow** | `pnpm db:snapshot:local`, `pnpm db:restore:local`, `dbsnapshots/` |
| **Docs** | `docs/deployment/readme.md`, `infra/README.md` |

---

## Current pipeline

```mermaid
flowchart LR
  subgraph local [Developer machine]
    TF[Terraform apply]
    BUILD[docker build linux/amd64]
    SAVE[docker save → app.tar.gz]
    RSYNC[rsync public/media]
    ENV[scp .env.production]
  end

  subgraph ec2 [EC2]
    CADDY[Caddy :443]
    APP[Payload / Next :3000]
  end

  subgraph data [Persistent on EBS]
    MEDIA[/var/www/blockvibe/media]
    PG[(Postgres volume)]
  end

  TF --> ec2
  BUILD --> SAVE --> ec2
  RSYNC --> MEDIA
  ENV --> APP
  CADDY -->|/media/*| MEDIA
  CADDY -->|/*| APP
  APP --> PG
```

### Scripts

| Script | Purpose |
| --- | --- |
| `infra/deploy.sh` | App image, compose, Caddy, env, optional media |
| `infra/push-db-to-prod.sh` | Replace prod DB from local snapshot + optional media; auto-backup prod first |
| `infra/sync-media.sh` | Media-only rsync |

### What works well (keep)

- **Local build, remote run** — avoids OOM on `t3.micro` during `next build`.
- **Media on EBS** — `/var/www/blockvibe/media` mounted into the container; Caddy serves `/media/*` directly.
- **Network isolation** — app and Postgres bind to `127.0.0.1`; only Caddy is public.
- **Secrets handling** — `.env.production` gitignored; uploaded at deploy time, not baked into the image.
- **Operational flags** — `--skip-media`, `push-db-to-prod.sh --yes`, PG17→PG16 dump filter.
- **Documentation** — quick-reference table in `docs/deployment/readme.md` matches the scripts.

---

## Improvement backlog

Items are ordered by severity. Effort estimates assume a single developer familiar with the repo.

---

### 1. ~~No prod backup before DB push~~ ✅ Done

**Risk:** High — `push-db-to-prod.sh` runs `DROP SCHEMA public CASCADE`. A failed restore leaves production empty (this already happened once).

**Implemented (2026-06-09):** Option A in `push-db-to-prod.sh`.

- Before `DROP SCHEMA`, dumps prod to `/home/ubuntu/backups/pre-push-YYYYMMDD-HHMMSS.sql`
- Aborts restore if backup is empty; restarts `payload` on failure
- Rotates to the 7 newest `pre-push-*.sql` files
- `--no-backup` flag for emergencies only

---

### 2. SSH open to the world

**Risk:** High — security group allows port 22 from `0.0.0.0/0` in `infra/main.tf`.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. IP allowlist** | `cidr_blocks = [var.admin_cidr]` in Terraform; update when IP changes. | ~20 min |
| **B. AWS SSM Session Manager** | Drop public SSH; use `aws ssm start-session`. Requires IAM role on instance. | ~2 hr |
| **C. Tailscale / WireGuard** | VPN-only SSH. Good for multi-admin teams. | ~2–4 hr |

**Recommendation:** A short-term; B if the instance is long-lived and shared.

---

### 3. Terraform state is local only

**Risk:** High — `terraform.tfstate` on disk is easy to lose, corrupt, or leak; no locking for concurrent applies.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. S3 + DynamoDB backend** | Remote state in S3, lock table in DynamoDB. Standard AWS pattern. | ~1 hr |
| **B. Terraform Cloud** | Free tier for remote state + runs. Less AWS wiring. | ~45 min |
| **C. Git-ignored local state** | Current approach + strict backups. Minimum bar only. | — |

**Recommendation:** A or B before a second person runs `terraform apply`.

---

### 4. No rollback on bad deploys

**Risk:** High — `docker load` overwrites `blockvibe-app:latest`; a broken image requires manual recovery.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Git-SHA image tags** | Build `blockvibe-app:$(git rev-parse --short HEAD)`; compose references tag; keep `previous` tag. | ~1 hr |
| **B. Rollback script** | `infra/rollback.sh` retags `blockvibe-app:previous` → `latest` and recreates payload. | ~30 min (after A) |
| **C. Container registry** | Push to ECR; pin digest in compose. Enables history in AWS. | ~2 hr |

**Recommendation:** A + B for quick wins; C when image size or deploy frequency grows.

---

### 5. Full downtime on every deploy

**Risk:** Medium — `docker compose down` stops Postgres and the app together.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Recreate payload only** | `docker compose up -d --no-deps --force-recreate payload` after `docker load`. Leave `db` running. | ~15 min |
| **B. Blue/green** | Second compose project on `:3001`, Caddy traffic switch. Overkill for single instance. | ~4 hr |
| **C. Accept brief outage** | Document expected ~30–60s downtime. Fine for low-traffic sites. | — |

**Recommendation:** A for code deploys; full `down` only when compose file or DB config changes.

---

### 6. Preflight checks run after Docker build

**Risk:** Medium — `deploy.sh` verifies `docker`/`rsync`/`ssh` only after a full image build.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Move preflight to top** | Check tools, SSH key, terraform output, and `.env.production` before `docker build`. | ~10 min |
| **B. Shared `infra/lib/preflight.sh`** | One preflight sourced by `deploy.sh`, `push-db-to-prod.sh`, `sync-media.sh`. | ~30 min |

**Recommendation:** A immediately; B when adding more scripts.

---

### 7. Caddyfile duplicated

**Risk:** Medium — same config in `infra/Caddyfile` and `infra/userdata.sh`; new tenant hostnames need two edits.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Single source of truth** | `userdata.sh` installs a minimal HTTP-only stub; first `deploy.sh` always uploads `infra/Caddyfile`. | ~20 min |
| **B. Generate from Terraform** | `templatefile()` renders Caddyfile from `var.tenant_subdomains`. | ~1 hr |
| **C. Document sync requirement** | Checklist in deployment readme. Weakest option. | ~5 min |

**Recommendation:** B long-term; A as a quick dedup.

---

### 8. `.env` uploaded on every deploy

**Risk:** Medium — accidental deploy with wrong or stale env overwrites production secrets.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. `--skip-env` flag** | Default: upload env; flag skips for code-only deploys. | ~15 min |
| **B. Env only on first deploy** | Upload if remote `.env` missing unless `--force-env`. | ~20 min |
| **C. SSM Parameter Store** | Secrets in AWS; compose reads at runtime. No SCP of secrets. | ~2 hr |

**Recommendation:** A now; C if secrets rotation or multi-env is needed.

---

### 9. `StrictHostKeyChecking=no` on rsync/scp

**Risk:** Medium — MITM on first connect from new networks.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. `ssh-keyscan` once** | After terraform apply, append host key to `known_hosts`; scripts use default strict checking. | ~20 min |
| **B. Document and accept** | Personal laptop, fixed Elastic IP — low practical risk. | — |

**Recommendation:** A when hardening; acceptable for solo dev on fixed IP today.

---

### 10. No post-deploy health check

**Risk:** Low — scripts print success without verifying HTTPS or container health.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Curl smoke test** | `curl -sf https://$(terraform output -raw domain_url)/` with retries; fail deploy on non-200. | ~20 min |
| **B. Docker healthcheck** | `HEALTHCHECK` in Dockerfile + compose `depends_on: condition: service_healthy`. | ~30 min |
| **C. External monitor** | UptimeRobot / Better Stack on `info.blockvibe.org`. | ~15 min (external) |

**Recommendation:** A in `deploy.sh`; C for ongoing monitoring.

---

### 11. No CI/CD

**Risk:** Low — deploys depend on a specific laptop with Docker, Terraform, and SSH keys.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. GitHub Actions build-only** | CI runs `pnpm build` / lint on PR; deploy stays manual. | ~1 hr |
| **B. GitHub Actions deploy on `main`** | OIDC or stored SSH key; build image in CI, SCP or ECR pull on EC2. | ~3–4 hr |
| **C. Manual deploy (status quo)** | Fine while traffic and team size are small. | — |

**Recommendation:** A soon; B when deploys are weekly or team grows.

---

### 12. No pull-prod-db (one-way sync only)

**Risk:** Low — intentional (local is source of truth), but no escape hatch if prod drifts.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. `infra/pull-prod-db.sh`** | `pg_dump` on EC2 → SCP → `pnpm db:restore:local`. Mirror of push script. | ~1 hr |
| **B. Document manual pull** | SSH + `pg_dump` steps in deployment readme. | ~15 min |
| **C. No pull (policy)** | Enforce local-only edits; prod is disposable mirror. | — |

**Recommendation:** A when debugging prod-specific issues or before risky migrations.

---

### 13. Image transport via `tar.gz` over SCP

**Risk:** Low — works today; does not scale with image size or deploy frequency.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Amazon ECR** | CI or laptop pushes image; EC2 `docker pull`. Drops multi-minute SCP. | ~2 hr |
| **B. Compress harder** | `gzip -9` or `zstd`; marginal gain. | ~5 min |
| **C. Keep tar.gz** | Acceptable while images stay &lt; ~500 MB and deploys are infrequent. | — |

**Recommendation:** C for now; A when SCP becomes the bottleneck.

---

### 14. Postgres data not backed up automatically

**Risk:** Low–medium — DB lives in Docker volume `pgdata`; only recovery paths are push from local or manual dump.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Cron on EC2** | Nightly `pg_dump` to `/home/ubuntu/backups/`; rotate after 7 days. | ~1 hr |
| **B. EBS snapshots** | AWS Backup or Lifecycle Manager on the root volume. | ~1 hr |
| **C. Rely on local DB** | Policy: prod DB is reproducible from local + push script. | — |

**Recommendation:** A + document restore procedure; B for disaster recovery.

---

### 15. `docker-compose.yml` has no healthchecks

**Risk:** Low — Caddy may proxy to a container that is still starting.

**Possible solutions:**

| Option | Description | Effort |
| --- | --- | --- |
| **A. Add `healthcheck` to payload** | HTTP GET `localhost:3000`; compose waits before marking healthy. | ~30 min |
| **B. Caddy retry / lb policy** | `reverse_proxy` with `health_uri` and retries (Caddy 2.6+). | ~20 min |

**Recommendation:** A when post-deploy flakes appear.

---

## Suggested implementation phases

### Phase 1 — Safety (≈ half day)

1. ~~Prod backup before DB push (#1)~~ ✅
2. Preflight at top of `deploy.sh` (#6)
3. Post-deploy curl smoke test (#10)
4. Recreate `payload` only on code deploy (#5)

### Phase 2 — Recoverability (≈ 1 day)

5. Git-SHA image tags + `rollback.sh` (#4)
6. `--skip-env` on deploy (#8)
7. `pull-prod-db.sh` (#12)
8. Nightly `pg_dump` cron on EC2 (#14)

### Phase 3 — Hardening (≈ 1–2 days)

9. SSH IP allowlist or SSM (#2)
10. Remote Terraform state (#3)
11. Caddyfile from Terraform template (#7)
12. `ssh-keyscan` / strict host key checking (#9)

### Phase 4 — Automation (≈ 2–3 days)

13. GitHub Actions CI (#11)
14. ECR + `docker pull` deploy path (#13)
15. Optional: SSM Parameter Store for secrets (#8C)

---

## Open decisions

| Question | Options | Notes |
| --- | --- | --- |
| **Source of truth for DB** | Local only vs bidirectional sync | Current policy: local → prod via `push-db-to-prod.sh` |
| **Acceptable deploy downtime** | Seconds vs minutes | Phase 1 targets seconds for app-only deploys |
| **Who can SSH** | Single IP vs VPN vs SSM | Depends on team size |
| **When to add CI deploy** | After N manual deploys / second contributor | Manual is fine for experiments |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-09 | Mark #1 done (auto prod backup in `push-db-to-prod.sh`); add progress table and v1 baseline section |
| 2026-06-09 | Initial audit and roadmap from v1 pipeline review |
