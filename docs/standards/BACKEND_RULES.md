# Backend Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Standards for `apps/api` built on **Node.js + TypeScript + Express.js + Prisma ORM + Swagger/OpenAPI**.

---

## 1. Mandatory Technology Stack (`MUST`)

- **Runtime & Language:** Node.js LTS + TypeScript strict mode (`tsconfig.json`)
- **HTTP Framework:** Express.js (`MUST NOT` mix PHP, Laravel, NestJS, or GraphQL servers)
- **ORM & DB:** Prisma Client (`@prisma/client`) connected to MySQL 8.4
- **Validation:** Zod schemas (`@nexora/shared` + module validators)
- **API Docs:** Swagger / OpenAPI 3.0 generated/served at `/api/docs`

---

## 2. Module Folder Convention (`MUST`)

Every active business domain lives in `apps/api/src/modules/<module>/`:

```
modules/<module>/
├── <module>.routes.ts       # Express Router + middleware chain only
├── <module>.controller.ts   # Request parsing + HTTP response mapping only
├── <module>.service.ts      # Business logic + transactions + domain coordination
├── <module>.repository.ts   # Prisma queries & locking encapsulated cleanly
└── <module>.validator.ts    # Zod request schemas (importing DTO contracts from @nexora/shared)
```

Shared runtime layers live in:

- `apps/api/src/config/` (centralized Zod-validated env loader, OpenAPI config)
- `apps/api/src/common/` (`AppError`, HTTP response envelope helpers, Prisma client singleton)
- `apps/api/src/middleware/` (`errorHandler`, `notFoundHandler`, `validateRequest`, `requireAuth`, `requireRole`)

---

## 3. Controllers, Services & Repositories Rules (`MUST` / `MUST NOT`)

1. **Thin Controllers (`MUST`):** Controllers read validated params/body/query, call one service method, and send `res.status(...).json(...)`.
2. **No Business Logic in Routes or Controllers (`MUST NOT`):** Totals, stock adjustments, discount caps, margins, or ownership checks MUST live inside services (not Express handlers).
3. **Repository Isolation (`MUST`):** Prisma queries sit inside repository classes/modules or transaction-scoped repository helpers (`tx: Prisma.TransactionClient`), enabling clean unit testing of services and single-responsibility data access.
4. **Centralized Error Handling (`MUST`):** Throw typed `AppError` / domain errors with explicit HTTP status and stable machine error code (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `SERVICE_UNAVAILABLE`). Global error middleware converts unexpected failures cleanly and hides stack traces in production.

---

## 4. Logging & Configuration (`MUST`)

1. Validate `process.env` via Zod at startup in `config/env.ts`; refuse to boot if required variables (`DATABASE_URL`, `AUTH_SECRET`, etc.) are missing or malformed.
2. **MUST NOT** `console.log` secrets, passwords, `Authorization` headers, cookies, session tokens, or full webhook signatures.
3. Structured request/error logs **SHOULD** omit PII and sensitive payloads.
