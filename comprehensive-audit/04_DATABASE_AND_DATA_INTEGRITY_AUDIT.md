# NEXORA — DATABASE & DATA INTEGRITY AUDIT
**Document Version:** 1.0.0  
**Audit Scope:** MySQL 8.4 LTS, Prisma ORM, Migrations, Constraints, and Data Quality (Stage 2)  
**Date:** 2026-11-23  
**Auditor:** Database Architect & Senior Technical Auditor  
**Workspace Root:** `D:\Nexora`  
**Database Engine:** MySQL 8.4 LTS (InnoDB Engine, utf8mb4)  
**ORM:** Prisma Client 6.4  

---

## 1. Database Schema & Model Inventory

The database contains **20 Relational Models** mapped to MySQL tables with strict foreign keys, unique constraints, and composite indexes:

| Table Name (`@@map`) | Prisma Model | Purpose | Primary Keys & Constraints |
|---|---|---|---|
| `users` | `User` | Customer, Staff, and Admin credentials | `id` (PK, AUTO_INCREMENT), `email` (UNIQUE) |
| `customer_addresses` | `CustomerAddress` | M2/M6.2 Customer Address Book (Full CRUD) | `id` (PK), `userId` (FK $\rightarrow$ `users.id`, CASCADE), `isDefault` |
| `notifications` | `Notification` | System and order status alerts | `id` (PK), `userId` (FK $\rightarrow$ `users.id`, CASCADE), `isRead` |
| `categories` | `Category` | Hardware categories (21 primary + legacy aliases) | `id` (PK), `slug` (UNIQUE), `parentId` (Self-FK) |
| `brands` | `Brand` | Hardware manufacturers (ASUS, MSI, Acer, etc.) | `id` (PK), `slug` (UNIQUE) |
| `products` | `Product` | Hardware catalog (674 products total) | `id` (PK), `sku` (UNIQUE), `slug` (UNIQUE), `categoryId`, `brandId` |
| `product_images` | `ProductImage` | Multi-image product gallery | `id` (PK), `productId` (FK $\rightarrow$ `products.id`, CASCADE) |
| `product_reviews` | `ProductReview` | M4 Verified purchase customer reviews | `id` (PK), `@@unique([productId, userId])`, `status` |
| `carts` | `Cart` | Customer and Guest active shopping carts | `id` (PK), `userId` (UNIQUE FK), `guestSessionId` (UNIQUE INDEX) |
| `cart_items` | `CartItem` | Items in carts | `id` (PK), `@@unique([cartId, productId])` |
| `orders` | `Order` | Customer purchase orders | `id` (PK), `orderCode` (UNIQUE), `userId` (FK), `paymentStatus`, `fulfillmentStatus` |
| `order_items` | `OrderItem` | Snapshot line items at purchase time | `id` (PK), `orderId` (FK), `productId` (FK), `price`, `salePrice` |
| `order_returns` | `OrderReturn` | M5 4-step state machine return requests | `id` (PK), `returnCode` (UNIQUE), `orderId` (FK), `status` |
| `order_return_items` | `OrderReturnItem` | Line items requested for return | `id` (PK), `returnId` (FK), `orderItemId` (FK), `quantity` |
| `order_return_audits` | `OrderReturnAudit` | Immutable audit trail for return state changes | `id` (PK), `returnId` (FK), `fromStatus`, `toStatus`, `changedBy` |
| `inventory_logs` | `InventoryLog` | Audit log for stock changes (7 reasons) | `id` (PK), `productId` (FK), `type` (IMPORT/EXPORT/etc.), `changeAmount` |
| `coupons` | `Coupon` | Discount promotional codes | `id` (PK), `code` (UNIQUE), `discountType`, `discountValue`, `validUntil` |
| `coupon_usages` | `CouponUsage` | Coupon redemption tracking | `id` (PK), `couponId` (FK), `userId` (FK), `orderId` (FK) |
| `wishlists` | `WishlistItem` | Customer saved hardware items | `id` (PK), `@@unique([userId, productId])` |
| `posts` | `Post` | Technology news and hardware reviews | `id` (PK), `slug` (UNIQUE), `authorId` (FK $\rightarrow$ `users.id`) |

---

## 2. Migration Integrity & Append-Only History

Inspected `prisma/migrations/`:
- **Total Migrations:** 8 versioned migrations:
  1. `20261118025217_init_mysql` — Initial database tables and indexes.
  2. `20261118074600_add_customer_profile_tables` — M2 Profile, Address Book, and Notifications.
  3. `20261118123000_add_guest_cart_merge` — M3 Guest cart session and indexes.
  4. `20261118170000_add_customer_reviews` — M4 Verified reviews with composite unique key.
  5. `20261119020000_add_returns_and_admin_crud` — M5 Returns state machine, return items, audit trail.
  6. `20261119053000_add_delivered_at_to_orders` — M5 Explicit `delivered_at` for 7-day return eligibility.
  7. `20261120000000_add_posts_and_content` — Tech news posts and content tables.
  8. `20261120120000_add_inventory_logs` — Detailed inventory audit logging.
- **Migration Policy Verification:**
  - `0 modified migrations`: No historical migrations were edited or deleted.
  - `0 destructive operations`: No table drops, no column truncations.
  - All migrations are strictly **append-only**.

---

## 3. Data Integrity & Verification Findings

### 3.1. Current Record Counts in MySQL 8.4
- **Products:** 674 active products (651 imported from TechPilot + 23 baseline test products).
- **Categories:** 36 categories (21 primary TechPilot categories with 31 products each + 15 legacy aliases).
- **Brands:** 31 brands (ASUS, MSI, Acer, Canon, Epson, Dell, HP, Corsair, Logitech, Gigabyte, etc.).
- **Product Images:** 523 images.
- **Tech News Posts:** 8 distinct articles with unique cover images.
- **Duplicate SKU Check:** `SELECT sku, COUNT(*) FROM products GROUP BY sku HAVING COUNT(*) > 1` $\rightarrow$ **0 duplicates**.
- **Duplicate Slugs Check:** `SELECT slug, COUNT(*) FROM products GROUP BY slug HAVING COUNT(*) > 1` $\rightarrow$ **0 duplicates**.
- **Foreign Key Integrity:** `0 orphan records` across `order_items`, `cart_items`, `product_images`, `product_reviews`.

### 3.2. Financial Precision (Decimal Verification)
- All price columns are declared as `Decimal` in Prisma and `DECIMAL(12, 2)` / `DECIMAL(10, 2)` in MySQL DDL.
- Floating-point arithmetic inaccuracies are completely prevented at the schema level.

---

## 4. Query Performance & Indexing Assessment

- **Indexed Foreign Keys:** Every foreign key column (`userId`, `productId`, `orderId`, `categoryId`, `brandId`) has an explicit index (`@@index`).
- **Composite Indexes:**
  - `@@unique([productId, userId])` on `product_reviews`: Prevents duplicate customer reviews at the database engine level (P2002 handled gracefully in M4).
  - `@@unique([cartId, productId])` on `cart_items`: Guarantees no duplicate line items per cart.
  - `@@unique([userId, productId])` on `wishlists`: Guarantees idempotent wishlist additions.
- **N+1 Query Guard:** Services utilize Prisma `include: { category: true, brand: true, images: true }` with eager-loading and `findUniqueOrThrow`, avoiding N+1 roundtrips.
