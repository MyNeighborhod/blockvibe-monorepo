# Email service — AWS CDK

Deploys the **cost-minimized** email worker: one Lambda (`blockvibe-email-{stage}-send`), invoked directly from EC2 payload-web via IAM. No API Gateway, no SQS.

## Prerequisites

- AWS CLI configured (`aws configure` or `CDK_DEFAULT_ACCOUNT` / `CDK_DEFAULT_REGION`)
- One-time CDK bootstrap per account/region:

```bash
cd services/email-service/infra
pnpm install
pnpm exec cdk bootstrap
```

## Deploy

From the monorepo root:

```bash
# Dev (uses services/email-service/.env)
./services/email-service/infra/deploy.sh

# Staging / production (uses payload-web env files)
./services/email-service/infra/deploy.sh --staging
./services/email-service/infra/deploy.sh --prod
```

Or manually:

```bash
pnpm email-service:build
cd services/email-service/infra
export EMAIL_SERVICE_SIGNING_SECRET=...
export SMTP_HOST=...  # optional, for SES path
pnpm exec cdk deploy --all -c stage=dev
```

## After deploy

1. Set on EC2 payload-web `.env`:

   ```
   EMAIL_LAMBDA_FUNCTION_NAME=blockvibe-email-prod-send
   ```

2. Restart payload container (`docker compose restart payload-staging` or `payload`).

Terraform already grants the EC2 role `lambda:InvokeFunction` on `arn:aws:lambda:us-east-1:*:function:blockvibe-email-*`.

## Stack outputs

| Output | Purpose |
| ------ | ------- |
| `SendFunctionName` | `EMAIL_LAMBDA_FUNCTION_NAME` |
| `SendFunctionArn` | IAM / debugging |

## Synth / diff

```bash
cd services/email-service/infra
EMAIL_SERVICE_SIGNING_SECRET=placeholder pnpm exec cdk synth -c stage=dev
pnpm exec cdk diff -c stage=dev
```

## Architecture

See [docs/email/architecture.md](../../../apps/payload-web/docs/email/architecture.md) and [docs/email/deployment.md](../../../apps/payload-web/docs/email/deployment.md).

## Lambda bundle

CDK uploads a pre-bundled asset (not `NodejsFunction` — avoids pnpm monorepo issues):

```bash
pnpm email-service:build   # runs scripts/bundle-lambda.mjs → dist/lambda/invoke-handler.js
```

Redeploy Lambda after worker code changes. Redeploy payload-web separately when UI or callback route changes.
