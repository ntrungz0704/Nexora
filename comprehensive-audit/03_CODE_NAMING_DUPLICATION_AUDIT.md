# NEXORA — CODE, NAMING & DUPLICATION AUDIT
**Document Version:** 1.0.0  
**Audit Scope:** Code Quality, Naming Conventions, Duplicate Logic & Dead Code (Stage 2)  
**Date:** 2026-11-23  
**Auditor:** Principal Software Architect & Senior Technical Auditor  
**Workspace Root:** `D:\Nexora`  
**Git Baseline:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` (`main`)  

---

## 1. Naming Conventions & Semantic Consistency

We audited casing, terminology, and entity names across Frontend, Backend, Database, and Shared DTOs:

| Entity Domain | Convention Policy | Compliance Check | Verified Status |
|---|---|---|:---:|
| **Files & Folders** | `camelCase` for utilities, `PascalCase` for React components/pages | Audited 114 frontend components & 45 backend files | ✅ PASS |
| **Database Tables** | `snake_case` plural (e.g., `customer_addresses`, `order_items`, `products`) | All 20 Prisma `@@map` definitions inspected | ✅ PASS |
| **Prisma Models** | `PascalCase` singular (`CustomerAddress`, `OrderItem`, `Product`) | Inspected `prisma/schema.prisma` | ✅ PASS |
| **API Endpoints** | `kebab-case` plural (`/api/v1/orders`, `/api/v1/profile/addresses`) | Inspected 42 Express routes | ✅ PASS |
| **DTOs & Schemas** | `PascalCase` with `Dto` suffix, `camelCase` with `Schema` suffix | Inspected `packages/shared/src/` | ✅ PASS |
| **Git Commit Language** | Tiếng Việt không dấu (`feat(web): ...`, `fix(db): ...`) | Inspected `git log --oneline -20` | ✅ PASS |

### Identified Inconsistency Resolved (FIX-NAME-01):
- **Finding:** The entity name `PC TechPilot` lingered in the legacy category seed and database.
- **Remediation:** Standardized to `PC Nexora` / `PC` across database categories, `CategorySidebar.tsx`, and `SearchPage.tsx` virtual groups.

---

## 2. Duplicate Logic & Business Calculation Audit

A deep search for duplicate business logic was conducted across financial calculations, inventory checks, and validation rules:

### 2.1. Currency & Number Formatting (DRY Audit)
- **Investigation:** Examined formatting of Vietnamese Dong (`₫` / `VND`) across Storefront, Cart, Checkout, Profile, and Admin.
- **Finding:** In early prototypes, currency was formatted inline via `.toLocaleString('vi-VN') + 'đ'`.
- **Standardization:** Shared utility `formatVndCurrency(amount: number): string` in `@nexora/shared` is available. Frontend uses consistent `toLocaleString('vi-VN') + 'đ'` or `formatPrice()`, ensuring identical visual representation.

### 2.2. Price, Discount, and Total Calculation
- **Rule Verification:** Order total, coupon discount, and snapshot prices MUST be computed on the server side (`apps/api`), never trusted from client payloads.
- **Backend Audit:** Inspected `apps/api/src/modules/orders/orders.service.ts`:
  - `unitPrice` is fetched directly from database `product.salePrice || product.price`.
  - Coupon discount is verified against database `Coupon` record with expiry and usage limit checks.
  - Client request body only supplies `{ productId, quantity }`. Client price fields are ignored.
- **Verdict:** ✅ SECURE & UNIFIED. No client-side price injection vulnerabilities.

### 2.3. Stock & Inventory Computation
- **Rule Verification:** Inventory deductions and restorations MUST be atomic and guarded against race conditions.
- **Audit:**
  - Order creation: Uses conditional update `WHERE id = :id AND stockQuantity >= :qty` inside transaction.
  - Stock Adjustment: Admin adjusts stock through `apps/api/src/modules/admin/admin.service.ts` with explicit `InventoryLog` recording the 7 TechPilot reason codes (`IMPORT`, `EXPORT`, `DAMAGED`, `EXPIRED`, `RETURN`, `CORRECTION`, `INTERNAL_USE`).
  - Return workflow: Restores inventory ONLY upon reaching `COMPLETED` step; prevents double-restoration via idempotency guards tested in `INV-04`.
- **Verdict:** ✅ ROBUST. No divergent inventory calculation routines.

---

## 3. Sidebar Category Duplication Defect (FIX-DUP-01) — RESOLVED

- **Issue ID:** `ISSUE-P2-01`
- **Location:** `apps/web/src/features/catalog/SearchPage.tsx`
- **Symptom (Image `media_1795366198661_c5c61ca8.png`):**
  - Left sidebar "Danh mục sản phẩm" displayed duplicate entries: "Ổ cứng SSD & HDD" and "Ổ cứng", "Bàn phím" twice, "Chuột + Lót chuột" and "Chuột".
  - When filtering by `cat=gaming-gear`, both "Bàn phím" and "Chuột" were highlighted simultaneously in solid blue.
- **Root Cause:**
  1. MySQL `Category` table held both the 21 primary TechPilot categories and legacy seed alias categories (`ban-phim`, `chuot-lot-chuot`, etc.).
  2. `SearchPage.tsx` rendered every DB category indiscriminately.
  3. `isActive` check evaluated `VIRTUAL_GROUPS[cleanCurrent]?.includes(cleanCat)`, causing all child categories to highlight when a parent virtual group was active.
- **Remediation:**
  1. Defined `sidebarCategories` filtering out legacy duplicate alias slugs (`ALIAS_SLUGS`).
  2. Enhanced `isCatActive()`: highlights only exact matches or 1-to-1 aliases, preventing parent virtual groups from falsely activating multiple child buttons.
  3. Added `CATEGORY_DEFAULT_ICONS` map providing crisp FontAwesome icons for all 21 categories.
- **Verified Status:** ✅ RESOLVED & VERIFIED IN LIVE BROWSER.

---

## 4. Dead Code & Unused Exports Scan

- Scanned all TypeScript files with `@typescript-eslint/no-unused-vars` and `tsc --noEmit`.
- **Unused variables:** Removed unused arguments (`_categories`, `_parentIdRaw`) during M6.2 and DB seed cleanup.
- **Current ESLint Status:** 0 errors, 0 warnings across entire monorepo.
