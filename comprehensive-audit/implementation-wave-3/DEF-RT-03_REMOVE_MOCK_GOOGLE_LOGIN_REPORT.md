# NEXORA — WAVE 3 TASK 2 REPORT: DEF-RT-03 REMOVE MOCK GOOGLE LOGIN

- **Defect ID:** `DEF-RT-03`
- **Severity:** `P1 — High (Security & Runtime Error)`
- **Date:** `2026-11-26`
- **Branch:** `main` (`b71b8b9ee296d894de4f58a01f9ce15acaee8acf`, uncommitted workspace per Wave 3 rule)
- **Verdict:** **`PASS`**

---

## 1. Root Cause Analysis

Qua quét toàn bộ repository (`customer@nexora.vn`, `google`, `oauth`, `mock`) và kiểm tra các thành phần xác thực:

1. Tại [RegisterPage.tsx](file:///D:/Nexora/apps/web/src/features/auth/RegisterPage.tsx) (`lines 328-338`), nút `"Tiếp tục với Google"` có handler `onClick` gọi trực tiếp `authService.login({ email: 'customer@nexora.vn', password: 'password123' }).then(() => navigate('/'))` — sử dụng thông tin đăng nhập hardcode không có `.catch()`.
2. Vì tài khoản thật trong DB sử dụng `.local` và đây là mã thử nghiệm giả lập sót lại, lời gọi `POST /api/v1/auth/login` trả về `HTTP 401`, gây Unhandled Promise Rejection trên console trình duyệt và tạo cảm giác sai lệch về tính năng Google SSO chưa được triển khai.
3. Trên [LoginPage.tsx](file:///D:/Nexora/apps/web/src/features/auth/LoginPage.tsx) và [AuthModal.tsx](file:///D:/Nexora/apps/web/src/features/storefront/AuthModal.tsx), nút `"Tiếp tục với Google"` tuy không gọi `/auth/login`, nhưng vẫn ở trạng thái active clickable gây kỳ vọng có thể đăng nhập bằng Google trước khi báo lỗi nâng cấp SSO.
4. Backend `apps/api/src/modules/auth` và `authService.ts` không có fake OAuth callback hay mock token nào khác.

---

## 2. Solution & Files Created / Modified

| Status   | File Path                                                                                                                   | Summary                                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Created  | [GoogleAuthUnavailableButton.tsx](file:///D:/Nexora/apps/web/src/features/auth/GoogleAuthUnavailableButton.tsx)             | Component dùng chung hiển thị nút Google bị `disabled` (`aria-disabled="true"`), nhãn `"Google (Chưa khả dụng)"` và ghi chú hướng dẫn dùng email/password, không có handler đăng nhập hay lời gọi mạng |
| Modified | [RegisterPage.tsx](file:///D:/Nexora/apps/web/src/features/auth/RegisterPage.tsx)                                           | Loại bỏ hoàn toàn `authService.login({ email: 'customer@nexora.vn', ... })` và thay bằng `GoogleAuthUnavailableButton`; giữ nguyên form đăng ký email/password                                         |
| Modified | [LoginPage.tsx](file:///D:/Nexora/apps/web/src/features/auth/LoginPage.tsx)                                                 | Đồng bộ sử dụng `GoogleAuthUnavailableButton` để người dùng biết rõ Google SSO chưa khả dụng, giữ nguyên form đăng nhập email/password                                                                 |
| Modified | [AuthModal.tsx](file:///D:/Nexora/apps/web/src/features/storefront/AuthModal.tsx)                                           | Đồng bộ sử dụng `GoogleAuthUnavailableButton`, giữ nguyên cả tab đăng nhập & đăng ký email/password                                                                                                    |
| Modified | [style.css](file:///D:/Nexora/apps/web/public/assets/css/style.css)                                                         | Thêm `.auth-btn-google:disabled` và `.auth-google-note` đồng bộ theme & responsive                                                                                                                     |
| Created  | [def_rt_03_remove_mock_google_login.test.tsx](file:///D:/Nexora/apps/web/tests/def_rt_03_remove_mock_google_login.test.tsx) | Bộ regression tests bao phủ toàn bộ 8 yêu cầu: 0 lời gọi `/auth/login`, 0 hardcoded credentials, 0 session/token, 0 lỗi rejection, email register/login/logout hoạt động bình thường                   |

---

## 3. Quality Gates & Verification Results

| Gate / Check                                                                           | Exit Code | Result                                                                                                                                                                     |
| -------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx prettier --check` (6 files thuộc DEF-RT-03)                                       | `0`       | **PASS** (`All matched files use Prettier code style!`)                                                                                                                    |
| `rg -n "customer@nexora\\.vn" apps/ packages/ tests/`                                  | `0`       | **PASS** — `0` occurrence trong source code (chỉ có chuỗi assertion trong file test)                                                                                       |
| `npm run typecheck` (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`) | `0`       | **PASS**                                                                                                                                                                   |
| `npm run lint`                                                                         | `0`       | **PASS** (`0` errors, `0` warnings)                                                                                                                                        |
| `npm run test:unit`                                                                    | `0`       | **PASS** — **`17/17` files, `167/167` tests** (`def_rt_03`: `4/4`, `0` fail, `0` skip)                                                                                     |
| `npm run build`                                                                        | `0`       | **PASS** (`vite build` `590ms`, `291` modules)                                                                                                                             |
| Playwright E2E trên stack cô lập (`127.0.0.1:5174` -> `:3001` -> `3307/nexora_test`)   | `0`       | **PASS** — **`9/9` passed (`8.1s`)**, `0` fail, `0` skipped                                                                                                                |
| Browser Verification (`wave3_browser_qa_def_rt_03.mjs` trên `/register` & `/login`)    | `0`       | **PASS** — Cả `/register` & `/login` nút Google `disabled`, `authRequestsBeforeManualLogin: 0`, đăng nhập thật `customer@nexora.local` thành công, `0` console/page errors |

- **Lý do chọn phạm vi test:** DEF-RT-03 chỉ chỉnh sửa UI xác thực phía frontend (`apps/web`), không đụng backend auth contract hay Prisma schema; giữ nguyên toàn bộ backend auth/session tests và chỉ chạy lại toàn bộ unit/frontend suites + E2E + browser login thật trên MySQL cô lập.
- **Evidence screenshots:** `def_rt_03_register.png`, `def_rt_03_after_login.png` (trong `wave3_evidence/`).
