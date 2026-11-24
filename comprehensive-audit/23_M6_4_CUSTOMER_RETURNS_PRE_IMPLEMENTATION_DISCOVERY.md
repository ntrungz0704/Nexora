# NEXORA — M6.4 CUSTOMER RETURNS
## PHASE A: PRE-IMPLEMENTATION DISCOVERY REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81` *(Parent: `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`)*
- **Milestone:** M6.4 — Customer Returns
- **Phase:** A — Read-Only Discovery & Pre-Implementation Verification
- **Mode:** STRICT READ-ONLY — NO IMPLEMENTATION
- **Final Decision:** **`READY WITH CONDITIONS`**

> **Quy ước phân loại bằng chứng trong tài liệu:**
> - **[FACT]:** Được xác minh trực tiếp từ mã nguồn, schema, test hoặc command output thực tế.
> - **[INFERENCE]:** Suy luận kỹ thuật có căn cứ từ các FACT đã kiểm chứng.
> - **[UNKNOWN]:** Không có bằng chứng trực tiếp trong workspace hiện tại (ví dụ: source TechPilot nằm ngoài `D:\Nexora`).

---

## 1. EXECUTIVE SUMMARY

1. **[FACT] Backend Returns M5 đã hoàn chỉnh cho phía Customer với chính xác 3 REST endpoints** được gắn trong `apps/api/src/modules/profile/profile.routes.ts:50-55` (mount dưới `/api/v1/profile` tại `apps/api/src/routes/index.ts:28`):
   - `POST /api/v1/profile/returns` — Tạo yêu cầu đổi/trả mới.
   - `GET /api/v1/profile/returns` — Xem danh sách yêu cầu đổi/trả của chính mình (có phân trang).
   - `GET /api/v1/profile/returns/:id` — Xem chi tiết yêu cầu đổi/trả của chính mình (gồm `items` và `auditLogs`).
2. **[FACT] Không có endpoint cập nhật hoặc hủy yêu cầu đổi/trả cho Customer.** Toàn bộ thao tác đổi trạng thái thuộc 3 Admin/Staff endpoints (`/api/v1/admin/returns*`), ngoài phạm vi M6.4.
3. **[FACT] `GET /api/v1/orders/my-orders` đã trả đủ dữ liệu điều kiện cho Frontend:** `order.service.ts:370-377,618-655` trả sẵn `orderStatus`, `deliveredAt` (ISO string hoặc `null`), và mảng `items[]` có đủ `id` (`orderItemId`), `productId`, `productName`, `productSku`, `quantity`. Không cần sửa Backend hay Shared Contracts.
4. **[FACT] Hiện trạng Frontend `ProfilePage.tsx:1911-2067` chỉ là form giả (stub UI)** không gọi API, hiển thị mọi đơn hàng (kể cả chưa `DELIVERED` / quá 7 ngày), không có chọn sản phẩm/số lượng, không có lịch sử hay chi tiết yêu cầu đổi/trả.
5. **[FACT] Phát hiện lỗi routing có thật giữa `ProfilePage.tsx:51` và `AppRoutes.tsx:111-112`:** Nhấn tab `"Yêu cầu đổi trả"` điều hướng sang `/profile/returns` (số nhiều), trong khi `AppRoutes.tsx` chỉ khai báo `/profile/return` và `/profile/return/:id` (số ít) → rơi thẳng vào trang `404 NotFoundPage`.
6. **[FACT] Điều kiện trước khi bước vào Implementation M6.4:** Cần chốt trạng thái Git của 5 file M6.3 đang chưa commit (`M` + 4 `??`) bằng lệnh commit riêng của Owner trước khi sửa code M6.4 (không gộp M6.3 và M6.4), và chốt quyết định 2 điều kiện nhỏ tại Mục 13.

---

## 2. BACKEND API INVENTORY

### 2.1. Customer Endpoints (TRONG PHẠM VI M6.4)

Mounted tại `/api/v1/profile` (`apps/api/src/routes/index.ts:28`) với middleware chung `router.use(requireAuth())` (`apps/api/src/modules/profile/profile.routes.ts:11` — chấp nhận mọi user đã đăng nhập có JWT hợp lệ).

| # | Method | Full URL | Controller & Handler | Service Method | HTTP Status | Response Envelope (Verified) |
|---|---|---|---|---|---|---|
| 1 | `POST` | `/api/v1/profile/returns` | `ReturnController.createReturnRequest` (`return.controller.ts:10-24`) | `ReturnService.createReturnRequest` (`return.service.ts:80-310`) | `201 Created` | `{ success: true, message: string, data: ReturnRequestDto }` |
| 2 | `GET` | `/api/v1/profile/returns` | `ReturnController.getOwnReturns` (`return.controller.ts:29-42`) | `ReturnService.getOwnReturns` (`return.service.ts:315-351`) | `200 OK` | **`{ success: true, returns: ReturnRequestDto[], total: number, page: number, limit: number }`** *(top-level — KHÔNG có wrapper `data`!)* |
| 3 | `GET` | `/api/v1/profile/returns/:id` | `ReturnController.getOwnReturnDetail` (`return.controller.ts:47-64`) | `ReturnService.getOwnReturnDetail` (`return.service.ts:356-382`) | `200 OK` | `{ success: true, data: ReturnRequestDto }` |

### 2.2. Supporting Customer Order Endpoint (TÁI SỬ DỤNG)

| Method | Full URL | Auth | Service Method | Response Envelope |
|---|---|---|---|---|
| `GET` | `/api/v1/orders/my-orders` | `requireAuth()` (`order.routes.ts:16`) | `OrderService.getUserOrders` (`order.service.ts:370-377`) | `{ success: true, data: OrderDto[] }` (đã kèm `deliveredAt` và `items[]`) |

### 2.3. Admin / Staff Endpoints (NGOÀI PHẠM VI M6.4 — KHÔNG TÍCH HỢP)

Mounted tại `/api/v1/admin` (`apps/api/src/routes/index.ts:43`) với `router.use(requireAuth(['ADMIN', 'STAFF']))` (`apps/api/src/modules/admin/admin.routes.ts:10`):
- `GET /api/v1/admin/returns` (`admin.routes.ts:83`)
- `GET /api/v1/admin/returns/:id` (`admin.routes.ts:84`)
- `PATCH /api/v1/admin/returns/:id/status` (`admin.routes.ts:85`)

### 2.4. Pagination, ID Format, Date Handling & Error Codes `[FACT]`

- **Pagination (`GET /api/v1/profile/returns`):**
  - Query params: `page` (mặc định `1`, ép `Math.max(1, Number(query.page || 1))`), `limit` (mặc định `10`, ép `1..100`) (`return.service.ts:319-321`).
  - Sắp xếp cố định `orderBy: { createdAt: 'desc' }` (`return.service.ts:329`).
  - **Lưu ý hợp đồng:** Backend KHÔNG trả trường `totalPages`; Frontend phải tự tính `Math.max(1, Math.ceil(total / limit))`.
- **ID Formats (`prisma/schema.prisma:503-566`, `return.service.ts:678-722`):**
  - `ReturnRequest.id`, `ReturnItem.id`, `ReturnAuditLog.id`, `userId`, `productId`: `Int @db.UnsignedInt` → JS `number`.
  - `orderId`, `orderItemId`: `BigInt @db.UnsignedBigInt` → serialize sang `string` trong DTO (`entity.orderId.toString()`, `item.orderItemId.toString()`). Input schema chấp nhận `string | number` rồi transform sang `string`.
  - `:id` trên `GET /profile/returns/:id`: `Number(req.params.id)` phải là số dương (`isNaN(returnId) || returnId <= 0` → `400 INVALID_ID`, `return.controller.ts:52-55`).
- **Date Format:** Toàn bộ mốc thời gian (`createdAt`, `updatedAt`, `resolvedAt`, `deliveredAt`) là chuỗi ISO-8601 UTC từ `.toISOString()` (`return.service.ts:694-696,708,719`; `order.service.ts:641-642`).
- **Error Codes (Verified from `return.controller.ts` & `return.service.ts`):**

| HTTP | `error.code` | Trigger Condition & Source |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Vi phạm `CreateReturnRequestInputSchema` (kèm `details: [{ field, message }]`) (`return.service.ts:85-90`) |
| `400` | `ORDER_IDENTIFIER_REQUIRED` | Thiếu cả `orderId` lẫn `orderCode` (`return.service.ts:109-113`) |
| `400` | `INVALID_ID` | `:id` trên `GET /profile/returns/:id` không phải số nguyên dương (`return.controller.ts:54`) |
| `400` | `ORDER_NOT_DELIVERED` | `order.orderStatus !== 'DELIVERED'` (`return.service.ts:137-143`) |
| `400` | `ORDER_MISSING_DELIVERED_DATE` | `order.deliveredAt` là `null` (`return.service.ts:146-152`) |
| `400` | `RETURN_WINDOW_EXPIRED` | `(now - deliveredAt) / 86400000 > 7` (`return.service.ts:154-165`) |
| `400` | `INVALID_RETURN_ITEM` | `orderItemId` không thuộc đơn hàng đó (`return.service.ts:202-208`) |
| `400` | `INVALID_RETURN_QUANTITY` | `item.quantity <= 0` (`return.service.ts:210-216`) |
| `400` | `RETURN_QUANTITY_EXCEEDED` | `item.quantity > remainingEligible` hoặc sản phẩm đã yêu cầu hết số lượng (`return.service.ts:221-235`) |
| `400` | `PRODUCT_NOT_FOUND` | `orderItem.productId` null/không hợp lệ (`return.service.ts:237-243`) |
| `401` | `UNAUTHORIZED` / `INVALID_TOKEN` | Thiếu hoặc hết hạn Bearer token (`auth.middleware.ts:44,63`) |
| `403` | `FORBIDDEN` | Tài khoản không `ACTIVE` (`return.service.ts:98-100`), gửi yêu cầu cho đơn của người khác (`return.service.ts:128-134`), hoặc xem chi tiết return của người khác (`return.service.ts:377-379`) |
| `404` | `ORDER_NOT_FOUND` | Không tìm thấy đơn hàng (`return.service.ts:123-125`) |
| `404` | `RETURN_NOT_FOUND` | Không tìm thấy yêu cầu đổi/trả (`return.service.ts:373-375`) |

---

## 3. DTO VÀ CONTRACT MAPPING

Nguồn chân lý: `packages/shared/src/index.ts:513-615` `[FACT]`.

### 3.1. Request DTO — `CreateReturnRequestInputSchema` (`packages/shared/src/index.ts:525-551`)

| Field | Type & Validation | Required / Optional | Ghi chú triển khai |
|---|---|---|---|
| `orderId` | `string \| number` (transform → `string`) | Optional *(nhưng bắt buộc có ít nhất `orderId` hoặc `orderCode` ở service)* | Nên gửi tường minh `order.id` (string) lấy từ `OrderDto`. |
| `orderCode` | `string` (trimmed) | Optional | Có thể gửi kèm hoặc thay thế `orderId`. |
| `reason` | `string` (trimmed, `min: 3`, `max: 255`) | **Required** | Lỗi: `"Lý do đổi trả tối thiểu 3 ký tự."` / `"tối đa 255 ký tự."` |
| `notes` | `string \| null` (trimmed, `max: 2000`) | Optional, Nullable | Mô tả chi tiết bổ sung. |
| `returnAction` | `'replace' \| 'refund' \| 'repair'` | Optional | Schema có khai báo nhưng `return.service.ts` **không đọc trường này**; resolution thực tế nằm ở từng `items[i].resolution`. |
| `images` | `string[] \| null` | Optional, Nullable | Lưu JSON URL nếu có; Backend chưa có endpoint upload file riêng cho Returns → M6.4 không tự xây file upload server-side. |
| `items` | `Array<CreateReturnItemInput>` (`min: 1`) | **Required** | Phải chọn ít nhất 1 sản phẩm (`"Vui lòng chọn ít nhất 1 sản phẩm để đổi trả."`). |
| `items[].orderItemId` | `string \| number` → `string` | **Required** | Phải khớp `OrderItemDto.id` thuộc đơn hàng đang chọn. |
| `items[].productId` | `number` (int positive) | Optional | Backend tự đối chiếu từ `orderItem.productId`. |
| `items[].quantity` | `number` (int positive, `>= 1`) | **Required** | Không được vượt quá `remainingEligible`. |
| `items[].resolution` | `'REFUND' \| 'REPLACE' \| 'REPAIR'` | Optional (default `'REFUND'`) | **Bắt buộc VIẾT HOA** theo `ReturnResolutionEnum` (khác hoàn toàn với mockup cũ đang dùng chữ thường). |

### 3.2. Response DTO — `ReturnRequestDtoSchema` (`packages/shared/src/index.ts:553-602`)

- **Top-level fields:** `id` (number), `returnCode` (string, format `RET-YYYYMMDD-XXXX`), `orderId` (string), `orderCode?` (string), `userId` (number), `customerName?`, `customerEmail?`, `reason` (string), `rejectionReason` (`string | null`), `handledBy` (`number | null`), `handlerName` (`string | null`), `status` (`ReturnRequestStatus`), `notes` (`string | null`), `images` (`any | null`), `resolvedAt` (`string | null`), `createdAt` (ISO string), `updatedAt` (ISO string).
- **`items[]` (`ReturnItemDto`):** `id`, `returnRequestId`, `orderItemId` (string), `productId`, `productName?`, `productSku?`, `thumbnailUrl` (`string | null`), `quantity`, `resolution` (`REFUND | REPLACE | REPAIR`), `isResellable` (boolean), `createdAt`.
- **`auditLogs[]` (`ReturnAuditLogDto`):** `id`, `returnRequestId`, `fromStatus`, `toStatus`, `actorId`, `actorRole`, `actorName?`, `notes` (`string | null`), `createdAt` (sắp xếp `createdAt: 'asc'`).
- **[FACT] Sự khác biệt nhỏ về `include` giữa `getOwnReturns`/`getOwnReturnDetail` và `createReturnRequest`:**
  - `getOwnReturns` (`return.service.ts:330-341`) và `getOwnReturnDetail` (`return.service.ts:359-370`) include `order`, `items.product`, `auditLogs.actor`, KHÔNG include `user`/`handler` (nên `customerName`, `handlerName` sẽ là `undefined`/`null` — đúng nguyên tắc tiết giảm dữ liệu cho khách hàng).

---

## 4. ELIGIBILITY VÀ BUSINESS RULES `[FACT]`

Tất cả các quy tắc dưới đây được xác minh 100% trong `apps/api/src/modules/order/return.service.ts:80-310`:

1. **Điều kiện trạng thái tài khoản:** User phải tồn tại và có `status === 'ACTIVE'` (`return.service.ts:95-100`).
2. **Điều kiện sở hữu đơn hàng:** `order.userId === userId`, nếu khác trả `403 FORBIDDEN` (`return.service.ts:128-134`).
3. **Điều kiện trạng thái đơn hàng:** Bắt buộc `order.orderStatus === 'DELIVERED'` (`return.service.ts:137-143`). Các đơn `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `CANCELLED` đều bị từ chối `400 ORDER_NOT_DELIVERED`.
4. **Thời hạn 7 ngày tính nghiêm ngặt từ `deliveredAt`:**
   - Nếu `order.deliveredAt` là `null` → từ chối `400 ORDER_MISSING_DELIVERED_DATE` (**tuyệt đối KHÔNG fallback sang `updatedAt` hay `createdAt`**, xác minh tại `return.service.ts:146-152` và test `RET-04B`, `RET-04C`).
   - Công thức: `diffDays = (now.getTime() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)`. Nếu `diffDays > 7` → từ chối `400 RETURN_WINDOW_EXPIRED` (`return.service.ts:154-165`).
5. **Hỗ trợ nhiều sản phẩm trong 1 yêu cầu:** `input.items` là mảng có tối thiểu 1 phần tử (`min(1)`), mỗi item có `orderItemId`, `quantity`, và `resolution` riêng (`return.service.ts:198-251`).
6. **Quy tắc tính số lượng tối đa & chống trùng lặp theo từng `orderItemId`:**
   - Backend truy vấn tất cả `returnRequest` của đơn hàng có `status: { not: 'REJECTED' }` (`PENDING`, `APPROVED`, `PROCESSING`, `COMPLETED`) (`return.service.ts:171-179`).
   - Cộng dồn `alreadyRequested` theo từng `orderItemId`; `remainingEligible = orderItem.quantity - alreadyRequested` (`return.service.ts:218-219`).
   - Nếu `remainingEligible <= 0` hoặc `item.quantity > remainingEligible` → từ chối `400 RETURN_QUANTITY_EXCEEDED` (`return.service.ts:221-235`).
   - Yêu cầu cũ bị `REJECTED` **KHÔNG** tiêu thụ hạn mức → khách hàng được phép gửi lại yêu cầu cho số lượng đó (xác minh qua `QTY-01` trong `returns_state_machine.unit.test.ts:120-131`).
   - Cho phép tạo nhiều yêu cầu đổi/trả cho các phần số lượng còn lại của cùng một đơn hàng trong hạn 7 ngày (`RET-07`).
   - **[FACT] Edge case lưu ý trong Backend:** Nếu client gửi 2 phần tử trùng `orderItemId` trong cùng 1 mảng `input.items`, vòng `for` ở `return.service.ts:198-251` không cộng dồn nội bộ trong cùng request. Frontend phải gộp/chống chọn trùng `orderItemId` trong form UI (1 dòng/checkbox duy nhất cho mỗi `orderItemId`).
7. **Lý do & hình thức giải quyết:**
   - `reason`: chuỗi văn bản tự do 3–255 ký tự (Frontend có thể cung cấp gợi ý nhanh hoặc nhập tự do, không làm mất tính linh hoạt của schema).
   - `resolution` từng sản phẩm: `REFUND` (Hoàn tiền), `REPLACE` (Đổi sản phẩm mới), `REPAIR` (Bảo hành sửa chữa).
8. **Quy tắc tạo, cập nhật, hủy từ phía Customer:**
   - **Tạo:** Hợp lệ qua `POST /api/v1/profile/returns` → tạo trạng thái khởi đầu `PENDING`, `isResellable: false`, ghi 1 `ReturnAuditLog` (`PENDING → PENDING`, role `CUSTOMER`) và 1 `Notification` (`type: 'RETURN'`) trong cùng Prisma `$transaction` (`return.service.ts:259-307`).
   - **Cập nhật / Hủy bởi Customer:** **KHÔNG ĐƯỢC HỖ TRỢ** trong Backend (`profile.routes.ts:50-55` không có `PUT`/`PATCH`/`DELETE`). Frontend tuyệt đối không hiển thị nút Sửa hay Hủy yêu cầu.

---

## 5. RETURN STATE MACHINE `[FACT]`

Định nghĩa chính thức tại `apps/api/src/modules/order/return.service.ts:68-74`:

```text
PENDING ──▶ APPROVED ──▶ PROCESSING ──▶ COMPLETED  (Terminal)
   │           │             │
   └───────────┴─────────────┴──▶ REJECTED          (Terminal)
```

| Từ trạng thái | Các trạng thái kế tiếp hợp lệ | Ai được phép chuyển? | Ghi chú & Ràng buộc |
|---|---|---|---|
| `PENDING` | `APPROVED`, `REJECTED` | Chỉ `ADMIN` / `STAFF` (`admin.routes.ts:10,85`) | Khách hàng không có quyền chuyển trạng thái |
| `APPROVED` | `PROCESSING`, `REJECTED` | Chỉ `ADMIN` / `STAFF` | Không được nhảy cóc sang `COMPLETED` (`RET-15`) |
| `PROCESSING` | `COMPLETED`, `REJECTED` | Chỉ `ADMIN` / `STAFF` | Khi `REJECTED` bắt buộc có `rejectionReason` (`RET-17`) |
| `COMPLETED` | `[]` (Terminal — không thể quay ngược) | Không ai | Set `resolvedAt = new Date()`, khóa hàng bằng `SELECT ... FOR UPDATE` (`return.service.ts:486-488`) |
| `REJECTED` | `[]` (Terminal — không thể quay ngược) | Không ai | Set `rejectionReason` + `resolvedAt = new Date()` |

### Quy tắc hoàn kho, Audit Log & Notification khi chuyển trạng thái:
- **Hoàn kho (`return.service.ts:544-593`):** CHỈ xảy ra khi `targetStatus === 'COMPLETED'` **VÀ** item được Admin/Staff đánh dấu `isResellable === true`. Khi đó cộng nguyên tử `product.stockQuantity: { increment: rItem.quantity }` và ghi `InventoryLog` (`changeType: 'RETURN'`, `referenceType: 'RETURN_REQUEST'`, `referenceId: returnCode`). Nếu `isResellable === false` (hàng hỏng không thể bán lại) → **KHÔNG hoàn kho**, **KHÔNG tạo `InventoryLog`** (`INV-02`).
- **Audit Log (`return.service.ts:614-627`):** Mọi chuyển trạng thái ghi 1 bản ghi vào `return_audit_logs` (`fromStatus`, `toStatus`, `actorId`, `actorRole`, `notes`, `createdAt`).
- **Notification (`return.service.ts:630-640`):** Tự động tạo 1 `Notification` (`type: 'RETURN'`) cho khách hàng mỗi khi tạo mới hoặc thay đổi trạng thái (do đó sau khi Customer tạo yêu cầu thành công, Frontend nên invalidate thêm `['notifications']` để đồng bộ badge thông báo!).

---

## 6. AUTHORIZATION VÀ OWNERSHIP ANALYSIS `[FACT]`

| Kiểm soát bảo mật | Cơ chế xác minh trong Backend | Trạng thái |
|---|---|---|
| **Authentication** | `profile.routes.ts:11` áp dụng `router.use(requireAuth())` cho toàn bộ `/profile/*` → Guest nhận `401 UNAUTHORIZED` (`RET-11`). | `VERIFIED SAFE` |
| **Anti-IDOR khi tạo yêu cầu** | `return.service.ts:128-134` kiểm tra `order.userId !== userId` → `403 FORBIDDEN` (`RET-02`). `userId` lấy trực tiếp từ `req.user.sub` (JWT), không nhận từ body. | `VERIFIED SAFE` |
| **Anti-IDOR khi xem danh sách** | `return.service.ts:324-326` lọc cứng `where: { userId }`. | `VERIFIED SAFE` |
| **Anti-IDOR khi xem chi tiết** | `return.service.ts:377-379` kiểm tra `returnRequest.userId !== userId` → `403 FORBIDDEN` (`RET-10`). | `VERIFIED SAFE` |
| **Chặn Customer gọi Admin Returns API** | `admin.routes.ts:10` áp dụng `requireAuth(['ADMIN', 'STAFF'])` → `CUSTOMER` nhận `403 FORBIDDEN` (`RET-12`). | `VERIFIED SAFE` |
| **Không lộ dữ liệu quản trị nội bộ** | `getOwnReturns` & `getOwnReturnDetail` không trả thông tin khách hàng khác; tuy nhiên trả `auditLogs` (gồm `actorName`, `actorRole`, `notes` trạng thái) và `isResellable` trong `items`. Frontend chỉ hiển thị các thông tin thân thiện cho khách hàng (timeline trạng thái, lý do từ chối nếu có, trạng thái kiểm định). | `VERIFIED SAFE` |

---

## 7. FRONTEND CURRENT-STATE INVENTORY `[FACT]`

| Khu vực | File & Line Reference | Hiện trạng thực tế |
|---|---|---|
| **Routes** | `apps/web/src/routes/AppRoutes.tsx:106-116` | Có `/profile/return` và `/profile/return/:id` trỏ về `ProfilePage`. **LỖI:** Thiếu `/profile/returns` (số nhiều) trong khi `ProfilePage.tsx:51` điều hướng sang `/profile/returns` → gây 404 khi bấm tab `"Yêu cầu đổi trả"`! (Lưu ý: `/returns` ở dòng 153 là trang chính sách công khai `PolicyPage`, KHÔNG phải tài khoản khách hàng.) |
| **Profile Tabs & Deep Link** | `apps/web/src/features/profile/ProfilePage.tsx:21-52,612` | `ProfileTab` đã có `'returns'` (`label: 'Yêu cầu đổi trả'`). `getTabFromPath()` check `location.pathname.includes('/return')`. Hiện chưa đọc `:id` từ `/profile/return/:id`. |
| **Orders Query** | `apps/web/src/features/profile/ProfilePage.tsx:424-440` | Đã fetch `GET /orders/my-orders` với `queryKey: ['my-orders', currentUser?.id]`, trả về `OrderDto[]` (đã gồm `deliveredAt` và `items[]`). |
| **Orders Tab** | `apps/web/src/features/profile/ProfilePage.tsx:913-1010` | Hiển thị danh sách đơn hàng nhưng chưa có nút dẫn nhanh sang tạo yêu cầu đổi/trả cho đơn `DELIVERED` trong hạn 7 ngày. |
| **Returns Tab (Current)** | `apps/web/src/features/profile/ProfilePage.tsx:1911-2067` | **Form giả (dead UI):** `onSubmit` chỉ gọi `showToast(...)` giả, không gọi API, liệt kê mọi `userOrders` không lọc điều kiện, không có chọn sản phẩm/số lượng, không có danh sách yêu cầu đã gửi, không có xem chi tiết/timeline. |
| **API Client & Auth** | `apps/web/src/lib/apiClient.ts`, `apps/web/src/services/authService.ts` | `apiClient` tự đính kèm `Authorization: Bearer <token>` với `baseURL` đã chứa `/api/v1`. Chưa có `returnService.ts`. |
| **UI Patterns có sẵn** | `ProfilePage.tsx:42-47,1252-1645` | Có sẵn `showToast(msg)`, modal overlay `role="dialog"` / `aria-modal="true"`, inline error banner, `useQuery`/`useMutation`/`useQueryClient`, và `CreateReturnRequestInputSchema` từ `@nexora/shared`. |

---

## 8. TECHPILOT UI/UX PARITY

- **[FACT]** Thư mục `D:\Nexora\TechPilot` **không tồn tại** trong workspace hiện tại (`Test-Path TechPilot === False`), do đó mã nguồn PHP gốc của TechPilot nằm ngoài phạm vi truy cập của phiên đọc này → chi tiết HTML/CSS gốc của `profile/return.php` là **[UNKNOWN]** trong workspace này.
- **[FACT]** Theo hồ sơ đối chiếu migration đã lưu trong repository (`docs/13-migration/ROUTE_PARITY_MATRIX.md:54`, `docs/13-migration/FUNCTIONAL_PARITY_MATRIX.md:49`, `docs/17-functional-parity-phase-b/PHASE_B_EXECUTION_PLAN.md:196`):
  - TechPilot có luồng `/profile/return/{id}` (`ProfileController@return`) với chính sách đổi trả miễn phí trong **7 ngày** và 3 hình thức: Đổi sản phẩm mới (`REPLACE`), Hoàn tiền (`REFUND`), Bảo hành sửa chữa (`REPAIR`).
  - `ProfilePage.tsx:1911-2067` đã dựng sẵn giao diện cơ sở theo định hướng đó; M6.4 sẽ giữ đúng ngôn ngữ thiết kế của `ProfilePage.tsx` (màu `#0A5BFF`, `#F8FAFC`, `#E2E8F0`, font & border radius nhất quán) đồng thời thay phần form giả bằng luồng thật đầy đủ: Lịch sử yêu cầu + Chi tiết/Timeline + Form tạo yêu cầu chọn đơn đủ điều kiện, chọn từng sản phẩm & số lượng.

---

## 9. PROPOSED CUSTOMER WORKFLOW

1. **Điều hướng vào Tab Đổi Trả (`/profile/return` hoặc `/profile/return/:id`):**
   - Nếu chưa đăng nhập (`!currentUser`): không gọi API `/profile/returns`, hiển thị lời nhắc + nút đăng nhập (giữ nguyên chuẩn của `ProfilePage.tsx`).
   - Nếu đã đăng nhập: tải đồng thời `GET /profile/returns` (`page`, `limit: 10`) và `GET /orders/my-orders`.
2. **Xem Lịch Sử Yêu Cầu Đổi/Trả:**
   - Hiển thị danh sách yêu cầu của khách hàng (mới nhất lên đầu): `returnCode`, `orderCode`, ngày tạo, badge trạng thái màu rõ ràng (`Chờ duyệt / PENDING`, `Đã duyệt / APPROVED`, `Đang xử lý / PROCESSING`, `Hoàn tất / COMPLETED`, `Từ chối / REJECTED`), tóm tắt sản phẩm, và nút **"Xem chi tiết"**.
   - Phân trang khi `total > limit`.
   - Đầy đủ trạng thái: Loading, Error (+ nút Thử lại), Empty (*"Bạn chưa có yêu cầu đổi/trả nào."*).
3. **Xem Chi Tiết Yêu Cầu Đổi/Trả (`GET /profile/returns/:id`):**
   - Mở modal `role="dialog"` (hoặc tự mở khi truy cập deep-link `/profile/return/:id`).
   - Hiển thị: mã yêu cầu, mã đơn hàng, trạng thái hiện tại, ngày tạo, `resolvedAt` (nếu có), lý do (`reason`), ghi chú (`notes`), **lý do từ chối (`rejectionReason`)** nếu `status === 'REJECTED'`, danh sách sản phẩm yêu cầu (`productName`, `productSku`, `quantity`, `resolution` tiếng Việt, và thông tin kiểm định khi `COMPLETED`), và **lịch sử tiến trình (`auditLogs`)** theo thứ tự thời gian tăng dần.
   - **Không có nút Sửa hoặc Hủy** (khớp 100% Backend).
4. **Tạo Yêu Cầu Đổi/Trả Mới (`POST /profile/returns`):**
   - Bấm **"Tạo yêu cầu đổi/trả"** (hoặc bấm nút tắt từ một đơn `DELIVERED` trong hạn 7 ngày ở Tab Đơn hàng).
   - **Chọn đơn hàng:** Phân tách rõ đơn đủ điều kiện (`orderStatus === 'DELIVERED'` & `deliveredAt != null` & `<= 7 ngày`) với đơn không đủ điều kiện (hiển thị lý do cụ thể: *"Chưa giao hàng"*, *"Thiếu mốc ngày giao hàng"*, hoặc *"Đã quá hạn 7 ngày kể từ ngày nhận hàng"*).
   - **Chọn sản phẩm & số lượng:** Hiển thị danh sách `order.items[]` của đơn đã chọn; với mỗi sản phẩm tính và hiển thị `Còn có thể đổi/trả: X / Y` (đã trừ các yêu cầu không `REJECTED` trước đó). Cho phép tick chọn 1 hoặc nhiều sản phẩm, nhập số lượng `1..remainingEligible`, chọn `resolution` (`REFUND` / `REPLACE` / `REPAIR`). Sản phẩm có `remainingEligible === 0` bị disable kèm chú thích *"Đã yêu cầu toàn bộ số lượng"*.
   - **Nhập lý do & mô tả:** `reason` bắt buộc (3–255 ký tự sau trim), `notes` tùy chọn (tối đa 2000 ký tự).
   - **Validate & Submit:** Kiểm tra bằng `CreateReturnRequestInputSchema` (chống nhập khoảng trắng thuần cho `reason`, chặn số lượng > `remainingEligible`, chặn mảng items rỗng), chống click đúp (`useRef` + `isPending`).
   - **Sau khi tạo thành công:** Đóng form/modal, hiển thị toast thành công, invalidate `['customer-returns']` và `['notifications']`.

---

## 10. EXACT FRONTEND FILE ALLOWLIST (ĐỀ XUẤT)

| Nhóm | File Path | Mục đích & Lý do |
|---|---|---|
| **File mới #1** | `apps/web/src/services/returnService.ts` | Typed service gọi 3 Customer endpoints (`getOwnReturns`, `getOwnReturnDetail`, `createReturnRequest`) qua `apiClient`, kèm helpers tính điều kiện 7 ngày từ `deliveredAt` và tính `remainingEligible` theo đúng logic backend. |
| **File mới #2** | `apps/web/src/features/profile/components/CustomerReturnsTab.tsx` | Tách gọn toàn bộ UI Customer Returns (Lịch sử + Phân trang + Modal Chi tiết & Audit Timeline + Form/Modal Tạo yêu cầu đa sản phẩm) khỏi `ProfilePage.tsx` (hiện đã 2,270 dòng), giữ code sạch và dễ test. |
| **File mới #3** | `apps/web/tests/m6_4_customer_returns.test.tsx` | Bộ test Vitest + RTL bao phủ đủ 14 kịch bản yêu cầu ở Mục 6 của Discovery Order. |
| **File sửa #1** | `apps/web/src/features/profile/ProfilePage.tsx` | Thay Tab `returns` mockup (dòng 1911–2067) bằng `<CustomerReturnsTab />`; sửa lỗi `handleTabChange('returns')` điều hướng đúng `/profile/return` (hết 404); hỗ trợ deep link `/profile/return/:id`; thêm nút tắt đổi/trả cho đơn đủ điều kiện trong Tab `orders`; dọn cache returns khi logout. |
| **File sửa #2 *(Tùy chọn — chờ Owner chốt)*** | `apps/web/src/routes/AppRoutes.tsx` | Thêm 2 dòng alias `<Route path="/profile/returns" ... />` và `<Route path="/profile/returns/:id" ... />` song song `/profile/return` để cả URL số ít lẫn số nhiều đều không bao giờ gặp 404. *(Nếu Owner muốn khóa cứng 4 file và không đụng `AppRoutes.tsx`, sửa riêng `ProfilePage.tsx` vẫn hoạt động 100%.)* |

- **File tái sử dụng (không sửa):** `apps/web/src/lib/apiClient.ts`, `apps/web/src/services/authService.ts`, `packages/shared/src/index.ts` (`CreateReturnRequestInputSchema`, `ReturnRequestDto`, `OrderDto`, `ReturnRequestStatus`, `ReturnResolution`).
- **Ngoài phạm vi (tuyệt đối không chạm):** `apps/api/**`, `packages/shared/**`, `prisma/**`, 5 file M6.3 (`ProductDetailPage.tsx`, `reviewService.ts`, `ReviewList.tsx`, `ReviewFormModal.tsx`, `m6_3_customer_reviews.test.tsx`), Admin Dashboard, STAFF workflows, `TechPilot/`, `audit-output/`.

---

## 11. API INTEGRATION MAPPING

| Thao tác Frontend | Backend Endpoint | Request | Response Parsing | Query Keys / Invalidation |
|---|---|---|---|---|
| Tải danh sách yêu cầu đổi/trả | `GET /profile/returns` | Query `{ page, limit: 10 }` | `res.data.returns`, `res.data.total`, `res.data.page`, `res.data.limit` *(top-level)* | Query: `['customer-returns', currentUser?.id, page, limit]` |
| Tải tất cả yêu cầu hiện có để tính hạn mức còn lại | `GET /profile/returns` | Query `{ page: 1, limit: 100 }` | `res.data.returns` | Query: `['customer-returns', currentUser?.id, 'eligibility-index']` *(hoặc suy ra từ query danh sách nếu `total <= limit`)* |
| Xem chi tiết yêu cầu | `GET /profile/returns/:id` | Path `:id` (numeric `returnId`) | `res.data.data` (`ReturnRequestDto`) | Query: `['customer-return-detail', currentUser?.id, returnId]` |
| Tạo yêu cầu đổi/trả mới | `POST /profile/returns` | Body `{ orderId, reason, notes?, items: [{ orderItemId, quantity, resolution }] }` | `res.data.data` (`ReturnRequestDto`), `res.data.message` | Invalidate: `['customer-returns']`, `['notifications']` |
| Tải danh sách đơn hàng của tôi | `GET /orders/my-orders` *(existing)* | Bearer token | `res.data.data` (`OrderDto[]` có `deliveredAt` & `items[]`) | Existing key: `['my-orders', currentUser?.id]` |
| Đăng xuất | *(client logout)* | — | — | `removeQueries({ queryKey: ['customer-returns'] })`, `removeQueries({ queryKey: ['customer-return-detail'] })` |

---

## 12. TEST PLAN VÀ ACCEPTANCE CRITERIA

### 12.1. Hiện trạng Test Backend (Đã xác minh)
- **[FACT] Pure Unit Test (0 DB access — ĐÃ CHẠY THỰC TẾ TRONG DISCOVERY):**
  - Command: `npx vitest run apps/api/tests/returns_state_machine.unit.test.ts`
  - Result: **PASS — 12/12 tests passed (8ms)** (`SM-01..04`, `WIN-01..03`, `QTY-01..02`, `SCHEMA-01..03`).
- **[FACT] Backend Integration Test (`apps/api/tests/phase_b_returns_and_admin_crud.test.ts` — 25 tests: `RET-01..18`, `INV-01..05`, `CAT-01..05`):**
  - Cố ý **KHÔNG chạy** trong Phase A vì có ghi dữ liệu thật vào MySQL (`beforeAll`/`afterAll`). Đã xác minh trực tiếp qua đọc source code.

### 12.2. Kế hoạch Kiểm thử Frontend M6.4 (`apps/web/tests/m6_4_customer_returns.test.tsx` — 100% an toàn, jsdom, 0 DB mutation)
1. Customer xem lịch sử yêu cầu đổi/trả (`GET /profile/returns` với top-level `returns/total/page/limit`) + phân trang.
2. Customer xem chi tiết yêu cầu (`GET /profile/returns/:id`) gồm sản phẩm, `rejectionReason`, và timeline `auditLogs`.
3. Tạo yêu cầu đổi/trả hợp lệ cho đơn `DELIVERED` trong hạn 7 ngày (1 sản phẩm và nhiều sản phẩm, đúng enum `REFUND`/`REPLACE`/`REPAIR`).
4. Chặn đơn hàng quá hạn 7 ngày kể từ `deliveredAt` (và đơn `deliveredAt === null`).
5. Chặn đơn hàng chưa `DELIVERED` (`PENDING`, `SHIPPED`, `CANCELLED`).
6. Xác minh chỉ sản phẩm thuộc đơn hàng đang chọn mới có thể đưa vào payload (`orderItemId` khớp `order.items[]`) và xử lý lỗi `400 INVALID_RETURN_ITEM` từ backend.
7. Chặn số lượng trả vượt quá số lượng đã mua / `remainingEligible` (sau khi trừ yêu cầu không `REJECTED`; bỏ qua yêu cầu `REJECTED`).
8. Validate `reason` (< 3 ký tự, > 255 ký tự, chuỗi khoảng trắng thuần), `notes` (> 2000 ký tự) và bắt buộc chọn tối thiểu 1 sản phẩm.
9. Xử lý yêu cầu trùng lặp / hết hạn mức trả hàng (hiển thị đúng thông báo `RETURN_QUANTITY_EXCEEDED`).
10. Xử lý lỗi `400`, `401`, `403`, `404`, `500` trên cả list, detail và create.
11. Đầy đủ trạng thái Loading, Empty và Error (+ nút Thử lại).
12. Query invalidation sau `POST` thành công (`['customer-returns']`, `['notifications']`) và xóa cache khi logout.
13. Không hiển thị nút Sửa/Hủy hoặc nút chuyển trạng thái Admin/STAFF cho khách hàng; Guest không gọi `/profile/returns`.
14. Điều hướng tab `"Yêu cầu đổi trả"` không bị 404 và hiển thị bố cục responsive cơ bản (flex-wrap/grid).

### 12.3. Acceptance Criteria đề xuất cho Implementation M6.4
- Đúng file allowlist được Owner phê duyệt (4 hoặc 5 files); 0 thay đổi Backend/Shared/Prisma/M6.3.
- Lỗi 404 khi bấm tab `"Yêu cầu đổi trả"` được xử lý triệt để.
- Toàn bộ `m6_4_customer_returns.test.tsx` (≥14 tests) + toàn bộ frontend test suites PASS.
- `npm run typecheck`, `npm run lint`, `npx prettier --check`, `npm run build -w @nexora/web` đều PASS (exit code 0).

---

## 13. BLOCKERS, RISKS VÀ ASSUMPTIONS

### 13.1. Blockers
- **Technical Blockers:** **KHÔNG CÓ (0 blockers kỹ thuật).** Toàn bộ Backend API M5, `OrderDto.deliveredAt`, và Shared Zod schemas đã sẵn sàng 100%.
- **Process / Git Hygiene Condition (CẦN CHỐT TRƯỚC IMPLEMENTATION):** 5 file của M6.3 hiện đang chưa được commit trong working tree (`ProductDetailPage.tsx` modified + 4 file untracked). Theo lưu ý của Project Owner, nên chốt Git commit riêng cho M6.3 trước khi bắt đầu viết code M6.4 để không trộn lẫn 2 milestone.

### 13.2. Risks & Điểm cần Project Owner quyết định
1. **Quyết định #1 — Route Alias trên `AppRoutes.tsx`:** Cho phép mở rộng allowlist thêm `apps/web/src/routes/AppRoutes.tsx` (tổng 5 files) để thêm alias `/profile/returns` & `/profile/returns/:id`, **HAY** giữ gọn 4 files và chỉ sửa `handleTabChange('returns')` trong `ProfilePage.tsx` thành `/profile/return`? *(Khuyến nghị: cho phép cả 5 files để tránh 404 nếu người dùng/bookmark gõ `/profile/returns`.)*
2. **Quyết định #2 — Trường `images` trên Form tạo yêu cầu:** Schema `CreateReturnRequestInputSchema` có `images?: string[] | null`, nhưng Backend **không có endpoint upload file ảnh** cho Returns. Đề xuất **KHÔNG** đưa upload ảnh vào M6.4 (hoặc chỉ giữ `images` là không bắt buộc/không hiển thị input file upload).
3. **Rủi ro tính `remainingEligible` khi khách có > 100 yêu cầu đổi/trả:** Frontend giới hạn truy vấn `limit: 100` để tính hạn mức hiển thị trước, đồng thời luôn hiển thị thông báo lỗi `RETURN_QUANTITY_EXCEEDED` từ Backend làm nguồn chân lý cuối cùng.
4. **Rủi ro đồng hồ client lệch giờ so với server ở sát mốc 7 ngày:** Client kiểm tra `deliveredAt` để hướng dẫn UX, nhưng Backend luôn là nguồn chân lý cuối cùng (`RETURN_WINDOW_EXPIRED`).

---

## 14. GIT VÀ DATABASE SAFETY VERIFICATION `[FACT]`

- **Branch:** `main`
- **HEAD:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81` *(không đổi)*
- **5 file chưa commit của M6.3:** Bảo toàn 100% nguyên trạng (không sửa, không stage, không commit, không xóa).
- **Database Mutation Status:** **ZERO MUTATIONS** (chỉ chạy duy nhất 12/12 pure in-memory unit tests `returns_state_machine.unit.test.ts`; không chạy integration test ghi MySQL).
- **Commit / Push Status:** Không stage, không commit, không push.
- **Sole New Deliverable Created:** `comprehensive-audit/23_M6_4_CUSTOMER_RETURNS_PRE_IMPLEMENTATION_DISCOVERY.md`

---

## 15. FINAL DISCOVERY DECISION

### ✅ **`READY WITH CONDITIONS`**

- **Kỹ thuật:** Đủ 100% bằng chứng Backend API, DTO, Business Rules, State Machine, Ownership và Frontend architecture — **0 technical blockers**.
- **2 điều kiện cần Project Owner phê duyệt trước khi bắt đầu Implementation M6.4:**
  1. Chốt trạng thái Git cho 5 file M6.3 (lệnh commit riêng M6.3 hoặc xác nhận giữ nguyên trạng thái trước khi mở M6.4).
  2. Chốt file allowlist M6.4 (**4 files** không chạm `AppRoutes.tsx` hay **5 files** có thêm alias `/profile/returns` trên `AppRoutes.tsx`) và xác nhận không triển khai upload file ảnh trong M6.4.

Agent dừng toàn bộ thao tác tại đây và chờ **Official Implementation Order M6.4** (hoặc lệnh commit riêng cho M6.3) từ Project Owner.
