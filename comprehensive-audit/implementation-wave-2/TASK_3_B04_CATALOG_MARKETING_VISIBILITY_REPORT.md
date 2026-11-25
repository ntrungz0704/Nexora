# NEXORA — WAVE 2 TASK 3 REPORT: B-04 CATALOG & PUBLIC MARKETING VISIBILITY

- **Task ID:** `WAVE2-TASK-3` (`B-04 — Catalog & Public Marketing Visibility`)
- **Severity:** `P1 High`
- **Date:** `2026-11-26`
- **Branch:** `main`
- **Parent Baseline Commit:** `7f04f9a` (`fix(ai): loc san pham theo dieu kien kinh doanh`)
- **Commit Message:** `fix(catalog): dong bo visibility san pham va thuong hieu` _(SHA-1 thực tế ghi nhận tại `WAVE_2_FINAL_ACCEPTANCE_REPORT.md` sau commit, không dùng `--amend`)_
- **Verdict:** **`PASS`**

---

## 1. Root Cause Analysis

Trước khi sửa, các luồng public catalog và marketing tồn tại nhiều lỗ hổng đồng bộ:

1. **`CatalogRepository.getProducts` (`apps/api/src/modules/catalog/catalog.repository.ts`):**
   - Chỉ lọc `status: 'ACTIVE'` và `category: { isActive: true }`; hoàn toàn **bỏ qua kiểm tra `brand.isActive`** khi liệt kê sản phẩm, tìm kiếm (`?q=`), lọc featured (`/products/featured`), flash-sale (`/products/flash-sale`), hoặc lọc theo `?brand=<slug>`.
   - Đồng thời `where.OR` cho search text dễ xung đột nếu đặt `OR` cho `brandId = null` trực tiếp ở tầng top-level `where`.
2. **`CatalogRepository.getProductBySlug` & `ProductDetailPage.tsx`:**
   - API chi tiết không trả cờ `category.isActive`, `brand.isActive`, `isPurchasable`, `unavailableReason`.
   - Giao diện chi tiết chỉ kiểm tra `stockQuantity <= 0`, nên sản phẩm đã ngừng kinh doanh (`INACTIVE`) hoặc bị ẩn danh mục/thương hiệu nhưng vẫn còn `stockQuantity > 0` bị hiển thị sai thành `"Còn hàng (X sản phẩm)"` và vẫn mở nút `"Thêm vào giỏ hàng"` / `"Mua ngay"`.
3. **`MarketingService.getActiveFlashSale` (`apps/api/src/modules/marketing/marketing.service.ts`):**
   - Chỉ lọc `item.product.status === 'ACTIVE'`, để lọt item có danh mục hoặc thương hiệu `isActive = false`.
4. **Public Brand Listing trên UI (`SearchPage.tsx` & `ProductCatalogSection.tsx`):**
   - `SearchPage.tsx` hardcode mảng `BRANDS` gồm 11 hãng (`ASUS`, `ACER`, `INTEL`, `AMD`, `GIGABYTE`,...) thay vì tải từ `/catalog/brands`, dẫn đến sai lệch với DB khi thương hiệu bị ẩn/thêm mới, và chưa đồng bộ query param `?brand=...`.
   - `ProductCatalogSection.tsx` rơi về mảng hardcoded `BRAND_LOGOS` (26 logo) nếu `/catalog/brands` trả mảng rỗng.

---

## 2. Files Created / Modified

| Status   | File Path                                                                                     | Summary                                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `packages/shared/src/index.ts`                                                                | Thêm các trường optional `category.isActive`, `brand.isActive`, `isPurchasable`, `unavailableReason` vào `ProductSchema`                                                                            |
| Modified | `apps/api/src/modules/catalog/catalog.repository.ts`                                          | Định nghĩa `PUBLIC_PRODUCT_ELIGIBILITY_WHERE`, gộp qua `AND` trong `getProducts`, lọc `brand: { slug, isActive: true }` khi có `brandSlug`, select `isActive` của category/brand                    |
| Modified | `apps/api/src/modules/catalog/catalog.service.ts`                                             | Tính `isPurchasable` & `unavailableReason` (`DISCONTINUED`, `CATEGORY_INACTIVE`, `BRAND_INACTIVE`, `OUT_OF_STOCK`), giữ HTTP `200 OK` cho record tồn tại và `404` khi không tồn tại                 |
| Modified | `apps/api/src/modules/marketing/marketing.service.ts`                                         | Tiêm `getPrismaClient()`, áp dụng `PUBLIC_PRODUCT_ELIGIBILITY_WHERE` ở cả Prisma `where` và filter JS trong `getActiveFlashSale()`, bảo toàn `getPublicReviews` lịch sử                             |
| Modified | `apps/web/src/features/catalog/SearchPage.tsx`                                                | Xóa `BRANDS` hardcoded, tải brand hoạt động từ `/catalog/brands`, đồng bộ filter `?brand=...`                                                                                                       |
| Modified | `apps/web/src/features/storefront/ProductCatalogSection.tsx`                                  | Xóa fallback `BRAND_LOGOS` hardcoded để không làm lộ thương hiệu inactive                                                                                                                           |
| Modified | `apps/web/src/features/catalog/ProductDetailPage.tsx`                                         | Hiển thị banner `"Sản phẩm đã ngừng kinh doanh"` / `"Sản phẩm hiện tạm ngừng kinh doanh"`, không giả `"Còn hàng"`, khóa nút `"Thêm vào giỏ hàng"`, `"Mua ngay"`, ô nhập số lượng và stepper `-`/`+` |
| Created  | `apps/api/tests/task3_b04_catalog_marketing_visibility.test.ts`                               | Integration test backend trên MySQL 8.4 cô lập cho listing, filter, flash sale, detail unavailable, purchase lock, historical orders & returns/reviews                                              |
| Created  | `apps/web/tests/task3_b04_catalog_marketing_visibility.test.tsx`                              | Unit/Component tests cho `SearchPage`, `ProductCatalogSection`, `ProductDetailPage` (unavailable / category hidden / brand hidden / 404)                                                            |
| Created  | `comprehensive-audit/implementation-wave-2/TASK_3_B04_CATALOG_MARKETING_VISIBILITY_REPORT.md` | Báo cáo nghiệm thu Task 3                                                                                                                                                                           |

---

## 3. Policy Decisions Implemented (`getPublicReviews` & Historical Integrity)

- **Chính sách `getPublicReviews` (`MarketingService`):** API `GET /api/v1/marketing/reviews` chỉ trả đánh giá lịch sử (`rating >= 4`) gắn với trải nghiệm khách hàng đã mua; theo đúng Section 3.5, Nexora **không xóa hay lọc bỏ đánh giá lịch sử** khi sản phẩm/Category/Brand bị ẩn về sau, cũng không làm thay đổi quy tắc `VERIFIED PURCHASE` trong `ReviewService`.
- **Chính sách Trang chi tiết sản phẩm ngừng kinh doanh (`GET /api/v1/catalog/products/:slug` & `ProductDetailPage`):**
  - Bản ghi sản phẩm tồn tại trong DB nhưng `INACTIVE`, hoặc Category/Brand bị ẩn -> trả `200 OK` kèm `isPurchasable: false` và `unavailableReason`; UI hiển thị banner rõ ràng, ẩn badge `"Còn hàng"`, và khóa hoàn toàn mọi thao tác mua mới / thêm giỏ hàng (kết hợp chặn ở Cart/Order backend `400 PRODUCT_UNAVAILABLE`).
  - Slug không tồn tại trong DB -> vẫn giữ `404 PRODUCT_NOT_FOUND`.
  - Lịch sử đơn hàng (`OrderItem` snapshot) & `ReturnService` (bảo hành/đổi trả) không phụ thuộc `getProductBySlug` và hoạt động nguyên vẹn 100%.

---

## 4. Regression Test Cases (21/21 Scenarios Verified)

- **Backend Integration (`apps/api/tests/task3_b04_catalog_marketing_visibility.test.ts` — `4/4` tests PASS trên `127.0.0.1:3307/nexora_test`):**
  - Bao phủ Scenarios 1-11, 13, 15, 17, 18, 19, 20, 21: Product ACTIVE + Cat ACTIVE + Brand ACTIVE; loại bỏ Product INACTIVE, Category INACTIVE, Brand INACTIVE; bảo toàn sản phẩm `brandId = null`; đồng bộ Search, Category filter, Brand filter, Featured, Flash Sale (`/catalog/products/flash-sale` và `/marketing/flash-sales/active`); `/catalog/brands` ẩn Brand inactive; chi tiết sản phẩm ẩn trả `200` unavailable thay vì `404`, khóa Cart/Order (`400 PRODUCT_UNAVAILABLE`); slug không tồn tại trả `404`; lịch sử đơn (`NX-T3HIST-*`) giữ nguyên snapshot & tạo `ReturnRequest` `REPAIR` thành công (`201`) + giữ nguyên verified review.
- **Frontend Unit/Component (`apps/web/tests/task3_b04_catalog_marketing_visibility.test.tsx` — `6/6` tests PASS):**
  - Bao phủ Scenarios 11-18: `SearchPage` dùng brand API (không `INTEL`/`GIGABYTE` cứng), lọc brand & giữ sản phẩm `brandId = null`; `ProductCatalogSection` không lộ `BRAND_LOGOS` khi 0 brand active; `ProductDetailPage` cho 3 biến thể ẩn (`DISCONTINUED`, `CATEGORY_INACTIVE`, `BRAND_INACTIVE`) hiển thị banner ngừng kinh doanh, không hiện `"Còn hàng"`, disable input & 2 nút mua hàng (`cartService.addItem` 0 calls); slug lỗi giữ 404 UI.

---

## 5. Quality Gates & Database Isolation Evidence

- **Prettier check (toàn bộ 9 files code/test thuộc Task 3):** PASS.
- **Typecheck (`npm run typecheck`):** PASS.
- **ESLint (`npm run lint`):** PASS (`0` errors).
- **Unit & Frontend Tests (`npm run test:unit`):** PASS — `15/15` files, `158/158` tests (`task3_b04_catalog_marketing_visibility.test.tsx`: `6/6`, `po_bug_01_quantity_input.test.tsx`: `8/8`, `m6_1..m6_5`, v.v.).
- **Build (`npm run build`):** PASS (`365ms` Vite bundle).
- **Isolated MySQL Integration (`127.0.0.1:3307/nexora_test`):**
  - `task3_b04_catalog_marketing_visibility.test.ts`: `4/4` PASS
  - `b01_order_product_eligibility.test.ts`: `11/11` PASS
  - `commerce_and_ai.integration.test.ts`: `11/11` PASS
  - `phase_b_customer_reviews.test.ts`: `29/29` PASS
  - `storefront.integration.test.ts`: `7/7` PASS
  - `db.integration.test.ts` (`npm run test:integration -w @nexora/api`): `1/1` PASS
- **Dev DB Integrity (`127.0.0.1:3306/nexora`):** `DEV_DB_IMMUTABILITY_CHECK=MATCH_100_PERCENT tables=26 totalRows=837`.

---

## 6. Out-of-Scope Issues Noted (Unchanged in Task 3)

- `B-05` (`AdminService.deleteCategory` / `deleteBrand` soft delete) sẽ được xử lý tại Task 4.
- `ProductCatalogSection.tsx` vẫn giữ `CUSTOMER_REVIEWS` fallback nếu DB `getPublicReviews` trả mảng rỗng — giữ nguyên theo chính sách không sửa nội dung marketing ngoài scope.
