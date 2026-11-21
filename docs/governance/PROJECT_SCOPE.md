# Project Scope & Business Boundaries — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-19`
- **Scope:** Defines exact in-scope phases, out-of-scope boundaries, explicit Single-Vendor constraints, and the change control procedure.
- **Active Mandate (Override Authorized):** **FULL TECHPILOT PRODUCT MIGRATION**. Transitioned from foundation-only to full migration of all customer, admin, inventory, and AI capabilities matching TechPilot while keeping modern locked stack and security hardening.

---

## 1. Current Active Phase: **Full TechPilot Product Migration & Hardening**

| Component                                 | In-Scope (`Active Migration Objective`)                                                                                                                                                                                                                              | Future Scope                                         |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| **Commerce Core (Customer)**              | Storefront Home, Catalog, Categories & Brands, Specs, Search/Facet Filtering, Product Compare, PC Builder, Cart (Guest & Customer), Checkout, COD & VNPay (Sandbox & Callback), Order Tracking, Reviews, Wishlist, Profile/Addresses, Returns, Notifications         | Advanced CRM marketing automation                    |
| **Three Independent AI Systems**          | 1. Floating Chatbot Q&A<br>2. AI Assistant (5-step survey, 100-pt scoring)<br>3. Product Comparison AI (Persona, Category lock, Trade-offs)                                                                                                                          | Custom LLM fine-tuning on proprietary corpora        |
| **Store Operations (Admin/Staff)**        | Admin Dashboard, Products CRUD + AI Description, Categories CRUD + AI Generate, Brands CRUD, Order Processing & Status Update, Inventory Logs & Stock Adjustments, Flash Sales & Coupons, Reviews Moderation, Banners & Posts Management, Users/Customers Management | Multi-warehouse routing, ERP enterprise integrations |
| **Database & Persistence**                | MySQL 8.4 LTS, 28 legacy tables mapped to Prisma models, append-only migrations, `DECIMAL(14,2)` for financial numbers, atomic inventory transactions                                                                                                                | Sharding, multi-region replication                   |
| **Architecture & Security**               | Modular Monolith (Express 5 + React 19 + TypeScript + Vite + Tailwind CSS), Zod validation, Argon2 password hashing, RBAC (Customer/Staff/Admin), CSRF/HMAC security, no hardcoded credentials                                                                       | Microservices (`PROHIBITED`)                         |
| **Financial Intelligence (SellerMargin)** | Retained as future post-migration module. Implemented after full parity baseline is verified                                                                                                                                                                         | Full P&L financial suite                             |

---

## 2. Planned Product Scope (24 Business Modules Across Future Build Phases)

1. **Commerce Core (Customer-Facing):** Storefront Home, Catalog, Categories & Brands, Variants/SKUs, Spec Tables, Search/Facet Filtering, Product Compare, PC Builder, Cart, Checkout, COD & VNPay, Order Tracking, Reorder (checking current SKU/stock/price without cloning stale orders), Reviews, Wishlist, Profile/Addresses, Returns/Warranty, Notifications, AI Advisor.
2. **Store Operations (Internal Staff & Admin):** Product & SKU Management, Inventory & Stock Ledger, Suppliers & Purchase Orders, Goods Receipts, Cost History & COGS, Order Processing, Shipping Dispatch, Promotions & Coupons, Customer Management, Returns/RMA Settlement, Staff Dashboard, Banner/Content/Review Moderation, Admin User & RBAC Management, Audit Logs, System Settings.
3. **Financial Intelligence (SellerMargin):** Gross Sales, Discounts, Net Sales, COGS, Shipping Cost Variance, Payment Gateway Fees, Packaging Costs, Order Contribution Profit, Operating Expenses, Period Net Profit (backed by immutable snapshots & cost layers).

---

## 3. Explicit Exclusions (`MUST NOT` Implement)

1. **Marketplace & Multi-Vendor Features (`PERMANENTLY EXCLUDED`):**
   - **MUST NOT** implement external seller onboarding/registration, seller KYC, or multi-storefront tenancy (`vendor_id` / independent seller stores).
   - **MUST NOT** implement marketplace commission rates, seller wallets/payouts, settlement batches, or multi-vendor order splitting.
   - **MUST NOT** implement any `Seller` role (internal store employee role is strictly `Staff`). `SellerMargin` is solely the financial profitability analytics module, not a role.
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
