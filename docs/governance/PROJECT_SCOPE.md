# Project Scope & Business Boundaries — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Defines exact in-scope phases, out-of-scope boundaries, explicit Single-Vendor constraints, and the change control procedure.

---

## 1. Current Active Phase: **Foundation (Phase 0–2 Setup)**

| Component                | Current Phase Scope (`In-Scope Now`)                                                                                                       | Deferred (`Future Feature Phases`)                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Governance & Docs**    | `AGENTS.md`, `GEMINI.md`, `docs/governance/*`, `docs/standards/*`, `.github/*`, architecture/DB/API foundations                            | Detailed entity ERDs & OpenAPI endpoints as business modules are designed                                                             |
| **Monorepo & Tooling**   | npm Workspaces (`apps/web`, `apps/api`, `packages/shared`, `packages/config`), TS configs, ESLint, Prettier, Vitest, Supertest, Playwright | Full production deployment pipelines / cloud IaC                                                                                      |
| **Database Foundation**  | MySQL 8.4 Docker service, initial minimal Prisma schema (`User`, `StoreSetting`, `AuditLog` baseline), initial migration & safe dev seed   | Business schemas (`Product`, `ProductVariant`, `Order`, `PurchaseOrder`, `CostLayer`, `Expense`, etc.) pending Phase-specific ERD/ADR |
| **Application Skeleton** | React+Vite+Tailwind status/health UI, Express API `/api/v1/health`, `/api/v1/system/meta`, `/api/docs` Swagger, Zod env validation         | Storefront catalog, Cart/Checkout, Auth flows, Purchasing, Inventory, SellerMargin dashboards                                         |
| **Git & GitHub**         | Private repo `Nexora`, clean initial commit, 6 branches (`main`, `trung`, `hieu`, `kim`, `dinh`, `phuc`)                                   | Branch feature PRs & protected status checks after initial CI verification                                                            |

---

## 2. Planned Product Scope (24 Business Modules Across Future Build Phases)

1. **Commerce Core (Customer-Facing):** Storefront Home, Catalog, Categories & Brands, Variants/SKUs, Spec Tables, Search/Facet Filtering, Product Compare, PC Builder, Cart, Checkout, COD & VNPay, Order Tracking, Reorder (checking current SKU/stock/price without cloning stale orders), Reviews, Wishlist, Profile/Addresses, Returns/Warranty, Notifications, AI Advisor.
2. **Store Operations (Internal Seller & Admin):** Product & SKU Management, Inventory & Stock Ledger, Suppliers & Purchase Orders, Goods Receipts, Cost History & COGS, Order Processing, Shipping Dispatch, Promotions & Coupons, Customer Management, Returns/RMA Settlement, Seller Dashboard, Banner/Content/Review Moderation, Admin User & RBAC Management, Audit Logs, System Settings.
3. **Financial Intelligence (SellerMargin):** Gross Sales, Discounts, Net Sales, COGS, Shipping Cost Variance, Payment Gateway Fees, Packaging Costs, Order Contribution Profit, Operating Expenses, Period Net Profit (backed by immutable snapshots & cost layers).

---

## 3. Explicit Exclusions (`MUST NOT` Implement)

1. **Marketplace & Multi-Vendor Features (`PERMANENTLY EXCLUDED`):**
   - **MUST NOT** implement external seller onboarding/registration, seller KYC, or multi-storefront tenancy (`vendor_id` / independent seller stores).
   - **MUST NOT** implement marketplace commission rates, seller wallets/payouts, settlement batches, or multi-vendor order splitting.
   - `Seller` in Nexora is strictly an **internal store employee role**.
2. **Prohibited Legacy / Unapproved Artifacts (`MUST NOT` Port):**
   - **MUST NOT** port TechPilot fake fallback data (`getSampleProducts()`, fake `100000` cart items) or UI-only dead forms (`newsletter onsubmit="return false;"`).
   - **MUST NOT** add microservices, message brokers, MongoDB, PHP, Laravel, NestJS, Next.js, or Angular.
   - **MUST NOT** pre-build placeholder UI screens or empty stub controllers for future business modules before their design ADR & DB schema are approved.

---

## 4. Scope Change Procedure

Any change to excluded items, locked tech stack, branch topology, or module scope MUST:

1. Submit a written proposal referencing business justification and impact on schedule/DB/security.
2. Create an ADR draft under `docs/architecture/ADR/` and log an entry in [`DECISION_LOG.md`](DECISION_LOG.md) as `PROPOSED`.
3. Receive explicit user/team lead approval (`Approved`) **before** any implementation code or schema migration is created.
