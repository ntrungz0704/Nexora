# Data Dictionary — Nexora

- **Status:** `Foundation Approved / Business Entities DRAFT`
- **Last Updated:** `2026-11-18`
- **Scope:** Exact column definitions matching [`prisma/schema.prisma`](../../prisma/schema.prisma). Zero unimplemented or speculative columns are presented as live.

---

## 1. `users` (Foundation Baseline Table)

| Column       | MySQL Type                          | Nullable | Default                | Constraints / Indexes  | Purpose                                              |
| ------------ | ----------------------------------- | -------- | ---------------------- | ---------------------- | ---------------------------------------------------- |
| `id`         | `INT UNSIGNED`                      | No       | `AUTO_INCREMENT`       | `PRIMARY KEY`          | Internal numeric user identifier                     |
| `email`      | `VARCHAR(150)`                      | No       | —                      | `UNIQUE KEY`           | Login / identity email address                       |
| `full_name`  | `VARCHAR(150)`                      | No       | —                      | —                      | Display name                                         |
| `role`       | `ENUM('CUSTOMER','SELLER','ADMIN')` | No       | `'CUSTOMER'`           | `INDEX (role, status)` | Single-vendor RBAC role (`Guest` is unauthenticated) |
| `status`     | `ENUM('ACTIVE','INACTIVE')`         | No       | `'ACTIVE'`             | `INDEX (role, status)` | Account lock / lifecycle state                       |
| `created_at` | `DATETIME(3)`                       | No       | `CURRENT_TIMESTAMP(3)` | —                      | Creation timestamp                                   |
| `updated_at` | `DATETIME(3)`                       | No       | `ON UPDATE`            | —                      | Last update timestamp                                |

_(Authentication credentials, reset tokens, and customer addresses will be added via migration when Identity & Auth module enters active design.)_

---

## 2. `store_settings` (Single-Store Configuration Baseline)

| Column          | MySQL Type     | Nullable | Default          | Constraints / Indexes | Purpose                                               |
| --------------- | -------------- | -------- | ---------------- | --------------------- | ----------------------------------------------------- |
| `id`            | `INT UNSIGNED` | No       | `AUTO_INCREMENT` | `PRIMARY KEY`         | Setting primary key                                   |
| `setting_key`   | `VARCHAR(100)` | No       | —                | `UNIQUE KEY`          | Configuration key (e.g., `store.name`, `store.model`) |
| `setting_value` | `VARCHAR(500)` | No       | —                | —                     | Configuration value                                   |
| `description`   | `VARCHAR(255)` | Yes      | `NULL`           | —                     | Human-readable purpose note                           |
| `updated_at`    | `DATETIME(3)`  | No       | `ON UPDATE`      | —                     | Last update timestamp                                 |

---

## 3. `audit_logs` (Operational Traceability Baseline)

| Column        | MySQL Type        | Nullable | Default                | Constraints / Indexes                                                    | Purpose                                              |
| ------------- | ----------------- | -------- | ---------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `id`          | `BIGINT UNSIGNED` | No       | `AUTO_INCREMENT`       | `PRIMARY KEY`                                                            | High-volume immutable audit log ID                   |
| `actor_id`    | `INT UNSIGNED`    | Yes      | `NULL`                 | `FK -> users(id)` (`ON DELETE SET NULL`), `INDEX (actor_id, created_at)` | Acting user (null for system events)                 |
| `action`      | `VARCHAR(100)`    | No       | —                      | —                                                                        | Action verb (e.g., `SYSTEM_BOOT`, `SETTING_UPDATED`) |
| `entity_type` | `VARCHAR(80)`     | No       | —                      | `INDEX (entity_type, entity_id)`                                         | Target domain entity name                            |
| `entity_id`   | `VARCHAR(100)`    | Yes      | `NULL`                 | `INDEX (entity_type, entity_id)`                                         | Target entity ID string                              |
| `metadata`    | `JSON`            | Yes      | `NULL`                 | —                                                                        | Non-PII, non-secret structured audit context         |
| `created_at`  | `DATETIME(3)`     | No       | `CURRENT_TIMESTAMP(3)` | `INDEX (created_at)`                                                     | Event timestamp                                      |

---

## 4. Unimplemented Business Tables (`DRAFT / NOT YET DESIGNED`)

All remaining e-commerce, purchasing, inventory costing, RMA, and SellerMargin tables (`products`, `product_variants`, `suppliers`, `purchase_orders`, `goods_receipts`, `inventory_cost_layers`, `orders`, `order_items`, `payment_transactions`, `expenses`, etc.) are **`DRAFT / NOT YET DESIGNED`** and MUST NOT be queried or referenced until added cleanly via Prisma Migrate and documented here.
