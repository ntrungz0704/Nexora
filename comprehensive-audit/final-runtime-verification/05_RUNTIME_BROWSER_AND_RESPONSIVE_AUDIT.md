# 05. RUNTIME, BROWSER & RESPONSIVE AUDIT REPORT

Quá trình kiểm toán trình duyệt thực tế bằng Chromium / Playwright được thực hiện an toàn trên hai môi trường tách biệt:
1. **Live Read-Only Browser Audit (`http://localhost:5173` -> `:3000` -> Dev DB `nexora`):** Kiểm tra `14` route Storefront/AdminGate, `31` ma trận Responsive (`25` Customer + `6` Admin), quét `674` sản phẩm ảnh fallback (`06_def_rt01_catalog_674_scan.json`), `13` Admin tabs sạch dữ liệu thật (`04_admin13_clean_populated.json`).
2. **Isolated Transactional Browser & API Audit (`http://127.0.0.1:5174` -> `:3001` -> `3307/nexora_test`):** Thực thi đầy đủ thao tác ghi D3–D12, kiểm tra `STAFF` Admin UI và `12` slot PC Builder (`05_isolated_interactive_rbac_crud.json` & `05_isolated_followup_staff_pcbuilder_ai.json`).

---

## 1. Live Desktop Route Checks (`04_live_browser_security_admin_audit.json`)

| Route | Label | Load (ms) | Text Len | Total Img | Broken Img (`natWidth=0`) | Overflow px | `<h1>` Count | Header/Main/Footer | Active Tag (`Tab`) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: | --- |
| `/` | Home | `1,157` | `18,229` | `219` | `62` *(lazy offscreen)* | `-15` | **`0`** | `true / true / true` | `A` |
| `/search` | Search | `958` | `4,334` | `27` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/product/detail/macbook-pro-16-m3-max` | ProductDetailReal | `897` | `2,938` | `11` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/product/detail/laptop-msi-creator-z16-hx-studio-b13vfto-211vn` | ProductDetailFallback | `875` | `2,663` | `11` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/pc-builder` | PcBuilder | `900` | `2,852` | `3` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/compare` | Compare | `906` | `2,159` | `3` | `0` | `-15` | **`0`** | `true / true / true` | `A` |
| `/ai-assistant` | AiAssistant | `888` | `2,065` | `3` | `0` | `-15` | **`0`** | `true / true / true` | `A` |
| `/order-tracking` | OrderTracking | `838` | `1,810` | `3` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/stores` | Stores | `866` | `3,170` | `3` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/post` | TechNews | `918` | `4,440` | `14` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/cart` | Cart | `853` | `1,797` | `3` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/login` | Login | `845` | `1,928` | `3` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/register` | Register | `858` | `1,899` | `3` | `0` | `-15` | `1` | `true / true / true` | `A` |
| `/admin` | AdminGate (Unauth) | `847` | `111` | `1` | `0` | `-15` | **`0`** | `false / false / false` | `INPUT` |

> **Ghi chú kỹ thuật A11y (`DEF-RT-12`):** Trên `ProductCard.tsx:195-211`, nút Yêu thích dùng thuộc tính `title` (không có `aria-label` riêng). Do đó kiểm tra `unnamedBtns` theo HTML accessible name trả `0`, trong khi kiểm tra strict không tính `title` (`phase_de_browser_audit.json`) ghi nhận `124` button trên Home, `24` trên Search, `4` trên ProductDetail thiếu `aria-label` & `1` input thiếu label (newsletter footer). **Kiểm định WCAG 2.2 AA đầy đủ: `NOT VERIFIED`.**

---

## 2. Responsive Matrix Results (`31` Viewport Checks)

### A. Customer Viewports (`25` Checks across `5` Viewports x `5` Routes)

| Viewport | `/` | `/search` | `/product/detail/macbook-pro-16-m3-max` | `/cart` | `/pc-builder` | Kết quả |
| --- | :---: | :---: | :---: | :---: | :---: | --- |
| **Mobile `375x812`** | `360<=375` (OK) | `360<=375` (OK) | `360<=375` (OK) | `360<=375` (OK) | `360<=375` (OK) | `5/5 PASS` (`screenshots/final49_mobile_home_375.png`) |
| **Mobile Large `430x932`** | `415<=430` (OK) | `415<=430` (OK) | `415<=430` (OK) | `415<=430` (OK) | `415<=430` (OK) | `5/5 PASS` |
| **Tablet `768x1024`** | `753<=768` (OK) | `753<=768` (OK) | **`920 > 768` (+152px OVERFLOW)** | `753<=768` (OK) | `753<=768` (OK) | `4/5 PASS`, **`DEF-RT-07`** (`screenshots/final49_def07_tablet_product_overflow.png`) |
| **Laptop `1366x768`** | `1351<=1366` (OK) | `1351<=1366` (OK) | `1351<=1366` (OK) | `1351<=1366` (OK) | `1351<=1366` (OK) | `5/5 PASS` |
| **Desktop `1440x900`** | `1425<=1440` (OK) | `1425<=1440` (OK) | `1425<=1440` (OK) | `1425<=1440` (OK) | `1425<=1440` (OK) | `5/5 PASS` |

- **Các phần tử tràn ở Tablet `768x1024` (`04_live_browser_security_admin_audit.json:477-518`):** `ProductDetailPage.tsx:551` (`gridTemplateColumns: '460px minmax(0, 1fr)'`) đẩy giá `94.990.000đ` (`right: 876`), chữ `(Đã bao gồm VAT 10%)` (`right: 920`), `Còn hàng (10 sản phẩm)` (`right: 775`), thông số `Card đồ họa (VGA): Apple 30-core GPU` (`right: 808`) và nút mua ra ngoài mép `768px`.

### B. Admin Viewports (`6` Checks + `13` Admin Tabs Populated Check)

- **Tablet `768x1024` (`/admin`, `/admin/products`, `/admin/brands`) & Laptop `1366x768`:** `6/6` `scrollWidth <= clientWidth` (`docOverflow: false`). *(Tuy nhiên trong lần quét liền sau storefront sweep khi chạm `429`, `AdminDashboardPage` nuốt lỗi hiển thị `0đ` — `DEF-RT-15`, ảnh `final49_admin_tablet_768.png`).*
- **Clean Populated 13 Admin Tabs (`04_admin13_clean_populated.json`, API mới khởi động lại, `0` ConsoleErr, `0` HttpErr, `0` BrokenImgs):**

| # | Tab ID | Route | Rows | `docOverflow` | Table Scroll / Client (px) | `tableClipped` | Ghi chú |
| :---: | --- | --- | ---: | :---: | --- | :---: | --- |
| 1 | `dashboard` | `/admin` | `2` | `false` | `609 / 609` | `false` | OK |
| 2 | `products` | `/admin/products` | `10` | `false` | `1065 / 1065` | `false` | OK |
| 3 | `orders` | `/admin/orders` | `2` | `false` | **`1112 / 1065`** | **`true`** | Cắt ngang nội bộ bảng (`DEF-RT-08`) |
| 4 | `users` | `/admin/users` | `3` | `false` | `1065 / 1065` | `false` | OK |
| 5 | `categories` | `/admin/categories` | `10` | `false` | `1065 / 1065` | `false` | OK |
| 6 | `brands` | `/admin/brands` | `10` | `false` | **`1136 / 1065`** | **`true`** | `actionThRight: 1441 > wrapRight: 1370` (`DEF-RT-08`) |
| 7 | `coupons` | `/admin/coupons` | `5` | `false` | **`1112 / 1065`** | **`true`** | Cắt ngang nội bộ bảng (`DEF-RT-08`) |
| 8 | `flash-sales` | `/admin/flash-sales` | `1` | `false` | `1065 / 1065` | `false` | OK |
| 9 | `posts` | `/admin/posts` | `8` | `false` | `1065 / 1065` | `false` | OK |
| 10 | `reviews` | `/admin/reviews` | `1` | `false` | `1065 / 1065` | `false` | OK |
| 11 | `banners` | `/admin/banners` | `9` | `false` | `1063 / 1063` | `false` | OK |
| 12 | `inventory` | `/admin/inventory` | `1` | `false` | `1065 / 1065` | `false` | Không có trong `navMenuItems` sidebar |
| 13 | `settings` | `/admin/settings` | `0` | `false` | `0 / 0` | `false` | OK *(Không có tab Returns — `DEF-RT-05`)* |

---

## 3. Functional Flow Verification (Isolated `:5174 / :3001 -> 3307/nexora_test`)

| Luồng nghiệp vụ | Kết quả thực tế quan sát | Bằng chứng |
| --- | --- | --- |
| **Catalog & Image Scan (`674` SP)** | `22` SP dùng ảnh riêng thật, `652` SP dùng fallback `productImage.ts`: **`175` SP không phải máy in** (23 màn hình, 31 tản nhiệt, 47 PC/gaming, 31 loa/mic, 43 khác) bị gán `printer-canon.jpg`, **`31` handheld console Ryzen** bị gán `cpu_ryzen7.jpg` (`DEF-RT-01`). | `06_def_rt01_catalog_674_scan.json` |
| **PC Builder (12 Slots)** | `totalSlots: 12`, **`escClosesModal: false` (`DEF-RT-17`)**. **Slot 0 (CPU)** hiện `RTX 4070 Ti SUPER` (từ `main-cpu-vga`); **Slot 6 (Case)** hiện `DeepCool LT720` (từ `case-nguon-tan`); Slots `1` (`Mainboard`) & `2` (`RAM`) `countShown: 0` trên seed 23 SP (`DEF-RT-02`). | `05_isolated_followup_staff_pcbuilder_ai.json` |
| **Cart Merge (`D4`)** | Overstock bị chặn **`400 INSUFFICIENT_STOCK`**; login tự merge guest cart thành đúng 1 dòng (`mergedPresent: true`, `duplicateRows: 1`). | `05_isolated_interactive_rbac_crud.json:25-31` |
| **Auth, Google Mock, Cross-Tab (`D5`)** | Nút Google ở `/register` bắn `POST /auth/login` (`customer@nexora.vn`) -> `401` + unhandled error (`DEF-RT-03`); ở `/login` báo SSO nâng cấp (`0` lỗi). `forgot-password` email tồn tại trả `500 EMAIL_DELIVERY_FAILED` (`DEF-RT-04`), không tồn tại `200`. Cross-tab logout (`tabBSawUser1: true -> tabBClearedUser1: true`), đổi tài khoản sạch cache (`accountSwitchClean: true`). | `05_isolated_interactive_rbac_crud.json:32-74` |
| **Profile & Addresses (`D6`)** | Cập nhật tên UI, tạo/hiển thị/sửa (`200`)/xóa (`200`) địa chỉ, mở tab Thông báo đều PASS. | `05_isolated_interactive_rbac_crud.json:75-81` |
| **Reviews & Returns (`D7–D8`)** | Non-purchaser bị chặn `403`, UI review PASS, duplicate `201` (upsert theo `userId_productId`), `PUT` sửa `200`, Admin ẩn `200`, xóa `200`. Returns chặn `delivered_at: null` (`400 ORDER_MISSING_DELIVERED_DATE`), chặn vượt SL (`400 RETURN_QUANTITY_EXCEEDED`), tạo `201`, sinh `2` audit log, Admin API duyệt `200`. | `05_isolated_interactive_rbac_crud.json:82-98` |
| **Checkout & VNPay Sandbox (`D9–D10`)** | COD order `201` (`NX-183759-3861`) giảm tồn kho `28 -> 26`. VNPay Sandbox URL `200` (`sandbox.vnpayment.vn`, `NEXORATM`, `vnp_SecureHash`), tampered hash bị từ chối `isSuccess: false`, simulate `200`. VNPay Prod: `NOT TESTED`. | `05_isolated_interactive_rbac_crud.json:99-119` |
| **AI Fallback & Rate Limit (`D12`)** | Survey 5 bước log DB (`surveyLogDelta: 1`), Chatbot API `200` (`PRODUCT_RECOMMENDATION`), Gemini Cloud `NOT VERIFIED`. `passwordResetRequest` burst trả `[200, 200, 200, 429, 429, 429]`. | `05_isolated_interactive_rbac_crud.json:133-148`, `05_isolated_followup_staff_pcbuilder_ai.json:123-128` |
| **Console & Network Errors Summary** | **0** JS errors trên Storefront routes tĩnh & 13 Admin tabs khi không chạm rate limit; **`1`** unhandled rejection tại nút Google `/register`; **`89`** browser `429` errors ghi nhận khi chạy liên tục >30 pages trong Phase 4 trước lúc restart API. | `04_live_browser_security_admin_audit.json:954-1315`, `04_admin13_clean_populated.json:177-178` |
