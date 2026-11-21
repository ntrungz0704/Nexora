# 15. Admin System Documentation (Single-Vendor Backoffice)

- **Giao diện:** `apps/web/src/features/admin/AdminDashboardPage.tsx` (5.924 dòng — sử dụng Tailwind CSS 4 chủ đạo, hỗ trợ Light/Dark mode, phân trang 10 mục/trang trên các bảng chính).
- **Backend:** `apps/api/src/modules/admin/` (`admin.routes.ts`, `admin.controller.ts`, `admin.service.ts` — 1.002 dòng, **44 endpoints**).
- **Bảo mật tuyến:** Toàn bộ `/api/v1/admin/*` bảo vệ bằng `requireAuth(['ADMIN', 'STAFF'])`. _(Xem cảnh báo P0 SEC-01 về việc `STAFF` gọi được `PATCH /users/:id/role` tại tài liệu 11)._

## Ma trận CRUD thực tế các phân hệ Admin

| Phân hệ Admin          | Route FE                           | Create (API)                | Read (API)                   | Update (API)               | Delete / Toggle (API)     | Đánh giá thực tế                                                   |
| ---------------------- | ---------------------------------- | --------------------------- | ---------------------------- | -------------------------- | ------------------------- | ------------------------------------------------------------------ |
| **Dashboard Overview** | `/admin`, `/admin/dashboard`       | N/A                         | `GET /dashboard/summary`     | N/A                        | N/A                       | **COMPLETE** (KPI, doanh thu 7 ngày, donut đơn hàng, sắp hết hàng) |
| **Products**           | `/admin/products`                  | `POST /products` + AI desc  | `GET /products`              | `PUT /products/:id`        | `DELETE /products/:id`    | **COMPLETE**                                                       |
| **Inventory & Logs**   | `/admin/inventory`                 | `POST /inventory/adjust`    | `GET /inventory/logs`        | Atomic adjust              | N/A (immutable log)       | **COMPLETE** (7 lý do nhập/xuất, chặn tồn kho âm)                  |
| **Orders**             | `/admin/orders`, `/:id`            | Storefront checkout         | `GET /orders`, `/orders/:id` | `PATCH /orders/:id/status` | Cancel + auto-restock     | **COMPLETE** (chặn xác nhận đơn VNPay chưa PAID)                   |
| **Categories**         | `/admin/categories`                | `POST /categories` + AI gen | `GET /categories`            | `PUT /categories/:id`      | **CHƯA CÓ `DELETE`**      | **PARTIAL**                                                        |
| **Brands**             | `/admin/brands`                    | `POST /brands`              | `GET /brands`                | `PUT /brands/:id`          | `DELETE /brands/:id`      | **COMPLETE**                                                       |
| **Coupons**            | `/admin/coupons`                   | `POST /coupons`             | `GET /coupons`               | `PUT /coupons/:id`         | `DELETE`, `PATCH /toggle` | **COMPLETE**                                                       |
| **Flash Sales**        | `/admin/flash-sales`               | `POST /flash-sales`         | `GET /flash-sales`           | `PUT /flash-sales/:id`     | `DELETE`, `PATCH /toggle` | **COMPLETE**                                                       |
| **Banners**            | `/admin/banners`                   | `POST /banners`             | `GET /banners`               | `PUT /banners/:id`         | `DELETE`, `PATCH /toggle` | **COMPLETE** (đồng bộ trực tiếp Storefront)                        |
| **Posts / News**       | `/admin/posts`                     | `POST /posts`               | `GET /posts`                 | `PUT /posts/:id`           | `DELETE`, `PATCH /toggle` | **COMPLETE**                                                       |
| **Users & Roles**      | `/admin/users`                     | Register                    | `GET /users`                 | `PATCH /users/:id/role`    | `PATCH /users/:id/toggle` | **COMPLETE (CẦN FIX RBAC P0)**                                     |
| **Reviews**            | `/admin/reviews`                   | **Chưa có FE/API submit**   | `GET /reviews`               | N/A                        | `DELETE /reviews/:id`     | **PARTIAL** (chỉ xem & xóa moderation)                             |
| **Settings & Stores**  | `/admin/settings`, `/admin/stores` | **KHÔNG CÓ API**            | **KHÔNG CÓ API**             | **KHÔNG CÓ API**           | **KHÔNG CÓ API**          | **UI PLACEHOLDER / GAP**                                           |
| **AI & Audit Logs UI** | _(Chưa có tab riêng)_              | N/A                         | **KHÔNG CÓ API**             | N/A                        | N/A                       | **DB CÓ BẢNG, CHƯA CÓ UI/API**                                     |

## Khuyến nghị kiến trúc cho Admin

- **Tách nhỏ `AdminDashboardPage.tsx` (5.924 dòng):** Hiện toàn bộ 11+ tab và tất cả modal nằm trong một component khổng lồ gây khó bảo trì và phình bundle chính. Nên tách thành các module lazy-loaded (`React.lazy`) theo từng tab (`ProductsTab`, `OrdersTab`, `InventoryTab`, `CouponsTab`, ...).
