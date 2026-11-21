# 10. Database Data, Migrations & Live Runtime Verification

- **Trạng thái xác minh Runtime MySQL:** **VERIFIED AT RUNTIME (Read-Only Queries Only)** lúc `2026-11-21T18:06:20.901Z`.
- **Server Info:** MySQL `8.4.13` | Charset: `utf8mb4` | Collation: `utf8mb4_unicode_ci` | Isolation: `REPEATABLE-READ` | Timezone: `SYSTEM`.
- **Prisma CLI Validation:**
  - `npx prisma validate`: **PASS** (`The schema at prisma\schema.prisma is valid`)
  - `npx prisma migrate status`: **PASS** (`4 migrations found in prisma/migrations — Database schema is up to date!`)

---

## 1. Migration Audit (Append-Only History)

|   # | Migration Folder                                        | SQL Lines |    Size | Tables Created                                                                                                                                                                         | Tables Altered | Destructive Ops | Runtime Status                     |
| --: | ------------------------------------------------------- | --------: | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------- | ---------------------------------- |
|   1 | `20261118162807_init_foundation`                        |        46 |  1.7 KB | `users`, `store_settings`, `audit_logs`                                                                                                                                                | 1 tables       | None            | APPLIED (2026-11-18T16:28:15.076Z) |
|   2 | `20261118175000_rename_user_role_seller_to_staff`       |        22 |  0.8 KB | _None_                                                                                                                                                                                 | 1 tables       | None            | APPLIED (2026-11-18T18:02:20.866Z) |
|   3 | `20261119044649_init_storefront_and_catalog`            |       206 |  8.3 KB | `customer_addresses`, `brands`, `categories`, `products`, `product_images`, `banners`, `carts`, `cart_items`, `wishlists`, `reviews`                                                   | 9 tables       | None            | APPLIED (2026-11-19T04:48:25.994Z) |
|   4 | `20261119070000_add_orders_coupons_inventory_ai_models` |       249 | 10.4 KB | `orders`, `order_items`, `coupons`, `flash_sales`, `flash_sale_items`, `inventory_logs`, `posts`, `notifications`, `return_requests`, `ai_assistant_logs`, `product_ai_chat_histories` | 8 tables       | None            | APPLIED (2026-11-19T06:33:58.099Z) |

- **Đánh giá:** 4/4 migration đã áp dụng sạch, không có schema drift, không có thao tác drop bảng phá hủy, tuân thủ chính sách append-only.

---

## 2. Live MySQL Table Inventory & Exact Record Counts (25 Tables)

| Table Name                  | Exact Rows | Engine | Collation          | Data Length | Index Length |
| --------------------------- | ---------: | ------ | ------------------ | ----------: | -----------: |
| `_prisma_migrations`        |      **4** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |       0.0 KB |
| `ai_assistant_logs`         |     **66** | InnoDB | utf8mb4_unicode_ci |     48.0 KB |      32.0 KB |
| `audit_logs`                |      **9** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      48.0 KB |
| `banners`                   |      **9** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      16.0 KB |
| `brands`                    |     **30** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `cart_items`                |      **5** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `carts`                     |     **80** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `categories`                |     **21** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      48.0 KB |
| `coupons`                   |      **6** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `customer_addresses`        |      **2** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      16.0 KB |
| `flash_sale_items`          |      **5** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `flash_sales`               |      **1** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      16.0 KB |
| `inventory_logs`            |     **14** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `notifications`             |      **9** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      16.0 KB |
| `order_items`               |     **10** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `orders`                    |     **10** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      64.0 KB |
| `posts`                     |      **7** | InnoDB | utf8mb4_unicode_ci |     48.0 KB |      64.0 KB |
| `product_ai_chat_histories` |      **0** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      16.0 KB |
| `product_images`            |  **2,604** | InnoDB | utf8mb4_unicode_ci |    464.0 KB |      96.0 KB |
| `products`                  |    **651** | InnoDB | utf8mb4_unicode_ci |   1552.0 KB |     160.0 KB |
| `return_requests`           |      **0** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `reviews`                   |      **6** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `store_settings`            |      **6** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      16.0 KB |
| `users`                     |      **6** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |
| `wishlists`                 |      **0** | InnoDB | utf8mb4_unicode_ci |     16.0 KB |      32.0 KB |

---

## 3. Kiểm tra toàn vẹn dữ liệu thực tế (Read-Only Data Integrity Checks)

| Tiêu chí toàn vẹn                                     | Kết quả thực tế | Trạng thái |
| ----------------------------------------------------- | --------------: | ---------- |
| Sản phẩm có tồn kho âm (`stock_quantity < 0`)         |           **0** | **PASS**   |
| Email người dùng trùng lặp                            |           **0** | **PASS**   |
| Product `slug` trùng lặp                              |           **0** | **PASS**   |
| Product `sku` trùng lặp                               |           **0** | **PASS**   |
| Bản ghi `order_items` mồ côi (không có `orders`)      |           **0** | **PASS**   |
| Bản ghi `cart_items` mồ côi (không có `carts`)        |           **0** | **PASS**   |
| Sản phẩm thiếu thông số (`specs IS NULL`)             |     **0** / 651 | **PASS**   |
| Tổng ràng buộc Foreign Key đang thực thi trong InnoDB |      **25 FKs** | **PASS**   |

---

## 4. Seed Script Audit (`prisma/seed.ts`, 1.502 dòng)

- Sử dụng `upsert` an toàn cho `users`, `categories`, `brands`, `products`, `coupons`, `store_settings`.
- **Bảo vệ mật khẩu Admin khi re-seed:** Trong nhánh `update` của `prisma.user.upsert`, trường `passwordHash` được cố tình loại trừ để không ghi đè mật khẩu quản trị viên đã đổi (đã xác minh bởi test `SEED-1`).
- **Môi trường Production:** `seed.ts` bắt buộc `ADMIN_INITIAL_PASSWORD` hoặc `ADMIN_INITIAL_PASSWORD_HASH` và từ chối chạy với hash dev mặc định.
- **Lưu ý dữ liệu hiện tại trong DB (Branding & Hygiene):**
  - **Orders:** 10 đơn hàng — **10 mã `NX-`**, **0 mã `TP-`** (100% đã chuẩn hóa sang `NX-`).
  - **Users (6 tài khoản, không hiển thị mật khẩu/hash):** `#1 admin@nexora.vn (ADMIN, Quản Trị Viên Nexora)`; `#2 dev@nexora.vn (CUSTOMER, Khách Hàng Nexora)`; `#991 admin@nexora.local (ADMIN, Quản Trị Viên Nexora (Re-seeded))`; `#992 staff@nexora.local (STAFF, Kỹ Thuật Viên Nexora)`; `#993 customer@nexora.local (CUSTOMER, Nguyễn Văn An)`; `#1019 admin@techpilot.vn (ADMIN, Quản Trị Viên Nexora (Legacy Login))`. _(Lưu ý: vẫn giữ tài khoản legacy `admin@techpilot.vn` để tương thích đăng nhập cũ; nên cân nhắc vô hiệu hóa trước khi go-live production)._
  - **Coupons (6 mã):** `TECHPILOT100` (FIXED 100000, min 500000, used 39); `GIAM5PHANTRAM` (PERCENTAGE 5, min 5000000, used 0); `TECHPILOT999` (FIXED 999999, min 20000000, used 0); `NEXORA100` (FIXED 100000, min 500000, used 0); `NEXORA999` (FIXED 999999, min 20000000, used 0); `NEXORA10` (PERCENTAGE 10, min 2000000, used 0). _(Gồm 3 mã Nexora chính thức + `GIAM5PHANTRAM` + 2 mã alias `TECHPILOT100`, `TECHPILOT999` đang active — xem xét ẩn khỏi danh sách hiển thị public nếu muốn bỏ hoàn toàn tên TechPilot)._
  - **Store Settings:** `store.business_model=single-vendor`; `store.currency=VND`; `store.email=hotro@nexora.vn`; `store.hotline=1800 2097`; `store.name=Nexora Tech Store`; `store.support_email=support@nexora.vn`.
