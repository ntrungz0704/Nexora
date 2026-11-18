# Nexora Foundation Architecture Overview

- **Status:** `Approved` (Phase 1 Foundation)
- **Last Updated:** `2026-11-18`
- **Scope:** Phase 1 runtime topology connecting React + Vite + Tailwind CSS (`apps/web`), Express + Prisma + Swagger (`apps/api`), Shared Zod/TS (`packages/*`), and MySQL 8.4 (`docker-compose.yml`). See [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) and [`MODULE_BOUNDARIES.md`](MODULE_BOUNDARIES.md) for governing rules.

---

## 1. Monorepo Workspaces Realized in Phase 1

| Workspace / Directory | Package Name          | Responsibility in Phase 1                                                                                                                                            |
| --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`            | `@nexora/web`         | React 19 + TypeScript + Vite SPA + Tailwind CSS v4 + React Router + TanStack Query + React Hook Form + Zod + Axios; displays live API/MySQL health & system metadata |
| `apps/api`            | `@nexora/api`         | Node.js 22 + Express + TypeScript REST server (`Helmet`, `CORS` allowlist, Zod env validation, centralized error handler, Swagger UI `/api/docs`, `system` module)   |
| `packages/shared`     | `@nexora/shared`      | Shared Zod DTO schemas (`HealthResponse`, `SystemMetaResponse`, `EchoCheckRequest/Response`, standard JSON API envelopes) & Vitest contract tests                    |
| `packages/config`     | `@nexora/config`      | Shared non-secret store constants (`USER_ROLES`, `API_V1_PREFIX`, `BUSINESS_MODEL: 'single-vendor'`)                                                                 |
| `prisma/`             | Root Prisma Workspace | MySQL 8.4 `schema.prisma` (`User`, `StoreSetting`, `AuditLog` foundation models), initial SQL migration, and synthetic `seed.ts`                                     |

---

## 2. Request & Data Flow in Phase 1

```
Browser (http://localhost:5173)
  │  Axios + TanStack Query (GET /api/v1/health, /api/v1/system/meta, POST /api/v1/system/echo-check)
  ▼
Express API (http://localhost:3000)
  │  Helmet ─▶ CORS(CLIENT_URL) ─▶ Request Logging ─▶ Zod Validation ─▶ SystemController ─▶ SystemService
  ▼
Prisma Client (@prisma/client)
  │  SELECT 1 + Foundation Queries (store_settings, users)
  ▼
MySQL 8.4 Container (mysql:3306 / db: nexora)
```
