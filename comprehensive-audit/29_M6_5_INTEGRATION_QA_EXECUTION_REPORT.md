# NEXORA — M6.5 INTEGRATION TESTING & QA
## EXECUTION & VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **Baseline & Final HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` *(M6.4 Customer Returns — COMMITTED)*
- **Parent Commit (`HEAD^`):** `e0e517b9da962218b292adb8ca302a4c895590a6` *(M6.3 Customer Reviews — COMMITTED)*
- **Execution Mode:** `CONTROLLED TEST EXECUTION — TEST-ONLY — NO APPLICATION CODE FIXES`
- **Discovery Reference:** [`comprehensive-audit/28_M6_5_INTEGRATION_QA_DISCOVERY.md`](file:///d:/Nexora/comprehensive-audit/28_M6_5_INTEGRATION_QA_DISCOVERY.md)
- **Final Decision:** **`PASS WITH CONDITIONS`**

---

## 1. Executive Summary

Toàn bộ kế hoạch kiểm thử phân tầng M6.5 (Tier 1 DB-Free Baseline, M6.5 Cross-Module Frontend QA Suite mới, Tier 2 Backend MySQL Integration & Security trên database ephemeral `nexora_test:3307`, và Tier 3 Playwright E2E trên `nexora_test:3307`) đã được thực thi đầy đủ trong chế độ **TEST-ONLY** (0 thay đổi mã nguồn ứng dụng, 0 đột biến trên dev database `127.0.0.1:3306/nexora`, 0 commit/push).

### Tổng quan kết quả thực thi (26 files / 308 test cases)

| Tầng kiểm thử | Loại kiểm thử (Layer) | Database sử dụng | Files | Pass | Fail | Skip | Exit Code | Trạng thái |
|---|---|---|---:|---:|---:|---:|---:|---|
| **Tier 1 Baseline** (`npm run test:unit`) | Unit + Mocked Frontend Integration | Không (100% DB-free) | 11 | 115 | 0 | 0 | `0` | **`PASS`** |
| **M6.5 Cross-Module QA** (`m6_5_customer_integration_qa.test.tsx`) | Mocked Frontend Integration (jsdom) | Không (100% DB-free) | 1 | 8 | 0 | 0 | `0` | **`PASS`** *(chỉ mock frontend)* |
| **Tier 2A Backend Integration & Security** (11 suites) | Real API + Real Prisma + Real MySQL 8.4 | Ephemeral `127.0.0.1:3307/nexora_test` | 11 | 175 | 0 | 0 | `0` | **`PASS`** *(real DB)* |
| **Tier 2B DB Connectivity** (`db.integration.test.ts`) | Real Prisma + Real MySQL 8.4 | Ephemeral `127.0.0.1:3307/nexora_test` | 1 | 1 | 0 | 0 | `0` | **`PASS`** *(real DB)* |
| **Tier 3 Playwright E2E** (`npm run test:e2e`) | Real Chromium + Live API + Vite | Ephemeral `127.0.0.1:3307/nexora_test` | 2 | 8 | 1 | 0 | `1` | **`FAIL`** *(1 stale E2E spec trên `/admin` auth gate)* |
| **Monorepo Quality Gates** (`typecheck`, `lint`, `build`, `prettier`) | Static Analysis & Production Build | Không | — | 4/4 | 0 | 0 | `0` | **`PASS`** |
| **TỔNG TEST CASES** | **Đa tầng (đã tách bạch rõ Mock vs Real DB)** | **Cô lập hoàn toàn** | **26** | **307** | **1** | **0** | — | **`PASS WITH CONDITIONS`** |

### Các phát hiện trọng yếu cần Project Owner quyết định

1. **`R-02` (Logout Cache Fragmentation) — `FAIL / BLOCKER` (Đã tái hiện thực nghiệm):** Khi Account A truy cập `/wishlist` (tạo cache key không gắn `userId`: `['wishlist']`) và đăng xuất từ `WishlistPage`, bộ nhớ đệm TanStack Query không bị xóa. Account B đăng nhập trong vòng `staleTime: 30_000` trên cùng SPA instance **nhìn thấy ngay sản phẩm wishlist riêng tư của Account A** mà không gửi bất kỳ request `/api/v1/wishlist` mới nào.
2. **`R-03` (`CheckoutPage` thiếu invalidate `['my-orders']`) — `NEEDS FIX` (Đã tái hiện thực nghiệm):** Sau khi đặt hàng thành công (`POST /api/v1/orders` trả `201`), `CheckoutPage.tsx:162-164` chỉ invalidate `['cart']`, `['products']`, `['admin-data']`, bỏ sót `['my-orders']`. Khách hàng quay lại `/profile/orders` trong vòng 30s chỉ thấy danh sách đơn hàng cũ và không thấy đơn hàng vừa tạo.
3. **Tier 3 Playwright E2E (`Journey 8`) — `FAIL` do test cũ lỗi thời (`stale spec`):** `tests/e2e/storefront_journeys.spec.ts:84-93` mở thẳng `/admin` không đăng nhập và assert thấy Dashboard. Ứng dụng **đã chặn đúng bằng màn hình Admin Login (`Hệ Thống Quản Trị Cửa Hàng`)** — đây là hành vi bảo mật đúng, nhưng test E2E cũ chưa được cập nhật sau khi bật auth gate. Không sửa test cũ trong M6.5 theo quy định TEST-ONLY.
4. **An toàn dữ liệu Dev DB (`127.0.0.1:3306/nexora`):** Xác nhận bằng snapshot trước và sau thực thi — **0 bản ghi bị thay đổi** trên toàn bộ 9 bảng trọng yếu; container ephemeral `nexora-m65-test-mysql` đã bị hủy sạch (`docker rm -fv` exit `0`).

---

## 2. Git Baseline và Final Status

### Pre-Flight & Final Git Verification

Lệnh kiểm tra:
```powershell
git branch --show-current
git rev-parse HEAD
git rev-parse HEAD^
git status --short
git diff --name-status
```

Kết quả quan sát (trước và sau M6.5):

| Tiêu chí | Pre-Flight | Final Status | Khớp chuẩn |
|---|---|---|---|
| Branch | `main` | `main` | `PASS` |
| `HEAD` | `3d8adb18c967400dbc28787a6b8174b9a7cf8213` | `3d8adb18c967400dbc28787a6b8174b9a7cf8213` | `PASS` |
| `HEAD^` | `e0e517b9da962218b292adb8ca302a4c895590a6` | `e0e517b9da962218b292adb8ca302a4c895590a6` | `PASS` |
| Tracked modified files (`git diff --name-status`) | `0` | `0` | `PASS` |
| Staged files | `0` | `0` | `PASS` |
| Commit / Push / History rewrite | Không | Không | `PASS` |

### Danh sách Untracked Files cuối cùng (`git status --short`)

- **File test mới duy nhất được phép tạo trong M6.5:**
  - `?? apps/web/tests/m6_5_customer_integration_qa.test.tsx`
- **Báo cáo mới của M6.5 (nằm trong thư mục untracked `comprehensive-audit/`):**
  - `comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md`
- **Toàn bộ tài liệu & seed files untracked có trước được bảo toàn nguyên vẹn:**
  - `?? FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`
  - `?? M6_1_FINAL_CLOSURE_VERIFICATION.md`
  - `?? M6_2_FINAL_ACCEPTANCE_VERIFICATION.md`
  - `?? M6_2_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md`
  - `?? M6_2_PRE_IMPLEMENTATION_VERIFICATION.md`
  - `?? NEXORA_COMPLETE_REPOSITORY_INVENTORY.md`
  - `?? comprehensive-audit/`
  - `?? prisma/seed_nexora_catalog.sql`
  - `?? prisma/seed_techpilot_full.ts`
- **Artifacts runtime của Playwright:** Thư mục `test-results/` nằm trong `.gitignore:27`, không làm bẩn `git status`.

---

## 3. Docker / Test Environment Setup

### 3.1. Tạo container MySQL 8.4 Ephemeral cho M6.5

- **Container Name:** `nexora-m65-test-mysql`
- **Container ID:** `b099a4926239b182e6620288e872ee2c4bbfaa22a848e1bf8a5c516de33fbafe`
- **Image:** `mysql:8.4`
- **Port Mapping:** `127.0.0.1:3307 -> 3306/tcp`
- **Database:** `nexora_test`
- **Test User:** `nexora_test_user` (chỉ tồn tại trong container ephemeral)
- **Volumes:** Chỉ dùng anonymous container storage mặc định, **0 host bind-mount, 0 mount vào volume của `nexora-mysql-1`**.
- **`.env` bảo toàn:** Không sửa file `.env` gốc (`DATABASE_URL` trong `.env` vẫn nguyên vẹn trỏ vào `nexora:3306`).

### 3.2. Áp dụng Prisma Migrations & Synthetic Seed trên `nexora_test:3307`

Lệnh thực thi với process-level `DATABASE_URL='mysql://nexora_test_user:***@127.0.0.1:3307/nexora_test'`:

1. **`npx prisma migrate deploy`** → Exit code `0` — Áp dụng tuần tự đầy đủ **8/8 migrations**:
   - `20261118162807_init_foundation`
   - `20261118171500_ecommerce_core_schema`
   - `20261118193000_ai_assistant_and_persona_scoring`
   - `20261118223000_add_password_reset_tokens`
   - `20261121113000_phase_b_returns_reviews_addresses_notifications`
   - `20261121140000_add_return_audit_log_and_item_resellable`
   - `20261122143000_add_order_delivered_at_and_return_rejection_reason`
   - `20261122160000_sanitize_unverified_delivered_at`
2. **`npx prisma migrate status`** → Exit code `0` (`Database schema is up to date!`).
3. **`npx tsx prisma/seed.ts`** → Exit code `0` — Khởi tạo synthetic seed chuẩn dự án trên `nexora_test` (`33 products, 16 categories, 9 banners`, 3 tài khoản seed chuẩn). Không copy dữ liệu thật hay chạy `seed_nexora_catalog.sql`.

---

## 4. Database Isolation Evidence

### 4.1. Kiểm tra cơ chế nạp Environment Variable của API & Playwright

- **Source verification ([`apps/api/src/config/env.ts`](file:///d:/Nexora/apps/api/src/config/env.ts#L4-L5)):** API gọi `dotenv.config(...)` **không** truyền `{ override: true }`. Do đó, mọi biến `DATABASE_URL` được inject ở cấp process môi trường chạy test đều ghi đè hoàn toàn `.env` và không rơi fallback về `3306/nexora`.
- **Playwright config verification ([`tests/playwright.config.ts`](file:///d:/Nexora/tests/playwright.config.ts#L11-L26)):** Khi đặt `$env:CI='true'`, thuộc tính `reuseExistingServer: !process.env.CI` mang giá trị `false`. Playwright bắt buộc khởi động mới tiến trình `node apps/api/dist/server.js` (cổng `3000`) và `npm run dev:web` (cổng `5173`) kế thừa trực tiếp `DATABASE_URL=...127.0.0.1:3307/nexora_test` của shell chạy test, không bám vào server dev nào trước đó (trước khi chạy Tier 2 & Tier 3 đã kiểm tra `netstat -ano` xác nhận cổng `3000` và `5173` trống hoàn toàn).

### 4.2. Truy vấn xác minh Identity Database (`SELECT DATABASE(), @@port, @@hostname`)

Chạy script read-only (`scratch/check_db.mjs`) dùng chính `apps/api/src/config/env.ts` + Prisma Client:

- **Dev Database (`nexora-mysql-1`, port `3306`):**
  ```json
  {"db_name":"nexora","mysql_port":"3306","server_host":"7ffc1a14a558"}
  ```
- **Test Process Target (`nexora-m65-test-mysql`, port `3307`):**
  ```json
  {
    "apiEnvTarget": {"host":"127.0.0.1","port":"3307","database":"/nexora_test"},
    "mysqlIdentity": [{"db_name":"nexora_test","mysql_port":"3306","server_host":"b099a4926239"}]
  }
  ```

**Bằng chứng cô lập 7/7 tiêu chí đạt:**
1. Hostname server MySQL khác nhau hoàn toàn (`b099a4926239` vs `7ffc1a14a558`).
2. `SELECT DATABASE()` trả chính xác `nexora_test` (không phải `nexora`).
3. `apps/api` env parser nhận `host=127.0.0.1, port=3307, database=/nexora_test`.
4. Playwright chạy với `CI=true` (ép `reuseExistingServer: false`) khi cổng `3000`/`5173` trống, nạp `DATABASE_URL` port `3307`.
5. Không mount volume dữ liệu từ `nexora-mysql-1`.
6. Không có external service thật nào được gọi (Email dùng `EmailService` `streamTransport` in-memory; VNPay dùng HMAC sandbox local).
7. Dev DB post-snapshot khớp 100% pre-snapshot (xem Mục 13).

---

## 5. Tier 1 Results — DB-Free Baseline

- **Lệnh thực thi:** `npm run test:unit`
- **Exit Code:** `0`
- **Thời gian thực thi:** `16.37s`
- **Kết quả:** **11/11 test files — 115/115 tests PASSED** (`0 failed`, `0 skipped`)
- **Lưu ý phân loại:** 100% DB-free (unit tests thuần + mocked `apiClient` frontend integration tests). Không truy cập MySQL.

| # | Test File | Layer | Pass / Total | Trạng thái |
|---|---|---|---:|---|
| 1 | [`packages/shared/tests/personaScoring.test.ts`](file:///d:/Nexora/packages/shared/tests/personaScoring.test.ts) | Pure Unit | 6 / 6 | `PASS` |
| 2 | [`packages/shared/tests/shared.test.ts`](file:///d:/Nexora/packages/shared/tests/shared.test.ts) | Pure Unit | 2 / 2 | `PASS` |
| 3 | [`apps/web/tests/FoundationDashboard.test.tsx`](file:///d:/Nexora/apps/web/tests/FoundationDashboard.test.tsx) | Component (Mock) | 1 / 1 | `PASS` |
| 4 | [`apps/web/tests/ResetPasswordFlow.test.tsx`](file:///d:/Nexora/apps/web/tests/ResetPasswordFlow.test.tsx) | Component (Mock) | 4 / 4 | `PASS` |
| 5 | [`apps/web/tests/m6_1_guest_cart_merge.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_1_guest_cart_merge.test.tsx) | Frontend Integration (Mock) | 23 / 23 | `PASS` |
| 6 | [`apps/web/tests/m6_2_customer_profile.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_2_customer_profile.test.tsx) | Frontend Integration (Mock) | 18 / 18 | `PASS` |
| 7 | [`apps/web/tests/m6_3_customer_reviews.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_3_customer_reviews.test.tsx) | Frontend Integration (Mock) | 17 / 17 | `PASS` |
| 8 | [`apps/web/tests/m6_4_customer_returns.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_4_customer_returns.test.tsx) | Frontend Integration (Mock) | 16 / 16 | `PASS` |
| 9 | [`apps/api/tests/app.test.ts`](file:///d:/Nexora/apps/api/tests/app.test.ts) | API Unit (Supertest + Fake Repo) | 4 / 4 | `PASS` |
| 10 | [`apps/api/tests/review_p2002_isolation.unit.test.ts`](file:///d:/Nexora/apps/api/tests/review_p2002_isolation.unit.test.ts) | Service Unit (Mock Prisma) | 12 / 12 | `PASS` |
| 11 | [`apps/api/tests/returns_state_machine.unit.test.ts`](file:///d:/Nexora/apps/api/tests/returns_state_machine.unit.test.ts) | Pure Business Rule Unit | 12 / 12 | `PASS` |

### Static Analysis & Production Build Gates (chạy sau khi thêm file M6.5 QA)

| Lệnh | Exit Code | Kết quả |
|---|---:|---|
| `npm run typecheck` | `0` | **`PASS`** (`config`, `shared`, `api`, `web`) |
| `npm run lint` | `0` | **`PASS`** (0 errors, 0 warnings) |
| `npm run build` | `0` | **`PASS`** (`packages`, `apps/api/dist/server.js`, `apps/web/dist` 287 modules trong 678ms) |
| `npx prettier --check apps/web/tests/m6_5_customer_integration_qa.test.tsx` | `0` | **`PASS`** |

---

## 6. Tier 2 Results — Backend MySQL Integration & Security (Real DB `nexora_test:3307`)

Toàn bộ 12 backend DB integration & security suites được chạy trực tiếp trên MySQL 8.4 ephemeral `127.0.0.1:3307/nexora_test` với chế độ tuần tự (`--no-file-parallelism`) và `NODE_ENV=test`.

### Tier 2A — 11 Integration & Security Suites

- **Lệnh thực thi:**
  ```powershell
  $env:NODE_ENV='test'
  $env:DATABASE_URL='mysql://nexora_test_user:***@127.0.0.1:3307/nexora_test'
  $env:AUTH_SECRET='m65-ephemeral-test-secret-key-minimum-32-chars-long'
  npx vitest run --no-file-parallelism apps/api/tests/storefront.integration.test.ts apps/api/tests/auth_password_reset_security.test.ts apps/api/tests/seed_and_auth_credentials.test.ts apps/api/tests/commerce_and_ai.integration.test.ts apps/api/tests/payment_security.test.ts apps/api/tests/phase_a_security_remediation.test.ts apps/api/tests/phase_b_cart_merge.test.ts apps/api/tests/phase_b_profile_addresses.test.ts apps/api/tests/phase_b_customer_reviews.test.ts apps/api/tests/phase_b_returns_and_admin_crud.test.ts apps/api/tests/rbac_and_concurrency.test.ts
  ```
- **Exit Code:** `0` (`TIER_2A_EXIT=0`)
- **Thời gian thực thi:** `56.54s`
- **Kết quả:** **11/11 files — 175/175 tests PASSED** (`0 failed`, `0 skipped`)

### Tier 2B — Database Connectivity Suite

- **Lệnh thực thi:** `npm run test:integration -w @nexora/api` (trỏ `DATABASE_URL` vào `127.0.0.1:3307/nexora_test`)
- **Exit Code:** `0` (`TIER_2B_EXIT=0`)
- **Thời gian thực thi:** `718ms`
- **Kết quả:** **1/1 file — 1/1 test PASSED** (`0 failed`, `0 skipped`)

### Chi tiết toàn bộ 12 Suites (176/176 Real MySQL Tests PASS)

| # | Test File | Phạm vi nghiệp vụ & bảo mật | Pass / Total | Trạng thái |
|---|---|---|---:|---|
| 1 | [`apps/api/tests/phase_b_returns_and_admin_crud.test.ts`](file:///d:/Nexora/apps/api/tests/phase_b_returns_and_admin_crud.test.ts) | M5 Returns State Machine, 7-day window, qty limits, stock restore `isResellable`, IDOR, Category delete | 30 / 30 | **`PASS`** *(Real DB)* |
| 2 | [`apps/api/tests/phase_b_customer_reviews.test.ts`](file:///d:/Nexora/apps/api/tests/phase_b_customer_reviews.test.ts) | M4 Reviews Verified Purchase (`DELIVERED`), POST upsert vs PUT edit, IDOR, moderation, rating aggregation | 29 / 29 | **`PASS`** *(Real DB)* |
| 3 | [`apps/api/tests/phase_b_profile_addresses.test.ts`](file:///d:/Nexora/apps/api/tests/phase_b_profile_addresses.test.ts) | M2–M3 Profile, Addresses CRUD + default toggle, Notifications mark-read, Change Password, IDOR | 26 / 26 | **`PASS`** *(Real DB)* |
| 4 | [`apps/api/tests/phase_a_security_remediation.test.ts`](file:///d:/Nexora/apps/api/tests/phase_a_security_remediation.test.ts) | IDOR order/address/cart, CORS allowlist, rate limiting, SSRF filtering, PII masking | 25 / 25 | **`PASS`** *(Real DB)* |
| 5 | [`apps/api/tests/phase_b_cart_merge.test.ts`](file:///d:/Nexora/apps/api/tests/phase_b_cart_merge.test.ts) | M1 Guest Cart Merge (`x-guest-session-id`), quantity clamping, stock limits, guest session cleanup | 14 / 14 | **`PASS`** *(Real DB)* |
| 6 | [`apps/api/tests/payment_security.test.ts`](file:///d:/Nexora/apps/api/tests/payment_security.test.ts) | VNPay HMAC signature verification, IPN idempotency, amount tampering rejection | 13 / 13 | **`PASS`** *(Real DB)* |
| 7 | [`apps/api/tests/commerce_and_ai.integration.test.ts`](file:///d:/Nexora/apps/api/tests/commerce_and_ai.integration.test.ts) | Cart, Checkout/Order creation, stock deduction, AI advisor & persona compare | 11 / 11 | **`PASS`** *(Real DB)* |
| 8 | [`apps/api/tests/rbac_and_concurrency.test.ts`](file:///d:/Nexora/apps/api/tests/rbac_and_concurrency.test.ts) | RBAC (`CUSTOMER`/`STAFF`/`ADMIN`) & concurrent stock deduction race protection | 10 / 10 | **`PASS`** *(Real DB)* |
| 9 | [`apps/api/tests/auth_password_reset_security.test.ts`](file:///d:/Nexora/apps/api/tests/auth_password_reset_security.test.ts) | Forgot/Reset password, single-use token replay, concurrency | 8 / 8 | **`PASS`** *(Real DB)* |
| 10 | [`apps/api/tests/storefront.integration.test.ts`](file:///d:/Nexora/apps/api/tests/storefront.integration.test.ts) | Catalog, Banners, Flash Sale, Login, Cart endpoints | 7 / 7 | **`PASS`** *(Real DB)* |
| 11 | [`apps/api/tests/seed_and_auth_credentials.test.ts`](file:///d:/Nexora/apps/api/tests/seed_and_auth_credentials.test.ts) | Bảo toàn mật khẩu admin khi re-seed | 2 / 2 | **`PASS`** *(Real DB)* |
| 12 | [`apps/api/tests/db.integration.test.ts`](file:///d:/Nexora/apps/api/tests/db.integration.test.ts) | Prisma MySQL connectivity & baseline table counts | 1 / 1 | **`PASS`** *(Real DB)* |

---

## 7. Tier 3 Results — Playwright E2E (Real Chromium + API + Vite trên `nexora_test:3307`)

- **Playwright Version:** `1.65.1` (Chromium `chromium-1255` / `chromium_headless_shell-1255`)
- **Lệnh thực thi:**
  ```powershell
  $env:CI='true'
  $env:NODE_ENV='test'
  $env:DATABASE_URL='mysql://nexora_test_user:***@127.0.0.1:3307/nexora_test'
  $env:AUTH_SECRET='m65-ephemeral-test-secret-key-minimum-32-chars-long'
  $env:CLIENT_URL='http://127.0.0.1:5173'
  $env:SERVER_URL='http://127.0.0.1:3000'
  $env:CORS_ALLOWED_ORIGINS='http://localhost:5173,http://127.0.0.1:5173'
  $env:TRUST_PROXY='false'
  npm run test:e2e -- --reporter=list
  ```
- **Exit Code:** `1` (`TIER_3_EXIT=1`)
- **Thời gian thực thi:** `17.6s` (2 workers)
- **Kết quả:** **8/9 tests PASSED, 1/9 test FAILED** (`0 skipped`)

| # | Spec File & Test Case | Thời gian | Trạng thái | Ghi chú thực tế |
|---|---|---:|---|---|
| 1 | `tests/e2e/foundation.spec.ts:3` — Foundation dashboard & API/DB connectivity | 3.8s | **`PASS`** | Kết nối thực tới API + `nexora_test:3307` |
| 2 | `tests/e2e/storefront_journeys.spec.ts:4` — Journey 1: Storefront Home | 4.2s | **`PASS`** | Header, hero, commitments, footer |
| 3 | `tests/e2e/storefront_journeys.spec.ts:20` — Journey 2: Product Catalog & Search | 584ms | **`PASS`** | `/search` layout & products |
| 4 | `tests/e2e/storefront_journeys.spec.ts:30` — Journey 3: Customer Login form | 593ms | **`PASS`** | `/login` form controls |
| 5 | `tests/e2e/storefront_journeys.spec.ts:44` — Journey 4: AI Advisor Survey | 607ms | **`PASS`** | `/ai-assistant` 5-step survey |
| 6 | `tests/e2e/storefront_journeys.spec.ts:52` — Journey 5: PC Builder slots | 556ms | **`PASS`** | `/pc-builder` component slots |
| 7 | `tests/e2e/storefront_journeys.spec.ts:63` — Journey 6: Persona Comparison | 557ms | **`PASS`** | `/compare` selectors |
| 8 | `tests/e2e/storefront_journeys.spec.ts:76` — Journey 7: Order Tracking | 507ms | **`PASS`** | `/order-tracking` input |
| 9 | `tests/e2e/storefront_journeys.spec.ts:84` — Journey 8: Admin Dashboard | 5.5s | **`FAIL`** | **Stale E2E test expectation** (xem phân tích dưới) |

### Phân tích nguyên nhân gốc lỗi `Journey 8` (`tests/e2e/storefront_journeys.spec.ts:84-93`)

- **Bằng chứng DOM từ Playwright error context** ([`test-results/.../error-context.md`](file:///d:/Nexora/test-results/storefront_journeys-Nexora-4e6d0-verview-and-navigation-tabs/error-context.md)):
  ```yaml
  - paragraph: Hệ Thống Quản Trị Cửa Hàng
  - text: Email quản trị
  - textbox "admin@nexora.local"
  - text: Mật khẩu
  - textbox "••••••••"
  - button "Đăng nhập Quản trị"
  ```
- **Kết luận:** Test mở trực tiếp `/admin` **không có bước đăng nhập** và kỳ vọng nhìn thấy chữ `Quản trị viên|Dashboard|Tổng quan`. Ứng dụng **hoạt động đúng theo yêu cầu bảo mật RBAC** khi hiển thị cổng đăng nhập quản trị thay vì lộ bảng điều khiển. Đây là **test E2E cũ bị lỗi thời**, không phải lỗi bảo mật của ứng dụng. Không sửa test cũ trong phạm vi M6.5; đã tạo đề xuất `CR-M6.5-03`.
- **Giới hạn độ phủ Tier 3 (khai báo trung thực):** Hiện tại trong repository **chưa có Playwright E2E spec nào** cho các luồng Customer có xác thực của M6.1–M6.4 (cart merge, profile CRUD, review CRUD, return creation trên trình duyệt thật). Do đó, không tuyên bố full-stack browser E2E coverage cho M6.1–M6.4.

---

## 8. M6.5 Cross-Module QA Results (Mocked Frontend Integration Layer)

- **File mới duy nhất được tạo:** [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx)
- **Lệnh thực thi:** `npx vitest run apps/web/tests/m6_5_customer_integration_qa.test.tsx`
- **Exit Code:** `0`
- **Thời gian thực thi:** `834ms`
- **Kết quả:** **1/1 file — 8/8 tests PASSED** (`0 failed`, `0 skipped`)
- **Lưu ý phân loại:** **100% DB-free mocked frontend integration** (`jsdom` + real React components + real React Router + real `QueryClient` với `staleTime: 30_000` giống `App.tsx` + mocked `apiClient`/`fetch`). Kiểm chứng tích hợp giữa các trang Frontend, TanStack Query cache lifecycle và contract payload — **không** thay thế cho Tier 2 Real MySQL tests.

| # | Test Case trong `m6_5_customer_integration_qa.test.tsx` | Luồng Customer phủ | Trạng thái | Mục đích xác minh |
|---|---|---|---|---|
| 1 | Line 158 — `Flow 1: Guest browse -> Product Detail (/product/:slug) -> Add to Cart...` | Flow 1 | **`PASS`** *(Mock)* | Slug lookup đúng sản phẩm, tạo `x-guest-session-id`, invalidate `['cart']` |
| 2 | Line 216 — `Flow 2: Guest Cart -> Login (/login) -> Auto-Merge clears guest session...` | Flow 2 | **`PASS`** *(Mock)* | Auto-merge sau login, dọn `nexora_guest_session_id`, invalidate `['cart']` |
| 3 | Line 266 — `Flow 3: Authenticated Customer -> Profile -> Address CRUD...` | Flow 3 | **`PASS`** *(Mock)* | Tạo địa chỉ mới trong modal & invalidate `['customer-addresses']` |
| 4 | Line 331 — `Flows 4 & 5: Delivered Order -> Product Detail Review Eligibility -> Create -> Edit -> Delete` | Flows 4 & 5 | **`PASS`** *(Mock)* | Đủ chuỗi `POST` (create) → chỉ hiển thị Edit/Delete → `PUT` (edit) → `DELETE` + invalidate reviews/eligibility |
| 5 | Line 450 — `Flow 6 & 8: Orders Tab shortcut -> /profile/return -> Create Return -> List & Detail...` | Flows 6 & 8 | **`PASS`** *(Mock)* | Điều hướng đúng `/profile/return` (không lỗi `/profile/returns`), tạo return, invalidate `['customer-returns']` & `['customer-notifications']` |
| 6 | Line 584 — `Flow 7 + R-02 Empirical Reproduction: Logout from WishlistPage leaves non-user-scoped ["wishlist"] cache exposed to Account B...` | Flow 7 + **R-02** | **`PASS`** *(Tái hiện bug!)* | **Chứng minh thực nghiệm R-02 là `FAIL / BLOCKER`** (Account B thấy private wishlist của Account A trong 30s) |
| 7 | Line 658 — `Flow 7 + R-02B: ProfilePage logout removes returns/orders keys, while user-scoped profile key isolates Account B by userId` | Flow 7 + **R-02B** | **`PASS`** *(Mock)* | Xác minh phân mảnh logout: `ProfilePage` xóa 3 key, key `['profile', userId]` tự tách nhờ `userId` |
| 8 | Line 700 — `Flow 8 + R-03 Empirical Reproduction: CheckoutPage does not invalidate ["my-orders"], leaving stale orders visible...` | Flow 8 + **R-03** | **`PASS`** *(Tái hiện bug!)* | **Chứng minh thực nghiệm R-03 là `NEEDS FIX`** (đơn mới không xuất hiện trên `/profile/orders` trong 30s) |

---

## 9. R-02 Verification — Logout Cache Fragmentation & Account Switching

### Phân loại cuối cùng: **`FAIL / BLOCKER`**

### Bằng chứng mã nguồn (Source Inspection)

| File & Vị trí | Query Keys được xóa khi Logout | Query Keys bị bỏ sót |
|---|---|---|
| [`apps/web/src/features/storefront/WishlistPage.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/WishlistPage.tsx#L71-L74) | **Không có** (chỉ gọi `authService.logout()`) | `['wishlist']`, `['wishlist-count']`, `['cart']`, `['my-orders']`, `['customer-returns']`, `['customer-notifications']`, `['customer-addresses']`, `['review-eligibility']` |
| [`apps/web/src/features/storefront/ProfilePage.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/ProfilePage.tsx#L461-L469) | `['customer-returns']`, `['customer-return-detail']`, `['my-orders']` | `['wishlist']`, `['wishlist-count']`, `['cart']`, `['customer-addresses']`, `['customer-notifications']`, `['profile', userA.id]` |
| [`apps/web/src/features/storefront/ProductDetailPage.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/ProductDetailPage.tsx#L140-L154) | `['review-eligibility']`, `['product-reviews']`, `['cart']` | `['wishlist']`, `['wishlist-count']`, `['my-orders']`, `['customer-returns']`, `['customer-addresses']`, `['customer-notifications']` |
| [`apps/web/src/features/storefront/CartPage.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/CartPage.tsx) / `StorefrontHome` / `AiAssistantPage` | Không nhất quán / thiếu dọn tập trung | Các key không chứa `userId` (`['cart']`, `['wishlist']`, `['wishlist-count']`, `['my-orders']`, `['customer-addresses']`, `['customer-notifications']`) |

### Bằng chứng tái hiện thực nghiệm (`m6_5_customer_integration_qa.test.tsx:584-656`)

1. Khởi tạo SPA `QueryClient` với `staleTime: 30_000` (khớp chính xác cấu hình production tại [`apps/web/src/App.tsx`](file:///d:/Nexora/apps/web/src/App.tsx)).
2. **Account A** (`user-a@nexora.local`) mở `/wishlist` → `GET /api/v1/wishlist` trả về sản phẩm riêng tư `"Secret Laptop Of Account A"` và lưu vào key `['wishlist']` (không gắn `userId`).
3. **Account A** bấm đăng xuất trên `WishlistPage` → `authService.logout()` chạy; **0 lệnh `queryClient.removeQueries` / `queryClient.clear` được gọi**.
4. **Account B** (`user-b@nexora.local`) đăng nhập trên cùng SPA instance trong vòng `30s` và điều hướng vào `/wishlist`.
5. **Kết quả quan sát:**
   - Số lần gọi `GET /api/v1/wishlist` cho Account B: **`0` lần** (TanStack Query phục vụ thẳng cache fresh của Account A!).
   - Giao diện của Account B **hiển thị ngay `"Secret Laptop Of Account A"`** của tài khoản trước!

### Trả lời 5 câu hỏi đánh giá R-02

1. *Logout có xóa hoặc vô hiệu hóa dữ liệu private cache không?* **KHÔNG** — hoàn toàn không xóa tại `WishlistPage`, và chỉ xóa từng phần cục bộ tại `ProfilePage`/`ProductDetailPage`.
2. *Account A logout, Account B login có thể nhìn thấy dữ liệu của A không?* **CÓ — ĐÃ TÁI HIỆN THỰC NGHIỆM.**
3. *Các trang có hành vi logout nhất quán không?* **KHÔNG** — mỗi trang tự gọi `removeQueries` khác nhau hoặc không gọi.
4. *Query có được fetch lại theo identity mới không?* **KHÔNG** trong cửa sổ `staleTime: 30_000` đối với các key không gắn `userId` (`['wishlist']`, `['wishlist-count']`, `['cart']`, `['my-orders']`, `['customer-addresses']`, `['customer-notifications']`).
5. *Có tình huống dữ liệu cũ hiển thị trước khi refetch không?* **CÓ** — ngay cả sau khi quá `staleTime`, TanStack Query mặc định vẫn render dữ liệu stale của Account A trong khi background refetch đang chạy!

**Tuân thủ M6.5:** Không sửa source code trong M6.5; đã lập đề xuất `CR-M6.5-01` (ưu tiên `P0 / Blocker`).

---

## 10. R-03 Verification — Checkout và `['my-orders']`

### Phân loại cuối cùng: **`NEEDS FIX`**

### Bằng chứng mã nguồn & thực nghiệm

- **Source location:** [`apps/web/src/features/storefront/CheckoutPage.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/CheckoutPage.tsx#L162-L164):
  ```ts
  void queryClient.invalidateQueries({ queryKey: ['cart'] });
  void queryClient.invalidateQueries({ queryKey: ['products'] });
  void queryClient.invalidateQueries({ queryKey: ['admin-data'] });
  ```
  → Hoàn toàn **không có** `queryClient.invalidateQueries({ queryKey: ['my-orders'] })` (và không invalidate `['customer-notifications']`).
- **Tái hiện thực nghiệm (`m6_5_customer_integration_qa.test.tsx:700-780`):**
  1. Customer đã xem `/profile/orders` trước đó → cache `['my-orders']` chứa đơn cũ `NX-2026-OLD01` (fresh trong `30_000ms`).
  2. Customer đặt đơn mới thành công tại `/checkout` → `POST /api/v1/orders` trả `201 Created` với `orderNumber: 'NX-2026-NEW99'`.
  3. Customer quay lại `/profile/orders` trong vòng `30s`.
  4. **Kết quả quan sát:**
     - `GET /api/v1/orders/my-orders` **không được gọi lại** (tổng số lần gọi vẫn dừng ở `1`).
     - UI vẫn chỉ hiển thị `NX-2026-OLD01`; đơn hàng mới `NX-2026-NEW99` **không xuất hiện** mặc dù API đã tạo đơn thành công!

### Phân biệt bản chất lỗi R-03

- **Không phải lỗi Backend:** `POST /api/v1/orders` lưu DB thành công (đã xác minh ở Tier 2 `commerce_and_ai.integration.test.ts` — 11/11 PASS).
- **Là lỗi thiếu cache invalidation tại Frontend (`CheckoutPage.tsx`):** Không chỉ là cache hợp lệ bình thường — sau một mutation làm thay đổi trực tiếp tập `orders` của người dùng, `['my-orders']` bắt buộc phải được invalidate ngay lập tức để tránh việc đơn mới "biến mất" trong cửa sổ `staleTime: 30_000`.

**Tuân thủ M6.5:** Không sửa source code trong M6.5; đã lập đề xuất `CR-M6.5-02` (ưu tiên `P1 / High`).

---

## 11. API / Frontend Integration Findings

| # | Phát hiện | Vị trí | Bằng chứng | Tác động |
|---|---|---|---|---|
| 1 | **R-02: Logout cache fragmentation gây rò rỉ dữ liệu private giữa 2 tài khoản** | `WishlistPage.tsx:71-74`, `ProfilePage.tsx:461-469`, `ProductDetailPage.tsx:140-154`, `StorefrontHeader` | Tái hiện thực nghiệm trong M6.5 QA test #6 | **BLOCKER** — Account B đọc được wishlist/cart/orders cache của Account A trên máy dùng chung trong 30s |
| 2 | **R-03: `CheckoutPage` không invalidate `['my-orders']`** | `CheckoutPage.tsx:162-164` | Tái hiện thực nghiệm trong M6.5 QA test #8 | **HIGH** — Đơn hàng mới đặt xong không hiện trong `/profile/orders` suốt 30s |
| 3 | **HTTP client không đồng nhất (`fetch` thô thay vì `apiClient`)** | [`apps/web/src/features/storefront/CheckoutPage.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/CheckoutPage.tsx), [`apps/web/src/services/wishlistService.ts`](file:///d:/Nexora/apps/web/src/services/wishlistService.ts) | Source inspection + phải spy `globalThis.fetch` riêng trong M6.5 QA suite | **MEDIUM** — Bỏ qua interceptors chuẩn của `apiClient` (base URL, auth header, xử lý lỗi 401 tập trung) |
| 4 | **Test E2E `Journey 8` lỗi thời so với Admin auth gate** | [`tests/e2e/storefront_journeys.spec.ts`](file:///d:/Nexora/tests/e2e/storefront_journeys.spec.ts#L84-L93) | Tier 3 Playwright exit code `1` + DOM snapshot | **MEDIUM** — Khiến `npm run test:e2e` luôn fail dù bảo mật `/admin` hoạt động đúng |
| 5 | **Thiếu Playwright E2E coverage cho luồng Customer có xác thực (M6.1–M6.4)** | `tests/e2e/` | Inventory thực tế chỉ có 2 smoke files (9 tests) | **MEDIUM** — Luồng full-stack thật trên browser cho cart merge / profile / reviews / returns chưa được tự động hóa ở tầng E2E |
| 6 | **100% Backend API contracts & security rules khớp và ổn định trên MySQL 8.4 thật** | 12 suites trong `apps/api/tests/` | Tier 2: **176/176 PASS** trên `nexora_test:3307` | **POSITIVE** — Không phát hiện hồi quy Backend sau M6.1–M6.4 |

---

## 12. Failed / Skipped / Not Verified Tests

| Phân loại | Số lượng | Chi tiết cụ thể |
|---|---:|---|
| **Failed Tests** | **1** | `tests/e2e/storefront_journeys.spec.ts:84:3` — `Journey 8: Admin Dashboard renders operational overview and navigation tabs` (Timeout 5000ms do `/admin` hiển thị đúng cổng `Đăng nhập Quản trị` thay vì Dashboard cho guest chưa đăng nhập). |
| **Skipped Tests** | **0** | Không có test nào bị skip ở cả 3 Tier và M6.5 QA suite. |
| **Not Executed Tests** | **0** | Toàn bộ 26/26 file test (308/308 test cases) đều đã được chạy thực tế. |
| **Not Verified Coverage Areas (khai báo minh bạch)** | **1 hạng mục** | **Authenticated Browser E2E cho M6.1–M6.4:** Chưa có spec Playwright cho luồng đăng nhập thật → merge cart → sửa profile → viết review → tạo return trên Chromium thật (hiện mới có 176/176 Real MySQL API integration tests ở Tier 2 + 87/87 mocked Frontend tests ở Tier 1 & M6.5 QA). |

---

## 13. Data Safety and Cleanup Evidence

### 13.1. So sánh Dev Database Snapshot trước & sau thực thi (`127.0.0.1:3306/nexora`)

| Bảng (`nexora`, host `7ffc1a14a558`, port `3306`) | Pre-Execution Snapshot | Post-Execution Snapshot | Sai lệch |
|---|---:|---:|---:|
| `products` | `674` | `674` | `0` |
| `categories` | `36` | `36` | `0` |
| `brands` | `31` | `31` | `0` |
| `users` | `3` | `3` | `0` |
| `orders` | `2` | `2` | `0` |
| `reviews` | `0` | `0` | `0` |
| `return_requests` | `0` | `0` | `0` |
| `carts` | `8` | `8` | `0` |
| `notifications` | `2` | `2` | `0` |

**Kết luận:** **0 đột biến trên cơ sở dữ liệu phát triển `nexora`**.

### 13.2. Bằng chứng hủy Container Ephemeral & giải phóng tiến trình

1. **Hủy duy nhất container của M6.5:**
   - Lệnh: `docker rm -fv nexora-m65-test-mysql` → Output: `nexora-m65-test-mysql`, Exit code `0`.
2. **Xác nhận trạng thái Docker (`docker ps -a`):**
   - Chỉ còn `nexora-mysql-1` (`Up 2 hours (healthy)`, port `3306`) và `funny_wozniak` (`Up 2 hours`, port `8082`).
   - `nexora-m65-test-mysql` đã biến mất hoàn toàn; không có Docker resource/volume nào ngoài M6.5 bị động chạm.
3. **Xác nhận không còn tiến trình test chạy ngầm (`netstat -ano`):**
   - Không có socket `LISTENING` nào trên các cổng `3000`, `5173`, `3307` (chỉ còn các kết nối `TIME_WAIT` đã đóng với PID `0`).

---

## 14. Risk Register

| ID | Mức độ | Mô tả rủi ro | Trạng thái sau M6.5 | Hướng xử lý đề xuất |
|---|---|---|---|---|
| **R-02** | **CRITICAL / BLOCKER** | Rò rỉ dữ liệu private trong TanStack Query cache khi chuyển tài khoản trên máy dùng chung (đã tái hiện trên `WishlistPage`, ảnh hưởng mọi key không gắn `userId`) | **CONFIRMED (`FAIL / BLOCKER`)** | `CR-M6.5-01` — Dọn cache tập trung trong luồng logout + gắn `userId` vào mọi query key private |
| **R-03** | **HIGH** | `CheckoutPage` thiếu invalidate `['my-orders']`, đơn mới không xuất hiện trong 30s sau khi đặt hàng | **CONFIRMED (`NEEDS FIX`)** | `CR-M6.5-02` — Bổ sung `invalidateQueries({ queryKey: ['my-orders'] })` & `['customer-notifications']` |
| **R-04** | **MEDIUM** | `tests/e2e/storefront_journeys.spec.ts` (`Journey 8`) thất bại do kỳ vọng cũ chưa tính đến Admin auth gate | **CONFIRMED (`FAIL` — stale test)** | `CR-M6.5-03` — Cập nhật `Journey 8` assert cổng đăng nhập `/admin` và/hoặc đăng nhập hợp lệ |
| **R-05** | **MEDIUM** | `CheckoutPage.tsx` và `wishlistService.ts` dùng `fetch()` thô thay vì `apiClient` | **CONFIRMED (Source inspection)** | Gộp vào `CR-M6.5-02` hoặc refactor riêng để thống nhất interceptors |
| **R-06** | **LOW-MEDIUM** | Chưa có Playwright E2E spec cho luồng Customer có xác thực M6.1–M6.4 | **OPEN (Coverage gap)** | Bổ sung sau khi chốt `CR-M6.5-01..03` hoặc trước Release Gate |
| **R-01** | **MITIGATED** | Nguy cơ test backend ghi đè dev DB `127.0.0.1:3306/nexora` | **MITIGATED TRONG M6.5** (dùng container ephemeral `3307`) | Duy trì quy tắc chỉ chạy Tier 2/3 với `DATABASE_URL` test cô lập |

---

## 15. Acceptance Criteria Matrix

| Nhóm | Tiêu chí nghiệm thu | Trạng thái | Bằng chứng xác minh |
|---|---|---|---|
| **A. Environment safety** | Database test được cô lập hoàn toàn (`nexora_test:3307`) | **`PASS`** | `SELECT DATABASE(), @@hostname` = `nexora_test` / `b099a4926239` |
| **A. Environment safety** | Không có connection test nào đến `nexora:3306` | **`PASS`** | Env override verification + `CI=true` Playwright + Dev DB 0 diff |
| **A. Environment safety** | Không có dữ liệu Nexora hiện tại bị thay đổi | **`PASS`** | Pre/Post snapshot 9/9 bảng khớp tuyệt đối |
| **A. Environment safety** | Test database bị hủy độc lập sau khi chạy | **`PASS`** | `docker rm -fv nexora-m65-test-mysql` exit `0`, `docker ps -a` sạch |
| **B. Test execution** | Tier 1 có kết quả thực tế | **`PASS`** | `npm run test:unit`: 11/11 files, 115/115 PASS, exit `0` |
| **B. Test execution** | Tier 2 có kết quả thực tế trên DB cô lập | **`PASS`** | 12/12 files, 176/176 PASS trên `nexora_test:3307`, exit `0` |
| **B. Test execution** | Tier 3 có kết quả thực tế trên DB cô lập | **`PARTIAL / FAIL (1 stale spec)`** | `npm run test:e2e`: 8/9 PASS, 1 FAIL (`Journey 8` stale spec), exit `1` |
| **B. Test execution** | M6.5 QA suite mới được chạy và báo cáo | **`PASS`** | `m6_5_customer_integration_qa.test.tsx`: 8/8 PASS, exit `0` |
| **C. Integration quality** | 8 luồng Customer được kiểm tra ở mức phù hợp với từng layer | **`PASS`** | Tier 2 (176 real-DB API tests) + M6.5 QA (8 mocked FE flows) + Tier 1 (115 tests) |
| **C. Integration quality** | R-02 và R-03 có kết luận bằng chứng thực nghiệm | **`PASS`** | Cả 2 đều tái hiện bằng test tự động: R-02 = `FAIL / BLOCKER`, R-03 = `NEEDS FIX` |
| **C. Integration quality** | Không tuyên bố full-stack coverage khi chỉ có mocked frontend tests | **`PASS`** | Đã phân tách rõ Mock vs Real DB vs Real Browser ở mọi bảng |
| **D. Repository safety** | Chỉ có 1 test source file mới (`m6_5_customer_integration_qa.test.tsx`) | **`PASS`** | `git status --short` xác nhận đúng 1 file test mới |
| **D. Repository safety** | Không sửa application source code, config, tests cũ, Prisma, `.env` | **`PASS`** | `git diff --name-status` trống (`0` tracked files modified) |
| **D. Repository safety** | Không thay đổi Git history, không commit/push, bảo toàn untracked docs/seeds | **`PASS`** | HEAD giữ nguyên `3d8adb18...`, toàn bộ file cũ còn nguyên |

---

## 16. Final Decision

### **`PASS WITH CONDITIONS`**

**Lý do phân loại chính xác là `PASS WITH CONDITIONS` (không phải `PASS` tuyệt đối, cũng không phải `BLOCKED`):**

1. **Mục tiêu QA & thực thi kiểm thử đạt trọn vẹn:** Toàn bộ 26/26 file test (308/308 test cases) đã chạy thực tế trên môi trường cô lập an toàn; 100% Tier 1 (115/115), 100% M6.5 QA (8/8) và 100% Tier 2 Real MySQL Backend Integration & Security (176/176) đều **PASS**; Dev DB `nexora` và Git working tree được bảo toàn 100%.
2. **Điều kiện chặn trước khi đóng hoàn toàn M6.5 / chuyển giai đoạn tiếp theo:**
   - Phát hiện **1 lỗi `FAIL / BLOCKER` (`R-02`)**: rò rỉ cache wishlist giữa 2 tài khoản khi logout từ `WishlistPage`.
   - Phát hiện **1 lỗi `NEEDS FIX` (`R-03`)**: `CheckoutPage` thiếu invalidate `['my-orders']`.
   - Phát hiện **1 bài test Tier 3 E2E fail (`Journey 8`)** do kỳ vọng test cũ chưa đồng bộ với cổng đăng nhập `/admin`.
   - Vì M6.5 chạy trong chế độ `TEST-ONLY — NO APPLICATION CODE FIXES`, toàn bộ 3 điểm trên cần được Project Owner phê duyệt qua Change Request riêng trước khi đóng chính thức M6.5.

---

## 17. Recommended Follow-Up Change Requests

| CR ID | Mức độ | Phạm vi file dự kiến | Mô tả thay đổi đề xuất | Tiêu chí xác minh sau khi sửa |
|---|---|---|---|---|
| **`CR-M6.5-01`** | **P0 / BLOCKER** | `apps/web/src/services/authService.ts` (hoặc logout helper), `WishlistPage.tsx`, `ProfilePage.tsx`, `ProductDetailPage.tsx`, `CartPage.tsx`, `StorefrontHome`, `StorefrontHeader`, các hook/query `['cart']`, `['wishlist']`, `['wishlist-count']`, `['my-orders']`, `['customer-addresses']`, `['customer-notifications']`, và cập nhật assertion trong `m6_5_customer_integration_qa.test.tsx` | Khắc phục **R-02**: chuẩn hóa cơ chế dọn toàn bộ private TanStack Query cache (`queryClient.clear()` hoặc danh sách key tập trung) tại mọi điểm logout + gắn `userId` vào các query key gắn với danh tính khách hàng. | Account A logout từ bất kỳ trang nào → Account B login ngay lập tức không thấy dữ liệu của A và kích hoạt fetch mới theo danh tính B. |
| **`CR-M6.5-02`** | **P1 / HIGH** | `apps/web/src/features/storefront/CheckoutPage.tsx`, (tùy chọn) `apps/web/src/services/wishlistService.ts`, và cập nhật assertion trong `m6_5_customer_integration_qa.test.tsx` | Khắc phục **R-03**: bổ sung `queryClient.invalidateQueries({ queryKey: ['my-orders'] })` (và `['customer-notifications']`) sau khi tạo đơn hàng thành công; cân nhắc chuyển `fetch()` thô trong `CheckoutPage` & `wishlistService` sang `apiClient`. | Sau `POST /api/v1/orders` thành công, quay lại `/profile/orders` trong vòng 30s tự động refetch và hiển thị ngay đơn hàng mới. |
| **`CR-M6.5-03`** | **P2 / MEDIUM** | `tests/e2e/storefront_journeys.spec.ts` | Khắc phục **Tier 3 `Journey 8` stale spec**: cập nhật test `/admin` để xác minh guest chưa đăng nhập thấy cổng `Đăng nhập Quản trị` (đúng hành vi RBAC) và/hoặc thực hiện đăng nhập admin hợp lệ trước khi assert bảng điều khiển. | `npm run test:e2e` trên `nexora_test:3307` đạt **9/9 PASS (exit code `0`)**. |
