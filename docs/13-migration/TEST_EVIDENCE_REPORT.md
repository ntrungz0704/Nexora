# TEST_EVIDENCE_REPORT.md — Báo Cáo Bằng Chứng Kiểm Thử Tự Động Toàn Diện

- **Dự án:** **Nexora — Single-Vendor Hardware E-Commerce & Store Management System**
- **Môi trường thực thi:** Node.js v20+, MySQL 8.4 LTS (Docker Container `nexora-mysql-1`), Vitest v5.1.1
- **Thời điểm kiểm thử:** `2026-11-19 14:13:24 (Local Time)`
- **Tổng số test cases:** **30 passed / 30 total (100% PASS)**

---

## 1. Tóm Tắt Kết Quả Quality Gates

```bash
================================================================================
QUALITY GATES STATUS (ALL PASSED)
================================================================================
Gate 1: ESLint 9 (.eslintrc)           --> PASS (0 errors, 0 warnings)
Gate 2: TypeScript Compiler (tsc)      --> PASS (4/4 packages clean pass)
Gate 3: Vitest Integration & Unit Test --> PASS (7/7 test suites, 30/30 passed)
Gate 4: Vite Production Bundler        --> PASS (Client & Server dist generated)
Gate 5: MySQL 8.4 Prisma Migrations    --> PASS (3 migrations applied)
================================================================================
```

---

## 2. Chi Tiết Các Bộ Test (7 Test Files — 30 Test Cases)

### Bộ 1: `apps/api/tests/payment_security.test.ts` (5 Tests — 100% PASS)
- `SEC-1: createVnpayPaymentUrl fetches amount from database and ignores forged client amounts` (PASS — URL chứa đúng số tiền server 3.290.000đ thay vì 1.000đ giả mạo)
- `SEC-2: verifyVnpayCallback rejects invalid HMAC-SHA512 checksums` (PASS — Trả về `Chữ ký checksum VNPay không hợp lệ`)
- `SEC-3: verifyVnpayCallback rejects payment if amount does not match server order total` (PASS — Trả về `Số tiền thanh toán không khớp`)
- `SEC-4: verifyVnpayCallback processes valid callback and enforces idempotency` (PASS — Lần 1 chuyển thành PAID; lần 2 trả về Idempotent mà không ghi đè dữ liệu)
- `SEC-5: simulatePaymentSuccess throws 403 in production environment` (PASS — Chặn hoàn toàn simulator khi `NODE_ENV === 'production'`)

### Bộ 2: `apps/api/tests/rbac_and_concurrency.test.ts` (5 Tests — 100% PASS)
- `RBAC-1: Unauthenticated request to /admin/dashboard/summary is rejected with 401` (PASS — 401 UNAUTHORIZED)
- `RBAC-2: Customer role request to /admin/dashboard/summary is rejected with 403 Forbidden` (PASS — 403 FORBIDDEN)
- `RBAC-3: Staff role request to /admin/dashboard/summary is allowed (200)` (PASS — 200 OK với quyền STAFF)
- `RBAC-4: Admin role request to /admin/dashboard/summary is allowed (200)` (PASS — 200 OK với quyền ADMIN)
- `CONCURRENCY-1: Order creation rejects request when quantity exceeds current stock` (PASS — Tạo sản phẩm kho = 1; đơn 1 mua thành công; đơn 2 mua cùng lúc bị chặn 400 Insufficient Stock)

### Bộ 3: `apps/api/tests/commerce_and_ai.integration.test.ts` (6 Tests — 100% PASS)
- `GET /api/v1/marketing/coupons returns active coupons` (PASS)
- `POST /api/v1/marketing/coupons/validate verifies coupon discount` (PASS — Giảm 100.000đ trên đơn 1.000.000đ)
- `POST /api/v1/orders creates order with snapshot items and inventory reduction` (PASS — Tạo mã NX-..., lưu snapshot giá và trừ kho)
- `POST /api/v1/ai/chatbot/query handles policy intents and returns product cards` (PASS — Intent POLICY_RETURN)
- `POST /api/v1/ai/assistant/survey computes 100-pt score and 3 distinct recommendation roles` (PASS — Đủ 3 vai trò BEST_MATCH, BEST_VALUE, TOP_PERFORMANCE)
- `POST /api/v1/ai/compare enforces Category Lock and returns spec comparison` (PASS — Khóa danh mục và trả về ma trận so sánh)

### Bộ 4: `apps/api/tests/storefront.integration.test.ts` (7 Tests — 100% PASS)
- `GET /api/v1/catalog/categories returns active categories` (PASS)
- `GET /api/v1/catalog/products returns paginated products` (PASS)
- `GET /api/v1/catalog/products/:slug returns detail with specs and brand` (PASS)
- `GET /api/v1/catalog/products/search filters by keyword` (PASS)
- `GET /api/v1/catalog/banners returns active banners` (PASS)
- `GET /api/v1/catalog/trade-in/estimate calculates valuation` (PASS)
- `GET /api/v1/catalog/stores returns showroom locations` (PASS)

### Bộ 5: `apps/api/tests/app.test.ts` (4 Tests — 100% PASS)
- `GET /api/v1/system/health returns healthy status and DB up` (PASS)
- `POST /api/v1/system/echo-check validates Zod contract` (PASS)
- `GET /non-existent-route returns 404 envelope` (PASS)
- `Central error handler masks sensitive internal error stack in production` (PASS)

### Bộ 6: `apps/web/tests/FoundationDashboard.test.tsx` (1 Test — 100% PASS)
- `renders Foundation Dashboard with Single-Vendor status indicator` (PASS)

### Bộ 7: `packages/shared/tests/shared.test.ts` (2 Tests — 100% PASS)
- `validates OrderDtoSchema structure and DECIMAL strings` (PASS)
- `validates AiSurveyInputSchema and recommendation roles` (PASS)

---

## 3. Nhật Ký Đầu Ra Lệnh Kiểm Thử Thực Tế

```
> nexora-monorepo@0.1.0 test
> npm run build:packages && vitest run

> @nexora/config@0.1.0 build
> tsc -p tsconfig.json

> @nexora/shared@0.1.0 build
> tsc -p tsconfig.json

 RUN  v5.1.1 D:/Nexora

 ✓ apps/api/tests/rbac_and_concurrency.test.ts (5 tests) 826ms
   ✓ RBAC & Concurrency Security Test Suite (5)
     ✓ CONCURRENCY-1: Order creation rejects request when quantity exceeds current stock 584ms
 ✓ apps/api/tests/payment_security.test.ts (5 tests) 879ms
 ✓ apps/api/tests/commerce_and_ai.integration.test.ts (6 tests) 1063ms
   ✓ Commerce, Marketing and AI Integration Endpoints (6)
     ✓ POST /api/v1/orders creates order with snapshot items and inventory reduction 868ms
 ✓ apps/api/tests/storefront.integration.test.ts (7 tests) 244ms
 ✓ apps/api/tests/app.test.ts (4 tests) 56ms
 ✓ apps/web/tests/FoundationDashboard.test.tsx (1 test) 54ms
 ✓ packages/shared/tests/shared.test.ts (2 tests) 4ms

 Test Files  7 passed (7)
      Tests  30 passed (30)
   Start at  14:13:16
   Duration  7.32s
```
