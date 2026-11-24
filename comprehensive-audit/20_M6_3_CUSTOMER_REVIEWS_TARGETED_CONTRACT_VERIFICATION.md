# NEXORA — M6.3 CUSTOMER REVIEWS
## PHASE A2 — TARGETED CONTRACT VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81`
- **Mode:** STRICT READ-ONLY — NO IMPLEMENTATION
- **Verification Scope:** 6 Targeted Groups (`R1` – `R6`)
- **Final Status:** `READY FOR IMPLEMENTATION` (chờ Owner ban hành Official Implementation Order M6.3; giữ nguyên kỷ luật 0 thay đổi code/DB)

---

## 1. DTO AND VALIDATION EVIDENCE (R1)

Tất cả DTO và Zod validation schemas của module Reviews được định nghĩa tập trung tại `packages/shared/src/index.ts:617-671` và được backend tiêu thụ trực tiếp tại `apps/api/src/modules/catalog/review.controller.ts:3,48,81`.

### 1.1. Request DTOs (`POST` và `PUT`)

| Field | Schema Source | Type & Constraints | Required? | Edge-Case Behavior (Verified from Source) |
|---|---|---|---|---|
| `rating` | `packages/shared/src/index.ts:637-641` | `z.number().int().min(1).max(5)` | **Bắt buộc** ở cả `POST` và `PUT` | Số thực (`4.5`), `0`, `6`, `NaN` hoặc thiếu `rating` đều bị từ chối `400 VALIDATION_ERROR`. Message: `"Số sao phải là số nguyên."`, `"Số sao tối thiểu là 1."`, `"Số sao tối đa là 5."` |
| `comment` | `packages/shared/src/index.ts:642-648` | `z.string().trim().min(5).max(1000).optional().or(z.literal(''))` | **Tùy chọn** | - `undefined` → Hợp lệ, lưu `null` (`review.service.ts:68,219`).<br>- `""` (rỗng) → Hợp lệ qua `.or(z.literal(''))`, lưu `null`.<br>- `"   "` (chỉ khoảng trắng) → **BỊ TỪ CHỐI `400 VALIDATION_ERROR`** vì nhánh 1 `.trim()` ra `""` thất bại `.min(5)` và nhánh 2 `z.literal('')` không khớp `"   "`.<br>- `null` → **BỊ TỪ CHỐI `400 VALIDATION_ERROR`** (không có `.nullable()`).<br>- 1–4 ký tự (sau trim) → `400 VALIDATION_ERROR` (`"Nhận xét đánh giá tối thiểu 5 ký tự."`).<br>- > 1000 ký tự (sau trim) → `400 VALIDATION_ERROR` (`"Nhận xét đánh giá tối đa 1000 ký tự."`). |

- **Khớp `POST` và `PUT` DTO:** `UpdateReviewInputSchema = CreateReviewInputSchema` (`packages/shared/src/index.ts:652-653`). Do đó `PUT /api/v1/catalog/reviews/:id` **KHÔNG phải partial update** — Frontend phải gửi đủ `rating` (1–5) và `comment` (hoặc `""`/`undefined`, tuyệt đối không gửi `null` hoặc chuỗi chỉ gồm khoảng trắng).
- **Quy tắc chuẩn hóa trên Frontend trước khi submit:** `const trimmed = comment.trim();` → chỉ gửi `comment: trimmed.length > 0 ? trimmed : undefined` (hoặc `""`).

### 1.2. Path Parameter ID Types (`Product ID` và `Review ID`)

| Endpoint | Param `:id` | Validation Source | Accepted Input | Error on Invalid |
|---|---|---|---|---|
| `GET /api/v1/catalog/products/:id/reviews` | `productIdOrSlug` | `review.service.ts:334-357` (`resolveProductId`) | `number` / numeric string (`/^\d+$/`) **HOẶC** `slug` string | `404 PRODUCT_NOT_FOUND` |
| `GET /api/v1/catalog/products/:id/reviews/eligibility` | `productIdOrSlug` | `review.service.ts:334-357` (`resolveProductId`) | `number` / numeric string (`/^\d+$/`) **HOẶC** `slug` string | `404 PRODUCT_NOT_FOUND` |
| `POST /api/v1/catalog/products/:id/reviews` | `productId` | `review.controller.ts:42-46` (`parseInt(rawId, 10)`) | **BẮT BUỘC số nguyên dương** (`> 0`). Slug sẽ bị lỗi `NaN` | `400 INVALID_PRODUCT_ID` |
| `PUT /api/v1/catalog/reviews/:id` | `reviewId` | `review.controller.ts:76-79` (`parseInt(..., 10)`) | **BẮT BUỘC số nguyên dương** (`> 0`) | `400 INVALID_REVIEW_ID` |
| `DELETE /api/v1/catalog/reviews/:id` | `reviewId` | `review.controller.ts:109-112` (`parseInt(..., 10)`) | **BẮT BUỘC số nguyên dương** (`> 0`) | `400 INVALID_REVIEW_ID` |

- **Prisma DB types (`prisma/schema.prisma:281-289`):** `id`, `productId`, `userId` đều là `Int @db.UnsignedInt` (số nguyên dương JS `number`); `rating` là `Int @db.TinyInt`; `comment` là `String? @db.Text`; `createdAt`/`updatedAt` là `DateTime` được serialize bằng `.toISOString()` (`review.service.ts:385-386`).

### 1.3. Error Codes & HTTP Status Matrix (Verified from Source)

Tất cả lỗi đều đi qua `errorHandler` tại `apps/api/src/middleware/errorHandler.ts:6-49` với format cố định:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Thông báo lỗi tiếng Việt",
    "details": []
  }
}
```
*(Trường `details` chỉ xuất hiện khi `err.details` được truyền vào `AppError` hoặc khi ném trực tiếp `ZodError`; trong `review.controller.ts:51,84` lỗi Zod được bọc thành `AppError(400, 'VALIDATION_ERROR', firstMessage)` không kèm `details`.)*

| HTTP Status | Error `code` | Exact `message` | Trigger Condition & Source Line |
|---|---|---|---|
| `400` | `INVALID_PRODUCT_ID` | `"ID sản phẩm không hợp lệ."` | `POST /products/:id/reviews` với `:id` không phải số nguyên dương (`review.controller.ts:45`) |
| `400` | `INVALID_REVIEW_ID` | `"ID đánh giá không hợp lệ."` | `PUT` / `DELETE /reviews/:id` với `:id` không phải số nguyên dương (`review.controller.ts:78,111`) |
| `400` | `VALIDATION_ERROR` | `parsed.error.issues[0]?.message` hoặc `"Dữ liệu đánh giá không hợp lệ."` | Body không vượt qua `CreateReviewInputSchema` / `UpdateReviewInputSchema` (`review.controller.ts:51,84`) |
| `401` | `UNAUTHORIZED` | `"Yêu cầu đăng nhập để thực hiện chức năng này."` | Thiếu header `Authorization: Bearer ...` ở `requireAuth` (`auth.middleware.ts:44`) |
| `401` | `INVALID_TOKEN` | `"Phiên đăng nhập đã hết hạn hoặc không hợp lệ."` | Token sai chữ ký hoặc hết hạn (`auth.middleware.ts:63`) |
| `403` | `VERIFIED_PURCHASE_REQUIRED` | `"Chỉ khách hàng đã mua và nhận sản phẩm thành công mới có thể gửi đánh giá."` | `POST` khi user chưa có `OrderItem` thuộc đơn hàng `orderStatus = 'DELIVERED'` (`review.service.ts:61-65`) |
| `403` | `FORBIDDEN` | `"Bạn chỉ có quyền chỉnh sửa đánh giá của chính mình."` | `PUT /reviews/:id` khi `existing.userId !== userId` (kể cả STAFF/ADMIN) (`review.service.ts:216`) |
| `403` | `FORBIDDEN` | `"Bạn không có quyền xóa đánh giá này."` | `DELETE /reviews/:id` khi `existing.userId !== userId` và role không phải `ADMIN`/`STAFF` (`review.service.ts:252`) |
| `404` | `PRODUCT_NOT_FOUND` | `"Không tìm thấy sản phẩm hoặc sản phẩm không còn hoạt động."` / `"Không tìm thấy sản phẩm."` / `"Không tìm thấy sản phẩm với slug tương ứng."` | Sản phẩm không tồn tại hoặc `status !== 'ACTIVE'` (với `POST`) (`review.service.ts:41-45,342,353`) |
| `404` | `REVIEW_NOT_FOUND` | `"Không tìm thấy đánh giá."` | `PUT` / `DELETE /reviews/:id` với review không tồn tại (`review.service.ts:211,248`) |

---

## 2. API RESPONSE STRUCTURES (R1 + R2)

**Cảnh báo hợp đồng quan trọng:** Các endpoint của module Reviews **KHÔNG có cùng cấu trúc envelope** ở trường `pagination`, `stats`, và `message`. Frontend service (`reviewService.ts`) phải map chính xác từng endpoint theo bảng sau:

### 2.1. `GET /api/v1/catalog/products/:id/reviews` — HTTP `200 OK`
Source: `review.controller.ts:20-25`, `review.service.ts:175-194`, `review.service.ts:359-388`.
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 105,
      "userId": 12,
      "userName": "Nguyễn Văn A",
      "userAvatar": "https://example.com/avatar.jpg",
      "rating": 5,
      "comment": "Sản phẩm chất lượng tốt.",
      "isVerifiedPurchase": true,
      "status": "APPROVED",
      "createdAt": "2026-11-20T10:00:00.000Z",
      "updatedAt": "2026-11-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "stats": {
    "averageRating": 5,
    "totalReviews": 1,
    "ratingBreakdown": {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 1
    }
  }
}
```
> **Lưu ý:** `pagination` và `stats` nằm **cùng cấp (top-level siblings)** với `data`, KHÔNG nằm bên trong `data`. Nếu đọc `res.data.data` duy nhất sẽ làm mất `pagination` và `stats`!

### 2.2. `GET /api/v1/catalog/products/:id/reviews/eligibility` — HTTP `200 OK`
Source: `review.controller.ts:139-142`, `review.service.ts:298-301`.
```json
{
  "success": true,
  "data": {
    "canReview": true,
    "existingReview": null
  }
}
```
*(Khi đã đánh giá, `existingReview` là một object `ReviewDto` đầy đủ như mục 2.1.)*

### 2.3. `POST /api/v1/catalog/products/:id/reviews` — HTTP `201 Created`
Source: `review.controller.ts:55-58`, `review.service.ts:127`.
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productId": 105,
    "userId": 12,
    "userName": "Nguyễn Văn A",
    "userAvatar": null,
    "rating": 5,
    "comment": "Sản phẩm chất lượng tốt.",
    "isVerifiedPurchase": true,
    "status": "APPROVED",
    "createdAt": "2026-11-23T02:00:00.000Z",
    "updatedAt": "2026-11-23T02:00:00.000Z"
  }
}
```
> **Lưu ý:** Luôn trả về HTTP `201` cho cả tạo mới lần đầu lẫn trường hợp upsert cập nhật lại bản ghi cũ (`review.controller.ts:55`).

### 2.4. `PUT /api/v1/catalog/reviews/:id` — HTTP `200 OK`
Source: `review.controller.ts:88-91`, `review.service.ts:232`.
```json
{
  "success": true,
  "data": { "...ReviewDto..." }
}
```

### 2.5. `DELETE /api/v1/catalog/reviews/:id` — HTTP `200 OK`
Source: `review.controller.ts:116-119`, `review.service.ts:259-262`.
```json
{
  "success": true,
  "message": "Đã xóa đánh giá thành công."
}
```
> **Lưu ý:** Endpoint `DELETE` trả về `message` ở **top-level** (`res.data.message`), **KHÔNG có trường `res.data.data`**! Khác với `profileService.deleteAddress` trả `res.data.data`.

---

## 3. RATING AGGREGATION AND PAGINATION (R2)

Xác minh trực tiếp từ `apps/api/src/modules/catalog/review.service.ts:133-195`:

| Hạng mục | Hành vi thực tế trong Backend | Bằng chứng dòng code |
|---|---|---|
| **Review records filter** | Chỉ lấy `where: { productId, status: 'APPROVED' }`. Mọi review `HIDDEN` bị loại khỏi danh sách, tổng số, điểm trung bình và phân bố sao. | `review.service.ts:145,154,158` |
| **Reviewer display info** | `userName: r.user?.fullName \|\| 'Khách hàng'` và `userAvatar: r.user?.avatarUrl \|\| null`. Không lộ email/SĐT/role của người đánh giá. | `review.service.ts:147,379-380` |
| **Rating average** | `averageRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0` (làm tròn 1 chữ số thập phân; `0` khi không có review). | `review.service.ts:173` |
| **Total review count** | `stats.totalReviews === pagination.total` (tổng số review `APPROVED` của sản phẩm trên toàn bộ các trang). | `review.service.ts:153-155,180,185` |
| **Rating distribution** | `stats.ratingBreakdown` luôn đủ 5 key số nguyên `"1"`, `"2"`, `"3"`, `"4"`, `"5"` (khởi tạo bằng `0`, điền từ `db.review.groupBy`). | `review.service.ts:156-171,186-192` |
| **Pagination request** | Query `page` (mặc định `1`, ép `Math.max(1, page \|\| 1)`), `limit` (mặc định `10`, ép `1 <= limit <= 50`). | `review.controller.ts:16-17`, `review.service.ts:139-141` |
| **Pagination response** | `{ page, limit, total, totalPages }` với `totalPages = Math.ceil(total / limit) \|\| 1`. | `review.service.ts:177-182` |
| **Sorting order** | Cố định `orderBy: { createdAt: 'desc' }` (mới nhất lên đầu). Không có query param `sort` hay lọc `rating`. | `review.service.ts:149` |
| **Empty result behavior** | Khi có 0 review `APPROVED`: HTTP `200`, `data: []`, `pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }`, `stats: { averageRating: 0, totalReviews: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }`. | `review.service.ts:163-194`, `phase_b_customer_reviews.test.ts:742-751` |

---

## 4. ELIGIBILITY AND CURRENT-USER REVIEW BEHAVIOR (R3)

Xác minh trực tiếp từ `catalog.routes.ts:19-23`, `auth.middleware.ts:40-65`, `review.controller.ts:129-146`, và `review.service.ts:268-302`.

### 4.1. Hành vi Backend theo từng đối tượng
1. **Guest (không có Bearer token):** `requireAuth(['CUSTOMER', 'STAFF', 'ADMIN'])` trả `401 UNAUTHORIZED` ngay ở middleware (`auth.middleware.ts:43-45`). Frontend **không được gọi** endpoint này khi `!currentUser`.
2. **Authenticated `CUSTOMER` chưa có đơn `DELIVERED` chứa sản phẩm:** Trả `200 OK`, `{ canReview: false, existingReview: null }` (`review.service.ts:275-301`).
3. **Authenticated `CUSTOMER` đã có đơn `DELIVERED`, chưa từng đánh giá:** Trả `200 OK`, `{ canReview: true, existingReview: null }`.
4. **Authenticated `CUSTOMER` đã có đơn `DELIVERED` và đã có đánh giá:** Trả `200 OK`, `{ canReview: true, existingReview: ReviewDto }`.
5. **Authenticated `STAFF` / `ADMIN`:**
   - Middleware `requireAuth(['CUSTOMER', 'STAFF', 'ADMIN'])` cho phép gọi endpoint (`catalog.routes.ts:21`).
   - Tuy nhiên, `review.service.ts:268-302` và `review.service.ts:30-66` **KHÔNG có ngoại lệ cho role `STAFF` hoặc `ADMIN`**: cả hai vẫn phải có `orderItem` thuộc đơn `orderStatus = 'DELIVERED'` của chính `userId` đó thì `canReview` mới là `true`.
   - Frontend **KHÔNG được tự tạo ngoại lệ theo role** — phải tuân thủ hoàn toàn giá trị `canReview` trả về từ Backend.
6. **Xử lý `:id` / `:slug`:** `getReviewEligibility` gọi `resolveProductId(productIdOrSlug)` nên chấp nhận cả numeric ID lẫn slug (`review.service.ts:272`). Tuy nhiên khi đã có `product.id`, Frontend nên truyền nhất quán `product.id` dạng số cho cả 3 endpoint (`GET reviews`, `GET eligibility`, `POST review`).
7. **Phân biệt `POST` (Upsert) vs `PUT` (Edit) khi đã có `existingReview`:**
   - **Phát hiện quan trọng từ source code:**
     - `review.service.ts:285-295`: `existingReview` được tìm theo `userId_productId` mà **không lọc `status = 'APPROVED'`**, nên nếu admin đã ẩn review (`status: 'HIDDEN'`), `existingReview` vẫn được trả về với `status: 'HIDDEN'`.
     - `review.service.ts:88-93` (`POST` upsert) đặt lại `status: 'APPROVED'`, còn `review.service.ts:221-226` (`PUT` update) chỉ cập nhật `rating` và `comment`, giữ nguyên `status` hiện có.
   - **Quy chuẩn hành vi Frontend bắt buộc:**
     - Khi `existingReview === null` và `canReview === true` → Hiển thị nút **"Viết đánh giá"** → Submit gọi **`POST /catalog/products/:productId/reviews`**.
     - Khi `existingReview !== null` → Hiển thị trạng thái đánh giá hiện có của bạn + nút **"Chỉnh sửa đánh giá"** (gọi **`PUT /catalog/reviews/:reviewId`**) và nút **"Xóa đánh giá"** (gọi **`DELETE /catalog/reviews/:reviewId`**). Không dùng `POST` để sửa review đang tồn tại.
     - Nếu `existingReview.status === 'HIDDEN'`, hiển thị ghi chú trung thực rằng đánh giá của bạn hiện đang bị ẩn bởi quản trị viên (không hiển thị công khai).

### 4.2. Bảng quyết định UI cho Frontend (Decision Matrix)

| Trạng thái Auth & Eligibility | Hiển thị CTA / Khu vực tương tác | API gọi khi thao tác |
|---|---|---|
| `!currentUser` (Guest) | Thông báo + nút **"Đăng nhập để viết đánh giá"** (điều hướng `/login`) | Không gọi `/eligibility` |
| `currentUser` đang tải `/eligibility` | Skeleton/loading nhẹ cho khu vực nút đánh giá | `GET /catalog/products/:id/reviews/eligibility` |
| `eligibilityError` (401/network) | Nếu 401 → hiển thị lời nhắc đăng nhập lại; lỗi mạng → hiển thị nút "Thử lại" | Refetch `/eligibility` |
| `existingReview !== null` | Hiển thị thẻ "Đánh giá của bạn" + nút **"Chỉnh sửa"** + nút **"Xóa"** (không hiện nút tạo mới tránh hiểu nhầm upsert) | Edit: `PUT /catalog/reviews/:reviewId`<br>Delete: `DELETE /catalog/reviews/:reviewId` |
| `existingReview === null && canReview === true` | Hiển thị nút **"Viết đánh giá sản phẩm"** mở `ReviewFormModal` (mode `create`) | `POST /catalog/products/:productId/reviews` |
| `existingReview === null && canReview === false` | Hiển thị hộp thông báo không có quyền: *"Chỉ khách hàng đã mua và nhận sản phẩm thành công mới có thể gửi đánh giá."* (ẩn nút tạo đánh giá) | Không gọi mutation |

> **Giới hạn Customer-only cho Delete:** Tuy backend `DELETE /catalog/reviews/:id` cho phép `STAFF`/`ADMIN` xóa review của người khác (`review.service.ts:251`), M6.3 chỉ thuộc phạm vi **Customer Reviews**. Frontend M6.3 **CHỈ hiển thị nút Sửa/Xóa cho đánh giá của chính user đang đăng nhập** (`review.userId === currentUser?.id` hoặc qua thẻ `existingReview`), không xây giao diện moderation cho STAFF/ADMIN.

---

## 5. FRONTEND INTEGRATION CONVENTIONS (R4)

Đối chiếu trực tiếp mã nguồn hiện tại trong `apps/web/src`:

| Thành phần | Quy chuẩn hiện hành (Verified from Source) | File & Line References |
|---|---|---|
| **HTTP Client & Base URL** | `apiClient` dùng `axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL \|\| 'http://localhost:3000/api/v1', timeout: 10000, withCredentials: true })`. Service path bắt đầu bằng `/catalog/...` (không lặp `/api/v1`). | `apps/web/src/lib/apiClient.ts:3-11` |
| **Auth Token Injection** | Request interceptor tự động đọc `localStorage.getItem('nexora_token')` và gán `Authorization: Bearer <token>`. User hiện tại đọc qua `authService.getCurrentUser()` (`localStorage.getItem('nexora_user')`). | `apps/web/src/lib/apiClient.ts:13-19`, `apps/web/src/services/authService.ts:43,143-147` |
| **Error Normalization** | Không có response interceptor chuẩn hóa lỗi trong `apiClient.ts`. Các feature (ví dụ `ProfilePage.tsx:85-88,192-195`) trích xuất `err?.response?.data?.error?.message` với fallback tiếng Việt. `reviewService.ts` / `ReviewFormModal.tsx` nên dùng helper đọc `error.code` và `error.message` tương thích cấu trúc này. | `apps/web/src/features/profile/ProfilePage.tsx:83-90,190-197` |
| **TanStack Query Config** | `AppProviders` cấu hình `staleTime: 30_000`, `refetchOnWindowFocus: false`. | `apps/web/src/app/providers.tsx:8-15` |
| **Existing Query Keys** | `ProductDetailPage.tsx` dùng `['categories']`, `['products']`, `['cart']`, `['wishlist-count']`. `StorefrontHome.tsx` dùng `['reviews', 'home']`. `AdminDashboardPage.tsx` dùng `['admin-reviews']`. `ProfilePage.tsx` dùng `['profile', currentUser?.id]`, `['customer-addresses', currentUser?.id]`. | `ProductDetailPage.tsx:211-231`, `StorefrontHome.tsx:63`, `ProfilePage.tsx:58,118` |
| **Form & Zod Validation** | Đã cài sẵn `react-hook-form@^7.92.0`, `@hookform/resolvers@^7.0.7`, `zod@^4.6.7` (`apps/web/package.json:13,20,22`). `FoundationDashboard.tsx:1,3,21` dùng `useForm` + `zodResolver`; `ProfilePage.tsx:395` dùng `Schema.safeParse()`. Với `ReviewFormModal.tsx`, dùng `CreateReviewInputSchema` từ `@nexora/shared` (qua `zodResolver` hoặc `safeParse` với chuẩn hóa trim trước khi parse) đảm bảo đồng nhất 100% quy tắc backend. | `apps/web/package.json:13-22`, `FoundationDashboard.tsx:1,3,21`, `ProfilePage.tsx:395` |
| **Modal / Dialog Pattern** | Dùng overlay cố định `position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 9999` kèm thuộc tính accessibility `role="dialog"` và `aria-modal="true"`. Xác nhận xóa cũng dùng modal `role="dialog"` thay cho `window.confirm()`. | `apps/web/src/features/profile/ProfilePage.tsx:1252-1278,1614-1645` |
| **Toast / Notification** | `ProductDetailPage.tsx` đã có sẵn `toastMessage` state + `showToast(msg)` (auto-clear 3000ms) và fixed toast banner ở góc dưới phải (`zIndex: 99999`). Tái sử dụng trực tiếp `showToast` bằng callback prop `onNotify` thay vì cài thư viện toast mới. | `apps/web/src/features/catalog/ProductDetailPage.tsx:166,205-208,278-300` |
| **Icons & Styling** | Sử dụng FontAwesome classes (`fa-solid fa-star`, `fa-regular fa-star`, `fa-solid fa-circle-check`) và CSS variables (`--primary`, `--border`, `--text-primary`, `--text-secondary`) đang có sẵn trong `ProductDetailPage.tsx`. | `ProductDetailPage.tsx:465-473,840-885` |

---

## 6. UI STATE AND QUERY INVALIDATION STRATEGY (R5)

### 6.1. Ma trận các trạng thái UI bắt buộc xử lý

| Trạng thái | Vị trí xử lý | Hành vi yêu cầu |
|---|---|---|
| **Loading (Danh sách)** | `ReviewList.tsx` | Hiển thị skeleton/spinner trạng thái đang tải đánh giá khi `isLoading === true` (không hiển thị số `0` giả hoặc mock cũ). |
| **Error (Danh sách)** | `ReviewList.tsx` | Hiển thị khung lỗi rõ ràng + nút **"Thử lại"** gọi `refetch()`. |
| **Empty (0 đánh giá)** | `ReviewList.tsx` | Hiển thị thông điệp *"Chưa có đánh giá nào cho sản phẩm này."* kèm rating `0.0` và các thanh phân bố sao `0%`. |
| **Successful Listing** | `ReviewList.tsx` + `ProductDetailPage.tsx` | Đồng bộ điểm trung bình (`stats.averageRating`) và tổng đánh giá (`stats.totalReviews`) lên cả **Product Header** (`ProductDetailPage.tsx:460-474`), **Tab Label** (`ProductDetailPage.tsx:743`: `Đánh giá & Nhận xét (${totalReviews})`), và khối tổng quan trong Tab 3. |
| **Submit Success / Failure** | `ReviewFormModal.tsx` | Thành công: đóng modal, hiện toast *"Gửi đánh giá thành công!"*, invalidate cache. Thất bại: giữ modal mở, hiển thị lỗi backend cụ thể (`VERIFIED_PURCHASE_REQUIRED`, `VALIDATION_ERROR`, `401`, lỗi mạng). |
| **Edit Success / Failure** | `ReviewFormModal.tsx` | Pre-fill `rating` và `comment` từ `existingReview`; thành công đóng modal + toast *"Cập nhật đánh giá thành công!"* + invalidate cache; thất bại hiển thị lỗi inline. |
| **Delete Confirmation & Result** | `ReviewList.tsx` | Mở modal xác nhận xóa (`role="dialog"`, `aria-modal="true"`) trước khi gọi `DELETE`; disable nút xác nhận khi `isPending`; thành công đóng modal + toast *"Đã xóa đánh giá thành công!"* + invalidate cache; nếu xóa xong trang hiện tại rỗng và `page > 1` thì tự lùi về `page - 1`. |
| **Unauthorized / Eligibility Denied** | `ReviewList.tsx` | Guest: hiện nút đăng nhập; User không đủ điều kiện: hiện thông báo yêu cầu đơn `DELIVERED` và không mở form submit. |
| **Pagination** | `ReviewList.tsx` | Hiển thị điều hướng Trang trước / Trang sau khi `pagination.totalPages > 1`, giữ trang ổn định hoặc dùng `placeholderData: keepPreviousData`. |
| **Duplicate Submission Prevention** | `ReviewFormModal.tsx` & `ReviewList.tsx` | Chặn submit lặp ở cả 2 lớp: (1) guard đầu handler `if (mutation.isPending) return;`, (2) `disabled={isSubmitting}` trên nút Submit / nút Xác nhận xóa. |

### 6.2. Chiến lược Query Keys & Cache Invalidation

Định nghĩa bộ Query Keys mới nhất quán với quy chuẩn của `apps/web`:
1. `['product-reviews', productId, page, limit]` — cho `GET /catalog/products/:id/reviews` (public, bật khi `Boolean(productId)`).
2. `['review-eligibility', productId, currentUser?.id]` — cho `GET /catalog/products/:id/reviews/eligibility` (protected, bật khi `Boolean(productId && currentUser)`).

**Quy tắc Invalidation sau từng thao tác:**

| Thao tác | Query Keys cần Invalidate / Remove | Lý do kỹ thuật |
|---|---|---|
| **Sau `POST` (Create)** | - `invalidateQueries({ queryKey: ['product-reviews', productId] })` (prefix match mọi page/limit)<br>- `invalidateQueries({ queryKey: ['review-eligibility', productId] })`<br>- `invalidateQueries({ queryKey: ['reviews', 'home'] })` | Cập nhật tức thì danh sách review, điểm trung bình, ratingBreakdown, header count, chuyển CTA sang Edit/Delete và đồng bộ đánh giá trang chủ. |
| **Sau `PUT` (Update)** | - `invalidateQueries({ queryKey: ['product-reviews', productId] })`<br>- `invalidateQueries({ queryKey: ['review-eligibility', productId] })`<br>- `invalidateQueries({ queryKey: ['reviews', 'home'] })` | Đồng bộ số sao/nội dung mới trên danh sách, `stats` và thẻ `existingReview`. |
| **Sau `DELETE` (Delete)** | - `invalidateQueries({ queryKey: ['product-reviews', productId] })`<br>- `invalidateQueries({ queryKey: ['review-eligibility', productId] })`<br>- `invalidateQueries({ queryKey: ['reviews', 'home'] })` | Xóa review khỏi danh sách, tính lại `stats`, trả `existingReview` về `null` (chuyển CTA về "Viết đánh giá" nếu vẫn `canReview: true`). |
| **Khi `onLogout` ở `ProductDetailPage.tsx:307`** | - `removeQueries({ queryKey: ['review-eligibility'] })` | Xóa ngay trạng thái eligibility của tài khoản vừa đăng xuất để tránh lộ nút Sửa/Xóa cho phiên Guest. |

---

## 7. TEST AND SECURITY EVIDENCE (R6)

> **Đính chính số liệu chính xác từ Discovery 19:** File `apps/api/tests/phase_b_customer_reviews.test.ts` có chính xác **29 test cases** (nhóm 1: 9, nhóm 2: 5, nhóm 3: 2, nhóm 4: 3, nhóm 5: 1, nhóm 6: 5, nhóm 7: 4), cộng thêm **12 unit test cases** trong `apps/api/tests/review_p2002_isolation.unit.test.ts` = tổng cộng **41 backend review test cases**.

### 7.1. Kết quả chạy kiểm thử Read-Only thực tế trong Phase A2

1. **Pure Unit Test (In-Memory, 0 DB access — ĐÃ CHẠY THỰC TẾ):**
   - **Command:** `npx vitest run apps/api/tests/review_p2002_isolation.unit.test.ts`
   - **Result:** **PASS — 12/12 tests passed (7ms)**, không đọc/ghi database.
2. **Backend Integration Test (`apps/api/tests/phase_b_customer_reviews.test.ts` — KHÔNG CHẠY TRONG A2 ĐỂ BẢO TOÀN ZERO DB MUTATION):**
   - **Lý do:** Đọc trực tiếp dòng 45–60 của `phase_b_customer_reviews.test.ts` xác nhận `beforeAll` thực hiện `prisma.user.create`, tạo product/order/review thật vào MySQL và dọn dẹp ở `afterAll`. Do Phase A2 nghiêm cấm mọi ghi dữ liệu vào DB (`Không thay đổi database`), suite này chỉ được xác minh bằng đọc source code dòng-theo-dòng (live re-run được giữ cho giai đoạn Implementation/QA khi được phép). Trạng thái chạy trực tiếp trong A2: **INTENTIONALLY SKIPPED (READ-ONLY GUARD)**; trạng thái đã xác nhận trước đó ở baseline monorepo (257/257 PASS): đã tồn tại và kiểm tra đầy đủ các assertion dưới đây.

### 7.2. Ma trận bằng chứng kiểm thử & bảo mật theo 10 yêu cầu R6

| Hạng mục R6 | Test File & Line | Exact Test Case Name(s) | Verified Assertions & Security Verdict |
|---|---|---|---|
| **1. Create review** | `phase_b_customer_reviews.test.ts:474-490` | `REV-VERIFY-DELIVERED-SUCCESS` | `POST` trả `201`, `isVerifiedPurchase: true`, `status: 'APPROVED'`, đúng `productId`/`userId`/`rating`/`comment`. |
| **2. Update review** | `phase_b_customer_reviews.test.ts:657-672` | `REV-OWNER-UPDATE` | Chủ sở hữu `PUT /reviews/:id` trả `200`, cập nhật `rating` và `comment`. |
| **3. Delete review** | `phase_b_customer_reviews.test.ts:689-705` | `REV-OWNER-DELETE` | Chủ sở hữu `DELETE /reviews/:id` trả `200`, xác minh `prisma.review.findUnique` trả `null`. |
| **4. Duplicate / Upsert** | `phase_b_customer_reviews.test.ts:512-528` | `REV-UPSERT-UPDATE` | `POST` lần 2 trên cùng `(userA, prodA)` trả `201`, cập nhật bản ghi cũ, `prisma.review.count === 1`. |
| **5. Verified purchase** | `phase_b_customer_reviews.test.ts:441-472,492-508,557-578` | `REV-VERIFY-UNPURCHASED`, `REV-VERIFY-PENDING`, `REV-VERIFY-CANCELLED`, `REV-SPOOF-PROTECTION`, `REV-ELIGIBILITY-PURCHASED`, `REV-ELIGIBILITY-UNPURCHASED` | Chưa mua / `PENDING` / `CANCELLED` → `403 VERIFIED_PURCHASE_REQUIRED`. Giả mạo `isVerifiedPurchase: false` hoặc `status: 'HIDDEN'` trong body bị backend bỏ qua. |
| **6. Unauthorized access** | `phase_b_customer_reviews.test.ts:346-354` | `REV-UNAUTH` | Gọi `POST` không có Bearer token → `401 UNAUTHORIZED`. *(Lưu ý: chưa có test riêng cho `GET /eligibility`, `PUT`, `DELETE` không token, nhưng tất cả đều dùng chung middleware `requireAuth` tại `catalog.routes.ts:21,27,32,37`.)* |
| **7. IDOR & Ownership** | `phase_b_customer_reviews.test.ts:625-655,674-687` | `REV-IDOR-UPDATE`, `REV-RBAC-STAFF-NO-EDIT`, `REV-IDOR-DELETE` | Customer B sửa review Customer A → `403 FORBIDDEN`. STAFF sửa review Customer A → `403 FORBIDDEN`. Customer B xóa review Customer A → `403 FORBIDDEN`. **Phạm vi kết luận bảo mật:** Được bảo vệ bằng source check + integration test suite đã kiểm chứng ở M4 (chưa re-run live trong A2 do khóa DB read-only). |
| **8. Invalid rating** | `phase_b_customer_reviews.test.ts:356-384` | `REV-VAL-RATING-LOW`, `REV-VAL-RATING-HIGH`, `REV-VAL-RATING-FLOAT` | `rating = 0`, `6`, `4.5` đều bị từ chối `400`. |
| **9. Invalid comment** | `phase_b_customer_reviews.test.ts:386-404` | `REV-VAL-COMMENT-SHORT`, `REV-VAL-COMMENT-LONG` | Comment 3 ký tự và 1001 ký tự đều bị từ chối `400`. *(Ghi nhận khoảng trống test nhỏ: chưa có backend test case riêng cho `comment: ""` (rỗng hợp lệ) và `comment: "   "` (khoảng trắng không hợp lệ) — Frontend M6.3 sẽ viết test riêng cho trường hợp này.)* |
| **10. Concurrent duplicate** | `phase_b_customer_reviews.test.ts:530-553` & `review_p2002_isolation.unit.test.ts:9-265` | `REV-CONCURRENT-SAFETY` + 12 unit tests (`isUserProductUniqueCollision` & `createOrUpdateReview` fallback/rethrow) | 4 request `POST` đồng thời đều thành công `201`, DB chỉ tồn tại duy nhất 1 bản ghi. **12/12 unit tests P2002 isolation ĐÃ CHẠY PASS TRỰC TIẾP TRONG A2.** |

---

## 8. FINAL FIVE-FILE IMPLEMENTATION SCOPE

Xác nhận **KHÔNG CẦN THÊM FILE THỨ 6**. Toàn bộ M6.3 triển khai gói gọn trong đúng **5 files** ở tầng `apps/web`:

| # | File Path | Existing / New | Trách nhiệm chính |
|---|---|---|---|
| 1 | `apps/web/src/services/reviewService.ts` | **NEW** | Gọi 5 Customer Review endpoints qua `apiClient`; định nghĩa types cho `PaginatedReviewsResponse` (`data`, `pagination`, `stats`), `ReviewEligibilityDto`, và `DeleteReviewResponse` (`message` top-level). |
| 2 | `apps/web/src/features/catalog/components/ReviewList.tsx` | **NEW** | Hiển thị `stats` (điểm trung bình, thanh phân bố 5→1 sao), danh sách reviews đã duyệt, badge "Đã mua hàng", phân trang, khu vực CTA theo đúng bảng quyết định Eligibility (mục 4.2), thẻ "Đánh giá của bạn" (Sửa/Xóa), và modal xác nhận xóa (`role="dialog"`). |
| 3 | `apps/web/src/features/catalog/components/ReviewFormModal.tsx` | **NEW** | Modal `role="dialog"` cho 2 mode `create` (`POST`) và `edit` (`PUT`), chọn 1–5 sao, textarea nhận xét với bộ đếm ký tự `0/1000`, validate bằng `CreateReviewInputSchema` (chuẩn hóa trim trước khi gửi), chặn gửi lặp (`isPending`), hiển thị lỗi backend rõ ràng. |
| 4 | `apps/web/src/features/catalog/ProductDetailPage.tsx` | **EXISTING** | Xóa toàn bộ dữ liệu mock tĩnh (`5.0`, `24 đánh giá`, `"Trần Văn Nam"` ở dòng 460–474, 743, 830–887); tích hợp `ReviewList` + `ReviewFormModal`; đồng bộ `averageRating` & `totalReviews` thực tế lên Header và Tab label; bổ sung `removeQueries(['review-eligibility'])` trong `onLogout`. |
| 5 | `apps/web/tests/m6_3_customer_reviews.test.tsx` | **NEW** | Test suite Vitest + RTL (`@vitest-environment jsdom`) kiểm thử toàn diện: listing + stats + breakdown, empty/loading/error states, pagination, Guest vs ineligible vs eligible vs existingReview, create (`POST` dùng numeric `product.id`), edit (`PUT`), delete confirm modal (`DELETE`), Zod validation (rating + comment rỗng/ngắn/dài/khoảng trắng), chống double submit, và invalidation. |

- **Backend / Shared / Prisma / Migrations:** **0 files thay đổi.**

---

## 9. REMAINING BLOCKERS AND ASSUMPTIONS

### 9.1. Blockers
- **Technical Blockers:** **KHÔNG CÓ (0 blockers).** Toàn bộ 5 endpoints, DTOs, schemas và quy tắc nghiệp vụ backend đã được xác minh đầy đủ từ source code.
- **Process Gate:** Chờ Project Owner phê duyệt Báo cáo A2 này và ban hành **Official Implementation Order M6.3**.

### 9.2. Assumptions & Điểm cần Owner xác nhận trong Implementation Order
1. **Cách lấy `product` trên `ProductDetailPage.tsx` (QUAN TRỌNG):**
   - Hiện tại `ProductDetailPage.tsx:215-223` chỉ tải `storefrontService.getProducts({ limit: 120 })` rồi tìm `allProducts.find(...) || allProducts[0]`. Vì database hiện có **674 sản phẩm**, nếu người dùng mở sản phẩm nằm ngoài top 120, trang sẽ rơi về `allProducts[0]` dẫn tới hiển thị/gửi đánh giá cho **sai `product.id`**.
   - Hàm `storefrontService.getProductBySlug(slug)` **ĐÃ TỒN TẠI SẴN** tại `apps/web/src/services/storefrontService.ts:86-93`.
   - **Đề xuất (không tăng số lượng file — vẫn trong đúng `ProductDetailPage.tsx`):** Trong M6.3, bổ sung query `storefrontService.getProductBySlug(slug)` (chỉ kích hoạt khi `slug` không khớp trong `allProducts` hoặc dùng làm nguồn chính cho `product`) để đảm bảo `product.id` luôn chính xác cho toàn bộ 674 sản phẩm. Cần Owner xác nhận cho phép điều chỉnh này trong `ProductDetailPage.tsx` (hoặc giữ nguyên hành vi resolve product hiện tại nếu muốn tách sang phase khác).
2. **Xử lý trường hợp review của chính user bị `HIDDEN`:**
   - Như đã phát hiện ở mục 4.1, `GET /eligibility` vẫn trả `existingReview` có `status: 'HIDDEN'`. Trong M6.3, Frontend sẽ gọi `PUT /catalog/reviews/:id` (giữ nguyên `status` mà không vượt mặt kiểm duyệt bằng `POST` upsert) và hiển thị nhãn thông báo trạng thái đang bị ẩn.
3. **Không có tính năng ngoài phạm vi:**
   - Không upload ảnh đánh giá (`NOT SUPPORTED`).
   - Không có bộ lọc theo số sao server-side (`NOT SUPPORTED`).
   - Không có nút ẩn/xóa review của khách hàng khác cho STAFF/ADMIN trên storefront (thuộc phạm vi moderation sau này).

---

## 10. FINAL STATUS & GIT SAFETY VERIFICATION

### 🏁 FINAL STATUS: `READY FOR IMPLEMENTATION`
*(Đủ 100% bằng chứng hợp đồng kỹ thuật; chờ Project Owner ban hành Official Implementation Order M6.3 và xác nhận Assumption #1 trước khi sửa code.)*

### Git & Safety State Verification:
- **Branch:** `main`
- **HEAD:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81` (Không đổi)
- **Tracked files changed:** `0`
- **Database mutation status:** `ZERO MUTATIONS` (không chạy seed/import/migration hay integration test ghi DB; chỉ chạy 12/12 pure in-memory unit tests `review_p2002_isolation.unit.test.ts`)
- **Commit / Push status:** Không commit, không push.
- **New file created (sole deliverable):** `comprehensive-audit/20_M6_3_CUSTOMER_REVIEWS_TARGETED_CONTRACT_VERIFICATION.md`
