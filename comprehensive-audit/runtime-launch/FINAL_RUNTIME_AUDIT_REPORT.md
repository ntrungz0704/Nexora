# NEXORA — FINAL RUNTIME AUDIT, LAUNCH & QUALITY VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Audit Execution Window:** `2026-11-25 11:30 – 17:30 (+07:00)`
- **Target Git State:** Branch `main` | HEAD `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` (`fix(catalog): dong bo danh muc category va toi uu anh san pham laptop`)
- **Authorization & Guardrails:** Controlled Local Launch + Comprehensive Read-Only Source/Git Audit (0 source code edits, 0 schema edits, 0 commits/pushes, `TechPilot/` untouched, Dev DB `127.0.0.1:3306/nexora` protected from mutating suites).

---

## A. Executive Summary

| Dimension | Status | Summary of Observed Evidence |
| --- | --- | --- |
| **Overall Launch & Audit Verdict** | **`PASS WITH LIMITATIONS`** | Backend (`:3000`) và Frontend (`:5173`) khởi chạy thực tế, truy cập trình duyệt được, kết nối MySQL `8.4.13` ổn định; tuy nhiên tồn tại 3 lỗi `P1` (mapping ảnh sản phẩm, lọc slot CPU trong PC Builder, nút Google trên `/register`), 4 lỗi `P2`, 5 lỗi `P3` và chưa cấu hình SMTP/Gemini/Google OAuth/VNPay Production. |
| **Website Startup Status** | **RUNNING** | Hai tiến trình daemon hiện đang hoạt động nền (`npm run dev:api` và `npm run dev:web`), phản hồi HTTP `200` khi kiểm chứng trước bàn giao. |
| **Frontend Status** | **RUNNING (WITH DEFECTS)** | `Vite v8.3.8` trên `http://localhost:5173/` (`PID 32852`), build production (`dist/`) sạch không lộ secret. Đã xác minh thực tế 22 desktop routes + 30 kiểm tra responsive + các luồng tương tác D3–D12. |
| **Backend Status** | **RUNNING (WITH LIMITATIONS)** | `tsx watch` Express/TS API trên `http://localhost:3000/api/v1` (`PID 2968`), `/health` & `/system/meta` trả `200`, bảo mật RBAC/IDOR/CORS/Helmet/Validation hoạt động; `/auth/forgot-password` trả `500 EMAIL_DELIVERY_FAILED` trên dev khi thiếu SMTP/Resend. |
| **Database Connectivity** | **UP (PROTECTED)** | MySQL `8.4.13` (`nexora-mysql-1`, `127.0.0.1:3306/nexora`, hostname `7ffc1a14a558`) khỏe mạnh (`27` bảng, `8` migrations áp dụng sạch). 0 bảng nghiệp vụ bị sửa đổi ngoài `+8` dòng `carts` rỗng do trình duyệt khách mở Storefront/Cart trong Phase D/E. |
| **Quality Gates** | **PARTIAL (`3/4` PASS)** | `typecheck` **PASS**, `lint` **PASS** (0 error/warning), `build` **PASS** (có cảnh báo chunk `1,186.36 kB > 500 kB`), `format:check` **FAIL** (`63` file chưa format Prettier, gồm 4 file `.ts/.tsx` đang chạy). |
| **Test Suite Results** | **PASS (`320 / 320`)** | Khớp 100% baseline M6.5 khi chạy an toàn trên máy cô lập (`3307/nexora_test`): Unit/RTL `135/135`, Backend Integration/Security `175/175`, DB Connection `1/1`, Playwright E2E `9/9`. |
| **Critical / High Defects** | **0 `P0`, 3 `P1`** | Không có lỗi `P0` sập hệ thống hay lộ secret/bypass RBAC; có 3 lỗi `P1` nghiệp vụ/dữ liệu UI rõ ràng (`DEF-RT-01`, `DEF-RT-02`, `DEF-RT-03`). |

---

## B. Environment Audit (Phase A)

### B1. Git & Repository Baseline vs Expected Prompt Baseline

- **Branch:** `main`
- **Actual HEAD:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6`
- **Baseline Note:** Prompt nêu expected historical HEAD `607315261fcf802c517e0d32e210817d2080341d` (`feat(web): hoan tat milestone m6.5 integration qa`). Thực tế lịch sử Git đã tiến thêm 3 commit sau M6.5 (không tự ý reset theo đúng quy tắc bảo vệ):
  - `bddbf44` — `fix(catalog): dong bo danh muc category va toi uu anh san pham laptop`
  - `84ccd42` — `fix(admin): can bang chieu cao hang bang thuong hieu va toi uu logo apple`
  - `d495d62` — `docs(handover): cap nhat ho so kiem toan toan dien va bo tai lieu ban giao ky thuat`
- **Legacy `TechPilot/`:** Đường dẫn `D:\Nexora\TechPilot` và `D:\02 Dự Án Phần Mềm\TechPilot (Bản Chính Thức)\` không tồn tại trên hệ thống (`false`), không phát sinh nhầm lẫn hoặc sửa đổi file di sản.

### B2. Runtime Versions & Dependencies (`evidence/phase_a_inspect.log`)

| Component | Observed Value | Status |
| --- | --- | --- |
| **OS** | `Windows_NT 10.0.26300 x64` (Windows 11 Pro) | Verified |
| **Node.js / npm** | `v22.23.4` / `npm 10.9.9` (Workspaces: `@nexora/web`, `@nexora/api`, `@nexora/shared`, `@nexora/config`) | Verified |
| **TypeScript (`tsc`)** | `5.9.3` | Verified |
| **Docker / Compose** | Docker `29.9.3` (build `5457199`) / Docker Compose `v5.7.0` | Verified |
| **Workspace Dependencies** | `npm ls --depth=0`: `OK (0 missing/invalid)` | **PASS** |

### B3. Environment Variables Classification (`D:\Nexora\.env` — Secrets Redacted)

| Variable Group | Keys Inspected | Classification | Impact & Runtime Behavior |
| --- | --- | --- | --- |
| **Database & Core** | `NODE_ENV` (`development`), `DATABASE_URL` (`mysql://nexora:***@127.0.0.1:3306/nexora`), `MYSQL_*` | `REQUIRED AND CONFIGURED` | Kết nối đúng Docker MySQL `8.4.13` (`nexora-mysql-1`). |
| **Auth / JWT** | `AUTH_SECRET` (`length=64`, non-placeholder) | `REQUIRED AND CONFIGURED` | Ký & xác thực JWT (`7d` expiry) hoạt động bình thường. |
| **Server & CORS** | `API_PORT` (`3000`), `WEB_PORT` (`5173`), `VITE_API_BASE_URL` (`http://localhost:3000/api/v1`), `CLIENT_URL`, `SERVER_URL`, `CORS_ALLOWED_ORIGINS` (`http://localhost:5173,http://127.0.0.1:5173`) | `REQUIRED AND CONFIGURED` | Khớp cấu hình port Vite (`5173`) và Express API (`3000`). |
| **Reverse Proxy** | `TRUST_PROXY` | `OPTIONAL AND MISSING` | Mặc định `false` trên local dev; phù hợp chạy nội bộ. |
| **Email Service** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `RESEND_API_KEY` | `OPTIONAL AND MISSING` (Dev Impact) | Khi gọi `POST /api/v1/auth/forgot-password` cho email tồn tại trong DB ở `NODE_ENV=development`, `email.service.ts` ném lỗi `EMAIL_SERVICE_NOT_CONFIGURED` -> HTTP `500 EMAIL_DELIVERY_FAILED` (`DEF-RT-04`). |
| **Gemini AI** | `GEMINI_API_KEY` | `OPTIONAL AND MISSING` | Gemini cloud integration: **`NOT VERIFIED`**. Hệ thống chuyển sang rule-based deterministic fallback cho Survey 5 bước và Chatbot. |
| **VNPay Gateway** | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL` | `OPTIONAL AND MISSING` (Dev Sandbox Fallback Active) | Ở `NODE_ENV=development`, `payment.service.ts` dùng cấu hình Sandbox dev (`vnp_TmnCode=NEXORATM`, host `sandbox.vnpayment.vn`) để tạo URL ký HMAC-SHA512; chưa cấu hình credential production/riêng. |
| **Google OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `OPTIONAL AND MISSING` | Nút Google trên UI chỉ là **UI ONLY / MOCKED** (`DEF-RT-03`). |

### B4. Database Connectivity & Dev Schema State (`evidence/phase_a_db_meta.log`)

- **Engine & Host:** MySQL `8.4.13`, database `nexora`, container hostname `7ffc1a14a558` (Docker `nexora-mysql-1`, `3306`).
- **Tables & Migrations:** Đủ `27/27` bảng khớp `prisma/schema.prisma`; `8/8` `_prisma_migrations` đã hoàn tất (`rolled_back_at: null`).
- **Initial Seed Counts (`dev_db_before_tests.json`):** Tổng `834` dòng trên `27` bảng (`products: 674`, `categories: 22`, `brands: 31`, `banners: 9`, `posts: 8`, `coupons: 5`, `orders: 2`, `order_items: 2`, `users: 3`, `store_settings: 5`, `flash_sales: 1`, `flash_sale_items: 1`, `customer_addresses: 1`, `notifications: 2`, `ai_assistant_logs: 12`, `wishlists: 1`, `carts: 20`, `cart_items: 2`, `reviews: 0`, `return_requests: 0`, `inventory_logs: 0`).
- **Users Present (No Secrets Printed):**
  - `id=1`: `admin@nexora.local` (`ADMIN`, `ACTIVE`)
  - `id=2`: `staff@nexora.local` (`STAFF`, `ACTIVE`)
  - `id=3`: `customer@nexora.local` (`CUSTOMER`, `ACTIVE`)
- **Orders Observation:** `NX-2026-0001` (`DELIVERED`, `PAID`, `3.790.000đ`) có `delivered_at: null` do migration `20261122160000_sanitize_unverified_delivered_at`; `NX-2026-0002` đang ở trạng thái `SHIPPING` (`VNPAY`, `PAID`, `3.920.000đ`).

---

## C. Quality Gates & Test Execution (Phase B)

Toàn bộ các bài test có khả năng ghi dữ liệu (Tier 2A, Tier 2B, Tier 3 Playwright) được chạy **100% cô lập** trên container tạm `nexora-audit-test-db` (`mysql:8.4` với `--tmpfs` trên `127.0.0.1:3307/nexora_test`, hostname xác minh khác `7ffc1a14a558`, đã xóa sạch sau khi chạy).

| Gate / Suite | Command Executed | Scope / Target | Result | Exit Code | Log File |
| --- | --- | --- | --- | --- | --- |
| **B1. TypeScript** | `npm run typecheck` | `@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` | **PASS** (0 errors) | `0` | [`phase_b1_typecheck.log`](evidence/phase_b1_typecheck.log) |
| **B2. ESLint** | `npm run lint` | Entire workspace (`eslint .`) | **PASS** (0 errors/warnings) | `0` | [`phase_b2_eslint.log`](evidence/phase_b2_eslint.log) |
| **B3. Prettier** | `npm run format:check` | `**/*.{ts,tsx,js,mjs,json,md,css}` | **FAIL** (`63` files: 4 active TS/TSX, 1 seed TS, 58 `.md`) | `1` | [`phase_b3_prettier.log`](evidence/phase_b3_prettier.log) |
| **B4. Production Build** | `npm run build` | Packages + API + Web (`288` modules, JS `1,186.36 kB` / gzip `294.66 kB`, CSS `81.87 kB`) | **PASS** *(chunk > 500 kB warning)* | `0` | [`phase_b4_build.log`](evidence/phase_b4_build.log) |
| **B5-1/2/3. Unit & RTL** | `npm run test:unit` | `12` test files (`packages/shared`, `apps/web`, Pure API unit) — DB-free | **PASS (`135 / 135`)** | `0` | [`phase_b5_unit_tests.log`](evidence/phase_b5_unit_tests.log) |
| **B5-4A. Backend Integration & Security** | `vitest run --no-file-parallelism ...` (11 files) | Isolated `127.0.0.1:3307/nexora_test` (`85cea17be809`) | **PASS (`175 / 175`)** | `0` | [`phase_b5_tier2a_backend.log`](evidence/phase_b5_tier2a_backend.log) |
| **B5-4B. DB Connectivity Test** | `vitest run tests/db.integration.test.ts` | Isolated `127.0.0.1:3307/nexora_test` | **PASS (`1 / 1`)** | `0` | [`phase_b5_tier2b_db.log`](evidence/phase_b5_tier2b_db.log) |
| **B5-5. Playwright E2E** | `playwright test --config=tests/playwright.config.ts` (`CI=true`) | `2` spec files (`foundation.spec.ts` + `storefront_journeys.spec.ts` J1–J8) trên isolated `3307` | **PASS (`9 / 9`)** | `0` | [`phase_b5_tier3_playwright.log`](evidence/phase_b5_tier3_playwright.log) |

**Đối chiếu Baseline M6.5:** `36` Pure Unit + `99` Frontend RTL + `176` Backend/DB (`175 + 1`) + `9` Playwright = **`320 / 320 PASS`** (khớp chính xác 100%, không sửa test hay bỏ qua assertion).

---

## D. Runtime Audit (Phase C & Live Handover State)

Các server bàn giao đã được khởi chạy bằng script chính thức của repository (`npm run dev:api` và `npm run dev:web`) và kiểm chứng trực tiếp trước khi lập báo cáo:

- **Backend API URL:** `http://localhost:3000/api/v1` (Swagger JSON: `http://localhost:3000/api/docs.json`)
- **Frontend Web URL:** `http://localhost:5173/` (Admin URL: `http://localhost:5173/admin`)
- **Health Endpoint (`GET /api/v1/health`):** `HTTP 200` (`37.1 ms`) — `{"success":true,"data":{"status":"ok","service":"nexora-api","database":"up","uptimeSeconds":25}}`
- **System Meta (`GET /api/v1/system/meta`):** `HTTP 200` (`9.3 ms`) — `businessModel: "single-vendor"`, `roles: ["CUSTOMER","STAFF","ADMIN"]`, `storeSettingsCount: 5`, `usersCount: 3`
- **CORS & Catalog Verification:** `GET /api/v1/catalog/categories` (`Origin: http://localhost:5173`) trả `HTTP 200` (`19.0 ms`, `ACAO: http://localhost:5173`, `22` categories); `GET /api/v1/catalog/products?limit=24` trả `HTTP 200` (`total: 674`); `GET http://127.0.0.1:5173/` trả `HTTP 200` (`21.0 ms`).
- **Active Daemon Processes (Handover Verification):**
  - **Backend API (`npm run dev:api` -> `tsx watch src/server.ts`):** Parent npm PID `8456` / `25420`, `tsx` watcher PID `28924`, active API worker PID **`2968`** (listening `:3000`).
  - **Frontend Web (`npm run dev:web` -> `vite --port 5173`):** Parent npm PID `16932` / `13048`, Vite server PID **`32852`** (listening `:5173`).

---

## E. Functional & Visual Browser Coverage (Phase D, E, F, G)

Kiểm toán trình duyệt thực tế được thực hiện trên 2 tầng:
1. **Live Read-Only & Visual/Responsive/Security Audit (`http://localhost:5173` -> `http://localhost:3000` -> `3306/nexora`):** `22` desktop routes (`phase_de_browser_audit.json`), kiểm tra tài sản ảnh đĩa & cuộn (`phase_de_assets_and_deep_checks.json`), `30` ma trận responsive across 5 viewport (`375x812`, `430x932`, `768x1024`, `1366x768`, `1440x900`), `13` kiểm tra bảo mật HTTP + bundle scan + benchmark API + `13` Admin tabs (`phase_fg_security_perf_admin.json`).
2. **Isolated Full-Interactive Transactional E2E Verification (`http://127.0.0.1:5174` -> `http://127.0.0.1:3001` -> `3307/nexora_test`):** Thực thi đầy đủ thao tác ghi thật (Compare AI, Cart Merge, Register/Cross-Tab Logout, Profile/Address/Password CRUD, Verified-Purchase Reviews, 7-day Return Request + Admin Approval, COD Checkout + Coupon, VNPay Sandbox URL + Tampered Callback, Customer RBAC Guard + Inventory Adjust, 5-step AI Survey + Chatbot Fallback, Rate-Limit `429`) với `sectionErrors: {}` (`phase_df_isolated_interactive.json`).

| Module / Area | Tested Scope | Status | Key Findings & Limitations | Evidence |
| --- | --- | --- | --- | --- |
| **D1. Storefront & Catalog** | Home, Header, Footer, Banner, Search, Category/Brand filter, Sorting, 404, Foundation | **PARTIAL (`PASS WITH DEFECTS`)** | `21/22` route `brokenImagesCount: 0`, không lộ `undefined`/`null`, lọc `Laptop` thu về `63` SP từ `674` SP; tuy nhiên `DEF-RT-01` ánh xạ sai ảnh cho màn hình/tản nhiệt/console, `DEF-RT-06` sidebar category hardcode 16 mục cũ, `Home` có `62` ảnh lazy off-screen trong carousel (`39` `naturalWidth: 0`), copy `300K`/`500k` & hotline `1800 2097`/`1900 1234` lệch nhau (`DEF-RT-09`). | [`phase_de_browser_audit.json`](evidence/phase_de_browser_audit.json), [`01b_home_no_popup.png`](evidence/screenshots/01b_home_no_popup.png) |
| **D2. Product Detail** | SP có thumbnail thật (`macbook-pro-16-m3-max`) & fallback, SKU, giá, stock, specs, add cart, tabs | **PARTIAL (`PASS WITH DEFECTS`)** | Nội dung, giá, specs và thêm giỏ hàng hoạt động tốt trên desktop (`0` broken img); lỗi responsive `DEF-RT-07`: tràn ngang `920px` tại Tablet `768x1024`. | [`resp_tablet_product_overflow.png`](evidence/screenshots/resp_tablet_product_overflow.png) |
| **D3. PC Builder & Compare** | Chọn/đổi linh kiện, công suất, thêm 2 SP so sánh, Category Lock, AI Persona verdict | **PARTIAL (`DEFECT IN PC BUILDER`)** | Compare Page (`Category Lock` + AI Persona `Kết quả phân tích Nexora AI` + `0 pageErrors`) **PASS** (`isolated_d3_compare.png`). PC Builder bị **`DEF-RT-02`**: slot CPU lọc nhầm `Máy chơi game cầm tay Lenovo Console-CN31 Ryzen Z1 Extreme 1TB`. | [`05b_pc_builder_active.png`](evidence/screenshots/05b_pc_builder_active.png), [`isolated_d3_compare.png`](evidence/screenshots/isolated_d3_compare.png) |
| **D4. Cart & Guest Cart Merge** | Thêm hàng guest, kiểm tra giới hạn tồn kho, đăng nhập merge cart, kiểm tra trùng lặp | **PASS** | Guest thêm SP -> `overstock` API trả `400 INSUFFICIENT_STOCK` -> login `customer@nexora.local` tự động merge đúng `1` dòng duy nhất, không duplicate (`pageErrors: []`). | [`phase_df_isolated_interactive.json`](evidence/phase_df_isolated_interactive.json) |
| **D5. Authentication & Cross-Tab** | Register UI, Login, Invalid 401, Logout, Cross-tab cache isolation, Forgot Password, Google button | **PARTIAL (`PASS WITH DEFECTS`)** | Register -> redirect `/`, Login 401 guard, và Cross-tab logout xóa cache tab B **PASS**. Tuy nhiên Google OAuth chỉ là **UI ONLY / MOCKED** và nút Google ở `/register` bắn 401 + unhandled rejection (`DEF-RT-03`); `forgot-password` trả `500 EMAIL_DELIVERY_FAILED` trên dev thiếu SMTP (`DEF-RT-04`). | [`phase_df_isolated_interactive.json`](evidence/phase_df_isolated_interactive.json) |
| **D6. Customer Profile** | Cập nhật tên, Sổ địa chỉ (tạo/hiển thị), Thông báo, Đổi mật khẩu & đăng nhập mật khẩu mới | **PASS** | Toàn bộ 4 nhóm nghiệp vụ trên UI isolated đều thành công (`profileNameUpdated: true`, `addressDialogClosed: true`, `addressCreatedVisible: true`, `notifTabLoaded: true`, đăng nhập bằng mật khẩu mới `HTTP 200`). | [`phase_df_isolated_interactive.json`](evidence/phase_df_isolated_interactive.json) |
| **D7. Customer Reviews** | Rating stats, eligibility check, non-purchaser 403, gửi review trên UI, edit/delete | **PASS** *(script note)* | Non-purchaser bị chặn `403`; `customer@nexora.local` mua `NX-2026-0001` (`DELIVERED`) mở modal gửi đánh giá UI thành công (`isolated_d7_review.png`), `DELETE /catalog/reviews/1` trả `200`. *(Ghi chú: script audit gửi nhầm `PATCH` nhận `404` vì API quy chuẩn dùng `PUT` trong `reviewService.ts:105`, đã đối chiếu code & Vitest `29/29` PASS)*. | [`isolated_d7_review.png`](evidence/screenshots/isolated_d7_review.png) |
| **D8. Returns Workflow** | Danh sách đổi/trả, modal đơn đủ điều kiện `NX-2026-0001`, rule 7 ngày, audit log, Admin API | **PARTIAL (`NO ADMIN UI TAB`)** | Customer UI hiển thị đơn đủ điều kiện + chi tiết `RET-...` (`isolated_d8_returns.png`), tạo `201`, sinh `return_audit_logs` (`1`), Customer gọi `/admin/returns` bị chặn `403`, Admin duyệt API `200`. Thiếu tab Đổi/trả trong UI `/admin` (`DEF-RT-05`) và trên Dev DB `NX-2026-0001` có `delivered_at: null`. | [`isolated_d8_returns.png`](evidence/screenshots/isolated_d8_returns.png) |
| **D9. Checkout & Orders** | Coupon `NEXORA10`, đặt hàng COD, redirect `/checkout/success`, cập nhật `['my-orders']` | **PASS** *(cheap item note)* | Áp mã `NEXORA10` UI thành công, tạo đơn `NX-345752-2891`, hiển thị ngay trên `/profile/orders`. *(Lưu ý: `cheapProductTested: null` vì danh mục hiện tại không có SP `ACTIVE` `< 500.000đ` thỏa `stockQuantity >= 5`; rule `< 500k` phí `30.000đ` đã pass ở Tier 2A Vitest)*. | [`isolated_d9_checkout_success.png`](evidence/screenshots/isolated_d9_checkout_success.png) |
| **D10. VNPay Sandbox** | Tạo URL thanh toán VNPay Sandbox, kiểm tra params + HMAC-SHA512 + tampered callback | **PASS (SANDBOX)** | `POST /payment/vnpay/create-url` trả `200`, host `sandbox.vnpayment.vn`, `vnp_TmnCode=NEXORATM`, có `vnp_SecureHash`. Callback giả mạo `vnp_SecureHash=tampered000` bị từ chối trong logic (`payment.service.ts:158` trả `isSuccess: false` với HTTP `200` JSON envelope). VNPay Production: `NOT TESTED`. | [`phase_df_isolated_interactive.json`](evidence/phase_df_isolated_interactive.json) |
| **D11. Admin Dashboard & RBAC** | Đăng nhập Admin live, 13 tabs, RBAC gate Customer/Guest, inventory adjust API + log DB | **PARTIAL (`PASS WITH DEFECTS`)** | Đăng nhập Admin trên `:5173/admin` thành công, cả 13 route tabs render nội dung đầy đủ không lỗi ảnh/tràn document; Customer vào `/admin` bị chặn ở UI Gate (`isolated_d11_customer_rbac.png`) và API trả `403`; `POST /admin/inventory/adjust` trả `200` và ghi `inventory_logs`. Khiếm khuyết: `DEF-RT-05` thiếu tab Returns trong sidebar; `DEF-RT-08` cột `"HÀNH ĐỘNG"` bảng Brands bị cắt ở mép phải. | [`admin_dashboard.png`](evidence/screenshots/admin_dashboard.png), [`admin_brands.png`](evidence/screenshots/admin_brands.png), [`isolated_d11_customer_rbac.png`](evidence/screenshots/isolated_d11_customer_rbac.png) |
| **D12. AI Assistant** | Survey 5 bước (`/ai-assistant`), lưu log DB, Chatbot Widget fallback khi thiếu `GEMINI_API_KEY` | **PASS (FALLBACK ONLY)** | Survey 5 bước xuất kết quả gợi ý + tăng `ai_assistant_logs` (`0 -> 1`); `POST /ai/chatbot/query` trả `200` có nội dung tư vấn. Tích hợp **Gemini AI thật: `NOT VERIFIED`** do thiếu `GEMINI_API_KEY`. Gặp lỗi UI `DEF-RT-09` (raw key step 1) & `DEF-RT-10` (z-index / animation). | [`07_ai_assistant.png`](evidence/screenshots/07_ai_assistant.png), [`11_floating_chatbot_open.png`](evidence/screenshots/11_floating_chatbot_open.png) |
| **E4–E5. Responsive & A11y** | 30 ma trận trên 5 viewport (`375`, `430`, `768`, `1366`, `1440`) & basic A11y DOM checks | **PARTIAL (`DEFECTS NOTED`)** | `29/30` responsive checks không tràn ngang; chỉ Tablet `768x1024` tại `/product/detail/macbook-pro-16-m3-max` tràn `920px` (`DEF-RT-07`). Basic A11y có nhiều icon button thiếu label, một số trang thiếu `<h1>` (`DEF-RT-12`). Full WCAG: `NOT VERIFIED`. | [`phase_de_browser_audit.json`](evidence/phase_de_browser_audit.json) |
| **F–G. Security, Rate Limit & Perf** | 13 HTTP security checks, bundle secret scan, 8 endpoint benchmark (x5), Rate-limit `429` | **PASS** | `13/13` security checks chuẩn (401/403/404/400/SQLi an toàn/CORS chặn origin lạ), `0` stack trace leak, Helmet `nosniff` + `SAMEORIGIN` + ẩn `X-Powered-By`, `0` secret trong `dist/assets/index-iG3JJKO1.js`. Latency trung bình API local `1.8 ms – 7.7 ms`. Rate limit `passwordResetRequest` kích hoạt `429` đúng ngưỡng. | [`phase_fg_security_perf_admin.json`](evidence/phase_fg_security_perf_admin.json) |

---

## F. Defect Register (P0 – P4)

*(Mỗi lỗi độc lập được phân loại riêng, không gộp chung; không tự ý sửa source code khi chưa có phê duyệt của Project Owner.)*

### DEF-RT-01
1. **Defect ID:** `DEF-RT-01`
2. **Severity:** `P1 High`
3. **Module:** Frontend Storefront Catalog Media Mapping (`apps/web/src/lib/productImage.ts`)
4. **Environment:** Local Web (`http://localhost:5173`), Chrome/Playwright
5. **Steps to Reproduce:** Mở Homepage hoặc `/search`, quan sát sản phẩm Màn hình (`"inch"`), Tản nhiệt (`"Cooling"`), PC Gaming (`"Gaming"`), Loa (`"vi tính"`), và Máy chơi game cầm tay có chữ `"Ryzen"`.
6. **Expected Result:** Ảnh sản phẩm phải đúng chủng loại (màn hình hiển thị màn hình, tản nhiệt hiển thị tản nhiệt, console hiển thị console).
7. **Actual Result:** Màn hình/tản nhiệt/PC Gaming/loa dùng ảnh máy in (`printer-canon.jpg`), máy chơi game cầm tay Lenovo/MSI/ASUS/Razer Console Ryzen dùng ảnh CPU (`cpu_ryzen7.jpg`).
8. **Evidence:** `apps/web/src/lib/productImage.ts` lines `169–176` và `235`; `evidence/phase_de_assets_and_deep_checks.json` lines `52–100`.
9. **Root Cause:** Kiểm tra chuỗi con quá rộng `searchStr.includes('in')` (trùng các từ tiếng Anh/Việt chứa `'in'` như `inch`, `cooling`, `gaming`, `tính`) và kiểm tra `'ryzen'` mà không ưu tiên `p.category?.slug` trước từ khóa tên sản phẩm.
10. **Impact:** Hiển thị sai hình ảnh phần cứng diện rộng trên trang chủ và tìm kiếm cho nhóm sản phẩm dùng fallback.
11. **Recommended Fix:** Kiểm tra `category.slug` trước rồi mới fallback keyword; thay `includes('in')` bằng word-boundary regex hoặc cụm `"máy in"`, `"printer"` cụ thể; loại trừ `console`/`laptop` khỏi nhánh `cpu`.
12. **Regression Test:** Thêm unit test cho `getProductImage()` bao phủ sản phẩm thuộc các danh mục `monitor`, `cooling`, `pc`, `speaker`, `console`, `printer`, `cpu`.

---

### DEF-RT-02
1. **Defect ID:** `DEF-RT-02`
2. **Severity:** `P1 High`
3. **Module:** PC Builder (`apps/web/src/features/pcBuilder/PcBuilderPage.tsx`)
4. **Environment:** Local Web (`http://localhost:5173/pc-builder`)
5. **Steps to Reproduce:** Truy cập `/pc-builder` -> bấm `+ Chọn mua` ở dòng `Bộ vi xử lý (CPU)` -> chọn linh kiện hoặc kiểm tra danh sách gợi ý đầu tiên.
6. **Expected Result:** Slot CPU chỉ hiển thị sản phẩm thuộc danh mục `cpu`.
7. **Actual Result:** Danh sách chọn và lựa chọn tự động đặt `"Máy chơi game cầm tay Lenovo Console-CN31 Ryzen Z1 Extreme 1TB"` làm CPU của cấu hình.
8. **Evidence:** Screenshot [`05b_pc_builder_active.png`](evidence/screenshots/05b_pc_builder_active.png); mã nguồn `PcBuilderPage.tsx` lines `437–443` và `485`.
9. **Root Cause:** Điều kiện fallback `nameLower.includes('ryzen')` ở dòng `442` khớp mọi sản phẩm có chữ Ryzen (kể cả Handheld Console hay Laptop) khi `targetSlugs` không chặn danh mục khác; đồng thời nhánh `default: return true` ở dòng `485` cho phép lọt hết sản phẩm nếu key không khớp.
10. **Impact:** Người dùng có thể ghép máy chơi game/laptop vào slot CPU, làm sai công suất nguồn ước tính (`205W`) và kiểm tra tương thích.
11. **Recommended Fix:** Ưu tiên lọc chặt theo `category.slug` (`catSlug === targetSlug`) khi danh mục có dữ liệu chuẩn; trong fallback, loại trừ `laptop`, `console`, `máy chơi game`, `pc` khỏi linh kiện rời và bỏ `default: return true`.
12. **Regression Test:** Viết RTL/unit test cho bộ lọc linh kiện `PcBuilderPage` bảo đảm danh sách CPU không chứa sản phẩm danh mục `console` hoặc `laptop`.

---

### DEF-RT-03
1. **Defect ID:** `DEF-RT-03`
2. **Severity:** `P1 High`
3. **Module:** Authentication — Google OAuth Mock (`apps/web/src/features/auth/RegisterPage.tsx`, `LoginPage.tsx`)
4. **Environment:** Local Web + API (`:5174` / `:3001` và `:5173` / `:3000`)
5. **Steps to Reproduce:** Mở `/auth/register` (hoặc `/register`) -> bấm nút `"Tiếp tục với Google"`.
6. **Expected Result:** Hoặc thực hiện Google OAuth thật (nếu cấu hình), hoặc hiển thị thông báo UI an toàn giống LoginPage mà không gây lỗi network hay unhandled rejection.
7. **Actual Result:** Trình duyệt gửi `POST /api/v1/auth/login` với `email: "customer@nexora.vn"`, nhận HTTP `401 Unauthorized` và ném lỗi JS không được bắt (`Unhandled Promise Rejection: "Request failed with status code 401"`). Trên `LoginPage.tsx:152`, nút Google chỉ hiển thị text thông báo SSO đang nâng cấp.
8. **Evidence:** `RegisterPage.tsx` lines `328–337`, `LoginPage.tsx` lines `149–155`; log [`phase_df_isolated_interactive.json`](evidence/phase_df_isolated_interactive.json) lines `29–40`.
9. **Root Cause:** `RegisterPage.tsx` giữ lại đoạn mock demo gọi `authService.login({ email: 'customer@nexora.vn', ... }).then(...)` (domain `.vn` không tồn tại trong DB `nexora.local`) và không có `.catch()`.
10. **Impact:** Gây lỗi JS runtime (`pageerror`) và request `401` khi người dùng bấm nút Google trên trang Đăng ký; xác nhận Google OAuth chưa triển khai thật (`UI ONLY / MOCKED`).
11. **Recommended Fix:** Thống nhất vô hiệu hóa hoặc hiển thị thông báo thân thiện đồng bộ với `LoginPage` khi chưa cấu hình `GOOGLE_CLIENT_ID`, tuyệt đối bỏ hardcode credentials trong frontend.
12. **Regression Test:** Viết RTL/Playwright test click `.auth-btn-google` trên cả `/login` và `/register`, assert `0 unhandled rejection` và không lộ credentials trong bundle.

---

### DEF-RT-04
1. **Defect ID:** `DEF-RT-04`
2. **Module:** Email / Password Reset (`apps/api/src/modules/email/email.service.ts`)
3. **Severity:** `P2 Medium`
4. **Environment:** Local Dev (`NODE_ENV=development`, thiếu `SMTP_*` và `RESEND_API_KEY`)
5. **Steps to Reproduce:** Gọi `POST /api/v1/auth/forgot-password` (hoặc gửi form `/auth/forgot`) với email đang tồn tại `customer@nexora.local`.
6. **Expected Result:** Trên môi trường `development` chưa cấu hình SMTP/Resend, nếu dùng Console Mock như thiết kế dev thì cần log link reset ra console và trả response chuẩn, hoặc tài liệu hóa rõ bắt buộc cấu hình SMTP/Resend.
7. **Actual Result:** Backend trả HTTP `500` với mã lỗi `EMAIL_DELIVERY_FAILED` do `emailService.isConfigured()` trả `false` và throw `EMAIL_SERVICE_NOT_CONFIGURED`. (Với email không tồn tại vẫn trả `200` chống email enumeration).
8. **Evidence:** `email.service.ts` lines `60–78`; [`phase_df_isolated_interactive.json`](evidence/phase_df_isolated_interactive.json) lines `45–48`.
9. **Root Cause:** `emailService` hiện yêu cầu `SMTP_HOST` hoặc `RESEND_API_KEY` ngay cả khi `NODE_ENV=development` và không có chế độ Console fallback khi thiếu cấu hình dev.
10. **Impact:** Tính năng Quên mật khẩu không thể hoàn tất quy trình thử nghiệm nội bộ ở máy dev nếu không tự cấu hình dịch vụ email ngoài.
11. **Recommended Fix:** Bổ sung dev-only Console Preview Transporter (chỉ kích hoạt khi `NODE_ENV === 'development'`, vẫn fail-closed trong `production` và `test`), hoặc cập nhật `.env.example`/hướng dẫn cấu hình Mailpit/SMTP local.
12. **Regression Test:** Bổ sung integration test phân biệt rõ behavior `production` (fail-closed `500`) và `development` (nếu bật dev fallback).

---

### DEF-RT-05
1. **Defect ID:** `DEF-RT-05`
2. **Module:** Admin Dashboard — Returns Management (`apps/web/src/features/admin/AdminDashboardPage.tsx`)
3. **Severity:** `P2 Medium`
4. **Environment:** Local Web (`http://localhost:5173/admin`) & Backend (`admin.routes.ts:83–85`)
5. **Steps to Reproduce:** Đăng nhập `/admin`, kiểm tra toàn bộ thanh menu bên trái (`13` tab hiện có) và thử tìm giao diện xử lý yêu cầu đổi/trả hàng của khách hàng.
6. **Expected Result:** Admin Dashboard có màn hình/tab để xem danh sách `GET /api/v1/admin/returns` và duyệt/cập nhật `PATCH /api/v1/admin/returns/:id/status`.
7. **Actual Result:** Customer đã có UI tạo yêu cầu đổi/trả tại `/profile/return` và Backend đã mở đủ 3 API `/admin/returns*`, nhưng `AdminDashboardPage.tsx` chưa có tab hoặc route `/admin/returns` để nhân sự vận hành duyệt đơn đổi/trả trên UI. (Lưu ý thêm: `/admin/inventory` có tồn tại qua URL và nút trong tab Sản phẩm nhưng vắng mặt ở sidebar chính).
8. **Evidence:** `admin.routes.ts` lines `82–85`; `AdminDashboardPage.tsx` `AdminTab` union & `navMenuItems`; [`admin_dashboard.png`](evidence/screenshots/admin_dashboard.png).
9. **Root Cause:** UI quản trị chưa triển khai view cho module Returns sau khi Backend & Customer M6.4 hoàn tất.
10. **Impact:** Quản trị viên không thể duyệt/từ chối/hoàn tiền yêu cầu đổi trả trực tiếp trên giao diện `/admin`, phải gọi API trực tiếp.
11. **Recommended Fix:** Bổ sung tab `"Đổi / Trả hàng"` (`/admin/returns`) trong `AdminDashboardPage.tsx` gắn với 3 endpoint `/admin/returns*` hiện có (sau khi có phê duyệt của Project Owner).
12. **Regression Test:** RTL & Playwright test cho `/admin/returns` (load danh sách, cập nhật trạng thái -> cập nhật `return_audit_logs`).

---

### DEF-RT-06
1. **Defect ID:** `DEF-RT-06`
2. **Module:** Storefront Homepage Category Sidebar (`apps/web/src/features/storefront/CategorySidebar.tsx`)
3. **Severity:** `P2 Medium`
4. **Environment:** Local Web (`http://localhost:5173/`)
5. **Steps to Reproduce:** Mở Homepage và đối chiếu cột danh mục bên trái Hero Banner với bảng `categories` thực tế trong MySQL (`22` danh mục từ `/api/v1/catalog/categories`).
6. **Expected Result:** Sidebar hiển thị đồng bộ theo dữ liệu `categories` từ API.
7. **Actual Result:** Sidebar luôn render cố định `16` danh mục cũ được hardcode trong file (`Main, CPU, VGA`, `Case, Nguồn, Tản`, v.v.) và bỏ qua prop `categories` từ API.
8. **Evidence:** `CategorySidebar.tsx` lines `18–318`; screenshot [`01b_home_no_popup.png`](evidence/screenshots/01b_home_no_popup.png); API trả `22` danh mục (`phase_c_startup_verify.txt`).
9. **Root Cause:** `CategorySidebar` sử dụng mảng hằng tĩnh thay vì map dữ liệu `categories` từ API.
10. **Impact:** Nếu Admin thêm/ẩn/sửa danh mục trong `/admin/categories`, sidebar trang chủ không cập nhật theo dữ liệu DB.
11. **Recommended Fix:** Render menu từ prop `categories` (có icon mapping theo `slug`), giữ fallback tĩnh chỉ khi API chưa tải xong.
12. **Regression Test:** RTL test truyền mock `categories` tùy biến vào `CategorySidebar` và kiểm tra danh mục mới được render đúng.

---

### DEF-RT-07
1. **Defect ID:** `DEF-RT-07`
2. **Module:** Responsive Layout — Product Detail (`apps/web/src/features/catalog/ProductDetailPage.tsx`)
3. **Severity:** `P2 Medium`
4. **Environment:** Viewport Tablet `768 x 1024` trên `/product/detail/macbook-pro-16-m3-max`
5. **Steps to Reproduce:** Mở `/product/detail/macbook-pro-16-m3-max` trên trình duyệt có chiều rộng `768px`.
6. **Expected Result:** Layout tự chuyển về 1 cột hoặc co giãn trong `768px`, `scrollWidth <= clientWidth`.
7. **Actual Result:** Trang bị tràn ngang (`scrollWidth = 920px > 768px`, dư `152px`), phần giá `"89.990.000đ"`, trạng thái `"Còn hàng (10 sản phẩm)"`, thông số nổi bật và nút `"Mua ngay"` bị cắt khỏi khung nhìn bên phải.
8. **Evidence:** `ProductDetailPage.tsx` line `551` (`gridTemplateColumns: '460px minmax(0, 1fr)'`); [`phase_de_browser_audit.json`](evidence/phase_de_browser_audit.json); screenshot [`resp_tablet_product_overflow.png`](evidence/screenshots/resp_tablet_product_overflow.png).
9. **Root Cause:** Inline CSS đặt cứng cột ảnh `460px` cạnh cột thông tin (`460 + 40 gap + right col > 768px`) mà không dùng responsive CSS class / media query breakpoint `< 1024px`.
10. **Impact:** Người dùng máy tính bảng (iPad/Tablet `768px`) bị cắt chữ, che nút mua hàng và phải cuộn ngang để thấy giá.
11. **Recommended Fix:** Chuyển `gridTemplateColumns` từ inline style sang CSS class với `@media (max-width: 1023px)` chuyển về `grid-template-columns: 1fr`.
12. **Regression Test:** Playwright responsive check tại `768x1024` trên `/product/detail/:slug` assert `scrollWidth <= clientWidth`.

---

### DEF-RT-08
1. **Defect ID:** `DEF-RT-08`
2. **Module:** Admin Brands Table (`apps/web/src/features/admin/AdminDashboardPage.tsx`)
3. **Severity:** `P3 Low`
4. **Environment:** Desktop `1440 x 900` tại `/admin/brands`
5. **Steps to Reproduce:** Đăng nhập `/admin` -> chọn tab `Thương hiệu` ở độ phân giải `1440x900`.
6. **Expected Result:** Toàn bộ cột của bảng thương hiệu (gồm cột `"HÀNH ĐỘNG"` và nút `"Sửa"`) hiển thị gọn trong vùng nhìn mà không bị cắt ở mép phải.
7. **Actual Result:** Bảng bị tràn ngang bên trong card bao ngoài khiến cột `"HÀNH ĐỘNG"` và các nút `"Sửa"` bị cắt khuất bên phải khung nhìn desktop `1440px`.
8. **Evidence:** Screenshot [`admin_brands.png`](evidence/screenshots/admin_brands.png).
9. **Root Cause:** Bề rộng tổng các cột (`LOGO`, `TÊN`, `SLUG`, `MÔ TẢ`, `SỐ SẢN PHẨM`, `TRẠNG THÁI`, `HÀNH ĐỘNG`) vượt bề rộng nội dung còn lại (`1440px - sidebar 240px - padding`) do mô tả/cột chưa co giãn tối ưu.
10. **Impact:** Admin phải cuộn ngang nội bộ bảng ở màn hình `1440px` mới bấm được nút `"Sửa"`.
11. **Recommended Fix:** Thu gọn padding/min-width cột `SLUG` & `MÔ TẢ` (`max-width` + ellipsis) để đủ toàn bộ bảng nằm vừa ở `>= 1280px`.
12. **Regression Test:** Kiểm tra bounding box cột `"HÀNH ĐỘNG"` trong container card trên `/admin/brands` tại `1440x900`.

---

### DEF-RT-09
1. **Defect ID:** `DEF-RT-09`
2. **Module:** Storefront Content Consistency & Seeded UI Labels (`Topbar`, `BottomFeatures`, `AiAssistantPage.tsx`, Seed Data)
3. **Severity:** `P3 Low`
4. **Environment:** Local Web (`/` và `/ai-assistant`) + Admin Dashboard
5. **Steps to Reproduce:** Quan sát Topbar, BottomFeatures dưới Footer trang chủ, Bước 1 của `/ai-assistant`, và mục "Sản phẩm sắp hết hàng" trên `/admin`.
6. **Expected Result:** Ngưỡng miễn phí ship, hotline, nhãn hiển thị cho người dùng và tên thương hiệu cửa hàng phải đồng nhất với backend/cài đặt.
7. **Actual Result:** (a) Topbar ghi `"Miễn phí cho đơn từ 300K"`, trong khi BottomFeatures/Checkout/`order.service.ts` áp dụng **`500.000đ`**; (b) BottomFeatures ghi `"Hotline: 1900 1234"` trong khi Topbar/Footer/`store_settings` là **`1800 2097`**; (c) AI Survey bước 1 hiển thị mã key thô `"Phân khúc under_10m"`, `"10_15m"`, `"15_20m"`, `"20_25m"`, `"25_35m"`, `"over_35m"`; (d) Một số tên SP seed cũ còn tiền tố `"PC TechPilot ..."`.
8. **Evidence:** Screenshots [`01b_home_no_popup.png`](evidence/screenshots/01b_home_no_popup.png), [`07_ai_assistant.png`](evidence/screenshots/07_ai_assistant.png), [`admin_dashboard.png`](evidence/screenshots/admin_dashboard.png).
9. **Root Cause:** Text tĩnh hardcoded rải rác ở các component cũ chưa đồng bộ theo `store_settings` & rule của `order.service.ts`; UI Survey render trực tiếp `option.id` thay vì mô tả tiếng Việt.
10. **Impact:** Khách hàng có thể hiểu nhầm mức miễn phí vận chuyển (`300K` vs `500K`) hoặc gọi nhầm số hotline; thiếu tính chuyên nghiệp ở Survey Bước 1.
11. **Recommended Fix:** Chuẩn hóa ngưỡng ship (`500.000đ`) và hotline (`1800 2097`) về một nguồn cấu hình; thay text phụ `under_10m` bằng nhãn thân thiện.
12. **Regression Test:** Kiểm tra text toàn trang không xuất hiện chuỗi `"300K"` / `"1900 1234"` / `"under_10m"`.

---

### DEF-RT-10
1. **Defect ID:** `DEF-RT-10`
2. **Module:** Floating Chatbot & Promo Popup Overlay (`FloatingChatbot.tsx`, Promo Modal)
3. **Severity:** `P3 Low`
4. **Environment:** Local Web (`/`) & Product Detail Toast
5. **Steps to Reproduce:** Tải lần đầu trang `/` khi Promo popup đang mở, click nút `#tpChatbotLauncher` hoặc kích hoạt Toast thông báo ở góc dưới phải màn hình.
6. **Expected Result:** Thứ tự `z-index` chuẩn: modal backdrop đóng/che hoàn toàn hoặc khóa click launcher; toast không bị nút chatbot che mất chữ; nút launcher không rung/animate cản trở tương tác.
7. **Actual Result:** Backdrop của Promo popup làm mờ/đè lên khung chat vừa mở; ngược lại launcher `#tpChatbotLauncher` nằm đè lên góc phải Toast `"Gửi đánh giá thành công!"`, đồng thời animation liên tục làm Playwright click stability thất bại khi click trực tiếp nút launcher.
8. **Evidence:** Screenshots [`11_floating_chatbot_open.png`](evidence/screenshots/11_floating_chatbot_open.png), [`isolated_d7_review.png`](evidence/screenshots/isolated_d7_review.png); ghi nhận lỗi click timeout trên `#tpChatbotLauncher` trong `audit_assets_and_tablet_pcbuilder.mjs`.
9. **Root Cause:** Phân tầng `z-index` chưa nhất quán giữa Promo modal, Chatbot widget và Toast container; animation `infinite` chạy trực tiếp trên phần tử nút bấm.
10. **Impact:** Gây đè giao diện nhẹ khi người dùng mở chat cùng lúc popup hoặc khi xem toast xác nhận ở góc phải dưới.
11. **Recommended Fix:** Tăng `z-index` Toast > Modal > Chatbot drawer > Launcher (hoặc ẩn launcher khi modal mở); đặt animation trên pseudo-element hoặc badge con thay vì toàn bộ button click target.
12. **Regression Test:** Playwright test đóng popup -> click `#tpChatbotLauncher` không cần `force: true` và toast không bị che khuất.

---

### DEF-RT-11
1. **Defect ID:** `DEF-RT-11`
2. **Module:** Repository Formatting / Quality Gate (`Prettier`)
3. **Severity:** `P3 Low`
4. **Environment:** Workspace Root (`D:\Nexora`)
5. **Steps to Reproduce:** Chạy `npm run format:check`.
6. **Expected Result:** `format:check` trả exit code `0`.
7. **Actual Result:** Trả exit code `1` với `63` file sai chuẩn Prettier, gồm 4 file source hoạt động (`AdminDashboardPage.tsx`, `PostDetailPage.tsx`, `ProductCatalogSection.tsx`, `productImage.ts`), `prisma/seed_techpilot_full.ts`, và `58` file `.md`.
8. **Evidence:** [`phase_b3_prettier.log`](evidence/phase_b3_prettier.log).
9. **Root Cause:** Một số chỉnh sửa trước và tài liệu audit được ghi mà chưa chạy `prettier --write`.
10. **Impact:** Cản trở CI pipeline nếu CI bật `npm run format:check`.
11. **Recommended Fix:** Chạy `npx prettier --write` trên các file hợp lệ trong phạm vi cho phép (và cấu hình `.prettierignore` cho báo cáo lịch sử nếu muốn) khi được Project Owner duyệt.
12. **Regression Test:** Chạy lại `npm run format:check` và xác nhận exit code `0`.

---

### DEF-RT-12
1. **Defect ID:** `DEF-RT-12`
2. **Module:** Basic Accessibility & Semantic Landmarks (`Home`, `Compare`, `AiAssistant`, `AdminGate`, `ForgotPassword`)
3. **Severity:** `P3 Low`
4. **Environment:** Local Web across checked routes
5. **Steps to Reproduce:** Kiểm tra DOM landmark, `<h1>`, `aria-label` nút và label input qua Playwright DOM check (`phase_de_browser_audit.json`).
6. **Expected Result:** Mỗi trang có đúng 1 `<h1>`, nút icon có `aria-label`, input có label/`aria-label`, trang có landmark chuẩn.
7. **Actual Result:** `h1Count: 0` trên Home, Compare, AI Assistant và Admin Gate; `buttonsWithoutLabel: 124` trên Home (`24` trên Search/Category, `4` trên Product Detail); `inputsWithoutLabel: 1` trên Home, Login, Register; Admin Gate & Forgot Password thiếu `<header>/<main>/<footer>`. *(Đánh giá WCAG đầy đủ: `NOT VERIFIED`)*.
8. **Evidence:** `a11yChecks` trong [`phase_de_browser_audit.json`](evidence/phase_de_browser_audit.json).
9. **Root Cause:** Các nút icon quick-action trên product card và ô chọn/nhập thiếu `aria-label`; một số trang dùng `<h2>` làm tiêu đề đầu tiên thay vì `<h1>`.
10. **Impact:** Giảm khả năng hỗ trợ trình đọc màn hình (screen reader) và chuẩn SEO semantic.
11. **Recommended Fix:** Bổ sung `aria-label` cho các icon button (`Yêu thích`, `So sánh`, v.v.), đặt thẻ `<h1>` chuẩn trên trang chủ/so sánh/AI/Admin Gate.
12. **Regression Test:** Bổ sung assertions A11y cơ bản (`missingAltCount === 0`, `h1Count >= 1`, `buttonsWithoutLabel === 0`) vào Playwright E2E.

---

### DEF-RT-13
1. **Defect ID:** `DEF-RT-13`
2. **Module:** Build Optimization, Rate Limit & Known Historical Limitations
3. **Severity:** `P4 Informational`
4. **Environment:** Production Build (`apps/web/dist`), API `rateLimit.ts`, Home Carousels, Catalog Data
5. **Steps to Reproduce:** Chạy `npm run build`; quét liên tiếp >50 route/request SPA từ một IP; kiểm tra carousel trang chủ và thống kê DB.
6. **Expected Result:** Chunk JS chia tách tối ưu; tải trang chủ chỉ tải ảnh cần thiết; rate-limit không chặn việc điều hướng hợp lệ bình thường; tài liệu hóa đầy đủ giới hạn đã chấp nhận.
7. **Actual Result:**
   - (a) Bundle JS chính `dist/assets/index-iG3JJKO1.js` đạt `1,186.36 kB` (`gzip: 294.66 kB`) > ngưỡng `500 kB` của Vite (chưa code-split `AdminDashboardPage` theo lazy route).
   - (b) Rate limit `globalApi` (`300 req / 15 min` lưu in-memory trên 1 IP) đã kích hoạt `HTTP 429` khi tool quét liên tiếp `>52` lượt mở trang kèm nhiều query API mỗi trang; việc restart API reset bộ đếm.
   - (c) Carousel cuộn ngang trên `/` giữ `62` ảnh `loading="lazy"` ở trạng thái `complete: false` (`39` có `naturalWidth: 0`) khi chưa cuộn ngang vào viewport; toàn bộ file ảnh đều tồn tại trên đĩa (`homeMissingAssetsOnDisk: []`).
   - (d) Các giới hạn lịch sử được ghi nhận lại đúng thực tế: Catalog có `674` SP (nhiều hơn baseline `651` của TechPilot), `NX-2026-0001` có `delivered_at: null`, chưa cấu hình `GEMINI_API_KEY` / `GOOGLE_CLIENT_ID` / `SMTP_*` / `VNPAY Production`.
8. **Evidence:** [`phase_b4_build.log`](evidence/phase_b4_build.log), `rateLimit.ts`, [`phase_de_assets_and_deep_checks.json`](evidence/phase_de_assets_and_deep_checks.json).
9. **Root Cause:** SPA chưa áp dụng `React.lazy()` theo route; giới hạn `300/15m` áp dụng chung cả GET tĩnh cho toàn `/api/v1`; ảnh lazy trong slider ngang.
10. **Impact:** Không chặn khởi chạy dev hiện tại nhưng ảnh hưởng tốc độ tải lần đầu (LCP) và quá trình kiểm thử tự động cường độ cao từ cùng 1 IP.
11. **Recommended Fix:** Tách `React.lazy` cho `/admin` và các route nặng; xem xét nới hoặc tách `globalApi` khỏi static GET catalog; giữ nguyên ghi chú giới hạn lịch sử trong handover.
12. **Regression Test:** Theo dõi kích thước chunk sau build (`< 500 kB` mỗi initial chunk) nếu áp dụng code splitting.

---

## G. Security & Database Safety Verification (Phase F & Safety Audit)

1. **API Security Checks (`13/13` verified on live `:3000` without 429 masking — [`phase_fg_security_perf_admin.json`](evidence/phase_fg_security_perf_admin.json)):**
   - Tất cả 6 endpoint cần auth (`/admin/dashboard/summary`, `/admin/users`, `/admin/orders`, `/admin/returns`, `/profile`, `/orders/my-orders`) khi thiếu JWT trả **`401 UNAUTHORIZED`**.
   - Forged JWT (`Bearer invalid.forged.token`) trả **`401 INVALID_TOKEN`**.
   - IDOR Order check: xem `/orders/detail/NX-2026-0001` không xác thực trả **`401`**, tra cứu sai SĐT `/orders/track?code=NX-2026-0001&phone=0000000000` trả **`404 ORDER_NOT_FOUND`**.
   - Non-existent slug trả **`404 PRODUCT_NOT_FOUND`**, SQLi payload `' OR 1=1 --` xử lý an toàn qua Prisma (`200`, `total: 0`), validation lỗi trả **`400 VALIDATION_ERROR`**, Origin lạ `https://evil-attacker.example.com` bị CORS từ chối (`500`, `Access-Control-Allow-Origin: null`).
   - Toàn bộ `13/13` response có `hasStackLeak: false`, header `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, không có `X-Powered-By`.
2. **RBAC Isolation (`CUSTOMER` vs `ADMIN`):** Đã chứng minh trực tiếp trên trình duyệt và API (`phase_df_isolated_interactive.json` & `isolated_d11_customer_rbac.png`): Customer token gọi `/admin/dashboard/summary` và `/admin/returns` đều bị chặn **`403`**.
3. **Bundle Secret Scan:** Quét `apps/web/dist/assets/index-iG3JJKO1.js` cho **`0` phát hiện** secret (`AUTH_SECRET`, `MYSQL_*`, `VNPAY_HASH_SECRET`, `GEMINI_API_KEY`, `mysql://`).
4. **Dev Database Protection Evidence (`127.0.0.1:3306/nexora`):**
   - Snapshot trước test (`dev_db_before_tests.json`): `27` bảng, `834` dòng (`carts: 20`).
   - Snapshot cuối sau toàn bộ kiểm toán (`dev_db_final.json`): `27` bảng, `842` dòng (`carts: 28`, chênh đúng **`+8` dòng `carts` rỗng** do browser session guest khi đọc `/cart` và các trang storefront; **`0` thay đổi** trên tất cả `26` bảng còn lại gồm `products`, `orders`, `users`, `reviews`, `return_requests`, `categories`, `brands`, `coupons`, `inventory_logs`, `ai_assistant_logs`, v.v.).
   - Container test cô lập `nexora-audit-test-db` và các tiến trình tạm `:3001`/`:5174` đã được xóa sạch hoàn toàn (`docker ps -a` xác nhận không còn container test).

---

## H. Final Git Verification

- **Current Branch:** `main`
- **Current HEAD:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6`
- **Tracked Modifications (`git diff --stat` & `git diff --cached --stat`):** **Trống (`0` file tracked bị sửa hoặc staged)**.
- **Untracked Files (`git status --short`):** Chỉ có `?? comprehensive-audit/runtime-launch/` (thư mục báo cáo và evidence được yêu cầu tạo).
- **Push Status:** **Chưa push** lên GitHub, **không commit tự động**, **không thay đổi lịch sử Git**.

---

## I. Final Verdict & Website Handover (Section 15)

### Verdict: **`PASS WITH LIMITATIONS`**

**Cơ sở kết luận:** Website Nexora hoàn toàn khởi chạy được cục bộ, kết nối ổn định với MySQL `8.4.13`, vượt qua Typecheck, ESLint, Production Build và `320/320` test tự động trên môi trường cô lập, đồng thời mọi luồng nghiệp vụ thương mại điện tử cốt lõi (Catalog, Search, Cart Merge, Register/Login/Cross-tab Isolation, Profile CRUD, Verified Reviews, Returns API, COD Checkout, VNPay Sandbox URL & HMAC, RBAC Admin, AI Fallback, Rate Limit `429`) đã được kiểm chứng hoạt động trên trình duyệt thực tế. Tuy nhiên, không thể cấp trạng thái `PASS — APPLICATION RUNNING AND VERIFIED` tuyệt đối vì còn `3` lỗi `P1` (`DEF-RT-01` ánh xạ ảnh sai, `DEF-RT-02` PC Builder lọc console vào CPU, `DEF-RT-03` nút Google trên Register bắn 401 unhandled rejection), `4` lỗi `P2` (`DEF-RT-04` thiếu SMTP dev gây 500 forgot-password, `DEF-RT-05` thiếu tab Admin Returns UI, `DEF-RT-06` sidebar category tĩnh, `DEF-RT-07` tràn Tablet product detail), Prettier gate fail (`63` file) và các tích hợp ngoài (`GEMINI_API_KEY`, Google SSO, SMTP/Resend, VNPay Production) chưa cấu hình.

### Thông tin bàn giao Website đang chạy

| Thành phần | URL / Port | Trạng thái & Tiến trình đang chạy |
| --- | --- | --- |
| **Customer Website (Frontend Web)** | `http://localhost:5173/` | Đang chạy nền (`npm run dev:web`, Vite `PID 32852`, HTTP `200`) |
| **Admin Portal** | `http://localhost:5173/admin` | Đang chạy nền (qua Frontend Web `:5173`) |
| **Backend REST API** | `http://localhost:3000/api/v1` | Đang chạy nền (`npm run dev:api`, `tsx watch` `PID 28924` -> Worker `PID 2968`, `/health` HTTP `200`) |
| **Swagger / OpenAPI JSON** | `http://localhost:3000/api/docs.json` | Đang hoạt động (`HTTP 200`) |
| **Database (Docker MySQL 8.4)** | `127.0.0.1:3306/nexora` | Container `nexora-mysql-1` (`healthy`) |

- **Tài khoản test sẵn có trong Dev DB (không hiển thị mật khẩu/secret trong báo cáo):**
  - Quản trị viên (`ADMIN`): `admin@nexora.local`
  - Nhân viên (`STAFF`): `staff@nexora.local`
  - Khách hàng (`CUSTOMER`): `customer@nexora.local`
  - *(Ghi chú bảo mật: Mật khẩu dev mặc định được cấu hình qua `prisma/seed.ts` cho môi trường local; không công bố chuỗi mật khẩu hoặc hash trong báo cáo audit).*
- **Cách dừng server khi kết thúc kiểm tra (PowerShell):**
  ```powershell
  # Dừng cả cây tiến trình API (:3000) và Web (:5173) theo PID thực tế hoặc dừng toàn bộ dev node theo cổng:
  taskkill /PID 28924 /T /F; taskkill /PID 16932 /T /F
  ```
- **Lưu ý môi trường Agent & Lệnh tự khởi chạy dự phòng:**
  Trong môi trường IDE/Agent, nếu máy ngủ hoặc phiên host tự khởi động lại, các background daemon có thể tự động bị dừng. Nếu khi mở trình duyệt không thấy phản hồi ở `:5173` hoặc `:3000`, Project Owner có thể khởi chạy lại trực tiếp bằng PowerShell tại `D:\Nexora`:
  ```powershell
  cd D:\Nexora
  docker compose up -d mysql   # (nếu container nexora-mysql-1 chưa chạy)
  # Terminal 1:
  npm run dev:api
  # Terminal 2:
  npm run dev:web
  ```
