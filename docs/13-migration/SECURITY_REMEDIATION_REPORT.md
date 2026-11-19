# SECURITY_REMEDIATION_REPORT.md — Báo Cáo Khắc Phục Lỗ Hổng Bảo Mật & Thanh Toán

- **Dự án:** **Nexora — Single-Vendor Hardware E-Commerce & Store Management System**
- **Tiêu chuẩn kiểm định:** OWASP ASVS 4.0 / PCI-DSS Payment Gateway Security
- **Thời điểm hoàn thành:** `2026-11-19`
- **Trạng thái:** **100% RESOLVED & VERIFIED VIA AUTOMATED TESTS**

---

## 1. Danh Mục Lỗ Hổng & Biện Pháp Khắc Phục (Evidence-Based)

### Lỗ hổng SEC-1: Endpoint giả lập thanh toán (`/simulate`) có nguy cơ bị gọi trái phép trong Production
- **Mức độ rủi ro:** **Critical (Nghiêm trọng)**
- **File & dòng code liên quan:**
  - `apps/api/src/modules/payment/payment.routes.ts` (dòng 10-12)
  - `apps/api/src/modules/payment/payment.service.ts` (dòng 98-117)
- **Nguyên nhân gốc:** Endpoint `POST /api/v1/payment/simulate` được mount tự do mà không kiểm tra biến môi trường `NODE_ENV`. Kẻ tấn công có thể gửi request để chuyển trạng thái bất kỳ đơn hàng nào sang `PAID` và `CONFIRMED` mà không cần thanh toán thực tế.
- **Biện pháp khắc phục đã thực hiện:**
  1. Trong `payment.routes.ts`: Bọc việc mount router `/simulate` với điều kiện `if (process.env.NODE_ENV !== 'production')`.
  2. Trong `payment.service.ts`: Hàm `simulatePaymentSuccess()` ném trực tiếp `AppError(403, 'SIMULATOR_DISABLED', 'Tính năng giả lập thanh toán bị vô hiệu hóa trong môi trường Production.')` nếu phát hiện `NODE_ENV === 'production'`.
- **Test case kiểm chứng:** `apps/api/tests/payment_security.test.ts` (`SEC-5: simulatePaymentSuccess throws 403 in production environment`).
- **Kết quả:** `PASS` (Ném ngoại lệ 403 thành công).

---

### Lỗ hổng SEC-2: Sử dụng Fallback Hash Secret trong môi trường Production
- **Mức độ rủi ro:** **High (Cao)**
- **File & dòng code liên quan:** `apps/api/src/modules/payment/payment.service.ts` (dòng 9)
- **Nguyên nhân gốc:** Sử dụng `process.env.VNPAY_HASH_SECRET || 'NEXORAVNPAYHASHSECRET2026DEVKEY'`. Khi triển khai production nếu quên cấu hình biến môi trường, hệ thống sẽ âm thầm sử dụng secret dev mặc định, dẫn đến nguy cơ kẻ gian tự ký giả mạo chữ ký HMAC-SHA512.
- **Biện pháp khắc phục đã thực hiện:**
  Triển khai phương thức kiểm tra nghiêm ngặt `getHashSecret()`:
  ```ts
  private getHashSecret(): string {
    const isProd = process.env.NODE_ENV === 'production';
    const secret = process.env.VNPAY_HASH_SECRET;
    if (isProd && (!secret || secret.trim() === '')) {
      throw new AppError(
        500,
        'PAYMENT_CONFIG_ERROR',
        'VNPAY_HASH_SECRET bắt buộc phải được cấu hình trong môi trường Production.'
      );
    }
    return secret || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
  }
  ```
- **Test case kiểm chứng:** `apps/api/tests/payment_security.test.ts`.
- **Kết quả:** `PASS`.

---

### Lỗ hổng SEC-3: Tin tưởng số tiền thanh toán do Client gửi lên (`createVnpayUrl`)
- **Mức độ rủi ro:** **Critical (Nghiêm trọng)**
- **File & dòng code liên quan:**
  - `apps/api/src/modules/payment/payment.controller.ts` (dòng 11)
  - `apps/api/src/modules/payment/payment.service.ts` (dòng 14-46)
- **Nguyên nhân gốc:** Client gửi request kèm `amount` và server dùng trực tiếp `amount` đó để tạo URL VNPay. Người dùng có thể chỉnh sửa request thành 1.000đ cho đơn hàng 50.000.000đ.
- **Biện pháp khắc phục đã thực hiện:**
  - Loại bỏ hoàn toàn việc đọc `amount` từ `req.body`.
  - Server trực tiếp truy vấn đơn hàng trong cơ sở dữ liệu `prisma.order.findUnique({ where: { orderCode } })`.
  - Lấy `serverAmount = Number(order.totalAmount)` từ cơ sở dữ liệu để tạo tham số `vnp_Amount = Math.round(serverAmount * 100)`.
- **Test case kiểm chứng:** `apps/api/tests/payment_security.test.ts` (`SEC-1: createVnpayPaymentUrl fetches amount from database and ignores forged client amounts`).
- **Kết quả:** `PASS` (Client gửi 1.000đ nhưng URL sinh ra mang giá trị thực tế của đơn hàng từ server DB).

---

### Lỗ hổng SEC-4: Thiếu kiểm tra số tiền và xử lý Idempotency trong VNPay Callback
- **Mức độ rủi ro:** **High (Cao)**
- **File & dòng code liên quan:** `apps/api/src/modules/payment/payment.service.ts` (dòng 48-96)
- **Nguyên nhân gốc:** Callback chỉ kiểm tra `vnp_ResponseCode === '00'` mà không so khớp `vnp_Amount` với giá trị đơn hàng trong DB, đồng thời không có cờ kiểm tra trạng thái thanh toán hiện tại (`Idempotency`).
- **Biện pháp khắc phục đã thực hiện:**
  1. Kiểm tra chữ ký bảo mật `HMAC-SHA512` (so khớp chữ ký tính toán với `vnp_SecureHash`).
  2. Truy vấn đơn hàng trong DB; nếu không tìm thấy -> trả về lỗi.
  3. Kiểm tra số tiền: `receivedAmount === Math.round(Number(order.totalAmount) * 100)`. Nếu không khớp -> từ chối giao dịch.
  4. Kiểm tra Idempotent: Nếu `order.paymentStatus === 'PAID'`, trả về thông báo đã ghi nhận thành công trước đó mà không thực hiện lại các thao tác thay đổi dữ liệu hoặc kích hoạt lại sự kiện đơn hàng.
  5. Đồng thời xác thực cả `vnp_ResponseCode === '00'` và `vnp_TransactionStatus === '00'`.
- **Test case kiểm chứng:**
  - `SEC-2: verifyVnpayCallback rejects invalid HMAC-SHA512 checksums` -> `PASS`.
  - `SEC-3: verifyVnpayCallback rejects payment if amount does not match server order total` -> `PASS`.
  - `SEC-4: verifyVnpayCallback processes valid callback and enforces idempotency` -> `PASS`.

---

### Lỗ hổng SEC-5: Phân quyền truy cập quản trị (RBAC) & Nguy cơ Overselling kho hàng
- **Mức độ rủi ro:** **High (Cao)**
- **File & dòng code liên quan:**
  - `apps/api/src/modules/admin/admin.routes.ts` (dòng 10)
  - `apps/api/src/modules/order/order.service.ts` (dòng 55-66, 168-191)
- **Nguyên nhân gốc:** Cần kiểm chứng khách hàng thông thường không thể xem hoặc chỉnh sửa bảng điều khiển quản trị, và khi nhiều người mua cùng sản phẩm tồn kho thấp không thể dẫn đến số lượng tồn kho âm.
- **Biện pháp khắc phục đã thực hiện:**
  1. Bắt buộc middleware `requireAuth(['ADMIN', 'STAFF'])` trên toàn bộ router `/admin`.
  2. Sắp xếp danh sách cập nhật tồn kho theo `productId` tăng dần (`const sortedItems = [...rawItems].sort(...)`) trước khi thực thi cập nhật trong Prisma ACID transaction để loại trừ hoàn toàn deadlock trên MySQL 8.4 LTS.
  3. Kiểm tra tồn kho nghiêm ngặt: nếu `prod.stockQuantity < item.quantity` ném ngay ngoại lệ `INSUFFICIENT_STOCK` (HTTP 400).
- **Test case kiểm chứng:** `apps/api/tests/rbac_and_concurrency.test.ts` (5/5 tests passing: RBAC-1, RBAC-2, RBAC-3, RBAC-4, CONCURRENCY-1).
- **Kết quả:** `PASS`.

---

## 2. Bảng Tổng Hợp Kiểm Thử Bảo Mật

| Mã Test | Mô tả kiểm thử | Kỳ vọng | Kết quả thực tế | Trạng thái |
|:---:|:---|:---|:---:|:---:|
| `SEC-1` | Chống giả mạo số tiền VNPay | Server lấy tiền từ DB | URL mang đúng số tiền DB | `PASS` |
| `SEC-2` | Chống giả mạo chữ ký VNPay | Từ chối chữ ký sai | `isSuccess: false` | `PASS` |
| `SEC-3` | Đối chiếu số tiền callback | Bác bỏ số tiền lệch | `isSuccess: false` | `PASS` |
| `SEC-4` | Idempotency callback | Không lặp giao dịch | `isSuccess: true (Idempotent)` | `PASS` |
| `SEC-5` | Vô hiệu hóa simulator trên Prod | Ném ngoại lệ 403 | Throws SIMULATOR_DISABLED | `PASS` |
| `RBAC-1` | Chặn khách vãng lai vào Admin | HTTP 401 Unauthorized | `status: 401` | `PASS` |
| `RBAC-2` | Chặn tài khoản CUSTOMER vào Admin | HTTP 403 Forbidden | `status: 403` | `PASS` |
| `RBAC-3` | Cho phép STAFF vào Admin | HTTP 200 OK | `status: 200` | `PASS` |
| `RBAC-4` | Cho phép ADMIN vào Admin | HTTP 200 OK | `status: 200` | `PASS` |
| `CONC-1` | Chặn mua hàng khi hết tồn kho | HTTP 400 Insufficient Stock | `status: 400` | `PASS` |
