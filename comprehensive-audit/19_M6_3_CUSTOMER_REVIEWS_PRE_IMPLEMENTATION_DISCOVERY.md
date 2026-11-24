# NEXORA — M6.3 CUSTOMER REVIEWS
## PHASE A: PRE-IMPLEMENTATION DISCOVERY REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81`
- **Milestone:** M6.3 — Customer Reviews
- **Phase:** A — Pre-Implementation Discovery (Strict Read-Only Audit)
- **Status:** `READY WITH CONDITIONS` (Chờ phê duyệt Implementation Order)
- **Authority:** Project Owner Master Prompt

---

## 1. EXECUTIVE SUMMARY

Tài liệu này là báo cáo khảo sát kỹ thuật độc lập (Strict Read-Only Discovery) nhằm chuẩn bị triển khai tích hợp giao diện **M6.3 Customer Reviews** trên nền tảng Frontend Nexora.

### Kết quả khảo sát cốt lõi:
1. **Backend Reviews Module đã hoàn thiện 100% trong Milestone M4:**
   - 5 REST endpoints công khai và bảo vệ đã được kiểm chứng hoạt động hoàn hảo trong `apps/api/src/modules/catalog/review.controller.ts` và `review.service.ts`.
   - Toàn bộ 23/23 integration tests tại `apps/api/tests/phase_b_customer_reviews.test.ts` và unit test `apps/api/tests/review_p2002_isolation.unit.test.ts` đều đang PASS.
2. **Quy tắc nghiệp vụ cốt lõi (Verified Purchase Enforcement) cực kỳ chặt chẽ:**
   - Chỉ khách hàng có tài khoản (`CUSTOMER`, `STAFF`, `ADMIN`) và sở hữu ít nhất một đơn hàng ở trạng thái `DELIVERED` chứa sản phẩm đó mới có quyền gửi đánh giá.
   - Đơn hàng ở trạng thái `PENDING`, `CONFIRMED`, `SHIPPED` hoặc `CANCELLED` đều bị từ chối với mã lỗi `403 VERIFIED_PURCHASE_REQUIRED`.
   - Mỗi khách hàng chỉ có tối đa 1 đánh giá cho mỗi sản phẩm (`@@unique([userId, productId])` trên database MySQL). Việc gửi lại đánh giá sẽ tự động cập nhật (upsert) bản ghi cũ mà không làm vỡ tính toàn vẹn dữ liệu.
3. **Frontend Architecture đã sẵn sàng tích hợp:**
   - `ProductDetailPage.tsx` đã có sẵn Tab 3 (`activeTab === 'reviews'`) nhưng hiện đang chứa dữ liệu tĩnh (mockup tĩnh: 5.0 sao, 24 đánh giá, 1 review mẫu của "Trần Văn Nam").
   - Header sản phẩm và nhãn Tab đang hardcode "(24 đánh giá)".
   - M6.3 sẽ thay thế toàn bộ dữ liệu mock này bằng dữ liệu động thực tế từ Backend API thông qua TanStack Query.
4. **Phạm vi tác động file (File Change Allowlist):**
   - Chỉ tác động tối đa **5 files** ở tầng `apps/web` (1 file chỉnh sửa, 4 files tạo mới).
   - **Tuyệt đối KHÔNG thay đổi Backend API, Prisma schema, migrations, hoặc shared contracts.**
5. **Kết luận sẵn sàng:** `READY WITH CONDITIONS` — Hệ thống Backend và Frontend đã sẵn sàng 100%, chờ Project Owner ban hành Implementation Order chính thức.

---

## 2. REPOSITORY BASELINE

Trước và trong quá trình thực hiện khảo sát, toàn bộ trạng thái repository được kiểm soát nghiêm ngặt theo đúng nguyên tắc Read-Only:

| Thuộc tính | Giá trị kiểm tra | Trạng thái |
|---|---|---|
| **Current Branch** | `main` | Khớp |
| **Current HEAD** | `85f3a52a0a1bde175d28cbdd5d540f9867671b81` | Khớp tuyệt đối |
| **Parent Commit** | `4c6c261cd6b8c0e72286449df052da4fd2ca9646` | Khớp tuyệt đối |
| **Tracked Changes** | `0 modified files` (clean working tree) | Bảo toàn |
| **Database State** | MySQL 8.4 local intact (674 products, 31 brands, 36 categories) | Không can thiệp |
| **Git Operations** | Không commit, không push, không rebase, không reset | Tuân thủ 100% |

### Danh sách file untracked được bảo toàn nguyên vẹn:
- `FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`
- `M6_1_FINAL_CLOSURE_VERIFICATION.md`
- `M6_2_FINAL_ACCEPTANCE_VERIFICATION.md`
- `M6_2_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md`
- `M6_2_PRE_IMPLEMENTATION_VERIFICATION.md`
- `NEXORA_COMPLETE_REPOSITORY_INVENTORY.md`
- `comprehensive-audit/`
- `prisma/seed_nexora_catalog.sql`
- `prisma/seed_techpilot_full.ts`

---

## 3. BACKEND REVIEWS API INVENTORY

Hệ thống Reviews của Nexora được phân định rõ ràng giữa Storefront (Customer) và Admin (Moderation). Toàn bộ Storefront API được định tuyến tại `apps/api/src/modules/catalog/catalog.routes.ts`:

### 3.1. Danh sách REST Endpoints liên quan đến Customer Reviews

| STT | HTTP Method | Endpoint URL | Auth Required | Controller & Handler | Service Method | Response Code |
|---|---|---|---|---|---|---|
| 1 | `GET` | `/api/v1/catalog/products/:id/reviews` | `None` (Public) | `ReviewController.getProductReviews` (`review.controller.ts:15`) | `ReviewService.getProductReviews` (`review.service.ts:143`) | `200 OK` |
| 2 | `GET` | `/api/v1/catalog/products/:id/reviews/eligibility` | `CUSTOMER`, `STAFF`, `ADMIN` | `ReviewController.getReviewEligibility` (`review.controller.ts:129`) | `ReviewService.getReviewEligibility` (`review.service.ts:262`) | `200 OK` |
| 3 | `POST` | `/api/v1/catalog/products/:id/reviews` | `CUSTOMER`, `STAFF`, `ADMIN` | `ReviewController.createOrUpdateReview` (`review.controller.ts:37`) | `ReviewService.createOrUpdateReview` (`review.service.ts:31`) | `201 Created` |
| 4 | `PUT` | `/api/v1/catalog/reviews/:id` | `CUSTOMER`, `STAFF`, `ADMIN` | `ReviewController.updateReview` (`review.controller.ts:69`) | `ReviewService.updateReview` (`review.service.ts:209`) | `200 OK` |
| 5 | `DELETE` | `/api/v1/catalog/reviews/:id` | `CUSTOMER`, `STAFF`, `ADMIN` | `ReviewController.deleteReview` (`review.controller.ts:101`) | `ReviewService.deleteReview` (`review.service.ts:246`) | `200 OK` |

### 3.2. Chi tiết từng Endpoint

#### A. `GET /api/v1/catalog/products/:id/reviews`
- **Mục đích:** Lấy danh sách đánh giá đã duyệt (`status: 'APPROVED'`) của sản phẩm kèm phân trang và thống kê số sao tổng hợp.
- **Tham số URL (`:id`):** Chấp nhận cả `productId` dạng số hoặc `slug` sản phẩm (nhờ hàm `resolveProductId` tại dòng 297 của `review.service.ts`).
- **Query Parameters:**
  - `page` (tùy chọn, mặc định `1`, tối thiểu `1`).
  - `limit` (tùy chọn, mặc định `10`, tối thiểu `1`, tối đa `50`).
- **Cấu trúc Response Envelope:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "productId": 105,
        "userId": 12,
        "userName": "Trần Văn Nam",
        "userAvatar": "https://example.com/avatar.jpg",
        "rating": 5,
        "comment": "Sản phẩm dùng rất tốt, đóng gói cẩn thận.",
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
      "averageRating": 5.0,
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
- **Xử lý lỗi:** 
  - Trả về `404 PRODUCT_NOT_FOUND` nếu `:id` / `:slug` không tồn tại.

#### B. `GET /api/v1/catalog/products/:id/reviews/eligibility`
- **Mục đích:** Kiểm tra khách hàng hiện tại có đủ điều kiện đánh giá sản phẩm hay không và lấy đánh giá hiện có (nếu đã từng đánh giá).
- **Tham số URL (`:id`):** Hỗ trợ cả numeric `productId` hoặc `slug`.
- **Headers:** `Authorization: Bearer <token>`
- **Cấu trúc Response Envelope:**
  ```json
  {
    "success": true,
    "data": {
      "canReview": true,
      "existingReview": {
        "id": 1,
        "productId": 105,
        "userId": 12,
        "userName": "Trần Văn Nam",
        "userAvatar": null,
        "rating": 5,
        "comment": "Sản phẩm chất lượng.",
        "isVerifiedPurchase": true,
        "status": "APPROVED",
        "createdAt": "2026-11-20T10:00:00.000Z"
      }
    }
  }
  ```
- **Xử lý lỗi:**
  - `401 UNAUTHORIZED` nếu chưa đăng nhập hoặc token không hợp lệ.
  - `404 PRODUCT_NOT_FOUND` nếu sản phẩm không tồn tại.

#### C. `POST /api/v1/catalog/products/:id/reviews`
- **Mục đích:** Gửi đánh giá mới hoặc cập nhật đánh giá đã có cho sản phẩm.
- **Tham số URL (`:id`):** **BẮT BUỘC LÀ SỐ NGUYÊN DƯƠNG (`productId`)**. Dòng 45-48 của `review.controller.ts` kiểm tra:
  ```ts
  const rawId = req.params.id as string;
  const productId = parseInt(rawId, 10);
  if (isNaN(productId) || productId <= 0) {
    throw new AppError(400, 'INVALID_PRODUCT_ID', 'ID sản phẩm không hợp lệ.');
  }
  ```
  *(Lưu ý quan trọng cho Frontend: Khi gọi endpoint này từ trang chi tiết sản phẩm điều hướng theo slug, Frontend PHẢI truyền `product.id` dạng số, không được truyền slug).*
- **Request Body (Zod validated):**
  ```json
  {
    "rating": 5,
    "comment": "Bàn phím gõ rất êm, switch chất lượng cao."
  }
  ```
- **Response Envelope:** HTTP `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "productId": 105,
      "userId": 12,
      "userName": "Trần Văn Nam",
      "userAvatar": null,
      "rating": 5,
      "comment": "Bàn phím gõ rất êm, switch chất lượng cao.",
      "isVerifiedPurchase": true,
      "status": "APPROVED",
      "createdAt": "2026-11-23T02:00:00.000Z"
    }
  }
  ```
- **Xử lý lỗi:**
  - `400 VALIDATION_ERROR`: rating ngoài [1, 5] hoặc comment < 5 hoặc > 1000 ký tự.
  - `400 INVALID_PRODUCT_ID`: id sản phẩm không phải số nguyên dương.
  - `401 UNAUTHORIZED`: chưa đăng nhập.
  - `403 VERIFIED_PURCHASE_REQUIRED`: khách hàng chưa mua hoặc chưa có đơn hàng DELIVERED chứa sản phẩm này.
  - `404 PRODUCT_NOT_FOUND`: sản phẩm không tồn tại hoặc `status !== 'ACTIVE'`.

#### D. `PUT /api/v1/catalog/reviews/:id`
- **Mục đích:** Chỉnh sửa đánh giá cá nhân (Anti-IDOR).
- **Tham số URL (`:id`):** `reviewId` (số nguyên dương).
- **Request Body:** Tương tự `POST` (`CreateReviewInputSchema`).
- **Response Envelope:** HTTP `200 OK` với dữ liệu `ReviewDto` cập nhật.
- **Xử lý lỗi:**
  - `403 FORBIDDEN`: nếu `existing.userId !== userId` (chống sửa chéo tài khoản) hoặc STAFF cố tình sửa nội dung của khách hàng.
  - `404 REVIEW_NOT_FOUND`: nếu `reviewId` không tồn tại.

#### E. `DELETE /api/v1/catalog/reviews/:id`
- **Mục đích:** Xóa đánh giá cá nhân của khách hàng, hoặc STAFF/ADMIN xóa kiểm duyệt (Anti-IDOR).
- **Tham số URL (`:id`):** `reviewId` (số nguyên dương).
- **Response Envelope:** HTTP `200 OK`
  ```json
  {
    "success": true,
    "message": "Đã xóa đánh giá thành công."
  }
  ```
- **Xử lý lỗi:**
  - `403 FORBIDDEN`: nếu người gọi không phải chủ sở hữu đánh giá và cũng không phải STAFF/ADMIN.
  - `404 REVIEW_NOT_FOUND`: nếu `reviewId` không tồn tại.

---

## 4. DTO & VALIDATION CONTRACTS

Các DTO và Schema được định nghĩa chính thức tại `packages/shared/src/index.ts` (dòng 617–671):

### 4.1. `ReviewStatusSchema`
```ts
// packages/shared/src/index.ts:618
export const ReviewStatusSchema = z.enum(['APPROVED', 'HIDDEN']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
```

### 4.2. `ReviewDtoSchema`
```ts
// packages/shared/src/index.ts:621
export const ReviewDtoSchema = z.object({
  id: z.number().int().positive(),
  productId: z.number().int().positive(),
  userId: z.number().int().positive(),
  userName: z.string(),
  userAvatar: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  isVerifiedPurchase: z.boolean(),
  status: ReviewStatusSchema.default('APPROVED'),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type ReviewDto = z.infer<typeof ReviewDtoSchema>;
```

### 4.3. `CreateReviewInputSchema` & `UpdateReviewInputSchema`
```ts
// packages/shared/src/index.ts:636
export const CreateReviewInputSchema = z.object({
  rating: z
    .number()
    .int('Số sao phải là số nguyên.')
    .min(1, 'Số sao tối thiểu là 1.')
    .max(5, 'Số sao tối đa là 5.'),
  comment: z
    .string()
    .trim()
    .min(5, 'Nhận xét đánh giá tối thiểu 5 ký tự.')
    .max(1000, 'Nhận xét đánh giá tối đa 1000 ký tự.')
    .optional()
    .or(z.literal('')),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;

export const UpdateReviewInputSchema = CreateReviewInputSchema;
export type UpdateReviewInput = CreateReviewInput;
```

### 4.4. `ProductReviewsSummarySchema`
```ts
// packages/shared/src/index.ts:660
export const ProductReviewsSummarySchema = z.object({
  averageRating: z.number(),
  totalReviews: z.number(),
  ratingBreakdown: z.object({
    1: z.number(),
    2: z.number(),
    3: z.number(),
    4: z.number(),
    5: z.number(),
  }),
});
export type ProductReviewsSummary = z.infer<typeof ProductReviewsSummarySchema>;
```

### 4.5. Cơ sở dữ liệu Prisma Schema (`prisma/schema.prisma:280–298`)
```prisma
model Review {
  id                 Int          @id @default(autoincrement()) @db.UnsignedInt
  productId          Int          @map("product_id") @db.UnsignedInt
  userId             Int          @map("user_id") @db.UnsignedInt
  rating             Int          @db.TinyInt
  comment            String?      @db.Text
  isVerifiedPurchase Boolean      @default(false) @map("is_verified_purchase")
  status             ReviewStatus @default(APPROVED)
  createdAt          DateTime     @default(now()) @map("created_at")
  updatedAt          DateTime     @updatedAt @map("updated_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@unique([userId, productId], map: "uq_reviews_user_product")
  @@index([productId, status, rating], map: "idx_reviews_product_status_rating")
  @@index([userId], map: "idx_reviews_user")
  @@map("reviews")
}
```

---

## 5. VERIFIED BUSINESS RULES

Dưới đây là 12 quy tắc nghiệp vụ thực tế được xác minh trực tiếp từ mã nguồn và các bài test:

1. **Ai được phép tạo đánh giá?**
   - Chỉ người dùng đã xác thực (JWT token hợp lệ) mang role `CUSTOMER`, `STAFF` hoặc `ADMIN`. Khách vãng lai (Guest) không thể gửi đánh giá (`401 UNAUTHORIZED`).
2. **Đánh giá có yêu cầu đã mua sản phẩm không?**
   - **BẮT BUỘC CÓ.** Kiểm tra tại `review.service.ts:50–65`. Khách hàng chưa từng mua sản phẩm sẽ nhận mã lỗi `403 VERIFIED_PURCHASE_REQUIRED` (chứng minh qua test `REV-VERIFY-UNPURCHASED`).
3. **Có kiểm tra đơn hàng đã giao thành công không?**
   - **BẮT BUỘC CÓ.** Phải có ít nhất một đơn hàng ở trạng thái `DELIVERED` chứa sản phẩm đó. Đơn hàng ở trạng thái `PENDING`, `CONFIRMED`, `SHIPPED` hoặc `CANCELLED` đều bị từ chối (`REV-VERIFY-PENDING`, `REV-VERIFY-CANCELLED`).
4. **Một khách hàng có thể đánh giá một sản phẩm bao nhiêu lần?**
   - **Tối đa 1 lần.** Khóa duy nhất `uq_reviews_user_product` trên cặp `(userId, productId)` đảm bảo 1-1. Gửi lại đánh giá sẽ tự động cập nhật bản ghi cũ (`REV-UPSERT-UPDATE`).
5. **Có cho phép chỉnh sửa đánh giá không?**
   - **CÓ.** Cho phép thông qua `POST /products/:id/reviews` (upsert) hoặc `PUT /reviews/:id` (chỉnh sửa trực tiếp). Anti-IDOR đảm bảo chỉ chủ sở hữu đánh giá mới có quyền sửa.
6. **Có cho phép xóa đánh giá không?**
   - **CÓ.** Khách hàng có quyền xóa đánh giá của chính mình qua `DELETE /reviews/:id` (`REV-OWNER-DELETE`). Khách hàng khác xóa sẽ nhận lỗi `403 FORBIDDEN` (`REV-IDOR-DELETE`).
7. **Có quy trình duyệt (Moderation) không?**
   - Đánh giá được tạo mặc định ở trạng thái `status: 'APPROVED'`. STAFF/ADMIN có thể ẩn đánh giá vi phạm qua endpoint nội bộ `PATCH /api/v1/admin/reviews/:id/status` (`REV-ADMIN-HIDE`).
8. **Đánh giá có những trạng thái nào?**
   - Gồm 2 trạng thái: `APPROVED` (hiển thị công khai) và `HIDDEN` (bị ẩn kiểm duyệt). Đánh giá `HIDDEN` bị loại bỏ hoàn toàn khỏi danh sách công khai và công thức tính điểm sao trung bình (`REV-HIDDEN-EXCLUDED-PUBLIC`).
9. **Có cho phép đánh giá số sao mà không có nhận xét văn bản không?**
   - **CÓ.** Trường `comment` là tùy chọn (`optional().or(z.literal(''))`). Nếu để trống hoặc chuỗi trắng, backend lưu giá trị `null`.
10. **Giới hạn độ dài nội dung nhận xét là bao nhiêu?**
    - Nếu có nhập nhận xét, độ dài tối thiểu là 5 ký tự và tối đa là 1000 ký tự (`REV-VAL-COMMENT-SHORT`, `REV-VAL-COMMENT-LONG`).
11. **Có thống kê rating trung bình và phân bố số sao không?**
    - **CÓ.** Backend tự động tính toán `averageRating` (làm tròn 1 chữ số thập phân), `totalReviews` và `ratingBreakdown` (đếm số lượt 1, 2, 3, 4, 5 sao) qua `db.review.groupBy`.
12. **Đánh giá có hỗ trợ đính kèm hình ảnh không?**
    - `NOT IMPLEMENTED` / `NOT SUPPORTED`. Model `Review` trong Prisma và DTO không có trường lưu ảnh. Frontend **tuyệt đối không thêm** chức năng upload ảnh vào form đánh giá.

---

## 6. FRONTEND ARCHITECTURE INVENTORY

### 6.1. Router và Cấu trúc Trang Chi tiết Sản phẩm
- **File:** `apps/web/src/features/catalog/ProductDetailPage.tsx` (1085 dòng)
- **Định tuyến (`AppRoutes.tsx:74–75`):**
  - `/product/:slug`
  - `/product/detail/:slug`
- **Thành phần hiện hữu trên `ProductDetailPage.tsx`:**
  - **Header sản phẩm (dòng 460–474):** Hiển thị 5 ngôi sao vàng FontAwesome (`fa-solid fa-star`) và văn bản hardcode `(24 đánh giá)`.
  - **Khu vực Tabs (dòng 730–887):**
    - Tab 1: `specs` (Thông số kỹ thuật chi tiết).
    - Tab 2: `desc` (Bài viết mô tả sản phẩm).
    - Tab 3: `reviews` (Đánh giá & Nhận xét) — nút bấm hardcode nhãn `'Đánh giá & Nhận xét (24)'`.
    - Tab 4: `aiChat` (Trợ lý AI hỏi đáp về sản phẩm).
  - **Nội dung Tab 3 hiện tại (dòng 830–887):**
    - Khối tóm tắt: Điểm số `5.0`, 5 sao vàng, dòng chữ "Dựa trên 24 đánh giá".
    - Khối danh sách: 1 đánh giá giả lập của "Trần Văn Nam" ("Đã mua hàng", 5 sao, nội dung mockup).
    - **Hoàn toàn chưa có form gửi đánh giá, chưa có phân trang, chưa có kiểm tra eligibility.**

### 6.2. Kiến trúc Data Fetching & Quản lý Trạng thái
- **HTTP Client:** `apiClient` (`apps/web/src/lib/apiClient.ts`) — Axios instance tự động đính kèm `Authorization: Bearer <token>` từ `localStorage.getItem('nexora_token')`.
- **Server State:** `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`).
- **Authentication State:** `authService.getCurrentUser()` cung cấp thông tin người dùng đăng nhập (`AuthUser`).
- **Validation:** `react-hook-form` kết hợp `@hookform/resolvers/zod` với `CreateReviewInputSchema` từ `@nexora/shared`.

---

## 7. FRONTEND–BACKEND INTEGRATION MAPPING

Bảng đối chiếu tích hợp giữa các chức năng Frontend dự kiến và Backend API hiện hữu:

| Chức năng Frontend | Backend Endpoint | HTTP Method | Request Payload / Params | Response Data | Yêu cầu Auth | Trạng thái Backend |
|---|---|---|---|---|---|---|
| **Lấy danh sách đánh giá & thống kê sao** | `/api/v1/catalog/products/:id/reviews` | `GET` | Params: `:id` (ID/Slug)<br>Query: `page`, `limit` | `{ data: ReviewDto[], pagination: {...}, stats: {...} }` | Không (Public) | `READY` (Hỗ trợ 100%) |
| **Kiểm tra quyền gửi đánh giá (Eligibility)** | `/api/v1/catalog/products/:id/reviews/eligibility` | `GET` | Params: `:id` (ID/Slug)<br>Header: `Bearer token` | `{ data: { canReview: boolean, existingReview: ReviewDto \| null } }` | `CUSTOMER` (hoặc `STAFF`, `ADMIN`) | `READY` (Hỗ trợ 100%) |
| **Gửi đánh giá mới / Cập nhật đánh giá** | `/api/v1/catalog/products/:id/reviews` | `POST` | Params: `:id` (Bắt buộc `productId` dạng số)<br>Body: `{ rating: number, comment?: string }` | `{ data: ReviewDto }` | `CUSTOMER` (hoặc `STAFF`, `ADMIN`) | `READY` (Hỗ trợ 100%) |
| **Chỉnh sửa đánh giá cá nhân** | `/api/v1/catalog/reviews/:id` | `PUT` | Params: `:id` (numeric `reviewId`)<br>Body: `{ rating: number, comment?: string }` | `{ data: ReviewDto }` | `CUSTOMER` (hoặc `STAFF`, `ADMIN`) | `READY` (Hỗ trợ 100%) |
| **Xóa đánh giá cá nhân** | `/api/v1/catalog/reviews/:id` | `DELETE` | Params: `:id` (numeric `reviewId`) | `{ success: true, message: string }` | `CUSTOMER` (hoặc `STAFF`, `ADMIN`) | `READY` (Hỗ trợ 100%) |
| **Lọc đánh giá theo số sao** | Backend hiện chưa có query param `rating` | - | - | - | - | `NOT SUPPORTED` (Frontend có thể filter client-side nếu cần, hoặc hiển thị toàn bộ theo trang) |
| **Đính kèm hình ảnh đánh giá** | Không có trường `images` | - | - | - | - | `NOT SUPPORTED` |

---

## 8. EXISTING TEST COVERAGE

### 8.1. Backend Test Suites (Đang bảo vệ 100% nghiệp vụ)
1. **`apps/api/tests/phase_b_customer_reviews.test.ts` (23 tests):**
   - **Group 1 (9 tests):** Xác thực lỗi 401 khi không có token; từ chối rating < 1, > 5, số thực; từ chối comment < 5 hoặc > 1000 ký tự; từ chối product ID không hợp lệ; từ chối sản phẩm không tồn tại hoặc INACTIVE.
   - **Group 2 (5 tests):** Khách hàng chưa mua -> 403; đơn hàng PENDING -> 403; đơn hàng CANCELLED -> 403; đơn hàng DELIVERED -> 201 thành công; chống giả mạo `isVerifiedPurchase` hoặc `status`.
   - **Group 3 (2 tests):** Upsert đánh giá thành công khi gửi lại; an toàn đồng thời (4 requests cùng lúc không phát sinh duplicate key).
   - **Group 4 (3 tests):** Truy vấn eligibility trả về đúng `canReview` và `existingReview`; `GET /catalog/products/:slug` đính kèm reviews đã duyệt.
   - **Group 5 (1 test):** Phân trang công khai và tính toán rating stats chính xác.
   - **Group 6 (5 tests):** Chống IDOR khi sửa/xóa đánh giá; cấm STAFF sửa nội dung khách hàng; cho phép chủ sở hữu sửa/xóa đánh giá của mình.
   - **Group 7 (4 tests):** ADMIN/STAFF kiểm duyệt danh sách, ẩn review, loại bỏ review ẩn khỏi public list, và xóa vĩnh viễn review vi phạm.
2. **`apps/api/tests/review_p2002_isolation.unit.test.ts` (1 test suite):**
   - Kiểm tra cô lập hàm bắt lỗi xung đột bản ghi duy nhất `P2002` của Prisma.

### 8.2. Frontend Test Suites (Khoảng trống kiểm thử cần bổ sung)
- Hiện tại trong `apps/web/tests/` mới chỉ có 4 test suites:
  1. `FoundationDashboard.test.tsx`
  2. `ResetPasswordFlow.test.tsx`
  3. `m6_1_guest_cart_merge.test.tsx`
  4. `m6_2_customer_profile.test.tsx`
- **Khoảng trống:** Chưa có test suite nào kiểm thử `ProductDetailPage` hoặc tương tác Customer Reviews trên Frontend.
- **Yêu cầu bổ sung khi Implementation:** Tạo test suite mới `apps/web/tests/m6_3_customer_reviews.test.tsx` (tối thiểu 12–15 test cases) mô phỏng đầy đủ:
  - Hiển thị danh sách đánh giá và thống kê số sao.
  - Hiển thị badge "Đã mua hàng" (`isVerifiedPurchase`).
  - Kiểm tra điều kiện eligibility (ẩn nút đánh giá nếu chưa mua, hiển thị form nếu đủ điều kiện).
  - Gửi đánh giá thành công (cập nhật danh sách qua TanStack Query cache invalidation).
  - Chỉnh sửa đánh giá hiện có.
  - Xóa đánh giá cá nhân.
  - Hiển thị thông báo lỗi khi validation thất bại hoặc khi backend trả về 403.

---

## 9. SECURITY & DATA INTEGRITY FINDINGS

| Hạng mục đánh giá | Mức độ rủi ro | Phân loại | Bằng chứng mã nguồn / Kiểm tra |
|---|---|---|---|
| **Sửa/xóa đánh giá của người khác (IDOR)** | Cực kỳ thấp | `VERIFIED SAFE` | Backend kiểm tra sở hữu nghiêm ngặt tại `review.service.ts:223` và `review.service.ts:257`. Test `REV-IDOR-UPDATE` và `REV-IDOR-DELETE` kiểm chứng trả về `403 FORBIDDEN`. |
| **Giả mạo `userId` từ Frontend** | Cực kỳ thấp | `VERIFIED SAFE` | `userId` được trích xuất trực tiếp từ JWT payload đã xác thực (`req.user?.sub`), không nhận từ client request body. |
| **Giả mạo `isVerifiedPurchase` hoặc `status`** | Cực kỳ thấp | `VERIFIED SAFE` | Backend tự tính toán và gán cứng giá trị (`review.service.ts:80-81`). Payload client gửi kèm các trường này đều bị bỏ qua (Test `REV-SPOOF-PROTECTION`). |
| **Gửi rating ngoài giới hạn [1, 5]** | Cực kỳ thấp | `VERIFIED SAFE` | Schema Zod `CreateReviewInputSchema` chặn ở cả Frontend lẫn Backend (`min(1).max(5).int()`). Test `REV-VAL-RATING-LOW`, `REV-VAL-RATING-HIGH`. |
| **Tấn công XSS qua nội dung nhận xét** | Cực kỳ thấp | `VERIFIED SAFE` | React tự động escape HTML khi render nội dung review trong JSX (sử dụng text nodes chuẩn, không dùng `dangerouslySetInnerHTML`). |
| **Spam / Tạo đánh giá trùng lặp** | Cực kỳ thấp | `VERIFIED SAFE` | MySQL áp dụng ràng buộc duy nhất `uq_reviews_user_product`. Backend triển khai cơ chế Upsert an toàn và xử lý Race Condition P2002 (Test `REV-CONCURRENT-SAFETY`). |
| **Đánh giá khi chưa mua hàng** | Cực kỳ thấp | `VERIFIED SAFE` | Kiểm tra đơn hàng `DELIVERED` trước khi cho phép ghi vào DB (Test `REV-VERIFY-UNPURCHASED`). |

---

## 10. FILE CHANGE IMPACT ANALYSIS

Để triển khai M6.3 một cách module hóa, sạch sẽ và an toàn nhất, kiến trúc đề xuất chia thành các component chuyên trách độc lập:

| File Path | Trạng thái | Phân nhóm | Mục đích & Trách nhiệm | Chi tiết thay đổi dự kiến |
|---|---|---|---|---|
| `apps/web/src/services/reviewService.ts` | **NEW** | API Service | Giao tiếp với toàn bộ 5 Reviews API endpoints | Định nghĩa `reviewService` với các phương thức `getProductReviews`, `getReviewEligibility`, `createReview`, `updateReview`, `deleteReview`. Sử dụng `apiClient`. |
| `apps/web/src/features/catalog/components/ReviewList.tsx` | **NEW** | React Component | Hiển thị danh sách đánh giá & thống kê rating | Hiển thị điểm trung bình, phân bố sao (5 thanh progress bars), danh sách reviews, badge "Đã mua hàng", phân trang và nút "Viết đánh giá" / "Sửa đánh giá". |
| `apps/web/src/features/catalog/components/ReviewFormModal.tsx` | **NEW** | React Component | Modal form gửi / sửa đánh giá của khách hàng | Chọn 1-5 sao tương tác trực quan, ô nhập nhận xét, validate bằng Zod & React Hook Form, hiển thị trạng thái loading / lỗi, gọi mutation. |
| `apps/web/src/features/catalog/ProductDetailPage.tsx` | **EXISTING** | Page Component | Tích hợp components Reviews vào trang chi tiết | Thay thế khối Tab 3 mockup tĩnh bằng `<ReviewList />`. Cập nhật số lượng review và điểm trung bình động trên header sản phẩm và tiêu đề Tab. |
| `apps/web/tests/m6_3_customer_reviews.test.tsx` | **NEW** | Testing | Bộ test tự động cho toàn bộ tính năng Reviews | Viết 12–15 unit/integration tests kiểm thử render, tương tác form, gửi đánh giá, cập nhật cache, xử lý lỗi và điều kiện eligibility. |

### Ranh giới nghiêm ngặt:
- **Số lượng file tối đa:** Đúng 5 files (1 existing, 4 new).
- **Backend files:** 0 file.
- **Database / Prisma files:** 0 file.
- **Shared contracts:** 0 file.

---

## 11. PROPOSED M6.3 IMPLEMENTATION SCOPE

Dựa trên kết quả khảo sát, phạm vi triển khai của M6.3 được tinh gọn như sau:

### A. Customer Review Display (Hiển thị đánh giá công khai)
- Hiển thị khối tóm tắt tổng quan: Điểm số trung bình (ví dụ: `4.8 / 5.0`), tổng số lượt đánh giá, phân bố số lượt đánh giá theo từng mức 1, 2, 3, 4, 5 sao.
- Hiển thị danh sách đánh giá đã được duyệt (`status: 'APPROVED'`):
  - Avatar và tên khách hàng (`userName`, `userAvatar`).
  - Badge xác thực: "✓ Đã mua hàng tại Nexora" (`isVerifiedPurchase: true`).
  - Số sao đánh giá (sao vàng tương ứng).
  - Thời gian đánh giá (định dạng ngày tháng thân thiện).
  - Nội dung nhận xét (nếu có).
- Phân trang đánh giá nếu số lượng vượt quá 10 bài viết.

### B. Customer Review Eligibility & Actions (Điều kiện & Hành động)
- Khi khách hàng đăng nhập, tự động kiểm tra điều kiện đánh giá (`getReviewEligibility`):
  - **Trường hợp 1 (Chưa mua sản phẩm):** Hiển thị thông báo nhẹ nhàng: *"Chỉ khách hàng đã mua và nhận sản phẩm này thành công mới có thể gửi đánh giá."* (Nút gửi đánh giá bị ẩn hoặc disable).
  - **Trường hợp 2 (Đã mua nhưng chưa đánh giá):** Hiển thị nút *"Viết đánh giá sản phẩm"*.
  - **Trường hợp 3 (Đã gửi đánh giá trước đó):** Hiển thị nút *"Chỉnh sửa đánh giá của bạn"* và *"Xóa đánh giá"*.
  - **Trường hợp 4 (Chưa đăng nhập):** Hiển thị nút *"Đăng nhập để đánh giá"* dẫn tới trang đăng nhập.

### C. Customer Review Submission & Management (Form gửi & Quản lý)
- Modal form thân thiện, dễ sử dụng:
  - Chọn số sao (1–5 sao với hiệu ứng hover và chọn trực quan).
  - Ô nhập nhận xét (tùy chọn, giới hạn 5–1000 ký tự nếu có nhập).
  - Client-side validation theo đúng `CreateReviewInputSchema`.
  - Nút Submit với hiệu ứng loading và disable để chống click đúp gửi request trùng.
  - Tự động invalidate TanStack Query cache (`['product-reviews', productId]`, `['review-eligibility', productId]`) sau khi gửi thành công để cập nhật giao diện tức thì.

---

## 12. BLOCKERS, DEPENDENCIES & RISKS

### 12.1. Blockers
- **Hiện tại:** **KHÔNG CÓ BLOCKER KỸ THUẬT.** Backend API, DTO, Database và Authentication đã hoàn chỉnh 100%.
- **Điều kiện ràng buộc:** Cần Project Owner phê duyệt văn bản báo cáo Discovery này và ban hành `OFFICIAL IMPLEMENTATION ORDER M6.3` trước khi được phép chỉnh sửa source code.

### 12.2. Dependencies
- `@nexora/shared`: Đã có đầy đủ schemas và DTOs (`CreateReviewInputSchema`, `ReviewDtoSchema`, `ProductReviewsSummarySchema`).
- `@tanstack/react-query`: Đã cài đặt và đang hoạt động trên toàn bộ `apps/web`.
- `react-hook-form` & `@hookform/resolvers/zod`: Đã có trong `apps/web/package.json`.
- `apiClient`: Đã cấu hình chuẩn interceptor Bearer token.

### 12.3. Risks & Kế hoạch kiểm soát
1. **Rủi ro truyền `:slug` vào endpoint `POST`:**
   - *Phân tích:* `GET` reviews chấp nhận cả slug lẫn id, nhưng `POST /catalog/products/:id/reviews` yêu cầu `:id` là số nguyên dương. Nếu Frontend truyền nhầm slug sẽ bị lỗi `400 INVALID_PRODUCT_ID`.
   - *Kiểm soát:* `reviewService.createReview` và `ProductDetailPage` sẽ truyền tường minh `product.id` (dạng số) vào request.
2. **Rủi ro gửi request trùng (Double Submission):**
   - *Kiểm soát:* Nút Submit trong `ReviewFormModal` sẽ bị `disabled` ngay khi `isPending` / `isSubmitting` là true.
3. **Rủi ro rò rỉ dữ liệu nhạy cảm hoặc Mock data còn sót:**
   - *Kiểm soát:* Xóa bỏ toàn bộ mockup tĩnh ("Trần Văn Nam", 24 đánh giá hardcode) khỏi `ProductDetailPage.tsx`.

---

## 13. ACCEPTANCE CRITERIA PROPOSAL FOR IMPLEMENTATION

Khi bước vào giai đoạn Implementation, M6.3 sẽ được nghiệm thu dựa trên bộ tiêu chí đo lường định lượng:

- [ ] **AC-1:** Tạo thành công `apps/web/src/services/reviewService.ts` kết nối đầy đủ 5 endpoints.
- [ ] **AC-2:** Tạo `ReviewList.tsx` hiển thị điểm trung bình, rating breakdown và danh sách reviews từ API.
- [ ] **AC-3:** Tạo `ReviewFormModal.tsx` hỗ trợ chọn 1-5 sao, nhập nhận xét, validate bằng Zod.
- [ ] **AC-4:** Tích hợp vào `ProductDetailPage.tsx`, thay thế hoàn toàn mockup tĩnh ở Tab 3 và cập nhật header sản phẩm.
- [ ] **AC-5:** Kiểm tra điều kiện `getReviewEligibility` chính xác: chỉ hiển thị nút viết đánh giá cho khách hàng có đơn DELIVERED.
- [ ] **AC-6:** Hỗ trợ chỉnh sửa và xóa đánh giá của chính khách hàng một cách mượt mà.
- [ ] **AC-7:** Chống gửi request trùng khi bấm Submit.
- [ ] **AC-8:** Viết bộ test `apps/web/tests/m6_3_customer_reviews.test.tsx` đạt tối thiểu 12 tests PASS.
- [ ] **AC-9:** Toàn bộ quality gates monorepo PASS (`npm run typecheck`, `npm run lint`, `npm test`).
- [ ] **AC-10:** Phạm vi thay đổi nằm đúng trong 5 files đã được phê duyệt, không đụng chạm Backend/Prisma.

---

## 14. IMPLEMENTATION READINESS DECISION

### KẾT LUẬN: `READY WITH CONDITIONS`

- **Đánh giá mức độ sẵn sàng:** **100% SẴN SÀNG VỀ MẶT KỸ THUẬT.**
- **Điều kiện duy nhất:** Chờ Project Owner xem xét báo cáo này và ban hành **OFFICIAL IMPLEMENTATION ORDER M6.3**.
- **Kỷ luật thực thi:** Ngay sau khi tạo tài liệu này, Agent dừng toàn bộ thao tác, không sửa code, không commit Git, giữ nguyên trạng thái repository ở commit `85f3a52a0a1bde175d28cbdd5d540f9867671b81`.
