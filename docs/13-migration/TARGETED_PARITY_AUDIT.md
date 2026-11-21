# TARGETED_PARITY_AUDIT.md — Báo Cáo Khắc Phục Lỗi Parity & Kiểm Thử Chi Tiết

- **Ngày thực hiện:** 19/11/2026
- **Trạng thái:** `VERIFIED PASS`
- **Phạm vi kiểm tra:** Khắc phục toàn diện các điểm bất cập được phát hiện trong đợt kiểm toán hệ thống.

---

## 1. Tóm Tắt Khắc Phục Lỗi Định Tuyến & Giao Diện (Route & UI Parity)

| Yêu cầu kiểm toán                                              | Tình trạng trước đây                           | Giải pháp đã thực hiện trên Nexora                                                                                          | Kết quả kiểm chứng |
| -------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Đặt lại mật khẩu (`/auth/reset`, `/reset-password`)**        | Chỉ có trang quên mật khẩu                     | Tạo trang chuyên dụng `ResetPasswordPage.tsx`, bổ sung endpoint `POST /api/v1/auth/reset-password` và test E2E              | `PASS`             |
| **Yêu cầu đổi trả (`/profile/return`, `.../:id`)**             | Thiếu form đổi trả                             | Tích hợp tab Yêu cầu đổi trả vào `ProfilePage.tsx` với bộ chọn đơn hàng, hình thức hoàn tiền/sửa chữa và textarea mô tả lỗi | `PASS`             |
| **Thông báo hệ thống (`/profile/notifications`)**              | Không có tab riêng                             | Thêm tab Thông báo vào `ProfilePage.tsx` kèm giao diện xem danh sách thông báo và đánh dấu đã đọc                           | `PASS`             |
| **Các trang chính sách (`/policy/warranty`, `/shipping`,...)** | Trỏ tạm về trang chủ                           | Tạo trang chuyên dụng `PolicyPage.tsx` có breadcrumb, layout điều hướng 4 chính sách lớn, nội dung chi tiết cam kết         | `PASS`             |
| **Khắc phục lỗi đè giao diện Category Menu**                   | Sidebar danh mục 16 mục bị tràn qua Flash Sale | Tinh chỉnh padding `4.5px 14px`, `max-height: 560px`, `justify-content: space-evenly`, khôi phục `z-index: 10` chuẩn mực    | `PASS`             |
| **Khắc phục tìm kiếm tiếng Việt không dấu**                    | Tìm kiếm danh mục không dấu trả 0 sản phẩm     | Chuẩn hóa `removeVietnameseTones()` cho cả slug, không dấu và có dấu; sản phẩm thiết bị văn phòng hiển thị ngay             | `PASS`             |
| **Chuyển toàn bộ Popup/Drawer sang Trang Độc Lập**             | Giỏ hàng, Wishlist, Đăng nhập là modal/drawer  | Chuyển hoàn toàn sang các trang riêng: `/cart`, `/wishlist`, `/auth/login`, `/auth/register`                                | `PASS`             |
| **Bảo vệ dữ liệu Wishlist & Khách Hàng (Customer Isolation)**  | Khách chưa đăng nhập có thể thao tác           | Yêu cầu đăng nhập 401, redirect kèm `?redirect=...`, cô lập dữ liệu giữa Customer A và B (có test tự động)                  | `PASS`             |
| **Backoffice Quản Trị Hệ Thống 13 Phân Hệ**                    | Các route trỏ về stub rỗng                     | Mở rộng đầy đủ 13 phân hệ trong `AdminDashboardPage.tsx`, liên kết Prisma ORM thực và MySQL 8.4                             | `PASS`             |

---

## 2. Kết Quả Kiểm Thử Tự Động (Quality Gates Output)

```bash
> npm run typecheck
> tsc --noEmit -p tsconfig.json (api)
> tsc --noEmit -p tsconfig.json (web)
Exit code: 0 (PASS)

> npm run lint
> eslint .
Exit code: 0 (PASS)

> npm run test
✓ apps/api/tests/commerce_and_ai.integration.test.ts (11 tests)
✓ apps/api/tests/rbac_and_concurrency.test.ts (5 tests)
✓ apps/api/tests/payment_security.test.ts (5 tests)
✓ apps/api/tests/storefront.integration.test.ts (7 tests)
✓ apps/api/tests/app.test.ts (4 tests)
✓ apps/web/tests/FoundationDashboard.test.tsx (1 test)
✓ packages/shared/tests/shared.test.ts (2 tests)
Test Files: 7 passed (7)
Tests:      35 passed (35)
Exit code: 0 (PASS)

> npm run build
✓ 274 modules transformed.
dist/assets/index-ApENWkS7.js 805.52 kB │ gzip: 219.91 kB
Exit code: 0 (PASS)
```
