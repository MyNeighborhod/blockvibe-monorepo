# Email system documentation

Architecture and operations for neighborhood broadcasts, dual delivery (SES + Gmail OAuth), and the email microservice.

| Document | Contents |
| -------- | -------- |
| **[architecture.md](./architecture.md)** | System design: OAuth, SES, Gmail API, Lambda worker, delivery log, data model |
| **[deployment.md](./deployment.md)** | Deploy payload-web + Lambda (CDK), env vars, staging checklist, troubleshooting |
| **[email-srv migrations](../../../packages/email-srv/README.md)** | Run `email_srv` Drizzle migrations (local, staging, production) |
| [email-service/readme.md](../email-service/readme.md) | Worker security, cost, invoke model |
| [email_system_design.md](../milestones/m1/email_system_design.md) | Original M1 design: templates, sponsors, RFC 8058 unsubscribe |
| [implementation_plan.md § Email](../crm/implementation_plan.md) | CRM + broadcaster implementation notes |

**Start here:** [architecture.md](./architecture.md) · **Deploy:** [deployment.md](./deployment.md)
