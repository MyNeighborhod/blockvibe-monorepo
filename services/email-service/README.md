# Email service (AWS Lambda)

## Production (lowest cost)

**One Lambda**, invoked **directly from EC2** via IAM (`lambda:InvokeFunction`). No API Gateway, no SQS.

| Setting | Value |
| ------- | ----- |
| Handler | `dist/invoke-handler.handler` |
| Memory | 256 MB |
| Timeout | 300 s |
| Log retention | 3 days |
| Cold starts | Acceptable |

```bash
cd services/email-service
EMAIL_SERVICE_SIGNING_SECRET=... npx serverless deploy
```

Attach to the EC2 instance role:

```json
{ "Effect": "Allow", "Action": "lambda:InvokeFunction", "Resource": "arn:aws:lambda:us-east-1:*:function:blockvibe-email-*" }
```

## Local dev (Express + TSOA)

Not used in production deploy — for OpenAPI and manual testing only.

```bash
pnpm email-service:build
EMAIL_SERVICE_SIGNING_SECRET=dev-secret pnpm email-service:dev
```

## Docs

Architecture, security, and cost: [docs/email-service/readme.md](../../apps/payload-web/docs/email-service/readme.md)
