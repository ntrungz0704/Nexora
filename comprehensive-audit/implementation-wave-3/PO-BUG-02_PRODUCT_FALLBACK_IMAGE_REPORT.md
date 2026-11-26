# NEXORA — WAVE 3 TASK 3 REPORT: PO-BUG-02 PRODUCT DETAIL FALLBACK IMAGE SIZE

- **Defect ID:** `PO-BUG-02`
- **Severity:** `P2 — Medium (Visual & UX)`
- **Date:** `2026-11-26`
- **Branch:** `main` (`b71b8b9ee296d894de4f58a01f9ce15acaee8acf`, uncommitted workspace per Wave 3 rule)
- **Verdict:** **`PASS`**

---

## 1. Root Cause Analysis

1. **Tầng hiển thị (`ProductDetailPage.tsx`):**
   - Khung ảnh chính (`aspectRatio: '1'`, ~`460×460 px` desktop) và hàng thumbnail (`70×70 px`) trước đây chỉ đặt `maxWidth: '90%', maxHeight: '90%', objectFit: 'contain'` mà **thiếu `width: '100%', height: '100%'`**. Hệ quả là các ảnh có kích thước gốc nhỏ hơn khung container (đặc biệt các icon `56×56 px` như Power Bank, Chair, Mainboard, Speaker, Accessories) hiển thị đúng bằng `56×56 px` lọt thỏm giữa khung lớn.
   - Hàng thumbnail `[mainImage, mainImage, mainImage]` lặp tĩnh 3 ảnh giống nhau, chưa đọc ảnh bổ sung hợp lệ từ `product.images`, không có tương tác click đổi ảnh và thiếu `onError` fallback khi URL lỗi.
2. **Tầng asset fallback (`apps/web/public/assets/images/categories/`):**
   - Năm file fallback mà `DEF-RT-01` ánh xạ gồm `category-power-bank.png`, `category-chair.png`, `category-mainboard.png`, `category-speaker.png`, `category-accessories.png` có kích thước gốc chỉ **`56×56 px`** (trong khi `category-case.png` và `category-laptop.png` cùng thư mục đã ở chuẩn `480×480 px`). Nếu chỉ phóng to `56×56` bằng CSS lên `410×410`, ảnh bị vỡ hạt nặng.
   - Đồng thời, không thay đổi logic ánh xạ URL của `DEF-RT-01` (`getProductImage`) để bảo toàn 100% kiểm thử đã nghiệm thu.

---

## 2. Solution & Files Created / Modified

| Status   | File Path                                                                                                         | Summary                                                                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modified | [ProductDetailPage.tsx](file:///D:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx)                    | Dùng gallery responsive `.nexora-product-gallery*`, hỗ trợ chọn thumbnail tương tác (`aria-pressed`), sử dụng `resolveProductGalleryImages`, và thêm `onError` fallback về `DEFAULT_PRODUCT_FALLBACK_IMAGE`                    |
| Modified | [index.css](file:///D:/Nexora/apps/web/src/index.css)                                                             | Bổ sung `.nexora-product-gallery`, `.nexora-product-gallery-stage`, `.nexora-product-gallery-main-img` (`width: 100%; height: 100%; object-fit: contain`), `.nexora-product-gallery-thumbs`, Responsive `clamp()` + `<= 960px` |
| Modified | [productImage.ts](file:///D:/Nexora/apps/web/src/lib/productImage.ts)                                             | Giữ nguyên 100% logic `getProductImage` (`DEF-RT-01`); bổ sung additive helper `resolveProductGalleryImages` lọc bỏ URL placeholder/lỗi (`chair-warrior.jpg`, ...) và loại trùng lặp                                           |
| Modified | [category-power-bank.png](file:///D:/Nexora/apps/web/public/assets/images/categories/category-power-bank.png)     | Nâng cấp asset từ `56×56` lên studio product PNG sắc nét **`480×480 px`** đúng nguồn, giữ nguyên path `DEF-RT-01`                                                                                                              |
| Modified | [category-chair.png](file:///D:/Nexora/apps/web/public/assets/images/categories/category-chair.png)               | Nâng cấp asset từ `56×56` lên studio product PNG sắc nét **`480×480 px`**                                                                                                                                                      |
| Modified | [category-mainboard.png](file:///D:/Nexora/apps/web/public/assets/images/categories/category-mainboard.png)       | Nâng cấp asset từ `56×56` lên studio product PNG sắc nét **`480×480 px`**                                                                                                                                                      |
| Modified | [category-speaker.png](file:///D:/Nexora/apps/web/public/assets/images/categories/category-speaker.png)           | Nâng cấp asset từ `56×56` lên studio product PNG sắc nét **`480×480 px`**                                                                                                                                                      |
| Modified | [category-accessories.png](file:///D:/Nexora/apps/web/public/assets/images/categories/category-accessories.png)   | Nâng cấp asset từ `56×56` lên studio product PNG sắc nét **`480×480 px`**                                                                                                                                                      |
| Created  | [po_bug_02_fallback_image_size.test.tsx](file:///D:/Nexora/apps/web/tests/po_bug_02_fallback_image_size.test.tsx) | Bộ regression tests kiểm tra PNG header `>= 400×400` cho cả 5 asset, render 5 nhóm fallback, bảo toàn ảnh thật, click thumbnail, xử lý `onError` fallback và CSS `object-fit: contain` không vỡ/crop                           |

---

## 3. Quality Gates, Unit Tests & Multi-Viewport Browser Verification

| Gate / Check                                                                           | Exit Code | Result                                                                                       |
| -------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `npx prettier --check` (4 code/test files của PO-BUG-02)                               | `0`       | **PASS** (`All matched files use Prettier code style!`)                                      |
| `npm run typecheck` (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`) | `0`       | **PASS**                                                                                     |
| `npm run lint`                                                                         | `0`       | **PASS** (`0` errors, `0` warnings)                                                          |
| `npm run test:unit` (gồm cả `def_rt_01_product_image.test.ts` `9/9`)                   | `0`       | **PASS** — **`18/18` files, `170/170` tests** (`po_bug_02`: `3/3`, `def_rt_01`: `9/9`)       |
| `npm run build`                                                                        | `0`       | **PASS** (`vite build` `387ms`, `291` modules)                                               |
| Playwright E2E trên stack cô lập (`127.0.0.1:5174` -> `:3001` -> `3307/nexora_test`)   | `0`       | **PASS** — **`9/9` passed** (`0` fail, `0` skipped)                                          |
| Browser Verification 4 Viewports (`wave3_browser_qa_po_bug_02.mjs`)                    | `0`       | **PASS** — `failed404Urls: []`, `consoleErrors: []`, `pageErrors: []`, `docOverflowX: false` |

### Bảng đo kích thước thực tế trên Chromium

| Viewport                      | Nhóm kiểm tra                                      | `naturalWidth × naturalHeight` | `renderedWidth × renderedHeight` | `stageWidth × stageHeight` | Horizontal Overflow      |
| ----------------------------- | -------------------------------------------------- | ------------------------------ | -------------------------------- | -------------------------- | ------------------------ |
| `1440×900` (Desktop)          | Chair, Power Bank, Mainboard, Speaker, Accessories | `480 × 480`                    | `410 × 410`                      | `460 × 460`                | `false` (`1425 <= 1440`) |
| `1440×900` (Desktop)          | Authentic Photo (`macbook-pro.jpg`)                | `400 × 320`                    | `410 × 410` (contain)            | `460 × 460`                | `false` (`1425 <= 1440`) |
| `768×1024` (Tablet)           | Chair, Power Bank, Authentic Photo                 | `480 × 480` / `400 × 320`      | `410 × 410`                      | `460 × 460`                | `false` (`753 <= 768`)   |
| `1024×768` (Tablet Landscape) | Chair, Power Bank, Authentic Photo                 | `480 × 480` / `400 × 320`      | `360 × 360`                      | `410 × 410`                | `false` (`1009 <= 1024`) |
| `375×812` (Mobile)            | Chair, Power Bank, Authentic Photo                 | `480 × 480` / `400 × 320`      | `248 × 248`                      | `298 × 298`                | `false` (`360 <= 375`)   |

- **Lý do chọn phạm vi test:** PO-BUG-02 chỉ tác động hiển thị ảnh & gallery tại `apps/web` và 5 file ảnh static fallback tại `apps/web/public/assets/images/categories/`; không chỉnh backend API hay MySQL schema, nên chạy lại toàn bộ `typecheck`, `lint`, `test:unit` (gồm `def_rt_01`), `build`, `Playwright E2E` (`9/9`) và browser multi-viewport verification.
- **Evidence screenshots:** Bộ ảnh chụp đầy đủ lưu trong `wave3_evidence/po_bug_02_*.png`.
