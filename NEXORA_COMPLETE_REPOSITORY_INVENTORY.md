# NEXORA COMPLETE REPOSITORY INVENTORY
**Canonical Inventory Location:** [`comprehensive-audit/01_PROJECT_INVENTORY.md`](file:///d:/Nexora/comprehensive-audit/01_PROJECT_INVENTORY.md)  
**Last Updated:** 2026-11-23  

This file serves as the root index for the comprehensive repository map generated during the Nexora Master Audit.

---

## 1. Quick Stats
- **Total Monorepo Source Files:** 679
- **Total Physical Code Lines:** 66,325 LOC
  - `apps/api`: 14,417 LOC
  - `apps/web`: 47,316 LOC
  - `packages/shared`: 1,150 LOC
  - `prisma`: 3,150 LOC
  - `root`: 292 LOC
- **Test Suites:** 20 test files, 257 passing automated tests
- **Database:** MySQL 8.4 LTS via Prisma ORM (20 Models, 8 Append-Only Migrations)

---

## 2. Monorepo Structure
- [`apps/api`](file:///d:/Nexora/apps/api): Node.js + Express 5 Backend REST API
- [`apps/web`](file:///d:/Nexora/apps/web): React 19 + Vite Frontend SPA Storefront & Admin
- [`packages/shared`](file:///d:/Nexora/packages/shared): Shared Zod schemas, DTOs, Enums
- [`packages/config`](file:///d:/Nexora/packages/config): Shared lint, tsconfig, prettier configs
- [`prisma`](file:///d:/Nexora/prisma): Database migrations, schema, seed scripts
- [`comprehensive-audit`](file:///d:/Nexora/comprehensive-audit): Official 12-document master audit suite

For the full detailed breakdown and dependency graph, please read:
👉 [01_PROJECT_INVENTORY.md](file:///d:/Nexora/comprehensive-audit/01_PROJECT_INVENTORY.md)
