# 08 — Authentication, Authorization, and Security

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-08`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM CODE, TESTS & LIVE CONFIG`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Cơ Chế Xác Thực Người Dùng (Authentication Architecture)

Hệ thống xác thực người dùng trong Nexora được triển khai dựa trên chuẩn **JSON Web Token (JWT)** không lưu trạng thái (Stateless Authentication):

- **Thư viện triển khai:** `jsonwebtoken` kết hợp với `bcryptjs`.
- **Cấu trúc Token Payload:**
  ```json
  {
    "sub": 3,
    "email": "customer@nexora.local",
    "role": "CUSTOMER",
    "iat": 1732370000,
    "exp": 1732974800
  }
  ```
- **Thời hạn Token (TTL):** Mặc định có hiệu lực trong vòng **7 ngày** kể từ thời điểm phát hành.
- **Khóa ký bảo mật:** Sử dụng chuỗi bí mật `AUTH_SECRET` (bắt buộc tối thiểu 32 ký tự, được kiểm tra nghiêm ngặt qua Zod Env Schema tại `apps/api/src/config/env.ts`).
- **Lưu trữ phía Client:** Token được lưu trong `localStorage` với key `nexora_token`, và thông tin người dùng lưu tại `nexora_user`. Mọi yêu cầu HTTP cần xác thực đều đính kèm qua header: `Authorization: Bearer <token>`.

---

## 2. Kiểm Toán Chuyên Sâu: Tình Trạng Google OAuth

Yêu cầu kiểm toán đặc biệt từ Project Owner: Làm rõ sự thật tuyệt đối về trạng thái triển khai đăng nhập qua Google.

### A. Kiểm tra thực tế tại Frontend
1. **Tại trang Đăng nhập (`apps/web/src/features/auth/LoginPage.tsx` dòng 148 – 156):**
   ```tsx
   {/* Google Login */}
   <button
     type="button"
     className="auth-btn-google"
     onClick={() => {
       setErrorMsg('Đăng nhập qua Google hiện đang được nâng cấp bảo mật SSO.');
     }}
   >
     ... Tiếp tục với Google
   </button>
   ```
   *Thực tế:* Nút bấm Google có giao diện trực quan hoàn chỉnh theo nhận diện Google (Logo 4 màu, styling đẹp mắt), nhưng khi người dùng bấm vào chỉ hiển thị thông báo lỗi/thông tin: *"Đăng nhập qua Google hiện đang được nâng cấp bảo mật SSO."* Không có bất kỳ lệnh gọi OAuth nào ra ngoài.

2. **Tại trang Đăng ký (`apps/web/src/features/auth/RegisterPage.tsx` dòng 327 – 340):**
   ```tsx
   {/* Google Login */}
   <button
     type="button"
     className="auth-btn-google"
     onClick={() => {
       authService
         .login({ email: 'customer@nexora.vn', password: 'password123' })
         .then(() => {
           navigate('/');
         });
     }}
   >
     ... Tiếp tục với Google
   </button>
   ```
   *Thực tế:* Nút bấm Google có giao diện, nhưng sự kiện `onClick` đang bị **MOCK CỨNG (HARDCODED)** gọi API đăng nhập tài khoản mẫu `customer@nexora.vn` / `password123` thay vì kích hoạt luồng OAuth SSO thực thụ.

### B. Kiểm tra thực tế tại Backend API
- **Tệp định tuyến Auth (`apps/api/src/modules/auth/auth.routes.ts`):** Chỉ có 5 endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/me`). Hoàn toàn **KHÔNG CÓ** endpoint nào dành cho OAuth (như `/google`, `/google/callback`).
- **Thư viện phụ thuộc (`package.json`):** Hoàn toàn **KHÔNG CÓ** các thư viện OAuth như `passport`, `passport-google-oauth20`, hoặc `google-auth-library`.
- **Biến môi trường (`env.ts`):** Hoàn toàn **KHÔNG CÓ** định nghĩa cho `GOOGLE_CLIENT_ID` hay `GOOGLE_CLIENT_SECRET`.

### C. Kết luận phân loại chính thức
- **Trạng thái kỹ thuật:** `UI ONLY / MOCKED`.
- **Bản chất:** Tính năng Google OAuth chỉ mới dừng lại ở tầng thiết kế giao diện (UI buttons) và xử lý giả lập (mock fallback); hoàn toàn chưa có cấu hình và chưa có dịch vụ Backend xử lý.
- **Khuyến nghị:** Cần đăng ký Google Cloud Project, lấy Client ID/Secret và triển khai luồng OAuth 2.0 chuẩn ở Phase tiếp theo trước khi công bố tính năng này ra người dùng thực.

---

## 3. Phân Quyền Vai Trò (Role-Based Access Control - RBAC)

Hệ thống quản lý phân quyền theo 3 cấp độ vai trò trong cơ sở dữ liệu (`UserRole` Enum):

| Vai trò người dùng | Mô tả phạm vi quyền hạn | Cơ chế bảo vệ phía Backend | Cơ chế bảo vệ phía Frontend |
| :--- | :--- | :--- | :--- |
| `Guest` | Khách vãng lai chưa đăng nhập | Không có token, chỉ gọi được Public APIs | Sử dụng `x-guest-session-id` quản lý giỏ hàng tạm |
| `CUSTOMER` | Khách hàng mua sắm đã có tài khoản | Middleware `requireAuth()` | Truy cập các trang cá nhân `/profile/*`, chặn vào `/admin` |
| `STAFF` | Nhân viên vận hành kỹ thuật & kho | Middleware `requireRole(['STAFF', 'ADMIN'])` | Được phép vào trang Quản trị `/admin`, xử lý đơn & kho |
| `ADMIN` | Quản trị viên tối cao của cửa hàng | Middleware `requireRole(['ADMIN'])` | Toàn quyền kiểm soát hệ thống, tài chính, nhân sự, settings |

### Phòng Thủ Chiều Sâu (Defense in Depth)
- **Không tin tưởng Client:** Việc ẩn hiện nút bấm hay chặn route trên React chỉ nhằm mục đích nâng cao trải nghiệm người dùng (UX). Toàn bộ 49 API Quản trị tại `/api/v1/admin/*` đều được kiểm soát bởi middleware `requireRole` tại tầng mạng máy chủ. Bất kỳ request nào giả mạo hoặc có role `CUSTOMER` đều bị từ chối ngay lập tức với mã lỗi `403 Forbidden`.

---

## 4. Bảo Vệ Cache Đa Tab & Xóa Cache Khi Đăng Xuất (CR-M6.5-01)

Được hoàn thiện và nghiệm thu tuyệt đối trong Change Request `CR-M6.5-01`:

### A. Registry 18 Tiền Tố Query Riêng Tư (18 Private Prefixes)
Hệ thống thiết lập danh mục đầy đủ 18 tiền tố truy vấn chứa dữ liệu cá nhân nhạy cảm:
1. `my-profile` (Hồ sơ người dùng)
2. `my-orders` (Lịch sử đơn hàng)
3. `order-detail` (Chi tiết đơn hàng)
4. `cart` (Giỏ hàng cá nhân)
5. `wishlist` (Sản phẩm yêu thích)
6. `my-returns` (Yêu cầu đổi trả cá nhân)
7. `return-detail` (Chi tiết hồ sơ đổi trả)
8. `notifications` (Thông báo cá nhân)
9. `customer-addresses` (Sổ địa chỉ nhận hàng)
10. `user-reviews` (Đánh giá của người dùng)
11. `admin-dashboard` (Chỉ số quản trị)
12. `admin-products` (Quản trị sản phẩm)
13. `admin-categories` (Quản trị danh mục)
14. `admin-brands` (Quản trị thương hiệu)
15. `admin-orders` (Quản trị đơn hàng)
16. `admin-returns` (Quản trị đổi trả)
17. `admin-reviews` (Kiểm duyệt đánh giá)
18. `admin-users` (Quản trị tài khoản)

### B. Quy trình xóa sạch Cache khi Đăng xuất (Logout Invalidation)
Khi người dùng bấm "Đăng xuất" hoặc khi Tab khác phát hiện đăng xuất:
1. Gọi `queryClient.cancelQueries()` để hủy bỏ toàn bộ các request đang bay thuộc 18 tiền tố trên.
2. Gọi `queryClient.removeQueries()` để xóa triệt để dữ liệu khỏi bộ nhớ RAM của trình duyệt.
3. Giữ nguyên Public Cache (`products`, `categories`, `brands`, `banners`) giúp trang chủ tải nhanh mà không rò rỉ dữ liệu riêng tư.

### C. Đồng bộ phiên Đa Tab (Cross-Tab Session Synchronization)
- Lắng nghe sự kiện `window.addEventListener('storage', ...)` tại `apps/web/src/app/providers.tsx`.
- Khi Tab A đăng nhập hoặc đăng xuất, Tab B nhận diện sự kiện, cập nhật trạng thái cache và tự động tăng `sessionEpoch`.
- Nhờ `<Fragment key={sessionEpoch}>`, toàn bộ cây giao diện React được remount tự nhiên, Header cập nhật tức thì họ tên người dùng mới mà không làm reload toàn bộ trang web.

---

## 5. Các Biện Pháp Bảo Mật Khác Đã Triển Khai (Security Controls Matrix)

| Biện pháp bảo vệ | Công nghệ / Cách thức thực hiện | Trạng thái kỹ thuật |
| :--- | :--- | :--- |
| **Mã hóa Mật khẩu** | `bcryptjs` với độ phức tạp 10 salt rounds | `IMPLEMENTED & VERIFIED` |
| **Chống SQL Injection** | Sử dụng Prisma ORM sinh câu lệnh tham số hóa (Prepared Statements) | `IMPLEMENTED & VERIFIED` |
| **Chống Brute-force** | `express-rate-limit` trên các endpoint đăng nhập, đăng ký, quên mật khẩu | `IMPLEMENTED & VERIFIED` |
| **Chống tấn công IDOR** | Xác thực sở hữu tài nguyên (UserId trong JWT so với UserId của bản ghi) | `IMPLEMENTED & VERIFIED` |
| **Bảo vệ HTTP Headers** | Thư viện `helmet` tự động bật CSP, HSTS, X-Content-Type-Options | `IMPLEMENTED & VERIFIED` |
| **Kiểm soát CORS** | Giới hạn truy cập nghiêm ngặt theo `CORS_ALLOWED_ORIGINS` | `IMPLEMENTED & VERIFIED` |
| **Xác thực Chữ ký Thanh toán** | Cổng VNPay kiểm tra chữ ký băm `HMAC-SHA512` chống sửa đổi số tiền | `IMPLEMENTED & VERIFIED` |
| **Xử lý Xung đột Ghi (Locking)** | MySQL InnoDB `SELECT ... FOR UPDATE` chống race condition giỏ hàng và kho | `IMPLEMENTED & VERIFIED` |
| **Không Lộ Stack Trace** | Middleware `errorHandler` ẩn thông tin debug khi chạy môi trường `production` | `IMPLEMENTED & VERIFIED` |
