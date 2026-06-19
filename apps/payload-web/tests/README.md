# BlockVibe Testing Suite

This directory contains the integration and End-to-End (E2E) tests for the multi-tenant Payload CMS application.

---

## Directory Structure

```text
tests/
├── e2e/             # Playwright browser-level E2E & UI tests
├── int/             # Vitest component/system integration tests
└── helpers/         # Reusable test seeds and automation utilities
```

- **`e2e/`**: Runs in headless/headed real browsers. Tests entire user journeys, authentication, subdomain multi-tenancy, and visual pages.
- **`int/`**: Runs inside a Node JSDOM simulated environment. Great for super-fast API endpoint and middleware assertion without browser overhead.
- **`helpers/`**: Seeding functions (like `seedTestUser`) and login automation scripts.

---

## Execution Commands

### 1. Run Everything

Runs both Vitest integration and Playwright E2E suites:

```bash
pnpm test
```

### 2. Integration Tests (Vitest)

Runs Vitest tests in the terminal:

```bash
pnpm test:int
```

### 3. End-to-End Tests (Playwright)

#### Local Development

You can run E2E tests locally in two ways: **Faster Mode (Pre-compiled)** or **Development Mode**.

##### Option A: Faster Mode (Pre-compiled Production) - RECOMMENDED

In development mode, Next.js compiles pages dynamically on-demand. This on-demand compilation takes time and can trigger Playwright test timeouts. Building the application and starting the production server first resolves this bottleneck:

1. Build the application:
   ```bash
   pnpm build
   ```
2. Start the production server:
   ```bash
   pnpm start
   ```
3. Run the tests in another terminal window (Playwright will detect that port 3000 is occupied and reuse it):
   ```bash
   pnpm test:e2e
   ```

##### Option B: Development Mode (Auto-managed or Manual)

If you are actively modifying the React application code and want Fast Refresh, you can run in development mode.

- **Auto-managed**: Simply run `pnpm test:e2e` when no server is running on port 3000. Playwright will automatically start `pnpm dev` in the background and tear it down when finished.
- **Manual**: If you prefer to keep the development server running:
  1. Start the dev server:
     ```bash
     pnpm dev
     ```
  2. Run tests in another terminal window:
     ```bash
     pnpm test:e2e
     ```

#### Running Specific Tests & Flags

To run a specific test file (for example, the multi-tenant login verification):

```bash
pnpm exec playwright test tests/e2e/multitenant.e2e.spec.ts --config=playwright.config.ts
```

##### Useful Flags for Local Testing:

- **Headed Mode** (watch the browser perform the actions visually):
  ```bash
  pnpm exec playwright test tests/e2e/multitenant.e2e.spec.ts --config=playwright.config.ts --headed
  ```
- **Debug Mode** (step through each line of the test script manually with Playwright Inspector):
  ```bash
  pnpm exec playwright test tests/e2e/multitenant.e2e.spec.ts --config=playwright.config.ts --debug
  ```
- **UI Mode** (opens the interactive Playwright test runner dashboard):
  ```bash
  pnpm exec playwright test tests/e2e/multitenant.e2e.spec.ts --config=playwright.config.ts --ui
  ```

#### Running all tests

| Target                                  | Headless             | UI mode                 |
| --------------------------------------- | -------------------- | ----------------------- |
| **Local** (`http://localhost:3000`)     | `pnpm test:e2e`      | `pnpm test:e2e:ui`      |
| **Prod** (`https://info.blockvibe.org`) | `pnpm test:e2e:prod` | `pnpm test:e2e:prod:ui` |

Both commands run **all** specs in `tests/e2e/` (admin, dashboard, invite, multitenant, platform, frontend, legal, neighbor).

Override the URL for any run:

```bash
PLAYWRIGHT_BASE_URL=https://my-staging.example.com pnpm test:e2e
```

#### Production/Staging URL

Executes E2E tests against a remote production environment. This bypasses the local dev server compilation and does not attempt to seed the database directly from the runner.

```bash
pnpm test:e2e:prod
pnpm test:e2e:prod:ui
```

Production flows (deploy → seed → verify): [docs/deployment/production-flows.md](../docs/deployment/production-flows.md)

_Note: You can override the production URL dynamically in the command line:_

```bash
PLAYWRIGHT_BASE_URL=https://my-prod-domain.com pnpm test:e2e:prod
```

---

## Chrome vs. Chromium Channels

In [playwright.config.ts](file:///Users/eugen/dev/blockvibe/experiments/04-payload-multitenant/playwright.config.ts), you can configure the browser `channel` used by Playwright. Here is when to use each:

- **`chrome` (System Channel)**:
  - **When to use**: Local development when your internet connection has firewall blocks, proxies, or timeouts that prevent downloading Playwright's specific browser packages.
  - **How it works**: Uses the stable, standard Google Chrome app already installed on your local machine (`/Applications/Google Chrome.app` on macOS). No heavy downloads required.

- **`chromium` (Playwright Default)**:
  - **When to use**: Continuous Integration (CI/CD) environments (GitHub Actions, Vercel builds) or pristine local environments where Chrome is not pre-installed.
  - **How it works**: Downloads and launches Playwright's dedicated "Chrome for Testing" package matching the runner version precisely.

---

## E2E Multi-Tenant Configuration

The E2E tests are configured via [playwright.config.ts](file:///Users/eugen/dev/blockvibe/experiments/04-payload-multitenant/playwright.config.ts) and adapt dynamically using environment variables from [.env](file:///Users/eugen/dev/blockvibe/experiments/04-payload-multitenant/.env):

1. **`PLAYWRIGHT_BASE_URL`**: The target root domain to test against (e.g. `http://localhost:3000`).
2. **Subdomain Resolution**: Test files (such as `multitenant.e2e.spec.ts`) resolve subdomains against this root domain (e.g. `nog.localhost` or `beaverdale.localhost` for local, and `nog.production.com` or `beaverdale.production.com` for production).
3. **Database Seeding**:
   - **Local runs**: Local tests will run `seedTestUser()` to inject mock credentials into the database.
   - **Production runs**: Seeding is automatically skipped when `PLAYWRIGHT_BASE_URL` points to a non-local URL. Instead, tests use credentials from `.env`:
     - `TENANT_NOG_USERNAME` / `TENANT_NOG_PASSWORD` (and other `TENANT_*` vars per tenant)
     - **Admin Panel** (`admin.e2e.spec.ts`): `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`, or fallback `LOCAL_SUPERADMIN_USERNAME` / `LOCAL_SUPERADMIN_PASSWORD`
