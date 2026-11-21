# 07. Complete Business Logic & Workflows Audit

Tài liệu này mô tả chi tiết cách hệ thống Nexora vận hành thực tế từ đầu đến cuối theo mã nguồn hiện tại.

---

## 1. Xác thực & Đặt lại mật khẩu (Authentication & Password Reset)

1. **Business Objective:** Đăng ký khách hàng, đăng nhập đa vai trò (Customer/Staff/Admin) và khôi phục mật khẩu an toàn không rò rỉ token.
2. **Actors:** Guest, Customer, Staff, Admin.
3. **Preconditions:** Email hợp lệ, mật khẩu $\ge 8$ ký tự khi reset.
4. **Input:** `{ email, password }`, `{ fullName, email, password, phone? }`, `{ token, newPassword }`.
5. **Validation:** Kiểm tra trùng email (`409 EMAIL_EXISTS`), trạng thái `ACTIVE` (`403 ACCOUNT_INACTIVE`), mật khẩu bcrypt (`10 rounds`).
6. **Processing Steps:** Tạo JWT HS256 (hạn 7 ngày) với payload `{ sub, email, role }`. Khi quên mật khẩu, ký JWT reset hạn 15 phút chứa `purpose: 'password_reset'` và `hashSig = passwordHash.slice(-16)`; gửi qua Nodemailer. Khi reset, cập nhật điều kiện bằng `updateMany({ where: { id, passwordHash: currentHash } })` để chỉ 1 request duy nhất thành công khi chạy đồng thời.
7. **Database Operations:** `users` (SELECT/INSERT/UPDATE), `carts` (INSERT giỏ rỗng khi register).
8. **State Transitions:** `User.status`: `ACTIVE` ↔ `INACTIVE` (qua Admin).
9. **Output:** `{ user, token }` hoặc generic message `{ message }`.
10. **Error Cases:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_INACTIVE`, `409 EMAIL_EXISTS`, `500 EMAIL_DELIVERY_FAILED`, `400 EXPIRED_OR_INVALID_TOKEN`.
11. **Permissions:** Public cho login/register/forgot/reset; `requireAuth()` cho `GET /auth/me`.
12. **Related API:** `/api/v1/auth/*`.
13. **Related FE Components:** `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `AuthModal.tsx`.
14. **Related DB Tables:** `users`, `carts`.
15. **Related Source Files:** `apps/api/src/modules/auth/*`, `apps/api/src/modules/email/email.service.ts`.
16. **Test Coverage:** `auth_password_reset_security.test.ts` (8 tests), `seed_and_auth_credentials.test.ts` (2 tests), `rbac_and_concurrency.test.ts`.

---

## 2. Duyệt danh mục, Tìm kiếm & Lọc sản phẩm (Catalog & Search)

1. **Business Objective:** Hiển thị 651 sản phẩm phần cứng, lọc theo danh mục (hỗ trợ nhóm alias như `gaming-gear`, `linh-kien-pc`), thương hiệu, khoảng giá, từ khóa, thông số kỹ thuật (`ram`, `cpu`, `vga`, `storage`, `screen`) và sắp xếp.
2. **Actors:** Tất cả người dùng.
3. **Processing Steps:** `CatalogRepository` chuẩn hóa slug danh mục, lọc `status = 'ACTIVE'`, trả về phân trang `{ products, meta: { total, page, limit, totalPages } }`. Tại FE `ProductCard.tsx`, hàm `extractProductPills()` ưu tiên 5 thông số cốt lõi (CPU → RAM → SSD → GPU → Display) đảm bảo đồng đều giao diện.
4. **Related API:** `GET /api/v1/catalog/products`, `/categories`, `/brands`, `/banners`, `/products/:slug`, `/products/featured`, `/products/flash-sale`.
5. **Related DB Tables:** `products`, `product_images`, `categories`, `brands`, `banners`, `flash_sales`, `flash_sale_items`.
6. **Test Coverage:** `storefront.integration.test.ts` (7 tests).

---

## 3. Giỏ hàng & Wishlist (Cart & Wishlist Isolation)

1. **Business Objective:** Cho phép khách vãng lai lưu giỏ hàng qua header `x-guest-session-id` và khách đăng nhập lưu theo `userId`. Wishlist bắt buộc đăng nhập và cô lập tuyệt đối theo `userId`.
2. **Processing Steps:** `CartService` tìm/tạo `Cart` theo `userId` hoặc `guestSessionId`, upsert `CartItem`, tính `subtotal` và `totalItems` trực tiếp từ `salePrice || price` mới nhất trong DB. `WishlistService` luôn lọc theo `req.user.sub`, khách A không thể xem/xóa wishlist khách B.
3. **Gap ghi nhận:** Chưa có luồng tự động merge giỏ hàng `guestSessionId` vào `userId` sau khi đăng nhập.
4. **Test Coverage:** `commerce_and_ai.integration.test.ts` (wishlist isolation tests), `storefront.integration.test.ts`.

---

## 4. Đặt hàng, Mã giảm giá, Thanh toán COD/VNPay & Kho nguyên tử

1. **Business Objective:** Tạo đơn hàng snapshot giá/SKU, áp dụng coupon hợp lệ, trừ kho chống overselling (race condition), xử lý COD hoặc VNPay HMAC-SHA512 idempotent.
2. **Business Rules xác minh từ `order.service.ts`:**
   - **Giá đơn hàng:** Tính hoàn toàn trên server từ `Number(prod.salePrice || prod.price)`.
   - **Phí vận chuyển:** Miễn phí nếu `subtotal >= 500,000đ`, ngược lại `30,000đ`. _(Phát hiện sai lệch copy: Topbar ghi "Miễn phí cho đơn từ 300K" trong khi backend/CartPage áp ngưỡng 500.000đ)._
   - **Coupon:** Kiểm tra `isActive`, `expiresAt > now`, `subtotal >= minOrderValue`, `usageCount < usageLimit`. Tính `PERCENTAGE` (có trần `maxDiscount`) hoặc `FIXED`. _(Phát hiện edge-case: `usageLimit` kiểm tra ngoài transaction, chưa dùng conditional update)._
   - **Chống overselling & Deadlock:** Sắp xếp `rawItems` theo `productId` tăng dần trước khi chạy `tx.product.updateMany({ where: { id, stockQuantity: { gte: qty } }, data: { stockQuantity: { decrement: qty } } })`. Nếu `count === 0` → rollback toàn bộ transaction và trả `400 INSUFFICIENT_STOCK`.
   - **Lịch sử kho:** Mỗi lần bán hoặc hủy đơn đều ghi bản ghi `InventoryLog` (`SALE` / `RETURN`) kèm `balanceBefore`, `balanceAfter`, `referenceId: orderCode`.
   - **Quy tắc chuyển trạng thái VNPay:** Admin không thể chuyển đơn VNPay sang `CONFIRMED / PROCESSING / SHIPPING / DELIVERED` nếu `paymentStatus !== 'PAID'` (`400 VNPAY_UNPAID_ORDER`). Đơn COD khi chuyển sang `DELIVERED` tự động đánh dấu `paymentStatus = 'PAID'`.
3. **Test Coverage:** `rbac_and_concurrency.test.ts` (CONCURRENCY-1, CONCURRENCY-2 với `Promise.all`), `payment_security.test.ts` (13 tests), `commerce_and_ai.integration.test.ts`.

---

## 5. Luồng Quản trị Single-Vendor (Admin Operations)

- Xem phân tích đầy đủ 11+ phân hệ, ma trận CRUD và phân quyền tại [`15_ADMIN_SYSTEM_DOCUMENTATION.md`](./15_ADMIN_SYSTEM_DOCUMENTATION.md).

## 6. Luồng 4 Hệ thống AI

- Xem phân tích chi tiết cơ chế LLM vs Deterministic Scoring vs Rule-Based tại [`13_AI_SYSTEMS_ARCHITECTURE.md`](./13_AI_SYSTEMS_ARCHITECTURE.md).
