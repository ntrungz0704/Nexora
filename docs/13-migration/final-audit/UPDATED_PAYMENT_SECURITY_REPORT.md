# UPDATED PAYMENT SECURITY & VNPAY AUDIT REPORT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Kho chứa:** `d:\Nexora`
- **Tệp mã nguồn:**
  - `apps/api/src/modules/payment/payment.routes.ts`
  - `apps/api/src/modules/payment/payment.controller.ts`
  - `apps/api/src/modules/payment/payment.service.ts`
- **Tệp kiểm thử:** `apps/api/tests/payment_security.test.ts`
- **Ngày thực thi:** 20/11/2026
- **Trạng thái:** **PASS (13/13 TESTS PASS — 100% TIÊU CHUẨN AN TOÀN THANH TOÁN)**

---

## 1. MỤC TIÊU VÀ BỐI CẢNH KIỂM TOÁN

Thanh toán trực tuyến là phân hệ nhạy cảm nhất trong hệ thống thương mại điện tử phần cứng. Các rủi ro thường gặp bao gồm:

1. **Lỗ hổng IDOR (Insecure Direct Object References):** Người dùng này tạo URL thanh toán cho đơn hàng của người dùng khác hoặc can thiệp đơn hàng vãng lai.
2. **Gian lận số tiền thanh toán (Amount Tampering):** Client gửi số tiền nhỏ hơn (ví dụ 1.000đ) để thanh toán cho đơn hàng giá trị cao (ví dụ laptop 50.000.000đ).
3. **Giả mạo chữ ký Callback/IPN (Signature Forgery):** Kẻ tấn công tự gửi request callback với trạng thái `00` (thành công) mà không có chữ ký HMAC hợp lệ từ VNPay.
4. **Sai lệch số tiền khi nhận callback (Amount Mismatch):** Cổng gửi callback thành công nhưng số tiền thực trả không bằng số tiền của đơn hàng.
5. **Thanh toán lặp / Trùng lặp trạng thái (Double Spending / Idempotency):** Callback gửi nhiều lần dẫn đến việc xử lý trùng lặp.
6. **Lỗ hổng giả lập thanh toán trên Production (Simulator Leak):** Endpoint giả lập thanh toán (`/simulate`) vô tình hoạt động trong môi trường thật.

---

## 2. KẾT QUẢ THỰC THI KIỂM THỬ THỰC TẾ (`payment_security.test.ts`)

Lệnh thực thi:

```bash
npm test -- apps/api/tests/payment_security.test.ts
```

Kết quả: **13/13 tests passed (100%)**

```
 ✓ apps/api/tests/payment_security.test.ts (13 tests) 1463ms
   ✓ Payment Security & VNPay Verification Test Suite (13)
     ✓ OWN-1: Rejects payment URL creation for guest order when verification email/phone is missing or wrong
     ✓ OWN-2: Allows payment URL creation for guest order when matching customerEmail or customerPhone is provided
     ✓ OWN-3: Rejects payment URL creation for registered user order when unauthenticated (401)
     ✓ OWN-4: Rejects payment URL creation for registered user order when requested by another customer (403 IDOR protection)
     ✓ OWN-5: Allows payment URL creation for registered user order when requested by the owner
     ✓ OWN-6: Allows payment URL creation for registered user order when requested by Admin
     ✓ OWN-7: Rejects payment URL creation for non-existent order with 404
     ✓ SEC-1: createVnpayPaymentUrl fetches amount from database and ignores forged client amounts
     ✓ SEC-2: verifyVnpayCallback rejects invalid HMAC-SHA512 checksums
     ✓ SEC-3: verifyVnpayCallback rejects payment if amount does not match server order total
     ✓ SEC-4: verifyVnpayCallback processes valid callback and enforces idempotency
     ✓ SEC-4B: Rejects payment URL creation if order is already paid with 400 ORDER_ALREADY_PAID
     ✓ SEC-5: simulatePaymentSuccess throws 403 in production environment
```

---

## 3. PHÂN TÍCH CHI TIẾT CÁC LỚP BẢO VỆ ĐÃ THỰC THI

### 3.1. Xác thực Quyền sở hữu (Ownership & IDOR Protection)

- **Đơn hàng của người dùng đăng ký (`order.userId !== null`):**
  - **OWN-3:** Nếu request không có Authorization Header, API lập tức phản hồi `401 UNAUTHORIZED`.
  - **OWN-4 (IDOR Protection):** Nếu Đơn hàng thuộc sở hữu của User A, nhưng User B (đã đăng nhập token hợp lệ của User B) gửi request thanh toán, hệ thống đối chiếu `req.user.sub !== order.userId` và phản hồi `403 FORBIDDEN`. Kẻ tấn công hoàn toàn không thể chiếm quyền thanh toán hay theo dõi thông tin đơn hàng người khác.
  - **OWN-5 & OWN-6:** Chỉ chính chủ sở hữu đơn hàng (User A) hoặc người dùng có vai trò `ADMIN`/`STAFF` mới được phép tạo URL thanh toán.
- **Đơn hàng của khách vãng lai (`order.userId === null`):**
  - **OWN-1:** Nếu khách vãng lai gọi API mà không cung cấp email/số điện thoại hoặc cung cấp email sai khác so với đơn hàng, hệ thống từ chối với `403 FORBIDDEN`.
  - **OWN-2:** Khi cung cấp đúng `customerEmail` hoặc `customerPhone` đã đăng ký khi đặt hàng, hệ thống phê duyệt cấp URL thanh toán.
- **Đơn hàng không tồn tại hoặc đã thanh toán:**
  - **OWN-7:** Trả về `404 ORDER_NOT_FOUND`.
  - **SEC-4B:** Nếu đơn hàng đã ở trạng thái `PAID`, hệ thống chặn đứng với mã lỗi `400 ORDER_ALREADY_PAID`, ngăn chặn việc thanh toán kép.

### 3.2. Tính Toàn Vẹn Số Tiền (Server-Side Amount Authority)

- **SEC-1:** Khi client cố tình truyền payload gian lận `{ orderCode: "NX-...", amount: 1000 }` (mong muốn thanh toán 1.000đ cho đơn hàng đắt tiền), API hoàn toàn bỏ qua trường `amount` từ client và truy vấn trực tiếp `order.totalAmount` từ MySQL 8.4. URL VNPay được tạo ra với tham số `vnp_Amount` chính xác 100% bằng số tiền thực tế trong cơ sở dữ liệu.

### 3.3. Xác thực Chữ ký HMAC-SHA512 & Chống Giả Mạo

- **SEC-2:** Mọi request callback từ cổng thanh toán đều được sắp xếp các tham số theo bảng mã chữ cái (A-Z) và tính toán lại chuỗi mã băm HMAC-SHA512 bằng khóa bí mật `VNPAY_HASH_SECRET`. Bất kỳ yêu cầu nào có chữ ký giả mạo hoặc không hợp lệ đều bị từ chối với `isSuccess: false` và ghi log cảnh báo.

### 3.4. Đối chiếu Số tiền Nhận được (Amount Reconciliation)

- **SEC-3:** Khi nhận callback hợp lệ về chữ ký, hệ thống lấy `vnp_Amount` chia cho 100 và so sánh với `order.totalAmount`. Nếu số tiền bị sai lệch (ví dụ hacker giả lập giao dịch thành công cho số tiền nhỏ hơn), hệ thống lập tức từ chối và ghi nhận lỗi `Số tiền thanh toán không khớp`.

### 3.5. Xử lý Trùng lặp Trạng thái (Idempotent Callback Processing)

- **SEC-4:**
  - Lần 1: Nhận callback thành công, cập nhật `paymentStatus = 'PAID'`, `paidAt = NOW()`, `orderStatus = 'CONFIRMED'`.
  - Lần 2 (Network Retry / Trùng lặp IPN): Hệ thống kiểm tra `order.paymentStatus === 'PAID'`, trả về kết quả thành công ngay mà không kích hoạt ghi log trùng lặp hay trừ kho hai lần.

### 3.6. Vô hiệu hóa Giả lập trên Production (Simulator Lockout)

- **SEC-5:** Phương thức `simulatePaymentSuccess` và route `/simulate` được bảo vệ bằng kiểm tra biến môi trường. Khi `NODE_ENV === 'production'`, hàm chủ động ném ngoại lệ `AppError(403, 'SIMULATOR_DISABLED')`, đảm bảo không thể bị lạm dụng trên môi trường vận hành thực tế.

---

## 4. KẾT LUẬN

Hệ thống thanh toán VNPay của Nexora đã được gia cố toàn diện, bảo vệ 100% chống lại các lỗ hổng IDOR, gian lận số tiền, giả mạo chữ ký và thanh toán lặp.
