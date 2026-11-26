# NEXORA — WAVE 3 TASK 1 REPORT: DEF-RT-02 PC BUILDER COMPONENT COMPATIBILITY

- **Defect ID:** `DEF-RT-02`
- **Severity:** `P1 — High`
- **Date:** `2026-11-26`
- **Branch:** `main` (`b71b8b9ee296d894de4f58a01f9ce15acaee8acf`, uncommitted workspace per Wave 3 rule)
- **Verdict:** **`PASS`**

---

## 1. Root Cause Analysis

Qua discovery trên source code ([PcBuilderPage.tsx](file:///D:/Nexora/apps/web/src/features/pcBuilder/PcBuilderPage.tsx)), `prisma/seed.ts` (33 sản phẩm có danh mục gộp), và toàn bộ `674` sản phẩm trong Dev DB (`22` danh mục), hệ thống gặp các lỗi gốc sau:

1. **Khớp chuỗi con danh mục sai (`catSlug.includes(s)`):**
   - Trong môi trường dùng danh mục gộp (`main-cpu-vga`, `case-nguon-tan`), `'main-cpu-vga'.includes('cpu')` cho lọt **Card màn hình (`RTX 4070 Ti SUPER`) vào CPU slot**; `'case-nguon-tan'.includes('case')` cho lọt **Tản nhiệt nước AIO (`DeepCool LT720`) vào Case slot**.
2. **Fallback từ khóa không tách loại sản phẩm đã biết:**
   - Khi sản phẩm thuộc danh mục khác nhưng tên chứa keyword trùng (`intel core`, `ryzen`, `ddr5`, `rtx`, `ssd`, `cooler`, `creator`), bộ lọc fallback không kiểm tra xem sản phẩm đã thuộc danh mục khác chưa:
     - Slot `CPU`: lọt `87` sản phẩm Laptop / PC / Handheld Console (`Console-CN31 Ryzen Z1 Extreme`).
     - Slot `RAM`: lọt `31` Mainboard có `DDR5`/`DDR4` trong tên.
     - Slot `VGA`: lọt `35` PC lắp sẵn có `RTX` trong tên.
     - Slot `Storage`: lọt `33` Laptop có `SSD 1TB` trong tên.
     - Slot `Cooler`: lọt `6` PSU thương hiệu `Cooler Master` (do từ khóa `'cooler'`).
     - Tab `PC lắp sẵn`: lọt `Laptop MSI Creator Z16` (do từ khóa `'creator'`).
   - Nhánh `default: return true` cho phép lọt bất kỳ sản phẩm nào nếu gặp key ngoài danh sách.
3. **Kết luận tương thích sai khi thiếu dữ liệu (`Tương thích tốt` giả):**
   - `getProductCompatibility` chỉ trả `{ compatible: true }` bất cứ khi nào không thấy lỗi Socket CPU/Mainboard hoặc RAM, dẫn đến hiển thị `"Tương thích tốt"` ngay cả khi **chưa có linh kiện đối chiếu** hoặc **thiếu dữ liệu specs** (kích thước VGA/Case, chiều cao tản nhiệt/Case, công suất PSU/VGA, form factor).

---

## 2. Solution & Files Created / Modified

| Status   | File Path                                                                                                                   | Summary                                                                                                                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Created  | [pcBuilderCompatibility.ts](file:///D:/Nexora/apps/web/src/lib/pcBuilderCompatibility.ts)                                   | Bộ phân loại thành phần phần cứng chuẩn xác (`cpu`, `mainboard`, `ram`, `vga`, `storage`, `psu`, `case`, `cooler`, `case-fan`, `monitor`, `mouse`, `keyboard`, `chair`, `pc`, `laptop`, `console`, ...) & động cơ tương thích 3 trạng thái (`COMPATIBLE`, `INCOMPATIBLE`, `UNKNOWN`) |
| Modified | [PcBuilderPage.tsx](file:///D:/Nexora/apps/web/src/features/pcBuilder/PcBuilderPage.tsx)                                    | Thay lọc modal & prebuilt PC sang phân loại chặt chẽ, thêm guard ở `handleSelectProduct`, hiển thị 3 trạng thái `COMPATIBLE` / `INCOMPATIBLE` / `UNKNOWN`, cho phép đổi linh kiện có cảnh báo xung đột mà không âm thầm xóa linh kiện khác                                           |
| Modified | [pc-builder.css](file:///D:/Nexora/apps/web/public/assets/css/pc-builder.css)                                               | Bổ sung style `.pc-builder-blocker-badge` (đỏ) và `.pc-builder-unknown-badge` (xám trung tính)                                                                                                                                                                                       |
| Created  | [def_rt_02_pc_builder_compatibility.test.tsx](file:///D:/Nexora/apps/web/tests/def_rt_02_pc_builder_compatibility.test.tsx) | Bộ regression tests bao phủ đủ 15 kịch bản phân loại, từ khóa gây nhầm lẫn, 3 trạng thái tương thích, kiểm tra socket/RAM/kích thước/PSU và tương tác UI `PcBuilderPage`                                                                                                             |

### Quy tắc phân loại & 3 trạng thái tương thích đã triển khai

- **Tầng phân loại (`classifyProductComponentType`):**
  1. Danh mục chuẩn xác (map chính xác slug không gồm nhóm gộp, không dùng `.includes()`). Phân tách riêng `case-fan` khỏi `case` và `cooler` CPU.
  2. Structured specs (cho danh mục gộp như `main-cpu-vga`, `case-nguon-tan` hoặc sản phẩm thiếu category).
  3. So khớp từ khóa an toàn theo thứ tự (`console` -> `power-bank` -> `accessories` -> `office-equipment` -> `pc` -> `laptop` -> `monitor` -> `case-fan` -> `psu` -> `cooler` (loại trừ brand noise `"Cooler Master"`) -> `vga` -> `mainboard` -> `cpu` -> `storage` -> `ram` -> `case`), không đọc text trong specs tự do và không có `default: return true`.
- **Tầng tương thích 3 trạng thái (`COMPATIBLE` / `INCOMPATIBLE` / `UNKNOWN`):**
  - `CPU <-> Mainboard`: Socket (`LGA1700`, `AM5`, `AM4`, `LGA1200`, `LGA1151`, ...).
  - `Mainboard <-> RAM` & `CPU <-> RAM`: Chuẩn DDR (`DDR4`, `DDR5`, `DDR3`) & `supported_memory`.
  - `VGA <-> Case`: Chiều dài VGA (`length_mm`) <= `max_gpu_length_mm`.
  - `Mainboard <-> Case`: Form factor (`ATX`, `Micro-ATX`, `Mini-ITX`, `E-ATX`) trong `motherboard_support`.
  - `Cooler <-> CPU`: Socket hỗ trợ của tản nhiệt (kể cả chuỗi `"LGA1700/1200/115x & AM5/AM4"`) khớp Socket CPU.
  - `Cooler <-> Case`: Chiều cao tản nhiệt khí (`height_mm` <= `max_cpu_cooler_height_mm`) hoặc kích thước radiator AIO (`radiator_support`).
  - `PSU <-> Case` & `PSU <-> Tải hệ thống/VGA`: Chiều dài PSU (`length_mm` <= `max_psu_length_mm`) và công suất PSU (`wattage` >= `required_psu_w` từ dữ liệu thực).
  - Thiếu dữ liệu hoặc chưa có linh kiện ghép cặp -> trả `UNKNOWN` (không gán `COMPATIBLE` giả, không loại bỏ sản phẩm khỏi danh sách).

---

## 3. Quality Gates & Verification Results

| Gate / Check                                                                                                     | Exit Code | Result                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx prettier --check` (4 files thuộc DEF-RT-02)                                                                 | `0`       | **PASS** (`All matched files use Prettier code style!`)                                                                                                                                         |
| `npm run typecheck` (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`)                           | `0`       | **PASS**                                                                                                                                                                                        |
| `npm run lint`                                                                                                   | `0`       | **PASS** (`0` errors, `0` warnings)                                                                                                                                                             |
| `npm run test:unit`                                                                                              | `0`       | **PASS** — **`16/16` files, `163/163` tests** (`def_rt_02`: `5/5`, `0` fail, `0` skip)                                                                                                          |
| `npm run build`                                                                                                  | `0`       | **PASS** (`vite build` `702ms`, `290` modules)                                                                                                                                                  |
| Kiểm chứng phân loại trên toàn bộ `674` sản phẩm active thật (MySQL read-only qua `verify_def_rt_02_live_db.ts`) | `0`       | **PASS** — `12` slots + `Prebuilt[pc]`: `wrongCategory=0`, `Unclassified=0`                                                                                                                     |
| Playwright E2E trên stack cô lập (`127.0.0.1:5174` -> `:3001` -> `3307/nexora_test`)                             | `0`       | **PASS** — **`9/9` passed (`17.5s`)**, `0` fail, `0` skipped                                                                                                                                    |
| Browser Verification (`wave3_browser_qa_def_rt_02.mjs` trên DB seed nhóm gộp `main-cpu-vga` & `case-nguon-tan`)  | `0`       | **PASS** — CPU không lộ VGA (`cpuLeaksVga: false`), Case không lộ AIO (`caseLeaksAio: false`), Cooler nhận LT720 không lọt PSU Corsair, Prebuilt không lọt Laptop, `0` console/page/HTTP errors |

- **Lý do chọn phạm vi test:** DEF-RT-02 chỉ sửa logic phân loại/tương thích tại frontend web (`apps/web`), không chỉnh backend/schema; do đó chạy đủ `typecheck`, `lint`, `test:unit` (gồm cả `def_rt_02`), `build`, đối chiếu read-only 674 SP trong DB, Playwright E2E toàn storefront (`9/9`) và browser verification trên `/pc-builder` (không cần chạy lại toàn bộ 18 backend API integration suites vì backend chưa đổi ở task này).
- **Evidence screenshots:** `def_rt_02_cpu_modal.png`, `def_rt_02_case_modal.png`, `def_rt_02_summary.png` (trong workspace artifact `wave3_evidence/`).
