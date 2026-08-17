# Monorepo Exploration: Moving Payload CMS to a Monorepo

This document details the architectural thinking, directory structure, and step-by-step migration plan for moving the `04-payload-multitenant` experiment into a dedicated monorepo. This will allow integration of miscellaneous other services and shared configurations in the future, while leaving the other experiments intact.

---

## 1. Architectural Rationale

### Why a Monorepo?
As the BlockVibe platform grows, managing separate repositories or isolated projects for the frontend, CMS, and background/miscellaneous services leads to operational overhead:
* **Dependency Fragmentation**: Different versions of React, Next.js, and Payload across packages.
* **Code Duplication**: Re-writing TypeScript types, API clients, and ESLint/Prettier configuration files in every new project.
* **Complex Local Development**: Needing to spin up multiple services manually without a unified orchestrator.

### Tooling Strategy
1. **Package Manager: `pnpm` Workspaces**
   * **Why**: The project already uses `pnpm`. `pnpm` is the industry standard for monorepos due to its speed, disk-space efficiency (via content-addressable storage), and robust workspace support.
   * **Mechanism**: A single `pnpm-lock.yaml` at the root guarantees that shared dependencies are resolved to identical versions and deduplicated.
2. **Build System: Turborepo (`turbo`)**
   * **Why**: Turborepo provides a zero-configuration build cache and task scheduler.
   * **Benefit**: We can define relationships between tasks (e.g., "always run database code-generation before building the Next.js app"). It also runs tasks (like development servers and compilers) in parallel with clean, streamed console outputs.

---

## 2. Proposed Monorepo Structure

We propose creating the monorepo root folder under `/Users/eugen/dev/blockvibe/blockvibe-monorepo/`.

```text
blockvibe-monorepo/
├── apps/
│   └── payload-web/             # The migrated 04-payload-multitenant application
├── services/                    # Future miscellaneous services (e.g. background workers, CRM integrations)
├── packages/                    # Shared configurations and packages
│   ├── typescript-config/       # Shared TSConfigs (base, nextjs, react)
│   └── eslint-config/           # Shared ESLint configurations (nextjs, node)
├── package.json                 # Monorepo root package.json (defines scripts and turbo devDependencies)
├── pnpm-workspace.yaml          # Defines workspace package boundaries
├── pnpm-lock.yaml               # Unified monorepo lockfile
├── turbo.json                   # Turborepo task pipeline configuration
├── docker-compose.yml           # Monorepo-wide Postgres database container configuration
├── init.sql                     # Database initializer script
└── .gitignore                   # Monorepo-wide gitignore
```

---

## 3. Core Workspace Configurations

### Root `pnpm-workspace.yaml`
Specifies which folders are part of the workspace:
```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
```

### Root `package.json`
Lifts shared development dependencies and defines workspace-wide scripts:
```json
{
  "name": "blockvibe-monorepo",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": "^18.20.2 || >=20.9.0",
    "pnpm": "^9 || ^10"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.4"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "sharp",
      "esbuild",
      "unrs-resolver"
    ]
  }
}
```

### Root `turbo.json`
Configures task ordering and caching. For example, ensuring Payload generates database import-maps and types before compiling the Next.js app:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build", "generate:types", "generate:importmap"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "payload-types.ts"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "generate:types": {
      "cache": false
    },
    "generate:importmap": {
      "cache": false
    }
  }
}
```

---

## 4. Shared Configuration Packages

To maintain consistency and reduce boilerplate, we establish shared packages under `packages/`:

### 1. `@blockvibe/typescript-config`
Extends common tsconfigs.
* **`base.json`**: Strict compiler options, target `ES2022`, module resolution `bundler`.
* **`nextjs.json`**: Extends `base.json` and adds `"jsx": "react-jsx"` and the Next.js TypeScript plugin.
* **Usage in `apps/payload-web/tsconfig.json`**:
  ```json
  {
    "extends": "@blockvibe/typescript-config/nextjs.json",
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@payload-config": ["./src/payload.config.ts"],
        "@/*": ["./src/*"]
      }
    }
  }
  ```

### 2. `@blockvibe/eslint-config`
Maintains identical coding standards (such as Next.js Core Web Vitals, unused-variable warnings, and Prettier formatting integration) in one configuration.
* **Usage in `apps/payload-web/eslint.config.mjs`**:
  ```js
  import blockvibeConfig from "@blockvibe/eslint-config"
  export default [...blockvibeConfig]
  ```

---

## 5. Step-by-Step Migration Plan

1. **Workspace Initialization**:
   * Create the directory `blockvibe-monorepo/`.
   * Write `pnpm-workspace.yaml`, `.gitignore`, `turbo.json`, and root `package.json`.
   * Write the shared TS and ESLint configurations under `packages/`.

2. **Docker Setup**:
   * Add `docker-compose.yml` defining the Postgres container.
   * Add `init.sql` containing `CREATE DATABASE "04-payload-multitenant";` to run automatically on first boot.

3. **Application Transfer**:
   * Create `apps/payload-web/`.
   * Copy all contents of `experiments/04-payload-multitenant` to `apps/payload-web/` (excluding `node_modules/`, `.next/`, and the local `pnpm-lock.yaml`).
   * Update `apps/payload-web/package.json` to rename the package to `"payload-web"` and remove `pnpm.onlyBuiltDependencies` (which is now handled by the root).

4. **Integration**:
   * Run `pnpm install` at the root of `blockvibe-monorepo`.
   * Verify that a single `pnpm-lock.yaml` is created at the root and all dependencies (including Next.js and Payload CMS) resolve correctly.

5. **Database Configuration & Documentation**:
   * Update references in `apps/payload-web/development.md` to point Docker compose commands to the root database config (`../../docker-compose.yml`).
   * Boot the database via `docker compose up -d postgres` and run local seeds to verify connectivity.
