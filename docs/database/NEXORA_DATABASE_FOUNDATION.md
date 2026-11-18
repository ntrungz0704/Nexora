# Nexora Database Foundation Report

- **Status:** `Approved` (Phase 1 Foundation)
- **Last Updated:** `2026-11-18`
- **Scope:** Summarizes MySQL 8.4 LTS container configuration, Prisma ORM foundation schema, migration setup, and synthetic seed execution for Phase 1. Full column & diagram contracts live in [`ERD.md`](ERD.md) and [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md).

---

## 1. Engine & Connection Contract

- **Engine:** MySQL `8.4` (`mysql:8.4` official image in `docker-compose.yml`)
- **Database Name:** `nexora` (plus optional isolated `nexora_test` for integration tests)
- **Charset:** `utf8mb4` / `utf8mb4_unicode_ci`
- **Access:** Exclusively via `@prisma/client` using environment-injected `DATABASE_URL` validated at boot (`apps/api/src/config/env.ts`).

---

## 2. Foundation Schema Boundaries (Phase 1 Only)

Following [`PROJECT_SCOPE.md`](../governance/PROJECT_SCOPE.md), only three foundational platform models exist in `prisma/schema.prisma`:

1. **`User` (`users`):** Minimal identity & RBAC foundation supporting `CUSTOMER`, `SELLER`, and `ADMIN` roles (`Guest` represents unauthenticated requests).
2. **`StoreSetting` (`store_settings`):** Single-store key/value baseline asserting Single-Vendor store configuration (`store.name = "Nexora Tech Store"`, `store.business_model = "single-vendor"`).
3. **`AuditLog` (`audit_logs`):** Append-only baseline event table with optional `FK -> users(id)` (`ON DELETE SET NULL`) and JSON metadata.

All e-commerce domain entities (`Product`, `ProductVariant`, `Order`, `PurchaseOrder`, `InventoryCostLayer`, `Expense`, etc.) remain intentionally **excluded from Phase 1** until their design ERDs/ADRs are reviewed cleanly.

---

## 3. Idempotent Development Seeding (`prisma/seed.ts`)

- Uses strictly **synthetic non-PII fixtures** (`admin.demo@nexora.test`, `seller.demo@nexora.test`, `customer.demo@nexora.test`, `@nexora.test` emails — zero real personal names, phone numbers, or addresses).
- Safe for repeated runs via `prisma.<model>.upsert(...)`.
- Zero `TechPilot` credentials, hashes, or PII rows imported.
