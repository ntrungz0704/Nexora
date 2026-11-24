# NEXORA — M6.3 CUSTOMER REVIEWS
## PHASE B: FRONTEND IMPLEMENTATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81` *(Parent: `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`)*
- **Milestone:** M6.3 — Customer Reviews (Frontend Implementation)
- **Final Status:** **`PASS`**

---

## 1. IMPLEMENTATION SUMMARY

Hoàn tất triển khai toàn diện tính năng **Customer Reviews (M6.3)** trên Frontend `apps/web` tuân thủ tuyệt đối **Official Implementation Order M6.3** và khóa phạm vi chính xác **5 file allowlist**:

1. **Product Identity Correction (Owner-Approved):** Thay thế cơ chế tìm sản phẩm cũ (dò trong 120 sản phẩm đầu và fallback về `allProducts[0]`) trên `ProductDetailPage.tsx` bằng `storefrontService.getProductBySlug(slug)` (`['product-detail', slug]`). Đảm bảo `product.id` luôn khớp chính xác với `:slug` và hiển thị màn hình `"Không tìm thấy sản phẩm"` khi slug không tồn tại.
2. **Typed Review API Service:** Xây dựng `reviewService.ts` tích hợp đầy đủ 5 endpoints Backend M4 qua `apiClient`, xử lý đúng đặc thù envelope (top-level `pagination`/`stats` cho `GET`, top-level `message` không có `data` cho `DELETE`, kiểm tra `productId` số nguyên dương cho `POST`).
3. **Public Reviews Display & Rating Aggregation (`ReviewList.tsx`):** Thay thế toàn bộ dữ liệu mock tĩnh cũ (`5.0`, `24 đánh giá`, `"Trần Văn Nam"`) bằng dữ liệu thực tế từ Backend: điểm trung bình, tổng lượt đánh giá đã duyệt, biểu đồ phân bố 5→1 sao, danh sách đánh giá theo thứ tự mới nhất, badge `"Đã mua hàng"` chỉ khi `isVerifiedPurchase === true`, và phân trang.
4. **Eligibility, Create/Edit/Delete Workflows (`ReviewList.tsx` + `ReviewFormModal.tsx`):**
   - **Guest:** Tuyệt đối không gọi `/reviews/eligibility`, hiển thị nút chuyển sang `/login`.
   - **Authenticated không đủ điều kiện (kể cả `STAFF`/`ADMIN` chưa mua `DELIVERED`):** Không hiển thị nút viết đánh giá, hiển thị thông báo điều kiện mua hàng từ backend.
   - **Authenticated đủ điều kiện & chưa đánh giá:** Mở modal gửi mới bằng `POST /catalog/products/:productId/reviews` (truyền numeric `product.id`).
   - **Authenticated đã có đánh giá (`existingReview !== null`):** Ẩn nút tạo mới, chỉ hiển thị thẻ `"Đánh giá của bạn"` kèm nút **Chỉnh sửa (`PUT /catalog/reviews/:id`)** và **Xóa (`DELETE /catalog/reviews/:id` qua modal xác nhận)**. Không dùng `POST` để sửa đánh giá cũ; hiển thị cảnh báo trung thực khi `existingReview.status === 'HIDDEN'`.
5. **TanStack Query Cache & Logout Hygiene:** Invalidate `['product-reviews', productId]`, `['review-eligibility', productId]`, và `['reviews', 'home']` sau mỗi mutation; gọi `removeQueries({ queryKey: ['review-eligibility'] })` khi người dùng đăng xuất.
6. **Automated Test Suite & Quality Gates:** Hoàn thiện 17 test cases bao phủ toàn bộ 18+ kịch bản yêu cầu; toàn bộ **63/63 frontend tests**, `typecheck`, `lint`, `prettier`, và `vite build` đều đạt **PASS (exit code 0)**.

---

## 2. EXACT CHANGED FILES (STRICT 5-FILE ALLOWLIST)

| # | File Path | Status | Summary of Changes |
|---|---|---|---|
| 1 | `apps/web/src/services/reviewService.ts` | **NEW** | Typed API service cho 5 endpoints Customer Reviews + helper `extractReviewErrorMessage` + assert numeric positive ID cho `POST`/`PUT`/`DELETE`. |
| 2 | `apps/web/src/features/catalog/components/ReviewList.tsx` | **NEW** | Hiển thị `averageRating`, `totalReviews`, phân bố 5→1 sao, danh sách đánh giá `APPROVED`, badge `Đã mua hàng`, phân trang, vùng CTA theo Eligibility, thẻ `"Đánh giá của bạn"` và modal xác nhận xóa (`role="dialog"`). |
| 3 | `apps/web/src/features/catalog/components/ReviewFormModal.tsx` | **NEW** | Modal `role="dialog"` hỗ trợ chế độ `create`/`edit`, chọn 1–5 sao, nhập nhận xét tùy chọn với đếm ký tự, validate bằng `CreateReviewInputSchema`, chặn khoảng trắng thuần, khóa gửi lặp bằng cả `isSubmitting` và `useRef`. |
| 4 | `apps/web/src/features/catalog/ProductDetailPage.tsx` | **MODIFIED** | Dùng `storefrontService.getProductBySlug(slug)` (bỏ fallback `allProducts[0]`), đồng bộ điểm trung bình & số lượng đánh giá lên Header và Tab label, thay Tab 3 mock bằng `<ReviewList />` + `<ReviewFormModal />`, thêm mutations/invalidation và dọn `review-eligibility` khi logout. |
| 5 | `apps/web/tests/m6_3_customer_reviews.test.tsx` | **NEW** | 17 test cases Vitest + React Testing Library kiểm chứng đầy đủ hiển thị, phân trang, loading/empty/error, guest/ineligible/eligible/existingReview/hidden, validation, PUT vs POST, DELETE confirm, query invalidation, logout cache clear, product slug resolution và chống double submit. |

> **Xác nhận phạm vi:** **0 file** thay đổi trong `apps/api/**`, `packages/shared/**`, `prisma/**`, `storefrontService.ts`, `TechPilot/`, hay `audit-output/`.

---

## 3. API INTEGRATION MAPPING

| Chức năng Frontend | Service Method | Endpoint (trên `apiClient` baseURL `/api/v1`) | Request Payload / Params | Envelope Parsing |
|---|---|---|---|---|
| Tải danh sách & thống kê đánh giá | `reviewService.getProductReviews` | `GET /catalog/products/${productId}/reviews` | Query `{ page, limit: 10 }` | Đọc `res.data.data` (`reviews`), `res.data.pagination`, `res.data.stats` (top-level siblings) |
| Kiểm tra quyền đánh giá | `reviewService.getReviewEligibility` | `GET /catalog/products/${productId}/reviews/eligibility` | Header `Authorization: Bearer ...` (chỉ gọi khi `currentUser !== null`) | Đọc `res.data.data` (`{ canReview, existingReview }`) |
| Gửi đánh giá mới | `reviewService.createReview` | `POST /catalog/products/${productId}/reviews` | Numeric `product.id` + `{ rating, comment }` | Đọc `res.data.data` (`ReviewDto`) |
| Chỉnh sửa đánh giá đã có | `reviewService.updateReview` | `PUT /catalog/reviews/${reviewId}` | Numeric `reviewId` + `{ rating, comment }` | Đọc `res.data.data` (`ReviewDto`) |
| Xóa đánh giá cá nhân | `reviewService.deleteReview` | `DELETE /catalog/reviews/${reviewId}` | Numeric `reviewId` | Đọc `{ success: res.data.success, message: res.data.message }` (top-level, không có `data`) |
| Xác định sản phẩm theo slug | `storefrontService.getProductBySlug` *(existing)* | `GET /catalog/products/${slug}` | `:slug` từ `useParams()` | Đọc `res.data.data` (`ProductDto`) |

---

## 4. UI BEHAVIOR AND STATES

| Trạng thái | Hành vi đã triển khai |
|---|---|
| **Product Loading / Not Found** | Đang tải hiện `"Đang tải thông tin sản phẩm..."`. Slug không tồn tại hiện tiêu đề `"Không tìm thấy sản phẩm"` + nút quay về `/`, tuyệt đối không fallback sang sản phẩm đầu tiên. |
| **Reviews Loading** | Hiển thị `role="status"` `"Đang tải đánh giá sản phẩm..."`. |
| **Reviews Error** | Hiển thị `role="alert"` `"Không thể tải danh sách đánh giá. Vui lòng thử lại sau."` kèm nút `"Thử lại"`. |
| **Reviews Empty** | Hiển thị `"Chưa có đánh giá nào cho sản phẩm này."`, điểm `0.0`, `Dựa trên 0 đánh giá`, tất cả thanh sao `0%`. |
| **Reviews Loaded** | Đồng bộ `averageRating.toFixed(1)` và `totalReviews` lên cả Product Header, Tab label (`Đánh giá & Nhận xét (N)`), và khối tổng quan Tab 3. |
| **Guest** | Không gọi `/eligibility`, hiển thị link `"Đăng nhập để đánh giá"` → `/login`. |
| **Authenticated (Chưa mua / Chưa DELIVERED / STAFF-ADMIN không có đơn DELIVERED)** | Hiển thị thông báo hạn chế mua hàng, không hiển thị nút viết đánh giá. |
| **Authenticated (Đủ điều kiện, chưa đánh giá)** | Hiển thị nút `"Viết đánh giá sản phẩm"` → mở `ReviewFormModal` (mode `create` → `POST`). |
| **Authenticated (Đã có đánh giá)** | Ẩn nút viết mới; hiển thị thẻ `"Đánh giá của bạn"` + nút `"Chỉnh sửa đánh giá"` (`PUT`) + `"Xóa đánh giá"` (`DELETE` với dialog xác nhận). Nếu `status === 'HIDDEN'`, hiển thị badge `"Đang bị ẩn bởi quản trị viên"`. |
| **Pagination** | Hiển thị `"Trang trước"` / `"Trang X / Y"` / `"Trang sau"` khi `pagination.totalPages > 1`. Khi xóa review cuối cùng ở trang `> 1`, tự lùi về `page - 1`. |
| **Duplicate Submit Prevention** | Bảo vệ 2 lớp trong `ReviewFormModal`: `submitGuardRef` (chặn double-click trong cùng 1 JS tick) + `isSubmitting` (disable nút gửi và đổi nhãn `"Đang gửi..."`). |

---

## 5. VALIDATION BEHAVIOR

Sử dụng trực tiếp `CreateReviewInputSchema` từ `@nexora/shared` trong `ReviewFormModal.tsx`:
- `rating`: số nguyên `1..5` (bắt buộc).
- `comment`:
  - Rỗng (`""`): hợp lệ, gửi `comment: ""` (không bao giờ gửi `null`).
  - Chỉ chứa khoảng trắng (vd `"     "`): bị chặn ngay tại client với thông báo `"Nhận xét không được chỉ chứa khoảng trắng."` và không gọi API.
  - Có nội dung: được `.trim()` bởi Zod; bắt buộc từ 5 đến 1000 ký tự sau khi trim; gửi đúng chuỗi đã trim lên Backend.
  - Lỗi từ Backend (400/401/403/404) được trích xuất qua `extractReviewErrorMessage` và hiển thị rõ trong `role="alert"`.

---

## 6. QUERY KEYS AND INVALIDATION

- **Queries:**
  - `['product-detail', slug]` — sản phẩm theo slug.
  - `['product-reviews', productId, reviewPage, 10]` — danh sách & thống kê đánh giá công khai.
  - `['review-eligibility', productId, currentUser?.id]` — chỉ `enabled: Boolean(productId && currentUser)`.
- **Invalidation sau `POST`, `PUT`, `DELETE` thành công:**
  - `queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })`
  - `queryClient.invalidateQueries({ queryKey: ['review-eligibility', productId] })`
  - `queryClient.invalidateQueries({ queryKey: ['reviews', 'home'] })`
- **Logout (`StorefrontHeader` `onLogout`):**
  - `queryClient.removeQueries({ queryKey: ['review-eligibility'] })` + đóng modal nếu đang mở, ngăn rò rỉ trạng thái eligibility sang phiên tiếp theo.

---

## 7. TEST NAMES AND RESULTS (`apps/web/tests/m6_3_customer_reviews.test.tsx`)

Toàn bộ **17/17 test cases PASS** (bao phủ đủ 18 kịch bản yêu cầu trong Section 5 + phân trang + chống gửi lặp + đánh giá chỉ sao không nhận xét):

1. `1-3. Public review list loads with average rating, total count, distribution, verified badge, and header sync` — **PASS**
2. `4. Empty review state displays cleanly when 0 approved reviews exist` — **PASS**
3. `5. Loading state displays while public reviews request is pending` — **PASS**
4. `6. API error state displays error alert and retry button` — **PASS**
5. `7. Guest does not call eligibility endpoint and sees login prompt` — **PASS**
6. `8. Authenticated user (and STAFF without DELIVERED order) without eligibility cannot submit` — **PASS**
7. `9-11. Eligible user submits review with numeric product.id and trimmed comment via POST` — **PASS**
8. `12. Whitespace-only comment is rejected by client validation and never sent to API` — **PASS**
9. `12b. Empty string comment is accepted as rating-only review without sending null` — **PASS**
10. `13. Existing review uses PUT (never POST), hides create button, and shows hidden badge when status=HIDDEN` — **PASS**
11. `14. Delete opens confirmation dialog, calls DELETE with review ID, and handles top-level message response` — **PASS**
12. `15. Successful mutation invalidates product-reviews, review-eligibility, and home reviews queries` — **PASS**
13. `16. Logout clears cached review-eligibility queries and switches UI to Guest login prompt` — **PASS**
14. `17. Product slug resolves to the exact product ID via GET /catalog/products/:slug` — **PASS**
15. `18. Unresolved slug shows Not Found state and does NOT fall back to first catalog product` — **PASS**
16. `19. Pagination requests next page when totalPages > 1` — **PASS**
17. `20. Duplicate submission prevention blocks second POST while request is in flight` — **PASS**

---

## 8. COMMANDS, EXIT CODES & QUALITY GATES

| Kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
|---|---|---|---|
| **M6.3 Frontend Tests** | `npx vitest run apps/web/tests/m6_3_customer_reviews.test.tsx` | `0` | **PASS** — 1 file, **17/17 tests passed** (1223ms) |
| **All Frontend Tests** | `npx vitest run apps/web/tests` | `0` | **PASS** — 5 files (`m6_3`, `m6_2`, `m6_1`, `ResetPasswordFlow`, `FoundationDashboard`), **63/63 tests passed** |
| **Monorepo TypeScript Typecheck** | `npm run typecheck` | `0` | **PASS** — `@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` 0 errors |
| **Monorepo ESLint** | `npm run lint` | `0` | **PASS** — 0 errors, 0 warnings |
| **Prettier Format Check** | `npx prettier --check <5 allowlisted files>` | `0` | **PASS** — All matched files use Prettier code style |
| **Frontend Production Build** | `npm run build -w @nexora/web` | `0` | **PASS** — `tsc -b tsconfig.json && vite build` (285 modules, 668ms) |
| **Backend Integration Suites** | *(Không chạy theo Section 5)* | `N/A` | Cố ý không chạy để bảo đảm **ZERO MySQL mutations** |

---

## 9. SECURITY CONSIDERATIONS

- **Không tin cậy `userId` từ client:** Toàn bộ xác thực danh tính và quyền sở hữu do Backend quyết định qua Bearer JWT (`apiClient`).
- **Không suy đoán quyền sở hữu theo `userName`:** Mọi nút Chỉnh sửa/Xóa chỉ gắn với `eligibility.existingReview` do Backend trả về cho phiên hiện tại.
- **Chống XSS:** Nội dung `review.comment` và `review.userName` được render hoàn toàn bằng React text nodes thuần, tuyệt đối không dùng `dangerouslySetInnerHTML`.
- **Bảo toàn kiểm duyệt (`HIDDEN`):** Không bao giờ gọi `POST` upsert cho đánh giá đã tồn tại (tránh tự ý chuyển `HIDDEN` về `APPROVED`), luôn dùng `PUT /catalog/reviews/:id`.
- **Không miễn trừ `STAFF`/`ADMIN`:** Giao diện bám sát 100% trường `canReview` từ Backend, không có logic bỏ qua Verified Purchase theo role.

---

## 10. KNOWN LIMITATIONS

- Không có chức năng lọc theo mức sao hoặc sắp xếp theo tiêu chí khác ngoài `createdAt desc` (Backend không hỗ trợ).
- Không hỗ trợ tải lên hoặc hiển thị ảnh đính kèm trong đánh giá (Backend/Prisma không hỗ trợ).
- Cảnh báo kích thước bundle Vite (`index-*.js > 500 kB`) là cảnh báo có sẵn của toàn bộ ứng dụng `apps/web` từ trước M6.3, không phát sinh từ M6.3.

---

## 11. GIT STATUS, DATABASE & SAFETY CONFIRMATION

- **Branch:** `main`
- **HEAD Commit:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81`
- **Parent Commit (`HEAD~1`):** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`
- **Tracked Files Modified (`git diff --stat`):**
  - `apps/web/src/features/catalog/ProductDetailPage.tsx` (+264 / -71)
- **New Source/Test Files (Untracked, chờ lệnh commit riêng của Owner):**
  - `apps/web/src/services/reviewService.ts`
  - `apps/web/src/features/catalog/components/ReviewList.tsx`
  - `apps/web/src/features/catalog/components/ReviewFormModal.tsx`
  - `apps/web/tests/m6_3_customer_reviews.test.tsx`
- **New Report File:**
  - `comprehensive-audit/21_M6_3_CUSTOMER_REVIEWS_IMPLEMENTATION_REPORT.md`
- **Existing Untracked Files Preserved:** Toàn bộ tài liệu Markdown và seed files trước đó được bảo toàn nguyên vẹn.
- **Database Mutation Confirmation:** **ZERO database mutations** (không seed, không import, không migration, không chạy integration test ghi DB).
- **Git Commit / Push Confirmation:** **Chưa commit, chưa push** (tuân thủ Section 6: chờ chỉ thị riêng của Project Owner).

---

## 12. FINAL STATUS

### ✅ **`PASS`**
Toàn bộ 14/14 tiêu chí nghiệm thu của M6.3 đã hoàn thành và có bằng chứng kiểm thử thực tế. Agent dừng toàn bộ thao tác tại đây, không tự commit/push và không chuyển sang M6.4 khi chưa có lệnh của Project Owner.
