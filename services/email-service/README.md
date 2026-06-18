# Email service (AWS Lambda worker)

Background worker for neighborhood broadcasts. Invoked by **payload-web** — not by browsers.

| Mode | Entry | Deploy |
| ---- | ----- | ------ |
| **Production / staging** | `src/invoke-handler.ts` | AWS CDK — [infra/README.md](./infra/README.md) |
| **Local dev** | `src/server.ts` (Express :4001) | `pnpm email-service:dev` |

## Quick start

```bash
# Build + bundle Lambda asset
pnpm email-service:build

# Deploy to AWS (from monorepo root)
pnpm email-service:deploy --staging
pnpm email-service:deploy --prod

# Local HTTP worker
EMAIL_SERVICE_SIGNING_SECRET=dev-secret pnpm email-service:dev
```

## What it does

1. Verifies **enqueue token** (HMAC, 5 min TTL)
2. Sends one email per recipient with **100ms delay** (SES SMTP or Gmail API)
3. Continues on per-recipient failure; collects `failedEmails`
4. **POSTs delivery results** to payload-web `/api/email/broadcasts/complete`

Gmail credentials arrive in the invoke payload (Lambda has no database access).

## Documentation

| Doc | Contents |
| --- | -------- |
| [docs/email/architecture.md](../../apps/payload-web/docs/email/architecture.md) | Full system design |
| [docs/email/deployment.md](../../apps/payload-web/docs/email/deployment.md) | Deploy payload-web + Lambda |
| [infra/README.md](./infra/README.md) | CDK commands |
| [docs/email-service/readme.md](../../apps/payload-web/docs/email-service/readme.md) | Security & topology |

`serverless.yml` is **deprecated** — use CDK in `infra/`.
