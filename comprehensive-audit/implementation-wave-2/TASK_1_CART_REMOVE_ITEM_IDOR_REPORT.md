# NEXORA — WAVE 2 TASK 1 REPORT: `CartService.removeItem` IDOR SECURITY FIX

- **Task ID:** `WAVE2-TASK-1` (`CartService.removeItem IDOR`)
- **Severity:** `P1 High (Security — IDOR)`
- **Date:** `2026-11-26`
- **Branch:** `main`
- **Parent Baseline Commit:** `34676a6194b701a0182a131b7ffd64ee081b506b`
- **Commit Message:** `fix(cart): bao ve ownership khi xoa cart item` _(SHA-1 thực tế ghi nhận tại `WAVE_2_FINAL_ACCEPTANCE_REPORT.md` sau commit, không dùng `--amend`)_
- **Verdict:** **`PASS`**

---

## 1. Root Cause Analysis

Trước khi sửa:

1. Tại `apps/api/src/modules/cart/cart.service.ts` (`removeItem`), hàm gọi trực tiếp `this.prisma.cartItem.delete({ where: { id: params.cartItemId } })` và hoàn toàn bỏ qua `params.userId` và `params.guestSessionId` (không kiểm tra quyền sở hữu ở tầng service lẫn tầng database, cũng không bắt lỗi `P2025` khi item không tồn tại).
2. Tại `apps/api/src/modules/cart/cart.controller.ts` (`removeItem`), controller ép `BigInt(req.params.id as string)` trực tiếp (gây `SyntaxError` 500 nếu `:id` không phải số nguyên dương) và không kiểm tra `cartId` giả mạo nếu client truyền trong body/query.
3. Kết quả: bất kỳ caller nào (anonymous không đăng nhập/không session, Guest A, Customer A) đều có thể xóa `CartItem` trong giỏ hàng của người khác chỉ bằng cách thay đổi `:id`.

---

## 2. Files Created / Modified

| Status   | File Path                                                                          | Summary                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `apps/api/src/modules/cart/cart.controller.ts`                                     | Parse `:id` bằng `parsePositiveBigInt` (`400 VALIDATION_ERROR` thay vì `SyntaxError`), parse optional `requestedCartId` từ body/query                                                                                |
| Modified | `apps/api/src/modules/cart/cart.service.ts`                                        | Bắt buộc danh tính `userId` / `guestSessionId`, xác thực `requestedCartId`, khóa hàng `FOR UPDATE` trong `$transaction`, đối chiếu `isCallerCartOwner`, xóa có điều kiện ownership tại DB (`tx.cartItem.deleteMany`) |
| Created  | `apps/api/tests/task1_cart_remove_item_idor.test.ts`                               | Bộ integration tests cô lập bao phủ 10/10 kịch bản IDOR, ownership, guest, validation, concurrency và merge                                                                                                          |
| Created  | `comprehensive-audit/implementation-wave-2/TASK_1_CART_REMOVE_ITEM_IDOR_REPORT.md` | Báo cáo nghiệm thu Task 1                                                                                                                                                                                            |

---

## 3. Implementation Details & Policy Consistency

- **Xác thực danh tính tại Service layer:** `CartService.removeItem` kiểm tra `params.cartItemId > 0n` (`400 VALIDATION_ERROR`) và yêu cầu `params.userId !== undefined || cleanGuest` (`401 UNAUTHORIZED`). Do đó, kể cả khi gọi trực tiếp `CartService.removeItem` ngoài HTTP controller vẫn được bảo vệ.
- **Nhất quán với `updateItem` (B-02):**
  - Tái sử dụng cùng cơ chế `assertRequestedCartOwned` + `isCallerCartOwner` như `updateItem` và `addItem`.
  - Khi caller đã đăng nhập (`userId !== undefined`), `isCallerCartOwner` ưu tiên `userId` (`cart.userId === userId`) và bỏ qua `x-guest-session-id` kèm theo — ngăn authenticated user giả mạo header guest để xóa giỏ của guest khác.
- **Chống TOCTOU & Ownership ở mức DB:**
  - Trong `prisma.$transaction`, khóa dòng `cart_items JOIN carts` bằng `SELECT ... FOR UPDATE`.
  - Không tìm thấy -> `404 CART_ITEM_NOT_FOUND`.
  - Sai `requestedCartId` hoặc `!isCallerCartOwner` -> `403 FORBIDDEN` với thông báo chung, không tiết lộ `cartId`, tên sản phẩm hay chủ sở hữu thật.
  - Thực thi `tx.cartItem.deleteMany` kèm điều kiện `cart: userId !== undefined ? { userId } : { userId: null, guestSessionId: cleanGuest }`, đảm bảo DELETE ở mức database luôn bị giới hạn trong giỏ hợp lệ của caller.
- **Bảo toàn hành vi dọn item cũ:** Chủ sở hữu vẫn được phép xóa item trong giỏ của chính mình ngay cả khi sản phẩm đó sau này chuyển sang `INACTIVE`.

### API Behavior Trước / Sau (`DELETE /api/v1/cart/items/:id`)

| Tình huống                                         | Trước khi sửa                                 | Sau khi sửa                                                   |
| -------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Customer A xóa item của Customer A                 | `200 OK`                                      | `200 OK` (trả `CartSummaryDto` cập nhật)                      |
| Customer A xóa item của Customer B                 | **`200 OK` (xóa thành công — IDOR)**          | **`403 FORBIDDEN`**, DB Customer B giữ nguyên, zero info leak |
| Guest A xóa item của Guest A                       | `200 OK`                                      | `200 OK`                                                      |
| Guest A xóa item của Guest B / Customer B          | **`200 OK` (IDOR)**                           | **`403 FORBIDDEN`**, DB mục tiêu giữ nguyên                   |
| Customer A giả mạo `cartId` / `x-guest-session-id` | Bị bỏ qua / xóa xuyên giỏ                     | **`403 FORBIDDEN`**                                           |
| Thiếu JWT và thiếu `x-guest-session-id`            | Xóa item rồi lỗi `400` khi summary (**IDOR**) | **`401 UNAUTHORIZED`**, không chạm DB                         |
| Item không tồn tại (`999999999`)                   | `500 INTERNAL_SERVER_ERROR` (`P2025`)         | **`404 CART_ITEM_NOT_FOUND`**                                 |
| Param `:id` không hợp lệ (`abc`, `0`)              | `500` (`SyntaxError`)                         | **`400 VALIDATION_ERROR`**                                    |

---

## 4. Regression Test Cases & Results

Thực thi tại `apps/api/tests/task1_cart_remove_item_idor.test.ts` cùng các suite liên quan trên **MySQL 8.4 cô lập (`127.0.0.1:3307/nexora_test`)**:

| Kịch bản yêu cầu                                                              | Test chứng minh                                                                                                                                                                     | Kết quả                       |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1. Customer A xóa item thuộc cart A thành công                                | `task1_cart_remove_item_idor.test.ts` (Cases 1,2,3,8)                                                                                                                               | **PASS**                      |
| 2. Customer A không xóa được item thuộc cart B (HTTP + direct service)        | `task1_cart_remove_item_idor.test.ts` (Cases 1,2,3,8)                                                                                                                               | **PASS** (`403 FORBIDDEN`)    |
| 3. Customer B không xóa được item thuộc cart A                                | `task1_cart_remove_item_idor.test.ts` (Cases 1,2,3,8)                                                                                                                               | **PASS** (`403 FORBIDDEN`)    |
| 4. Guest A xóa item của guest A thành công (kể cả sp ngừng bán)               | `task1_cart_remove_item_idor.test.ts` (Cases 4,5)                                                                                                                                   | **PASS**                      |
| 5. Guest A không xóa được item của guest B / user B & spoof header bị chặn    | `task1_cart_remove_item_idor.test.ts` (Cases 4,5)                                                                                                                                   | **PASS** (`403 FORBIDDEN`)    |
| 6. Không tồn tại cart item (`404`) & malformed id (`400`) + concurrent delete | `task1_cart_remove_item_idor.test.ts` (Cases 6,7)                                                                                                                                   | **PASS**                      |
| 7. Request thiếu authentication / guest session phù hợp                       | `task1_cart_remove_item_idor.test.ts` (Cases 6,7)                                                                                                                                   | **PASS** (`401 UNAUTHORIZED`) |
| 8. Không xóa nhầm item khác cùng giỏ hay khác giỏ                             | `task1_cart_remove_item_idor.test.ts` (Cases 1,2,3,8)                                                                                                                               | **PASS**                      |
| 9. Guest Cart Merge vẫn hoạt động sau remove                                  | `task1_cart_remove_item_idor.test.ts` (Cases 9,10) + `phase_b_cart_merge.test.ts` (`14/14`)                                                                                         | **PASS**                      |
| 10. `updateItem` / `getCart` / B-01 / Storefront không regression             | `b02_cart_eligibility_and_ownership.test.ts` (`8/8`), `b01_order_product_eligibility.test.ts` (`11/11`), `storefront.integration.test.ts` (`7/7`), `db.integration.test.ts` (`1/1`) | **PASS**                      |

---

## 5. Quality Gates & Database Isolation Evidence

- **Prettier (`cart.controller.ts`, `cart.service.ts`, `task1_cart_remove_item_idor.test.ts`):** PASS (`All matched files use Prettier code style!`).
- **Typecheck (`npm run typecheck`):** PASS (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`).
- **ESLint (`npm run lint`):** PASS (`0` errors).
- **Unit Tests (`npm run test:unit`):** PASS — `14/14` files, `152/152` tests.
- **Build (`npm run build`):** PASS (`584ms` cho web bundle).
- **Isolated Integration DB:** `nexora-wave2-test-db` (`mysql:8.4`, `--tmpfs /var/lib/mysql`, `127.0.0.1:3307/nexora_test`, `8` Prisma migrations + synthetic seed):
  - `5` integration suites: `44/44` tests PASS (`b01`: `11`, `b02`: `8`, `phase_b_cart_merge`: `14`, `task1`: `4`, `storefront`: `7`).
  - `npm run test:integration -w @nexora/api` (`db.integration.test.ts`): `1/1` test PASS.
- **Dev DB Integrity (`127.0.0.1:3306/nexora`):** Snapshot check BEFORE vs AFTER -> `DEV_DB_IMMUTABILITY_CHECK=MATCH_100_PERCENT tables=26 totalRows=837`.

---

## 6. Out-of-Scope Issues Noted (Unchanged in Task 1)

- `B-03` (AiService visibility), `B-04` (Catalog & Marketing visibility), `B-05` (Category & Brand soft delete) sẽ được xử lý lần lượt ở Task 2, Task 3, Task 4.
- `GET /api/v1/cart` vẫn tạo dòng `carts` rỗng cho mỗi guest session mới (`DEF-RT-16`) — ngoài phạm vi Task 1, giữ nguyên.
