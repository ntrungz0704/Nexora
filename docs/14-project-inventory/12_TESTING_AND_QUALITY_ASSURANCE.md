# CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG & ĐẢM BẢO CHẤT LƯỢNG (QA)
**Tài liệu:** `12_TESTING_AND_QUALITY_ASSURANCE.md`  
**Dự án:** Nexora  

---

## 1. Cơ Cấu Bộ Kiểm Thử Tự Động (Vitest & Supertest)

Hệ thống sở hữu bộ kiểm thử tự động 100% chạy trên cơ sở dữ liệu MySQL 8.4 thực tế:
- **`apps/api/tests/commerce_and_ai.integration.test.ts` (11 tests):** Đặt hàng, snapshot tồn kho, wishlist cô lập khách hàng, reset password không lộ token.
- **`apps/api/tests/rbac_and_concurrency.test.ts` (10 tests):** Phân quyền vai trò, kiểm thử tranh chấp 2 request mua cùng 1 sản phẩm cuối cùng đồng thời.
- **`apps/api/tests/payment_security.test.ts` (13 tests):** Xác thực chữ ký VNPay, kiểm tra quyền sở hữu đơn hàng, bảo vệ IPN callback.
- **`apps/api/tests/auth_password_reset_security.test.ts` (8 tests):** Bảo mật reset token, xử lý lỗi provider email, test concurrency tranh chấp token đặt lại mật khẩu.
- **`apps/api/tests/seed_and_auth_credentials.test.ts` (2 tests):** Bảo toàn mật khẩu admin khi chạy lại seeder.
- **`apps/api/tests/storefront.integration.test.ts` (7 tests):** Danh mục, sản phẩm, flash sale, banner và xác thực đăng nhập khách hàng.
- **`apps/api/tests/app.test.ts` (4 tests):** Khởi tạo ứng dụng, CORS, Helmet headers và health check.
- **`apps/web/tests/FoundationDashboard.test.tsx` (1 test):** Kiểm thử component React.
- **`packages/shared/tests/personaScoring.test.ts` (6 tests):** Thuật toán chấm điểm Persona động.
- **`packages/shared/tests/shared.test.ts` (2 tests):** Zod schemas và DTO parsing.

**Tổng kết kiểm thử:** 10 test files / 64 tests PASSED (100% Thành công).
