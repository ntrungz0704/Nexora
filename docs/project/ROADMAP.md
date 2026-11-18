# Project Roadmap — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Phased implementation plan from Foundation through Graduation Thesis Delivery.

---

## Phase Overview

| Phase       | Milestone Name                            | Scope Summary                                                                                                                                                                       | Status               |
| ----------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Phase 0** | Safe Migration Preparation                | Environment verification, TechPilot read-only audit reconciliation, reuse inventory                                                                                                 | `Completed / Active` |
| **Phase 1** | Nexora Foundation & Governance            | Monorepo (`web`, `api`, `shared`, `config`, `prisma/`), Docker MySQL 8.4, minimal Prisma foundation, ESLint/Prettier/Vitest/Supertest/Playwright, full Governance & Standards docs  | `In Progress`        |
| **Phase 2** | GitHub Foundation                         | Fresh orphan Git init, `.gitignore`, Private GitHub repo `Nexora`, exact 6 branches (`main`, `trung`, `hieu`, `kim`, `dinh`, `phuc`) from initial commit                            | `In Progress`        |
| **Phase 3** | Identity, RBAC & Core Auth _(Next Phase)_ | ERD/ADR approval, Argon2id/bcrypt auth, Customer/Seller/Admin RBAC middleware, hashed session/reset tokens, SMTP Mailpit mailer, profile & 4-tier address CRUD                      | `Planned`            |
| **Phase 4** | Hardware Catalog, SKUs & Specs            | Categories (fixed tree), Brands + ported SVGs, Products + Variants/SKUs, TS port of TechPilot 20-cat spec schemas & facet filters                                                   | `Planned`            |
| **Phase 5** | Purchasing, Suppliers & Inventory Ledger  | Suppliers, Purchase Orders, Goods Receipts (GRN), FIFO/MWAC Cost Layers (`DEC-007`), traceable non-negative stock ledger                                                            | `Planned`            |
| **Phase 6** | Cart, Promotions, Checkout & Payments     | DB/Guest Cart, fixed Coupon Engine (`fixed`, `percent`, `free_shipping`), Flash Sale atomic reservations, Reorder validation, COD + VNPay Gateway + Signed IPN + Transaction Ledger | `Planned`            |
| **Phase 7** | Fulfillment, RMA & SellerMargin Analytics | Order workflow, Shipments + actual carrier cost, Customer/Seller RMA + refunds/restock, Expenses, SellerMargin P&L reports (Order/SKU/Period)                                       | `Planned`            |
| **Phase 8** | Differentiators & Thesis Hardening        | TS port of PC Builder compatibility + Persona Compare + SSRF-safe AI Advisor, Playwright E2E regression suite, thesis defense packaging                                             | `Planned`            |
