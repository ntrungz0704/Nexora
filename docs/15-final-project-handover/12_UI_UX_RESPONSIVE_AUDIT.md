# 12. UI/UX, Responsive, Tailwind CSS, Animation & Branding Audit

## 1. Kiểm toán Tailwind CSS 4 vs Custom CSS3 (Sự thật kỹ thuật quan trọng)

> **Kết luận trung thực:** Nexora **CHƯA chuyển đổi 100% sang Tailwind CSS**. Hệ thống hiện hoạt động theo mô hình **Hybrid**:
>
> - **Admin Portal (`AdminDashboardPage.tsx`):** Đã sử dụng **Tailwind CSS 4** làm chủ đạo (**984/1.349 = 73%** tổng số class Tailwind toàn dự án).
> - **Storefront (Khách hàng):** Tiếp tục phụ thuộc mạnh vào **5 file CSS3 kế thừa từ TechPilot** nạp toàn cục trong `apps/web/index.html` (tổng **10.151 dòng CSS** với **1.160 lệnh `!important`**) kết hợp **1.111 thuộc tính inline `style={{...}}`** trong các trang React.

### Thống kê chi tiết toàn bộ 6 tệp CSS trong `apps/web`

| File Path                                           | Lines |     Size | `@keyframes` | `@media` | CSS Vars | Dark Rules | `!important` | `prefers-reduced-motion` | Nạp tại        |
| --------------------------------------------------- | ----: | -------: | -----------: | -------: | -------: | ---------: | -----------: | ------------------------ | -------------- |
| `apps/web/public/assets/css/category-mega-menu.css` |   741 |  17.3 KB |            2 |        2 |        0 |         21 |           75 | YES                      | `index.html`   |
| `apps/web/public/assets/css/news.css`               | 2,147 |  55.6 KB |            0 |       24 |       15 |         31 |           23 | YES                      | `index.html`   |
| `apps/web/public/assets/css/pc-builder.css`         |   503 |  11.1 KB |            0 |        3 |        0 |         12 |           13 | NO                       | `index.html`   |
| `apps/web/public/assets/css/search-filters.css`     |   544 |  12.2 KB |            1 |        1 |        2 |         31 |           33 | NO                       | `index.html`   |
| `apps/web/public/assets/css/style.css`              | 6,216 | 142.0 KB |           10 |       35 |       41 |         72 |         1016 | YES                      | `index.html`   |
| `apps/web/src/index.css`                            |   324 |   7.5 KB |            4 |        1 |        0 |         60 |           64 | NO                       | `src/main.tsx` |

- **Tailwind CSS Version:** `tailwindcss@^4.3.5` + `@tailwindcss/vite@^4.3.5`.
- **Dark Mode Strategy:** `@custom-variant dark (&:where(.dark, .dark-mode, .dark *, .dark-mode *));` trong `apps/web/src/index.css` đồng bộ với class `dark` & `dark-mode` trên `<html>`. Đã khắc phục lỗi layout shift ngang khi bật/tắt sáng tối bằng cố định container logo (`188x38px`), cố định nút `#themeToggle` (`38x38px`) và `scrollbar-gutter: stable`.

---

## 2. Kiểm toán Animation & Motion Accessibility

- **Thư viện Animation bên thứ ba:** **KHÔNG cài đặt** Framer Motion, GSAP, AOS, Animate.css, Swiper hay React Bits trong `apps/web/package.json`.
- **Cơ chế Animation thực tế:** 100% sử dụng **Pure CSS `@keyframes`** (tổng **17 keyframes** across 4 file CSS: `nexora-topbar-scroll`, `nxPulse`, `nxMascotFloat`, `tpPulse`, `tpMascotFloat`, shimmer/fade/slide) và CSS `transition`.
- **Reduced Motion Support:** Đã hỗ trợ `@media (prefers-reduced-motion: reduce)` trong `style.css`, `news.css`, `category-mega-menu.css`; **CHƯA có** trong `src/index.css` (animation floating chatbot mascot chưa tắt khi user bật reduced motion).

---

## 3. Kiểm toán Responsive (5 Viewports chuẩn)

| Device       | Viewport   | Kiểm tra CSS Breakpoints trong source                                                    | Xác minh Runtime / Screenshot trong lần audit này                        | Trạng thái       |
| ------------ | ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------- |
| Desktop      | 1440 × 900 | Container `1440px`, 12-col grid, sidebar Admin `260px`                                   | Đã xác minh trên session trước (Desktop Storefront & Admin)              | **PARTIAL**      |
| Laptop       | 1366 × 768 | Covered by `max-width: 1440px` / `1280px` rules                                          | `NOT VERIFIED` bằng screenshot tự động ở commit `1aa6ed2`                | **NOT VERIFIED** |
| Tablet       | 768 × 1024 | `@media (max-width: 1023px)` & `(max-width: 768px)` (Hero `240px`, promo column)         | Kiểm tra CSS static (chưa chụp screenshot runtime)                       | **NOT VERIFIED** |
| Mobile       | 390 × 844  | `@media (max-width: 575px)` (Hero `min-height: 0; max-height: 200px`, ẩn topbar actions) | Đã fix CSS từ ảnh lỗi người dùng; chưa chạy Playwright visual regression | **PARTIAL**      |
| Small Mobile | 360 × 800  | Covered by `max-width: 575px`                                                            | `NOT VERIFIED` bằng runtime screenshot                                   | **NOT VERIFIED** |

> **Lưu ý kiểm toán:** Tuân thủ nguyên tắc không tuyên bố PASS nếu chưa có bằng chứng screenshot runtime mới nhất trên cả 5 viewport; đề xuất bổ sung Playwright viewport matrix screenshot test ở bước tiếp theo.

---

## 4. Kiểm toán chuẩn hóa thương hiệu Nexora (Branding Audit)

- **Đã chuẩn hóa hoàn chỉnh:** Logo sáng/tối (`logo.png`, `nexora-logo-white.png`, `nexora-icon.png`), Favicon, HTML `<title>`, Topbar CSS tokens (`--nexora-*`) & classes (`.nexora-topbar*`), Admin greeting (`Quản Trị Viên Nexora`), mã đơn hàng (`NX-` 10/10 đơn), mã coupon chính thức (`NEXORA100`, `NEXORA999`, `NEXORA10`), email hỗ trợ (`support@nexora.vn`), email reset password (`[Nexora]`).
- **Dấu vết `techpilot` còn tồn tại trong non-docs (32 tệp) — Phân loại rõ ràng:**
  1. **Legacy compatibility aliases (Có chủ đích giữ tạm để không vỡ tương thích):**
     - `apps/web/public/assets/css/style.css` (39 occurrences — alias `--techpilot-*`, `.techpilot-topbar*`)
     - `apps/web/src/features/storefront/StorefrontHeader.tsx` (27 occurrences — dual class `nexora-topbar techpilot-topbar` và fallback `localStorage`)
     - `apps/web/index.html`, `PromoPopup.tsx`, `SearchPage.tsx`, `PcBuilderPage.tsx`, `catalog.repository.ts` (fallback slug `pc-techpilot` và `localStorage` cũ)
  2. **Comments nội bộ / Tài liệu quản trị / Config loại trừ (Bình thường, nên giữ hoặc dọn dần):**
     - `AdminDashboardPage.tsx` (19 comment `TechPilot Parity`), `AGENTS.md`, `GEMINI.md`, `README.md`, `.gitignore`, `.dockerignore`, `eslint.config.js`, `personaScoring.ts`, `schema.prisma`.
  3. **Unused Legacy JS & DB Legacy Credentials (Nên dọn dẹp ở pha cleanup):**
     - 8 file JS trong `apps/web/public/assets/js/` (không được nạp ở bất kỳ đâu).
     - Tài khoản `admin@techpilot.vn` (`id=1019`) và coupon `TECHPILOT100` / `TECHPILOT999` trong MySQL & `prisma/seed.ts`.
