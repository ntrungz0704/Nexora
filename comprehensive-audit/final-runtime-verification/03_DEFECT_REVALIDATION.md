# 03. DEFECT REVALIDATION & NEW DISCOVERIES (DEF-RT-01 TO DEF-RT-17)

Toàn bộ `13` defect từ báo cáo gần nhất (`DEF-RT-01`..`DEF-RT-13`) đã được tái kiểm chứng độc lập trên runtime thực tế, kèm **`4` defect mới phát hiện (`DEF-RT-14`..`DEF-RT-17`)**. **Tuyệt đối không có defect nào bị tự ý sửa hoặc ẩn giấu.** Tất cả giữ trạng thái **`Approval required: YES`**.

---

## Bảng tổng hợp nhanh (17 Defects)

| ID | Severity | Trạng thái tái kiểm tra | Tóm tắt ngắn & Phạm vi cập nhật | Approval Required |
| --- | --- | --- | --- | :---: |
| **DEF-RT-01** | `P1 — High` | **`REPRODUCED`** | `175/674` SP không phải máy in (23 màn hình, 31 tản, 47 PC/gaming, 31 loa/mic, 43 khác) gán `printer-canon.jpg`; `31` handheld Ryzen gán `cpu_ryzen7.jpg`. | `YES` |
| **DEF-RT-02** | `P1 — High` | **`REPRODUCED` *(Mở rộng phạm vi)*** | Ngoài handheld console Ryzen trên DB 674 SP, tại DB 23 SP `catSlug.includes` lọt **VGA vào Slot 0 (CPU)** & **tản AIO vào Slot 6 (Case)**; `default: return true`; `Esc` không đóng modal. | `YES` |
| **DEF-RT-03** | `P1 — High` | **`REPRODUCED`** | Nút Google trên `/register` gọi `customer@nexora.vn` -> `401` + unhandled rejection; Google OAuth chỉ là `UI ONLY / MOCKED`. | `YES` |
| **DEF-RT-04** | `P2 — Medium` | **`REPRODUCED`** | `POST /auth/forgot-password` email tồn tại trả `500 EMAIL_DELIVERY_FAILED` khi thiếu SMTP/Resend; email không tồn tại trả `200` an toàn. | `YES` |
| **DEF-RT-05** | `P2 — Medium` | **`REPRODUCED`** | Backend mở 3 API `/admin/returns*`, Admin UI `/admin` thiếu tab Returns; Dev DB `NX-2026-0001` có `delivered_at: null` (đã đối chiếu migration sanitize). | `YES` |
| **DEF-RT-06** | `P2 — Medium` | **`REPRODUCED`** | `CategorySidebar.tsx:317` bỏ qua prop `categories` từ API, render cứng `16` mục tĩnh thay vì `22` danh mục thật. | `YES` |
| **DEF-RT-07** | `P2 — Medium` | **`REPRODUCED`** | Viewport Tablet `768x1024` tại `/product/detail/macbook-pro-16-m3-max`: tràn ngang `920px > 768px` (`+152px`), cắt giá `94.990.000đ` & CTA. | `YES` |
| **DEF-RT-08** | `P3 — Low` | **`REPRODUCED` *(Mở rộng phạm vi)*** | Bảng `/admin/brands` (`1136 > 1065`, header `HÀNH ĐỘNG` tới `1441 > wrapRight 1370`), **cộng thêm `/admin/orders` & `/admin/coupons` (`1112 > 1065`)** bị tràn card ở `1440x900`. | `YES` |
| **DEF-RT-09** | `P3 — Low` | **`REPRODUCED`** | Topbar `300K` vs `500k`; `ServicePolicyBar` hotline `1900 1234` vs `1800 2097`; AI Step 1 raw keys `under_10m`..`over_35m`; DB có `20` SKU `PC TechPilot...` / `PC-TP-...`. | `YES` |
| **DEF-RT-10** | `P3 — Low` | **`REPRODUCED`** | Promo overlay `zIndex: 99999` đè Chatbot drawer; `#tpChatbotLauncher` đè toast & timeout Playwright click stability (`2500ms`). | `YES` |
| **DEF-RT-11** | `P3 — Low` | **`REPRODUCED` *(Cập nhật số liệu)*** | `npm run format:check` thoát mã `1`: tăng từ `63` lên **`71` files** (gồm 4 TS/TSX source, 1 seed, 58 `.md` cũ + 8 file trong `runtime-launch/`). | `YES` |
| **DEF-RT-12** | `P3 — Low` | **`REPRODUCED`** | Thiếu `<h1>` trên Home/Compare/AI/AdminGate; nút quick-action chỉ dùng `title` không `aria-label`; AdminGate/ForgotPassword thiếu landmark; WCAG: `NOT VERIFIED`. | `YES` |
| **DEF-RT-13** | `P4 — Info` | **`REPRODUCED`** | Bundle JS `1,186.36 kB` (>500 kB warning); `globalApi: 300/15m` kích `429` khi tool quét >30 trang; `62` ảnh carousel `/` giữ lazy offscreen. | `YES` |
| **DEF-RT-14** | `P2 — Medium` | **`OPEN` *(MỚI)*** | **Admin CRUD thiếu Zod validation đầu vào** (`POST /admin/products` payload sai `{name:'', price:-50}` trả **`HTTP 500`** thay vì `400`). | `YES` |
| **DEF-RT-15** | `P2 — Medium` | **`OPEN` *(MỚI)*** | **Admin Dashboard nuốt lỗi HTTP `429`/`500`** (`AdminDashboardPage.tsx:339-343`) và hiển thị sai lệch `0đ` / bảng trống không báo lỗi. | `YES` |
| **DEF-RT-16** | `P3 — Low` | **`OPEN` *(MỚI)*** | **`GET /api/v1/cart` chèn dòng DB rỗng mỗi guest session mới** (`getOrCreateCart` trong `cart.service.ts`), gây tăng `carts: 20 -> 28 -> 29` khi chỉ duyệt web. | `YES` |
| **DEF-RT-17** | `P3 — Low` | **`OPEN` *(MỚI)*** | `.pc-modal` PC Builder không đóng bằng `Esc`; `STAFF` thấy cả nav admin-only (`Khách hàng`/`Cài đặt`); Playwright `Journey 3` (`storefront_journeys.spec.ts:34`) match sai input email footer. | `YES` |

---

## Chi tiết 17 Defects (Chuẩn 14 trường bắt buộc)

### DEF-RT-01
1. **ID:** `DEF-RT-01`
2. **Severity:** `P1 — High`
3. **Title:** Product image fallback matching ánh xạ sai ảnh phần cứng hàng loạt
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/lib/productImage.ts:169-240`, routes `/`, `/search`, `/product/detail/:slug`
6. **Environment:** Live Website `http://localhost:5173` kết nối Dev DB `3306/nexora` (`674` sản phẩm)
7. **Steps to Reproduce:** Duyệt danh mục hoặc kiểm tra 674 sản phẩm qua hàm `getProductImage()`, quan sát sản phẩm Màn hình (`"inch"`), Tản nhiệt (`"Cooling"`), PC Gaming (`"Gaming"`), Loa/Mic (`"vi tính"`), và Handheld Console có `"Ryzen"`.
8. **Expected Result:** Ảnh đại diện khớp với loại phần cứng (màn hình -> ảnh màn hình, console -> ảnh console).
9. **Actual Result:** Trên `674` sản phẩm (`652` dùng nhánh fallback `getProductImage`), điều kiện `searchStr.includes('in')` tại dòng `170` khớp sai **`175` sản phẩm không phải máy in** (`monitor: 23`, `cooler: 31`, `pcOrGaming: 47`, `speakerOrMic: 31`, `other: 43`) sang `/assets/images/review/unlinked/printer-canon.jpg` (trong khi chỉ có `31` máy in thật). Ngoài ra dòng `235` (`includes('ryzen')`) gán **`31` handheld console** (`ASUS/MSI/Lenovo Console Ryzen Z1 Extreme`) sang `/assets/images/review/unlinked/cpu_ryzen7.jpg`. Dòng `229` (`màn hình`) trở thành dead-code cho mọi màn hình có từ `"inch"` hoặc `"gaming"`.
10. **Evidence:** `apps/web/src/lib/productImage.ts:169-240`; `evidence/06_def_rt01_catalog_674_scan.json`.
11. **User/business impact:** Sai lệch hình ảnh trưng bày trên 200+ sản phẩm trang chủ và trang tìm kiếm, giảm nghiêm trọng độ tin cậy mua sắm.
12. **Root Cause:** So khớp chuỗi con `'in'` quá ngắn (trùng `'inch'`, `'cooling'`, `'gaming'`, `'vi tính'`, `'kính'`, ...) và kiểm tra từ khóa tên SP trước `p.category?.slug`.
13. **Recommended Fix:** Ưu tiên map theo `p.category?.slug` trước khi fallback text; bỏ `includes('in')` thay bằng regex `\bmay in\b|\bprinter\b`; loại trừ `console`/`laptop` khỏi nhánh `cpu`.
14. **Approval required:** `YES`

### DEF-RT-02
1. **ID:** `DEF-RT-02`
2. **Severity:** `P1 — High`
3. **Title:** PC Builder cho phép chọn sai loại sản phẩm vào slot CPU và slot Case
4. **Status:** `REPRODUCED` *(Mở rộng phạm vi từ CPU sang cả Case & Grouped Category)*
5. **Affected file/route/API:** `apps/web/src/features/pcBuilder/PcBuilderPage.tsx:428-487`, route `/pc-builder`
6. **Environment:** Live (`674` SP) và Isolated `:5174` (`23` SP seed)
7. **Steps to Reproduce:** Mở `/pc-builder`, nhấn `+ Chọn mua` ở `Slot 0 — Bộ vi xử lý (CPU)` và `Slot 6 — Vỏ máy tính (Case)`.
8. **Expected Result:** Slot CPU chỉ hiển thị CPU rời; Slot Case chỉ hiển thị Vỏ case.
9. **Actual Result:** Tại `PcBuilderPage.tsx:432`, `catSlug.includes(s)` khớp danh mục gộp `'main-cpu-vga'` và `'case-nguon-tan'`: trên isolated DB (`23` SP), **Slot 0 (CPU)** hiển thị `Card màn hình ASUS TUF Gaming GeForce RTX 4070 Ti SUPER 16GB`, **Slot 6 (Case)** hiển thị `Tản nhiệt nước AIO DeepCool LT720 360mm ARGB` (còn Slot 1 Mainboard & Slot 2 RAM `countShown: 0`). Trên Dev DB (`674` SP), nhánh `ryzen` ở dòng `442` kéo cả `Lenovo Console-CN31 Ryzen Z1 Extreme 1TB` vào Slot CPU; đồng thời dòng `486` có `default: return true`.
10. **Evidence:** `PcBuilderPage.tsx:432,442,486`; `evidence/05_isolated_followup_staff_pcbuilder_ai.json:25-80`.
11. **User/business impact:** Người dùng lắp nhầm Card màn hình hoặc Máy chơi game làm CPU, sai tính toán công suất PSU và kiểm tra tương thích socket/RAM.
12. **Root Cause:** So khớp `catSlug.includes(s)` thay vì khớp chính xác danh mục và kiểm tra từ khóa `'ryzen'`/`'case'` thiếu bộ lọc loại trừ thiết bị nguyên bộ.
13. **Recommended Fix:** Chuẩn hóa danh mục đơn lẻ và tách chính xác `catSlug === targetSlug` hoặc loại trừ `vga`/`console`/`laptop`/`tản nhiệt` khỏi bộ lọc CPU/Case; loại bỏ `default: return true`.
14. **Approval required:** `YES`

### DEF-RT-03
1. **ID:** `DEF-RT-03`
2. **Severity:** `P1 — High`
3. **Title:** Nút Google Login trên `/register` gọi API bằng email giả định gây 401 và Unhandled Promise Rejection
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/features/auth/RegisterPage.tsx:328-337`, so sánh với `LoginPage.tsx:149-155`; API `POST /api/v1/auth/login`
6. **Environment:** Isolated `:5174/:3001` & Live `:5173/:3000`
7. **Steps to Reproduce:** Truy cập `/register` (hoặc `/auth/register`) -> bấm nút `"Tiếp tục với Google"`.
8. **Expected Result:** Thực hiện Google OAuth hợp lệ (nếu cấu hình) hoặc hiển thị thông báo nâng cấp SSO an toàn giống `LoginPage` mà không lỗi JS/API.
9. **Actual Result:** Gửi `POST /api/v1/auth/login` với `{ email: 'customer@nexora.vn', password: 'password123' }`, server trả `HTTP 401`, browser ném Unhandled Promise Rejection `"Request failed with status code 401"`. Trên `LoginPage.tsx:152`, nút Google chỉ hiển thị text thông báo SSO đang nâng cấp (`0` lỗi). **Google OAuth thực tế là `UI ONLY / MOCKED`**.
10. **Evidence:** `RegisterPage.tsx:331-337`; `evidence/05_isolated_interactive_rbac_crud.json:33-59`.
11. **User/business impact:** Gây lỗi runtime JS không kiểm soát ngay khi khách nhấn đăng nhập/đăng ký nhanh bằng Google, đồng thời lộ mã mock `authService.login` trong client code.
12. **Root Cause:** Code thử nghiệm cũ còn sót trong handler `onClick` của `RegisterPage.tsx` không có `.catch()` và dùng email đuôi `.vn` sai với DB `.local`.
13. **Recommended Fix:** Gỡ lời gọi `authService.login` cứng ở `RegisterPage.tsx`, đồng bộ thông báo SSO đang nâng cấp với `LoginPage.tsx` hoặc ẩn khi chưa cấu hình `GOOGLE_CLIENT_ID`.
14. **Approval required:** `YES`

### DEF-RT-04
1. **ID:** `DEF-RT-04`
2. **Severity:** `P2 — Medium`
3. **Title:** Quên mật khẩu (`POST /auth/forgot-password`) trả HTTP 500 trên dev khi thiếu SMTP/Resend
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/api/src/modules/email/email.service.ts:60-79`, `POST /api/v1/auth/forgot-password`
6. **Environment:** `NODE_ENV=development`, `SMTP_HOST` và `RESEND_API_KEY` đều `MISSING` trong `.env`
7. **Steps to Reproduce:** Gọi `POST /api/v1/auth/forgot-password` với email hợp lệ đang tồn tại trong `nexora_test` (`customer@nexora.local`) và với email không tồn tại (`noone@nexora.local`).
8. **Expected Result:** Không trả 500 khi test trên dev (có cơ chế Console Mock preview transporter dev-only hoặc cảnh báo cấu hình rõ ràng), đồng thời giữ chống email enumeration.
9. **Actual Result:** Email không tồn tại trả **`200`** (`"Nếu email tồn tại trên hệ thống..."`), nhưng email tồn tại trả **`HTTP 500 EMAIL_DELIVERY_FAILED`** do `emailService.isConfigured()` trả `false` trong `development`. Lưu ý phản hồi khác nhau giữa `200` và `500` cũng tạo sự khác biệt observable giữa email tồn tại và không tồn tại nếu dev thiếu email provider.
10. **Evidence:** `email.service.ts:60-79`; `evidence/05_isolated_interactive_rbac_crud.json:60-67`.
11. **User/business impact:** Không thể thử nghiệm đầy đủ luồng khôi phục mật khẩu tại môi trường dev khi chưa gắn Mailpit/SMTP; lộ hành vi phân biệt `200` vs `500` khi email provider chưa cấu hình.
12. **Root Cause:** `isConfigured()` chỉ mở test bypass cho `NODE_ENV === 'test'`, chưa có dev preview transporter cho `NODE_ENV === 'development'`.
13. **Recommended Fix:** Thiết lập Mailpit/SMTP dev trong Docker Compose hoặc thêm dev-only preview log khi `NODE_ENV === 'development'` (giữ nguyên fail-closed `500` trong `production`).
14. **Approval required:** `YES`

### DEF-RT-05
1. **ID:** `DEF-RT-05`
2. **Severity:** `P2 — Medium`
3. **Title:** Thiếu giao diện quản lý Đổi/Trả hàng trong Admin Dashboard và trạng thái `delivered_at: null` của đơn mẫu `NX-2026-0001`
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/features/admin/AdminDashboardPage.tsx:7-20,1492-1504`; `apps/api/src/modules/admin/admin.routes.ts:82-85`; Dev DB `orders` (`NX-2026-0001`)
6. **Environment:** Live `/admin` (`13` tabs) & API `/api/v1/admin/returns*` & Dev DB `nexora`
7. **Steps to Reproduce:** Đăng nhập `/admin` tìm tab Đổi/Trả trong 13 `AdminTab`; đối chiếu API `admin.routes.ts:83-85`; đọc bảng `orders` tại Dev DB (`read-only`).
8. **Expected Result:** Nhân sự quản trị duyệt/từ chối yêu cầu đổi/trả trực tiếp trên giao diện `/admin`.
9. **Actual Result:** Backend mở đủ 3 endpoint `/admin/returns`, `/admin/returns/:id`, `/admin/returns/:id/status` (hoạt động `200` trên isolated test DB) và Customer có `/profile/return`, nhưng UI `/admin` chỉ có 13 tab và hoàn toàn chưa có màn hình Returns (cũng vắng mục `Kho hàng` trên sidebar). Đồng thời trên Dev DB, đơn `NX-2026-0001` (`DELIVERED`) có `delivered_at: null` (kết quả từ migration `20261122160000_sanitize_unverified_delivered_at`).
10. **Evidence:** `admin.routes.ts:82-85`; `AdminDashboardPage.tsx:7-20,1492-1504`; `evidence/04_admin13_clean_populated.json`; `evidence/07_dev_db_after.json:130-140`.
11. **User/business impact:** Vận hành viên không thể xử lý yêu cầu đổi/trả từ trình duyệt Admin.
12. **Root Cause:** UI quản trị viên cho module Returns (M6.4) chưa được bổ sung vào `AdminDashboardPage.tsx`.
13. **Recommended Fix:** Thêm tab `"Đổi / Trả hàng"` (`/admin/returns`) gọi 3 API `/admin/returns*` sẵn có sau khi Owner phê duyệt.
14. **Approval required:** `YES`

### DEF-RT-06
1. **ID:** `DEF-RT-06`
2. **Severity:** `P2 — Medium`
3. **Title:** CategorySidebar bỏ qua dữ liệu API (22 danh mục) và hiển thị 16 mục hardcode
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/features/storefront/CategorySidebar.tsx:311-320`, `GET /api/v1/catalog/categories`
6. **Environment:** Live Website `http://localhost:5173/`
7. **Steps to Reproduce:** Mở `/` đếm các mục ở cột Danh mục bên trái Hero Banner và đối chiếu với API `/api/v1/catalog/categories`.
8. **Expected Result:** Sidebar hiển thị đồng bộ theo danh sách danh mục đang hoạt động từ API/DB.
9. **Actual Result:** Interface `CategorySidebarProps` dòng `312` có khai báo `categories?: CategoryDto[]`, nhưng dòng `317` không destructure `categories` và dòng `320` dùng mảng tĩnh `STATIC_MENU_TREE`, chỉ render cố định **`16`** mục cũ thay vì **`22`** danh mục từ API.
10. **Evidence:** `CategorySidebar.tsx:311-320`; `evidence/04_live_browser_security_admin_audit.json:451-472`.
11. **User/business impact:** Mọi thay đổi bật/tắt/thêm/đổi tên danh mục trong `/admin/categories` không phản ánh lên menu danh mục chính trên Trang chủ.
12. **Root Cause:** Prop `categories` được định nghĩa nhưng chưa nối vào logic render của component.
13. **Recommended Fix:** Sử dụng prop `categories` (có ánh xạ icon/submenu fallback theo `slug`), xử lý trạng thái loading/empty nếu API trả rỗng.
14. **Approval required:** `YES`

### DEF-RT-07
1. **ID:** `DEF-RT-07`
2. **Severity:** `P2 — Medium`
3. **Title:** Trang Chi tiết sản phẩm tràn ngang trên Tablet (768x1024), cắt giá và nút Mua ngay
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/features/catalog/ProductDetailPage.tsx:551`, route `/product/detail/macbook-pro-16-m3-max`
6. **Environment:** Viewport Tablet `768 x 1024` trên `http://localhost:5173`
7. **Steps to Reproduce:** Mở `/product/detail/macbook-pro-16-m3-max` ở viewport `768 x 1024`.
8. **Expected Result:** Grid co về 1 cột ở `< 1024px`, `scrollWidth <= 768px`, đầy đủ giá và nút mua.
9. **Actual Result:** Inline style `gridTemplateColumns: '460px minmax(0, 1fr)'` (gap `40px`) ép bề rộng trang tràn tới **`scrollWidth: 920px`** trên viewport `clientWidth: 768px` (dư **`152px`**). Giá `94.990.000đ` (`right: 876`), chữ `(Đã bao gồm VAT 10%)` (`right: 920`), `Còn hàng` (`right: 775`) và thông số VGA (`right: 808`) bị cắt bên phải khung hình.
10. **Evidence:** `ProductDetailPage.tsx:551`; `evidence/04_live_browser_security_admin_audit.json:316-321,473-519`; `evidence/screenshots/final49_def07_tablet_product_overflow.png`.
11. **User/business impact:** Người dùng Tablet không nhìn thấy đầy đủ giá tiền, tình trạng hàng và thao tác mua hàng nếu không cuộn ngang.
12. **Root Cause:** Cố định chiều rộng cột ảnh `460px` bằng inline CSS thiếu `@media` breakpoint.
13. **Recommended Fix:** Đưa layout grid vào file CSS/Tailwind responsive (`grid-cols-1 lg:grid-cols-[460px_minmax(0,1fr)]`).
14. **Approval required:** `YES`

### DEF-RT-08
1. **ID:** `DEF-RT-08`
2. **Severity:** `P3 — Low`
3. **Title:** Cột Action & bảng quản trị bị tràn ngang bên trong card bao ngoài (Brands, Orders, Coupons)
4. **Status:** `REPRODUCED` *(Mở rộng sang cả `/admin/orders` & `/admin/coupons`)*
5. **Affected file/route/API:** `apps/web/src/features/admin/AdminDashboardPage.tsx`, routes `/admin/brands`, `/admin/orders`, `/admin/coupons`
6. **Environment:** Desktop `1440 x 900` tại `/admin/*` khi có dữ liệu thật (`10` brands/page, `2` orders, `5` coupons)
7. **Steps to Reproduce:** Đăng nhập `/admin` trên `1440 x 900`, lần lượt mở tab `Thương hiệu`, `Đơn hàng`, `Mã giảm giá`.
8. **Expected Result:** Bảng nằm gọn trong card wrapper (`tableScrollWidth <= tableClientWidth`), thấy rõ cột `HÀNH ĐỘNG` mà không phải cuộn ngang nội bộ.
9. **Actual Result:** Mặc dù document không tràn, bảng nằm bên trong wrapper (`clientWidth: 1065`, `wrapRight: 1370`) bị tràn ngang nội bộ tại **`/admin/brands`** (`tableScrollWidth: 1136 > 1065`, mép `actionThRight: 1441 > 1370`), **`/admin/orders`** (`1112 > 1065`), và **`/admin/coupons`** (`1112 > 1065`). *(Lưu ý: `firstBtnRight: 1314` có thể thụt vào trong `1370` do scroll/spacing cột tùy dữ liệu ngắn dài nhưng cột tiêu đề `HÀNH ĐỘNG` và tổng bề rộng bảng vẫn bị clip vượt mép card `1370`).*
10. **Evidence:** `evidence/04_admin13_clean_populated.json:30-40,66-88,162-176`; `evidence/screenshots/final49_def08_admin_brands_populated.png`, `final49_def08_admin_brands_1440.png`.
11. **User/business impact:** Quản trị viên phải cuộn ngang bên trong bảng mới thấy hết cột phải ở màn hình `1440px`.
12. **Root Cause:** Bảng có quá nhiều cột padding/min-width rộng hơn khung nội dung ~`1065px` ở `1440px`.
13. **Recommended Fix:** Giảm padding ngang ô, giới hạn độ rộng `MÔ TẢ`/`SLUG` bằng ellipsis để 100% bảng vừa trong `1065px`.
14. **Approval required:** `YES`

### DEF-RT-09
1. **ID:** `DEF-RT-09`
2. **Severity:** `P3 — Low`
3. **Title:** Sai lệch nội dung freeship (300K vs 500k), hotline (1900 1234 vs 1800 2097), raw key AI (`under_10m`) và SKU/tên `PC TechPilot`
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `StorefrontHeader.tsx:190,205,226`, `ServicePolicyBar.tsx:16,64`, `AiAssistantPage.tsx:23-28`, bảng `products` Dev DB
6. **Environment:** Trang chủ `/`, `/ai-assistant`, và catalog `products`
7. **Steps to Reproduce:** Đọc Topbar, dải dịch vụ dưới trang chủ, Step 1 của `/ai-assistant`, và truy vấn bảng `products` tìm `TechPilot`/`PC-TP`.
8. **Expected Result:** Chỉ một ngưỡng miễn phí ship, một số hotline chuẩn, nhãn tiếng Việt tự nhiên và thương hiệu `Nexora` thống nhất.
9. **Actual Result:** (a) Topbar ghi `"Miễn phí cho đơn từ 300K"` trong khi `ServicePolicyBar` ghi `"Đơn hàng từ 500k"` (chính sách `order.service.ts`/`ai.service.ts:53` dùng `500.000đ`); (b) `ServicePolicyBar.tsx:64` ghi `"Hotline: 1900 1234"` trong khi `StorefrontHeader.tsx:226` & `store_settings` (`store.hotline`) là **`"1800 2097"`**; (c) `AiAssistantPage.tsx:23-28` hiển thị raw key `"Phân khúc under_10m"`..`"over_35m"`; (d) DB còn `2` sản phẩm mang tên `"PC TechPilot..."` (`PC-TP-ULTRA-4090`, `PC-TP-CREATOR-4070S`) và `18` sản phẩm `PC-TP-P1..P18`.
10. **Evidence:** `StorefrontHeader.tsx:190,226`; `ServicePolicyBar.tsx:16,64`; `AiAssistantPage.tsx:23-28`; `evidence/04_live_browser_security_admin_audit.json:533-539`; `evidence/07_dev_db_after.json:239-380`.
11. **User/business impact:** Khách hàng dễ nhầm ngưỡng freeship và số tổng đài; Step 1 AI lộ mã kỹ thuật thô.
12. **Root Cause:** Text tĩnh copy từ bản mẫu cũ chưa gom về nguồn cấu hình chuẩn (`store_settings`); Project Owner cần xác nhận phương án đồng bộ dữ liệu sản phẩm `TechPilot`.
13. **Recommended Fix:** Đồng bộ text theo quyết định chốt của Project Owner (gắn `store.hotline`, thống nhất freeship, đổi `desc` bước 1 AI, xử lý SKU `PC-TP-*` nếu được duyệt cleanup).
14. **Approval required:** `YES`

### DEF-RT-10
1. **ID:** `DEF-RT-10`
2. **Severity:** `P3 — Low`
3. **Title:** Xung đột z-index Promo Popup / Chatbot / Toast và lỗi stability click trên nút launcher
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `PromoPopup` (`zIndex: 99999`), `FloatingChatbot.tsx` (`#tpChatbotLauncher`), Toast notifications
6. **Environment:** Homepage `/` trên trình duyệt Chrome/Playwright
7. **Steps to Reproduce:** Tải `/` khi Promo popup đang mở (`display: flex, zIndex: 99999`), click `#tpChatbotLauncher` hoặc kích hoạt Toast.
8. **Expected Result:** Thứ tự chồng lớp chuẩn (`Toast > Modal > Chatbot > Launcher`), nút launcher ổn định để bấm ngay bằng chuột hoặc tự động.
9. **Actual Result:** Promo overlay (`zIndex: 99999`) che mờ lên khung chatbot vừa mở (`final49_def10_popup_chatbot.png`), và click trực tiếp `#tpChatbotLauncher` gặp lỗi stability timeout `locator.click: Timeout 2500ms exceeded` do hiệu ứng animation liên tục; launcher cũng có thể nằm đè góc phải Toast thông báo.
10. **Evidence:** `evidence/04_live_browser_security_admin_audit.json:540-552`; `evidence/screenshots/final49_def10_popup_chatbot.png`.
11. **User/business impact:** Trải nghiệm thị giác bị đè lớp nhẹ khi người dùng chưa đóng popup hoặc mở chat khi có thông báo Toast.
12. **Root Cause:** Phân tầng z-index không nhất quán và CSS animation chạy trực tiếp trên phần tử button tương tác.
13. **Recommended Fix:** Sắp xếp z-index theo hệ thống lớp, đóng hoặc ẩn launcher khi Promo modal mở, và chỉ animate lớp trang trí con bên trong button.
14. **Approval required:** `YES`

### DEF-RT-11
1. **ID:** `DEF-RT-11`
2. **Severity:** `P3 — Low`
3. **Title:** Kiểm tra định dạng Prettier thất bại trên 71 files (từ baseline 63 files)
4. **Status:** `REPRODUCED` *(Tăng +8 files từ `runtime-launch/`)*
5. **Affected file/route/API:** `apps/web/src/features/admin/AdminDashboardPage.tsx`, `PostDetailPage.tsx`, `ProductCatalogSection.tsx`, `apps/web/src/lib/productImage.ts`, `prisma/seed_techpilot_full.ts`, `66` files `.md`/`.json`
6. **Environment:** Workspace Root `D:\Nexora`
7. **Steps to Reproduce:** Chạy `npm run format:check`.
8. **Expected Result:** Exit code `0`, 0 cảnh báo format.
9. **Actual Result:** Thoát mã **`1`** với **`71` files** chưa format chuẩn: `4` file TS/TSX source đang hoạt động + `1` file seed `prisma/seed_techpilot_full.ts` + `58` file Markdown tài liệu trước đó (= đúng `63` baseline) + `8` file thuộc đợt `comprehensive-audit/runtime-launch/` (7 JSON + 1 `.md`). *(0 file cấu hình, 0 file khác).*
10. **Evidence:** `evidence/02_prettier.log`; `evidence/02_quality_gates_summary.json:22-31`.
11. **User/business impact:** Sẽ làm FAIL CI step nếu pipeline bật kiểm tra Prettier bắt buộc.
12. **Root Cause:** Code và tài liệu/JSON sinh tự động không được chạy Prettier và không loại trừ `comprehensive-audit/` trong `.prettierignore`.
13. **Recommended Fix:** Khi được duyệt, chạy `prettier --write` cho `4` file source (và `seed_techpilot_full.ts` nếu được phép), bổ sung `comprehensive-audit/` vào `.prettierignore`.
14. **Approval required:** `YES`

### DEF-RT-12
1. **ID:** `DEF-RT-12`
2. **Severity:** `P3 — Low`
3. **Title:** Thiếu thẻ H1 ở một số trang, thiếu landmark trên trang gate/forgot và dùng `title` thay cho `aria-label` ở icon buttons
4. **Status:** `REPRODUCED` *(Kèm lưu ý kỹ thuật giữa `title` vs `aria-label`; Full WCAG: `NOT VERIFIED`)*
5. **Affected file/route/API:** `Home` (`/`), `Compare` (`/compare`), `AiAssistant` (`/ai-assistant`), `AdminGate` (`/admin`), `ForgotPassword` (`/auth/forgot`), `ProductCard.tsx:195-211,238-263`
6. **Environment:** Các route desktop đã quét trên `:5173`
7. **Steps to Reproduce:** Kiểm tra DOM landmarks, số lượng `<h1>`, `aria-label` trên các nút icon, label input và điều hướng `Tab`.
8. **Expected Result:** Mỗi trang có đủ `<header>/<main>/<footer>` và đúng 1 `<h1>`; các icon buttons/inputs có `aria-label`/`<label>` chuẩn; điều hướng bàn phím rõ ràng.
9. **Actual Result:** Re-verify cho thấy **`h1Count: 0`** trên 4 trang (`/` Home, `/compare` Compare, `/ai-assistant` AiAssistant, `/admin` AdminGate) và `AdminGate`/`ForgotPassword` thiếu `<header>/<main>/<footer>` (`hasHeader/Main/Footer: false`). Trên `ProductCard.tsx:195-211`, nút Yêu thích chỉ gắn thuộc tính `title` mà không có `aria-label` (khiến bộ quét strict ghi `124` buttons thiếu label trên `/` và `24` trên `/search`, dù khi tính fallback `title` thì `unnamedBtns: 0`). Nút keyboard `Tab` bước đầu focus vào `A`/`INPUT`. *(Kiểm định WCAG 2.2 AA đầy đủ gồm độ tương phản màu và screen reader: **`NOT VERIFIED`**).*
10. **Evidence:** `evidence/04_live_browser_security_admin_audit.json:13,93,109,221`; `ProductCard.tsx:195-211`; `runtime-launch/evidence/phase_de_browser_audit.json:455-668`.
11. **User/business impact:** Giảm chuẩn semantic SEO (`<h1>`) và khả năng tiếp cận cho người dùng assistive technology / screen reader.
12. **Root Cause:** Dùng `<h2>` cho tiêu đề đầu trang và dựa vào thuộc tính `title` thay cho `aria-label`/`sr-only`.
13. **Recommended Fix:** Gắn `aria-label` rõ ràng cho tất cả icon buttons/inputs (kể cả newsletter footer), thêm `<h1>` (hiển thị hoặc `.sr-only`) cho Home/Compare/AI/AdminGate và `<main>` wrapper cho AdminGate/ForgotPassword.
14. **Approval required:** `YES`

### DEF-RT-13
1. **ID:** `DEF-RT-13`
2. **Severity:** `P4 — Info`
3. **Title:** Chunk JS chính vượt ngưỡng 500 kB, rate-limit `globalApi` 300/15m khi quét tự động và ảnh lazy offscreen trên carousel
4. **Status:** `REPRODUCED`
5. **Affected file/route/API:** `apps/web/dist/assets/index-iG3JJKO1.js`, `apps/api/src/middleware/rateLimit.ts:51-55`, Storefront Home (`/`)
6. **Environment:** Production build + Express API `globalApi` + Browser `/`
7. **Steps to Reproduce:** Chạy `npm run build`; quét liên tục >30 lượt mở trang SPA (`10` API/load Homepage) từ một IP trong <15 phút; đo ảnh offscreen trên carousel ngang `/`.
8. **Expected Result:** Nắm rõ ngưỡng giới hạn để phân biệt cảnh báo hiệu năng/bảo mật đúng cơ chế với lỗi chức năng.
9. **Actual Result:** (a) Build thành công nhưng `index-iG3JJKO1.js` đạt **`1,186.36 kB`** (`gzip 294.66 kB`) > ngưỡng `500 kB` của Vite (cảnh báo hiệu năng, không phải lỗi); (b) Một lần mở Homepage phát **`10` API calls**, vì vậy quét >30 route từ 1 IP đạt ngưỡng **`300 req / 15 min`** của `globalApi` (`rateLimit.ts:51-55`) và nhận `HTTP 429` (đúng cơ chế phòng thủ DoS, không cản trở người dùng bình thường đọc 1–20 trang/15 phút); (c) `62` ảnh có `loading="lazy"` ở các card nằm ngoài khung nhìn ngang carousel trên `/` chưa tải cho đến khi cuộn tới (`naturalWidth: 0`), toàn bộ file ảnh tồn tại trên đĩa.
10. **Evidence:** `evidence/02_build.log:32-45`; `rateLimit.ts:51-55`; `evidence/04_live_browser_security_admin_audit.json:3,10-11,954-1310`.
11. **User/business impact:** Người dùng thật ít bị ảnh hưởng bởi `300/15m`, nhưng QA/crawler chạy tốc độ cao từ 1 IP dễ chạm `429` (và kích hoạt lỗi `DEF-RT-15` trên Admin UI); bundle lớn ảnh hưởng tốc độ tải trang lần đầu trên mạng chậm.
12. **Root Cause:** SPA chưa áp dụng `React.lazy()` code-splitting theo route; `globalApi` đếm cả GET catalog công khai chung hạn mức 300/15m.
13. **Recommended Fix:** Áp dụng `React.lazy()` cho `AdminDashboardPage` và các trang nặng; cân nhắc nâng/tách limit GET tĩnh công khai khỏi `globalApi` nếu cần quét tự động. **Không tự sửa trước khi có phê duyệt của Owner.**
14. **Approval required:** `YES` *(Bắt buộc làm rõ Owner cần quyết định tối ưu hay giữ nguyên)*

---

## Các Defect MỚI được phát hiện trong đợt Final Audit (`DEF-RT-14`..`DEF-RT-17`)

### DEF-RT-14 *(MỚI)*
1. **ID:** `DEF-RT-14`
2. **Severity:** `P2 — Medium`
3. **Title:** Các endpoint Admin CRUD thiếu Zod Validation đầu vào, trả HTTP 500 khi nhận payload sai
4. **Status:** `OPEN` / `REPRODUCED`
5. **Affected file/route/API:** `apps/api/src/modules/admin/admin.controller.ts:41-60` (và hầu hết CRUD handlers trừ `UpdateReviewStatusInputSchema`), API `POST /api/v1/admin/products` (cùng các endpoint tạo/sửa khác)
6. **Environment:** Isolated API `:3001` (`nexora_test`)
7. **Steps to Reproduce:** Đăng nhập ADMIN -> gửi `POST /api/v1/admin/products` với body không hợp lệ `{ "name": "", "price": -50 }` (thiếu `sku`, `categoryId`, giá âm).
8. **Expected Result:** Middleware/Controller validate qua Zod schema và trả **`HTTP 400 VALIDATION_ERROR`** với thông báo rõ ràng.
9. **Actual Result:** `AdminController.createProduct` truyền thẳng `req.body` vào `this.service.createProduct(req.body, actorId)` -> Prisma ném exception ép kiểu/FK `NaN`/`null` -> `errorHandler` trả **`HTTP 500 INTERNAL_SERVER_ERROR`** (`adminInvalidProdStatus: 500`).
10. **Evidence:** `apps/api/src/modules/admin/admin.controller.ts:8,41-59`; `apps/api/src/modules/admin/admin.service.ts:278-296`; `evidence/05_isolated_interactive_rbac_crud.json:128`.
11. **User/business impact:** Gửi thiếu/sai dữ liệu qua API quản trị (hoặc công cụ tích hợp/bảo mật) gây lỗi server `500` thay vì lỗi client `400`, thiếu kiểm soát tính toàn vẹn schema đầu vào.
12. **Root Cause:** `AdminController` mới import duy nhất `UpdateReviewStatusInputSchema` ở dòng `8`; chưa áp dụng Zod schemas từ `@nexora/shared` cho Products, Categories, Brands, Coupons, Flash Sales, Banners, Posts.
13. **Recommended Fix:** Tạo & áp dụng Zod validation schemas cho tất cả payload `POST/PUT` trong `AdminController` (trả `400 VALIDATION_ERROR` khi sai format/kiểu/số âm).
14. **Approval required:** `YES`

### DEF-RT-15 *(MỚI)*
1. **ID:** `DEF-RT-15`
2. **Severity:** `P2 — Medium`
3. **Title:** Admin Dashboard nuốt lỗi HTTP 429/500 từ API và hiển thị giả tạo số liệu `0đ` / bảng trống
4. **Status:** `OPEN` / `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/features/admin/AdminDashboardPage.tsx:339-343`, route `/admin`
6. **Environment:** Live Website `http://localhost:5173/admin` khi Backend trả `429 Too Many Requests` (hoặc `500`)
7. **Steps to Reproduce:** Gửi >300 request khiến `/api/v1/admin/*` trả `429` (trừ `401`/`403`), sau đó mở `/admin`.
8. **Expected Result:** React Query nhận error và UI Admin hiển thị banner cảnh báo lỗi tải dữ liệu / nút Thử lại.
9. **Actual Result:** Các dòng `339–343` kiểm tra `sumRes.ok ? await sumRes.json() : { data: null }` (tương tự cho `ordersRes`, `prodsRes`, `catsRes`, `logsRes`) mà không throw Error khi status là `429` hoặc `500`. Kết quả UI render thành công mà tất cả KPI đều bằng **`0đ` / `0 đơn hàng` / `0 sản phẩm`** và bảng dữ liệu trống hoàn toàn (`final49_admin_tablet_768.png`).
10. **Evidence:** `apps/web/src/features/admin/AdminDashboardPage.tsx:333-351`; `evidence/screenshots/final49_admin_tablet_768.png`; `evidence/04_live_browser_security_admin_audit.json:954-1310`.
11. **User/business impact:** Gây hiểu lầm nghiêm trọng cho chủ cửa hàng/nhân viên (tưởng doanh thu = `0đ` hoặc bị mất sạch 674 sản phẩm) khi máy chủ gặp lỗi 5xx hoặc nghẽn rate limit.
12. **Root Cause:** Chỉ throw Error cho `401`/`403`, bỏ qua `!res.ok` với các status `429`/`5xx`.
13. **Recommended Fix:** Ném lỗi kèm thông điệp HTTP khi `!sumRes.ok` hoặc bất kỳ fetch chính nào thất bại và hiển thị banner lỗi rõ ràng trong UI Dashboard.
14. **Approval required:** `YES`

### DEF-RT-16 *(MỚI)*
1. **ID:** `DEF-RT-16`
2. **Severity:** `P3 — Low`
3. **Title:** `GET /api/v1/cart` thực hiện `INSERT` vào bảng `carts` cho mỗi trình duyệt khách vãng lai mới
4. **Status:** `OPEN` / `REPRODUCED` *(Giải thích triệt để sự cố `+8` dòng trong báo cáo cũ & `+1` dòng trong phiên này)*
5. **Affected file/route/API:** `apps/api/src/modules/cart/cart.service.ts:9-56`, endpoint `GET /api/v1/cart`
6. **Environment:** Live Backend `:3000` kết nối Dev DB `3306/nexora`
7. **Steps to Reproduce:** Mở trang chủ `/` trên một trình duyệt ẩn danh/context hoàn toàn mới (chưa từng thêm gì vào giỏ hàng), sau đó kiểm tra bảng `carts` trong MySQL.
8. **Expected Result:** Yêu cầu HTTP `GET` chỉ đọc (idempotent, không ghi DB) và trả giỏ rỗng nếu khách chưa bấm "Thêm vào giỏ hàng".
9. **Actual Result:** Frontend tự tạo `guestSessionId` (`guest_...`) và gọi `GET /api/v1/cart` ngay khi mở trang. Backend `getCartSummary()` gọi `getOrCreateCart()`, thực thi `prisma.cart.create({ data: { guestSessionId } })`, chèn 1 dòng `carts` rỗng (`user_id: null`, `item_count: 0`). Bằng chứng thực nghiệm xác minh đủ **`8` dòng `carts` rỗng (`id 217..224`)** từ phiên `2026-11-25T04:46–04:50Z` ở báo cáo trước và **`+1` dòng `id 225` (`guest_vsaywla1ruhm`)** tại `2026-11-25T10:57:24Z` trong phiên hiện tại.
10. **Evidence:** `apps/api/src/modules/cart/cart.service.ts:9-56`; `evidence/01_dev_db_before.json:20`; `evidence/07_dev_db_after.json:20,153-237`.
11. **User/business impact:** Làm phình bảng `carts` theo thời gian theo mỗi lượt truy cập ẩn danh/bot chỉ xem trang chủ mà không mua hàng.
12. **Root Cause:** `getCartSummary()` dùng chung hàm tạo bản ghi `getOrCreateCart()` với các thao tác `POST /cart/items`.
13. **Recommended Fix:** Chuyển `getCartSummary()` thành truy vấn `findUnique()` thuần read-only (trả `{ items: [], totalItems: 0, subtotal: '0' }` nếu chưa có row trong DB); chỉ tạo `Cart` khi `addItem`/`mergeCart`.
14. **Approval required:** `YES`

### DEF-RT-17 *(MỚI)*
1. **ID:** `DEF-RT-17`
2. **Severity:** `P3 — Low`
3. **Title:** Modal PC Builder không đóng bằng phím `Escape`, Sidebar Admin hiển thị tab cho STAFF và E2E Journey 3 lệch selector
4. **Status:** `OPEN` / `REPRODUCED`
5. **Affected file/route/API:** `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/admin/AdminDashboardPage.tsx:1492-1504`, `tests/e2e/storefront_journeys.spec.ts:34`
6. **Environment:** Isolated & Live Web + Playwright Spec
7. **Steps to Reproduce:** (a) Mở modal chọn linh kiện tại `/pc-builder` rồi nhấn `Escape`; (b) Đăng nhập `/admin` bằng tài khoản `STAFF` (`staff@nexora.local`); (c) Kiểm tra locator `input[type="email"]` ở `Journey 3` trong `storefront_journeys.spec.ts` vs `LoginPage.tsx:88`.
8. **Expected Result:** (a) Phím `Escape` đóng modal; (b) `STAFF` không thấy các tab quản trị quyền `ADMIN` (`Khách hàng`, `Cài đặt`) hoặc hiển thị rõ chỉ xem; (c) E2E Journey 3 nhắm đúng ô nhập liệu đăng nhập (`#login_email`).
9. **Actual Result:** (a) `escClosesModal: false` — modal PC Builder không đóng khi bấm `Escape`; (b) `STAFF` nhìn thấy cả `12` mục sidebar (gồm `"Khách hàng"` và `"Cài đặt"` dù mọi mutation role/toggle đều bị API chặn `403`); (c) `LoginPage.tsx:88` đặt `#login_email` là `type="text"` (email hoặc SĐT), nên `page.locator('input[type="email"]').first()` trong `Journey 3` thực chất đang khớp ô nhận tin Footer thay vì form đăng nhập.
10. **Evidence:** `evidence/05_isolated_followup_staff_pcbuilder_ai.json:3-24`; `screenshots/final49_staff_admin_logged_in.png`; `tests/e2e/storefront_journeys.spec.ts:34`; `LoginPage.tsx:88`.
11. **User/business impact:** Hạn chế trải nghiệm bàn phím ở PC Builder, gây nhiễu UI điều hướng cho `STAFF`, và làm E2E Journey 3 kiểm chứng nhầm phần tử nhập liệu trên `/login`.
12. **Root Cause:** Thiếu listener `keydown === 'Escape'` trên `.pc-modal`; `navMenuItems` chưa phân tách theo role `STAFF`/`ADMIN`; test `Journey 3` chưa cập nhật theo thay đổi `type="text"` của `#login_email`.
13. **Recommended Fix:** Thêm handler `Escape` đóng modal PC Builder; cân nhắc gắn badge `Chỉ xem` hoặc ẩn tab admin-only tùy quy chuẩn STAFF; cập nhật selector `Journey 3` dùng `#login_email`.
14. **Approval required:** `YES`
