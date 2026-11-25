# NEXORA — IMPLEMENTATION REPORT: DEF-RT-01 PRODUCT IMAGE MAPPING FIX

- **Defect ID:** `DEF-RT-01`
- **Severity:** `P1`
- **Wave / Task:** Implementation Wave 1 — Task 01
- **Date:** `2026-11-25`
- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` (`fix(catalog): dong bo danh muc category va toi uu anh san pham laptop`)
- **Final Verdict:** **`PASS`**

---

## 1. Executive Summary

Đã hoàn thành triển khai sửa lỗi **DEF-RT-01** (`apps/web/src/lib/productImage.ts`) theo đúng phạm vi được Project Owner phê duyệt, loại bỏ hoàn toàn nguyên nhân gốc gây ánh xạ sai ảnh sản phẩm trên catalog 674 sản phẩm và bổ sung bộ regression unit tests (`apps/web/tests/def_rt_01_product_image.test.ts`).

Kết quả thực tế sau khi sửa:

- **Loại bỏ hoàn toàn điều kiện `includes('in')`** và cơ chế substring không ranh giới từ trước đây (`ryzen`, `laptop`, `rtx 4070`, `tuf`, `ssd/ram` gộp chung, thiếu kiểm tra file ảnh lỗi/biểu ngữ).
- **Thiết lập pipeline phân loại có thứ tự ưu tiên rõ ràng:** Explicit valid `thumbnailUrl` (có override & lọc placeholder/file thiếu) -> Structured `category` / `category.slug` / `specs.category_slug` -> Structured `specs` -> Word-safe fallback text matching -> Neutral fallback (`DEFAULT_PRODUCT_FALLBACK_IMAGE = '/assets/images/placeholder.webp'`).
- **Tất cả 174/674 sản phẩm không phải máy in bị ánh xạ nhầm sang `printer-canon.jpg`** ở trạng thái `HEAD` (`monitor`: 23, `cooling`: 31, `headset`: 31, `mainboard`: 31, `pc`: 15, `ram`: 6, `speaker`: 31, `storage`: 6) đã giảm về **`0`** (`NON_PRINTER_TO_PRINTER_COUNT: 0`).
- **Tất cả 31/31 handheld console bị ánh xạ nhầm sang `cpu_ryzen7.jpg`** đã được sửa về `/assets/images/review/unlinked/rog-ally-x.jpg` (`CONSOLE_TO_CPU_COUNT: 0`), trong khi **15/15 CPU Ryzen** và toàn bộ **32/32 CPU** vẫn ánh xạ chính xác theo nhóm CPU.
- **Tất cả 674/674 sản phẩm trong Dev DB** sau khi áp dụng `getProductImage()` mới đều trỏ đến file ảnh **tồn tại thực tế trên đĩa** (`MISSING_ON_DISK_COUNT: 0`, khắc phục luôn lỗi ảnh 404 `/assets/images/review/unlinked/chair-warrior.jpg` của sản phẩm ID `15`).
- Toàn bộ các cổng kiểm tra cho DEF-RT-01 đều **PASS (exit code `0`)**: regression tests (`9/9 PASS`), `npm run test:unit` (`13/13` files, `144/144 PASS`), `npm run typecheck`, `npm run lint`, `npx prettier --check` trên các file sửa/tạo, `npm run build`, và kiểm tra trình duyệt thực tế (`0` HTTP >= 400, `0` broken images sau scroll, `0` console/page errors).

---

## 2. Root Cause

Kiểm tra trực tiếp phiên bản baseline `HEAD:apps/web/src/lib/productImage.ts` kết hợp đối chiếu trên toàn bộ 674 sản phẩm và asset thực tế trong `apps/web/public/assets/images/` cho thấy các nguyên nhân gốc sau:

1. **Điều kiện substring quá rộng `searchStr.includes('in')` tại dòng `170` (`HEAD`):**
   - Bất kỳ sản phẩm không phải laptop/PC-ultra nào đi qua nhánh fallback đều bị kiểm tra `searchStr.includes('in')` để gán `/assets/images/review/unlinked/printer-canon.jpg`.
   - Trong dữ liệu tiếng Việt và thông số phần cứng không có dấu hoặc tiếng Anh, chuỗi 2 ký tự `'in'` xuất hiện trong rất nhiều từ thông dụng không liên quan đến máy in: `'inch'` (màn hình), `'cooling'` (tản nhiệt), `'gaming'` (PC/gear/loa), `'kingston'` (RAM/SSD), `'mainboard'` / `'màn hình'` / `'linh'`, `'windows'`, `'vi tính'`, `'wireless'`.
   - Tổng số sản phẩm không thuộc danh mục `office-equipment` bị rơi vào `printer-canon.jpg` trên snapshot hiện tại là **174/674** (`23` monitor, `31` cooling, `31` headset, `31` mainboard, `15` pc, `6` ram, `31` speaker, `6` storage). Ghi chú: Báo cáo Runtime Audit trước đây ghi nhận con số tổng hợp 175 sản phẩm với cách phân nhóm chuỗi tên/gaming trước khi commit `bddbf44` bổ sung phân loại laptop; trạng thái tại `HEAD bddbf444d651bcf8bd43765318fb4fd6bd9654d6` đo trực tiếp là **174**.

2. **Thứ tự fallback CPU dòng `235-236` (`HEAD`) kiểm tra `'ryzen'` trước khi phân biệt Handheld Console:**
   - Toàn bộ 31 handheld console có `category.slug = 'console'` (ví dụ `"Máy chơi game cầm tay ASUS Console-CN1 Ryzen Z1 Extreme 1TB"`) đều chứa chuỗi `'ryzen'` và được gán `thumbnailUrl = '/assets/images/placeholders/placeholder-console-1.png'`.
   - Vì nhánh bỏ qua `/placeholders/` nên 31 console đi xuống tầng keyword fallback và chạm `searchStr.includes('ryzen')` tại dòng `235`, dẫn tới cả **31/31 handheld console** bị ánh xạ sang `/assets/images/review/unlinked/cpu_ryzen7.jpg`.

3. **Các lỗi phân loại thứ tự từ khóa và thumbnail đi kèm trong cùng hàm `getProductImage()`:**
   - **PC lắp sẵn bị nhận diện nhầm thành VGA (`16/33` PC):** Tên PC có chứa `"RTX 4070"` chạm nhánh VGA trước nhánh PC nên 16 PC hiển thị ảnh card rời `rtx-4070-super.jpg`.
   - **Sạc dự phòng bị nhận diện thành Laptop (`31/32` power-bank):** Chuỗi `"Sạc nhanh Laptop"` trong tên sạc dự phòng kích hoạt nhánh `isLaptop` và rơi vào `/assets/images/review/unlinked/laptop-van-phong.png`.
   - **RAM bị gộp chung với SSD (`25/31` RAM):** Nhánh fallback gộp `ssd` và `ram` vào chung `/assets/images/review/unlinked/ssd-samsung.jpg`.
   - **Ghế (`31/32`) fallback về ảnh Laptop (`rog-zephyrus.jpg`)** và sản phẩm ID `15` (`Ghế công thái học Ergonomic Sihoo Doro C300`) giữ `thumbnailUrl` trỏ tới `/assets/images/review/unlinked/chair-warrior.jpg` (file **không tồn tại trên đĩa**).
   - **Tai nghe (`headset`)** trỏ tới `category-headset.png` thực chất là banner chữ `"HyperWork"` (`471x82px`) khi có keyword `headset-g733`, hoặc rơi vào `printer-canon.jpg` (`31/32`).
   - Một số asset trong `placeholders/` và `unlinked/` bị sai/kém phù hợp (`laptop-gaming.png` / `laptop-van-phong.png` là icon TP `503 bytes`, `mainboard-tuf.jpg` thực tế là ảnh vỏ case, `placeholder-console-1.png` thực chất là ảnh laptop).

---

## 3. Files Created / Modified

| Trạng thái | Đường dẫn đầy đủ | Vai trò |
| --- | --- | --- |
| Modified | `D:\Nexora\apps\web\src\lib\productImage.ts` | Sửa pipeline phân loại và ánh xạ ảnh sản phẩm `getProductImage()` (DEF-RT-01) |
| Created | `D:\Nexora\apps\web\tests\def_rt_01_product_image.test.ts` | Bộ regression unit tests độc lập cho 9 nhóm kịch bản bắt buộc của DEF-RT-01 |
| Created | `D:\Nexora\comprehensive-audit\implementation-wave-1\DEF-RT-01_IMPLEMENTATION_REPORT.md` | Báo cáo nghiệm thu triển khai DEF-RT-01 |

**Xác nhận các caller sử dụng `getProductImage` (không cần sửa interface, 100% tương thích):**

- `apps/web/src/features/storefront/ProductCard.tsx:137`
- `apps/web/src/features/storefront/StorefrontHeader.tsx:354`
- `apps/web/src/features/catalog/ProductDetailPage.tsx:460`
- `apps/web/src/features/cart/CartPage.tsx:271`
- `apps/web/src/features/checkout/CheckoutPage.tsx:550`
- `apps/web/src/features/compare/ComparePage.tsx:601, 922`
- `apps/web/src/features/pcBuilder/PcBuilderPage.tsx:637, 913, 1099`
- `apps/web/src/features/ai/AiAssistantPage.tsx:1157`

---

## 4. Implementation Details

Module `apps/web/src/lib/productImage.ts` giữ nguyên chữ ký public `export function getProductImage(product: Partial<ProductDto> | undefined): string` và export thêm hằng số `DEFAULT_PRODUCT_FALLBACK_IMAGE = '/assets/images/placeholder.webp'`.

### Thứ tự ưu tiên phân loại (Priority Pipeline)

1. **Bước 0 — Kiểm tra explicit `thumbnailUrl` hợp lệ (`resolveKnownOverrideThumbnail` + `shouldIgnoreGenericOrBrokenThumbnail`):**
   - Áp dụng override an toàn cho các thumbnail legacy known-good (`samsung-odyssey.jpg` -> `display.png`, `monitor-lg-27.jpg` -> `display1.png`, `logitech-g913.png` -> `logitech-g213.jpg`).
   - Bỏ qua để định tuyến lại nếu `thumbnailUrl` là generic placeholder (`/categories/category-`, `/placeholders/`) hoặc trỏ tới ảnh bị thiếu/sai trên đĩa (`chair-warrior.jpg`, `headset-g733`).
   - Giữ nguyên các `thumbnailUrl` thực riêng của sản phẩm nếu hợp lệ (đảm bảo tương thích dữ liệu seed hiện có).

2. **Bước 1 — Nguồn dữ liệu danh mục có cấu trúc (`resolveStructuredCategory`):**
   - Chuẩn hóa không dấu và map slug/tên thông qua `CATEGORY_ALIASES` theo thứ tự: `product.category?.slug` -> `product.category?.name` -> `specs.category_slug` -> `product.specs.category_slug`.
   - Hỗ trợ đồng bộ cả slug tiếng Anh lẫn slug tiếng Việt (ví dụ `office-equipment` / `thiet-bi-van-phong`, `console` / `may-choi-game`, `power-bank` / `sac-du-phong`, `pc-nexora`, `laptop-gaming`, v.v.).

3. **Bước 2 — Thuộc tính kỹ thuật có cấu trúc (`inferCategoryFromSpecs`):**
   - Khi product thiếu quan hệ `category` nhưng có `specs` (đã làm phẳng nested `specs.specs`), suy luận chính xác theo thuộc tính:
     - `platform` chứa `'handheld'` -> `'console'`
     - `office_device_type` chứa `'printer'` hoặc có `print_technology` / `ink` / `paper` -> `'office-equipment'`
     - `accessory_type` -> `'accessories'`
     - `cooler_type` / `cooling_capacity_w` / `pumpSpeed` / `radiatorSize` -> `'cooling'`
     - `chair_type` / `armrest` / `weightLimit` / `max_load_kg` -> `'chair'`
     - `speaker_type`, `headset_type`, `keyboard_type` / `switch_type`, `sensor` / `max_dpi`, `max_output_w` / `capacity_mah`, `gpu_chip` / `gpu_vram_gb`, `chipset` / `m2_slots`, `module_count` / (`memory_type` + `total_capacity_gb`), `drive_type` / `read_speed_mbps`, `efficiency_rating` / `modularity`, `case_type` / `radiator_support`, `panel_type` / `refresh_rate_hz`, `cpu_cores` / `tdp`, `standard` wi-fi -> đúng nhóm phần cứng tương ứng.
     - Nếu có cả `cpu_model` và `gpu_model`: phân tách rõ `'laptop'` (`battery_wh` hoặc macOS) vs `'pc'` (`psu_wattage` / `mainboard_model` / `case_model`).

4. **Bước 3 — Fallback từ khóa tên/slug/SKU an toàn theo ranh giới từ (`inferCategoryFromText`):**
   - Chỉ chạy khi thiếu cả category cấu trúc lẫn specs nhận diện được.
   - Áp dụng `\b...\b` trên chuỗi ASCII đã chuẩn hóa dấu tiếng Việt và sắp thứ tự chống chồng chéo:
     - Handheld `console` (trước `ryzen` và `laptop`)
     - `power-bank` & `accessories` (trước `laptop` để không nhầm `"Sạc nhanh Laptop"`, `"Giá đỡ Laptop"`)
     - `office-equipment`: chỉ khớp `/\b(may in|printer|ecotank|laserjet)\b/`, `/\blbp\d+\b/`, `thiet bi van phong` — **loại bỏ hoàn toàn `includes('in')`**
     - `cooling` (`tan nhiet`, `/\b(cooler|cooling|aio)\b/`)
     - `pc` lắp sẵn (`/^pc[\s-]/`, `/^pc-/`, `may tinh de ban`, `may bo`) trước `vga`/`mainboard`/`cpu`
     - `laptop` / `laptop-gaming`, `monitor`, `vga`, `mainboard`, `cpu`, `ram`, `storage`, `psu`, `case`, `keyboard`, `mouse`, `chair`, `headset`, `speaker`, `networking`.

5. **Bước 4 — Ánh xạ ảnh theo danh mục (`resolveCategoryImage` & `CATEGORY_DEFAULT_IMAGES`) & Neutral Fallback:**
   - Chọn ảnh đúng loại phần cứng tồn tại trên đĩa và đã được kiểm chứng trực quan (`rog-ally-x.jpg` cho console, `placeholders/fan.png` cho cooling, `placeholders/psu.png` cho PSU, `ram-corsair.jpg` cho RAM RGB/XPG và `ram.jpg` cho RAM thường, `category-chair.png`, `category-speaker.png`, `category-mainboard.png`, `category-power-bank.png`, `pc-advanced.jpg` / `pc-workstation.jpg`, ảnh màn hình theo hãng `display.png` / `display1.png` / `prod_621.jpg` / `prod_622.jpg` / `prod_623.jpg`).
   - Khi không xác định được danh mục (ví dụ `product === undefined` hoặc sản phẩm mới thiếu mọi metadata), trả về `DEFAULT_PRODUCT_FALLBACK_IMAGE` (`'/assets/images/placeholder.webp'`).

---

## 5. Before / After Behavior

| Kịch bản / Nhóm sản phẩm | Trước khi sửa (`HEAD bddbf44`) | Sau khi sửa (DEF-RT-01) |
| --- | --- | --- |
| Máy in thật (`office-equipment`, EcoTank, Canon LBP) | `/assets/images/review/unlinked/printer-canon.jpg` | `/assets/images/review/unlinked/printer-canon.jpg` (`33/33` đúng) |
| Màn hình có chữ `"inch"` / `"Gaming"` (`23/33` chiếc) | `/assets/images/review/unlinked/printer-canon.jpg` (sai) | `/assets/images/review/unlinked/display.png`, `display1.png`, `prod_621..623.jpg` (`0` máy in) |
| Tản nhiệt có chữ `"Cooling"` (`31/32` chiếc) | `/assets/images/review/unlinked/printer-canon.jpg` (sai) | `/assets/images/placeholders/fan.png` (`31/32`), giữ DB explicit `case2.jpg` (`1/32`, id `12`) |
| PC lắp sẵn (`31/33` mẫu mới) | `15x printer-canon.jpg` + `16x rtx-4070-super.jpg` (sai) | `/assets/images/review/unlinked/pc-advanced.jpg` (`32/33`) + `pc-workstation.jpg` (`1/33`) |
| Loa vi tính (`31/31` chiếc) | `/assets/images/review/unlinked/printer-canon.jpg` (sai) | `/assets/images/categories/category-speaker.png` (`31/31`) |
| Mainboard (`31/31` chiếc) | `/assets/images/review/unlinked/printer-canon.jpg` (sai) | `/assets/images/categories/category-mainboard.png` (`31/31`) |
| Tai nghe (`32/32` chiếc) | `31x printer-canon.jpg` + `1x category-headset.png` (banner HyperWork) | `/assets/images/placeholder.webp` (`32/32` trung tính, không ảnh máy in/banner sai) |
| RAM có chữ `"Kingston"` (`31/31`) | `25x ssd-samsung.jpg` + `6x printer-canon.jpg` (sai) | `/assets/images/review/unlinked/ram-corsair.jpg` (`31/31`, trong catalog `rgb` đều có ở 31 mẫu) |
| Ổ cứng SSD có chữ `"Kingston"` (`6/32`) | `6x printer-canon.jpg` + `26x ssd-samsung.jpg` | `31x placeholders/ssd.png` + `1x ssd-samsung.jpg` (`0` máy in) |
| Handheld Console chứa `"Ryzen"` (`31/31`) | `/assets/images/review/unlinked/cpu_ryzen7.jpg` (sai) | `/assets/images/review/unlinked/rog-ally-x.jpg` (`31/31`, `0` CPU) |
| CPU AMD Ryzen (`15/15`) & CPU Intel (`17/17`) | Ryzen -> `cpu_ryzen7.jpg`; Intel -> `cpu_14.png` | Ryzen -> `cpu_ryzen7.jpg` (`15/15`); Core i7/i9 -> `cpu_14.png` (`1`); CPU khác -> `placeholders/cpu.png` (`16`) |
| Sạc dự phòng có `"Sạc nhanh Laptop"` (`31/32`) | `/assets/images/review/unlinked/laptop-van-phong.png` (sai, icon 503B) | `/assets/images/categories/category-power-bank.png` (`31/32`); id `17` giữ DB explicit `prod_632.jpg` |
| Ghế gaming / công thái học (`32/32`) | `31x rog-zephyrus.jpg` + `1x chair-warrior.jpg` (404 missing on disk) | `/assets/images/categories/category-chair.png` (`32/32`, `0` 404) |
| Nguồn PSU (`31/32` mẫu mới) | `/assets/images/review/unlinked/case1.jpg` (ảnh vỏ case) | `/assets/images/placeholders/psu.png` (`31/32`); id `11` giữ DB explicit `case1.jpg` |
| Vỏ Case (`31/31`) | `/assets/images/review/unlinked/case1.jpg` | `/assets/images/placeholders/case.png` (`31/31`) |
| Phụ kiện không phải camera (`31/33` USB Hub) | `/assets/images/review/unlinked/prod_625.png` | `/assets/images/review/unlinked/prod_627.png` (`31/33`); id `18` giữ DB explicit `prod_625.png` |
| Thiếu category/specs/product `undefined` | Fallback cứng về `rog-zephyrus.jpg` | `DEFAULT_PRODUCT_FALLBACK_IMAGE` (`/assets/images/placeholder.webp`) hoặc suy luận qua `specs` |

---

## 6. Regression Test Cases

File test: `D:\Nexora\apps\web\tests\def_rt_01_product_image.test.ts` (**9 test blocks, toàn bộ assertion kiểm tra kết quả URL ảnh thực tế**):

| # | Tên test case | Kịch bản kiểm thử | Kết quả mong đợi & xác minh thực tế |
| --- | --- | --- | --- |
| 1 | `identifies real printers correctly via structured category and fallback keywords` | Máy in theo category `office-equipment` và máy in EcoTank thiếu `category` | Cả 2 trả về `/assets/images/review/unlinked/printer-canon.jpg` — **PASS** |
| 2 | `does NOT misclassify monitors containing "inch" or "gaming" as printers` | Màn hình 27 inch có category `monitor` và ViewSonic Gaming thiếu category | Không trả `printer-canon.jpg`; trả đúng `display.png` & `prod_622.jpg` — **PASS** |
| 3 | `does NOT misclassify cooling products containing "Cooling" as printers` | Tản nhiệt khí `Cooling RGB` và AIO thiếu category | Cả 2 trả về `/assets/images/placeholders/fan.png` — **PASS** |
| 4 | `does NOT misclassify PC / Gaming systems containing "Gaming" or "Intel" as printers or VGA` | PC Nexora Ryzen 5 + RTX 4070 Super, PC Intel + RTX 4060, PC Creator Workstation | Trả về `pc-advanced.jpg` & `pc-workstation.jpg` — **PASS** |
| 5 | `does NOT misclassify speakers / microphones containing "vi tính" or "mini" as printers` | Loa vi tính `Logitech Bass-SP1` và `Loa Bluetooth Gaming Mini` | Cả 2 trả về `/assets/images/categories/category-speaker.png` — **PASS** |
| 6 | `does NOT map handheld consoles with Ryzen or placeholder-console-1 to CPU chip images` | Console có `placeholder-console-1.png` + `Ryzen Z1 Extreme` và Legion Go thiếu category | Trả `rog-ally-x.jpg`, không chứa `cpu_ryzen` — **PASS** |
| 7 | `maps real Ryzen CPUs accurately via category, specs, and non-console CPU fallback` | CPU Ryzen 5 `cpu` category và CPU Ryzen 7 không có `category` | Cả 2 trả về `/assets/images/review/unlinked/cpu_ryzen7.jpg` — **PASS** |
| 8 | `falls back safely when category, specs, or product are missing without throwing` | `undefined`, sản phẩm mới không category/specs, sản phẩm thiếu category nhưng có `specs.specs.platform = 'Handheld PC'` | Lần lượt trả `DEFAULT_PRODUCT_FALLBACK_IMAGE`, `DEFAULT_PRODUCT_FALLBACK_IMAGE`, `rog-ally-x.jpg` — **PASS** |
| 9 | `keeps overlapping keywords isolated across categories (Kingston, Laptop, PSU, Chair, Broken thumbs)` | RAM Kingston, SSD Kingston, Power Bank `"Sạc nhanh Laptop"`, PSU `"80 Plus"`, Chair `chair-warrior.jpg` missing thumbnail | Từng loại trả đúng `ram.jpg`, `placeholders/ssd.png`, `category-power-bank.png`, `placeholders/psu.png`, `category-chair.png` — **PASS** |

---

## 7. Test Results và Command Thực Thi

Tất cả các lệnh kiểm thử chạy sau lần chỉnh sửa cuối cùng đều đạt **exit code `0`**:

| Kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| --- | --- | --- | --- |
| DEF-RT-01 Targeted Unit Tests | `npx vitest run apps/web/tests/def_rt_01_product_image.test.ts` | `0` | **`1` file passed (`9 passed / 9`), duration `138ms` (`6ms` test runtime)** |
| Full Monorepo Unit Suite | `npm run test:unit` | `0` | **`13` test files passed (`13`), `144` tests passed (`144`), duration `17.39s` (`0` failed, `0` skipped)** |
| Full 674-Product Read-Only Scan | `npx tsx verify_all_674_after.ts` (snapshot `dev_catalog_readonly.json`) | `0` | **`674/674` checked, `0` missing on disk, `0` non-printer -> printer, `0` console -> CPU** |
| Live Browser Multi-Category Audit | `node check_live_browser_def01.mjs` (Playwright headless Chromium -> `http://localhost:5173/search?cat=...`) | `0` | **6 danh mục (`monitor`, `cooling`, `console`, `speaker`, `pc`, `office-equipment`, `24` cards/page): `24/24` matched expected, `0` forbidden images, `0` broken images sau scroll (`3` lazy before scroll -> `0` after scroll), `0` HTTP `>= 400`, `0` console/page errors** |

*(Lưu ý: Không chạy backend database integration test suite ghi DB theo đúng quy định an toàn Dev DB Mục 6 Step 3 & Mục 7).*

---

## 8. Typecheck / ESLint / Prettier / Build Results

| Quality Gate | Lệnh thực thi | Exit Code | Kết quả thực tế |
| --- | --- | --- | --- |
| TypeScript Typecheck | `npm run typecheck` (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`) | `0` | **PASS (`0` errors)** |
| ESLint | `npm run lint` (`eslint .`) | `0` | **PASS (`0` errors, `0` warnings)** |
| Prettier (Modified & Created Files) | `npx prettier --check apps/web/src/lib/productImage.ts apps/web/tests/def_rt_01_product_image.test.ts` | `0` | **PASS (`All matched files use Prettier code style!`)** |
| Prettier (Repo Baseline Check) | `npm run format:check` | `1` *(baseline)* | **`89` pre-existing unrelated files** (historical Markdown audit docs, `prisma/seed_techpilot_full.ts`, v.v.); `0` file của `DEF-RT-01` vi phạm format |
| Production Build | `npm run build` (`tsc -b tsconfig.json && vite build`) | `0` | **PASS (`288 modules transformed`, `dist/index.html 1.79 kB`, `dist/assets/index-BwpcVXo_.css 81.87 kB`, `dist/assets/index-DOjvazCd.js 1,191.78 kB` built in `364ms`)** |

---

## 9. Product Mapping Verification

Đối chiếu **674/674 sản phẩm** đọc trực tiếp READ-ONLY từ bảng `Product` trong Dev DB `127.0.0.1:3306/nexora` (chia thành `22` danh mục) **Trước (`HEAD bddbf44`) vs Sau (`DEF-RT-01`)**:

| Category (`slug`) | SL | Trước khi sửa (`HEAD bddbf44`) | Sau khi sửa (`DEF-RT-01`) |
| --- | --- | --- | --- |
| `accessories` | 33 | `32x prod_625.png`, `1x camera.jpg` | `31x prod_627.png`, `1x prod_625.png`, `1x camera.jpg` |
| `case` | 31 | `31x case1.jpg` | `31x placeholders/case.png` |
| `chair` | 32 | `31x rog-zephyrus.jpg`, `1x chair-warrior.jpg` **(404)** | `32x category-chair.png` (**0 missing**) |
| `console` | 31 | `31x cpu_ryzen7.jpg` **(CPU)** | `31x rog-ally-x.jpg` (**0 CPU**) |
| `cooling` | 32 | `31x printer-canon.jpg` **(Printer)**, `1x case2.jpg` | `31x placeholders/fan.png`, `1x case2.jpg` (**0 Printer**) |
| `cpu` | 32 | `17x cpu_14.png`, `15x cpu_ryzen7.jpg` | `16x placeholders/cpu.png`, `15x cpu_ryzen7.jpg`, `1x cpu_14.png` |
| `headset` | 32 | `31x printer-canon.jpg` **(Printer)**, `1x category-headset.png` | `32x placeholder.webp` (**0 Printer/Banner**) |
| `keyboard` | 32 | `25x keyboard1.png`, `7x logitech-g213.jpg` | `25x keyboard.png`, `7x logitech-g213.jpg` |
| `laptop` | 63 | Gồm `2x laptop-gaming.png` (503B), `11x macbook-pro`, v.v. | `11x macbook-pro`, `8x rog-zephyrus`, `8x msi-vector`, `7x lenovo-legion`, `5x acer-predator`, `5x hp-omen`, `4x dell-g16`, `4x hp-pavilion`, `3x placeholders/laptop.png`, `3x asus-vivobook`, `2x lg-gram`, `2x lenovo-ideapad`, `1x lenovo-thinkpad` |
| `laptop-gaming` | 3 | `1x rog-zephyrus`, `1x acer-predator`, `1x lenovo-legion` | `1x rog-zephyrus`, `1x acer-predator`, `1x lenovo-legion` |
| `mainboard` | 31 | `31x printer-canon.jpg` **(Printer)** | `31x category-mainboard.png` (**0 Printer**) |
| `monitor` | 33 | `23x printer-canon.jpg` **(Printer)**, `5x display.png`, `5x display1.png` | `17x display.png`, `5x display1.png`, `4x prod_623.jpg`, `4x prod_621.jpg`, `3x prod_622.jpg` (**0 Printer**) |
| `mouse` | 32 | `32x logitech-g-pro-x-wireless.jpg` | `25x logitech-g-pro-x-wireless.jpg`, `7x prod_628.png` |
| `networking` | 1 | `1x router-tplink.jpg` | `1x router-tplink.jpg` |
| `office-equipment` | 33 | `33x printer-canon.jpg` | `33x printer-canon.jpg` |
| `pc` | 33 | `16x rtx-4070-super.jpg`, `15x printer-canon.jpg`, `2x pc-*.jpg` | `32x pc-advanced.jpg`, `1x pc-workstation.jpg` (**0 Printer/VGA**) |
| `power-bank` | 32 | `31x laptop-van-phong.png` **(Laptop icon)**, `1x prod_632.jpg` | `31x category-power-bank.png`, `1x prod_632.jpg` (`id=17`) |
| `psu` | 32 | `32x case1.jpg` | `31x placeholders/psu.png`, `1x case1.jpg` (`id=11`) |
| `ram` | 31 | `25x ssd-samsung.jpg` **(SSD)**, `6x printer-canon.jpg` **(Printer)** | `31x ram-corsair.jpg` (**0 Printer/SSD**) |
| `speaker` | 31 | `31x printer-canon.jpg` **(Printer)** | `31x category-speaker.png` (**0 Printer**) |
| `storage` | 32 | `26x ssd-samsung.jpg`, `6x printer-canon.jpg` **(Printer)** | `31x placeholders/ssd.png`, `1x ssd-samsung.jpg` (**0 Printer**) |
| `vga` | 32 | `32x rtx-4070-super.jpg` | `16x rtx-4070-super.jpg`, `16x placeholders/vga.png` |

---

## 10. Database Integrity Confirmation

Truy vấn READ-ONLY trực tiếp trên `127.0.0.1:3306/nexora` (container Docker `nexora-mysql-1`, image `mysql:8.4`, trạng thái `healthy`):

- **`totalProducts`:** `674` (`ACTIVE`: `673`, `INACTIVE`: `1` — sản phẩm ID `815` `Laptop MSI Creator Z16 HX Studio B13VFTO-211VN`, thuộc category `laptop`)
- **`totalCategories`:** `22` (`inactiveCategories`: `[]` — toàn bộ 22 danh mục đang `isActive: true`)
- **`totalOrders`:** `2`
- **`totalReturns`:** `0`
- **`totalUsers`:** `3`
- **Xác nhận an toàn:** `0` thao tác INSERT, UPDATE, DELETE, seed, migration hay reset nào được thực hiện. Không chỉnh sửa Prisma schema hay DTO.

---

## 11. Git Integrity Confirmation

Kiểm tra trực tiếp bằng `git branch --show-current`, `git rev-parse HEAD`, `git status --short`, `git diff --stat`, `git diff --cached --stat`:

- **Branch hiện tại:** `main`
- **HEAD trước khi triển khai DEF-RT-01:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` *(ghi nhận thực tế repository đã có 2 commit mới sau baseline `6073152`: `84ccd42` và `bddbf44`; không tự ý reset lịch sử)*
- **HEAD sau khi triển khai DEF-RT-01:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` *(không thay đổi)*
- **Staged changes (`git diff --cached --stat`):** Rỗng (`0` files staged)
- **Tracked modified files (`git status --short`):** Duy nhất `M apps/web/src/lib/productImage.ts` (`452+ / 193-`)
- **Untracked files mới tạo trong Wave 1:**
  - `apps/web/tests/def_rt_01_product_image.test.ts`
  - `comprehensive-audit/implementation-wave-1/DEF-RT-01_IMPLEMENTATION_REPORT.md`
- **Untracked files cũ được bảo toàn nguyên vẹn:** `comprehensive-audit/runtime-launch/`, `comprehensive-audit/final-runtime-verification/` và toàn bộ tài liệu audit trước đó.
- **Thư mục cấm `TechPilot/` & `audit-output/`:** Không đụng chạm (READ-ONLY).
- **Xác nhận Git Policy:** **Chưa commit (`0` commit), chưa push (`0` push), chưa stage (`0` staged).**

---

## 12. Known Limitations

### Giới hạn trong phạm vi dữ liệu & asset của DEF-RT-01 (Out of Scope để giữ nguyên DB & thư mục ảnh)

1. **4 bản ghi seed ban đầu có `thumbnailUrl` tường minh trong DB trỏ tới ảnh chưa sát sản phẩm:**
   - ID `11` (`Nguồn máy tính...` / `psu`) có `thumbnailUrl = '/assets/images/review/unlinked/case1.jpg'`
   - ID `12` (`Tản nhiệt nước AIO...` / `cooling`) có `thumbnailUrl = '/assets/images/review/unlinked/case2.jpg'`
   - ID `17` (`Pin sạc dự phòng Anker 737...` / `power-bank`) có `thumbnailUrl = '/assets/images/review/unlinked/prod_632.jpg'` (ảnh chuột Inphic)
   - ID `18` (`Hub chuyển đổi Baseus...` / `accessories`) có `thumbnailUrl = '/assets/images/review/unlinked/prod_625.png'` (ảnh camera ngoài trời)
   - Vì Mục 4 & 5.4 nghiêm cấm thay đổi dữ liệu DB hoặc ép ghi đè hết mọi `thumbnailUrl` hợp lệ trong DB, `getProductImage()` giữ nguyên các URL tường minh không-placeholder này; khắc phục triệt để cần batch cập nhật cột `thumbnailUrl` trong DB ở wave/task dữ liệu riêng nếu Project Owner phê duyệt.
2. **Nhóm Tai nghe (`headset`, 32 sản phẩm):** Trong thư mục `apps/web/public/assets/images/` hiện chưa có ảnh sản phẩm tai nghe thật (`category-headset.png` là banner logo chữ HyperWork), nên toàn bộ `headset` sử dụng neutral placeholder `/assets/images/placeholder.webp` thay vì hiển thị nhầm ảnh máy in. Có thể bổ sung ảnh tai nghe thực tế ở đợt cập nhật asset riêng.
3. **Một số file ảnh laptop có tên file không trùng tuyệt đối hãng trên đĩa** (ví dụ `hp-pavilion.jpg` / `asus-vivobook.jpg` / `lenovo-ideapad.jpg` được tận dụng làm ảnh laptop văn phòng cho Dell/HP/Acer thiếu ảnh riêng vì `acer-aspire.jpg` & `dell-inspiron.jpg` trùng/thiếu phù hợp hoặc tránh icon 503B).
4. **Prettier toàn repo (`npm run format:check`):** Vẫn báo `89` file có sẵn từ baseline không liên quan DEF-RT-01 (`comprehensive-audit/...`, `prisma/seed_techpilot_full.ts`). Riêng 2 file của DEF-RT-01 đạt 100% chuẩn Prettier.

### Phát hiện ngoài scope được Project Owner hỏi thêm trong phiên (Chỉ điều tra READ-ONLY, KHÔNG tự ý sửa)

- **XAMPP MySQL port `3306`:** XAMPP MariaDB 10.4.32 không khởi động được do lỗi `10048` (`Bind on TCP/IP port 3306`) vì Docker container `nexora-mysql-1` (`MySQL 8.4`, database đang chạy của Nexora) đã chiếm port `3306` qua `wslrelay.exe`/`com.docker.backend`. Không tự ý tắt `nexora-mysql-1` để bảo vệ website & Dev DB Nexora đang chạy.
- **Sản phẩm ẩn / Danh mục ẩn / Con số 674 vs 673 & Bảo hành/Đổi trả:**
  - Hiện tại chỉ có đúng `1` sản phẩm `INACTIVE` (ID `815`) và `0` danh mục ẩn (`inactiveCategories: []`), nên Storefront hiển thị `673` (`CatalogRepository.getProducts` lọc `status: 'ACTIVE'` & `category: { isActive: true }`) trong khi Admin hiển thị `674` (`AdminService.getProducts` hiển thị cả sản phẩm ngừng bán để quản trị viên có thể bật lại).
  - Return/Bảo hành đã đọc snapshot `OrderItem` nên khách hàng đã mua vẫn tạo/tra cứu đổi trả hợp lệ ngay cả khi sản phẩm bị ẩn.
  - **Các điểm lệch cần xin phê duyệt sửa ở task khác (NGOÀI DEF-RT-01):** `OrderService.createOrder()` chưa chặn `product.status !== 'ACTIVE'` / `category.isActive === false` khi payload API gửi trực tiếp danh sách `items`; `CartService.addItem()` kiểm tra `product.status !== 'ACTIVE'` nhưng chưa kiểm tra `category.isActive === false`; `AiService` lọc `status: 'ACTIVE'` nhưng chưa lọc `category.isActive: true`; `CatalogRepository.getProducts()` chưa lọc `brand.isActive` khi không truyền `brandSlug`; `AdminService.deleteCategory()` đang hard-delete danh mục rỗng thay vì soft-hide.

---

## 13. Acceptance Criteria Checklist

- [x] Xác định đúng nguyên nhân của điều kiện `includes('in')`. *(PASS — `HEAD productImage.ts:170` khớp `'inch'`, `'cooling'`, `'gaming'`, `'kingston'`, `'vi tính'`, gây 174 false positives sang `printer-canon.jpg`)*
- [x] Không còn mapping sai sản phẩm không phải máy in sang `printer-canon.jpg`. *(PASS — `NON_PRINTER_TO_PRINTER_COUNT: 0` trên toàn bộ 674 sản phẩm)*
- [x] Handheld console không còn bị mapping sang `cpu_ryzen7.jpg`. *(PASS — `31/31` console -> `rog-ally-x.jpg`, `CONSOLE_TO_CPU_COUNT: 0`)*
- [x] CPU Ryzen vẫn có mapping hợp lý. *(PASS — `15/15` AMD Ryzen CPU -> `cpu_ryzen7.jpg`, `32/32` CPU đúng loại)*
- [x] Các nhóm sản phẩm được nêu trong báo cáo audit có regression tests. *(PASS — `9/9` test cases bao phủ đầy đủ máy in, màn hình, tản nhiệt, PC/gaming, loa, handheld console, CPU Ryzen, fallback thiếu metadata, từ khóa chồng chéo)*
- [x] Fallback hoạt động với sản phẩm thiếu metadata. *(PASS — `DEFAULT_PRODUCT_FALLBACK_IMAGE` & `inferCategoryFromSpecs` PASS)*
- [x] Regression tests PASS. *(PASS — `9/9` file DEF-RT-01 & `144/144` unit suite)*
- [x] Typecheck PASS. *(PASS — `npm run typecheck` exit `0`)*
- [x] ESLint PASS. *(PASS — `npm run lint` exit `0`)*
- [x] Prettier check cho file sửa PASS. *(PASS — `npx prettier --check apps/web/src/lib/productImage.ts apps/web/tests/def_rt_01_product_image.test.ts` exit `0`)*
- [x] Production build PASS. *(PASS — `npm run build` exit `0`)*
- [x] Không thay đổi database, API contract hoặc dữ liệu sản phẩm. *(PASS — Dev DB giữ nguyên `674` sản phẩm, `ProductDto` và REST API không đổi)*
- [x] Không sửa ngoài scope DEF-RT-01. *(PASS — chỉ sửa `productImage.ts` + tạo test & report DEF-RT-01)*
- [x] Git history không thay đổi. *(PASS — `HEAD` giữ nguyên `bddbf444d651bcf8bd43765318fb4fd6bd9654d6`)*
- [x] Không commit và không push. *(PASS — `0` staged, `0` commit, `0` push)*

---

## 14. Final Verdict

**`PASS`** — Toàn bộ 15/15 Acceptance Criteria của **DEF-RT-01** đạt 100%, không phát sinh lỗi hay regression mới. Triển khai **DỪNG TẠI ĐÂY**, giữ nguyên 2 server `:3000` / `:5173` và Dev DB `127.0.0.1:3306/nexora`, chờ Project Owner và Technical Advisor nghiệm thu báo cáo trước khi chuyển sang bước tiếp theo (`DEF-RT-02` hoặc các fix danh mục ẩn/XAMPP nếu được phê duyệt).
