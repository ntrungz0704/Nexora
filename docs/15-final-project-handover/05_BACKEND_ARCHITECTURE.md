# 05. Backend Architecture (`apps/api`)

## 1. Tổng quan Modular Monolith

- **Runtime:** Node.js v22 + Express 5.3.0 + TypeScript 5.9 (ESM `"type": "module"`).
- **Entrypoint:** `apps/api/src/server.ts` khởi tạo `createApp()` từ `apps/api/src/app.ts`, lắng nghe trên `API_PORT` (mặc định `3000`).
- **Kiến trúc phân lớp theo module:** `routes → controller → service → (repository) → Prisma ORM → MySQL 8.4`.
- **Global Middlewares (`app.ts`):**
  1. `app.disable('x-powered-by')`
  2. `helmet()` (security HTTP headers)
  3. `cors({ origin: allowlist, credentials: true })` đọc từ `CORS_ALLOWED_ORIGINS`
  4. `express.json({ limit: '1mb' })`
  5. Swagger UI tại `GET /api/docs` và OpenAPI JSON tại `GET /api/docs.json`
  6. Router v1 gắn tại `/api/v1` (`NEXORA_API_V1_PREFIX`)
  7. `notFoundHandler` + `errorHandler` (chuẩn hóa JSON envelope `{ success: false, error: { code, message } }`, không rò rỉ stack trace).
- **BigInt Serialization Patch:** `app.ts:14-22` định nghĩa `BigInt.prototype.toJSON` trả về `Number(this)` để serialize các khóa chính `BIGINT UNSIGNED` (`Order.id`, `Cart.id`, `InventoryLog.id`, ...).

## 2. Danh sách 11 Backend Domain Modules (`apps/api/src/modules/`)

| Module      | Files                                                                                       | Vai trò chính                                                                             | Dùng shared `getPrismaClient()`?           |
| ----------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------ |
| `admin`     | `admin.controller.ts`, `admin.routes.ts`, `admin.service.ts`                                | Quản trị tổng thể Single-Vendor (Dashboard, CRUD 9 tài nguyên, Inventory, Users, Reviews) | **KHÔNG** (tạo `new PrismaClient()` riêng) |
| `ai`        | `ai.controller.ts`, `ai.routes.ts`, `ai.service.ts`                                         | 4 công cụ AI (Chatbot, 5-Step Survey, AI Compare, Product AI Chat)                        | **KHÔNG** (tạo `new PrismaClient()` riêng) |
| `auth`      | `auth.controller.ts`, `auth.middleware.ts`, `auth.routes.ts`, `auth.service.ts`             | JWT Auth, Register, Login, Forgot/Reset Password, RBAC middleware                         | CÓ / Không dùng Prisma trực tiếp           |
| `cart`      | `cart.controller.ts`, `cart.routes.ts`, `cart.service.ts`                                   | Giỏ hàng cho cả Guest (session header) và Customer (userId)                               | CÓ / Không dùng Prisma trực tiếp           |
| `catalog`   | `catalog.controller.ts`, `catalog.repository.ts`, `catalog.routes.ts`, `catalog.service.ts` | Categories, Brands, Banners, Products search/filter/detail/featured/flash-sale            | CÓ / Không dùng Prisma trực tiếp           |
| `email`     | `email.service.ts`                                                                          | Nodemailer SMTP & Ethereal/Test transport cho email reset password                        | CÓ / Không dùng Prisma trực tiếp           |
| `marketing` | `marketing.controller.ts`, `marketing.routes.ts`, `marketing.service.ts`                    | Coupons validation, Active Flash Sale, Posts/News, Public Reviews                         | **KHÔNG** (tạo `new PrismaClient()` riêng) |
| `order`     | `order.controller.ts`, `order.routes.ts`, `order.service.ts`                                | Tạo đơn nguyên tử (atomic stock decrement), track, my-orders, cancel + hoàn kho           | **KHÔNG** (tạo `new PrismaClient()` riêng) |
| `payment`   | `payment.controller.ts`, `payment.routes.ts`, `payment.service.ts`                          | VNPay HMAC-SHA512 create URL, callback verify idempotent, dev simulator                   | **KHÔNG** (tạo `new PrismaClient()` riêng) |
| `system`    | `system.controller.ts`, `system.repository.ts`, `system.routes.ts`, `system.service.ts`     | Healthcheck DB connectivity, System Meta, Zod Echo Check                                  | CÓ / Không dùng Prisma trực tiếp           |
| `wishlist`  | `wishlist.controller.ts`, `wishlist.routes.ts`, `wishlist.service.ts`                       | Wishlist cô lập theo authenticated Customer                                               | CÓ / Không dùng Prisma trực tiếp           |

## 3. Các vấn đề kiến trúc Backend cần lưu ý

1. **6 PrismaClient instances độc lập:** `common/prisma.ts` cung cấp singleton `getPrismaClient()`, nhưng 5 service lớn (`admin`, `ai`, `marketing`, `order`, `payment`) lại tự gọi `const prisma = new PrismaClient()` ở top-level → nhân 6 số connection pool tới MySQL 8.4.
2. **Thiếu Repository layer ở một số module:** `catalog`, `system` tách riêng `*.repository.ts`, còn `admin`, `ai`, `order`, `payment`, `marketing` gọi trực tiếp Prisma trong `*.service.ts`.
3. **Thiếu Rate Limiting & Cookie Parser runtime:** Cả `express-rate-limit` và `cookie-parser` đã cài trong `apps/api/package.json` nhưng chưa mount trong `app.ts` hay routes.
4. **Cấu hình Env phân tán:** `config/env.ts` validate chặt các biến lõi bằng Zod, nhưng `VNPAY_HASH_SECRET`, `VNPAY_TMN_CODE`, `GEMINI_API_KEY`, `SMTP_*` được đọc trực tiếp qua `process.env` tại từng service thay vì gom vào `EnvSchema`.
