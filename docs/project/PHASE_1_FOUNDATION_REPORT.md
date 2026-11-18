# Phase 1 — Nexora Monorepo & Database Foundation Report

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Summarizes verified Phase 1 installation, build, lint, test, MySQL 8.4 migration, and runtime checks inside `D:\Nexora\`.

---

## 1. Installed Stack & Verified Versions

| Workspace / Tool                    | Key Packages Installed                                                                                                                                                                          | Verified Version Baseline                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Root Tooling                        | `typescript`, `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `vitest`, `@playwright/test`, `prisma`, `@prisma/client`, `tsx`, `concurrently`, `dotenv`                                | TS `~5.9.3`, ESLint `^10.15.0`, Prettier `^3.10.1`, Vitest `^5.1.1`, Prisma `6.19.3`, Playwright `^1.59.0`     |
| `@nexora/web`                       | `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `axios` | React `^19.3.1`, Vite `^8.3.8`, Tailwind v4 (`^4.3.5`), TanStack Query `^5.108.0`, RHF `^7.92.0`, Zod `^4.6.7` |
| `@nexora/api`                       | `express`, `cors`, `helmet`, `swagger-ui-express`, `dotenv`, `zod`, `@prisma/client`, `supertest`                                                                                               | Express `^5.3.0`, Helmet `^8.1.0`, Supertest `^7.3.2`, Prisma Client `6.19.3`                                  |
| `@nexora/shared` & `@nexora/config` | `@nexora/config`, `zod`                                                                                                                                                                         | Compiled TypeScript (`dist/`) shared safely by `web` and `api`                                                 |

---

## 2. Database & Migration Verification

- **MySQL 8.4 Container (`nexora-mysql`):** Initialized via `docker compose up -d mysql` with `utf8mb4_unicode_ci` and persistent volume `nexora_mysql_data`; dev shadow-DB privileges granted via `docker/mysql/01-dev-grants.sh`.
- **Prisma Initial Migration:** Applied `prisma/migrations/20261118162807_init_foundation/migration.sql` creating `users`, `store_settings`, and `audit_logs`.
- **Synthetic Development Seed:** Executed `npm run db:seed` (`prisma/seed.ts`) seeding 3 synthetic `@nexora.test` users (`ADMIN`, `SELLER`, `CUSTOMER`), 3 store settings asserting `single-vendor` model, and 1 baseline audit entry.

---

## 3. Quality, Build & Runtime Verification Notes

- **Verified Passing:** `npm run db:generate`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test` (3 test files / 7 Vitest specs across `shared`, `api`, `web`), `npm run test:integration` (real MySQL 8.4 + Prisma + Supertest against `nexora-mysql`), `npm run build` (`api` `tsc` + `web` Vite bundle), and live host Express + Vite HTTP smoke probes.
- **Docker Full-Stack Build Note:** Multi-stage Dockerfiles (`docker/web.Dockerfile`, `docker/api.Dockerfile`) compiled cleanly; however, Docker Desktop daemon crashed during full `nexora-api` image layer commit (`Error response from daemon: Docker Desktop is unable to start`), preventing live `nexora-api`/`nexora-web` container startup checks until Docker Desktop restarts. `docker/api.Dockerfile` was subsequently slimmed via `--omit=dev --workspace=...` to minimize runner layer size.
- **Playwright E2E Note:** Test spec discovery passed (`tests/e2e/foundation.spec.ts`); live Chromium execution was not run after the Docker Desktop crash halted MySQL.
