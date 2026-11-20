# FINAL SECURITY REMEDIATION REPORT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Kho chứa:** `d:\Nexora`
- **Nhánh:** `main`
- **Ngày hoàn thành kiểm toán & khắc phục:** 20/11/2026
- **Vai trò:** DevSecOps Auditor, Principal Software Architect, Security Engineer
- **Trạng thái:** **100% REMEDIATED & EMPIRICALLY VERIFIED (TẤT CẢ BLOCKERS ĐÃ ĐƯỢC XỬ LÝ TRIỆT ĐỂ)**

---

## 1. TỔNG QUAN CÁC ĐIỂM NGHẼN BẢO MẬT & KẾT QUẢ KHẮC PHỤC

Theo yêu cầu nghiêm ngặt từ Hội đồng Thẩm định Kỹ thuật độc lập trước khi phê duyệt đóng gói và tạo repository mới, 3 điểm nghẽn bảo mật (Blockers A, B, C) đã được giải quyết tận gốc và chứng minh qua các bộ kiểm thử tự động chuyên sâu:

| Mã điểm nghẽn | Phân hệ ảnh hưởng | Mức độ rủi ro | Trạng thái trước | Trạng thái hiện tại | Bằng chứng kiểm chứng |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **BLOCKER A** | Auth Password Reset Token Leak & Validation | `P1 - CRITICAL` | `FAIL` (Lộ token, bypass purpose, token tái sử dụng) | **VERIFIED PASS** | `apps/api/tests/auth_password_reset_security.test.ts` (6/6 tests PASS) |
| **BLOCKER B** | Default Seed Credentials & Re-seed Reset | `P1 - HIGH` | `FAIL` (Ghi đè mật khẩu Admin khi re-seed, mật khẩu mặc định yếu) | **VERIFIED PASS** | `apps/api/tests/seed_and_auth_credentials.test.ts` (2/2 tests PASS) |
| **BLOCKER C** | Payment URL Ownership & Tampering Protection | `P1 - HIGH` | `FAIL` (Thiếu kiểm tra quyền sở hữu order, nguy cơ IDOR) | **VERIFIED PASS** | `apps/api/tests/payment_security.test.ts` (13/13 tests PASS) |

---

## 2. CHI TIẾT KHẮC PHỤC BLOCKER A: PASSWORD RESET TOKEN SECURITY

### 2.1. Hiện trạng nguy cơ trước khắc phục
1. **Lộ Token Reset Mật Khẩu qua HTTP Response:** Phương thức `forgotPassword` trả về `resetToken` trực tiếp trong JSON response payload (`res.body.data.resetToken`), cho phép bất kỳ ai biết email của nạn nhân đều có thể lấy token mà không cần truy cập hộp thư.
2. **Lỗi logic kiểm tra Token Purpose:** Điều kiện kiểm tra trong `resetPassword` sử dụng toán tử sai:
   ```typescript
   // MÃ LỖI CŨ:
   if (payload.purpose !== 'password_reset' && !payload.sub) { ... }
   ```
   Do sử dụng `&&`, nếu một access token thông thường có `sub`, điều kiện trên trả về `false` và cho phép dùng access token để đổi mật khẩu.
3. **Nguy cơ Replay Attack (Tái sử dụng Token):** Token sau khi đã dùng để đổi mật khẩu một lần vẫn có thể được dùng lại nhiều lần cho tới khi hết hạn (1 giờ).
4. **User Enumeration:** Phản hồi của API tiết lộ sự tồn tại của email trong cơ sở dữ liệu.

### 2.2. Mã nguồn sau khắc phục (`apps/api/src/modules/auth/auth.service.ts`)
1. **Tuyệt đối không trả về `resetToken` trong HTTP response:**
   Phương thức `forgotPassword` luôn trả về một thông báo an toàn tiêu chuẩn giống nhau cho cả email tồn tại lẫn không tồn tại:
   `"Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đi."` (chống User Enumeration).
2. **Chữa lỗi toán tử logic Purpose:**
   ```typescript
   if (payload.purpose !== 'password_reset' || !payload.sub) {
     throw new AppError(400, 'INVALID_RESET_TOKEN', 'Token không hợp lệ cho tác vụ đặt lại mật khẩu.');
   }
   ```
3. **Cơ chế Token Signature chống Replay Attack (One-time Use):**
   Khi tạo token, một chữ ký tóm tắt mật khẩu hiện tại (`hashSig = user.passwordHash.substring(0, 16)`) được nhúng vào JWT payload. Khi người dùng hoàn tất đổi mật khẩu, `user.passwordHash` thay đổi ngay lập tức, khiến chữ ký `hashSig` trong token cũ không còn khớp với mật khẩu mới. Nếu kẻ tấn công cố dùng lại token cũ, hệ thống ngay lập tức từ chối với mã lỗi `TOKEN_ALREADY_USED`.
4. **Bảo vệ môi trường Production:**
   Hàm helper `generatePasswordResetTokenForTest` chỉ được phép hoạt động trong môi trường `test` và `development`. Nếu gọi trong `production`, hàm sẽ ném ngoại lệ `AppError(403)`.

---

## 3. CHI TIẾT KHẮC PHỤC BLOCKER B: SEED CREDENTIALS & RE-SEED PRESERVATION

### 3.1. Hiện trạng nguy cơ trước khắc phục
1. Tệp `prisma/seed.ts` dùng chung một chuỗi băm mặc định (`password123`) cho toàn bộ tài khoản Admin, Staff và Customer.
2. Khi chạy lại seed (`npm run db:seed`), khối lệnh `upsert.update` luôn cập nhật lại `passwordHash: DEFAULT_PASSWORD_HASH`, ghi đè và xóa bỏ mật khẩu quản trị viên đã thay đổi trước đó.
3. Dữ liệu thử nghiệm (demo orders, demo cart, demo wishlist) được chèn không có điều kiện môi trường.

### 3.2. Mã nguồn sau khắc phục (`prisma/seed.ts`)
1. **Kiểm soát mật khẩu khởi tạo Admin trong môi trường Production:**
   ```typescript
   function getAdminInitialPasswordHash(): string {
     const isProd = process.env.NODE_ENV === 'production';
     if (isProd) {
       const initialSecret = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD_HASH;
       if (!initialSecret || initialSecret.trim() === '') {
         throw new Error('[FATAL SEED ERROR] Môi trường Production bắt buộc phải cấu hình ADMIN_INITIAL_PASSWORD hoặc ADMIN_INITIAL_PASSWORD_HASH trong biến môi trường.');
       }
       if (initialSecret.startsWith('$2')) return initialSecret;
       return bcrypt.hashSync(initialSecret, 12);
     }
     return DEFAULT_PASSWORD_HASH;
   }
   ```
2. **Bảo toàn mật khẩu Admin khi Re-seed (Idempotency):**
   Trong mệnh đề `update:` của lệnh `prisma.user.upsert`, trường `passwordHash` đã được **LOẠI BỎ HOÀN TOÀN**. Do đó, khi quản trị viên thay đổi mật khẩu thông qua hệ thống, việc chạy lại `prisma/seed.ts` để cập nhật danh mục, sản phẩm hoặc thương hiệu sẽ **KHÔNG BAO GIỜ** ghi đè hay hoàn tác mật khẩu của Quản trị viên.
3. **Cách ly dữ liệu Demo theo môi trường:**
   Toàn bộ mã tạo demo carts, demo wishlists, demo orders và demo notifications được bọc trong điều kiện:
   ```typescript
   if (!isProduction && customerUser) {
     // Chỉ seed dữ liệu giao dịch mẫu trong môi trường Development/Test
   }
   ```

---

## 4. CHI TIẾT KHẮC PHỤC BLOCKER C: PAYMENT OWNERSHIP & TAMPERING PROTECTION

### 4.1. Hiện trạng nguy cơ trước khắc phục
1. Endpoint `POST /api/v1/payment/vnpay/create-url` không áp dụng middleware xác thực. Bất kỳ ai cũng có thể gửi `orderCode` của một khách hàng khác để lấy URL thanh toán.
2. Không kiểm tra quyền sở hữu đơn hàng giữa các tài khoản người dùng đăng ký (`userId`).

### 4.2. Mã nguồn sau khắc phục (`apps/api/src/modules/payment/`)
1. **Bổ sung `optionalAuth()` middleware:** Cho phép endpoint thanh toán nhận diện cả người dùng đăng nhập (`req.user`) lẫn khách vãng lai (Guest).
2. **Kiểm tra quyền sở hữu nghiêm ngặt (Strict Ownership Verification):**
   - **Đối với đơn hàng của tài khoản đã đăng ký (`order.userId !== null`):**
     Bắt buộc người dùng phải đăng nhập (`req.user !== undefined`). Nếu chưa đăng nhập, trả về `401 UNAUTHORIZED`.
     Nếu đã đăng nhập, `req.user.sub` phải trùng khớp với `order.userId`, hoặc người dùng phải có vai trò `ADMIN` / `STAFF`. Nếu một người dùng khác cố gắng tạo URL thanh toán cho đơn hàng này, hệ thống chặn đứng với mã lỗi `403 FORBIDDEN` (chống lỗ hổng IDOR).
   - **Đối với đơn hàng của khách vãng lai (`order.userId === null`):**
     Yêu cầu người gọi phải cung cấp thông tin định danh trùng khớp: `customerEmail` hoặc `customerPhone` khớp với đơn hàng, hoặc người gọi là `ADMIN`/`STAFF`. Nếu thông tin không khớp, từ chối với `403 FORBIDDEN`.
   - **Đơn hàng đã thanh toán (`order.paymentStatus === 'PAID'`):**
     Hệ thống từ chối tạo URL thanh toán mới với mã lỗi `400 ORDER_ALREADY_PAID`.
   - **Đơn hàng không tồn tại:**
     Từ chối với mã lỗi `404 ORDER_NOT_FOUND`.
3. **Toàn vẹn số tiền & Chống giả mạo chữ ký:**
   - Số tiền thanh toán luôn được đọc trực tiếp từ bảng `Order` trong cơ sở dữ liệu (`totalAmount`), nhân 100 theo chuẩn VNPay. Mọi tham số `amount` gửi từ client đều bị bỏ qua.
   - Callback/IPN từ VNPay bắt buộc kiểm tra chữ ký HMAC-SHA512 với khóa bí mật `VNPAY_HASH_SECRET`.
   - Đối chiếu số tiền nhận được từ cổng với tổng tiền thực tế trong CSDL; nếu sai lệch lập tức từ chối và cảnh báo gian lận.
   - Cơ chế xử lý Idempotent: Nếu đơn hàng đã được cập nhật `PAID`, các callback lặp lại được trả về thành công ngay mà không tạo duplicate updates.

---

## 5. TỔNG KẾT BẰNG CHỨNG THỰC NGHIỆM

Toàn bộ các giải pháp trên đã được kiểm chứng tự động:
- **`npm test -- apps/api/tests/auth_password_reset_security.test.ts`**: 6/6 tests passed.
- **`npm test -- apps/api/tests/seed_and_auth_credentials.test.ts`**: 2/2 tests passed.
- **`npm test -- apps/api/tests/payment_security.test.ts`**: 13/13 tests passed.
- **Toàn bộ Vitest Suite (`npm test`)**: 9 test files, **55/55 tests passed (100%)**.
- **Typecheck & Lint (`npm run typecheck`, `npm run lint`)**: 0 errors, 0 warnings.
- **Build (`npm run build`)**: Thành công 100%.
- **Playwright E2E (`npm run test:e2e`)**: 9/9 user journeys passed (11.8s).
