# KIỂM TOÁN AN NINH, PHÂN QUYỀN RBAC & BẢO VỆ DỮ LIỆU
**Tài liệu:** `08_SECURITY_RBAC_AND_DATA_PROTECTION.md`  
**Dự án:** Nexora  

---

## 1. Hệ Thống Xác Thực & Phân Quyền (RBAC)

- **Mật khẩu an toàn:** 100% mật khẩu được băm (hash) bằng giải thuật **Argon2id** với salt ngẫu nhiên, kháng cự tấn công Rainbow Tables và GPU Brute-force.
- **Phân quyền tại máy chủ (Server-side RBAC):** Mọi endpoint nhạy cảm (tạo sản phẩm, sửa đơn hàng, xem báo cáo doanh thu) đều được bảo vệ bởi middleware `requireRole(['STAFF', 'ADMIN'])`. Hệ thống không bao giờ tin cậy trạng thái phân quyền chỉ dựa vào việc ẩn/hiện nút trên giao diện người dùng.
- **Bảo mật cơ chế quên mật khẩu (Atomic Password Reset):**
  - Token ngẫu nhiên độ dài 64 ký tự hex được sinh bằng module `crypto` chuẩn mật mã học.
  - Token không bao giờ được trả về trong HTTP response; chỉ gửi qua email người dùng bằng SMTP/Resend.
  - Sử dụng giao dịch MySQL `SELECT ... FOR UPDATE` khi kiểm tra token: Khi token đã được dùng 1 lần (`usedAt != null`), nó lập tức bị thu hồi; các request đồng thời khác sẽ bị từ chối với mã lỗi `TOKEN_ALREADY_USED`.

---

## 2. Phòng Chống Tấn Công Phổ Biến

- **Chống IDOR (Insecure Direct Object Reference):** Khách hàng A chỉ có thể truy vấn đơn hàng hoặc danh sách yêu thích của chính mình. Nếu truyền ID của khách hàng B, backend lập tức trả về mã lỗi `403 FORBIDDEN`.
- **Chống SQL Injection:** 100% câu truy vấn được thực thi thông qua Prisma ORM Parameterized Queries.
- **Chống XSS & Clickjacking:** Tích hợp middleware `helmet` thiết lập các HTTP Security Headers chuẩn mực (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
