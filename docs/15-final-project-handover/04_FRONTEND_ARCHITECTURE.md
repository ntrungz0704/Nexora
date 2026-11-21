# 04. Frontend Architecture & Complete Route Inventory

## 1. Kiến trúc Frontend (`apps/web`)

- **Entry Points:** `apps/web/index.html` → `apps/web/src/main.tsx` → `apps/web/src/App.tsx` → `apps/web/src/routes/AppRoutes.tsx`.
- **Providers:** `QueryClientProvider` (`@tanstack/react-query`) và `BrowserRouter` (`react-router-dom`).
- **API Client Layer:**
  - `apps/web/src/lib/apiClient.ts`: Axios instance cấu hình `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`), tự động đính kèm `Authorization: Bearer <token>` và `x-guest-session-id`.
  - Services: `authService.ts`, `cartService.ts`, `storefrontService.ts`, `wishlistService.ts`, `systemService.ts`.
  - **Nhận xét kỹ thuật:** Một số component (`CheckoutPage.tsx`, `ProfilePage.tsx`, `AdminDashboardPage.tsx`) vẫn gọi trực tiếp `fetch()` thay vì thống nhất qua `apiClient`.
- **State Management:** Server state qua TanStack Query; Auth/Theme/GuestSession qua `localStorage` (`nexora_token`, `nexora_user`, `nexora-theme`, `nexora_guest_session`); Local UI state qua React `useState`/`useMemo`.
- **Form Handling & Validation:** `react-hook-form` + `@hookform/resolvers/zod` chỉ dùng tại `FoundationDashboard.tsx`. Các form nghiệp vụ thực tế dùng controlled `useState` + manual check ở FE kết hợp Zod validation ở BE.
- **Styling Architecture (Hybrid — Quan trọng):**
  - `apps/web/src/index.css` nạp `@import 'tailwindcss';` (Tailwind CSS v4.3.5 qua `@tailwindcss/vite`) và `@custom-variant dark (&:where(.dark, .dark-mode, .dark *, .dark-mode *));`.
  - `apps/web/index.html` nạp trực tiếp 5 file CSS3 tùy biến từ `public/assets/css/` (`style.css`, `category-mega-menu.css`, `search-filters.css`, `pc-builder.css`, `news.css` — tổng **10.151 LOC**).
  - **Phân bổ thực tế:** `AdminDashboardPage.tsx` sử dụng Tailwind CSS v4 chủ đạo (984 matches). Toàn bộ Storefront sử dụng hệ class CSS3 cũ + 1.111 inline `style={{}}`. Do đó hệ thống hiện ở trạng thái **Hybrid Tailwind v4 + Legacy CSS3**, **chưa chuyển 100% sang Tailwind CSS**.

## 2. Phát hiện lỗi định tuyến (Route Audit Findings)

| Phát hiện                                      | Mức độ               | Bằng chứng                                                                                                                                                                                                                   |
| ---------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thiếu route `/auth/reset-password`**         | **P0 (BROKEN LINK)** | `auth.service.ts:163` gửi email chứa link `${clientUrl}/auth/reset-password?token=...`, nhưng `AppRoutes.tsx` chỉ có `/auth/reset` (L121) và `/reset-password` (L125) → người dùng bấm link sẽ rơi vào `NotFoundPage` (404). |
| **Route `/profile/*` chưa nối API đầy đủ**     | **P1 (PARTIAL)**     | `/profile/addresses`, `/profile/notifications`, `/profile/return`, `/profile/password` đều render trong `ProfilePage.tsx` nhưng dữ liệu là mock/local state, chỉ `/profile/orders` gọi API thực `GET /orders/my-orders`.     |
| **Route `/admin/settings` và `/admin/stores`** | **P2 (PARTIAL)**     | Khai báo trong `AppRoutes.tsx` (L141, L143) trỏ vào `AdminDashboardPage`, nhưng backend `admin.routes.ts` không có endpoint `/admin/settings` hay `/admin/stores`.                                                           |
| **Nhiều alias route cho SEO/TechPilot parity** | **INFO**             | Có chủ đích để giữ 100% URL compatibility với TechPilot (`/post`, `/news`, `/tin-tuc`, `/home/search`, `/product/detail/:slug`, ...).                                                                                        |

## 3. Danh mục đầy đủ toàn bộ 82 Frontend Routes

| Route                    | Component              | Nhóm                   | Layout                              | Authentication                         | Authorization | Source File                         |
| ------------------------ | ---------------------- | ---------------------- | ----------------------------------- | -------------------------------------- | ------------- | ----------------------------------- |
| `/`                      | `StorefrontHome`       | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/home`                  | `StorefrontHome`       | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/home/index`            | `StorefrontHome`       | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/search`                | `SearchPage`           | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/home/search`           | `SearchPage`           | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/category/:slug`        | `SearchPage`           | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/product/detail/:slug`  | `ProductDetailPage`    | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/product/:slug`         | `ProductDetailPage`    | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/wishlist`              | `WishlistPage`         | Wishlist               | StorefrontHeader + StorefrontFooter | JWT Required (API 401 for guest)       | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/cart`                  | `CartPage`             | Cart & Checkout        | StorefrontHeader + StorefrontFooter | Optional Auth (Guest supported)        | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/checkout`              | `CheckoutPage`         | Cart & Checkout        | StorefrontHeader + StorefrontFooter | Optional Auth (Guest supported)        | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/checkout/success`      | `CheckoutSuccessPage`  | Cart & Checkout        | StorefrontHeader + StorefrontFooter | Optional Auth (Guest supported)        | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/build-pc`              | `PcBuilderPage`        | AI & Interactive Tools | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/pc-builder`            | `PcBuilderPage`        | AI & Interactive Tools | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/compare`               | `ComparePage`          | AI & Interactive Tools | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/ai-assistant`          | `AiAssistantPage`      | AI & Interactive Tools | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/thu-cu-doi-moi`        | `TradeInPage`          | AI & Interactive Tools | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/trade-in`              | `TradeInPage`          | AI & Interactive Tools | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/post`                  | `NewsPage`             | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/posts`                 | `NewsPage`             | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/news`                  | `NewsPage`             | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/tin-tuc`               | `NewsPage`             | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/post/:slug`            | `PostDetailPage`       | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/post/detail/:slug`     | `PostDetailPage`       | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/news/:slug`            | `PostDetailPage`       | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/tin-tuc/:slug`         | `PostDetailPage`       | News / Content         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/order-tracking`        | `OrderTrackingPage`    | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/stores`                | `StoresPage`           | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile`               | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/orders`        | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/orders/:id`    | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/addresses`     | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/notifications` | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/return`        | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/return/:id`    | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/password`      | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/profile/wishlist`      | `Navigate`             | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/orders`                | `ProfilePage`          | Customer Profile       | StorefrontHeader + StorefrontFooter | JWT Required (UI prompt)               | CUSTOMER+     | `apps/web/src/routes/AppRoutes.tsx` |
| `/auth/login`            | `LoginPage`            | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/auth/register`         | `RegisterPage`         | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/auth/forgot`           | `ForgotPasswordPage`   | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/auth/reset`            | `ResetPasswordPage`    | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/login`                 | `LoginPage`            | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/register`              | `RegisterPage`         | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/forgot-password`       | `ForgotPasswordPage`   | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/reset-password`        | `ResetPasswordPage`    | Authentication         | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin`                 | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/dashboard`       | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/orders`          | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/orders/:id`      | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/products`        | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/categories`      | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/brands`          | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/inventory`       | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/coupons`         | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/flash-sales`     | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/posts`           | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/users`           | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/reviews`         | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/settings`        | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/banners`         | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/admin/stores`          | `AdminDashboardPage`   | Admin / Staff          | Admin Shell (Sidebar + 70px Header) | JWT Required (client check + API RBAC) | ADMIN, STAFF  | `apps/web/src/routes/AppRoutes.tsx` |
| `/about`                 | `AboutPage`            | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/careers`               | `CareersPage`          | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/contact`               | `ContactPage`          | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/privacy`               | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/guide`                 | `GuidePage`            | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/returns`               | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/warranty`              | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/support`               | `TechnicalSupportPage` | Info & Services        | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/policy/warranty`       | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/chinh-sach-bao-hanh`   | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/policy/shipping`       | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/chinh-sach-van-chuyen` | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/policy/return`         | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/chinh-sach-doi-tra`    | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/policy/privacy`        | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/chinh-sach-bao-mat`    | `PolicyPage`           | Policy Pages           | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `(layout wrapper)`       | `MainLayout`           | Storefront             | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/foundation`            | `FoundationDashboard`  | Technical / Foundation | MainLayout                          | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `/architecture`          | `ArchitectureInfoPage` | Technical / Foundation | MainLayout                          | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
| `*`                      | `NotFoundPage`         | Error Page (404)       | StorefrontHeader + StorefrontFooter | Public                                 | All           | `apps/web/src/routes/AppRoutes.tsx` |
