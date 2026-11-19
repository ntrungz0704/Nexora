# API_MIGRATION_MAPPING.md — Bản Đồ Ánh Xạ REST API

Tài liệu này ánh xạ các action của Controller trong TechPilot PHP sang REST API Express.js chuẩn hóa của Nexora kèm Envelope phản hồi JSON và Zod Schema xác thực đầu vào.

---

## 1. Chuẩn Envelope Phản Hồi Toàn Hệ Thống

Tất cả các API của Nexora đều tuân thủ cấu trúc envelope chuẩn (`@nexora/shared`):

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-19T12:00:00.000Z",
    "requestId": "req_uuid_12345"
  }
}
```

Trường hợp lỗi:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu đầu vào không hợp lệ",
    "details": [
      { "field": "email", "issue": "Email không đúng định dạng" }
    ]
  }
}
```

---

## 2. Danh Sách Ánh Xạ Chi Tiết

| Chức năng PHP cũ | Endpoint PHP cũ | Phương thức & URL REST API mới (Nexora) | Zod Schema xác thực |
|:---|:---|:---|:---|
| **Đăng nhập** | `POST /auth/login` | `POST /api/v1/auth/login` | `LoginRequestSchema` |
| **Đăng ký** | `POST /auth/register` | `POST /api/v1/auth/register` | `RegisterRequestSchema` |
| **Đăng xuất** | `GET /auth/logout` | `POST /api/v1/auth/logout` | Không yêu cầu body |
| **Thông tin tài khoản**| `GET /profile` | `GET /api/v1/auth/me` | JWT Bearer token |
| **Danh sách sản phẩm**| `GET /home/search` | `GET /api/v1/storefront/products` | `ProductQuerySchema` |
| **Chi tiết sản phẩm** | `GET /product/detail/{slug}`| `GET /api/v1/storefront/products/{slug}` | Slug param |
| **Danh sách danh mục**| `GET /catalog/categories` | `GET /api/v1/storefront/categories` | Không yêu cầu |
| **Sản phẩm Flash Sale**| `GET /home/flash-sale` | `GET /api/v1/storefront/flash-sale` | Không yêu cầu |
| **Lấy giỏ hàng** | Session array | `GET /api/v1/cart` | Session / JWT |
| **Thêm vào giỏ** | `POST /cart/add` | `POST /api/v1/cart/items` | `AddToCartSchema` |
| **Cập nhật giỏ hàng** | `POST /cart/update` | `PATCH /api/v1/cart/items/{id}` | `UpdateCartItemSchema` |
| **Xóa khỏi giỏ** | `POST /cart/remove` | `DELETE /api/v1/cart/items/{id}` | Id param |
| **Đặt hàng / Checkout**| `POST /checkout/process`| `POST /api/v1/orders` | `CreateOrderSchema` |
| **Tra cứu đơn hàng** | `GET /order/tracking` | `GET /api/v1/orders/{orderCode}` | OrderCode param |
| **Tư vấn AI** | `POST /ai/chat` | `POST /api/v1/ai/consult` | `AiConsultSchema` |
| **Admin tổng quan** | `GET /admin` | `GET /api/v1/admin/dashboard` | `requireRole('ADMIN')` |
