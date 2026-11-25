# NEXORA — IMPLEMENTATION REPORT: B-01 ORDER PRODUCT ELIGIBILITY VALIDATION

- **Task ID:** `B-01`
- **Severity:** `P1`
- **Wave / Phase:** Implementation Wave 1 — Task B-01
- **Date:** `2026-11-25`
- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` (`fix(catalog): dong bo danh muc category va toi uu anh san pham laptop`)
- **Final Verdict:** **`PASS`**

---

## 1. Executive Summary

Đã hoàn thành triển khai sửa lỗi **B-01 (`OrderService.createOrder` Product, Category & Brand Eligibility Validation)** theo đúng phạm vi được Project Owner phê duyệt:

- Từ chối tạo đơn hàng (`HTTP 400`, error code `PRODUCT_UNAVAILABLE`) nếu sản phẩm có `status !== 'ACTIVE'` (bao gồm `'INACTIVE'` và `'OUT_OF_STOCK'`), nếu `Category.isActive === false`, hoặc nếu `Product.brandId !== null` và `Brand.isActive === false`.
- Cho phép đặt hàng hợp lệ khi `Product.status === 'ACTIVE'`, `Category.isActive === true`, và `Product.brandId === null` hoặc `Brand.isActive === true`.
- Bổ sung bước gộp số lượng trùng `productId` trong `input.items` trước khi truy vấn sản phẩm để kiểm tra tồn kho và tính tiền chính xác.
- Thực thi kiểm tra điều kiện kinh doanh + tồn kho **nguyên tử ngay trong `prisma.$transaction`** bằng `tx.product.updateMany` trước khi tạo `Order` / `OrderItem` / `InventoryLog`, đảm bảo mọi giao dịch lỗi hoặc bị Admin ẩn đồng thời đều rollback toàn bộ, không tạo đơn một phần hay trừ tồn kho sai.
- Xác nhận giữ nguyên giá, tên, SKU, `thumbnailUrl` lấy từ DB (bỏ qua mọi giá trị giả mạo phía client) và bảo toàn 100% đơn hàng lịch sử, tra cứu đơn, cũng như quy trình đổi trả/bảo hành khi sản phẩm/danh mục/thương hiệu bị ẩn sau thời điểm mua.
- Đã kiểm chứng toàn bộ bằng `prettier --check`, `typecheck`, `lint`, `test:unit` (`13/13` files, `144/144` tests PASS), `build`, và `7` bộ integration/regression tests trên MySQL 8.4 cô lập (`96/96` tests PASS) trong khi giữ nguyên tuyệt đối Dev DB (`127.0.0.1:3306/nexora`, `845` tổng dòng trên `27` bảng không đổi).

---

## 2. Root Cause Confirmed in `OrderService.createOrder`

Trước khi sửa, tại `D:\Nexora\apps\api\src\modules\order\order.service.ts`:

1. **Bước tải sản phẩm (`createOrder` Step 2):** Chỉ truy vấn `prisma.product.findMany({ where: { id: { in: productIds } } })` mà không `include` quan hệ `category` và `brand`, không kiểm tra `prod.status === 'ACTIVE'`, không kiểm tra `prod.category.isActive`, và không kiểm tra `prod.brand.isActive`. Mọi sản phẩm `INACTIVE` (hoặc thuộc danh mục/thương hiệu `isActive = false`) nếu còn `stockQuantity > 0` đều đi qua Checkout bình thường.
2. **Kiểm tra trùng `productId`:** So sánh `products.length !== rawItems.length` trực tiếp mà chưa gộp các dòng trùng `productId` trong `input.items`, có nguy cơ báo lỗi sai `PRODUCT_NOT_FOUND` hoặc tách kiểm tra tồn kho không cộng dồn.
3. **Trong `prisma.$transaction`:** Lệnh `tx.product.updateMany` trước đây chỉ lọc `{ id: item.productId, stockQuantity: { gte: item.quantity } }` sau khi đã gọi `tx.order.create`, chưa ràng buộc điều kiện `status: 'ACTIVE'`, `category: { isActive: true }`, và `OR: [{ brandId: null }, { brand: { isActive: true } }]` ở mức atomic lock trong MySQL InnoDB, và nhánh retry `P2034`/deadlock cũng chưa re-check điều kiện kinh doanh.

---

## 3. Files Created / Modified

| Trạng thái | Đường dẫn đầy đủ | Mục đích |
| --- | --- | --- |
| Modified | `D:\Nexora\apps\api\src\modules\order\order.service.ts` | Thêm `ProductEligibilitySnapshot`, helper `assertProductEligibleForOrder`, gộp `productId` trùng, validate trước và nguyên tử bên trong `prisma.$transaction` + nhánh retry |
| Created | `D:\Nexora\apps\api\tests\b01_order_product_eligibility.test.ts` | Bộ kiểm thử tích hợp Supertest + Prisma + MySQL 8.4 gồm 11 test case bao phủ 10/10 kịch bản bắt buộc |
| Created | `D:\Nexora\comprehensive-audit\implementation-wave-1\B-01_ORDER_PRODUCT_ELIGIBILITY_IMPLEMENTATION_REPORT.md` | Báo cáo nghiệm thu triển khai B-01 |

**Xác nhận phạm vi không chỉnh sửa:** Không thay đổi `CartService` (`B-02`), `AiService` (`B-03`), `CatalogRepository`/`MarketingService` (`B-04`), `AdminService` (`B-05`), `apps/web/*` (`PO-BUG-01`/`02`), `prisma/schema.prisma`, `TechPilot/`, các báo cáo trước đó trong `comprehensive-audit/`, hoặc thực hiện `git commit`/`push`.

---

## 4. Validation Rules Implemented

Tại `D:\Nexora\apps\api\src\modules\order\order.service.ts`:

1. **Deduplication / Aggregation (`lines 80-93`):**
   - Gộp các phần tử trùng `productId` từ `rawItems` (áp dụng cho cả `input.items` trực tiếp và fallback từ `CartItem` của người dùng đã đăng nhập) vào `aggregatedItems` theo thứ tự xuất hiện đầu tiên.
2. **Product, Category & Brand Eligibility (`assertProductEligibleForOrder`, `lines 22-59`):**
   - `prod.status !== 'ACTIVE'` -> throw `AppError(400, 'PRODUCT_UNAVAILABLE', ...)` (từ chối cả `'INACTIVE'` và `'OUT_OF_STOCK'`, kể cả khi `stockQuantity > 0`).
   - `!prod.category || !prod.category.isActive` -> throw `AppError(400, 'PRODUCT_UNAVAILABLE', ...)`.
   - `prod.brandId !== null && (!prod.brand || !prod.brand.isActive)` -> throw `AppError(400, 'PRODUCT_UNAVAILABLE', ...)`.
   - Khi `prod.brandId === null`, nhánh kiểm tra brand được bỏ qua có chủ đích -> **cho phép đặt hàng** nếu sản phẩm và danh mục đều `ACTIVE`/`isActive`.
   - `prod.stockQuantity < requestedQuantity` -> throw `AppError(400, 'INSUFFICIENT_STOCK', ...)`.
3. **Server-Side Authoritative Pricing & Snapshot (`lines 129-143`):**
   - Toàn bộ `unitPrice = Number(prod.salePrice || prod.price)`, `productName = prod.name`, `productSku = prod.sku`, `thumbnailUrl = prod.thumbnailUrl`, `subtotal`, `discountAmount`, `shippingFee`, `totalAmount` đều tính từ bản ghi DB (`CreateOrderItemInputSchema` chỉ nhận `productId` và `quantity`).
4. **Atomic Transaction Enforcement & Deadlock Safety (`lines 192-366`):**
   - Sắp xếp `aggregatedItems` theo `productId` tăng dần (`sortedItems`) để tránh deadlock.
   - Thực thi `tx.product.updateMany` **trước** `tx.order.create` với điều kiện:
     - `id: item.productId`
     - `status: 'ACTIVE'`
     - `category: { isActive: true }`
     - `OR: [{ brandId: null }, { brand: { isActive: true } }]`
     - `stockQuantity: { gte: item.quantity }`
   - Nếu `updateResult.count === 0`: truy vấn lại `tx.product.findUnique` (kèm `category` và `brand`), gọi `this.assertProductEligibleForOrder(...)` để trả về đúng `PRODUCT_UNAVAILABLE` hoặc `INSUFFICIENT_STOCK` và rollback toàn bộ transaction (không tạo `Order`, không tạo `OrderItem`, không ghi `InventoryLog`, hoàn tác mọi dòng sản phẩm trước đó trong cùng đơn).
   - Sau khi trừ kho tất cả sản phẩm thành công mới tạo `Order`, tăng `coupon.usageCount`, ghi `InventoryLog`, và xóa các `CartItem` tương ứng.
   - Nhánh bắt `P2034` / deadlock / write conflict cũng kiểm tra lại `this.assertProductEligibleForOrder(...)` trước khi retry.

---

## 5. Test Cases & Isolated Test Results

Môi trường thực thi: Container Docker ephemeral `nexora-b01-test-db` (`mysql:8.4.13`, `--tmpfs /var/lib/mysql`, port `127.0.0.1:3307`, DB `nexora_test`, verified identity container ID `3e779e65e03c`), migrate + seed độc lập hoàn toàn với Dev DB `3306`.

Lệnh chạy: `npx vitest run --no-file-parallelism apps/api/tests/b01_order_product_eligibility.test.ts ...`

| Test Case | Kịch bản kiểm thử (`b01_order_product_eligibility.test.ts`) | Kết quả (lần chạy cuối) |
| --- | --- | --- |
| **Case 1** | Đặt hàng sản phẩm `ACTIVE` + Category `isActive = true` + Brand `isActive = true` -> `201`, trừ tồn kho, lưu snapshot & `InventoryLog` | **PASS** (trong bộ `11/11`, tổng `1143ms`) |
| **Case 2** | Đặt hàng sản phẩm `INACTIVE` hoặc `OUT_OF_STOCK` dù `stockQuantity > 0` -> `400 PRODUCT_UNAVAILABLE`, giữ nguyên tồn kho, `0` log | **PASS** (trong bộ `11/11`) |
| **Case 3** | Đặt hàng sản phẩm `ACTIVE` thuộc Category `isActive = false` -> `400 PRODUCT_UNAVAILABLE`, giữ nguyên tồn kho | **PASS** (trong bộ `11/11`) |
| **Case 4** | Đặt hàng sản phẩm `ACTIVE`, Category `isActive = true`, thuộc Brand `isActive = false` -> `400 PRODUCT_UNAVAILABLE`, giữ nguyên tồn kho | **PASS** (trong bộ `11/11`) |
| **Case 5** | Đặt hàng sản phẩm `ACTIVE`, Category `isActive = true`, `brandId = null` -> `201` hợp lệ, trừ tồn kho đúng | **PASS** (trong bộ `11/11`) |
| **Case 6** | Đặt hàng nhiều sản phẩm hợp lệ & gộp trùng `productId` trong `input.items` -> `201`, trừ tồn kho cộng dồn chính xác | **PASS** (trong bộ `11/11`) |
| **Case 7** | Giỏ hỗn hợp 1 sản phẩm hợp lệ + 1 sản phẩm `INACTIVE`/Category ẩn (cả `input.items` trực tiếp lẫn DB cart fallback) -> từ chối toàn bộ (`400`), `0` partial Order/OrderItem, tồn kho sản phẩm hợp lệ giữ nguyên | **PASS** (trong bộ `11/11`) |
| **Case 8** | Client gửi kèm giá/subtotal/unitPrice giả mạo trong body -> bị bỏ qua, DB lưu đúng `salePrice` (`1200000`) & `productName` thật | **PASS** (trong bộ `11/11`) |
| **Case 9** | Đơn hàng lịch sử đã đặt khi sản phẩm/Category/Brand còn active, sau đó chuyển hết sang inactive -> `GET /orders/detail/:code`, `GET /orders/my-orders`, `GET /orders/track?code=...&phone=...`, và `POST /profile/returns` (bảo hành/đổi trả) vẫn hoạt động `200`/`201`, còn tạo đơn mới với sản phẩm đó bị chặn `400` | **PASS** (trong bộ `11/11`) |
| **Case 10a** | Race condition 2 request đồng thời trên `stockQuantity = 1` -> chỉ 1 đơn `201`, 1 đơn `400 INSUFFICIENT_STOCK`, tồn kho cuối `0` | **PASS** (trong bộ `11/11`) |
| **Case 10b** | Admin chuyển sản phẩm `INACTIVE` hoặc Category `isActive = false` **ngay giữa lúc transaction đặt hàng đang chờ khóa** -> `tx.product.updateMany` chặn `400 PRODUCT_UNAVAILABLE`, rollback hoàn toàn cả `stockQuantity` của sản phẩm hợp lệ trước đó & `0` `InventoryLog` | **PASS** (`585ms`) |

**Tổng kết `b01_order_product_eligibility.test.ts`:** `11 / 11` tests **PASS** (`1143ms`).

---

## 6. Regression Test Results (Existing Suites)

Chạy đồng thời cùng `b01_order_product_eligibility.test.ts` trên isolated MySQL `8.4.13` (`127.0.0.1:3307/nexora_test`):

| Suite | Số tests | Kết quả | Thời gian |
| --- | --- | --- | --- |
| `apps/api/tests/b01_order_product_eligibility.test.ts` | 11 | **11 PASS** | 1143ms |
| `apps/api/tests/phase_b_returns_and_admin_crud.test.ts` | 30 | **30 PASS** | 1250ms |
| `apps/api/tests/phase_b_cart_merge.test.ts` | 14 | **14 PASS** | 757ms |
| `apps/api/tests/commerce_and_ai.integration.test.ts` | 11 | **11 PASS** | 652ms |
| `apps/api/tests/rbac_and_concurrency.test.ts` | 10 | **10 PASS** | 611ms |
| `apps/api/tests/payment_security.test.ts` | 13 | **13 PASS** | 386ms |
| `apps/api/tests/storefront.integration.test.ts` | 7 | **7 PASS** | 310ms |
| **Tổng cộng Tier Integration / Regression** | **96** | **96 PASS** | **9.80s** |

---

## 7. Typecheck / Lint / Build Results

| Cổng kiểm tra | Lệnh thực thi | Kết quả |
| --- | --- | --- |
| **Prettier** | `npx prettier --check apps/api/src/modules/order/order.service.ts apps/api/tests/b01_order_product_eligibility.test.ts` | **PASS** (`All matched files use Prettier code style!`) |
| **Typecheck** | `npm run typecheck` | **PASS** (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` — exit `0`) |
| **Lint** | `npm run lint` (`eslint .`) | **PASS** (`0 errors, 0 warnings` — exit `0`) |
| **Unit Tests** | `npm run test:unit` | **PASS** (`13/13` files, `144/144` tests — `18.49s`) |
| **Build** | `npm run build` | **PASS** (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` Vite bundle `448ms` — exit `0`) |
| **Dev DB Isolation** | Snapshot BEFORE vs AFTER `127.0.0.1:3306/nexora` (`7ffc1a14a558`) | **PASS** (`27` tables, `845` rows y hệt BEFORE === AFTER; `nexora-b01-test-db` đã gỡ bỏ sạch) |
| **Live Servers** | `GET http://127.0.0.1:3000/api/v1/health` & `GET http://127.0.0.1:5173` | **PASS** (`API database=up`, Vite `200`, hot-reload sạch sau khi sửa `order.service.ts`) |

### Git HEAD, Status & Diff Summary (B-01 Scope)

- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6`
- **Git Diff Stat (`order.service.ts`):** `apps/api/src/modules/order/order.service.ts | 204 ++++++++++++++++++++--------` (`149 insertions(+), 55 deletions(-)`)
- **Untracked B-01 Files:** `apps/api/tests/b01_order_product_eligibility.test.ts`, `comprehensive-audit/implementation-wave-1/B-01_ORDER_PRODUCT_ELIGIBILITY_IMPLEMENTATION_REPORT.md`
- **Commit / Push:** Không thực hiện stage, commit hoặc push.

---

## 8. Compatibility Verification

- **Đơn hàng lịch sử & Snapshot:** `getOrderByCode`, `trackOrder`, `getUserOrders`, `adminGetOrders`, và `ReturnService` chỉ đọc các trường snapshot lưu trên `OrderItem` (`productName`, `productSku`, `unitPrice`, `thumbnailUrl`, `subtotal`), không lọc theo `Product.status` hay `Category/Brand.isActive`. Case 9 xác minh thực tế cả tra cứu và gửi yêu cầu bảo hành/đổi trả đều hoạt động bình thường sau khi ẩn sản phẩm/danh mục/thương hiệu.
- **Guest & Authenticated Cart Checkout:** Hoạt động bảo toàn với cả danh sách `input.items` tường minh lẫn fallback giỏ hàng của khách hàng đăng nhập.
- **Sản phẩm không có Brand (`brandId = null`):** Tiếp tục được mua bình thường khi sản phẩm và danh mục hợp lệ (tương thích 7 sản phẩm `brandId = null` hiện có trong Dev DB).

---

## 9. Remaining In-Scope / Out-of-Scope Risks

1. **Out-of-scope theo khóa nhiệm vụ (chưa triển khai trong wave này):**
   - `B-02`: `CartService` thêm/cập nhật/merge giỏ hàng vẫn chưa chặn sản phẩm/Category/Brand ẩn nếu gọi trực tiếp API giỏ hàng (dù bước tạo đơn `OrderService.createOrder` hiện đã chặn tại điểm thanh toán).
   - `B-03` (`AiService`), `B-04` (`CatalogRepository`/`MarketingService` liên quan Brand ẩn hoặc khuyến mãi), `B-05` (`AdminService`), `PO-BUG-01`, `PO-BUG-02` được giữ nguyên chưa đụng theo chỉ đạo khóa phạm vi.
2. **Lưu ý vận hành test suite:** Giống các file tích hợp DB khác trong `apps/api/tests/*.test.ts`, cần chạy `b01_order_product_eligibility.test.ts` với `DATABASE_URL` trỏ về MySQL test cô lập (`127.0.0.1:3307/nexora_test`), không trỏ trực tiếp vào Dev DB `3306`.

---

## 10. Recommended Next Step

Chuyển sang nhiệm vụ phê duyệt kế tiếp theo thứ tự ưu tiên: **B-02 — Cart Eligibility Validation** (kiểm tra điều kiện `Product.status === 'ACTIVE'`, `Category.isActive`, và `Brand.isActive` ngay khi thêm/sửa/merge giỏ hàng và làm sạch/cảnh báo item không còn khả dụng).
