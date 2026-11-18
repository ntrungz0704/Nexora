# Architecture Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Enforces Modular Monolith structure, npm Monorepo dependency flow, separation of concerns, and architectural change governance.

---

## 1. Architecture Style & Monorepo Layout (`MUST`)

Nexora **MUST** be structured as a **single Modular Monolith inside an npm Workspaces monorepo**:

- `apps/web`: React + TypeScript + Vite SPA frontend (`Storefront`, `Customer`, `Seller`, `Admin` interfaces).
- `apps/api`: Node.js + Express + TypeScript backend REST API organized by business domain under `src/modules/`.
- `packages/shared`: Cross-cutting TypeScript types, Zod contracts, constants, and pure formatting/domain schemas shared safely between `web` and `api`.
- `packages/config`: Shared non-secret runtime defaults and validation helpers (`USER_ROLES`, pagination bounds, API paths).
- `prisma/`: Authoritative MySQL 8.4 Prisma schema, migrations, and development seed scripts.

**Prohibited (`MUST NOT`):** Microservices, separate Vanilla JS frontends, PHP/Laravel modules, Next.js SSR coupling inside Express, or NoSQL databases.

---

## 2. Dependency Direction Rules (`MUST`)

Strict unidirectional imports apply:

```
apps/web  ──▶  packages/shared, packages/config   (via HTTP REST API to apps/api)
apps/api  ──▶  packages/shared, packages/config, @prisma/client
packages/shared  ──▶  packages/config (optional, zero cycles)
```

1. `apps/web` **MUST NOT** import files from `apps/api` (`src/`) or `@prisma/client`. Communication occurs exclusively over typed HTTP REST endpoints.
2. `packages/*` **MUST NOT** import anything from `apps/*`.
3. **Zero Circular Dependencies (`MUST NOT`):** Module A importing Module B while B imports A is forbidden; shared cross-module contracts belong in a lower shared contract or orchestrator service.

---

## 3. Backend Module Boundaries & Ownership (`MUST`)

- Each domain capability in `apps/api/src/modules/<module>/` **MUST** own its controllers, services (use cases), repositories, validators, and routes.
- **Data Ownership:** Only the owning module writes directly to its Prisma tables (e.g., only `Inventory` mutates stock quantities/cost layers; `Orders`/`CartCheckout` MUST invoke `InventoryService` inside shared Prisma transaction context rather than running raw stock SQL).
- **Thin Modules Only When Active (`MUST NOT` Create Empty Modules):** Do **NOT** scaffold 24 empty module directories prematurely. Create each module directory only when its schema and service logic enter active implementation.

---

## 4. Layer Responsibilities (`MUST`)

| Layer                    | Responsibility                                                                                               | Prohibited                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Routes**               | URL path matching, middleware attachment (`auth`, `rbac`, `validate`, `rateLimit`)                           | Business calculations, Prisma queries                                         |
| **Controllers**          | Extract validated HTTP params/body, invoke service/use-case, return standardized HTTP status & JSON envelope | Direct `prisma.*` SQL/queries, multi-step financial logic, HTML concatenation |
| **Services / Use Cases** | Orchestrate business rules, transactions (`$transaction`), domain events, calculations                       | Raw `req`/`res` Express coupling                                              |
| **Repositories**         | Encapsulate Prisma data access, locking queries, projections                                                 | Rendering messages or HTTP status codes                                       |

---

## 5. Error Handling & Configuration (`MUST`)

1. All operational configuration (`NODE_ENV`, `API_PORT`, `DATABASE_URL`, `CLIENT_URL`, `AUTH_SECRET`, external API keys) **MUST** load via centralized Zod-validated `config/env.ts` at startup and fail fast if invalid or missing required keys.
2. Controllers forward errors via `next(err)` to centralized Express error middleware producing standardized `{ success: false, error: { code, message, details? } }` responses without stack traces in production.

---

## 6. Architecture Change Process (`MUST`)

Any modification to module boundaries, stack packages, database engine, or cross-module communication requires an ADR entry under [`docs/architecture/ADR/`](../architecture/ADR/README.md) and approval in [`DECISION_LOG.md`](../governance/DECISION_LOG.md) **before** merging code.
