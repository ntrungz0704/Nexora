# Database Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Authoritative data engineering rules for **MySQL 8.4 LTS** and **Prisma ORM** in Nexora (`prisma/`).

---

## 1. Engine, ORM & Schema Governance (`MUST`)

- **Database Engine:** **MySQL 8.4 LTS** (`utf8mb4` / `utf8mb4_unicode_ci` InnoDB). **MUST NOT** introduce MongoDB, Mongoose, NoSQL, or PostgreSQL.
- **Schema & Migrations:** Managed **exclusively** through `prisma/schema.prisma`, **Prisma Migrate**, and **Prisma Client** (`apps/api`).
- **No Raw Copy of TechPilot SQL (`MUST NOT`):** Never copy TechPilot `schema.sql` verbatim; design entities deliberately for Nexora's Single-Vendor model, SKU variants, inbound costing, and SellerMargin integrity.

---

## 2. Relational Integrity & Constraints (`MUST`)

1. **Primary & Foreign Keys (`MUST`):** Every entity MUST declare an explicit PK; every parent/child relation MUST enforce database-level Foreign Keys (`@relation` with explicit `onDelete` / `onUpdate` behavior—never omit FKs just to make seed shortcuts pass!).
2. **Unique & Composite Indexes (`MUST`):** Declare `@unique` / `@@unique` for natural business keys (`email`, `slug`, `sku`, `order_code`, idempotency keys) and `@@index` on frequent filter/join keys (`status`, `createdAt`, `(entityId, createdAt)`).
3. **Referential & Audit Safety (`MUST NOT` Cascade-Destroy Financial History):** Financial records (`Order`, `OrderItem`, `PaymentTransaction`, `ReturnRequest`, `InventoryMovement`, `CostLayer`) **MUST NOT** be hard-deleted (`onDelete: Restrict` or archive status).

---

## 3. Monetary Precision & Profitability Rules (`MUST` / `MUST NOT`)

1. **NEVER Use `FLOAT` or `DOUBLE` for Money (`MUST NOT`):** All prices, discounts, shipping fees, taxes, unit costs, gateway fees, expenses, and margins **MUST** use MySQL **`DECIMAL`** (`@db.Decimal(18, 2)` for currency totals; `@db.Decimal(18, 4)` for unit COGS / proportional allocations).
2. **Explicit Deterministic Rounding (`MUST`):** Document rounding policy (half-up / integer VND where applied) in SellerMargin calculators; distribute coupon rounding remainder cleanly so line allocations sum identically to order discount.
3. **Immutable Transaction Snapshots (`MUST`):** Orders and returns **MUST** persist snapshot values (`unitListPrice`, `unitSellingPrice`, `allocatedDiscount`, `unitCostSnapshot`, `priceSource`) at transaction time. **NEVER** compute historical order or period profitability using current `Product` selling price or current purchase cost!

---

## 4. Stock, Transactions & Concurrency Rules (`MUST`)

1. **No Negative Inventory (`MUST NOT`):** Physical stock (`onHand`) and reserved counts MUST remain `>= 0`. Validate bounds atomically inside `prisma.$transaction()` using row-level locking (`SELECT ... FOR UPDATE`) or conditional atomic updates where supported by MySQL.
2. **Traceable Inventory Ledger (`MUST`):** Every inbound PO receipt, order reservation, release, fulfillment deduction, manual adjustment, and return restock MUST produce an append-only ledger entry with actor, reason, and reference ID.
3. **Mandatory Transaction Boundaries (`MUST`):** Multi-step mutations (checkout + stock reserve + coupon redemption; GRN receipt + stock increment + cost layer write; VNPay IPN settlement; RMA approval + restock/refund) MUST execute atomically inside database transactions with full rollback on error.

---

## 5. Migrations, Seeding, Pooling & Operations (`MUST`)

1. **Never Edit Applied Migrations (`MUST NOT`):** Once a migration directory is committed/applied, NEVER modify its SQL file. Create a new additive/corrective migration instead (`prisma migrate dev --name ...`).
2. **No Manual Production Schema Edits (`MUST NOT`):** Never alter production/shared MySQL tables manually outside Prisma Migrate.
3. **Synthetic Development Seeds Only (`MUST`):** `prisma/seed.ts` MUST be idempotent (`upsert`) and contain strictly synthetic demo data — **zero real customer names, phones, emails, addresses, or production passwords**.
4. **Backup & Recovery (`SHOULD`):** Document `mysqldump --single-transaction` backup/restore procedures and test fresh `migrate reset` locally cleanly against Docker MySQL before PR submission.
