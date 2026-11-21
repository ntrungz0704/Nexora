# CHI TIẾT TẦNG BACKEND EXPRESS.JS & CÁC DỊCH VỤ NGHIỆP VỤ

**Tài liệu:** `02_BACKEND_EXPRESS_API_AND_SERVICES.md`  
**Dự án:** Nexora

---

## 1. Cấu Trúc Phân Lớp Backend

Ứng dụng `apps/api` xây dựng trên nền Node.js + Express.js + TypeScript, phân chia thành các lớp chức năng rành mạch:

- **Routes Layer (`routes.ts`):** Khai báo các đường dẫn HTTP, gắn kết các middleware xác thực JWT, RBAC và rate limiting.
- **Controller Layer (`controller.ts`):** Tiếp nhận HTTP Request, gọi tầng Validation, chuyển tham số cho Service và đóng gói HTTP Response theo chuẩn Envelope JSON.
- **Service Layer (`service.ts`):** Chứa toàn bộ quy tắc nghiệp vụ cốt lõi (Business Logic), quản lý giao dịch cơ sở dữ liệu (Transactions), tính toán giá tiền, snapshot đơn hàng, kiểm tra concurrency và gửi email thông báo.
- **Repository / Data Access Layer:** Sử dụng `prisma` client tương tác trực tiếp với cơ sở dữ liệu MySQL 8.4 LTS.

---

## 2. Danh Sách Các Mô-đun Nghiệp Vụ Cốt Lõi

1. **AuthModule (`modules/auth`):** Đăng ký, đăng nhập JWT, hash mật khẩu Argon2, quy trình quên mật khẩu token nguyên tử và tích hợp dịch vụ gửi thư SMTP/Resend.
2. **CatalogModule (`modules/catalog`):** Truy vấn danh mục, thương hiệu, danh sách 650+ sản phẩm, thuật toán lọc đa chiều và sản phẩm Flash Sale.
3. **CartModule (`modules/cart`):** Quản lý giỏ hàng phía máy chủ cho người dùng đã đăng nhập hoặc khách vãng lai thông qua session token.
4. **OrderModule (`modules/orders`):** Xử lý quy trình checkout, khóa tồn kho nguyên tử (`SELECT ... FOR UPDATE`), tính toán chiết khấu coupon, snapshot giá bán & giá vốn.
5. **PaymentModule (`modules/payment`):** Tạo URL thanh toán VNPay Sandbox, kiểm tra chữ ký SHA512 HMAC, xử lý IPN Webhook và kiểm tra quyền sở hữu đơn hàng (Order Ownership Verification).
6. **AdminModule (`modules/admin`):** Thống kê dashboard thời gian thực, CRUD danh mục/thương hiệu/sản phẩm/mã giảm giá/flash sale, quản lý trạng thái đơn hàng và phân quyền người dùng.
7. **AiModule (`modules/ai`):** Hỗ trợ trợ lý ảo Nexora AI tư vấn cấu hình phần cứng và gợi ý linh kiện tương thích.
