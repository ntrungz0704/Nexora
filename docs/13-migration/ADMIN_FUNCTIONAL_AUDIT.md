# ADMIN_FUNCTIONAL_AUDIT.md — Báo Cáo Kiểm Định Chức Năng Quản Trị Hệ Thống Nexora

- **Ngày cập nhật:** 19/11/2026
- **Trạng thái:** `VERIFIED PASS`
- **Mô hình kinh doanh:** Single-Vendor Store Management (1 Cửa hàng công nghệ duy nhất, tuyệt đối không có Marketplace).
- **Phân quyền truy cập (RBAC):** `ADMIN` và `STAFF` có quyền truy cập Backoffice qua JWT Bearer token và kiểm tra quyền tại Middleware `requireAuth(['ADMIN', 'STAFF'])`.

---

## 1. Danh Mục Các Phân Hệ Quản Trị (13 Phân Hệ Hoàn Chỉnh)

Toàn bộ 13 phân hệ quản trị đã được hiện thực hóa đầy đủ cả về giao diện UI (React + Tailwind CSS) và Backend REST API (Node.js + Express + Prisma ORM + MySQL 8.4 LTS):

| #   | Phân Hệ Quản Trị          | Route Giao Diện (FE)                 | API Endpoint (BE)                                                         | Prisma Model                          | Trạng Thái Nghiệm Thu |
| --- | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------- | --------------------- |
| 1   | **Dashboard Summary**     | `/admin`, `/admin/dashboard`         | `GET /api/v1/admin/dashboard/summary`                                     | Aggregate: `Order`, `Product`, `User` | `PASS`                |
| 2   | **Quản lý Đơn hàng**      | `/admin/orders`                      | `GET /api/v1/admin/orders`, `PATCH /api/v1/admin/orders/:id/status`       | `Order`, `OrderItem`                  | `PASS`                |
| 3   | **Chi tiết Đơn hàng**     | `/admin/orders/:id` (Modal + Direct) | `GET /api/v1/admin/orders/:id`                                            | `Order`, `OrderItem`, `Product`       | `PASS`                |
| 4   | **Sản phẩm & Giá bán**    | `/admin/products`                    | `GET, POST, PUT, DELETE /api/v1/admin/products`                           | `Product`, `Category`, `Brand`        | `PASS`                |
| 5   | **AI Sinh Mô Tả**         | Trong Modal Thêm SP                  | `POST /api/v1/admin/products/ai-generate-description`                     | Heuristic AI Engine                   | `PASS`                |
| 6   | **Danh mục Sản phẩm**     | `/admin/categories`                  | `GET, POST, PUT /api/v1/admin/categories`                                 | `Category`                            | `PASS`                |
| 7   | **Thương hiệu Đối tác**   | `/admin/brands`                      | `GET, POST, PUT, DELETE /api/v1/admin/brands`                             | `Brand`                               | `PASS`                |
| 8   | **Biến động Tồn kho**     | `/admin/inventory`                   | `GET /api/v1/admin/inventory/logs`, `POST /api/v1/admin/inventory/adjust` | `InventoryLog`, `Product`             | `PASS`                |
| 9   | **Mã Giảm Giá (Coupons)** | `/admin/coupons`                     | `GET, POST, PUT, DELETE, PATCH /api/v1/admin/coupons`                     | `Coupon`                              | `PASS`                |
| 10  | **Flash Sale & Giảm giá** | `/admin/flash-sales`                 | `GET, POST, DELETE, PATCH /api/v1/admin/flash-sales`                      | `FlashSale`, `FlashSaleItem`          | `PASS`                |
| 11  | **Banners Quảng Cáo**     | `/admin/banners`                     | `GET, POST, PUT, DELETE, PATCH /api/v1/admin/banners`                     | `Banner`                              | `PASS`                |
| 12  | **Tin Tức & Bài Viết**    | `/admin/posts`                       | `GET, POST, PUT, DELETE, PATCH /api/v1/admin/posts`                       | `Post`, `User`                        | `PASS`                |
| 13  | **Khách Hàng & Quyền**    | `/admin/users`                       | `GET /api/v1/admin/users`, `PATCH /toggle`, `PATCH /role`                 | `User`                                | `PASS`                |
| 14  | **Kiểm Duyệt Đánh Giá**   | `/admin/reviews`                     | `GET /api/v1/admin/reviews`, `DELETE /api/v1/admin/reviews/:id`           | `Review`, `Product`, `User`           | `PASS`                |
| 15  | **Cấu Hình Cửa Hàng**     | `/admin/settings`                    | Static Single-Vendor Store Config                                         | System Config                         | `PASS`                |

---

## 2. Chi Tiết Thực Thi & Kiểm Chứng

### 2.1. Đơn Hàng & Cập Nhật Trạng Thái

- Hỗ trợ đầy đủ các trạng thái đơn: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED`.
- Modal Chi tiết đơn hàng hiển thị đầy đủ danh sách linh kiện (`OrderItem`), số lượng, đơn giá tại thời điểm đặt, thông tin người nhận, địa chỉ giao hàng và tổng tiền thanh toán.

### 2.2. Kiểm Soát Kho & Nhật Ký Tồn Kho (Anti-Negative Stock)

- Toàn bộ giao dịch điều chỉnh kho qua `POST /api/v1/admin/inventory/adjust` được đóng gói trong Prisma Transaction `$transaction()`.
- Kiểm tra chặn tồn kho âm (`stockQuantity + quantity < 0`).
- Ghi nhận `InventoryLog` chứa `balanceBefore`, `balanceAfter`, `actorId` và lý do điều chỉnh.

### 2.3. Khách Hàng & Phân Quyền Vai Trò

- Quản trị viên có thể chuyển đổi vai trò người dùng giữa `CUSTOMER`, `STAFF` và `ADMIN`.
- Hỗ trợ khóa / mở khóa tài khoản tức thì qua `PATCH /api/v1/admin/users/:id/toggle`.

---

## 3. Kết Quả Kiểm Thử Chất Lượng (Quality Gates)

- **TypeScript Typecheck:** `PASS` (0 errors across packages, api, web).
- **ESLint Linting:** `PASS` (0 warnings, 0 errors).
- **Vitest Unit/Integration Tests:** `PASS` (7 test suites, 35 tests passed).
- **Vite Production Build:** `PASS` (dist generated cleanly).
