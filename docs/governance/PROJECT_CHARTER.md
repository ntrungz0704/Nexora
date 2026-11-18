# Project Charter — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Authoritative vision, business model, goals, constraints, and success criteria for the **Nexora** platform.

---

## 1. Project Vision

Build **Nexora**, a production-grade, single-vendor **Technology Hardware E-Commerce & Store Operations Platform** (desktops, laptops, PC components, accessories, peripherals) engineered with clean **Modular Monolith** TypeScript architecture, strict **MySQL 8.4 + Prisma** data integrity, and native **SellerMargin** profitability analytics suitable both for formal university graduation thesis defense and real-world store operations.

---

## 2. Background & Legacy Context

Nexora supersedes experimental legacy project `TechPilot` (`https://github.com/ntrungz0704/TechPilot.git`). Per the Phase-0 technical audit ([`audit-output/TECHPILOT_AUDIT_EXECUTIVE_SUMMARY.md`](../../audit-output/TECHPILOT_AUDIT_EXECUTIVE_SUMMARY.md)), TechPilot cannot be extended directly due to P0 credential/auth/SSRF flaws, broken migration replay, missing SKU/PO/COGS/margin foundations, and un-namespaced custom PHP MVC debt. Nexora starts from a clean repository and independent Git history while selectively porting validated hardware-domain rules rewritten into TypeScript.

---

## 3. Target Users & Business Model (`MUST`)

- **Business Model:** **Single-Vendor E-Commerce & Internal Store Management System** operating **ONE store only**.
- **Official Roles:**
  1. **Guest:** Unauthenticated storefront browser (catalog search, filters, comparison, PC builder, guest cart).
  2. **Customer:** Authenticated buyer (checkout, COD/VNPay payments, order tracking, reorder, returns/warranty, reviews, wishlist).
  3. **Staff:** Internal store operations staff (catalog/SKU, inventory, purchasing/PO, goods receipts, order processing, RMA, SellerMargin financial reporting).
  4. **Admin:** System & security administrator (user/RBAC management, system configuration, AI config, audit logs, oversight).
- **Prohibited Model (`MUST NOT`):** Nexora is **NOT a multi-vendor marketplace**. External seller registration, independent storefronts, commissions, seller payouts, and split-store orders are permanently excluded unless chartered under a future separate product.

---

## 4. Product Goals & Core Capabilities (24 Target Modules)

1. Identity & Authentication
2. Users & RBAC
3. Product Catalog
4. Product Variants & SKU
5. Product Specifications
6. Categories & Brands
7. Cart & Checkout
8. Orders
9. Payments (COD & VNPay)
10. Inventory & Stock Ledger
11. Suppliers & Purchasing
12. Goods Receipts
13. Cost History & COGS
14. Promotions & Coupons
15. Shipping
16. Returns & Warranty
17. Customer Management
18. Seller Dashboard
19. **SellerMargin Analytics** (GMV, Discounts, Net Sales, COGS, Contribution Profit, Operating Expenses, Net Profit)
20. AI Assistant & Recommendations / PC Builder
21. Notifications
22. Reports & Analytics
23. Audit Logs
24. Admin Management

_(Note: These 24 modules represent product direction; implementation proceeds strictly phase-by-phase per [`docs/project/ROADMAP.md`](../project/ROADMAP.md).)_

---

## 5. Technical Direction & Constraints

- **Stack (`MUST` comply):** Monorepo via npm Workspaces; Frontend `ReactJS + Vite + TypeScript + Tailwind CSS + React Router + TanStack Query + React Hook Form + Zod`; Backend `Node.js + Express.js + TypeScript + Swagger/OpenAPI`; Database `MySQL 8.4 LTS + Prisma ORM`; DevOps `Docker + Docker Compose + GitHub Actions`; QA `ESLint + Prettier + Vitest + Supertest + Playwright`.
- **Architecture (`MUST`):** Modular Monolith (`apps/web`, `apps/api`, `packages/shared`, `packages/config`, `prisma/`). No microservices; no MongoDB; no PHP.
- **Security & Financial Integrity:** Zero hardcoded secrets/PII, strict backend RBAC, `DECIMAL` monetary types, atomic stock/checkout transactions preventing negative stock, and immutable price/discount/COGS snapshots on orders.

---

## 6. Thesis & Platform Success Criteria

1. Clean reproducible local/Docker setup (`docker compose up` -> MySQL 8.4 -> Prisma Migrate -> Seed -> API + Web healthy).
2. Zero P0/P1 security vulnerabilities and verified payment webhook/idempotency integrity.
3. Exact financial traceability from Goods Receipt inbound costs -> FIFO/WAC COGS -> Order revenue/discounts -> RMA reversals -> SellerMargin P&L reports.
4. Automated static checks (`eslint`, `tsc`), unit/API tests (`vitest`, `supertest`), and E2E critical-flow validation (`playwright`) passing in GitHub Actions CI.
