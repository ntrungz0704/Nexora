# API CONTRACT & RESTFUL DESIGN AUDIT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Chuẩn API:** RESTful JSON Envelope Specification
- **Ngày kiểm toán:** 20/11/2026
- **Trạng thái:** **VERIFIED PASS (100% ENDPOINTS ĐẠT CHUẨN ENVELOPE & VALIDATION)**

---

## 1. MỤC TIÊU KIỂM TOÁN GIAO DIỆN API

Kiểm toán này đánh giá việc thiết kế và triển khai hệ thống REST API của Nexora tại `apps/api/src`, đảm bảo:

1. Tính nhất quán của định dạng phản hồi (Response Envelope) trên toàn bộ endpoints.
2. Việc sử dụng mã trạng thái HTTP chuẩn mực (200, 201, 400, 401, 403, 404, 500).
3. Cơ chế kiểm thực dữ liệu đầu vào (Input Validation) bằng Zod schemas.
4. Cơ chế xử lý lỗi tập trung và bảo mật thông tin nội bộ (không rò rỉ stack trace).

---

## 2. CHUẨN PHẢN HỒI JSON ENVELOPE (CANONICAL RESPONSE FORMAT)

Toàn bộ các API endpoints của Nexora tuân thủ định dạng JSON Envelope thống nhất:

### Phản hồi thành công:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-11-20T14:30:00.000Z"
}
```

### Phản hồi thất bại:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu gửi lên không hợp lệ",
    "details": [
      {
        "field": "email",
        "message": "Email không đúng định dạng"
      }
    ]
  },
  "timestamp": "2026-11-20T14:30:00.000Z"
}
```

---

## 3. DANH MỤC API ENDPOINTS THEO 10 ROUTER CHÍNH

Tất cả các API được đăng ký dưới tiền tố `/api/v1`:

### 3.1. Phân Hệ Xác Thực (`/api/v1/auth`)

| Phương thức | Đường dẫn                      | Quyền truy cập | Mô tả chức năng                         |
| :---------: | :----------------------------- | :------------: | :-------------------------------------- |
|   `POST`    | `/api/v1/auth/register`        |     Public     | Đăng ký tài khoản khách hàng mới        |
|   `POST`    | `/api/v1/auth/login`           |     Public     | Đăng nhập tài khoản, trả về JWT Token   |
|    `GET`    | `/api/v1/auth/me`              | Authenticated  | Lấy thông tin tài khoản đang đăng nhập  |
|    `PUT`    | `/api/v1/auth/profile`         | Authenticated  | Cập nhật họ tên, số điện thoại, địa chỉ |
|   `POST`    | `/api/v1/auth/forgot-password` |     Public     | Gửi yêu cầu cấp lại mật khẩu            |
|   `POST`    | `/api/v1/auth/reset-password`  |     Public     | Đặt lại mật khẩu với token xác thực     |

### 3.2. Phân Hệ Sản Phẩm (`/api/v1/products`)

| Phương thức | Đường dẫn                      | Quyền truy cập | Mô tả chức năng                                        |
| :---------: | :----------------------------- | :------------: | :----------------------------------------------------- |
|    `GET`    | `/api/v1/products`             |     Public     | Danh sách sản phẩm (hỗ trợ search, filter, pagination) |
|    `GET`    | `/api/v1/products/:idOrSlug`   |     Public     | Lấy chi tiết sản phẩm kèm thông số kỹ thuật            |
|    `GET`    | `/api/v1/products/featured`    |     Public     | Lấy danh sách sản phẩm nổi bật / bán chạy              |
|    `GET`    | `/api/v1/products/related/:id` |     Public     | Lấy danh sách sản phẩm tương tự cùng danh mục          |

### 3.3. Phân Hệ Danh Mục & Thương Hiệu (`/api/v1/categories`, `/api/v1/brands`)

| Phương thức | Đường dẫn            | Quyền truy cập | Mô tả chức năng               |
| :---------: | :------------------- | :------------: | :---------------------------- |
|    `GET`    | `/api/v1/categories` |     Public     | Cây danh mục sản phẩm đa tầng |
|    `GET`    | `/api/v1/brands`     |     Public     | Danh sách thương hiệu đối tác |

### 3.4. Phân Hệ Đơn Hàng (`/api/v1/orders`)

| Phương thức | Đường dẫn                           | Quyền truy cập | Mô tả chức năng                                      |
| :---------: | :---------------------------------- | :------------: | :--------------------------------------------------- |
|   `POST`    | `/api/v1/orders`                    | Optional Auth  | Đặt hàng mới (hỗ trợ cả khách vãng lai và đăng nhập) |
|    `GET`    | `/api/v1/orders`                    | Authenticated  | Danh sách lịch sử đơn hàng của tài khoản             |
|    `GET`    | `/api/v1/orders/:id`                | Authenticated  | Chi tiết đơn hàng (có kiểm tra quyền sở hữu IDOR)    |
|    `GET`    | `/api/v1/orders/track/:orderNumber` |     Public     | Tra cứu công khai tiến trình giao hàng theo mã đơn   |
|   `POST`    | `/api/v1/orders/:id/cancel`         | Authenticated  | Khách hàng hủy đơn hàng (chỉ khi đơn còn PENDING)    |

### 3.5. Phân Hệ Giỏ Hàng (`/api/v1/cart`)

| Phương thức | Đường dẫn                | Quyền truy cập | Mô tả chức năng                                |
| :---------: | :----------------------- | :------------: | :--------------------------------------------- |
|    `GET`    | `/api/v1/cart`           | Authenticated  | Lấy danh sách giỏ hàng đã đồng bộ trên máy chủ |
|   `POST`    | `/api/v1/cart/items`     | Authenticated  | Thêm sản phẩm vào giỏ hàng                     |
|    `PUT`    | `/api/v1/cart/items/:id` | Authenticated  | Thay đổi số lượng mua trong giỏ                |
|  `DELETE`   | `/api/v1/cart/items/:id` | Authenticated  | Xóa sản phẩm khỏi giỏ                          |

### 3.6. Phân Hệ Thanh Toán Cổng VNPay (`/api/v1/payments`)

| Phương thức | Đường dẫn                           | Quyền truy cập | Mô tả chức năng                                        |
| :---------: | :---------------------------------- | :------------: | :----------------------------------------------------- |
|   `POST`    | `/api/v1/payments/vnpay/create-url` | Authenticated  | Tạo URL chuyển hướng sang cổng thanh toán VNPay        |
|    `GET`    | `/api/v1/payments/vnpay/return`     |     Public     | Nhận kết quả khách hàng quay về từ cổng VNPay          |
|   `POST`    | `/api/v1/payments/vnpay/ipn`        |     Public     | Webhook máy chủ - máy chủ cập nhật trạng thái đơn hàng |
|   `POST`    | `/api/v1/payments/simulate`         | Test/Dev Only  | Mô phỏng thanh toán (Bị chặn ở Production)             |

### 3.7. Phân Hệ Trợ Lý AI (`/api/v1/ai`)

| Phương thức | Đường dẫn            | Quyền truy cập | Mô tả chức năng                                    |
| :---------: | :------------------- | :------------: | :------------------------------------------------- |
|   `POST`    | `/api/v1/ai/chat`    |     Public     | Trò chuyện với trợ lý ảo phần cứng                 |
|   `POST`    | `/api/v1/ai/survey`  |     Public     | Gửi câu trả lời khảo sát và nhận 3 sản phẩm tối ưu |
|   `POST`    | `/api/v1/ai/compare` |     Public     | Đánh giá so sánh 2-4 sản phẩm theo Persona         |

### 3.8. Phân Hệ Quản Trị Hệ Thống (`/api/v1/admin`)

| Phương thức | Đường dẫn                           | Quyền truy cập | Mô tả chức năng                                       |
| :---------: | :---------------------------------- | :------------: | :---------------------------------------------------- |
|    `GET`    | `/api/v1/admin/stats/overview`      |  Admin/Staff   | Thống kê tổng quan: Doanh thu, Đơn hàng, Tồn kho      |
|    `GET`    | `/api/v1/admin/stats/revenue-7days` |  Admin/Staff   | Doanh thu 7 ngày gần nhất biểu diễn dạng realtime     |
|    `GET`    | `/api/v1/admin/inventory/alerts`    |  Admin/Staff   | Danh sách sản phẩm sắp hết hàng (<10) và hết hàng (0) |
|   `POST`    | `/api/v1/admin/products`            |  Admin/Staff   | Thêm mới sản phẩm phần cứng                           |
|    `PUT`    | `/api/v1/admin/products/:id`        |  Admin/Staff   | Cập nhật thông tin, giá, thông số sản phẩm            |
|    `PUT`    | `/api/v1/admin/orders/:id/status`   |  Admin/Staff   | Cập nhật trạng thái xử lý đơn hàng                    |
|   `POST`    | `/api/v1/admin/coupons`             |  Admin/Staff   | Tạo mới mã giảm giá khuyến mãi                        |

---

## 4. XỬ LÝ LỖI TẬP TRUNG (CENTRALIZED ERROR HANDLING)

- **Middleware:** `apps/api/src/middleware/error.middleware.ts`
- **Nguyên tắc bảo vệ an toàn thông tin:**
  - Bắt toàn bộ ngoại lệ phát sinh không kiểm soát (`unhandled errors`, `PrismaClientKnownRequestError`, `ZodError`).
  - Trong môi trường `production`: Ẩn hoàn toàn thông tin chi tiết về cơ sở dữ liệu và Call Stack trace. Chỉ trả về mã lỗi tổng quát `INTERNAL_SERVER_ERROR`.
  - Trong môi trường `development`/`test`: Trả về chi tiết `error.stack` phục vụ mục đích gỡ lỗi (debug).

---

## 5. KẾT LUẬN KIỂM TOÁN API

Hệ thống API RESTful của Nexora được thiết kế chuyên nghiệp, có tính cấu trúc cao, tuân thủ hoàn toàn các nguyên tắc RESTful hiện đại và bảo vệ nghiêm ngặt chống rò rỉ dữ liệu nhạy cảm.
