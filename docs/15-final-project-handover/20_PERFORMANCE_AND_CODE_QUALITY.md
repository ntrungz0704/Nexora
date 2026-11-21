# 20. Performance & Code Quality Audit

## 1. Frontend Performance Findings

| Hạng mục                                | Bằng chứng thực tế                                                                                                                                                                                                              | Mức độ ảnh hưởng | Khuyến nghị                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Monolithic JS Bundle (1.10 MB)**      | `vite build` xuất 1 chunk duy nhất `dist/assets/index-CiKubX02.js` = **1,103.56 kB** (276.15 kB gzip). Vite cảnh báo chunk > 500 kB. Toàn bộ `AdminDashboardPage.tsx` (5.924 dòng) bị gộp vào bundle của khách hàng Storefront! | **HIGH**         | Áp dụng `React.lazy()` + `Suspense` tách riêng route `/admin/*`, `/pc-builder`, `/ai-assistant`, `/compare`.               |
| **Ảnh tĩnh quá nặng (57.38 MB public)** | 35 ảnh > 500 KB, trong đó `banner-1/2/3.png` nặng 5.8–6.6 MB/tệp (3532×1184) và ảnh placeholder 2.08 MB.                                                                                                                        | **HIGH**         | Nén sang WebP/AVIF đúng tỷ lệ hiển thị (`<= 1920px`, mục tiêu `< 200 KB/ảnh`), dùng `loading="lazy"` & `decoding="async"`. |
| **Global Legacy CSS Overhead**          | 5 file CSS3 (10.151 LOC) tải đồng bộ block render tại `index.html`, ngay cả khi user vào `/admin` hoặc `/login`, kèm **1.224 lệnh `!important`**.                                                                               | **MEDIUM**       | Tách CSS theo route hoặc migrate dần Storefront sang Tailwind CSS 4.                                                       |
| **TanStack Query Caching**              | Đã dùng `@tanstack/react-query` cho catalog/cart/wishlist, giảm fetch thừa khi chuyển trang.                                                                                                                                    | **POSITIVE**     | Chuẩn hóa `staleTime` thống nhất và gom các lệnh `fetch()` lẻ về `apiClient`.                                              |

---

## 2. Backend Performance Findings

| Hạng mục                                  | Bằng chứng thực tế                                                                                                                                                                            | Mức độ ảnh hưởng | Khuyến nghị                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **6x PrismaClient Connection Pools**      | 6 vị trí gọi `new PrismaClient()` (`common/prisma.ts`, `admin.service.ts`, `ai.service.ts`, `marketing.service.ts`, `order.service.ts`, `payment.service.ts`).                                | **HIGH**         | Chuyển 100% service về dùng chung singleton `getPrismaClient()` từ `common/prisma.ts`.          |
| **AI Survey tải toàn bộ sản phẩm ACTIVE** | `ai.service.ts:180` gọi `prisma.product.findMany({ where })` không `take` để chấm điểm trong bộ nhớ (hiện 651 bản ghi — ổn ở quy mô hiện tại nhưng sẽ chậm nếu catalog tăng lên >10.000 SKU). | **MEDIUM**       | Lọc sơ bộ khoảng giá trực tiếp trong SQL `WHERE` và chọn `select` tối giản trước khi chấm điểm. |
| **Database Indexes**                      | `prisma/schema.prisma` đánh index đầy đủ cho `email`, `slug`, `sku`, `order_code`, `(category_id, status)`, `(placement, is_active, sort_order)`, `(code, is_active)`.                        | **POSITIVE**     | Giữ nguyên; kiểm tra thêm index composite cho `inventory_logs(product_id, created_at)`.         |

---

## 3. Code Quality & Maintainability Metrics

- **Type Safety:** **0 lỗi `tsc --noEmit`**, **0 lần sử dụng `any`** trong toàn bộ codebase TypeScript (rất tốt!).
- **Code Hygiene:** **0 đánh dấu `TODO` / `FIXME` / `HACK`**, **0 lỗi ESLint**.
- **Prettier Drift:** **145 file** chưa đúng chuẩn Prettier (`npm run format:check` exit 1).
- **God Components / Large Files (Top 10 tệp lớn nhất):**

|   # | File Path                                                    |     Lines | Tailwind Matches | Inline `style={{}}` | Nhận xét bảo trì               |
| --: | ------------------------------------------------------------ | --------: | ---------------: | ------------------: | ------------------------------ |
|   1 | `apps/web/src/features/admin/AdminDashboardPage.tsx`         | **5,924** |              984 |                   1 | Quá lớn — cần tách module ngay |
|   2 | `prisma/seed.ts`                                             | **1,502** |                0 |                   0 | Quá lớn — cần tách module ngay |
|   3 | `apps/web/src/features/ai/AiAssistantPage.tsx`               | **1,233** |                0 |                 106 | Lớn — nên tách sub-components  |
|   4 | `apps/api/src/modules/admin/admin.service.ts`                | **1,002** |                0 |                   0 | Lớn — nên tách sub-components  |
|   5 | `apps/web/src/features/catalog/SearchPage.tsx`               |   **993** |                1 |                  37 | Lớn — nên tách sub-components  |
|   6 | `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`          |   **990** |                5 |                  52 | Lớn — nên tách sub-components  |
|   7 | `apps/web/src/features/catalog/ProductDetailPage.tsx`        |   **951** |                1 |                  85 | Lớn — nên tách sub-components  |
|   8 | `apps/web/src/features/compare/ComparePage.tsx`              |   **927** |                9 |                  81 | Lớn — nên tách sub-components  |
|   9 | `apps/web/src/features/storefront/ProductCatalogSection.tsx` |   **919** |                4 |                  88 | Lớn — nên tách sub-components  |
|  10 | `apps/web/src/features/checkout/CheckoutPage.tsx`            |   **787** |                0 |                  80 | Chấp nhận được                 |
