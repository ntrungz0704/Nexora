# THANH TOÁN AN TOÀN & BẢO VỆ GIAO DỊCH VÍ / CỔNG THANH TOÁN
**Tài liệu:** `09_PAYMENT_AND_TRANSACTION_SAFETY.md`  
**Dự án:** Nexora  

---

## 1. Phương Thức Thanh Toán COD (Cash On Delivery)

- Khách hàng kiểm tra hàng và thanh toán tiền mặt trực tiếp cho bưu tá khi nhận kiện hàng linh kiện.
- Đơn hàng được tạo ở trạng thái `paymentStatus: 'UNPAID'` và `orderStatus: 'PENDING'`.

---

## 2. Tích Hợp Cổng Thanh Toán VNPay Sandbox

- **Quy trình tạo URL thanh toán:** Tham số thanh toán được sắp xếp theo bảng chữ cái alphabet và tính toán mã băm kiểm tra tính toàn vẹn dữ liệu bằng thuật toán **HMAC SHA-512** với Secret Key bí mật được lưu trong biến môi trường máy chủ.
- **Xác minh quyền sở hữu đơn hàng (Order Ownership Verification):** Khách hàng chỉ có thể khởi tạo yêu cầu thanh toán cho chính đơn hàng mà mình sở hữu. Nếu một người dùng cố tình truyền mã đơn hàng của người khác vào endpoint `/api/v1/payment/create-url`, hệ thống sẽ chặn đứng với mã lỗi `403 ACCESS_DENIED`.
- **Bảo vệ Webhook / IPN:** Khi nhận callback từ VNPay, hệ thống kiểm tra chữ ký HMAC SHA-512. Chỉ khi chữ ký hợp lệ và số tiền thanh toán khớp 100% với giá trị đơn hàng trong cơ sở dữ liệu thì trạng thái mới chuyển sang `paymentStatus: 'PAID'` và `orderStatus: 'CONFIRMED'`.
- **Cơ chế Idempotency:** Xử lý nhiều lần callback cho cùng 1 giao dịch thanh toán không gây ghi trùng hoặc cập nhật sai lệch trạng thái đơn hàng.
