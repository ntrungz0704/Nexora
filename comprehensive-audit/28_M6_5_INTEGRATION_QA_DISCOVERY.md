# NEXORA — M6.5 INTEGRATION TESTING & QA
## PHASE A: PRE-EXECUTION DISCOVERY REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` *(M6.4 Customer Returns — COMMITTED)*
- **Parent Commit (`HEAD^`):** `e0e517b9da962218b292adb8ca302a4c895590a6` *(M6.3 Customer Reviews — COMMITTED)*
- **Execution Mode:** STRICT READ-ONLY DISCOVERY — NO IMPLEMENTATION — NO TEST EXECUTION
- **Discovery Status:** **`READY WITH CONDITIONS`**

---

## 1. EXECUTIVE SUMMARY VÀ DISCOVERY STATUS

### 1.1. Discovery Status: **`READY WITH CONDITIONS`**

Hệ thống Nexora hiện sở hữu nền tảng kiểm thử tự động khá dày gồm **25 file test (300 test cases)** phân bổ trên `packages/shared`, `apps/web`, `apps/api` và `tests/e2e`, cùng pipeline GitHub Actions (`.github/workflows/ci.yml`) có MySQL 8.4 service container cô lập cho CI.

Tuy nhiên, khảo sát thực tế phát hiện **3 điều kiện quyết định** khiến việc thực thi M6.5 phải được phân tầng nghiêm ngặt thay vì chạy toàn bộ `npm run test` ngay trên máy local:

1. **CRITICAL — Thiếu Test Database cô lập tại môi trường local:** File `.env` hiện trỏ `DATABASE_URL` trực tiếp vào database phát triển `127.0.0.1:3306/nexora` (đang lưu catalog 674 sản phẩm, 31 thương hiệu, 36 danh mục). Không tồn tại `.env.test` hay `apps/api/.env.test`. Nhiều test integration backend ghi/sửa dữ liệu trực tiếp lên tài khoản thật (`customer@nexora.local`, `admin@nexora.local`) mà không có `try/finally` rollback (`auth_password_reset_security.test.ts`, `seed_and_auth_credentials.test.ts`). Do đó, **12 backend DB integration suites (176 tests) và 2 Playwright E2E suites (9 tests) được phân loại `NOT SAFE TO EXECUTE` trên `/nexora` hiện tại** cho đến khi cấp một database test cô lập (`nexora_test` hoặc Docker MySQL ephemeral).
2. **HIGH — 11 DB-Free Suites (115 tests) hoàn toàn an toàn chạy ngay:** Lệnh `npm run test:unit` (`package.json:22`) chỉ chạy 11 file test hoàn toàn không truy cập MySQL (shared + toàn bộ frontend M6.1–M6.4 + 3 backend pure unit tests).
3. **MEDIUM-HIGH — Lỗ hổng đồng bộ dọn dẹp Cache khi Logout trên nhiều trang (Cross-Module QA Finding):** Quét toàn bộ `apps/web/src/features/` cho thấy các handler `onLogout` không nhất quán giữa các trang (`ProfilePage`, `ProductDetailPage`, `CartPage`, `StorefrontHome`, `WishlistPage`, `AiAssistantPage`...). Đăng xuất từ trang này có thể bỏ sót cache user-scoped của trang khác trong bộ nhớ TanStack Query (đặc biệt `['cart']`, `['wishlist']`, `['wishlist-count']` không chứa `userId` trong key).

---

## 2. REPOSITORY / GIT BASELINE

Kết quả kiểm tra read-only trực tiếp tại thời điểm Discovery:

- **`git branch --show-current`:** `main`
- **`git rev-parse HEAD`:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **`git rev-parse HEAD^`:** `e0e517b9da962218b292adb8ca302a4c895590a6`
- **Tracked modified files:** `0` (sạch hoàn toàn)
- **Untracked files preserved (`git status --short`):**
  - `FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`
  - `M6_1_FINAL_CLOSURE_VERIFICATION.md`
  - `M6_2_FINAL_ACCEPTANCE_VERIFICATION.md`
  - `M6_2_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md`
  - `M6_2_PRE_IMPLEMENTATION_VERIFICATION.md`
  - `NEXORA_COMPLETE_REPOSITORY_INVENTORY.md`
  - `comprehensive-audit/`
  - `prisma/seed_nexora_catalog.sql`
  - `prisma/seed_techpilot_full.ts`

---

## 3. TEST INVENTORY ĐẦY ĐỦ (25 FILES — 300 TEST CASES)

### 3.1. Test Runners & Scripts Cấu Hình Thực Tế

- **Vitest:** `vitest@^5.1.1` cấu hình tại `vitest.config.ts:1-9` (`include`: `packages/*/tests/**/*.test.ts`, `apps/*/tests/**/*.test.{ts,tsx}`; `exclude`: `**/tests/db.integration.test.ts`; `fileParallelism: false`).
- **Supertest:** `supertest@^7.3.2` trong `apps/api/package.json:38`.
- **Playwright:** `@playwright/test@^1.59.0` cấu hình tại `tests/playwright.config.ts:1-27`.
- **Scripts (`package.json:21-24`, `apps/api/package.json:11`):**
  - `npm run test` → `npm run build:packages && vitest run` *(CHẠY CẢ 11 DB INTEGRATION SUITES — **KHÔNG AN TOÀN** trên local dev DB!)*
  - `npm run test:unit` → `npm run build:packages && vitest run packages/shared/tests apps/web/tests apps/api/tests/app.test.ts apps/api/tests/review_p2002_isolation.unit.test.ts apps/api/tests/returns_state_machine.unit.test.ts` *(**100% DB-FREE, AN TOÀN**)*
  - `npm run test:integration` → `vitest run tests/db.integration.test.ts` *(chạm MySQL)*
  - `npm run test:e2e` → `playwright test --config=tests/playwright.config.ts` *(khởi động API server nối `.env` MySQL + Vite dev server)*

### 3.2. Nhóm A — DB-Free Unit & Frontend Component Suites (`SAFE TO EXECUTE`: 11 files, 115 tests)

| # | File Path | Loại | Module / Luồng | Tests | API / DB | Ghi/Xóa DB | External Dep | Trạng thái gần nhất có bằng chứng |
|---|---|---|---|---:|---|---|---|---|
| 1 | `packages/shared/tests/personaScoring.test.ts` | Unit | AI Persona Scoring | 6 | Không | Không | Không | `NOT VERIFIED` (chưa chạy lại sau M6.4) |
| 2 | `packages/shared/tests/shared.test.ts` | Unit | Shared Zod schemas & constants | 2 | Không | Không | Không | `NOT VERIFIED` (chưa chạy lại sau M6.4) |
| 3 | `apps/web/tests/FoundationDashboard.test.tsx` | Component | Foundation health UI | 1 | Mock | Không | Không | `PASS` (Report 25, 2026-11-23) |
| 4 | `apps/web/tests/ResetPasswordFlow.test.tsx` | Component | Forgot/Reset password flow | 4 | Mock | Không | Không | `PASS` (Report 25, 2026-11-23) |
| 5 | `apps/web/tests/m6_1_guest_cart_merge.test.tsx` | Frontend Integration | M6.1 Guest Cart Merge & failure-safety | 23 | Mock `apiClient` | Không | Không | `PASS` (Report 25, 2026-11-23) |
| 6 | `apps/web/tests/m6_2_customer_profile.test.tsx` | Frontend Integration | M6.2 Profile, Addresses CRUD, Notifications, Password | 18 | Mock `apiClient` | Không | Không | `PASS` (Report 25, 2026-11-23) |
| 7 | `apps/web/tests/m6_3_customer_reviews.test.tsx` | Frontend Integration | M6.3 Customer Reviews + slug lookup | 17 | Mock `apiClient` | Không | Không | `PASS` (Report 25, 2026-11-23) |
| 8 | `apps/web/tests/m6_4_customer_returns.test.tsx` | Frontend Integration | M6.4 Customer Returns | 16 | Mock `apiClient` | Không | Không | `PASS` (Report 25, 2026-11-23) |
| 9 | `apps/api/tests/app.test.ts` | API Unit | Express middleware, env parse, health (`makeFakeRepo`) | 4 | Supertest + Fake Repo | Không | Không | `NOT VERIFIED` (chưa chạy lại sau M6.4) |
| 10 | `apps/api/tests/review_p2002_isolation.unit.test.ts` | Unit | M4 Review P2002 race condition isolation | 12 | Mock Prisma | Không | Không | `PASS` (Report 20, 2026-11-23) |
| 11 | `apps/api/tests/returns_state_machine.unit.test.ts` | Unit | M5 Return State Machine, 7-day window, qty, Zod | 12 | Không | Không | Không | `PASS` (Report 23, 2026-11-23) |

### 3.3. Nhóm B — Backend MySQL Integration & Security Suites (`NOT SAFE ON LOCAL DEV DB`: 12 files, 176 tests)

| # | File Path | Loại | Module / Luồng | Tests | Truy cập DB | Ghi/Xóa DB & Cleanup | External Dep | Trạng thái gần nhất có bằng chứng |
|---|---|---|---|---:|---|---|---|---|
| 12 | `apps/api/tests/db.integration.test.ts` | DB Integration | Prisma connectivity & counts | 1 | Live MySQL | Read-only (không ghi) | Không | `NOT VERIFIED` (excluded khỏi `vitest.config.ts`) |
| 13 | `apps/api/tests/storefront.integration.test.ts` | API Integration | Catalog, Banners, Flash Sale, Login, Cart | 7 | Live MySQL | Có thể tạo cart row cho `customer@nexora.local`; không `afterAll` | Không | `NOT VERIFIED` (không chạy từ sau M6.2 để giữ DB sạch) |
| 14 | `apps/api/tests/auth_password_reset_security.test.ts` | Security Integration | Forgot/Reset password, token replay, concurrency | 8 | Live MySQL | **SỬA `passwordHash` của `customer@nexora.local`**, restore inline không có `try/finally` | Email in-memory (`EmailService` streamTransport) | `NOT VERIFIED` (không chạy lại sau M6.2) |
| 15 | `apps/api/tests/seed_and_auth_credentials.test.ts` | Seed/Auth Integration | Bảo toàn mật khẩu admin khi re-seed | 2 | Live MySQL | **SỬA `passwordHash` & `fullName` của `admin@nexora.local`**, restore inline không `afterAll` | Không | `NOT VERIFIED` (không chạy lại sau M6.2) |
| 16 | `apps/api/tests/commerce_and_ai.integration.test.ts` | API Integration | Cart, Order, Checkout, AI advisor/compare | 11 | Live MySQL | Ghi orders/carts/AI logs; có `afterAll` (Report 18 từng ghi nhận 10 `ai_logs` tồn dư) | VNPay sandbox helper | `NOT VERIFIED` |
| 17 | `apps/api/tests/payment_security.test.ts` | Security Integration | VNPay HMAC signature, IPN idempotency, amount check | 13 | Live MySQL | Ghi orders/payments; có `afterAll` | VNPay HMAC local | `NOT VERIFIED` |
| 18 | `apps/api/tests/phase_a_security_remediation.test.ts` | Security Integration | IDOR, CORS, rate limit, SSRF, PII masking | 25 | Live MySQL | Ghi users/orders/addresses; có `afterAll` | Không | `NOT VERIFIED` |
| 19 | `apps/api/tests/phase_b_cart_merge.test.ts` | API Integration | M1 Backend Guest Cart Merge | 14 | Live MySQL | Ghi users/carts; có `afterAll` | Không | `NOT VERIFIED` |
| 20 | `apps/api/tests/phase_b_profile_addresses.test.ts` | API Integration | M2–M3 Profile, Addresses, Notifications, Password | 26 | Live MySQL | Ghi users/addresses/notifications; có `afterAll` | Không | `NOT VERIFIED` |
| 21 | `apps/api/tests/phase_b_customer_reviews.test.ts` | API Integration | M4 Reviews Verified Purchase, Upsert, IDOR, Moderation | 29 | Live MySQL | Ghi users/products/orders/reviews; có `afterAll` | Không | `NOT VERIFIED` |
| 22 | `apps/api/tests/phase_b_returns_and_admin_crud.test.ts` | API Integration | M5 Returns State Machine, Stock Restore, Category Delete | 30 | Live MySQL | Ghi users/products/orders/returns/categories; có `afterAll` | Không | `NOT VERIFIED` |
| 23 | `apps/api/tests/rbac_and_concurrency.test.ts` | Security/Concurrency | RBAC enforcement & concurrent stock deduction | 10 | Live MySQL | Ghi orders/products; có `afterAll` | Không | `NOT VERIFIED` |

### 3.4. Nhóm C — Playwright E2E Suites (`NOT SAFE ON LOCAL DEV DB / INCOMPLETE COVERAGE`: 2 files, 9 tests)

| # | File Path | Loại | Phạm vi hiện có | Tests | Server / DB | Ghi DB | Trạng thái gần nhất |
|---|---|---|---|---:|---|---|---|
| 24 | `tests/e2e/foundation.spec.ts` | E2E Smoke | `/foundation` API echo roundtrip | 1 | Live API (`.env` `/nexora`) + Vite | Không ghi bảng nghiệp vụ | `NOT VERIFIED` |
| 25 | `tests/e2e/storefront_journeys.spec.ts` | E2E Smoke | Render cơ bản 8 trang (`/`, `/search`, `/login`, `/ai-assistant`, `/pc-builder`, `/compare`, `/order-tracking`, `/admin`) | 8 | Live API (`.env` `/nexora`) + Vite | Read-only render | `NOT VERIFIED` |

---

## 4. TEST COVERAGE MAP THEO MODULE VÀ MILESTONE

| Milestone / Module | Backend Unit | Backend Integration (MySQL) | Frontend Component/Integration | Cross-Module Frontend QA | Playwright E2E | Khoảng trống (Gap) |
|---|---|---|---|---|---|---|
| **Auth & Session / Password Reset** | `app.test.ts` | `auth_password_reset_security` (8), `seed_and_auth_credentials` (2) | `ResetPasswordFlow` (4) | **CHƯA CÓ** | Render `/login` only | Thiếu login → redirect → logout → account switch cross-page |
| **Catalog & Product Detail** | — | `storefront.integration` (7) | `m6_3` slug resolution (2) | **CHƯA CÓ** | Render `/search` only | Thiếu Guest browse → Product Detail → Add to Cart |
| **M1 / M6.1 Cart & Guest Cart Merge** | — | `phase_b_cart_merge` (14) | `m6_1_guest_cart_merge` (23) | **CHƯA CÓ** | **0** | Thiếu liên kết Product Detail Add-to-Cart → Login → Merge → CartPage |
| **M2–M3 / M6.2 Profile & Addresses** | — | `phase_b_profile_addresses` (26) | `m6_2_customer_profile` (18) | **CHƯA CÓ** | **0** | Thiếu liên kết Auth → Profile → Address CRUD → Logout |
| **M4 / M6.3 Customer Reviews** | `review_p2002_isolation` (12) | `phase_b_customer_reviews` (29) | `m6_3_customer_reviews` (17) | **CHƯA CÓ** | **0** | Thiếu liên kết Delivered Order → Review Eligibility → Submit/Edit/Delete |
| **M5 / M6.4 Customer Returns** | `returns_state_machine` (12) | `phase_b_returns_and_admin_crud` (30) | `m6_4_customer_returns` (16) | **CHƯA CÓ** | **0** | Thiếu liên kết Orders Tab → nút tắt Đổi/Trả → Create Return → Notification cache |
| **Orders / Checkout / Payment** | — | `commerce_and_ai` (11), `payment_security` (13), `rbac_and_concurrency` (10) | **0** | **CHƯA CÓ** | Render `/order-tracking` only | Chưa có Frontend test cho luồng Checkout/Order |

---

## 5. CUSTOMER INTEGRATION FLOW MAP (8 LUỒNG NGHIỆP VỤ)

### Flow 1: Guest Browse → Product Detail → Add to Cart
- **Routes / Components:** `/` (`StorefrontHome`), `/search` (`SearchPage`), `/product/:slug` (`ProductDetailPage`).
- **Services & Endpoints:** `storefrontService.getProducts` (`GET /catalog/products`), `storefrontService.getProductBySlug` (`GET /catalog/products/:slug`), `cartService.addItem` (`POST /cart/items` kèm `guestSessionId` sinh bởi `getGuestSessionId()` tại `cartService.ts:26-37`).
- **Auth:** Public / `optionalAuth()`.
- **Query Keys:** `['products']`, `['product-detail', slug]`, invalidate `['cart']`.
- **DB Entities:** `products`, `categories`, `brands`, `carts`, `cart_items`.
- **Negative Scenarios:** Slug không tồn tại → màn hình `"Không tìm thấy sản phẩm"` (không fallback `allProducts[0]`); sản phẩm hết hàng (`stockQuantity <= 0`) chặn thêm giỏ.

### Flow 2: Guest Cart → Login → Cart Merge
- **Routes / Components:** `/product/:slug` → `/login` (`LoginPage.tsx:24-48`) hoặc `AuthModal` → `/cart` (`CartPage.tsx`).
- **Services & Endpoints:** `authService.login` (`POST /auth/login` đính kèm `guestSessionId` từ `localStorage['nexora_guest_session']`), fallback 1 lần Immediate Retry (`POST /cart/merge`) nếu `session.cartMerge` lỗi/thiếu DTO (`authService.ts:47-67`), Passive Retry trên `CartPage` (`attemptPassiveCartMerge`, `cartService.ts:70-108`).
- **Validation:** `MergeCartResultDtoSchema.safeParse()`. Chỉ xóa `nexora_guest_session` khi DTO hợp lệ 100%.
- **Query Keys:** `LoginPage.tsx:30` invalidate `['cart']`; `CartPage` refetch `['cart']`.
- **DB Entities:** `users`, `carts` (guest + user), `cart_items`, `products` (cap theo `stockQuantity`).
- **Negative Scenarios:** Sai mật khẩu (`401 INVALID_CREDENTIALS`) không xóa `nexora_guest_session`; merge thất bại vẫn bảo toàn `nexora_guest_session` cho Passive Retry; vượt tồn kho được cap & trả `warnings`.

### Flow 3: Customer Authentication → Profile → Address CRUD
- **Routes / Components:** `/login` → `/profile`, `/profile/addresses`, `/profile/notifications`, `/profile/password` (`ProfilePage.tsx`).
- **Services & Endpoints:** `profileService.getProfile` (`GET /profile`), `updateProfile` (`PUT /profile`), `getAddresses` (`GET /profile/addresses`), `createAddress` (`POST /profile/addresses`), `updateAddress` (`PUT /profile/addresses/:id`), `setDefaultAddress` (`PATCH /profile/addresses/:id/default`), `deleteAddress` (`DELETE /profile/addresses/:id`), `changePassword` (`PUT /profile/password`).
- **Auth:** `requireAuth()` (JWT Bearer).
- **Query Keys:** `['profile', userId]`, `['customer-addresses', userId]`, `['notifications', userId]`.
- **DB Entities:** `users`, `customer_addresses`, `notifications`.
- **Negative Scenarios:** Guest truy cập `/profile` bị chặn gọi API protected; IDOR địa chỉ của user khác (`403 FORBIDDEN`); đặt lại mật khẩu sai mật khẩu cũ (`400`).

### Flow 4: Product Detail → Review List → Review Eligibility → Create / Edit / Delete Review
- **Routes / Components:** `/product/:slug` (`ProductDetailPage.tsx`, `ReviewList.tsx`, `ReviewFormModal.tsx`).
- **Services & Endpoints:** `reviewService.getProductReviews` (`GET /catalog/products/:id/reviews`, top-level `data`/`pagination`/`stats`), `getReviewEligibility` (`GET /catalog/products/:id/reviews/eligibility`, chỉ gọi khi đăng nhập), `createReview` (`POST /catalog/products/:productId/reviews` — bắt buộc numeric `productId`), `updateReview` (`PUT /catalog/reviews/:id`), `deleteReview` (`DELETE /catalog/reviews/:id`, top-level `{ success, message }`).
- **Query Keys & Invalidation:** `['product-reviews', productId, page, 10]`, `['review-eligibility', productId, userId]`; sau mutation invalidate `['product-reviews', productId]`, `['review-eligibility', productId]`, `['reviews', 'home']`.
- **DB Entities:** `products`, `orders`, `order_items`, `reviews`.
- **Negative Scenarios:** Guest không gọi `/eligibility`; Customer/STAFF/ADMIN chưa có đơn `DELIVERED` bị từ chối `403 VERIFIED_PURCHASE_REQUIRED`; comment khoảng trắng thuần bị chặn; review đã tồn tại (kể cả `HIDDEN`) dùng `PUT`, không dùng `POST`.

### Flow 5: Customer Orders → Order Data → Review Eligibility (Cross-Module)
- **Routes / Components:** `/profile/orders` (`ProfilePage.tsx`) ↔ `/product/:slug` (`ProductDetailPage.tsx`).
- **Services & Endpoints:** `returnService.getMyOrders` (`GET /orders/my-orders`) trả `OrderDto[]` kèm `orderStatus`, `deliveredAt`, `items[].productId` ↔ `GET /catalog/products/:id/reviews/eligibility` đối chiếu trực tiếp `order_items` thuộc đơn `orderStatus = 'DELIVERED'` trên MySQL.
- **Chưa kiểm chứng end-to-end từ source Frontend:** Chưa có link điều hướng trực tiếp từ từng `order.items[]` trong Tab Orders sang `/product/:slug` (vì `OrderItemDto` chỉ có `productId`, `productSku`, `productName`, không có `productSlug`).

### Flow 6: Delivered Order → Return Eligibility → Create Return → List Returns → Return Detail
- **Routes / Components:** `/profile/orders` (nút tắt `"Yêu cầu đổi trả"`) → `/profile/return` và `/profile/return/:id` (`ProfilePage.tsx`, `CustomerReturnsTab.tsx`).
- **Services & Endpoints:** `returnService.getMyOrders` (`GET /orders/my-orders`), `getOwnReturns` (`GET /profile/returns`, top-level `{ returns, total, page, limit }`), `getOwnReturnDetail` (`GET /profile/returns/:id`), `createReturnRequest` (`POST /profile/returns`).
- **Query Keys & Invalidation:** `['my-orders', userId]`, `['customer-returns', userId, page, 10]`, `['customer-return-detail', userId, detailId]`; sau `POST` invalidate `['customer-returns']` và `['notifications']`.
- **DB Entities:** `orders`, `order_items`, `return_requests`, `return_items`, `return_audit_logs`, `notifications`.
- **Negative Scenarios:** Đơn không `DELIVERED`, thiếu `deliveredAt` (không fallback `updatedAt`), quá 7 ngày, vượt `remainingEligible` (bỏ qua `REJECTED`), IDOR xem chi tiết của user khác (`403 FORBIDDEN`), không có nút sửa/hủy/Admin.

### Flow 7: Logout → Cache Cleanup → Account Switching
- **Routes / Components:** `StorefrontHeader` trên mọi trang (`ProfilePage`, `ProductDetailPage`, `CartPage`, `StorefrontHome`, `WishlistPage`, ...).
- **Trạng thái hiện tại (PHÁT HIỆN RỦI RO):**
  - `authService.logout()` (`authService.ts:138-141`) chỉ xóa `nexora_token` và `nexora_user` khỏi `localStorage`.
  - Việc dọn `queryClient` đang bị phân tán và thiếu sót giữa các trang (chi tiết ở Mục 8 & Mục 11).

### Flow 8: Liên Kết Chéo Cart ↔ Product ↔ Profile ↔ Orders ↔ Reviews ↔ Returns
- `POST /profile/returns` tạo `Notification` (`type: 'RETURN'`) trong cùng Prisma transaction (`return.service.ts:297-304`) → Frontend M6.4 invalidate `['notifications']` → badge Thông báo trong M6.2 cập nhật tức thì.
- `POST/PUT/DELETE` Review invalidate `['reviews', 'home']` → cập nhật mục đánh giá trên `StorefrontHome`.
- `CheckoutPage.tsx:162-164` sau tạo đơn invalidate `['cart']`, `['products']`, `['admin-data']` (lưu ý: chưa invalidate `['my-orders']` nếu user quay lại `/profile/orders` ngay trong vòng `staleTime: 30_000`).

---

## 6. API CONTRACT VERIFICATION

Đối chiếu trực tiếp source code `apps/api/src/routes/index.ts` và từng module controller/service đã nghiệm thu ở M1–M5:

| Module | Base Mount | Endpoints Chính | Envelope Consistency Check | Ownership / Auth Check |
|---|---|---|---|---|
| **Auth** | `/api/v1/auth` | `POST /login`, `POST /register`, `GET /me`, `POST /forgot-password`, `POST /reset-password` | Chuẩn `{ success: true, data }` | JWT HS256 (`AUTH_SECRET`), rate-limited, reset token 15p one-time |
| **Catalog** | `/api/v1/catalog` | `GET /products`, `GET /products/:slug`, `GET /categories`, `GET /brands` | Chuẩn `{ success: true, data }` | Public |
| **Cart** | `/api/v1/cart` | `GET /`, `POST /items`, `PUT /items/:id`, `DELETE /items/:id`, `POST /merge` | Chuẩn `{ success: true, data }` | `optionalAuth()` + `guestSessionId`; `/merge` bắt buộc `requireAuth()` |
| **Profile** | `/api/v1/profile` | `GET/PUT /`, `PUT /password`, CRUD `/addresses`, `/notifications/*` | Chuẩn `{ success: true, data }` | `requireAuth()` + `where: { userId }` |
| **Orders** | `/api/v1/orders` | `POST /`, `GET /track`, `GET /detail/:code`, `GET /my-orders`, `POST /:code/cancel` | Chuẩn `{ success: true, data }` | `/my-orders` & `/cancel` bắt buộc `requireAuth()` + `order.userId === userId` |
| **Reviews** | `/api/v1/catalog` | `GET /products/:id/reviews`, `GET .../eligibility`, `POST /products/:id/reviews`, `PUT/DELETE /reviews/:id` | **Đặc thù đã khớp Frontend M6.3:** `GET` list có top-level `pagination` + `stats`; `DELETE` có top-level `message` (không có `data`) | `requireAuth(['CUSTOMER','STAFF','ADMIN'])`, Verified Purchase `DELIVERED`, Anti-IDOR |
| **Returns** | `/api/v1/profile` | `POST /returns`, `GET /returns`, `GET /returns/:id` | **Đặc thù đã khớp Frontend M6.4:** `GET /returns` có top-level `returns`, `total`, `page`, `limit` (không có `data`) | `requireAuth()`, Anti-IDOR trên cả `order.userId` & `returnRequest.userId` |

> **Kết luận Mục 6:** Không phát hiện sai lệch mới giữa Frontend M6.1–M6.4 và Backend M1–M5 contracts.

---

## 7. FRONTEND–BACKEND INTEGRATION MAP

| Frontend Service | File Path | Base Client | Auth Mechanism | Schema Validation |
|---|---|---|---|---|
| `authService` | `apps/web/src/services/authService.ts` | `apiClient` (`/api/v1`) | Lưu/xóa `nexora_token` & `nexora_user` | `MergeCartResultDtoSchema.safeParse` |
| `cartService` | `apps/web/src/services/cartService.ts` | `apiClient` | Bearer + `x-guest-session` / body `guestSessionId` | `MergeCartResultDtoSchema.safeParse` |
| `storefrontService` | `apps/web/src/services/storefrontService.ts` | `apiClient` | Public | Typed `@nexora/shared` DTOs |
| `profileService` | `apps/web/src/services/profileService.ts` | `apiClient` | Bearer JWT (interceptor) | `ChangePasswordInputSchema.safeParse` |
| `reviewService` | `apps/web/src/services/reviewService.ts` | `apiClient` | Bearer JWT (trừ `GET` public) | `CreateReviewInputSchema.safeParse` |
| `returnService` | `apps/web/src/services/returnService.ts` | `apiClient` | Bearer JWT | `CreateReturnRequestInputSchema.safeParse` |

---

## 8. AUTHENTICATION, AUTHORIZATION VÀ CACHE VERIFICATION

### 8.1. Authentication & Authorization
- `apps/web/src/lib/apiClient.ts:13-19` tự động đọc `localStorage.getItem('nexora_token')` gắn header `Authorization: Bearer <token>`.
- Không có response interceptor toàn cục xử lý `401 INVALID_TOKEN` (khi JWT hết hạn giữa phiên, mỗi trang tự xử lý lỗi cục bộ; `AdminDashboardPage.tsx:333` có tự logout khi 401/403, còn các trang Customer giữ nguyên UI và báo lỗi).

### 8.2. Ma Trận Dọn Cache Khi Logout (Phát Hiện Quan Trọng)

| Trang | File & Line | Các Query Key được xóa/invalidate khi `onLogout` | Query Key còn sót trong bộ nhớ |
|---|---|---|---|
| `ProfilePage` | `ProfilePage.tsx:461-469` | `removeQueries`: `customer-returns`, `customer-return-detail`, `my-orders` | `profile`, `customer-addresses`, `notifications`, `review-eligibility`, `cart`, `wishlist-count` |
| `ProductDetailPage` | `ProductDetailPage.tsx:415-420,493-500` | `invalidateQueries`: `cart`, `wishlist-count`; `removeQueries`: `review-eligibility` | `profile`, `customer-addresses`, `notifications`, `customer-returns`, `my-orders` |
| `StorefrontHome` / `CartPage` | `StorefrontHome.tsx:93-99`, `CartPage.tsx:184-189` | `invalidateQueries`: `cart`, `wishlist-count` | Toàn bộ user-scoped queries (`profile`, `customer-addresses`, `notifications`, `customer-returns`, `review-eligibility`, `my-orders`) |
| `WishlistPage`, `AiAssistantPage`, `PcBuilderPage`, `OrderTrackingPage`, `PostDetailPage` | `WishlistPage.tsx:71-74`, v.v. | **KHÔNG GỌI `queryClient` nào** | Toàn bộ queries bao gồm cả `['cart']` và `['wishlist']` (không chứa `userId` trong key!) |

> **Đánh giá tác động:** Các query có `currentUser?.id` trong key (`profile`, `customer-addresses`, `notifications`, `my-orders`, `customer-returns`, `review-eligibility`) sẽ không hiển thị nhầm sang Account B khi đổi tài khoản, nhưng vẫn tồn lưu trong RAM đến khi hết `gcTime` (5 phút). Riêng `['cart']`, `['wishlist']`, `['wishlist-count']` **không có `userId` trong key** nên nếu đăng xuất từ `WishlistPage`/`PcBuilderPage` và không reload trang, dữ liệu cũ có thể hiển thị thoáng trong `staleTime: 30_000`!

---

## 9. DATABASE / TEST ENVIRONMENT SAFETY ASSESSMENT (BẮT BUỘC)

| Hạng mục kiểm tra | Bằng chứng xác minh | Kết luận an toàn |
|---|---|---|
| **Local `.env` `DATABASE_URL`** | `mysql://<masked>@127.0.0.1:3306/nexora` (trùng 100% database phát triển có 674 sản phẩm) | **KHÔNG CÔ LẬP** |
| **Dedicated local test DB (`.env.test` / `nexora_test`)** | `.env.test` = `False`, `apps/api/.env.test` = `False`, `docker-compose.yml` chỉ khởi tạo 1 DB `${MYSQL_DATABASE:-nexora}` | **CHƯA TỒN TẠI** |
| **CI Test Database** | `.github/workflows/ci.yml:61-80` dựng MySQL 8.4 ephemeral container riêng biệt cho từng run | **AN TOÀN TRONG CI** |
| **Risk of modifying seeded accounts** | `seed_and_auth_credentials.test.ts:24-77` sửa `admin@nexora.local`; `auth_password_reset_security.test.ts:148-226` sửa `customer@nexora.local` mà không có `try/finally` rollback | **NOT SAFE ON LOCAL DEV DB** |
| **Risk of residual test rows** | `commerce_and_ai.integration.test.ts` từng để lại 10 `ai_logs`; `storefront.integration.test.ts` không có `afterAll` | **NOT SAFE ON LOCAL DEV DB** |
| **External services sandboxing** | `EmailService` (`email.service.ts:34-41`) dùng `streamTransport` in-memory khi `NODE_ENV=test`; VNPay test HMAC cục bộ; Google OAuth chưa cấu hình | **SANDBOXED / SAFE** |

### Phân loại thực thi dứt khoát:
- **SAFE TO EXECUTE NOW (0 DB access):** 11 DB-free test files (`npm run test:unit` = **115 tests**).
- **NOT SAFE TO EXECUTE ON `/nexora`:** 12 Backend DB Integration files (**176 tests**) + 2 Playwright E2E files (**9 tests**). Chỉ được chạy khi có **dedicated `nexora_test` DB** tách biệt hoàn toàn với `/nexora`!

---

## 10. PLAYWRIGHT VÀ CI READINESS

### 10.1. Những gì ĐÃ cấu hình (`tests/playwright.config.ts`, `.github/workflows/ci.yml`)
- `@playwright/test@^1.59.0` đã cài trong root `package.json:34`; script `npm run test:e2e` trỏ tới `tests/playwright.config.ts`.
- `webServer` tự khởi động `node apps/api/dist/server.js` (port 3000) và `npm run dev:web` (port 5173) với `reuseExistingServer: !process.env.CI`.
- Đã có 2 file spec smoke (`foundation.spec.ts` 1 test, `storefront_journeys.spec.ts` 8 tests read-only render).
- CI `.github/workflows/ci.yml` đã chạy 2 job: `quality-and-build` (DB-free) và `mysql-integration` (MySQL 8.4 container + `npm run test` + `db.integration.test.ts`).

### 10.2. Những gì CHƯA cấu hình (Gaps — chỉ đề xuất, chưa sửa)
- `tests/playwright.config.ts` **chưa cấu hình** `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`, `reporter: [['html'], ['list']]`, hay output folder cho artifacts.
- **Chưa có** Playwright authentication fixtures (`storageState`) hoặc test accounts riêng cho E2E.
- **Chưa có** E2E specs cho M6.1 (Cart Merge), M6.2 (Profile/Addresses), M6.3 (Reviews), M6.4 (Returns).
- `.github/workflows/ci.yml` **chưa có** job chạy Playwright E2E.
- Trạng thái cài đặt Chromium binary trên máy local hiện là **`NOT VERIFIED`** (không chạy `playwright` trong Discovery read-only).

---

## 11. RISK REGISTER

| ID | Severity | Mô tả rủi ro | Bằng chứng | Tác động | Khuyến nghị |
|---|---|---|---|---|---|
| **R-01** | **CRITICAL** | Chạy `npm run test` hoặc Playwright local sẽ ghi/sửa thẳng vào local dev DB `/nexora` (674 sản phẩm) | `.env` → `/nexora`; `.env.test` không tồn tại; `seed_and_auth_credentials.test.ts:24` & `auth_password_reset_security.test.ts:148` sửa password tài khoản seeded | Hỏng dữ liệu catalog hoặc khóa tài khoản `admin`/`customer` nếu test ngắt giữa chừng | Bắt buộc tách `nexora_test` DB riêng (hoặc Docker ephemeral MySQL) trước khi chạy Tier 2 / Tier 3 |
| **R-02** | **MEDIUM-HIGH** | Dọn dẹp TanStack Query cache khi logout không đồng nhất giữa các trang; `['cart']`, `['wishlist']`, `['wishlist-count']` thiếu `userId` | `ProfilePage.tsx:461-469`, `WishlistPage.tsx:71-74`, `PcBuilderPage.tsx:539`, `CheckoutPage.tsx:162` | Rủi ro lộ thoáng dữ liệu giỏ/wishlist cũ trong `staleTime: 30_000` khi đổi tài khoản không F5 | Kiểm thử rõ trong M6.5; xin Owner phê duyệt fix tập trung (hoặc ghi nhận xử lý ở Phase 10) |
| **R-03** | **MEDIUM** | `CheckoutPage.tsx:162-164` sau tạo đơn không invalidate `['my-orders']` | `apps/web/src/features/checkout/CheckoutPage.tsx:162-164` | User mở `/profile/orders` ngay trong 30 giây sau checkout có thể thấy danh sách đơn cũ | Thêm test & đề xuất invalidate `['my-orders']` nếu Owner duyệt fix |
| **R-04** | **MEDIUM** | Playwright E2E chưa bao phủ M6.1–M6.4 và chưa chạy trong CI | `tests/e2e/storefront_journeys.spec.ts`, `.github/workflows/ci.yml` | Chưa có kiểm chứng browser thật cho toàn bộ luồng Customer M6 | Bổ sung trong Tier 3 sau khi có `nexora_test` DB cô lập |
| **R-05** | **LOW** | `seed_and_auth_credentials.test.ts` & `auth_password_reset_security.test.ts` restore password inline thay vì `try/finally` | `seed_and_auth_credentials.test.ts:73-77`, `auth_password_reset_security.test.ts:175-184` | Nếu test fail sớm trên test DB dùng lại, các suite sau fail theo | Chỉ chạy trên ephemeral/isolated `nexora_test` DB |

---

## 12. PROPOSED M6.5 TEST PLAN (3 TIERS)

### Tier 1 — DB-Free Monorepo Verification & Cross-Module Frontend QA *(SAFE IMMEDIATELY — 0 DB access)*
1. Chạy `npm run test:unit` (toàn bộ 11 DB-free suites = 115 tests: `packages/shared` + `apps/web` M6.1–M6.4 + 3 backend unit suites).
2. Xây dựng và chạy suite **Cross-Module Customer Integration QA** mới (`apps/web/tests/m6_5_customer_integration_qa.test.tsx`, `jsdom` + mock `apiClient` ở cấp HTTP — **0 DB access**) kiểm thử toàn bộ 8 luồng liên kết xuyên suốt:
   - Flow 1: Browse → Product Detail (`/product/:slug`) → Add to Cart (guest session creation).
   - Flow 2: Guest Cart → Login (`/login`) → Auto-Merge + Immediate Retry + Passive Retry on `/cart`.
   - Flow 3: Login → Profile → Address CRUD → Notifications → Password Change.
   - Flow 4–5: Delivered Order → Product Detail → Review Eligibility → Create/Edit/Delete Review & Header/Home cache sync.
   - Flow 6: Orders Tab shortcut → `/profile/return` → Create Multi-item Return → List + Detail + Notification cache sync.
   - Flow 7: Logout → Account A → Account B switching & cache isolation audit.
   - Flow 8: Error matrix (`400`/`401`/`403`/`404`/`500`) xuyên suốt các dịch vụ.
3. Chạy đầy đủ quality gates: `npm run typecheck`, `npm run lint`, `npm run format:check` (phạm vi M6.5), `npm run build` (cả API + Web).

### Tier 2 — Isolated MySQL Integration & Security Regression *(CHỈ CHẠY KHI OWNER PHÊ DUYỆT `nexora_test` DB)*
1. Dựng schema độc lập `nexora_test` trên MySQL 8.4 (hoặc container Docker MySQL tạm riêng port `3307`), chạy `prisma migrate deploy` + `prisma/seed.ts` **CHỈ trên `nexora_test`** (tuyệt đối không chạm `/nexora`).
2. Chạy toàn bộ 12 Backend Integration & Security suites (176 tests) với biến môi trường phiên `DATABASE_URL=.../nexora_test`.
3. Xác minh bảng đếm trên `/nexora` trước và sau chạy là **không đổi 100%** (674 sản phẩm, 31 thương hiệu, 36 danh mục).

### Tier 3 — Playwright E2E Smoke & Customer Journeys *(CHỈ CHẠY TRÊN `nexora_test` DB + KHI OWNER PHÊ DUYỆT)*
1. Xác minh Chromium binary và chạy `foundation.spec.ts` + `storefront_journeys.spec.ts` hướng vào `nexora_test` DB.
2. *(Tùy chọn nếu Owner phê duyệt)* Mở rộng E2E spec cho luồng Login → Cart Merge → Profile → Review → Return trên `nexora_test` và bật `screenshot: 'only-on-failure'` + `trace: 'retain-on-failure'`.

---

## 13. TEST DATA STRATEGY VÀ ISOLATION REQUIREMENTS

1. **Nguyên tắc vàng:** **TUYỆT ĐỐI KHÔNG** chạy bất kỳ integration/E2E test nào trỏ vào `127.0.0.1:3306/nexora`.
2. **Isolation bắt buộc cho Tier 2 & Tier 3:**
   - **Phương án A (Khuyến nghị mạnh nhất — Zero risk với local MySQL):** Chạy 1 Docker container tạm `mysql:8.4` trên port `3307` với database `nexora_test`, truyền `DATABASE_URL="mysql://nexora:test_ephemeral_pw@127.0.0.1:3307/nexora_test"` chỉ trong lệnh chạy test, rồi hủy container khi xong (`docker rm -f`).
   - **Phương án B (Fallback nếu không muốn container riêng):** Tạo schema riêng `nexora_test` trên MySQL 8.4 hiện có, chỉ dùng `DATABASE_URL=.../nexora_test`, tuyệt đối không đụng schema `nexora`.
3. **Teardown & Guardrail:** Trước khi thực thi Tier 2/3, in tên database đích từ `DATABASE_URL` (đã che password) và assert tên DB kết thúc bằng `_test` trước khi chạy `prisma migrate deploy` / `vitest`.

---

## 14. PROPOSED TEST EXECUTION ORDER

1. **Step 1 (DB-Free Baseline):** `npm run typecheck` → `npm run lint` → `npm run build` → `npm run test:unit` (115 tests).
2. **Step 2 (Cross-Module Frontend QA):** Viết & chạy `apps/web/tests/m6_5_customer_integration_qa.test.tsx` (DB-free, `jsdom`).
3. **Step 3 (Isolated MySQL Integration — khi Owner duyệt Phương án A/B):** Provision `nexora_test` → `db:deploy` → `db:seed` → chạy 12 Backend Integration suites (176 tests) trên `nexora_test` → ghi nhận toàn bộ 291+ Vitest tests.
4. **Step 4 (Playwright E2E — khi Owner duyệt):** Chạy Playwright smoke + authenticated flows trên `nexora_test` → thu thập report/artifacts.
5. **Step 5 (QA Acceptance Report):** Xuất báo cáo tổng hợp M6.5 kèm xác minh `nexora` dev DB 0 mutations & Git status sạch.

---

## 15. ACCEPTANCE CRITERIA VÀ EXIT CRITERIA CHO M6.5

M6.5 chỉ được đóng `PASS` khi:
1. Toàn bộ Tier 1 (115 unit/frontend tests + bộ cross-module `m6_5_customer_integration_qa.test.tsx`) PASS 100%.
2. `npm run typecheck`, `npm run lint`, Prettier (files thuộc M6.5), và `npm run build` (cả API và Web) PASS (exit code 0).
3. Nếu Tier 2 được phê duyệt: toàn bộ 12 Backend Integration & Security suites (176 tests) chạy trên **`nexora_test` cô lập** đạt PASS 100%, và dev DB `/nexora` được chứng minh **0 mutations**.
4. Nếu Tier 3 được phê duyệt: Playwright E2E đạt PASS trên môi trường cô lập.
5. Mọi lỗi/defect phát hiện được (ví dụ `R-02`, `R-03`) đều được phân loại Severity rõ ràng và chỉ sửa những file nằm trong allowlist được Owner phê duyệt.
6. Không có thay đổi ngoài phạm vi (không STAFF, không TechPilot migration, không cleanup hàng loạt, không push).

---

## 16. KNOWN LIMITATIONS VÀ ITEMS NOT VERIFIED

- **Không chạy bất kỳ test nào trong phiên Discovery này** (tuân thủ nghiêm Mục 3: *"Không chạy unit/integration/E2E tests"*). Do đó kết quả hiện thời của 12 Backend Integration suites và 2 Playwright E2E suites được ghi trung thực là `NOT VERIFIED` tại HEAD `3d8adb1`.
- Trạng thái cài đặt local browser binary của Playwright (`chromium`) chưa được xác minh (chờ lệnh Execution).
- Docker daemon có đang chạy để cấp Phương án A (MySQL container tạm port 3307) hay không chưa được kiểm tra trong phiên read-only này.

---

## 17. DANH SÁCH FILE DỰ KIẾN CẦN TẠO / SỬA (CHỜ OWNER PHÊ DUYỆT — CHƯA SỬA)

### A. Phạm vi QA-Only Tối Thiểu (Không sửa production code)
| # | File Path | Action | Mục đích |
|---|---|---|---|
| 1 | `apps/web/tests/m6_5_customer_integration_qa.test.tsx` | **NEW** | Bộ Cross-Module Customer Integration QA (8 luồng M6.1–M6.4, 100% DB-free trong `jsdom`). |

### B. Phạm vi Tùy Chọn (CHỈ thực hiện nếu Owner phê duyệt mở rộng allowlist)
| # | File Path | Action | Lý do |
|---|---|---|---|
| 2 | `apps/web/src/services/authService.ts` *(hoặc helper logout)* + các trang gọi `onLogout` | **OPTIONAL MODIFY** | Khắc phục tập trung rủi ro `R-02` (dọn sạch toàn bộ user-scoped TanStack Query cache khi logout trên mọi trang). |
| 3 | `apps/web/src/features/checkout/CheckoutPage.tsx` | **OPTIONAL MODIFY** | Khắc phục rủi ro `R-03`: bổ sung `invalidateQueries({ queryKey: ['my-orders'] })` sau tạo đơn thành công. |
| 4 | `tests/playwright.config.ts` & `tests/e2e/customer_flows.spec.ts` | **OPTIONAL MODIFY/NEW** | Bật `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'` và bổ sung E2E cho M6.1–M6.4 trên `nexora_test`. |

---

## XÁC NHẬN AN TOÀN GIT & DATABASE

- **Branch:** `main`
- **HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` *(không đổi)*
- **Tracked source/test changes:** `0`
- **Tests executed in Discovery:** `0` (tuân thủ nghiêm cấm chạy test trong Phase A)
- **Database mutations:** `ZERO`
- **Git commit / push:** Không stage, không commit, không push.
- **Sole Deliverable Created:** `comprehensive-audit/28_M6_5_INTEGRATION_QA_DISCOVERY.md`
