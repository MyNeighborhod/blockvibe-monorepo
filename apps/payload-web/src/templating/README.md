# Tenant Templating System

This directory contains database seeding templates and helper functions used to dynamically spin up new, scoped layouts for new tenants.

## Purpose

When running a multi-tenant platform, creating a new tenant should automatically configure standard pages (like `Home` and `Contact`), navigation headers/footers, and default content rather than leaving the tenant's admin dashboard empty.

The templates defined in this folder are modeled after the Beaverdale layout configurations and serve as the baseline setup for any new tenant.

## Files in this Folder

- **[tenant-template.ts](file:///Users/eugen/dev/blockvibe/experiments/04-payload-multitenant/src/templating/tenant-template.ts)**: Contains JSON structures and data helpers for generating:
  - **Pages**: Standard layout fields for Home and Contact pages.
  - **Globals**: Scoped Navigation Header and Footer menu configurations.
  - **Posts**: A default welcome blog post scoped to the new tenant.
  - **Media**: Placeholder media definitions.

## How to Generate a New Tenant

You can spin up a new tenant using the CLI script located in `src/scripts/generate-tenant.ts`.

Run the command with the following options:

```bash
pnpm tsx src/scripts/generate-tenant.ts --slug=<slug> --name="<Name>" --domain="<domain>" --template="<light|dark>"
```

### Example

```bash
pnpm tsx src/scripts/generate-tenant.ts --slug=oakwood --name="Oakwood Neighborhood" --domain="www.oakwooddsm.org" --template=light
```

The script will:

1. Generate a random 8-character password.
2. Add the username and password to your local `.env` file under `TENANT_<SLUG>_USERNAME` and `TENANT_<SLUG>_PASSWORD`.
3. Create the tenant record in the database.
4. Create the tenant's dedicated admin user and link it to the tenant.
5. Create pages, headers, footers, and media scoped to the new tenant based on the template definitions in this folder.
