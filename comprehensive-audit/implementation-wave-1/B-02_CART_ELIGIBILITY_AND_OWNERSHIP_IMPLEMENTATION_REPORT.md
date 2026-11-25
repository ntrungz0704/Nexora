# NEXORA — IMPLEMENTATION REPORT: B-02 CART ELIGIBILITY & OWNERSHIP VALIDATION

- **Task ID:** `B-02`
- **Severity:** `P1` (Security / Business Integrity)
- **Wave / Phase:** Implementation Wave 1 — Task B-02
- **Date:** `2026-11-25`
- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` (`fix(catalog): dong bo danh muc category va toi uu anh san pham laptop`)
- **Final Verdict:** **`PASS`**

---

## 1. Executive Summary

Đã hoàn thành triển khai sửa toàn bộ ba nhóm lỗi trong phạm vi **B-02 (`CartService.addItem`, `CartService.mergeGuestCartToUser`, `CartService.updateItem`, và `CartController`)**:

- **`addItem`:** Bổ sung kiểm tra nghiêm ngặt `product.status === 'ACTIVE'`, `category.isActive === true`, và `brand.isActive === true` khi `brandId !== null` (cho phép `brandId === null`), kiểm tra số lượng nguyên dương `>= 1` (từ chối `0`, âm, thập phân, `NaN`), và thực thi kiểm tra cộng dồn `(existingItem.quantity + qty) <= product.stockQuantity` bên trong `$transaction` có khóa hàng InnoDB.
- **`mergeGuestCartToUser`:** Bổ sung kiểm tra lại trạng thái `Product`, `Category.isActive`, `Brand.isActive`, và `stockQuantity` tại thời điểm merge dưới khóa `FOR SHARE`, không merge các sản phẩm thuộc danh mục/thương hiệu ẩn hoặc ngừng bán (trả `warnings` rõ ràng, giữ nguyên tính idempotent khi replay).
- **`updateItem` (Security & Eligibility):** Đóng lỗ hổng **IDOR** bằng cách khóa bản ghi `cart_items` join `carts` (`FOR UPDATE`), xác minh chủ sở hữu (`userId` đối với tài khoản đăng nhập hoặc `user_id IS NULL AND guest_session_id = cleanGuest` đối với phiên khách), từ chối mạo danh `cartId` (`403 FORBIDDEN`) mà không rò rỉ dữ liệu hay sửa giỏ hàng khác, chặn `quantity <= 0` (`400 INVALID_QUANTITY`), và kiểm tra `Product`/`Category`/`Brand` + tồn kho dưới khóa `FOR SHARE` trước khi cập nhật.
- **Kiểm chứng toàn diện:** Prettier (`All matched files use Prettier code style!`), TypeScript (`typecheck`), ESLint (`0` errors/warnings), Unit Tests (`14/14` files, `152/152` PASS), Build (`tsc` + Vite), và `10/10` bộ API Integration / Security / Concurrency (`131/131` PASS) + `tests/db.integration.test.ts` (`1/1` PASS) trên **MySQL 8.4 cô lập (`127.0.0.1:3307/nexora_test`)** trong khi **Dev DB (`127.0.0.1:3306/nexora`, `845` dòng trên `27` bảng) không đổi 100%**.

---

## 2. Root Cause từng lỗi

### B-02.1 — `CartService.addItem` & `CartController.addItem`
1. `CartController.addItem` dùng `req.body.quantity ? parseInt(req.body.quantity, 10) : 1` khiến `quantity = 0` bị ép thành `1`, đồng thời chấp nhận `NaN`/chuỗi không chuẩn (`"1.5abc"`).
2. `CartService.addItem` dùng `Math.max(1, params.quantity ?? 1)` tiếp tục biến `0`/số âm thành `1`, không `include` bảng `category` và `brand` nên bỏ qua `category.isActive` và `brand.isActive`.
3. Kiểm tra tồn kho chỉ so sánh `product.stockQuantity < qty` trước khi cộng với `existingItem.quantity`, cho phép cộng dồn vượt tồn kho khi thêm nhiều lần hoặc đồng thời; và không bọc kiểm tra/cập nhật trong `$transaction` có khóa hàng nên dễ dính race condition.

### B-02.2 — `CartService.mergeGuestCartToUser`
1. Truy vấn `guestCart.items` chỉ `include: { product: true }` mà không tải `category` và `brand`, dẫn đến việc chỉ kiểm tra `product.status === 'ACTIVE'` mà không chặn sản phẩm có `Category.isActive === false` hoặc `Brand.isActive === false` tại thời điểm merge.
2. Việc đọc `guestCart` diễn ra trước khi khóa `users` và chưa khóa `userCart` / `products/categories/brands` theo thứ tự chuẩn nên có thể đọc snapshot trước khi Admin ẩn danh mục hoặc trong lúc user thao tác giỏ hàng đồng thời.

### B-02.3 — `CartService.updateItem` & `CartController.updateItem`
1. `CartService.updateItem` thực thi thẳng `prisma.cartItem.update({ where: { id: params.cartItemId }, ... })` và `prisma.cartItem.delete(...)` mà **không kiểm tra `cartItem` thuộc về `userId` hay `guestSessionId` hiện tại** -> lỗ hổng **IDOR** nghiêm trọng.
2. `CartController.updateItem` gọi `BigInt(req.params.id)` không kiểm tra định dạng nguyên dương, bỏ qua nếu client truyền `cartId` giả mạo trong body, và cho phép `quantity <= 0` tự xóa item thay vì tách về endpoint `DELETE /cart/items/:id`.
3. `updateItem` hoàn toàn không kiểm tra `Product.status`, `Category.isActive`, `Brand.isActive`, hay `stockQuantity` khi cập nhật số lượng.

---

## 3. Files Created / Modified

| Trạng thái | Đường dẫn đầy đủ | Mục đích |
| --- | --- | --- |
| Modified | `D:\Nexora\apps\api\src\modules\cart\cart.controller.ts` | Trim `guestSessionId`, parse nguyên dương chặt chẽ cho `productId`/`quantity`/`cartItemId`, nhận & validate optional `requestedCartId` |
| Modified | `D:\Nexora\apps\api\src\modules\cart\cart.service.ts` | Thêm helper kiểm tra điều kiện kinh doanh & ownership (`assertProductEligibleForCart`, `getMergeIneligibilityReason`, `lockProductDependenciesShare`, `isCallerCartOwner`, `assertRequestedCartOwned`, xử lý `P2002` trong `getOrCreateCart`), cập nhật `addItem`, `updateItem`, và `mergeGuestCartToUser` |
| Created | `D:\Nexora\apps\api\tests\b02_cart_eligibility_and_ownership.test.ts` | Bộ kiểm thử tích hợp Supertest + Prisma + MySQL 8.4 bao phủ 37 kịch bản (Add, Merge, IDOR, Update/Stock, Concurrency) |
| Created | `D:\Nexora\comprehensive-audit\implementation-wave-1\B-02_CART_ELIGIBILITY_AND_OWNERSHIP_IMPLEMENTATION_REPORT.md` | Báo cáo nghiệm thu triển khai B-02 |

---

## 4. Logic trước và sau khi sửa

| Phương thức | Trước khi sửa | Sau khi sửa |
| --- | --- | --- |
| **`CartController.addItem` / `updateItem`** | `parseInt(...)`, falsy `0 -> 1`, `BigInt(id)` chưa guard, không kiểm tra `cartId` trong body | `parsePositiveInt` / `parsePositiveBigInt` từ chối `<= 0`, float, non-digit với `400`; chuyển `requestedCartId` cho Service xác minh quyền `403` |
| **`CartService.getOrCreateCart`** | User không tồn tại fall back tạo guest cart; `create` không bắt `P2002` | User không tồn tại trả `401 UNAUTHORIZED`; bắt `P2002` khi 2 request tạo giỏ hàng đầu tiên đồng thời |
| **`CartService.addItem`** | Chỉ check `product.status === 'ACTIVE'` và `stockQuantity >= qty`; ngoài transaction | Validate `qty > 0`, pre-check eligibility (tránh tạo shell cart rác), khóa `carts FOR UPDATE` + `products/categories/brands FOR SHARE`, kiểm tra `(existing.quantity + qty) <= stockQuantity` trong `$transaction` |
| **`CartService.mergeGuestCartToUser`** | Chỉ check `product.status === 'ACTIVE'` và `stockQuantity > 0` | Khóa theo thứ tự `guestCart -> users -> userCart -> products/categories/brands FOR SHARE`; skip với warning nếu Product/Category/Brand không còn active hoặc hết hàng; cộng dồn & cap `<= stockQuantity`; giữ idempotent |
| **`CartService.updateItem`** | Không check owner, xóa nếu `qty <= 0`, không check Product/Category/Brand/stock | Từ chối `qty <= 0` (`400 INVALID_QUANTITY`); khóa `cart_items JOIN carts FOR UPDATE`; check `userId` / `guestSessionId` + `requestedCartId` (`403 FORBIDDEN`); khóa `FOR SHARE` & check Product/Category/Brand/stock trước khi `update` |

---

## 5. Ownership / Security Model

1. **Authenticated User (`params.userId !== undefined`):**
   - Chủ sở hữu hợp lệ khi và chỉ khi bản ghi `carts` có `user_id !== null && Number(cart.user_id) === Number(params.userId)`.
   - Ngay cả khi browser của user đã đăng nhập gửi kèm header `x-guest-session-id` (hành vi chuẩn của `cartService.ts` trên frontend), quyền thao tác luôn gắn chặt theo `userId` từ JWT đã xác thực (`requireAuth` / `optionalAuth`), tuyệt đối không cho phép chạm vào giỏ hàng của `userId` khác hay guest cart khác qua `updateItem`.
2. **Guest Session (`params.userId === undefined`):**
   - Bắt buộc có `guestSessionId` non-empty (sau `.trim()`). Nếu thiếu cả `userId` và `guestSessionId` -> `401 UNAUTHORIZED` ở `updateItem` (hoặc `400 CART_IDENTIFIER_REQUIRED` ở `addItem`).
   - Chủ sở hữu hợp lệ khi và chỉ khi `cart.user_id === null && cart.guest_session_id === cleanGuestSessionId`. Guest không thể cập nhật giỏ hàng của Guest khác hay giỏ hàng đã gắn `userId`.
3. **Anti-`cartId` Spoofing (`requestedCartId`):**
   - Nếu client gửi `cartId` trong body của `POST /cart/items` hoặc `PATCH /cart/items/:id`:
     - `assertRequestedCartOwned` kiểm tra `targetCart` tồn tại và thuộc chính caller trước khi tạo/sửa; trong transaction của `updateItem` kiểm tra lại `row.cart_id === requestedCartId`. Bất kỳ sai lệch hoặc `cartId` không thuộc caller đều trả `403 FORBIDDEN`.
4. **Zero Information Leakage:**
   - Lỗi `403 FORBIDDEN` trả thông điệp chung (`"Bạn không có quyền chỉnh sửa sản phẩm trong giỏ hàng này."` / `"Bạn không có quyền thao tác trên giỏ hàng này."`), không trả `cartItem`, `productName`, `subtotal`, hay `cartId` của nạn nhân.

---

## 6. Các trường hợp IDOR đã kiểm thử

Tất cả đều được kiểm chứng qua HTTP Supertest + MySQL 8.4 thực tế tại `apps/api/tests/b02_cart_eligibility_and_ownership.test.ts`:

1. User A cập nhật `cartItemId` thuộc giỏ hàng của User A -> `200 OK`, cập nhật đúng DB.
2. User A thay `cartItemId` thành item của User B (`PATCH /api/v1/cart/items/:itemBId`) -> `403 FORBIDDEN`, DB User B giữ nguyên (`quantity = 2`), response không lộ tên sản phẩm hay `cartB.id`.
3. User A truyền `cartId` của User B trong body của `PATCH /cart/items/:itemAId` -> `403 FORBIDDEN`, cả item A và cart B không đổi.
4. User A truyền `cartId` của User B trong body của `POST /cart/items` -> `403 FORBIDDEN`, cart B không bị thêm sản phẩm.
5. Guest session A cập nhật `cartItemId` thuộc Guest session B -> `403 FORBIDDEN`, item Guest B giữ nguyên (`quantity = 2`).
6. Guest session A cập nhật `cartItemId` thuộc Authenticated User B -> `403 FORBIDDEN`, item User B giữ nguyên.
7. Request ẩn danh (không JWT, không `x-guest-session-id`) gọi `PATCH /cart/items/:itemBId` -> `401 UNAUTHORIZED`, item User B giữ nguyên.

---

## 7. Transaction / Concurrency Strategy

1. **Thứ tự khóa không vòng lặp (Deadlock-Free Lock Ordering DAG):**
   - `addItem` / `updateItem`: `carts` (hoặc `cart_items JOIN carts`) **`FOR UPDATE`** -> `products INNER JOIN categories LEFT JOIN brands` **`FOR SHARE`**.
   - `mergeGuestCartToUser`: `guestCart` **`FOR UPDATE`** -> `users` **`FOR UPDATE`** -> `userCart` **`FOR UPDATE`** -> `products INNER JOIN cart_items INNER JOIN categories LEFT JOIN brands` **`FOR SHARE`**.
   - Nhờ khóa `FOR SHARE` trên sản phẩm/danh mục/thương hiệu chạy **trước** mọi câu `SELECT` non-locking của Prisma trong `tx`, mọi thay đổi đồng thời từ Admin (tạm ẩn sản phẩm/danh mục/thương hiệu hoặc giảm tồn kho) đều được đợi commit xong và nhìn thấy ngay trong consistent read-view của MySQL InnoDB (`REPEATABLE READ`).
2. **Xử lý `BigInt` trên `$queryRaw` MySQL 8.4:**
   - Trong quá trình test thực tế, phát hiện Prisma MySQL `$queryRaw` trả về các cột `UNSIGNED INT` (`product_id`, `user_id`) dưới dạng JS `BigInt` (ví dụ `35n`), gây lỗi `Expected Int, provided BigInt` nếu truyền thẳng vào `where: { id }`. Đã ép kiểu tường minh `Number(row.product_id)`, `row.user_id !== null ? Number(row.user_id) : null`, và `BigInt(row.cart_id)`.
3. **Kiểm chứng đồng thời thực tế:**
   - Hai request `addItem(3)` đồng thời trên sản phẩm `stockQuantity = 4`: 1 thành công (`200`), 1 từ chối (`400 INSUFFICIENT_STOCK`), giỏ hàng cuối cùng là `3` (không vượt `4`).
   - Hai request `PATCH` đồng thời (`8` và `15` trên `stock = 10`): 1 thành công (`200`), 1 từ chối (`400`), DB là `8`.
   - Giao dịch Admin giữ khóa `FOR UPDATE` trên `categories` rồi chuyển `isActive = false` trong lúc `updateItem` chạy song song: `updateItem` chờ khóa `FOR SHARE` xong và từ chối `400 PRODUCT_UNAVAILABLE`, giữ nguyên số lượng `8`.

---

## 8. Regression Test Matrix và Kết quả

Môi trường thực thi: MySQL `8.4.13` cô lập (`nexora-b02-test-db`, container ID `b6d48d324eda`, port `127.0.0.1:3307`, DB `nexora_test`).

### Ma trận 37 yêu cầu (`apps/api/tests/b02_cart_eligibility_and_ownership.test.ts` + toàn bộ suites hồi quy)

| Nhóm | Yêu cầu Section 9 | Test / Suite chứng minh | Kết quả |
| --- | --- | --- | --- |
| **Add to Cart (1-10)** | Active all (1), Product/Cat/Brand inactive (2-4), `brandId=null` (5), valid add (6), accumulate <= stock (7), overflow (8), qty <= 0 (9), failed request no mutation (10), concurrent addItem race | `b02_cart_eligibility_and_ownership.test.ts` Group 1 (`4/4` tests) | **PASS** |
| **Guest Cart Merge (11-18)** | Valid merge (11), Product/Cat/Brand inactive skipped (12-14), accumulate (15), stock capping + warning (16), replay idempotency (17), existing merge parity (18) | `b02_cart_eligibility_and_ownership.test.ts` Group 2 + `phase_b_cart_merge.test.ts` (`14/14` tests) | **PASS** |
| **Ownership / IDOR (19-25)** | Own update (19), cross-user cart/item (20, 22), spoofed `cartId` (21), cross-guest & guest-vs-user & anon (23), zero info leak (24), target cart unchanged (25) | `b02_cart_eligibility_and_ownership.test.ts` Group 3 | **PASS** |
| **Update & Stock (26-32)** | Inactive product/cat/brand block (26-28), valid stock (29), overflow block (30), qty <= 0 block, concurrent update & mid-flight cat deactivation (31), no corrupt state on failure (32) | `b02_cart_eligibility_and_ownership.test.ts` Group 4 (`2/2` tests) | **PASS** |
| **Regression (33-37)** | Existing cart, Guest Merge, Checkout/B-01 Order Eligibility, RBAC, Concurrency, Returns, Auth, Security | 10 API suites (`131/131` tests PASS) + `db.integration.test.ts` (`1/1` PASS) + `npm run test:unit` (`152/152` PASS) | **PASS** |

### Bảng kết quả từng suite trong lần chạy sau chỉnh sửa cuối (`task-23898`)

| Suite (`DATABASE_URL=mysql://...@127.0.0.1:3307/nexora_test`) | Tests | Kết quả | Thời gian |
| --- | --- | --- | --- |
| `apps/api/tests/b02_cart_eligibility_and_ownership.test.ts` | 8 | **8 PASS** | 903ms |
| `apps/api/tests/b01_order_product_eligibility.test.ts` | 11 | **11 PASS** | 1016ms |
| `apps/api/tests/phase_b_returns_and_admin_crud.test.ts` | 30 | **30 PASS** | 819ms |
| `apps/api/tests/phase_b_cart_merge.test.ts` | 14 | **14 PASS** | 714ms |
| `apps/api/tests/phase_a_security_remediation.test.ts` | 25 | **25 PASS** | 662ms |
| `apps/api/tests/commerce_and_ai.integration.test.ts` | 11 | **11 PASS** | 631ms |
| `apps/api/tests/rbac_and_concurrency.test.ts` | 10 | **10 PASS** | 550ms |
| `apps/api/tests/payment_security.test.ts` | 13 | **13 PASS** | 364ms |
| `apps/api/tests/seed_and_auth_credentials.test.ts` | 2 | **2 PASS** | 333ms |
| `apps/api/tests/storefront.integration.test.ts` | 7 | **7 PASS** | 278ms |
| `npm run test:integration -w @nexora/api` (`tests/db.integration.test.ts`) | 1 | **1 PASS** | 42ms |
| **Tổng Integration / Security / Concurrency** | **132** | **132 PASS** | **12.34s** |

---

## 9. Prettier, Typecheck, Lint, Unit, Integration & Build

| Cổng kiểm tra | Lệnh thực thi | Kết quả |
| --- | --- | --- |
| **Prettier** | `npx prettier --check apps/api/src/modules/cart/cart.controller.ts apps/api/src/modules/cart/cart.service.ts apps/api/tests/b02_cart_eligibility_and_ownership.test.ts` | **PASS** (`All matched files use Prettier code style!`) |
| **Typecheck** | `npm run typecheck` | **PASS** (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` — exit `0`) |
| **Lint** | `npm run lint` (`eslint .`) | **PASS** (`0 errors, 0 warnings` — exit `0`) |
| **Unit Tests** | `npm run test:unit` (bao gồm cả `m6_1_guest_cart_merge.test.tsx`, `po_bug_01_quantity_input.test.tsx`, `m6_5_customer_integration_qa.test.tsx`) | **PASS** (`14/14` files, `152/152` tests — `19.98s`) |
| **Integration Tests** | `run_b02_isolated_tests.ps1` trên `127.0.0.1:3307/nexora_test` | **PASS** (`10/10` suites `131/131` + `db.integration` `1/1`) |
| **Build** | `npm run build` | **PASS** (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` Vite `395ms` — exit `0`) |
| **Live Servers** | `GET http://127.0.0.1:3000/api/v1/health` & `GET http://127.0.0.1:5173` | **PASS** (`API database=up`, Vite `200`) |

---

## 10. Dev DB Snapshot BEFORE / AFTER

- **Target Dev DB:** `127.0.0.1:3306/nexora` (container `7ffc1a14a558`)
- **Snapshot BEFORE (`b02_verify/dev_db_before.json`):** `27` bảng, tổng **`845`** dòng (`products: 674`, `categories: 22`, `brands: 31`, `carts: 31`, `cart_items: 2`, `orders: 2`, `order_items: 2`, `users: 3`, `wishlists: 1`, `return_requests: 0`).
- **Snapshot AFTER (`b02_verify/dev_db_after.json`):** `27` bảng, tổng **`845`** dòng — khớp **100%** từng bảng (`DEV_DB_IMMUTABILITY_CHECK=MATCH_100_PERCENT`).
- Container tạm `nexora-b02-test-db` đã được xóa bỏ hoàn toàn sau khi chạy.

---

## 11. Git Branch, HEAD, Status & Diff Summary

- **Branch:** `main`
- **HEAD Commit:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6`
- **Diff Summary (phạm vi B-02):**
  - `apps/api/src/modules/cart/cart.controller.ts | 64 +++-`
  - `apps/api/src/modules/cart/cart.service.ts | 422 ++++++++++++++++++++++-----`
  - Tổng B-02 tracked diff: `2 files changed, 410 insertions(+), 76 deletions(-)`
- **Working tree tracked files khác (từ các task đã duyệt trước):** `order.service.ts` (B-01), `ProductDetailPage.tsx` / `CartPage.tsx` / `index.css` (PO-BUG-01), `productImage.ts` (DEF-RT-01).
- **Untracked mới tạo trong B-02:** `apps/api/tests/b02_cart_eligibility_and_ownership.test.ts`, `comprehensive-audit/implementation-wave-1/B-02_CART_ELIGIBILITY_AND_OWNERSHIP_IMPLEMENTATION_REPORT.md`.
- **Stage / Commit / Push:** Không thực hiện stage, commit hoặc push.

---

## 12. Các vấn đề chưa giải quyết (Ghi nhận riêng ngoài phạm vi B-02)

1. **`CartService.removeItem` (`DELETE /api/v1/cart/items/:id`, `apps/api/src/modules/cart/cart.service.ts:459-469`):**
   - Hiện tại phương thức `removeItem` vẫn gọi trực tiếp `this.prisma.cartItem.delete({ where: { id: params.cartItemId } })` mà **chưa xác minh ownership** đối với `userId` / `guestSessionId` (tiềm ẩn IDOR xóa cart item của người khác bằng cách đổi `:id`).
   - Do **Section 3 & Section 11** giới hạn phạm vi sửa chỉ gồm `addItem`, `mergeGuestCartToUser`, và `updateItem`, và cấm sửa các lỗi ngoài phạm vi phát hiện thêm, `removeItem` được **giữ nguyên và ghi nhận riêng tại đây** để Project Owner phê duyệt bổ sung ở task bảo mật giỏ hàng tiếp theo (tái sử dụng `isCallerCartOwner` vừa xây dựng).
2. **Các task chưa triển khai theo khóa phạm vi:** `B-03`, `B-04`, `B-05`, `PO-BUG-02` được giữ nguyên hoàn toàn chưa chỉnh sửa.

---

## 13. Final Verdict

**`PASS`** — Toàn bộ tiêu chí chấp nhận của **B-02** (`addItem`, `mergeGuestCartToUser`, `updateItem` eligibility, stock accumulation & concurrency locks, ownership & anti-IDOR protection, 37 test scenarios, Prettier/TypeScript/Lint/Unit/Integration/Build, Dev DB immutability) đều đạt 100%. Dừng tại đây chờ Project Owner review trước khi nhận task tiếp theo.
