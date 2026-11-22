# BÁO CÁO ĐỐI SOÁT CHUYÊN SÂU MILESTONE M5 (TARGETED EVIDENCE VERIFICATION ADDENDUM)

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System.
- **Mã tài liệu:** `PHASE_B_M5_FINAL_AUDIT_ADDENDUM.md`
- **Mốc đối soát:** Sau Commit `3c42638` và Báo cáo nghiệm thu `f39a303`.
- **Mục tiêu:** Rà soát thực chứng độc lập 5 nhóm vấn đề kỹ thuật trọng tâm theo yêu cầu của Tech Lead mà không mở rộng phạm vi, không làm Frontend và không bắt đầu Milestone M6.

---

## 1. Kết Quả 5 Nhóm Kiểm Tra Chi Tiết

### Nhóm 1: `deliveredAt` — Thời Hạn Đổi Trả 7 Ngày

| Câu hỏi kiểm tra                                                                        | Kết quả thực tế trong mã nguồn                                                                                                                                                                                                                                                                                                                                                                                                | File Path & Bằng chứng                                                                                | Đánh giá |
| :-------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :------: |
| **1. `deliveredAt` được gán ở đâu khi đơn hàng chuyển sang `DELIVERED`?**               | Được gán duy nhất tại `OrderService.adminUpdateOrderStatus` khi `status === 'DELIVERED'` và `order.deliveredAt` đang rỗng: `updateData.deliveredAt = new Date()`.                                                                                                                                                                                                                                                             | `apps/api/src/modules/order/order.service.ts` (Dòng 524–532)                                          | **PASS** |
| **2. Có đường cập nhật trạng thái nào bỏ qua việc gán `deliveredAt` không?**            | Không. Trong toàn bộ mã nguồn backend, chỉ có duy nhất một hàm thực hiện cập nhật `orderStatus` sang `DELIVERED` là `adminUpdateOrderStatus` (được gọi từ endpoint `PATCH /api/v1/admin/orders/:id/status`). Luồng thanh toán online (`payment.service.ts`) chỉ cập nhật `paymentStatus`, không chuyển `orderStatus` sang `DELIVERED`.                                                                                        | `apps/api/src/modules/order/order.service.ts` (Dòng 515–545)                                          | **PASS** |
| **3. Có trường hợp nào sử dụng `updatedAt` để thay thế `deliveredAt` không?**           | **CÓ.** Tại `return.service.ts` dòng 146: `const deliveryDate = order.deliveredAt \|\| order.updatedAt;`. Nếu `order.deliveredAt` bị NULL, hệ thống dùng `updatedAt` làm mốc tính 7 ngày.                                                                                                                                                                                                                                     | `apps/api/src/modules/order/return.service.ts` (Dòng 145–150)                                         | **FAIL** |
| **4. Migration backfill đơn hàng lịch sử được thực hiện bằng logic nào?**               | Sử dụng câu lệnh SQL trong migration: `UPDATE orders SET delivered_at = updated_at WHERE order_status = 'DELIVERED' AND delivered_at IS NULL;`. Chỉ có đúng 1 đơn hàng seed lịch sử `NX-2026-0001` ở trạng thái `DELIVERED` được gán `delivered_at`.                                                                                                                                                                          | `prisma/migrations/20261122140000_add_returns_workflow_and_order_delivered_at/migration.sql` (Dòng 3) | **PASS** |
| **5. Nếu dữ liệu lịch sử không có thời điểm giao hàng đáng tin cậy thì xử lý thế nào?** | TechPilot gốc không hề có trường `delivered_at` và không có logic kiểm tra thời hạn 7 ngày trong `ProfileController.php` (chỉ kiểm tra `order['status'] === 'completed'`). Trong Nexora, nếu một đơn hàng `DELIVERED` bị thiếu `deliveredAt`, việc fallback sang `updatedAt` tạo ra rủi ro: nếu đơn hàng bị cập nhật (ví dụ cập nhật ghi chú hoặc địa chỉ), `updatedAt` nhảy về `NOW()`, mở lại thời hạn 7 ngày sai quy định. | `apps/api/src/modules/order/return.service.ts` (Dòng 146)                                             | **FAIL** |

**Kết luận Nhóm 1:** **FAIL cục bộ tại dòng fallback code `return.service.ts:146`**. Cơ sở dữ liệu và quy trình gán `deliveredAt` mới là chuẩn xác, nhưng logic fallback sang `updatedAt` là một sai khác nghiệp vụ cần được loại bỏ.

---

### Nhóm 2: Tính Đầy Đủ Của Admin CRUD Scope (Admin CRUD Completeness)

Phân tích đối chiếu toàn bộ các phân hệ Admin CRUD giữa TechPilot, Phase B Execution Plan (`Stream 2`), và mã nguồn hiện hành của Nexora:

| Module Quản trị               | Hành vi TechPilot gốc                                                                 | Yêu cầu Phase B Plan                                                                                                  | Endpoint Nexora hiện có                                                                                                                                           | Bằng chứng Kiểm thử                                                  | Trạng thái |
| :---------------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- | :--------: |
| **Danh mục (Categories)**     | Xem danh sách, tạo, sửa, xóa (chặn xóa nếu có sản phẩm)                               | Bổ sung `DELETE /admin/categories/:id`, chặn cascade, chặn khi có sản phẩm hoặc danh mục con                          | `GET /admin/categories`<br>`POST /admin/categories`<br>`PUT /admin/categories/:id`<br>`DELETE /admin/categories/:id`                                              | `CAT-01` đến `CAT-05` trong `phase_b_returns_and_admin_crud.test.ts` |  **PASS**  |
| **Yêu cầu đổi trả (Returns)** | Danh sách đổi trả, xem chi tiết, đổi trạng thái (`approved`, `rejected`, `completed`) | Chuẩn hóa State Machine 4 bước (`PENDING`, `APPROVED`, `REJECTED`, `PROCESSING`, `COMPLETED`), bắt buộc lý do từ chối | `GET /admin/returns`<br>`GET /admin/returns/:id`<br>`PATCH /admin/returns/:id/status`                                                                             | `RET-12` đến `RET-18`, `SM-01` đến `SM-04` trong test suites         |  **PASS**  |
| **Tồn kho (Inventory)**       | Xem nhật ký nhập xuất, điều chỉnh số lượng thủ công                                   | Xem logs tồn kho, ghi nhận log `RETURN` khi đổi trả, chống trừ kho đúp khi chuyển đơn hàng                            | `GET /admin/inventory/logs`<br>`POST /admin/inventory/adjust`                                                                                                     | `INV-01` đến `INV-05`, `phase_b_returns_and_admin_crud.test.ts`      |  **PASS**  |
| **Đơn hàng (Orders)**         | Quản lý danh sách, xem chi tiết, chuyển trạng thái đơn hàng                           | Cập nhật trạng thái đơn, tự động gán `deliveredAt`, hoàn kho khi `CANCELLED`                                          | `GET /admin/orders`<br>`GET /admin/orders/:id`<br>`PATCH /admin/orders/:id/status`                                                                                | `DELV-01`, `CONCURRENCY-1`, `commerce_and_ai.integration.test.ts`    |  **PASS**  |
| **Sản phẩm (Products)**       | CRUD sản phẩm, tạo mô tả tự động                                                      | Quản trị sản phẩm đầy đủ, liên kết Brand và Category                                                                  | `GET /admin/products`<br>`POST /admin/products`<br>`PUT /admin/products/:id`<br>`DELETE /admin/products/:id`                                                      | `apps/api/tests/storefront.integration.test.ts`                      |  **PASS**  |
| **Đánh giá (Reviews)**        | Ẩn/hiện bình luận, xóa đánh giá                                                       | Lọc đánh giá storefront (chỉ hiện active), Staff/Admin duyệt/xóa qua API admin riêng                                  | `GET /admin/reviews`<br>`PATCH /admin/reviews/:id/status`<br>`DELETE /admin/reviews/:id`                                                                          | `phase_b_customer_reviews.test.ts` (Group 5, 29 tests)               |  **PASS**  |
| **Khuyến mãi (Coupons)**      | Tạo mã giảm giá, bật/tắt, xóa                                                         | CRUD mã giảm giá, kiểm soát tỷ lệ chiết khấu                                                                          | `GET /admin/coupons`<br>`POST /admin/coupons`<br>`PUT /admin/coupons/:id`<br>`DELETE /admin/coupons/:id`<br>`PATCH /admin/coupons/:id/toggle`                     | `apps/api/tests/commerce_and_ai.integration.test.ts`                 |  **PASS**  |
| **Flash Sale**                | Tạo khung giờ flash sale, thêm item, xóa                                              | Quản trị chiến dịch flash sale                                                                                        | `GET /admin/flash-sales`<br>`POST /admin/flash-sales`<br>`PUT /admin/flash-sales/:id`<br>`DELETE /admin/flash-sales/:id`<br>`PATCH /admin/flash-sales/:id/toggle` | `apps/api/tests/commerce_and_ai.integration.test.ts`                 |  **PASS**  |
| **Thương hiệu (Brands)**      | Thêm, sửa, xóa thương hiệu                                                            | CRUD thương hiệu, `onDelete: SetNull` bảo toàn sản phẩm                                                               | `GET /admin/brands`<br>`POST /admin/brands`<br>`PUT /admin/brands/:id`<br>`DELETE /admin/brands/:id`                                                              | `apps/api/tests/storefront.integration.test.ts`                      |  **PASS**  |
| **Bài viết (Posts/News)**     | Soạn tin tức, đăng bài, xóa                                                           | CRUD tin tức công nghệ                                                                                                | `GET /admin/posts`<br>`POST /admin/posts`<br>`PUT /admin/posts/:id`<br>`DELETE /admin/posts/:id`<br>`PATCH /admin/posts/:id/toggle`                               | `apps/api/tests/commerce_and_ai.integration.test.ts`                 |  **PASS**  |
| **Banners**                   | Quản lý banner trang chủ, vị trí hiển thị                                             | CRUD banner quảng cáo                                                                                                 | `GET /admin/banners`<br>`POST /admin/banners`<br>`PUT /admin/banners/:id`<br>`DELETE /admin/banners/:id`<br>`PATCH /admin/banners/:id/toggle`                     | `apps/api/tests/commerce_and_ai.integration.test.ts`                 |  **PASS**  |
| **Người dùng (Users)**        | Khóa/mở tài khoản, phân quyền STAFF                                                   | Khóa tài khoản, nâng quyền `CUSTOMER <-> STAFF` (chỉ ADMIN)                                                           | `GET /admin/users`<br>`PATCH /admin/users/:id/toggle`<br>`PATCH /admin/users/:id/role`                                                                            | `phase_a_security_remediation.test.ts` (`RBAC-A1` đến `RBAC-A7`)     |  **PASS**  |

**Kết luận Nhóm 2:** **PASS**. Ngoài hai phân hệ còn thiếu đã được xác định rõ trong Phase B Plan là `Category DELETE` và `Returns Admin API` (đều đã hoàn thành ở M5), toàn bộ 10 phân hệ Admin CRUD khác đã tồn tại đầy đủ trong `admin.routes.ts`, `admin.controller.ts` và `admin.service.ts`.

---

### Nhóm 3: Bảo Toàn Tồn Kho & Thực Chứng `isResellable` (Inventory Integrity)

| Câu hỏi xác minh                                                             | Kết quả đối soát kỹ thuật                                                                                                                                                                                                                                                                                                                                     | Source Code & Test Evidence                                                                                                  | Đánh giá |
| :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- | :------: |
| **1. `isResellable` được lưu ở đâu?**                                        | Được lưu bền vững trong bảng MySQL `return_items`, cột `is_resellable BOOLEAN NOT NULL DEFAULT false`. Trong Prisma: `ReturnItem.isResellable: Boolean @default(false)`.                                                                                                                                                                                      | `prisma/schema.prisma` (Dòng 563)<br>`prisma/migrations/.../migration.sql` (Dòng 23)                                         | **PASS** |
| **2. Ai được phép xác nhận sản phẩm có thể bán lại?**                        | Chỉ người dùng có role `ADMIN` hoặc `STAFF`. Route `PATCH /api/v1/admin/returns/:id/status` được bảo vệ bởi middleware `requireAuth(['ADMIN', 'STAFF'])`. Role `CUSTOMER` bị chặn HTTP 403.                                                                                                                                                                   | `apps/api/src/modules/admin/admin.routes.ts` (Dòng 10)<br>Test `RET-12` (`phase_b_returns_and_admin_crud.test.ts`: Dòng 629) | **PASS** |
| **3. Thời điểm và actor xác nhận có được lưu không?**                        | **Có đầy đủ:**<br>- `ReturnRequest.handledBy`: lưu ID nhân sự xử lý.<br>- `ReturnRequest.resolvedAt`: lưu thời điểm hoàn tất.<br>- `ReturnAuditLog`: lưu `actorId`, `actorRole`, `fromStatus`, `toStatus`, `notes`, `createdAt`.<br>- `InventoryLog`: lưu `actorId`, `changeType = 'RETURN'`, `referenceType = 'RETURN_REQUEST'`, `referenceId = returnCode`. | `apps/api/src/modules/order/return.service.ts` (Dòng 570–619)<br>Bảng `return_audit_logs`, `inventory_logs`                  | **PASS** |
| **4. Có thể thay đổi kết quả kiểm tra sau khi return đã `COMPLETED` không?** | **TUYỆT ĐỐI KHÔNG.** Khi yêu cầu đạt `COMPLETED`, trạng thái này có danh sách chuyển tiếp rỗng `ALLOWED_TRANSITIONS['COMPLETED'] = []`. Mọi request gọi lại đều bị từ chối với HTTP 400 `INVALID_STATUS_TRANSITION`. Do đó không thể sửa đổi `isResellable` hay hoàn kho lần thứ hai.                                                                         | `apps/api/src/modules/order/return.service.ts` (Dòng 73, 489–505)<br>Test `INV-03` (Dòng 893)                                | **PASS** |
| **5. Hoàn kho và `InventoryLog` có nằm trong cùng transaction không?**       | **CÓ.** Cả hai lệnh `tx.product.update({ data: { stockQuantity: { increment } } })` và `tx.inventoryLog.create(...)` đều nằm trong cùng một `await prisma.$transaction(async (tx) => { ... })`. Nếu một lệnh gặp sự cố, toàn bộ giao dịch rollback.                                                                                                           | `apps/api/src/modules/order/return.service.ts` (Dòng 476–633)<br>Test `INV-05` (Dòng 978)                                    | **PASS** |
| **6. Có cơ chế ngăn replay hoặc concurrent double restoration không?**       | **CÓ.** Hệ thống khóa dòng độc quyền: `SELECT id, status FROM return_requests WHERE id = ? FOR UPDATE;`. Request thứ hai bị block cho đến khi request thứ nhất commit. Khi unblock, nó đọc thấy `status === 'COMPLETED'` và bị throw `INVALID_STATUS_TRANSITION`, hoàn toàn không chạm vào kho.                                                               | `apps/api/src/modules/order/return.service.ts` (Dòng 478–495)<br>Test `INV-04` (Dòng 915)                                    | **PASS** |

**Kết luận Nhóm 3:** **PASS TOÀN DIỆN**.

---

### Nhóm 4: State Machine, Audit Trail & Notification

#### 4.1. Ma Trận Chuyển Đổi Trạng Thái Đầy Đủ (State Transition Matrix)

| Trạng thái hiện tại |    Trạng thái yêu cầu     |                                        Kết quả kỳ vọng                                        | Bằng chứng Kiểm thử (Test Case)                                                                     |
| :-----------------: | :-----------------------: | :-------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------- |
|    **`PENDING`**    |      **`APPROVED`**       |                    **Thành công (200)** — Ghi audit log, gửi notification                     | `RET-14` (`phase_b_returns_and_admin_crud.test.ts`), `SM-01` (`returns_state_machine.unit.test.ts`) |
|    **`PENDING`**    |      **`REJECTED`**       |            **Thành công (200)** nếu có `rejectionReason`; **Lỗi (400)** nếu thiếu             | `RET-17`, `RET-18` (`phase_b_returns_and_admin_crud.test.ts`), `SM-01`                              |
|    **`PENDING`**    |     **`PROCESSING`**      |                **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Không được nhảy cóc)                | `SM-01` (`returns_state_machine.unit.test.ts`)                                                      |
|    **`PENDING`**    |      **`COMPLETED`**      |                **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Không được nhảy cóc)                | `SM-01` (`returns_state_machine.unit.test.ts`)                                                      |
|    **`PENDING`**    |       **`PENDING`**       |                 **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Trùng trạng thái)                  | `SM-01` (`returns_state_machine.unit.test.ts`)                                                      |
|   **`APPROVED`**    |     **`PROCESSING`**      |                    **Thành công (200)** — Ghi audit log, gửi notification                     | `RET-16` (`phase_b_returns_and_admin_crud.test.ts`), `SM-02`                                        |
|   **`APPROVED`**    |      **`REJECTED`**       |       **Thành công (200)** nếu có `rejectionReason` (Từ chối khi hàng gửi về không đạt)       | `SM-02` (`returns_state_machine.unit.test.ts`)                                                      |
|   **`APPROVED`**    |      **`COMPLETED`**      |          **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Phải qua kiểm tra `PROCESSING`)           | `RET-15` (`phase_b_returns_and_admin_crud.test.ts`), `SM-02`                                        |
|   **`APPROVED`**    |       **`PENDING`**       |                **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Không cho quay lui)                 | `SM-02` (`returns_state_machine.unit.test.ts`)                                                      |
|   **`APPROVED`**    |      **`APPROVED`**       |                 **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Trùng trạng thái)                  | `SM-02` (`returns_state_machine.unit.test.ts`)                                                      |
|  **`PROCESSING`**   |      **`COMPLETED`**      | **Thành công (200)** — Hoàn kho resellable, ghi InventoryLog, ghi audit log, gửi notification | `INV-01`, `INV-02` (`phase_b_returns_and_admin_crud.test.ts`), `SM-03`                              |
|  **`PROCESSING`**   |      **`REJECTED`**       |        **Thành công (200)** nếu có `rejectionReason` (Kỹ thuật thẩm định không hợp lệ)        | `RET-17`, `RET-18`, `SM-03`                                                                         |
|  **`PROCESSING`**   |      **`APPROVED`**       |                **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Không cho quay lui)                 | `SM-03` (`returns_state_machine.unit.test.ts`)                                                      |
|  **`PROCESSING`**   |       **`PENDING`**       |                **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Không cho quay lui)                 | `SM-03` (`returns_state_machine.unit.test.ts`)                                                      |
|  **`PROCESSING`**   |     **`PROCESSING`**      |                 **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Trùng trạng thái)                  | `SM-03` (`returns_state_machine.unit.test.ts`)                                                      |
|   **`REJECTED`**    | **Bất kỳ trạng thái nào** |              **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Terminal state đóng kín)              | `SM-04` (`returns_state_machine.unit.test.ts`)                                                      |
|   **`COMPLETED`**   | **Bất kỳ trạng thái nào** |              **Lỗi (400)** `INVALID_STATUS_TRANSITION` (Terminal state đóng kín)              | `SM-04` (`returns_state_machine.unit.test.ts`), `INV-03`                                            |

#### 4.2. Kiểm Tra An Toàn Phân Quyền & Đồng Thời

- **Bắt buộc `rejectionReason`:** Kiểm tra bằng code predicate tại dòng 467 `return.service.ts` và test `RET-17` (trả về 400 `REJECTION_REASON_REQUIRED`).
- **Audit Log & Notification:** Tạo bên trong cùng transaction tại dòng 606–632 của `return.service.ts`. Notification gửi đúng `userId` của chủ đơn hàng.
- **Phân quyền người dùng:**
  - `CUSTOMER` gọi `PATCH /admin/returns/:id/status` -> bị chặn HTTP 403 `FORBIDDEN` (Test `RET-12`).
  - `CUSTOMER` gọi xem đơn của người khác -> bị chặn HTTP 403 `FORBIDDEN` (Test `RET-10`).
- **Race Condition Protection:** Đã kiểm chứng qua test `INV-04` với `Promise.all` 2 request đồng thời trên MySQL thật.

**Kết luận Nhóm 4:** **PASS TOÀN DIỆN**.

---

### Nhóm 5: Tính Toàn Vẹn & Khả Năng Tranh Chấp Khi Xóa Danh Mục (Category DELETE)

| Yếu tố kiểm tra                                                | Cơ chế Application Logic                                                                                  | Cơ chế Database Constraints (MySQL InnoDB)                                                                                                                                                                                                                                                                                            | Đánh giá |
| :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------: |
| **1. Kiểm tra sản phẩm liên kết**                              | Đếm sản phẩm: `category._count.products > 0` ném lỗi HTTP 400 `CATEGORY_HAS_PRODUCTS`.                    | Khóa ngoại trên MySQL: `products.category_id` có `ON DELETE RESTRICT`.                                                                                                                                                                                                                                                                | **PASS** |
| **2. Kiểm tra danh mục con**                                   | Đếm danh mục con: `category._count.children > 0` ném lỗi HTTP 400 `CATEGORY_HAS_CHILDREN`.                | Ràng buộc tự tham chiếu `categories.parent_id`.                                                                                                                                                                                                                                                                                       | **PASS** |
| **3. Không cascade-delete**                                    | Không gọi xóa cascade; chỉ gọi `prisma.category.delete` khi cả 2 count bằng 0.                            | MySQL engine từ chối xóa cha nếu còn con có `RESTRICT`.                                                                                                                                                                                                                                                                               | **PASS** |
| **4. Referential Integrity**                                   | Dữ liệu sản phẩm không bao giờ bị mồ côi (`categoryId` là `NOT NULL` và `RESTRICT`).                      | Ràng buộc khóa ngoại InnoDB đảm bảo 100% không thể có sản phẩm trỏ vào category không tồn tại.                                                                                                                                                                                                                                        | **PASS** |
| **5. Race condition: Xóa danh mục đồng thời với tạo sản phẩm** | Nếu Request 1 (Xóa) kiểm tra count = 0, cùng lúc Request 2 (Tạo sản phẩm) thêm sản phẩm vào danh mục này: | **MySQL InnoDB bảo vệ tuyệt đối:** Khi Request 1 thực thi lệnh `DELETE FROM categories WHERE id = ?`, engine MySQL kiểm tra khóa ngoại tại thời điểm thực thi. Vì Request 2 đã thêm sản phẩm, MySQL ném lỗi Error 1451 (`a foreign key constraint fails`). Prisma bắt lỗi và chuyển thành `P2003`. **Dữ liệu không bao giờ bị hỏng.** | **PASS** |

**Kết luận Nhóm 5:** **PASS TOÀN DIỆN**.

---

## 2. Đối Soát Số Liệu Kiểm Thử & CI Evidence

| Chỉ tiêu số liệu              |   Báo cáo ban đầu    |                   Đối soát thực tế trên Repository                    |       Tình trạng thực thi       |
| :---------------------------- | :------------------: | :-------------------------------------------------------------------: | :-----------------------------: |
| **Test Unit (DB-free)**       |  7 files / 40 tests  |          7 files / 40 tests (Chạy lệnh `npm run test:unit`)           | **100% PASS** (0 skip, 0 fail)  |
| **Suite chính (Vitest)**      | 18 files / 213 tests |            18 files / 213 tests (Chạy lệnh `npm run test`)            | **100% PASS** (0 skip, 0 fail)  |
| **Dedicated DB Contract**     |   1 file / 1 test    | 1 file / 1 test (Chạy lệnh `npm run test:integration -w @nexora/api`) | **100% PASS** (0 skip, 0 fail)  |
| **Tổng số lượt test độc lập** |      214 tests       |              214 tests (213 main suite + 1 dedicated DB)              | **100% PASS** (Không mock fake) |
| **GitHub Actions CI Run**     |  Run `#44998400435`  | URL: `https://github.com/ntrungz0704/Nexora/actions/runs/44998400435` |      **2/2 Jobs SUCCESS**       |
| - Job 1: Quality & Build      |        1m 7s         |    `Typecheck, Lint, Format, Prisma Validate, Unit Tests & Build`     |           **SUCCESS**           |
| - Job 2: MySQL Integration    |        1m 15s        |     `MySQL 8.4 Migration, Seed & Full Integration/Security Suite`     |           **SUCCESS**           |

---

## 3. Tổng Hợp Đánh Giá PASS / FAIL / NOT VERIFIED

| Hạng mục đối soát                                             | Kết luận | Ghi chú & Căn cứ                                                                                                                                           |
| :------------------------------------------------------------ | :------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Mốc thời gian giao hàng đáng tin cậy (`deliveredAt`)**   | **PASS** | Mọi đơn hàng chuyển sang `DELIVERED` đều được gán `deliveredAt` thời gian thực. Đơn hàng seed lịch sử đã được backfill.                                    |
| **2. Logic fallback `updatedAt` tại `return.service.ts:146`** | **FAIL** | Việc dùng `order.deliveredAt \|\| order.updatedAt` là sai khác so với prompt M5, tạo kẽ hở kéo dài thời hạn 7 ngày nếu đơn hàng bị cập nhật sau giao hàng. |
| **3. Tính đầy đủ của phân hệ Admin CRUD (Stream 2)**          | **PASS** | Đầy đủ 12 module quản trị. Không thiếu sót chức năng nào thuộc phạm vi Phase B.                                                                            |
| **4. Bảo toàn tồn kho & cơ chế `isResellable` (Task B)**      | **PASS** | Lưu bền vững, phân quyền STAFF/ADMIN, đóng băng khi COMPLETED, khóa dòng `FOR UPDATE` chống hoàn kho trùng lặp.                                            |
| **5. State Machine đổi trả & Audit trail (Task A2)**          | **PASS** | 4 bước chặt chẽ, 17/17 trường hợp chuyển đổi được xác thực qua test, bắt buộc `rejectionReason`, audit trail đầy đủ.                                       |
| **6. Xóa danh mục an toàn & Chống Race Condition (Task C1)**  | **PASS** | Chặn khi có sản phẩm và danh mục con. MySQL InnoDB `ON DELETE RESTRICT` ngăn chặn 100% rủi ro mồ côi dữ liệu khi tranh chấp đồng thời.                     |
| **7. Số liệu kiểm thử và CI**                                 | **PASS** | 214 tests thực tế, 18 test files, CI 2/2 jobs xanh lá cây trên GitHub.                                                                                     |

---

## 4. Điểm Blocker Duy Nhất Cần Sửa & Đề Xuất Khắc Phục Tối Thiểu

### Điểm Blocker:

Tại file `apps/api/src/modules/order/return.service.ts`, dòng 146:

```typescript
// HIỆN TẠI:
const deliveryDate = order.deliveredAt || order.updatedAt;
```

### Đề xuất sửa đổi tối thiểu (Minimal Fix):

Thay thế đoạn code trên bằng kiểm tra bắt buộc `deliveredAt`:

```typescript
// SỬA ĐỔI ĐỀ XUẤT:
if (!order.deliveredAt) {
  throw new AppError(
    400,
    'ORDER_MISSING_DELIVERED_DATE',
    'Đơn hàng chưa có mốc thời gian giao hàng xác thực (deliveredAt) để đối soát thời hạn đổi/trả 7 ngày.',
  );
}
const deliveryDate = order.deliveredAt;
```

### Đánh giá tác động của đề xuất:

- **Phạm vi tác động:** Chỉ sửa đổi đúng 1 file (`return.service.ts`), không ảnh hưởng đến bất kỳ API, Controller hay Migration nào khác.
- **Bảo toàn dữ liệu:** Đơn hàng mới và đơn hàng lịch sử đều đã có `deliveredAt`, do đó toàn bộ luồng đổi trả hợp lệ hoạt động bình thường, đồng thời chặn đứng kẽ hở gian lận thời hạn bằng `updatedAt`.
- **Thử nghiệm:** Chạy lại toàn bộ test suite để xác nhận không phát sinh hồi quy.

---

## 5. Đề Xuất Kết Luận Nghiệm Thu M5

1. **Trạng thái hiện tại:** **PASS CÓ ĐIỀU KIỆN (CONDITIONAL PASS)** đối với Milestone M5.
2. **Kế hoạch hành động:**
   - Đang tạm dừng theo quy định, không tự ý sửa code khi chưa có chỉ thị.
   - Khi Tech Lead chấp thuận phương án sửa đổi tối thiểu tại Mục 4, Agent sẽ tiến hành cập nhật 1 dòng code, chạy lại test suite, đẩy commit tiếng Việt không dấu lên GitHub, theo dõi CI và chuyển trạng thái M5 sang **FINAL PASS**.
   - **Tuyệt đối không bắt đầu Milestone M6** cho đến khi M5 được đóng nghiệm thu chính thức.
