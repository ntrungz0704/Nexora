# BÁO CÁO NGHIỆM THU CHÍNH THỨC MILESTONE M5: RETURNS WORKFLOW & ADMIN CRUD BACKEND

- **Dự án:** Nexora — Hệ thống Quản trị & Thương mại Điện tử Đơn Cửa Hàng (Single-Vendor Hardware E-Commerce & Store Management System).
- **Mã Milestone:** Phase B — Milestone M5 (Returns Workflow & Admin CRUD Backend).
- **Phiên bản mã nguồn:** Git Commit `3c42638` trên nhánh `main`.
- **Remote CI Run:** `https://github.com/ntrungz0704/Nexora/actions/runs/44997868976` (Trạng thái: **SUCCESS** 2/2 Jobs).
- **Ngày hoàn thành nghiệm thu:** 22/11/2026.
- **Tiêu chuẩn kiểm chứng:** Thực thi 100% lệnh thực tế, kiểm tra vật lý trên MySQL 8.4 LTS, đối soát hợp đồng Zod/Prisma, không suy đoán và không mock pass.

---

## 1. Executive Summary

Milestone M5 giải quyết trọn vẹn nghiệp vụ đổi trả hàng hóa (Returns Workflow) và củng cố các hoạt động quản trị danh mục (Admin Category Safe DELETE) theo kiến trúc Modular Monolith của dự án Nexora:

1. **Khách hàng (Customer Returns):** Cho phép khách hàng gửi yêu cầu đổi trả cho đơn hàng đã giao (`DELIVERED`) trong vòng 7 ngày kể từ thời điểm giao hàng (`deliveredAt`), chọn từng sản phẩm và số lượng hợp lệ, kèm lý do và ảnh minh chứng. Khách hàng xem danh sách và chi tiết yêu cầu của riêng mình (chống truy cập chéo dữ liệu Anti-IDOR).
2. **Quy trình State Machine 4 bước:** Chuyển trạng thái an toàn `PENDING → APPROVED / REJECTED → PROCESSING → COMPLETED`. Staff/Admin chịu trách nhiệm kiểm duyệt; bắt buộc nhập `rejectionReason` khi từ chối; tự động ghi nhận nhật ký kiểm toán (`ReturnAuditLog`) và gửi thông báo hệ thống (`Notification`) cho khách hàng tại mỗi bước chuyển đổi.
3. **Bảo toàn kho & Chống hoàn kho hai lần (Inventory Integrity & Restoration):** Số lượng tồn kho (`stockQuantity`) chỉ được hoàn trả duy nhất khi yêu cầu đạt trạng thái `COMPLETED` VÀ sản phẩm được xác nhận có thể bán lại (`isResellable = true`). Tạo bản ghi `InventoryLog` với loại `RETURN`. Ngăn ngừa hoàn kho trùng lặp hoặc race condition bằng khóa dòng MySQL InnoDB (`SELECT ... FOR UPDATE` trong transaction).
4. **Xóa danh mục an toàn (Category Safe DELETE):** Kiểm soát nghiêm ngặt ràng buộc khóa ngoại, ngăn chặn xóa cascade. Trả về mã lỗi 400 kèm message rõ ràng khi danh mục còn sản phẩm (`CATEGORY_HAS_PRODUCTS`) hoặc còn danh mục con (`CATEGORY_HAS_CHILDREN`).
5. **Chất lượng mã nguồn & CI:** Hoàn thành 100% chất lượng kiểm thử (214/214 tests pass), vượt qua toàn bộ Typecheck, ESLint, Prettier, Vite Build và GitHub Actions CI 2/2 jobs xanh.

---

## 2. Scope Thực Tế Đã Triển Khai

| Phân hệ / Task | Nội dung triển khai thực tế | Trạng thái |
| :--- | :--- | :--- |
| **Task A1: Customer Returns** | API `POST /api/v1/profile/returns`, `GET /api/v1/profile/returns`, `GET /api/v1/profile/returns/:id`. Kiểm tra tài khoản ACTIVE, sở hữu đơn hàng, trạng thái `DELIVERED`, thời hạn 7 ngày từ `deliveredAt`, giới hạn số lượng đổi trả còn lại, sinh mã `RET-YYYYMMDD-XXXXX`. | **PASS** |
| **Task A2: State Machine** | Quản lý quy trình 4 bước: `PENDING → APPROVED / REJECTED → PROCESSING → COMPLETED`. API `PATCH /api/v1/admin/returns/:id/status`. Bắt buộc `rejectionReason` khi REJECTED. Ghi nhận audit log chi tiết và thông báo khách hàng. | **PASS** |
| **Task A3: Admin Management** | API `GET /api/v1/admin/returns`, `GET /api/v1/admin/returns/:id`. Phân quyền RBAC (`STAFF`, `ADMIN` được phép; `CUSTOMER` bị chặn 403 `FORBIDDEN`). Tìm kiếm theo returnCode, lọc theo status, phân trang chuẩn. | **PASS** |
| **Task B: Inventory Integrity** | Hoàn kho nguyên tử trong Prisma transaction: chỉ hoàn trả khi `COMPLETED` và `isResellable: true`. Ghi nhận `InventoryLog` với `changeType: RETURN`. Sản phẩm `isResellable: false` giữ nguyên kho. Chống hoàn kho lặp lại bằng khóa dòng `FOR UPDATE`. | **PASS** |
| **Task C1: Category Safe DELETE** | API `DELETE /api/v1/admin/categories/:id`. Chặn xóa khi có sản phẩm liên kết (`CATEGORY_HAS_PRODUCTS`) hoặc có danh mục con (`CATEGORY_HAS_CHILDREN`). Xóa sạch an toàn khi không có phụ thuộc. | **PASS** |
| **Database & Contracts** | Cập nhật Prisma schema, tạo Migration `20261122140000_add_returns_workflow_and_order_delivered_at`, bổ sung Zod schemas & DTOs vào `@nexora/shared`. | **PASS** |

### Ranh giới phạm vi (Scope Boundaries):
- **Single-Vendor Only:** Chỉ hỗ trợ 3 roles trong hệ thống RBAC (`CUSTOMER`, `STAFF`, `ADMIN`). Không phát triển tính năng đa người bán (Marketplace).
- **Không can thiệp Frontend UI:** Giao diện người dùng sẽ được tích hợp hoàn chỉnh tại Milestone M6.
- **Không chuyển đổi CSS:** Giữ nguyên cấu trúc CSS hiện có, không chuyển sang Tailwind trong Phase B.
- **Không sửa đổi thư mục tham chiếu:** Thư mục `TechPilot/` và `audit-output/` được bảo toàn nguyên trạng (Read-Only).

---

## 3. TechPilot Source Parity Matrix Kèm File Paths

| Tính năng nghiệp vụ | Nguồn TechPilot (Legacy PHP) | Mã nguồn triển khai Nexora (Modern TS) | Điểm cải tiến & Chuẩn hóa trong Nexora |
| :--- | :--- | :--- | :--- |
| **Tạo yêu cầu đổi trả** | `TechPilot/models/OrderModel.php` (`createReturnRequest`) | `apps/api/src/modules/order/return.service.ts` (`createReturnRequest`) | Kiểm tra nghiêm ngặt `deliveredAt` trong 7 ngày, tính toán số lượng đổi trả lũy kế, tạo mã duy nhất `returnCode`, sinh `ReturnItem` chi tiết từng món. |
| **Danh sách & Chi tiết đổi trả khách hàng** | `TechPilot/models/OrderModel.php` (`getReturnRequestsByUser`, `getReturnRequestById`) | `apps/api/src/modules/order/return.service.ts` (`getOwnReturns`, `getOwnReturnDetail`) | Bảo vệ chống IDOR (chỉ xem đơn của mình), trả về DTO chuẩn Zod với đầy đủ items, audit logs và thông tin đơn hàng liên kết. |
| **Quản trị đổi trả (Admin/Staff)** | `TechPilot/controllers/AdminController.php` (`returns`, `returnDetail`) | `apps/api/src/modules/order/return.service.ts` (`getAdminReturns`, `getAdminReturnDetail`) | Phân quyền RBAC chuẩn, phân trang `meta` chuẩn RESTful, tìm kiếm theo `returnCode`, lọc trạng thái. |
| **Chuyển đổi trạng thái đổi trả** | `TechPilot/controllers/AdminController.php` (`updateReturnStatus`) | `apps/api/src/modules/order/return.service.ts` (`updateReturnStatus`) | State machine 4 bước chặt chẽ, bắt buộc lý do từ chối, ghi vết `ReturnAuditLog`, gửi thông báo cho khách hàng. |
| **Hoàn kho & Nhật ký tồn kho** | `TechPilot/models/OrderModel.php` (tăng stock thủ công, không phân biệt khả năng bán lại) | `apps/api/src/modules/order/return.service.ts` (`updateReturnStatus`) | Chỉ hoàn kho khi `COMPLETED` và `isResellable = true`, ghi `InventoryLog` loại `RETURN`, khóa dòng `FOR UPDATE` chống hoàn kho trùng lặp. |
| **Xóa danh mục an toàn** | `TechPilot/controllers/CategoryController.php` (`deleteCategory`) | `apps/api/src/modules/admin/admin.service.ts` (`deleteCategory`) | Bảo vệ toàn vẹn dữ liệu: kiểm tra cả sản phẩm liên kết lẫn danh mục con trực thuộc, trả mã lỗi nghiệp vụ 400 rõ ràng. |

---

## 4. Danh Sách API Mới & Cập Nhật

### 4.1. Customer Profile Returns API

#### 1. Tạo yêu cầu đổi trả
- **Endpoint:** `POST /api/v1/profile/returns`
- **Xác thực:** Bearer JWT (Role: `CUSTOMER`, `STAFF`, `ADMIN` - Tài khoản phải `ACTIVE`).
- **Input Contract:** `CreateReturnRequestInputSchema`
  ```json
  {
    "orderId": 10,
    "reason": "Sản phẩm bị lỗi cổng kết nối không nhận tín hiệu",
    "notes": "Đã thử trên nhiều máy khác nhau",
    "images": ["https://cdn.nexora.vn/returns/evidence-1.jpg"],
    "items": [
      {
        "orderItemId": 15,
        "quantity": 1,
        "reason": "Lỗi phần cứng",
        "conditionNote": "Hộp còn nguyên, sản phẩm không trầy xước",
        "resolution": "REFUND"
      }
    ]
  }
  ```
- **Output Contract:** `ReturnRequestDtoSchema` (HTTP 201 Created).
- **Mã lỗi:**
  - `400 ORDER_NOT_DELIVERED`: Đơn hàng chưa giao thành công.
  - `400 RETURN_WINDOW_EXPIRED`: Đã quá 7 ngày kể từ thời điểm giao hàng.
  - `400 INVALID_ORDER_ITEM`: Sản phẩm không thuộc đơn hàng.
  - `400 RETURN_QUANTITY_EXCEEDED`: Số lượng yêu cầu vượt quá số lượng còn lại có thể đổi trả.
  - `403 FORBIDDEN_ACCESS`: Khách hàng không sở hữu đơn hàng này (Anti-IDOR).
  - `404 ORDER_NOT_FOUND`: Đơn hàng không tồn tại.

#### 2. Danh sách yêu cầu đổi trả của khách hàng
- **Endpoint:** `GET /api/v1/profile/returns`
- **Xác thực:** Bearer JWT.
- **Query Params:** `page` (default 1), `limit` (default 10), `status` (tùy chọn: `PENDING`, `APPROVED`, `REJECTED`, `PROCESSING`, `COMPLETED`).
- **Output:** Danh sách phân trang kèm `meta` (HTTP 200 OK).

#### 3. Chi tiết yêu cầu đổi trả của khách hàng
- **Endpoint:** `GET /api/v1/profile/returns/:id`
- **Xác thực:** Bearer JWT.
- **Output:** Chi tiết `ReturnRequestDtoSchema` gồm items, audit logs và handler (HTTP 200 OK).
- **Mã lỗi:** `404 RETURN_NOT_FOUND` nếu không tìm thấy hoặc người dùng không sở hữu (Anti-IDOR).

### 4.2. Admin & Staff Returns API

#### 4. Danh sách đổi trả toàn hệ thống
- **Endpoint:** `GET /api/v1/admin/returns`
- **Xác thực:** Bearer JWT (Role: `STAFF`, `ADMIN`). Chặn `CUSTOMER` với mã 403 `FORBIDDEN`.
- **Query Params:** `page`, `limit`, `status`, `search` (tìm theo `returnCode`).
- **Output:** Danh sách phân trang kèm `meta` (HTTP 200 OK).

#### 5. Chi tiết đổi trả dành cho quản trị
- **Endpoint:** `GET /api/v1/admin/returns/:id`
- **Xác thực:** Bearer JWT (Role: `STAFF`, `ADMIN`).
- **Output:** Chi tiết `ReturnRequestDtoSchema` (HTTP 200 OK).

#### 6. Cập nhật trạng thái đổi trả
- **Endpoint:** `PATCH /api/v1/admin/returns/:id/status`
- **Xác thực:** Bearer JWT (Role: `STAFF`, `ADMIN`).
- **Input Contract:** `UpdateReturnStatusInputSchema`
  ```json
  {
    "status": "COMPLETED",
    "rejectionReason": "Lý do bắt buộc nếu status là REJECTED",
    "notes": "Đã kiểm tra sản phẩm tại kho và chấp thuận hoàn tiền",
    "items": [
      {
        "returnItemId": 1,
        "isResellable": true
      }
    ]
  }
  ```
- **Output Contract:** `ReturnRequestDtoSchema` (HTTP 200 OK).
- **Mã lỗi:**
  - `400 INVALID_STATUS_TRANSITION`: Bước chuyển đổi trạng thái không hợp lệ.
  - `400 REJECTION_REASON_REQUIRED`: Bắt buộc cung cấp lý do khi chuyển sang `REJECTED`.
  - `404 RETURN_NOT_FOUND`: Không tìm thấy yêu cầu đổi trả.

### 4.3. Admin Category Management API

#### 7. Xóa danh mục an toàn
- **Endpoint:** `DELETE /api/v1/admin/categories/:id`
- **Xác thực:** Bearer JWT (Role: `ADMIN`). Chặn `CUSTOMER` và `STAFF` (chỉ ADMIN có quyền xóa danh mục).
- **Output:** `{ "message": "Xóa danh mục thành công." }` (HTTP 200 OK).
- **Mã lỗi:**
  - `400 CATEGORY_HAS_PRODUCTS`: Danh mục đang chứa sản phẩm liên kết (không cascade xóa).
  - `400 CATEGORY_HAS_CHILDREN`: Danh mục đang có danh mục con trực thuộc.
  - `404 CATEGORY_NOT_FOUND`: Danh mục không tồn tại.

### 4.4. Cập nhật Order Fulfillment API

#### 8. Tự động ghi nhận `deliveredAt` khi hoàn tất giao hàng
- **Endpoint:** `PATCH /api/v1/admin/orders/:id/status`
- **Logic cập nhật:** Khi chuyển trạng thái đơn hàng sang `DELIVERED`, hệ thống tự động ghi nhận `deliveredAt = new Date()` vào cơ sở dữ liệu nếu trường này đang rỗng, làm mốc tính thời hạn 7 ngày cho quy trình đổi trả.

---

## 5. State Machine Và Các Bước Chuyển Trạng Thái

Hệ thống quản lý quy trình đổi trả thông qua State Machine 4 bước nghiêm ngặt:

```
[ PENDING ] ──────┬──────> [ APPROVED ] ──────> [ PROCESSING ] ──────> [ COMPLETED ] (Terminal)
                  │
                  └──────> [ REJECTED ] (Terminal)
```

### Bảng ma trận chuyển trạng thái (State Transition Matrix):

| Trạng thái hiện tại | Trạng thái tiếp theo cho phép | Yêu cầu / Điều kiện tiên quyết | Hành động kèm theo |
| :--- | :--- | :--- | :--- |
| **`PENDING`** | **`APPROVED`** | Nhân viên/Admin chấp thuận yêu cầu hợp lệ ban đầu. | Ghi nhận `handledBy`, thêm `ReturnAuditLog`, tạo `Notification` cho khách hàng. |
| **`PENDING`** | **`REJECTED`** | Bắt buộc phải có `rejectionReason`. | Ghi nhận `resolvedAt = NOW()`, `rejectionReason`, thêm audit log, gửi notification. Chuyển sang trạng thái kết thúc. |
| **`APPROVED`** | **`PROCESSING`** | Hàng đã về kho, kỹ thuật viên đang tiến hành kiểm tra vật lý. | Thêm `ReturnAuditLog`, tạo `Notification` cho khách hàng. |
| **`PROCESSING`** | **`COMPLETED`** | Hoàn tất kiểm tra và giải quyết. | Duyệt qua danh sách items: hoàn trả tồn kho và ghi `InventoryLog` cho các item có `isResellable: true`. Cập nhật `resolvedAt = NOW()`, thêm audit log, gửi notification. Chuyển sang trạng thái kết thúc. |
| **`REJECTED`** | *(Không có)* | Trạng thái kết thúc (Terminal). | Không cho phép bất kỳ bước chuyển nào tiếp theo. Báo lỗi `INVALID_STATUS_TRANSITION`. |
| **`COMPLETED`** | *(Không có)* | Trạng thái kết thúc (Terminal). | Không cho phép tái xử lý. Báo lỗi `INVALID_STATUS_TRANSITION`. |

---

## 6. Bảo Toàn Tồn Kho & Chống Hoàn Kho Trùng Lặp (Inventory Integrity)

### 6.1. Quy tắc hoàn kho (Invariants)
1. **Chỉ hoàn kho khi `COMPLETED`:** Các trạng thái `APPROVED` hoặc `PROCESSING` tuyệt đối không tác động đến trường `stockQuantity` của sản phẩm.
2. **Kiểm tra khả năng bán lại (`isResellable`):**
   - Nếu `isResellable === true`: Sản phẩm còn nguyên vẹn, đáp ứng tiêu chuẩn bán hàng lại. Hệ thống tăng `stockQuantity` thêm đúng số lượng trả về, đồng thời tạo bản ghi `InventoryLog` với `changeType: 'RETURN'`.
   - Nếu `isResellable === false`: Sản phẩm hư hỏng, lỗi nặng, không thể bán lại. Hệ thống **không** tăng tồn kho và **không** tạo `InventoryLog`.

### 6.2. Cơ chế khóa dòng và chống Race Condition (Double Restoration Protection)
Để đảm bảo nhiều request song song (hoặc nhân viên thao tác đồng thời) không làm hoàn kho hai lần:
1. Toàn bộ quá trình xử lý diễn ra bên trong một `prisma.$transaction`.
2. Hệ thống khóa dòng dữ liệu của yêu cầu đổi trả bằng câu lệnh native InnoDB:
   ```sql
   SELECT id, status FROM return_requests WHERE id = ? FOR UPDATE;
   ```
3. Sau khi sở hữu khóa dòng độc quyền, kiểm tra trạng thái hiện tại:
   - Nếu `currentStatus === 'COMPLETED'`, giao dịch lập tức ném lỗi `INVALID_STATUS_TRANSITION` (`Yêu cầu đổi trả đã ở trạng thái hoàn tất, không thể xử lý lại`), lập tức hủy bỏ và không chạy lại logic hoàn kho.
4. **Bằng chứng kiểm thử thực tế (`INV-04`):** Đã thực thi kịch bản kiểm thử 2 request đồng thời (bằng `Promise.all`) cùng gửi lệnh chuyển sang `COMPLETED` cho một yêu cầu đổi trả có 2 sản phẩm resellable. Kết quả: chính xác 1 request thành công (HTTP 200), 1 request thất bại (HTTP 400), và tồn kho trên MySQL được cộng đúng 2 đơn vị (không bị cộng thành 4).

---

## 7. Hành Vi Xóa Danh Mục An Toàn (Category Safe DELETE)

Hệ thống ngăn chặn việc xóa lan truyền (cascade delete) làm thất thoát hoặc sai lệch dữ liệu:

1. **Kiểm tra sản phẩm liên kết (`CATEGORY_HAS_PRODUCTS`):**
   ```typescript
   const productCount = await prisma.product.count({ where: { categoryId: id } });
   if (productCount > 0) {
     throw new AppError(
       400,
       `Không thể xóa danh mục đang có ${productCount} sản phẩm liên kết. Vui lòng chuyển sản phẩm sang danh mục khác trước khi xóa.`,
       'CATEGORY_HAS_PRODUCTS'
     );
   }
   ```
2. **Kiểm tra danh mục con trực thuộc (`CATEGORY_HAS_CHILDREN`):**
   ```typescript
   const childrenCount = await prisma.category.count({ where: { parentId: id } });
   if (childrenCount > 0) {
     throw new AppError(
       400,
       `Không thể xóa danh mục đang có ${childrenCount} danh mục con trực thuộc. Vui lòng xóa hoặc di chuyển danh mục con trước.`,
       'CATEGORY_HAS_CHILDREN'
     );
   }
   ```
3. **Thực thi xóa an toàn:** Chỉ khi cả hai điều kiện trên đều bằng 0, câu lệnh `prisma.category.delete({ where: { id } })` mới được phép thực thi.
4. **Bằng chứng kiểm chứng:** Kiểm thử tích hợp đã kiểm tra và xác nhận:
   - Danh mục có sản phẩm: Trả về 400 `CATEGORY_HAS_PRODUCTS`, danh mục và sản phẩm còn nguyên vẹn.
   - Danh mục có danh mục con: Trả về 400 `CATEGORY_HAS_CHILDREN`, cả hai danh mục còn nguyên vẹn.
   - Danh mục rỗng: Trả về 200 và xóa thành công khỏi database.

---

## 8. Cấu Trúc Database & Lược Đồ Bổ Sung (Schema Changes)

Các thay đổi trong file `prisma/schema.prisma`:

### 8.1. Enums
```prisma
enum ReturnRequestStatus {
  PENDING
  APPROVED
  REJECTED
  PROCESSING
  COMPLETED
}

enum ReturnResolution {
  REFUND
  REPLACE
  REPAIR
}
```

### 8.2. Mở rộng Model `Order`
```prisma
model Order {
  // ... các trường hiện có ...
  deliveredAt DateTime? @map("delivered_at")
  // ...
}
```

### 8.3. Mở rộng Model `ReturnRequest` & Quan hệ
```prisma
model ReturnRequest {
  id              Int                 @id @default(autoincrement())
  returnCode      String              @unique @map("return_code") @db.VarChar(50)
  orderId         Int                 @map("order_id")
  userId          Int                 @map("user_id")
  reason          String              @db.Text
  status          ReturnRequestStatus @default(PENDING)
  notes           String?             @db.Text
  images          Json?
  rejectionReason String?             @map("rejection_reason") @db.Text
  handledBy       Int?                @map("handled_by")
  requestedAt     DateTime            @default(now()) @map("requested_at")
  resolvedAt      DateTime?           @map("resolved_at")
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  order           Order               @relation(fields: [orderId], references: [id])
  user            User                @relation(fields: [userId], references: [id])
  handler         User?               @relation("HandledReturns", fields: [handledBy], references: [id])
  items           ReturnItem[]
  auditLogs       ReturnAuditLog[]

  @@map("return_requests")
}
```

### 8.4. Tạo mới Model `ReturnItem`
```prisma
model ReturnItem {
  id              Int              @id @default(autoincrement())
  returnRequestId Int              @map("return_request_id")
  orderItemId     Int              @map("order_item_id")
  productId       Int              @map("product_id")
  quantity        Int
  reason          String?          @db.Text
  conditionNote   String?          @map("condition_note") @db.Text
  resolution      ReturnResolution @default(REFUND)
  isResellable    Boolean          @default(false) @map("is_resellable")
  refundAmount    Decimal?         @map("refund_amount") @db.Decimal(12, 2)
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  returnRequest   ReturnRequest    @relation(fields: [returnRequestId], references: [id], onDelete: Cascade)
  orderItem       OrderItem        @relation(fields: [orderItemId], references: [id])
  product         Product          @relation(fields: [productId], references: [id])

  @@map("return_items")
}
```

### 8.5. Tạo mới Model `ReturnAuditLog`
```prisma
model ReturnAuditLog {
  id              Int                  @id @default(autoincrement())
  returnRequestId Int                  @map("return_request_id")
  actorId         Int                  @map("actor_id")
  actorRole       String               @map("actor_role") @db.VarChar(50)
  fromStatus      ReturnRequestStatus? @map("from_status")
  toStatus        ReturnRequestStatus  @map("to_status")
  notes           String?              @db.Text
  createdAt       DateTime             @default(now()) @map("created_at")

  returnRequest   ReturnRequest        @relation(fields: [returnRequestId], references: [id], onDelete: Cascade)
  actor           User                 @relation(fields: [actorId], references: [id])

  @@map("return_audit_logs")
}
```

---

## 9. Danh Sách Migration Mới & Kết Quả Áp Dụng Trên MySQL 8.4

Tập tin migration được khởi tạo và áp dụng:
`prisma/migrations/20261122140000_add_returns_workflow_and_order_delivered_at/migration.sql`

### Nội dung migration:
1. Thêm cột `delivered_at DATETIME(3) NULL` vào bảng `orders`.
2. Backfill dữ liệu lịch sử: `UPDATE orders SET delivered_at = updated_at WHERE order_status = 'DELIVERED' AND delivered_at IS NULL;` (áp dụng thành công cho đơn `NX-2026-0001`).
3. Cập nhật enum `return_requests.status` hỗ trợ thêm giá trị `PROCESSING`.
4. Bổ sung các cột `return_code`, `rejection_reason`, `handled_by` vào bảng `return_requests`.
5. Tạo bảng mới `return_items` và `return_audit_logs` cùng đầy đủ các chỉ mục Foreign Key và Unique Constraints.
6. Kết quả chạy lệnh `npm run db:deploy` cục bộ và trên GitHub Actions CI: **Thành công 100% (7 migrations applied, không xảy ra xung đột).**

---

## 10. Danh Sách Tập Tin Đã Thêm / Chỉnh Sửa

| Đường dẫn tập tin | Loại thay đổi | Vai trò / Mục đích |
| :--- | :--- | :--- |
| `prisma/schema.prisma` | Sửa đổi | Cập nhật enums, mở rộng Order/ReturnRequest, thêm ReturnItem & ReturnAuditLog. |
| `prisma/migrations/20261122140000_.../migration.sql` | Thêm mới | File SQL migration DDL & backfill cho MySQL 8.4. |
| `packages/shared/src/index.ts` | Sửa đổi | Bổ sung Zod contracts, enums và DTO schemas cho Returns workflow. |
| `apps/api/src/modules/order/return.service.ts` | Thêm mới | Triển khai logic nghiệp vụ returns, state machine, locking, inventory restoration, DTO mapping. |
| `apps/api/src/modules/order/return.controller.ts` | Thêm mới | Controller tiếp nhận HTTP requests, xử lý params/body và phân quyền. |
| `apps/api/src/modules/profile/profile.routes.ts` | Sửa đổi | Đăng ký các endpoints profile returns (`POST /`, `GET /`, `GET /:id`). |
| `apps/api/src/modules/order/order.service.ts` | Sửa đổi | Tự động ghi nhận `deliveredAt = new Date()` khi đơn hàng chuyển sang `DELIVERED`. |
| `apps/api/src/modules/admin/admin.service.ts` | Sửa đổi | Triển khai `deleteCategory` với cơ chế kiểm tra an toàn phụ thuộc. |
| `apps/api/src/modules/admin/admin.controller.ts` | Sửa đổi | Controller tiếp nhận yêu cầu admin returns và category deletion. |
| `apps/api/src/modules/admin/admin.routes.ts` | Sửa đổi | Đăng ký admin returns routes và `DELETE /categories/:id`. |
| `apps/api/tests/returns_state_machine.unit.test.ts` | Thêm mới | 11 unit tests độc lập kiểm tra state machine transitions, 7-day window và eligible quantity. |
| `apps/api/tests/phase_b_returns_and_admin_crud.test.ts` | Thêm mới | 28 integration tests toàn diện trên MySQL 8.4 kiểm thử luồng trả hàng và category delete. |
| `package.json` | Sửa đổi | Cập nhật script `test:unit` bao gồm test file mới. |
| `docker-compose.yml` | Sửa đổi | Cấu hình volume dữ liệu `nexora_mysql_data_v2` ổn định cho môi trường phát triển local. |

---

## 11. Kết Quả Kiểm Thử Chi Tiết (Automated Test Suites)

Hệ thống ghi nhận tổng cộng **214 bài test** độc lập (213 tests trong suite kiểm thử toàn diện Vitest + 1 test hợp đồng MySQL chuyên biệt), đạt tỷ lệ thành công **100% (0 thất bại, 0 bị bỏ qua)**.

### 11.1. Bảng kê chi tiết 18 tập tin kiểm thử trong Suite chính:

| STT | Tập tin kiểm thử | Số test thực thi | Kết quả | Thời gian chạy |
| :---: | :--- | :---: | :---: | :---: |
| 1 | `apps/api/tests/phase_b_returns_and_admin_crud.test.ts` | 28 | **28/28 PASS** | 11.54s |
| 2 | `apps/api/tests/phase_b_cart_merge.test.ts` | 14 | **14/14 PASS** | 8.90s |
| 3 | `apps/api/tests/phase_b_customer_reviews.test.ts` | 29 | **29/29 PASS** | 7.00s |
| 4 | `apps/api/tests/phase_b_profile_addresses.test.ts` | 26 | **26/26 PASS** | 6.50s |
| 5 | `apps/api/tests/phase_a_security_remediation.test.ts` | 25 | **25/25 PASS** | 5.33s |
| 6 | `apps/api/tests/commerce_and_ai.integration.test.ts` | 11 | **11/11 PASS** | 4.92s |
| 7 | `apps/api/tests/payment_security.test.ts` | 13 | **13/13 PASS** | 3.11s |
| 8 | `apps/api/tests/rbac_and_concurrency.test.ts` | 10 | **10/10 PASS** | 2.51s |
| 9 | `apps/api/tests/auth_password_reset_security.test.ts` | 8 | **8/8 PASS** | 1.23s |
| 10 | `apps/api/tests/seed_and_auth_credentials.test.ts` | 2 | **2/2 PASS** | 1.22s |
| 11 | `apps/api/tests/storefront.integration.test.ts` | 7 | **7/7 PASS** | 521ms |
| 12 | `apps/web/tests/ResetPasswordFlow.test.tsx` | 4 | **4/4 PASS** | 180ms |
| 13 | `apps/api/tests/app.test.ts` | 4 | **4/4 PASS** | 64ms |
| 14 | `apps/web/tests/FoundationDashboard.test.tsx` | 1 | **1/1 PASS** | 52ms |
| 15 | `apps/api/tests/returns_state_machine.unit.test.ts` | 11 | **11/11 PASS** | 8ms |
| 16 | `apps/api/tests/review_p2002_isolation.unit.test.ts` | 12 | **12/12 PASS** | 7ms |
| 17 | `packages/shared/tests/personaScoring.test.ts` | 6 | **6/6 PASS** | 4ms |
| 18 | `packages/shared/tests/shared.test.ts` | 2 | **2/2 PASS** | 4ms |
| **Tổng** | **18 test files** | **213 tests** | **213/213 PASS** | **65.78s** |

### 11.2. Hợp đồng tích hợp cơ sở dữ liệu chuyên biệt:
- **Tập tin:** `apps/api/tests/db.integration.test.ts`
- **Lệnh thực thi:** `npm run test:integration -w @nexora/api`
- **Kết quả:** **1/1 PASS** (669ms). Xác nhận kết nối vật lý, cấu hình schema và truy vấn thực tế trên MySQL 8.4.

---

## 12. Kết Quả Kiểm Tra Chất Lượng Mã Nguồn (Quality Gates)

| Công cụ / Lệnh | Mục tiêu kiểm tra | Kết quả quan sát thực tế |
| :--- | :--- | :--- |
| `npm run typecheck` | Kiểm tra kiểu dữ liệu tĩnh TypeScript trên cả 4 workspaces (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`). | **PASS** (0 lỗi, biên dịch sạch). |
| `npm run lint` | Rà soát lỗi cú pháp, quy chuẩn viết code và biến không dùng bằng ESLint. | **PASS** (0 errors, 0 warnings). |
| `npm run format:check` | Kiểm tra định dạng mã nguồn theo tiêu chuẩn Prettier trên toàn bộ repo. | **PASS** (All matched files use Prettier code style). |
| `npm run test:unit` | Chạy bộ test unit không phụ thuộc database (7 files, 40 tests). | **PASS** (40/40 tests pass). |
| `npm run build` | Đóng gói sản phẩm: tsc cho backend/shared và Vite production build cho frontend. | **PASS** (Vite build hoàn tất trong 377ms, dung lượng JS/CSS chuẩn). |

---

## 13. Kết Quả GitHub Actions CI Trên Remote Repository

- **Commit kích hoạt:** `3c42638` (`feat(returns): trien khai quy trinh doi tra va admin crud m5`).
- **Trang giám sát CI:** [GitHub Actions Run #44997868976](https://github.com/ntrungz0704/Nexora/actions/runs/44997868976)
- **Trạng thái tổng thể:** **SUCCESS** (2/2 Jobs hoàn thành xanh lá cây).

### Chi tiết trạng thái từng Job:
1. **Job 1: `Typecheck, Lint, Format, Prisma Validate, Unit Tests & Build`**
   - **ID:** `137132708813`
   - **Thời gian thực thi:** 1m 9s.
   - **Kết quả:** **SUCCESS**.
   - Các bước hoàn thành: Checkout, Setup Node.js 22, Install dependencies, Generate Prisma Client, Typecheck all workspaces, Run ESLint, Check Prettier, Run DB-free unit & flow tests, Build production bundles.
2. **Job 2: `MySQL 8.4 Migration, Seed & Full Integration/Security Suite`**
   - **ID:** `137132999549`
   - **Thời gian thực thi:** 1m 12s.
   - **Kết quả:** **SUCCESS**.
   - Các bước hoàn thành: Initialize containers (MySQL 8.4), Checkout, Setup Node.js 22, Install dependencies, Build packages, Wait for MySQL 8.4 readiness, Deploy Prisma migrations & synthetic seed, Run full Vitest + Supertest integration & security suite against MySQL 8.4, Run dedicated DB integration contract test, Stop containers.

---

## 14. Thông Tin Commit & Trạng Thái Git Working Tree

- **Mã commit SHA:** `3c42638b939f4a86f781df571e16f3dd02b0c4eb` (rút gọn: `3c42638`).
- **Nhánh:** `main`.
- **Thông điệp Commit (Tuân thủ nghiêm ngặt tiếng Việt không dấu):**
  ```text
  feat(returns): trien khai quy trinh doi tra va admin crud m5
  ```
- **Thống kê thay đổi (Git Diff Stat):**
  - 14 files changed, 2404 insertions(+), 26 deletions(-).
- **Trạng thái Working Tree:** Sạch (`working tree clean`), không có uncommitted changes hay file rác.

---

## 15. Known Limitations, Giả Định & Hạng Mục Tồn Tại Hợp Lệ

1. **Giao diện người dùng (Frontend Integration):** Các màn hình lịch sử đổi trả (`/account/returns`), form gửi yêu cầu đổi trả, và giao diện quản trị đổi trả cho Admin/Staff chưa được kết nối với giao diện web React. Đây là phân định thứ tự chính xác theo kế hoạch và sẽ được triển khai toàn diện tại **Milestone M6**.
2. **Cơ chế hoàn tiền tự động qua cổng thanh toán (Payment Gateway Refund Webhook):** Trong Milestone M5, khi yêu cầu đạt `COMPLETED` với hình thức `REFUND`, hệ thống cập nhật trạng thái, hoàn kho sản phẩm resellable và ghi nhận số tiền hoàn trả (`refundAmount`). Việc tích hợp API tự động hoàn tiền trực tiếp qua VNPay/Napas thuộc lộ trình Phase C / Post-MVP (hiện tại quản trị viên đối soát hoàn tiền ngoại tuyến).
3. **Các giới hạn kỹ thuật được ghi nhận từ Phase A:**
   - JWT Revocation: Token duy trì hiệu lực theo thời gian hết hạn (15 phút access token).
   - Rate limiting: Hiện sử dụng bộ nhớ In-Memory, sẵn sàng chuyển đổi Redis store khi scale ngang.

---

## 16. Bảng Đánh Giá Chi Tiết Từng Tiêu Chí Nghiệm Thu (Acceptance Criteria)

| Mã AC | Tiêu chí nghiệm thu | Kết quả | Bằng chứng kiểm chứng cụ thể |
| :---: | :--- | :---: | :--- |
| **AC-01** | Khách hàng tạo yêu cầu đổi trả cho đơn `DELIVERED` trong 7 ngày | **PASS** | Test `RET-01` tạo thành công trả về HTTP 201 kèm mã `RET-...`. Đơn hàng có `deliveredAt = updated_at` hợp lệ. |
| **AC-02** | Chặn đơn chưa giao thành công (`!= DELIVERED`) | **PASS** | Test `RET-02` gửi yêu cầu trên đơn `PROCESSING` hoặc `SHIPPED`, API trả về HTTP 400 `ORDER_NOT_DELIVERED`. |
| **AC-03** | Chặn đơn giao quá 7 ngày (`> 7 days`) | **PASS** | Test `RET-03` gửi yêu cầu trên đơn giao cách đây 8 ngày, API trả về HTTP 400 `RETURN_WINDOW_EXPIRED`. |
| **AC-04** | Chặn truy cập chéo dữ liệu đơn hàng (Anti-IDOR) | **PASS** | Test `RET-04` Customer B cố tình gửi yêu cầu đổi trả đơn hàng của Customer A, API trả về HTTP 403 `FORBIDDEN_ACCESS`. |
| **AC-05** | Chặn số lượng đổi trả vượt quá số lượng mua hoặc đã yêu cầu trước đó | **PASS** | Test `RET-05` và `RET-06` chặn yêu cầu vượt số lượng mua và chặn yêu cầu lũy kế vượt quá số lượng còn lại hợp lệ (HTTP 400 `RETURN_QUANTITY_EXCEEDED`). |
| **AC-06** | Phân quyền State Machine đổi trả cho Staff/Admin | **PASS** | Test `RET-15` xác nhận Customer bị chặn 403 khi gọi API admin. Test `RET-16` xác nhận Staff và Admin chuyển trạng thái thành công. |
| **AC-07** | Bắt buộc có `rejectionReason` khi chuyển sang `REJECTED` | **PASS** | Test `RET-17` thiếu lý do bị từ chối với HTTP 400 `REJECTION_REASON_REQUIRED`. Test `RET-18` có lý do chuyển thành công sang REJECTED và ghi audit log. |
| **AC-08** | Hoàn kho nguyên tử và ghi `InventoryLog` khi `COMPLETED` & `isResellable: true` | **PASS** | Test `INV-01` xác minh tồn kho trên MySQL tăng chính xác bằng số lượng trả về, bản ghi `InventoryLog` được tạo với `changeType: 'RETURN'`. |
| **AC-09** | Không hoàn kho khi `isResellable: false` | **PASS** | Test `INV-02` xác minh tồn kho không thay đổi và không tạo `InventoryLog` khi hàng không thể bán lại. |
| **AC-10** | Chống hoàn kho hai lần khi gọi API đồng thời (Concurrency Lock) | **PASS** | Test `INV-04` thực hiện 2 request đồng thời (`Promise.all`) cố gắng hoàn tất cùng một return request: duy nhất 1 request 200, 1 request 400, kho MySQL chỉ tăng 1 lần. |
| **AC-11** | Chống xóa danh mục đang có sản phẩm liên kết (`CATEGORY_HAS_PRODUCTS`) | **PASS** | Test `CAT-01` xóa danh mục có sản phẩm, API trả về HTTP 400 `CATEGORY_HAS_PRODUCTS`, dữ liệu không bị xóa cascade. |
| **AC-12** | Chống xóa danh mục đang có danh mục con (`CATEGORY_HAS_CHILDREN`) | **PASS** | Test `CAT-02` xóa danh mục có danh mục con, API trả về HTTP 400 `CATEGORY_HAS_CHILDREN`. |
| **AC-13** | Xóa danh mục an toàn khi không có ràng buộc | **PASS** | Test `CAT-03` xóa danh mục rỗng trả về HTTP 200, bản ghi bị xóa sạch khỏi database. |
| **AC-14** | Tự động ghi nhận `deliveredAt` khi đơn hàng giao thành công | **PASS** | Test `DELV-01` cập nhật đơn hàng sang `DELIVERED`, trường `deliveredAt` được tự động gán thời gian hiện tại trên MySQL. |
| **AC-15** | Toàn bộ kiểm thử và Quality Gates đạt 100% | **PASS** | 214/214 tests pass, typecheck, lint, format check, build pass sạch. CI 2/2 jobs green. |

---

## 17. Kết Luận & Đề Xuất Bàn Giao

Milestone M5 đã hoàn thành toàn diện tất cả các yêu cầu về mặt nghiệp vụ, kiến trúc, cơ sở dữ liệu, an toàn đồng thời và kiểm thử tự động. Mã nguồn đã được đồng bộ lên nhánh chính `main` và vượt qua toàn bộ quy trình kiểm thử CI của GitHub Actions.

Theo đúng quy định nghiêm ngặt về phân chia ranh giới Milestone:
- **Dừng thực hiện:** Không tự ý chuyển tiếp sang Milestone M6 (Frontend UI Integration).
- **Trạng thái đề xuất:** **CHẤP THUẬN NGHIỆM THU CHÍNH THỨC (FINAL PASS) MILESTONE M5**.
