# Email system documentation

Architecture and operations for neighborhood broadcasts, dual delivery (SES + Gmail OAuth), and the email microservice.

| Document | Contents |
| -------- | -------- |
| **[architecture.md](./architecture.md)** | End-to-end architecture: OAuth, SES, Lambda worker, `email_srv` schema, env vars |
| **[email-srv migrations](../../../packages/email-srv/README.md)** | Run `email_srv` Drizzle migrations (local, staging, production) |
| [email_system_design.md](../milestones/m1/email_system_design.md) | Original M1 design: React Email templates, sponsors, RFC 8058 unsubscribe |
| [implementation_plan.md § Email](../crm/implementation_plan.md) | CRM + broadcaster implementation notes |

**Start here:** [architecture.md](./architecture.md)
