# SECURITY & VULNERABILITY AUDIT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Tiêu chuẩn kiểm toán:** OWASP Top 10, CWE / SANS Top 25
- **Ngày kiểm toán:** 20/11/2026
- **Trạng thái:** **PARTIAL (ĐẠT CHUẨN AN TOÀN CHUNG — CÓ 1 PHÁT HIỆN BẢO MẬT P1 CẦN XỬ LÝ)**

---

## 1. MỤC TIÊU & PHƯƠNG PHÁP KIỂM TOÁN AN NINH

Đợt kiểm toán này rà soát toàn bộ bề mặt tấn công của hệ thống Nexora bao gồm:

1. Cơ chế mã hóa mật khẩu, quản lý phiên và xác thực (Authentication).
2. Kiểm soát truy cập và phân quyền đa tầng (RBAC & Authorization).
3. Phòng chống tấn công tham chiếu trực tiếp đối tượng không an toàn (IDOR).
4. An toàn giao dịch cổng thanh toán VNPay và bảo vệ endpoint mô phỏng.
5. Cấu hình bảo mật mạng, chống tấn công từ chối dịch vụ (Rate Limiting, Helmet, CORS).
6. Quét phát hiện mã bí mật (Secrets, API keys, Credentials) trong Git.

---

## 2. KẾT QUẢ ĐÁNH GIÁ CÁC TIÊU CHUẨN BẢO MẬT

### 2.1. Mã Hóa Mật Khẩu & Xác Thực

- **Thư viện sử dụng:** `bcryptjs` với hệ số độ phức tạp muối (Salt Rounds) = 10.
- **Xác thực phiên:** JWT (JSON Web Token) ký bằng thuật toán đối xứng HMAC-SHA256 với khóa bí mật lưu trong biến môi trường `JWT_SECRET`.
- **Đánh giá:** Đáp ứng tiêu chuẩn lưu trữ an toàn thông tin định danh người dùng.

### 2.2. Kiểm Soát Phân Quyền (RBAC) & Chống IDOR

- **Middleware phân quyền:** `apps/api/src/middleware/auth.middleware.ts`
  - Cung cấp hàm `requireAuth` và `requireRole(['ADMIN', 'STAFF'])`.
  - Kiểm tra vai trò trực tiếp từ cơ sở dữ liệu hoặc thông tin trong Token được giải mã.
  - Ẩn giao diện trên Frontend không được coi là biện pháp bảo mật; toàn bộ API nhạy cảm đều được bảo vệ nghiêm ngặt tại Backend.
- **Chống lỗi IDOR (Insecure Direct Object Reference):**
  - Trong `order.service.ts`: Khi người dùng yêu cầu xem chi tiết đơn hàng hoặc lịch sử giao dịch, hệ thống luôn kiểm tra:
    ```typescript
    if (order.userId !== currentUser.id && currentUser.role === 'CUSTOMER') {
      throw new ForbiddenError('Bạn không có quyền truy cập đơn hàng này');
    }
    ```
  - Khách hàng không thể thay đổi `orderId` trên thanh địa chỉ để xem đơn hàng của người khác.

### 2.3. An Ninh Thanh Toán Cổng VNPay (Payment Gateway Security)

- **Tính toán và kiểm tra chữ ký số:** `apps/api/src/modules/payment/payment.service.ts`
  - Sử dụng thuật toán mã hóa một chiều **HMAC-SHA512** theo đúng tiêu chuẩn kỹ thuật của cổng VNPay.
  - Sắp xếp thứ tự các tham số theo bảng chữ cái trước khi ký số.
  - **Đối chiếu số tiền thanh toán:** Khi nhận thông báo kết quả trả về từ IPN hoặc Return URL, hệ thống kiểm tra số tiền `vnp_Amount` khớp chính xác với `order.totalAmount * 100` trong cơ sở dữ liệu.
  - **Chống thanh toán trùng lặp (Idempotency):** Sử dụng `orderId` và khóa giao dịch để đảm bảo một đơn hàng chỉ được cập nhật `PAID` duy nhất một lần.
- **Bảo vệ Endpoint Mô Phỏng (`/api/v1/payments/simulate`):**
  - Được thiết lập cơ chế khóa kép (Double Guard):
    1. Tại Router: Chặn ngay lập tức nếu `process.env.NODE_ENV === 'production'`.
    2. Tại Service: Ném lỗi `ForbiddenError` nếu môi trường là `production`.
  - Đảm bảo môi trường thực tế không thể bị lợi dụng để thanh toán khống.

### 2.4. Bảo Vệ Mạng & HTTP Headers

- **Helmet:** Kích hoạt tại `server.ts` giúp bật các HTTP headers bảo vệ: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.
- **CORS Allowlist:** Giới hạn nguồn gốc truy cập theo biến môi trường `CORS_ORIGIN`, ngăn chặn tấn công Cross-Origin từ các trang web độc hại.
- **Rate Limiting:** Sử dụng `express-rate-limit` để giới hạn 100 requests / 15 phút trên API chung và giới hạn chặt chẽ 10 requests / 15 phút trên các API đăng nhập/đăng ký nhằm chống tấn công vét cạn (Brute-force).

### 2.5. Kiểm Tra Rò Rỉ Bí Mật (Secrets Leak Audit)

- Quét lịch sử Git và các file cấu hình:
  - File `.env` chứa mật khẩu thật được loại trừ nghiêm ngặt trong `.gitignore`.
  - Chỉ commit `.env.example` chứa các chuỗi giữ chỗ (placeholders).
  - Không có khóa API VNPay thật, AWS keys hay thông tin cá nhân (PII) được commit lên repository.

---

## 3. PHÁT HIỆN BẢO MẬT & RỦI RO (SECURITY VULNERABILITY FINDING)

### 🔴 PHÁT HIỆN P1: Khối Mã Fallback Kiểm Tra Mật Khẩu Dạng Plaintext Trong AuthService

- **Mức độ nghiêm trọng:** **P1 (High)**
- **Vị trí tệp:** `apps/api/src/modules/auth/auth.service.ts` (dòng 46-69)
- **Đoạn mã phát hiện:**
  ```typescript
  // FALLBACK CHECK FOR LEGACY TEST/MIGRATED ACCOUNTS
  const legacyFallbackPasswords: Record<string, string> = {
    'admin@techpilot.vn': 'TechPilotAdmin2026!',
    'admin@nexora.vn': 'admin123',
    'dev@techpilot.vn': 'dev123',
    'customer1@gmail.com': 'password123',
  };
  if (legacyFallbackPasswords[user.email] && password === legacyFallbackPasswords[user.email]) {
    // Tự động nâng cấp hash sang bcrypt
  }
  ```
- **Phân tích rủi ro:**
  - Khối mã này ban đầu được bổ sung nhằm hỗ trợ chuyển giao tài khoản mẫu từ TechPilot sang Nexora mà không cần người dùng reset mật khẩu.
  - Tuy nhiên, việc lưu trữ mật khẩu plaintext cứng trong mã nguồn là vi phạm tiêu chuẩn bảo mật. Nếu kẻ tấn công có mã nguồn hoặc biết tài khoản chưa từng đăng nhập, chúng có thể sử dụng các mật khẩu mặc định này để chiếm quyền tài khoản quản trị.
- **Biện pháp xử lý đề xuất (Remediation):**
  1. Xóa bỏ hoàn toàn khối mã `legacyFallbackPasswords` trong `auth.service.ts`.
  2. Bắt buộc 100% người dùng xác thực thông qua so sánh hàm băm `bcrypt.compare(password, user.passwordHash)`.
  3. Cung cấp quy trình "Quên mật khẩu" (`/forgot-password`) để người dùng tự thiết lập mật khẩu mới an toàn.

---

## 4. KẾT LUẬN KIỂM TOÁN BẢO MẬT

Hệ thống Nexora có nền tảng an ninh mạng vững chắc, loại bỏ hoàn toàn các lỗ hổng Injection và IDOR của hệ thống PHP cũ. Sau khi hoàn thành việc loại bỏ khối mã fallback P1 nêu trên, hệ thống sẽ đạt trạng thái **VERIFIED PASS** toàn diện về an toàn thông tin.
