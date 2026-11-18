# Module Boundaries & Domain Ownership — Nexora

- **Status:** `Approved` (Direction Baseline — Only `system` Module Active in Foundation)
- **Last Updated:** `2026-11-18`
- **Scope:** Defines domain responsibilities, data ownership, and module communication boundaries for Nexora's Single-Vendor Modular Monolith.

---

## 1. Inter-Module Communication Rules (`MUST`)

1. **No Microservices (`MUST NOT`):** All backend modules run inside the single `apps/api` Express process and share one MySQL 8.4 database (`prisma/schema.prisma`) so checkout, stock deductions, and financial snapshots execute inside ACID transactions.
2. **Strict Write Ownership (`MUST`):** Each Prisma table is owned by exactly one module. External modules **MUST** invoke the owning module's TypeScript `Service` API (passing transaction context `tx` when atomic rollback is needed) instead of mutating foreign tables directly.
3. **Single-Vendor Boundary (`MUST NOT`):** Zero module may introduce external vendor/storefront multi-tenancy (`vendor_id`, seller registration, commission payout tables). `Seller` is strictly an internal staff role.
4. **Build On Demand (`MUST NOT` Scaffold Empty Modules):** Only `system` exists in Phase 1 Foundation. Remaining module directories are created strictly as their corresponding development phases begin.

---

## 2. Planned Domain Module Ownership Map (24 Business Modules -> Logical Code Boundaries)

| Module Group                      | Covered Target Capabilities                                                                                              | Owned Entities (Future Schema Phases)                                      | Allowed Dependencies                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `system` _(Active Foundation)_    | Health checks, system settings, store metadata, baseline audit hook                                                      | `StoreSetting`, foundation `AuditLog` (`prisma/schema.prisma`)             | `@nexora/shared`, `@nexora/config`                                                                          |
| `identity`                        | Identity & Auth, Users & RBAC (`Customer`, `Seller`, `Admin`), Customer Profile/Addresses, Audit logs                    | `User`, `Address`, `Session/Token`, `AuditLog`                             | `system`, `notifications`                                                                                   |
| `catalog`                         | Categories, Brands, Products, Variants & SKU, Product Specifications, Product Reviews                                    | `Category`, `Brand`, `Product`, `ProductVariant`, `Spec`, `Review`         | `identity` (review author)                                                                                  |
| `purchasing`                      | Suppliers, Purchase Orders, Goods Receipts (GRN), Landed purchase costs                                                  | `Supplier`, `PurchaseOrder`, `GoodsReceipt`                                | `catalog`, `inventory` (stock/cost intake)                                                                  |
| `inventory`                       | Stock Ledger, Cost History & COGS (`FIFO` or `MWAC` cost layers), Stock Adjustments                                      | `InventoryStock`, `InventoryMovement`, `InventoryCostLayer`                | `catalog` (SKU verification only)                                                                           |
| `promotions`                      | Coupons, Flash Sales, Flash Reservations                                                                                 | `Coupon`, `CouponUsage`, `FlashSale`, `FlashReservation`                   | `catalog`                                                                                                   |
| `cart-checkout`                   | Shopping Cart, Checkout Orchestration, Idempotency & Reorder revalidation                                                | `Cart`, `CartItem`                                                         | `catalog`, `inventory`, `promotions`, `orders`, `shipping`                                                  |
| `orders-payments`                 | Sales Orders, Immutable Order Snapshots, COD & VNPay Payments + IPN Webhook                                              | `Order`, `OrderItem` (price/discount/COGS snapshots), `PaymentTransaction` | `inventory` (reserve/commit/release), `promotions`                                                          |
| `shipping`                        | Shipping rates, Carrier assignment, Tracking milestones, Actual shipping cost                                            | `Shipment`, `ShippingRate`                                                 | `orders-payments`                                                                                           |
| `returns-warranty`                | Customer RMA Requests, Admin/Seller Return Approval, Restock/Scrap & Refund Settlement                                   | `ReturnRequest`, `ReturnItem`, `Refund`                                    | `orders-payments`, `inventory` (restock/write-off)                                                          |
| `sellermargin`                    | SellerMargin Analytics (GMV, Discounts, Net Sales, COGS, Shipping Variance, Gateway Fee, Operating Expenses, Net Profit) | `ExpenseCategory`, `Expense`, optional rollup views                        | **Reads only** immutable `orders-payments`, `shipping`, `returns-warranty`, `inventory` ledgers + `Expense` |
| `ai-advisor`                      | AI Assistant & Recommendations, PC Builder Compatibility, Product Compare                                                | `AiConversationLog`                                                        | `catalog` (read-only specs/prices), external AI provider client                                             |
| `notifications` & `admin-reports` | Email/In-App Notifications, Seller Dashboard, Business Reports, CMS Banners/News                                         | `Notification`, `Banner`, `Article`                                        | Read-only aggregations across operational modules                                                           |

_(Notice: No circular imports allowed—e.g. `inventory` MUST NEVER import `orders-payments` or `cart-checkout`.)_
