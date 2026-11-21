# 25. Final Findings, Blockers & Remediation Roadmap

## 1. Tổng hợp phát hiện phân cấp ưu tiên (Prioritized Action Plan)

### P0 — Critical Blockers (Bắt buộc sửa trước khi mở Production)

1. **[SEC-01] Chặn leo thang đặc quyền `STAFF → ADMIN`:**
   - Gắn `requireAuth(['ADMIN'])` riêng cho `PATCH /api/v1/admin/users/:id/role` và `PATCH /api/v1/admin/users/:id/toggle`; cấm tự đổi role chính mình và cấm `STAFF` tác động lên bất kỳ tài khoản `ADMIN` nào.
2. **[SEC-02] Khóa lỗ hổng IDOR tại `GET /api/v1/orders/detail/:code`:**
   - Bắt buộc xác thực chủ sở hữu (`requireAuth()` + `order.userId === req.user.sub`) hoặc yêu cầu đối chiếu `phone`/`email` tương tự `/orders/track`.
3. **[BUG-01] Sửa đường dẫn 404 trong Email Reset Password:**
   - Thêm `<Route path="/auth/reset-password" element={<ResetPasswordPage />} />` vào `AppRoutes.tsx` (hoặc đồng bộ `auth.service.ts:163` dùng `/reset-password`).

### P1 — High Priority (Security, CI/CD & Data Persistence)

4. **[SEC-03] Kích hoạt `express-rate-limit`:** Mount rate limiter cho `/auth/login`, `/auth/forgot-password`, `/ai/*` và `/orders`.
5. **[CI-01] Sửa lỗi fail GitHub Actions CI:**
   - Chạy `npm run format` khắc phục 145 file lệch Prettier.
   - Tách script `test:unit` (không cần MySQL) cho job `quality-and-build` và chuyển toàn bộ integration tests sang job `mysql-integration`.
6. **[DATA-01] Nối API thực cho `ProfilePage.tsx` & Reviews:**
   - Triển khai REST endpoints cho 4 bảng DB đã có sẵn: `customer_addresses`, `notifications`, `return_requests`, `POST /reviews`, `PUT /auth/profile`, `POST /auth/change-password`, `POST /cart/merge`.
7. **[PERF-01] Gộp 6 `new PrismaClient()` thành 1 Singleton:** Refactor 5 service (`admin`, `ai`, `marketing`, `order`, `payment`) sang dùng `getPrismaClient()` từ `common/prisma.ts`.

### P2 — Medium Priority (Performance, Commerce Edge Cases, Styling & Infra)

8. **[TAILWIND-01] Lộ trình chuyển đổi 100% Storefront sang Tailwind CSS 4:**
   - Hiện tại chỉ Admin dùng Tailwind v4 chủ đạo (984 matches); Storefront vẫn chạy 10.151 LOC CSS3 legacy + 1.111 inline styles.
   - Đề xuất chia 4 sprint nhỏ (Header/Footer → Home/Cards → Search/Detail → Cart/Checkout/Tools), mỗi sprint kèm chụp screenshot đối chiếu visual parity trước khi xóa từng file trong `public/assets/css/`.
9. **[PERF-02] Code-Splitting & Nén ảnh:**
   - Tách `AdminDashboardPage.tsx` (5.924 LOC) bằng `React.lazy()` giảm bundle Storefront từ 1.10 MB xuống < 350 KB.
   - Chuyển `banner-1/2/3.png` (18.68 MB) và 32 ảnh > 500 KB sang WebP tối ưu.
10. **[COMMERCE-01] Đồng bộ quy tắc nghiệp vụ:**
    - Thống nhất ngưỡng miễn phí vận chuyển (300K trên Topbar vs 500K trong `OrderService`/`CartPage`).
    - Dùng atomic `updateMany` trong `$transaction` cho `Coupon.usageLimit` và `cancelOrder`; thêm `Idempotency-Key` cho `POST /orders`; dùng `crypto.timingSafeEqual` cho VNPay HMAC.
11. **[INFRA-01] Hardening Docker & Nginx:** Thêm `USER node` trong `docker/api.Dockerfile`, thêm security headers + gzip vào `docker/nginx/default.conf`, truyền đủ biến `VNPAY_*`, `SMTP_*`, `GEMINI_API_KEY` trong `docker-compose.yml`.

### P3 — Low Priority (Cleanup & E2E Maturity)

12. **[CLEAN-01] Xóa 8 file JS legacy chưa dùng** trong `apps/web/public/assets/js/`, gỡ `cookie-parser` nếu không dùng, tắt tài khoản `admin@techpilot.vn` & ẩn coupon alias `TECHPILOT*` trước production.
13. **[QA-01] Mở rộng Playwright E2E:** Bổ sung kịch bản giao dịch thực (Login → Add to Cart → Coupon → Checkout → Admin Verify → Cancel) và chụp ảnh tự động trên cả 5 viewport chuẩn.
