# System Architecture — Nexora

- **Status:** `Approved` (Foundation Baseline; Business Modules Pending Design Phases)
- **Last Updated:** `2026-11-18`
- **Scope:** High-level runtime, workspace, data flow, and deployment architecture for **Nexora**.

---

## 1. Architectural Overview (`Modular Monolith`)

Nexora uses a **Modular Monolith** inside an **npm Workspaces Monorepo**, separating client presentation (`apps/web`), backend API (`apps/api`), shared contracts (`packages/shared`, `packages/config`), and relational schema (`prisma/`). Microservices are explicitly NOT used.

```
┌────────────────────────────────────────────────────────────────────┐
│  Browser Client (Customer / Guest / Seller / Admin)               │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTPS / REST JSON (+ CORS Allowlist)
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/web — React 19 + TypeScript + Vite + Tailwind CSS            │
│  React Router │ TanStack Query │ React Hook Form + Zod │ Axios     │
└───────────────────────────────┬────────────────────────────────────┘
                                │ /api/v1/* (Zod DTO Contracts from @nexora/shared)
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/api — Node.js + Express + TypeScript Modular Monolith        │
│  Helmet │ CORS │ Rate Limit │ Auth/RBAC │ Zod │ OpenAPI (/api/docs)│
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Modules: system (Active Foundation)                          │  │
│  │ Planned Modules: catalog, cart, checkout, orders, payments,  │  │
│  │ inventory, purchasing, promotions, returns, sellermargin, ai │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ Prisma Client (ACID $transaction)
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  MySQL 8.4 LTS (Docker service `mysql` + persistent volume)       │
│  Managed strictly by Prisma Migrate (`prisma/schema.prisma`)       │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Runtime Components

1. **Frontend (`apps/web`):** Single-page React application built with Vite and styled using Tailwind CSS. Consumes `@nexora/shared` types/Zod schemas. **No direct database access**; **no Next.js/Angular**.
2. **Backend (`apps/api`):** Unified Express REST server exposing versioned endpoints (`/api/v1/*`) and Swagger/OpenAPI docs (`/api/docs`). Organizes domain code into cohesive modules under `apps/api/src/modules/` with strict `routes -> controller -> service -> repository` separation.
3. **Shared Packages (`packages/shared`, `packages/config`):** Holds framework-agnostic Zod schemas, response envelope types, store role enums (`GUEST`, `CUSTOMER`, `SELLER`, `ADMIN`), and shared non-secret constants.
4. **Database (`prisma/` + MySQL 8.4 LTS):** Relational InnoDB storage with `DECIMAL` financial fields, foreign keys, and append-only migrations.
5. **Future External Integrations (Configured When Modules Enter Scope):** VNPay Payment Gateway (signed return + IPN webhook), Transactional Email (Mailpit dev / SMTP prod), Multi-provider AI Advisor (Gemini/Groq/Qwen), Object/Local safe media storage.
6. **Development & Deployment Direction:** Docker Compose runs isolated `mysql:8.4` (+ optional `api`/`web` services) with persistent named volume and healthchecks; GitHub Actions runs install, typecheck, lint, format check, build, and Vitest/Supertest tests.
