# 00. Executive Project Summary — Nexora Technical Handover

- **Ngày kiểm toán:** 2026-11-22
- **Commit baseline:** `1aa6ed2` (nhánh `main`, đồng bộ `origin/main`)
- **Mô hình kinh doanh:** **Single-Vendor Hardware E-Commerce & Store Management System** (1 cửa hàng duy nhất bán PC, Laptop, Linh kiện & Gaming Gear; **KHÔNG phải Marketplace đa nhà bán hàng**).
- **Sản phẩm gốc đối chiếu (Source of Truth):** Legacy PHP MVC `TechPilot` (`D:\Nexora\TechPilot`, chỉ đọc).

---

## 1. Mục tiêu & Phạm vi hệ thống

Nexora tái xây dựng toàn bộ nền tảng thương mại điện tử và vận hành cửa hàng phần cứng từ legacy PHP (`TechPilot`) sang kiến trúc hiện đại **TypeScript Monorepo + Modular Monolith + React 19 SPA + Express 5 REST API + MySQL 8.4 + Prisma ORM**, bảo toàn giao diện/nghiệp vụ cốt lõi đồng thời cải thiện an toàn kiểu dữ liệu, giao dịch cơ sở dữ liệu nguyên tử và kiểm thử tự động.

**Các vai trò người dùng chính thức:**

1. `Guest`: Khách vãng lai duyệt danh mục, tìm kiếm, dùng giỏ hàng khách, đặt hàng, tra cứu đơn, dùng AI Chatbot/Survey/So sánh/Build PC.
2. `Customer`: Khách hàng đăng nhập quản lý tài khoản, wishlist cô lập theo user, lịch sử đơn hàng, hủy đơn, thanh toán VNPay.
3. `Staff`: Nhân viên vận hành nội bộ truy cập cổng quản trị `/admin`.
4. `Admin`: Quản trị viên hệ thống quản lý danh mục, sản phẩm, kho, đơn hàng, marketing, người dùng và nội dung.

---

## 2. Kiến trúc tổng thể

- **Monorepo (npm Workspaces):**
  - `apps/web` (`@nexora/web`): React 19 + Vite 8 + TypeScript + React Router 7 + TanStack Query 5 + Tailwind CSS 4 (+ legacy CSS3 stylesheets).
  - `apps/api` (`@nexora/api`): Node.js 22 + Express 5 + TypeScript + Prisma Client 6 + Zod 4 + Swagger/OpenAPI.
  - `packages/shared` (`@nexora/shared`): Shared Zod DTOs, TypeScript contracts và thuật toán `personaScoring.ts` dùng chung FE/BE.
  - `packages/config` (`@nexora/config`): Hằng số hệ thống (`NEXORA_API_V1_PREFIX`, vai trò, metadata dự án).
  - `prisma/`: Schema đơn nguồn sự thật (24 models, 9 enums), 4 migrations append-only và `seed.ts`.

---

## 3. Xác minh Technology Stack thực tế (Actual Implementation vs Target)

| Lớp          | Công nghệ mục tiêu              | Phiên bản thực tế trong `package.json`                                   | Trạng thái triển khai thực tế | Ghi chú kiểm toán                                                                                                 |
| ------------ | ------------------------------- | ------------------------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Frontend** | HTML5 / CSS3                    | Native + 6 file CSS (10,475 LOC)                                         | **ACTIVE**                    | Storefront dùng 5 stylesheet CSS3 gốc (10.151 LOC) + 1.111 inline styles                                          |
| **Frontend** | Tailwind CSS 4                  | `tailwindcss@^4.3.5`, `@tailwindcss/vite@^4.3.5`                         | **PARTIAL (Hybrid)**          | **1.349 class Tailwind** (73% tập trung tại `AdminDashboardPage.tsx`). Storefront chưa migrate 100% sang Tailwind |
| **Frontend** | React 19 & TS                   | `react@^19.3.1`, `typescript@~5.9.3`                                     | **ACTIVE (100%)**             | Strict TypeScript, 0 `any` trong toàn bộ codebase                                                                 |
| **Frontend** | React Router                    | `react-router-dom@^7.18.5`                                               | **ACTIVE**                    | 82 route definitions trong `AppRoutes.tsx`                                                                        |
| **Frontend** | TanStack Query                  | `@tanstack/react-query@^5.108.0`                                         | **ACTIVE**                    | Quản lý data fetching/caching trên hầu hết page                                                                   |
| **Frontend** | React Hook Form                 | `react-hook-form@^7.92.0`, `@hookform/resolvers@^7.0.7`                  | **BARELY USED**               | Chỉ import duy nhất tại `FoundationDashboard.tsx`; toàn bộ form Auth/Checkout/Admin dùng `useState`               |
| **Frontend** | Zod / Axios                     | `zod@^4.6.7`, `axios@^1.21.1`                                            | **ACTIVE**                    | `apiClient` dùng Axios; một số trang (`CartPage`, `CheckoutPage`, `ProfilePage`) vẫn xen kẽ `fetch()`             |
| **Frontend** | Vite                            | `vite@^8.3.8`                                                            | **ACTIVE**                    | Build nhanh (554ms–10s full monorepo), nhưng chưa code-splitting (chunk JS 1,10 MB)                               |
| **Backend**  | Node.js / Express 5             | Node v22.23.4, `express@^5.3.0`                                          | **ACTIVE**                    | 10 domain modules, 85 REST endpoints                                                                              |
| **Backend**  | Security libs                   | `helmet@^8.1.0`, `cors@^2.8.6`, `bcryptjs@^3.0.3`, `jsonwebtoken@^9.0.3` | **ACTIVE**                    | Đang chạy thực tế                                                                                                 |
| **Backend**  | Rate Limit / Cookie             | `express-rate-limit@^8.7.4`, `cookie-parser@^1.4.7`                      | **INSTALLED BUT UNUSED**      | Khai báo trong `apps/api/package.json` nhưng **0 import** trong `apps/api/src`                                    |
| **Backend**  | Email / Docs                    | `nodemailer@^10.6.1`, `swagger-ui-express@^5.0.1`                        | **ACTIVE**                    | Email reset password + Swagger UI `/api/docs`                                                                     |
| **Database** | MySQL 8.4 + Prisma              | MySQL `8.4.13` runtime, `prisma@6.19.3`                                  | **ACTIVE & VERIFIED**         | 24 models, 4 migrations up-to-date, 651 products, 0 lỗi toàn vẹn dữ liệu                                          |
| **Testing**  | Vitest / Supertest / Playwright | `vitest@^5.1.1`, `supertest@^7.3.2`, `@playwright/test@^1.59.0`          | **ACTIVE (PARTIAL E2E)**      | 64/64 Vitest+Supertest pass; 9 Playwright smoke tests (chưa có E2E giao dịch)                                     |
| **Infra**    | Docker / Nginx / GH Actions     | Docker Compose, `node:22-alpine`, `nginx:1.27-alpine`, `ci.yml`          | **ACTIVE WITH GAPS**          | CI `quality-and-build` thiếu MySQL cho integration tests & 145 file lệch Prettier                                 |

**Thư viện/Công cụ ngoài danh sách mục tiêu đang tồn tại:**

- `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`: Hỗ trợ component testing cho `FoundationDashboard.test.tsx`.
- `concurrently`, `tsx`, `dotenv`: Hỗ trợ dev server song song (`npm run dev`), chạy TS trực tiếp và nạp biến môi trường.
- `FontAwesome 6.5.1` & `Google Fonts (Inter)`: Nạp qua CDN trong `apps/web/index.html`.

---

## 4. Kết luận trạng thái bàn giao (Final Audit Verdict)

- **Tính năng cốt lõi (Catalog, Cart, Checkout, COD/VNPay, Atomic Inventory, Admin CRUD chính, 4 hệ thống AI):** **HOẠT ĐỘNG THỰC TẾ** trên MySQL 8.4.13 với 64/64 bài test tích hợp/bảo mật pass.
- **Mức độ sẵn sàng Production (Production Readiness):** **CONDITIONAL / NOT READY WITHOUT P0 FIXES**. Cần xử lý ngay 4 lỗi P0/P1 trước khi go-live:
  1. **P0 (Security — Vertical Privilege Escalation):** `PATCH /api/v1/admin/users/:id/role` cho phép `STAFF` tự nâng quyền lên `ADMIN`.
  2. **P0 (Security — IDOR PII Exposure):** `GET /api/v1/orders/detail/:code` công khai hoàn toàn, không xác thực chủ sở hữu hay SĐT.
  3. **P0 (Functional Broken Link):** Email reset mật khẩu tạo link `/auth/reset-password?token=...` nhưng `AppRoutes.tsx` chỉ khai báo `/auth/reset` và `/reset-password` → người dùng bấm link trong email sẽ gặp trang **404**.
  4. **P1 (Security & CI):** Kích hoạt `express-rate-limit`, sửa `ci.yml` (tách unit/integration test & chạy `npm run format` sửa 145 file lệch Prettier), và nối API thực cho các tab phụ của `ProfilePage` (Address, Notifications, Returns, Profile Update, Change Password).
