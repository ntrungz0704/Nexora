# NEXORA — IMPLEMENTATION REPORT: PO-BUG-01 DIRECT QUANTITY INPUT

- **Bug ID:** `PO-BUG-01`
- **Severity:** `P1`
- **Wave / Phase:** Implementation Wave 1 — Task PO-BUG-01
- **Date:** `2026-11-25`
- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` (`fix(catalog): dong bo danh muc category va toi uu anh san pham laptop`)
- **Final Verdict:** **`PASS`**

---

## 1. Executive Summary

Đã hoàn thành triển khai sửa lỗi **PO-BUG-01 (Direct Quantity Input, Validation, Product Switching Reset & Cart Synchronization)** tại `ProductDetailPage.tsx` và `CartPage.tsx`:

- Thay thế vùng hiển thị `<span>` tĩnh bằng `<input type="number" ... />` cho phép click trực tiếp vào con số, bôi đen thay thế, gõ số nhiều chữ số (ví dụ `47`), xóa trống tạm thời khi đang sửa mà không bị nhảy giá trị, và xác nhận khi nhấn `Enter`, `Blur`, `+`/`−`, `Thêm vào giỏ hàng` hoặc `Mua ngay`.
- Chuẩn hóa và kẹp biên số lượng hợp lệ `1 <= quantity <= stockQuantity` bằng helper dùng chung `apps/web/src/lib/quantity.ts`: số `0`/âm đưa về `1`, số lớn hơn tồn kho kẹp về `stockQuantity` kèm toast thông báo, nút `−` dừng ở `1`, nút `+` dừng ở `stockQuantity`, sản phẩm hết hàng (`stockQuantity <= 0`) khóa input và nút đặt mua/thêm giỏ.
- Khắc phục triệt để lỗi giữ số lượng cũ khi chuyển giữa các sản phẩm (`key={slug || 'unknown'}` bọc `<ProductDetailContent>`), bảo đảm mỗi lần chuyển sản phẩm số lượng tự reset về `1`, không mang số lượng lớn sang sản phẩm tồn kho thấp hoặc gửi nhầm `productId`.
- Trên `CartPage.tsx`, quản lý draft state độc lập theo từng `item.id`, chỉ gọi `PATCH /cart/items/:id` khi xác nhận (`Enter`, `Blur`, `+`/`−`) và có thay đổi thực tế (không spam request mỗi phím), có khóa in-flight theo từng item và hoàn tác giá trị cũ kèm cảnh báo lỗi nếu API thất bại.
- Kiểm chứng đầy đủ Prettier, TypeScript, ESLint, Vite/API Build, toàn bộ unit/component tests (`14/14` files, `152/152` tests PASS) và kiểm thử trình duyệt Playwright trên môi trường cô lập cả **Desktop (`1440x900`)** lẫn **Mobile (`375x812`)** (`0` overflow ngang, `0` console/page/API error, Dev DB nguyên vẹn 100%).

---

## 2. Root Cause

Kiểm tra trực tiếp mã nguồn baseline tại `ProductDetailPage.tsx` và `CartPage.tsx` xác nhận các nguyên nhân gốc sau:

1. **Vùng số lượng không cho nhập trực tiếp (`ProductDetailPage.tsx:815-825` & `CartPage.tsx:361-370`):** Cả hai trang đều render số lượng bằng thẻ `<span>` tĩnh giữa hai nút `-` và `+`, buộc người dùng phải bấm `+` liên tục.
2. **Thiếu giới hạn trần tồn kho ở Frontend:** Cả nút `+` trên `ProductDetailPage` (`setQuantity((prev) => prev + 1)`) lẫn nút `+` trên `CartPage` (`quantity: item.quantity + 1`) đều không kiểm tra `product.stockQuantity`.
3. **Giữ nguyên state `quantity` khi chuyển sản phẩm (`ProductDetailPage.tsx:164`):** `ProductDetailPage` dùng cùng component instance khi React Router đổi param `:slug`, nên `useState(1)` không tự reset khi chuyển từ sản phẩm có tồn kho cao sang sản phẩm khác (giải thích đúng hiện tượng `- 47 +` trên sản phẩm tồn kho `40` trong ảnh báo lỗi của Project Owner).
4. **Thiếu xử lý lỗi cập nhật giỏ hàng và responsive grid cố định trên Mobile:** `updateQuantityMutation` trên `CartPage.tsx` chưa có nhánh `onError` hiển thị thông báo; đồng thời `.nexora-product-showcase` (`460px minmax(0, 1fr)`) và `.nexora-cart-item-row` trước đây dùng inline style cố định độ rộng dễ gây hẹp/cấn khung trên màn hình Mobile `375px`.

---

## 3. Files Created / Modified

| Trạng thái | Đường dẫn đầy đủ | Mục đích |
| --- | --- | --- |
| Created | `D:\Nexora\apps\web\src\lib\quantity.ts` | Helper thuần `normalizeStockLimit`, `clampQuantity`, `resolveCommittedQuantity`, `extractQuantityErrorMessage` |
| Modified | `D:\Nexora\apps\web\src\features\catalog\ProductDetailPage.tsx` | Bọc `<ProductDetailContent key={slug || 'unknown'}>` reset theo sản phẩm, input số lượng trực tiếp, clamp `1..stockQuantity`, đồng bộ `Thêm vào giỏ hàng` / `Mua ngay` / error toast |
| Modified | `D:\Nexora\apps\web\src\features\cart\CartPage.tsx` | Draft input theo `item.id`, xác nhận `Enter`/`Blur`/`+`/`−`, không spam request từng phím, xử lý hết hàng & revert kèm error alert/toast khi API lỗi |
| Modified | `D:\Nexora\apps\web\src\index.css` | Ẩn spin button mặc định của `<input type="number">` (`.nexora-qty-input`) và bổ sung responsive grid/flex cho Product Detail & Cart Page trên Desktop/Mobile |
| Created | `D:\Nexora\apps\web\tests\po_bug_01_quantity_input.test.tsx` | Bộ regression unit + DOM component tests cho 18 kịch bản bắt buộc |
| Created | `D:\Nexora\comprehensive-audit\implementation-wave-1\PO-BUG-01_QUANTITY_INPUT_IMPLEMENTATION_REPORT.md` | Báo cáo nghiệm thu triển khai PO-BUG-01 |

**Xác nhận phạm vi:** Không sửa `CartService` (`B-02`), `AiService` (`B-03`), `CatalogRepository`/`MarketingService` (`B-04`), `AdminService` (`B-05`), `PO-BUG-02`, backend API contracts, `TechPilot/`, hay commit/push Git.

---

## 4. Nội dung thay đổi

1. **Shared Quantity Normalization (`apps/web/src/lib/quantity.ts`):**
   - `normalizeStockLimit(stockQuantity)`: chuẩn hóa ngưỡng tồn kho nguyên không âm.
   - `clampQuantity(value, stockQuantity)`: giữ giá trị trong `[1, stockQuantity]` (trả về `1` an toàn nếu `stockQuantity <= 0`).
   - `resolveCommittedQuantity(rawDraft, stockQuantity, fallbackQuantity)`:
     - Chuỗi rỗng `''` hoặc không phải số (`NaN` / không hữu hạn) khi `Blur`/`Enter` -> khôi phục `clampQuantity(fallbackQuantity, stockQuantity)`.
     - Giá trị `<= 0` (`0`, `-5`) -> chuẩn hóa thành `1`.
     - Giá trị `> stockQuantity` -> kẹp xuống `stockQuantity`.
2. **Product Detail (`apps/web/src/features/catalog/ProductDetailPage.tsx`):**
   - Tách wrapper `ProductDetailPage` đọc `slug` từ `useParams()` và render `<ProductDetailContent key={slug || 'unknown'} slug={slug} />`, reset toàn bộ state `quantity = 1`, `quantityDraft = '1'` ngay lập tức mỗi khi chuyển sang sản phẩm khác (kể cả khi quay lại sản phẩm cũ A -> B -> A).
   - Thay `<span>{quantity}</span>` bằng `<input id="qtyInput" type="number" className="nexora-qty-input" ... />` cho phép gõ trực tiếp nhiều chữ số và xóa trống tạm thời qua `quantityDraft`; chỉ chuẩn hóa khi `onBlur`, nhấn `Enter`, nhấn `−`/`+`, hoặc bấm `Thêm vào giỏ hàng` / `Mua ngay` (`Escape` khôi phục `committedQuantity`).
   - Khóa toàn bộ input/button và giữ trạng thái `Tạm hết hàng` khi `stockQuantity <= 0`.
3. **Cart Page (`apps/web/src/features/cart/CartPage.tsx`):**
   - Lưu `draftQuantities` (`Record<string, string>`) và `pendingItemIds` (`Record<string, boolean>`) theo từng `item.id` riêng biệt, kết hợp `inFlightTargetRef` tránh gửi trùng `PATCH /cart/items/:id` khi `Enter` xong `Blur` liền sau.
   - Không gửi API cho từng ký tự đang gõ; nếu giá trị xác nhận bằng đúng `item.quantity` hiện tại trên server thì chỉ xóa draft, không gọi API thừa.
   - Khi API `updateItem` lỗi (`onError`), xóa draft để UI quay về `item.quantity` thực tế từ server, hiển thị `role="alert"` inline + toast lỗi.
   - Với item có `stockQuantity <= 0`, khóa input & nút `−`/`+`, hiển thị nhãn `Tạm hết hàng`, vẫn giữ nút xóa item khỏi giỏ.
4. **Responsive & Spin Control (`apps/web/src/index.css`):**
   - Ẩn mũi tên tăng/giảm mặc định của `input[type="number"]` qua `.nexora-qty-input`.
   - Thiết lập `.nexora-product-showcase` (`grid-template-columns: minmax(0, 1fr)` trên `<= 960px`, `> * { min-width: 0 }`), `.nexora-product-actions`, `.nexora-cart-layout`, và `.nexora-cart-item-row` đảm bảo Desktop giữ nguyên bố cục hiện tại và Mobile `375px` không tràn ngang hay cấn nút.

---

## 5. Test Cases & Kết quả thực tế

File kiểm thử: `D:\Nexora\apps\web\tests\po_bug_01_quantity_input.test.tsx` (8 test blocks bao phủ đầy đủ 18 yêu cầu B7), chạy bằng `npm run test:unit`:

| Nhóm Test | Nội dung kiểm chứng | Kết quả (lần chạy cuối) |
| --- | --- | --- |
| **Unit helper** | `clampQuantity` & `resolveCommittedQuantity` (rỗng, chữ, `0`, âm, vượt tồn kho) | **PASS** |
| **Tests 1-4** | Mặc định `1`, click nhập `5`, thay thế `8`, xóa trống rồi gõ nhiều chữ số `47` không mất số | **PASS** |
| **Tests 5-10** | Nhập bằng tồn kho `40`, vượt tồn kho `47 -> 40`, `0`/`-5 -> 1`, ô trống khi gõ không lỗi, xác nhận qua `Enter`, `Blur`, `Thêm vào giỏ hàng` | **PASS** |
| **Tests 11-12** | Nút `+` dừng và disable tại tồn kho (`3`), nút `−` dừng và disable tại `1` | **PASS** |
| **Tests 13-14** | Chuyển sản phẩm (stock `50` đang để `47` -> sang stock `3` -> quay lại `50`) luôn reset `1`, gửi đúng `productId` mới | **PASS** |
| **Tests 15-16** | `CartPage` nhiều item: gõ `47` không gọi `PATCH` mỗi phím, `Enter` gọi đúng `1` lần cho đúng `item.id`, API fail hiển thị `role="alert"` + revert về `1`, `+`/`−` trên Cart | **PASS** |
| **Test 18** | Nút `Mua ngay` lấy đúng số lượng gõ trực tiếp (`6`) gửi `POST /cart/items` và chuyển `/checkout` | **PASS** |
| **Test 17** | Sản phẩm hết hàng (`stockQuantity: 0`) disable input, `−`/`+`, `Thêm vào giỏ hàng`, `Mua ngay` (0 API call), Cart item disable sửa nhưng vẫn xóa được | **PASS** |
| **Test 18 regression** | Toàn bộ suite sẵn có bao gồm `m6_1_guest_cart_merge.test.tsx` (23 tests), `m6_5_customer_integration_qa.test.tsx` (20 tests) | **PASS** |

**Tổng kết `npm run test:unit`:** **14 / 14 test files PASS**, **152 / 152 tests PASS** (`20.79s`), trong đó `po_bug_01_quantity_input.test.tsx` chạy `8/8 PASS` (`850ms`).

---

## 6. Typecheck, Lint, Prettier & Build

Chạy sau lần chỉnh sửa code cuối cùng (`apps/web/src/index.css`):

| Cổng kiểm tra | Lệnh thực thi | Kết quả |
| --- | --- | --- |
| **Prettier** | `npx prettier --check apps/web/src/index.css apps/web/src/lib/quantity.ts apps/web/src/features/catalog/ProductDetailPage.tsx apps/web/src/features/cart/CartPage.tsx apps/web/tests/po_bug_01_quantity_input.test.tsx apps/api/src/modules/order/order.service.ts apps/api/tests/b01_order_product_eligibility.test.ts` | **PASS** (`All matched files use Prettier code style!`) |
| **Typecheck** | `npm run typecheck` | **PASS** (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` — exit `0`) |
| **Lint** | `npm run lint` (`eslint .`) | **PASS** (`0 errors, 0 warnings` — exit `0`) |
| **Unit Tests** | `npm run test:unit` | **PASS** (`14/14` files, `152/152` tests — `20.79s`) |
| **Build** | `npm run build` | **PASS** (`tsc` + Vite bundle `423ms` — exit `0`) |

---

## 7. Browser Verification (Desktop & Mobile — Isolated Full Stack)

Thực thi bằng Playwright Chromium thực tế trên môi trường cô lập hoàn toàn (`nexora-po01-test-db` `mysql:8.4.13` port `3307/nexora_test`, container ID `e0f172e09d70`, API `:3001`, Web `:5174`):

| Bối cảnh kiểm tra | Kịch bản xác minh thực tế | Thông số / Kết quả |
| --- | --- | --- |
| **Product Detail Desktop (`1440x900`)** | Mở `/product/detail/chuot-logitech-g-pro-x-superlight-2` (`stock: 50`); kiểm tra mặc định `1`, bôi đen gõ `9999` -> `Blur` clamp `50` + toast, gõ `0` -> `Enter` về `1`, bấm `+`/`−`, gõ `5` -> `Enter`; click link SPA sang `ban-phim-logitech-g913-tkl` (`stock: 40`) xác nhận tự reset về `1` không cần reload | **PASS** (`scrollWidth: 1425 <= 1440`, không vỡ layout) |
| **Cart Page Desktop (`1440x900`)** | Thêm `8` sản phẩm vào giỏ -> mở `/cart`, bôi đen gõ `12` (`0` PATCH khi đang gõ) -> nhấn `Enter` (`1` PATCH `/cart/items/:id`) -> `F5` reload xác nhận giữ nguyên `12` từ MySQL | **PASS** (`scrollWidth: 1425 <= 1440`, `persistedCartQuantity: 12`) |
| **Product Detail Mobile (`375x812`)** | Click input nhập `5` -> `Enter` -> bấm `+` lên `6`; kiểm tra wrap nút `Thêm vào giỏ hàng` & `Mua ngay` sau tinh chỉnh `minmax(0, 1fr)` | **PASS** (`scrollWidth: 360 <= 375`, không cấn mép phải, không tràn ngang) |
| **Cart Page Mobile (`375x812`)** | Thêm vào giỏ từ Mobile -> mở `/cart`, click input gõ `3` -> `Enter` -> xác nhận layout 2 hàng `[thumb + title/price]` và `[qty + subtotal + delete]` sạch sẽ | **PASS** (`scrollWidth: 360 <= 375`, không tràn ngang) |
| **Console / Network / Page Errors** | Theo dõi toàn bộ quá trình trên cả Desktop và Mobile | **PASS** (`consoleErrors: 0`, `pageErrors: 0`, `apiErrors: 0`) |

Ảnh chụp đối chiếu được lưu tại Artifact Directory (`po_bug_01_evidence/product-detail-desktop.png`, `product-detail-mobile.png`, `cart-desktop.png`, `cart-mobile.png`) và đã kiểm tra trực quan.

---

## 8. Git HEAD, Git Status & Diff Summary

- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6`
- **Git Status (tracked modified liên quan toàn phiên):**
  - `apps/api/src/modules/order/order.service.ts` (`B-01`: `204 +++++--`)
  - `apps/web/src/features/cart/CartPage.tsx` (`PO-BUG-01`: `266 +++++++--`)
  - `apps/web/src/features/catalog/ProductDetailPage.tsx` (`PO-BUG-01`: `320 ++++++----`)
  - `apps/web/src/index.css` (`PO-BUG-01`: `115 ++++`)
  - `apps/web/src/lib/productImage.ts` (giữ nguyên thay đổi `DEF-RT-01` trước đó: `645 +++++++++++++++------`)
- **Untracked mới tạo trong PO-BUG-01:**
  - `apps/web/src/lib/quantity.ts`
  - `apps/web/tests/po_bug_01_quantity_input.test.tsx`
  - `comprehensive-audit/implementation-wave-1/PO-BUG-01_QUANTITY_INPUT_IMPLEMENTATION_REPORT.md`
- **Commit / Push:** Không thực hiện stage, commit, hoặc push.

---

## 9. Dev DB Immutability Verification

- **Database Dev (`127.0.0.1:3306/nexora`, `7ffc1a14a558`):**
  - Snapshot BEFORE (`27` tables, `845` rows) === Snapshot AFTER (`27` tables, `845` rows) -> `DEV_DB_IMMUTABILITY_CHECK=MATCH_100_PERCENT`.
  - Container kiểm thử cô lập `nexora-po01-test-db` và các process cô lập `:3001`/`:5174` đã được dọn dẹp sạch.
  - Dịch vụ dev chính của dự án (`http://127.0.0.1:3000/api/v1/health` và `http://127.0.0.1:5173`) vẫn đang hoạt động ổn định.

---

## 10. Các vấn đề chưa giải quyết & Khuyến nghị tiếp theo

1. **Out-of-scope theo khóa phạm vi:**
   - `B-02` (`CartService` kiểm tra sản phẩm/danh mục/thương hiệu ẩn ở backend giỏ hàng), `B-03`, `B-04`, `B-05`, và `PO-BUG-02` chưa được đụng tới theo chỉ đạo.
   - Do backend `CartService.addItem` cộng dồn với số lượng đang nằm sẵn trong giỏ còn `CartService.updateItem` chưa kiểm tra chéo tồn kho của mọi nhánh khác, việc chặn đơn hàng cuối cùng tại checkout đã có **B-01** bảo vệ trong khi đồng bộ giỏ hàng phía server sẽ hoàn chỉnh hơn khi triển khai **B-02**.
2. **Ghi chú giao diện ngoài phạm vi:** Toast thông báo cố định góc dưới phải (`bottom: 24px; right: 24px`) có thể nằm gần icon Floating Chatbot (`bottom: 30px; right: 30px`) trên Desktop — hành vi chung có sẵn trước khi sửa, không thuộc phạm vi `PO-BUG-01`.

**Kết luận cuối cùng cho PO-BUG-01:** **`PASS`** — Sẵn sàng chờ Project Owner & Technical Advisor review. Không tự ý chuyển sang task tiếp theo.
