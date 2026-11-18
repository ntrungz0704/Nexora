# AGENTS.md — Root Instructions for AI Coding Agents

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Role:** Canonical entry point and coordination contract for all AI agents working in **Nexora**. Read this file first before planning or modifying any code.

---

## 1. Project Identity & Business Model

- **Project Name:** **Nexora** (rebuilt from legacy PHP reference `TechPilot`, keeping clean architecture & independent Git history).
- **Business Model:** **Single-Vendor E-Commerce & Store Management System** for **ONE store only** specializing in technology hardware (desktops, laptops, PC components, accessories, peripherals).
- **User Roles:** `Guest` (unauthenticated visitor), `Customer` (buyer), `Staff` (internal store operations staff), `Admin` (system administrator).
- **Explicit Boundary (`MUST NOT`):** Nexora is **NOT a Marketplace**. Agents **MUST NOT** design or build multi-vendor stores, external seller registration, seller commissions, seller payouts, marketplace settlement, or multi-store order splitting. `SellerMargin` is the name of the store financial and profitability analytics module, NOT a user role.

---

## 2. Official Technology Stack (Locked)

| Layer           | Mandatory Stack (`MUST` use)                                                                                                        | Prohibited (`MUST NOT` introduce)                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Frontend**    | HTML5, CSS3, Tailwind CSS, ES6+, TypeScript, **ReactJS**, **Vite**, React Router, TanStack Query, React Hook Form, Zod, Axios/Fetch | Next.js, Angular, PHP views, separate Vanilla JS app |
| **Backend**     | **Node.js**, **TypeScript**, **Express.js**, REST API, Prisma ORM, Zod, Swagger/OpenAPI                                             | PHP, Laravel, NestJS, GraphQL microservices          |
| **Database**    | **MySQL 8.4 LTS** + **Prisma ORM** / **Prisma Migrate** / **Prisma Client**                                                         | PostgreSQL, MongoDB, Mongoose, NoSQL                 |
| **DevOps & QA** | npm Workspaces, Git, GitHub, Docker, Docker Compose, GitHub Actions, ESLint, Prettier, Vitest, Supertest, Playwright                | Microservices, unmanaged manual DB edits             |

---

## 3. Core Engineering Rules (Links to Authoritative Standards)

Do not improvise rules. Always consult the specialized standard before editing that domain:

- **Agent Workflow & Guardrails:** [`docs/governance/AI_AGENT_WORKING_RULES.md`](docs/governance/AI_AGENT_WORKING_RULES.md) & [`docs/governance/DEFINITION_OF_DONE.md`](docs/governance/DEFINITION_OF_DONE.md)
- **Project Scope & Decisions:** [`docs/governance/PROJECT_SCOPE.md`](docs/governance/PROJECT_SCOPE.md), [`docs/governance/DECISION_LOG.md`](docs/governance/DECISION_LOG.md)
- **Architecture (`Modular Monolith`):** [`docs/standards/ARCHITECTURE_RULES.md`](docs/standards/ARCHITECTURE_RULES.md) — Monorepo (`apps/web`, `apps/api`, `packages/shared`, `packages/config`, `prisma/`). Separate routes -> controllers -> services -> repositories -> DTO/validations. No circular deps; no DB access from React.
- **Frontend:** [`docs/standards/FRONTEND_RULES.md`](docs/standards/FRONTEND_RULES.md) — Feature-based React+TS+Tailwind, Zod + RHF validation, TanStack Query, no business logic in UI components.
- **Backend:** [`docs/standards/BACKEND_RULES.md`](docs/standards/BACKEND_RULES.md) — Express+TS modular services, central Zod env/request validation, central error handler, no stack trace leaks.
- **Database:** [`docs/standards/DATABASE_RULES.md`](docs/standards/DATABASE_RULES.md) — MySQL 8.4 + Prisma Migrate. Use `DECIMAL` for money (`MUST NOT` use `FLOAT`/`DOUBLE`), enforce FKs & transactions, prevent negative stock, snapshot price/discount/COGS on orders (`MUST NOT` calculate historical profit from current prices), never edit applied migrations.
- **API Design:** [`docs/standards/API_DESIGN_RULES.md`](docs/standards/API_DESIGN_RULES.md) — RESTful JSON envelopes, Zod error schemas, idempotency keys, OpenAPI docs.
- **Security:** [`docs/standards/SECURITY_RULES.md`](docs/standards/SECURITY_RULES.md) — Argon2/bcrypt hashing, backend RBAC + ownership checks (UI hiding is NOT auth), Helmet, CORS allowlist, rate limiting, SSRF filtering, signed webhook verification, zero secrets/PII in Git.
- **Testing:** [`docs/standards/TESTING_RULES.md`](docs/standards/TESTING_RULES.md) — ESLint, Prettier, `tsc --noEmit`, Vitest, Supertest, Playwright; never fake passing tests.
- **Git & Migration:** [`docs/standards/GIT_WORKFLOW.md`](docs/standards/GIT_WORKFLOW.md) (6 official branches: `main`, `trung`, `hieu`, `kim`, `dinh`, `phuc`; PRs into `main`), [`docs/standards/MIGRATION_RULES.md`](docs/standards/MIGRATION_RULES.md) (never touch/delete `TechPilot/` or copy `.git`, credentials, PII, or PHP MVC), [`docs/standards/DOCUMENTATION_RULES.md`](docs/standards/DOCUMENTATION_RULES.md).

---

## 4. Forbidden Actions (`MUST NOT`)

1. **MUST NOT** modify, move, or delete [`TechPilot/`](TechPilot/) or [`audit-output/`](audit-output/).
2. **MUST NOT** change the locked stack (e.g., switch to Next.js, NestJS, Laravel, MongoDB, or Microservices).
3. **MUST NOT** expand product scope into a multi-vendor Marketplace or implement unrequested modules outside the active task/phase.
4. **MUST NOT** fabricate ERD tables, test results, commit hashes, GitHub states, or bypass security/database constraints.
5. **MUST NOT** commit `.env`, API keys, VNPay secrets, plaintext passwords, or real PII.
6. **MUST NOT** commit Git messages in languages other than **tiếng Việt không dấu** (quy chuẩn bắt buộc: toàn bộ Git commit messages phải viết bằng tiếng Việt không dấu theo chuẩn Conventional Commits).

---

## 5. Required Execution & Reporting Standard

1. **Before coding:** Read `AGENTS.md` + task-relevant standards -> inspect actual files -> identify affected modules & risks -> execute cleanly.
2. **After coding:** Run actual `typecheck`, `lint`, `test`, `build` commands applicable to changes; fix regressions; update affected `docs/`.
3. **Report format:** Always distinguish `PASS` / `PARTIAL` / `BLOCKED` / `FAIL` backed exclusively by verified command outputs and file paths; list remaining risks/decisions honestly.
