# M6.0 — BÁO CÁO XÁC MINH NGHIỆP VỤ & PHẠM VI TRIỂN KHAI HOÀN THIỆN LOGIC FRONTEND (FINAL FUNCTIONAL & BUSINESS LOGIC VERIFICATION)

- **Mã tài liệu:** `M6_0_FINAL_FUNCTIONAL_VERIFICATION_AND_SCOPE.md`
- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Tham chiếu nguồn:** `TechPilot` (`D:\02_Dự Án Phần Mềm\TechPilot (Bản Chính Thức)`) — READ-ONLY
- **Dự án đích:** `Nexora` (`D:\Nexora\apps\web`)
- **Vai trò:** Principal Frontend Architect & Full-Stack Integration Auditor
- **Thời điểm kiểm toán:** `2026-11-22T16:30:00+07:00`
- **Ranh giới cốt lõi (ABSOLUTE UI FREEZE):** **GIỮ NGUYÊN 100% GIAO DIỆN, BỐ CỤC, MÀU SẮC, CSS VÀ ASSETS HIỆN TẠI. M6 CHỈ TẬP TRUNG HOÀN THIỆN BUSINESS LOGIC, TÍCH HỢP REST API VÀ ĐỒNG BỘ TRẠNG THÁI TƯƠNG TÁC (UX BEHAVIOR).**

---

## 1. Current Frontend Functional Status (Hiện Trạng Chức Năng Frontend)

Frontend Nexora (`apps/web`) đã hoàn thành việc xây dựng toàn bộ giao diện (visual UI) theo chuẩn TechPilot. Tuy nhiên, sau các Milestone Backend Phase B (M1–M5), hiện trạng chức năng thực tế được phân loại chính xác thành 3 nhóm:

### A. Nhóm đã tích hợp API hoàn chỉnh & Hoạt động thực tế (`ACTIVE`)

1. **Storefront & Catalog:** `StorefrontHome.tsx`, `ProductCatalogSection.tsx`, `SearchPage.tsx` $\rightarrow$ Đã kết nối `GET /api/v1/catalog/banners`, `/categories`, `/products`, `/marketing/flash-sales`.
2. **Chi tiết sản phẩm (Catalog Specs):** `ProductDetailPage.tsx` $\rightarrow$ Đã kết nối thông tin sản phẩm, thư viện ảnh, bảng thông số kỹ thuật (Tab Specs, Tab Description).
3. **Giỏ hàng cơ bản (Cart Operations):** `CartPage.tsx`, `cartService.ts` $\rightarrow$ Đã kết nối `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` có header `x-guest-session-id`.
4. **Đặt hàng & Thanh toán (Checkout & Orders):** `CheckoutPage.tsx` $\rightarrow$ Đã kết nối `POST /api/v1/orders` (tạo đơn, lưu snapshot giá, giảm tồn kho có ACID transaction) và thanh toán VNPay/COD.
5. **Tra cứu đơn hàng (Order Tracking):** `OrderTrackingPage.tsx` $\rightarrow$ Đã kết nối `GET /api/v1/orders/:orderCode`.
6. **Bốn hệ thống AI chuyên sâu:** `FloatingChatbot.tsx`, `AiAssistantPage.tsx`, `ComparePage.tsx`, `ProductDetailPage.tsx` (Tab AI Chat) $\rightarrow$ Đã kết nối đầy đủ các endpoint `/api/v1/ai/*`.
7. **Lịch sử đơn hàng cá nhân:** `ProfilePage.tsx` (Tab Orders) $\rightarrow$ Đã kết nối `GET /api/v1/orders/my-orders`.
8. **12 Phân hệ Quản trị Admin:** `AdminDashboardPage.tsx` (Dashboard, Orders, Products, Categories, Brands, Inventory, Coupons, Flash sales, Banners, Posts, Users, Reviews) $\rightarrow$ Đã kết nối các endpoint `/api/v1/admin/*`.

### B. Nhóm có giao diện nhưng đang là Mock / Local State (`MOCK / UNINTEGRATED`)

1. **Guest Cart Merge (M3):** Client web chưa gửi kèm `guestSessionId` khi đăng nhập/đăng ký tại `authService.ts`; chưa có hàm gọi `POST /api/v1/cart/merge`.
2. **Customer Profile (M2):** `ProfilePage.tsx` Tab Profile chỉ hiển thị form và toast thông báo giả lập; chưa kết nối `GET /api/v1/profile` và `PUT /api/v1/profile`.
3. **Address Book (M2):** `ProfilePage.tsx` Tab Addresses hiển thị 1 thẻ địa chỉ tĩnh; chưa có Modal thêm/sửa/xóa và chưa kết nối `/api/v1/profile/addresses/*`.
4. **System Notifications (M2):** `ProfilePage.tsx` Tab Notifications hiển thị mảng tĩnh 3 thông báo; chưa kết nối `GET /api/v1/profile/notifications`, đánh dấu đã đọc.
5. **Change Password (M2):** `ProfilePage.tsx` Tab Password chỉ gọi toast; chưa kết nối `POST /api/v1/profile/change-password`.
6. **Customer Reviews (M4):** `ProductDetailPage.tsx` Tab 3 Đánh giá hiển thị markup tĩnh (hardcoded 5 sao và 1 đánh giá của "Trần Văn Nam"); chưa kết nối `GET /api/v1/catalog/products/:id/reviews`, chưa có form viết đánh giá gọi `POST /api/v1/catalog/reviews`.
7. **Customer Returns (M5):** `ProfilePage.tsx` Tab Returns hiển thị thẻ mẫu tĩnh; chưa có form tạo yêu cầu đổi/trả với kiểm soát `deliveredAt <= 7 ngày` và chưa kết nối `GET /api/v1/profile/returns`.

### C. Nhóm còn thiếu giao diện phía Admin (`MISSING UI GAP`)

1. **Admin Returns Management (M5):** `AdminDashboardPage.tsx` hoàn toàn chưa có Tab hoặc giao diện quản lý Đổi/Trả hàng để tương tác với State Machine 4 bước và API `/api/v1/admin/returns`.

---

## 2. Ma Trận Đối Chiếu Trực Tiếp Frontend & Backend (API Integration Matrix)

| STT | Phân hệ / Chức năng      | Frontend Source File                                  | Backend Route File                               |                HTTP & Endpoint                 | Request DTO                               | Response DTO                   | Quyền hạn (RBAC)  | Bằng chứng Test Backend (MySQL 8.4)               | Trạng thái Frontend  |
| :-: | :----------------------- | :---------------------------------------------------- | :----------------------------------------------- | :--------------------------------------------: | :---------------------------------------- | :----------------------------- | :---------------: | :------------------------------------------------ | :------------------: |
|  1  | **Guest Cart Merge**     | `apps/web/src/services/cartService.ts`                | `apps/api/src/modules/cart/cart.routes.ts`       |           `POST /api/v1/cart/merge`            | `MergeCartInputSchema` (`guestSessionId`) | `MergeCartResultDto`           | `CUSTOMER` (JWT)  | `phase_b_cart_merge.test.ts` (14 tests PASS)      |     **Chưa nối**     |
|  2  | **Login w/ Merge**       | `apps/web/src/services/authService.ts`                | `apps/api/src/modules/auth/auth.routes.ts`       |           `POST /api/v1/auth/login`            | `LoginInput` (+ `guestSessionId?`)        | `AuthSession` (+ `cartMerge?`) |      Public       | `phase_b_cart_merge.test.ts` (`MERGE-AUTH-LOGIN`) | **Chưa gửi guestId** |
|  3  | **Register w/ Merge**    | `apps/web/src/services/authService.ts`                | `apps/api/src/modules/auth/auth.routes.ts`       |          `POST /api/v1/auth/register`          | `RegisterInput` (+ `guestSessionId?`)     | `AuthSession` (+ `cartMerge?`) |      Public       | `phase_b_cart_merge.test.ts` (`MERGE-AUTH-REG`)   | **Chưa gửi guestId** |
|  4  | **Get Profile**          | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |             `GET /api/v1/profile`              | Không                                     | `UserProfileDto`               | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`PROF-B1`)   |       **Mock**       |
|  5  | **Update Profile**       | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |             `PUT /api/v1/profile`              | `UpdateProfileInput` (`fullName, phone`)  | `UserProfileDto`               | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`PROF-B2`)   |       **Mock**       |
|  6  | **Address List**         | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |        `GET /api/v1/profile/addresses`         | Không                                     | `AddressDto[]`                 | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`ADDR-B1`)   |       **Mock**       |
|  7  | **Create Address**       | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |        `POST /api/v1/profile/addresses`        | `CreateAddressInput`                      | `AddressDto`                   | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`ADDR-B2`)   |       **Mock**       |
|  8  | **Update Address**       | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |      `PUT /api/v1/profile/addresses/:id`       | `UpdateAddressInput`                      | `AddressDto`                   | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`ADDR-B5`)   |       **Mock**       |
|  9  | **Delete Address**       | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |     `DELETE /api/v1/profile/addresses/:id`     | Không                                     | `{ message }`                  | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`ADDR-B6`)   |       **Mock**       |
| 10  | **Set Default Addr**     | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` | `PATCH /api/v1/profile/addresses/:id/default`  | Không                                     | `AddressDto`                   | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`ADDR-B7`)   |       **Mock**       |
| 11  | **Notifications**        | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |      `GET /api/v1/profile/notifications`       | Không                                     | `NotificationDto[]`            | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`NOTIF-B1`)  |       **Mock**       |
| 12  | **Read Notification**    | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` | `PATCH /api/v1/profile/notifications/:id/read` | Không                                     | `NotificationDto`              | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`NOTIF-B2`)  |       **Mock**       |
| 13  | **Read All Notifs**      | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` | `PATCH /api/v1/profile/notifications/read-all` | Không                                     | `{ count }`                    | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`NOTIF-B3`)  |       **Mock**       |
| 14  | **Change Password**      | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |     `POST /api/v1/profile/change-password`     | `ChangePasswordInput`                     | `{ message }`                  | `CUSTOMER` (JWT)  | `phase_b_profile_addresses.test.ts` (`PASS-B4`)   |       **Mock**       |
| 15  | **Public Reviews**       | `apps/web/src/features/catalog/ProductDetailPage.tsx` | `apps/api/src/modules/catalog/catalog.routes.ts` |   `GET /api/v1/catalog/products/:id/reviews`   | `limit, page`                             | `ProductReviewsDto`            |      Public       | `phase_b_customer_reviews.test.ts` (Group 1)      |       **Mock**       |
| 16  | **Submit Review**        | `apps/web/src/features/catalog/ProductDetailPage.tsx` | `apps/api/src/modules/catalog/catalog.routes.ts` |         `POST /api/v1/catalog/reviews`         | `CreateReviewInput`                       | `ReviewDto`                    | `CUSTOMER` (JWT)  | `phase_b_customer_reviews.test.ts` (Group 2, 3)   |   **Chưa có form**   |
| 17  | **My Reviews**           | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/catalog/catalog.routes.ts` |    `GET /api/v1/catalog/reviews/my-reviews`    | Không                                     | `ReviewDto[]`                  | `CUSTOMER` (JWT)  | `phase_b_customer_reviews.test.ts` (Group 4)      |     **Chưa nối**     |
| 18  | **Delete Review**        | `apps/web/src/features/catalog/ProductDetailPage.tsx` | `apps/api/src/modules/catalog/catalog.routes.ts` |      `DELETE /api/v1/catalog/reviews/:id`      | Không                                     | `{ message }`                  | `CUSTOMER` (JWT)  | `phase_b_customer_reviews.test.ts` (Group 4)      |    **Chưa có UI**    |
| 19  | **Customer Returns**     | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |         `GET /api/v1/profile/returns`          | `limit, page`                             | `ReturnRequestDto[]`           | `CUSTOMER` (JWT)  | `phase_b_returns_and_admin_crud.test.ts` (RET-08) |       **Mock**       |
| 20  | **Create Return**        | `apps/web/src/features/profile/ProfilePage.tsx`       | `apps/api/src/modules/profile/profile.routes.ts` |         `POST /api/v1/profile/returns`         | `CreateReturnRequestInput`                | `ReturnRequestDto`             | `CUSTOMER` (JWT)  | `phase_b_returns_and_admin_crud.test.ts` (RET-01) |       **Mock**       |
| 21  | **Admin Returns**        | `apps/web/src/features/admin/AdminDashboardPage.tsx`  | `apps/api/src/modules/admin/admin.routes.ts`     |          `GET /api/v1/admin/returns`           | `status, limit, page`                     | `AdminReturnsListDto`          | `STAFF` / `ADMIN` | `phase_b_returns_and_admin_crud.test.ts` (RET-12) |   **Thiếu tab UI**   |
| 22  | **Admin Process Return** | `apps/web/src/features/admin/AdminDashboardPage.tsx`  | `apps/api/src/modules/admin/admin.routes.ts`     |    `PATCH /api/v1/admin/returns/:id/status`    | `UpdateReturnStatusInput`                 | `AdminReturnDetailDto`         | `STAFF` / `ADMIN` | `phase_b_returns_and_admin_crud.test.ts` (RET-14) |   **Thiếu tab UI**   |

---

## 3. Xác Minh Chi Tiết Logic Nghiệp Vụ (Business Logic Verification)

### A. Guest Cart Merge (Milestone M3)

- **Vòng đời `guestSessionId`:**
  - Được sinh ra tại [`apps/web/src/services/cartService.ts`](file:///d:/Nexora/apps/web/src/services/cartService.ts) (dòng 4–11): `guest_${random}_${Date.now()}` và lưu trong `localStorage['nexora_guest_session']`.
  - Được truyền tự động qua header `x-guest-session-id` khi gọi API `/cart`.
- **Hành vi cần xử lý khi Đăng nhập / Đăng ký:**
  1. Khi gọi `authService.login()` hoặc `authService.register()`, đọc `guestSessionId` từ `localStorage` và đính kèm vào payload.
  2. Backend sẽ thực hiện gộp nguyên tử trong transaction: bảo lưu sản phẩm mới, cộng dồn số lượng trùng lặp, chặn/cảnh báo sản phẩm hết hàng hoặc ngừng kinh doanh, cap số lượng nếu vượt tồn kho (7 kịch bản conflict đã test).
  3. Khi nhận response thành công từ login/register:
     - Xóa `localStorage.removeItem('nexora_guest_session')`.
     - Gọi `queryClient.invalidateQueries({ queryKey: ['cart'] })` để làm mới giỏ hàng và cập nhật badge đỏ trên Header.
     - Nếu có cảnh báo (sản phẩm hết hàng, điều chỉnh số lượng), hiển thị thông báo toast thân thiện cho người dùng.
  4. Nếu login/register thất bại: **Bảo toàn nguyên vẹn `nexora_guest_session`**, không được xóa session khách.

### B. Customer Account & Profile (Milestone M2)

- **Profile Info:** Gọi `GET /api/v1/profile` khi mở Tab Profile. Khi submit form, gọi `PUT /api/v1/profile`, disable nút lưu khi đang mutate, hiển thị toast thành công và cập nhật `currentUser.fullName` trong context/localStorage.
- **Address Book (Sổ địa chỉ):**
  - Danh sách địa chỉ gọi `GET /api/v1/profile/addresses`.
  - Mở modal thêm/sửa sử dụng các trường: `receiverName`, `phone`, `province`, `district`, `ward`, `streetAddress`, `isDefault`.
  - Khi đặt làm mặc định (`PATCH /api/v1/profile/addresses/:id/default`), backend tự động hạ cờ các địa chỉ khác trong transaction có khóa `SELECT ... FOR UPDATE`. Frontend chỉ cần invalidate query `['addresses']`.
- **Notifications (Thông báo):**
  - Tải danh sách thông báo thật `GET /api/v1/profile/notifications`.
  - Click vào thông báo chưa đọc $\rightarrow$ gọi `PATCH /api/v1/profile/notifications/:id/read`.
  - Nút "Đánh dấu tất cả đã đọc" $\rightarrow$ gọi `PATCH /api/v1/profile/notifications/read-all`.
- **Change Password:**
  - Form đổi mật khẩu yêu cầu `currentPassword`, `newPassword`, `confirmPassword`.
  - Kiểm tra phía client trước: mật khẩu mới $\ge$ 8 ký tự, có chữ hoa, chữ thường, số; confirm password khớp.
  - Gọi `POST /api/v1/profile/change-password`. Nếu sai mật khẩu hiện tại $\rightarrow$ hiển thị lỗi tại trường `currentPassword`.

### C. Customer Reviews (Milestone M4)

- **Hiển thị Reviews công khai:**
  - Tại Tab 3 `ProductDetailPage.tsx`: Gọi `GET /api/v1/catalog/products/:id/reviews`.
  - Hiển thị điểm trung bình thực tế, thanh phân bổ số sao (1–5 sao), tổng số đánh giá.
  - Mỗi thẻ review hiển thị tên khách hàng, số sao, ngày đăng, nội dung, ưu điểm/nhược điểm (nếu có).
  - Huy hiệu **"Đã mua hàng tại Nexora"** màu xanh chỉ hiển thị khi `review.isVerifiedPurchase === true`.
- **Gửi đánh giá:**
  - Form chỉ hiển thị khi khách hàng đã đăng nhập (`currentUser !== null`).
  - Cho phép chọn 1–5 sao, nhập tiêu đề, nhận xét (tối thiểu 10 ký tự).
  - Backend tự động kiểm tra: Nếu khách hàng đã từng mua sản phẩm này trong đơn hàng `DELIVERED`, tự động gắn `isVerifiedPurchase = true`.
  - Mỗi khách hàng chỉ được lưu 1 đánh giá cho mỗi sản phẩm (gửi lại sẽ tự động update, không tạo bản ghi trùng lặp).

### D. Returns Workflow (Milestone M5)

- **Khách hàng gửi yêu cầu (`ProfilePage.tsx` Tab Returns):**
  - Hiển thị danh sách yêu cầu đổi/trả đã tạo từ `GET /api/v1/profile/returns`.
  - Nút "Tạo yêu cầu đổi trả" mở modal:
    - Danh sách đơn hàng đủ điều kiện: Chỉ tải các đơn hàng của user có `orderStatus === 'DELIVERED'` và có `deliveredAt` trong vòng 7 ngày gần nhất.
    - Chọn sản phẩm cần đổi/trả trong đơn hàng, chọn số lượng, lý do (tối thiểu 10 ký tự), giải pháp mong muốn (`REFUND` hoặc `REPLACE`).
    - Gọi `POST /api/v1/profile/returns`.
- **Quản trị viên xử lý (`AdminDashboardPage.tsx` Tab Returns):**
  - Bổ sung Tab "Đổi / Trả Hàng" trên thanh điều hướng bên trái của Admin (ngay dưới tab Đơn hàng hoặc Đánh giá).
  - Bảng danh sách yêu cầu đổi/trả: Mã yêu cầu (`RET-YYYYMMDD-XXXX`), mã đơn hàng, khách hàng, lý do, trạng thái badge, ngày tạo.
  - Modal xem chi tiết sản phẩm lỗi, số lượng, phương án giải quyết.
  - Các nút hành động tương ứng với State Machine:
    - Trạng thái `PENDING` $\rightarrow$ Nút **"Duyệt yêu cầu"** (chuyển `APPROVED`) hoặc **"Từ chối"** (mở popup nhập `rejectionReason`).
    - Trạng thái `APPROVED` $\rightarrow$ Nút **"Bắt đầu xử lý"** (chuyển `PROCESSING`).
    - Trạng thái `PROCESSING` $\rightarrow$ Nút **"Hoàn tất đổi/trả"** (chuyển `COMPLETED`, có checkbox chọn từng sản phẩm `isResellable: true/false` để hoàn kho tự động).

---

## 4. Xác Minh Trải Nghiệm Sử Dụng (UX Behavior Verification)

Các hành vi UX cần hoàn thiện mà **không thay đổi visual design hay CSS hiện tại**:

1. **Chống Duplicate Request (Idempotency UX):** Disable nút submit khi mutation đang trong trạng thái `isPending` (các nút Đăng nhập, Lưu địa chỉ, Gửi đánh giá, Tạo đổi trả).
2. **Hiển thị lỗi trường dữ liệu (Field Errors):** Khi Backend trả về mã lỗi `VALIDATION_ERROR` (Zod issues), hiển thị thông báo lỗi màu đỏ ngay dưới input tương ứng thay vì chỉ bắn toast chung chung.
3. **Bảo toàn dữ liệu khi request thất bại (Form State Preservation):** Nếu request gặp lỗi mạng hoặc validation, không reset form làm mất nội dung người dùng vừa nhập.
4. **Bảo vệ giỏ hàng khách khi Login lỗi:** Nếu khách hàng nhập sai mật khẩu, tuyệt đối không được xóa `nexora_guest_session` trong `localStorage`.
5. **Xử lý Session hết hạn (401 Handling):** Interceptor trong `apiClient.ts` khi gặp lỗi 401 tự động xóa token hỏng, đưa trạng thái `currentUser` về `null` và hiển thị modal đăng nhập lại, không để màn hình bị crash hay trắng trang.
6. **Đồng bộ hóa tức thì (Cache Invalidation):** Sau khi thêm địa chỉ, gửi đánh giá, tạo đổi trả $\rightarrow$ gọi `queryClient.invalidateQueries` tương ứng để giao diện cập nhật ngay lập tức mà không cần F5 tải lại trang.

---

## 5. Phạm Vi Triển Khai Milestone M6.1 (M6.1 Implementation Scope)

Tuân thủ nghiêm ngặt nguyên tắc chia nhỏ công việc và cô lập rủi ro, **Milestone M6.1 chỉ tập trung vào hạ tầng API Service và Guest Cart Merge**.

### A. Phạm vi bao gồm trong M6.1

1. **API Service Layer Foundation:**
   - Hoàn thiện `apps/web/src/lib/apiClient.ts`: Bổ sung xử lý envelope chuẩn (`ApiSuccessEnvelope`, `ApiErrorEnvelope`), chuẩn hóa error parsing.
   - Mở rộng `apps/web/src/services/authService.ts`: Hỗ trợ tự động gắn `guestSessionId` khi đăng nhập và đăng ký.
   - Mở rộng `apps/web/src/services/cartService.ts`: Bổ sung hàm `mergeCart(guestSessionId: string): Promise<MergeCartResultDto>`.
2. **Tích hợp Luồng Guest Cart Merge (M3 Frontend):**
   - Tích hợp tại `LoginPage.tsx`, `RegisterPage.tsx`, và `AuthModal.tsx`:
     - Tự động lấy `guestSessionId` từ `localStorage`.
     - Gửi lên API login/register.
     - Khi thành công: Lưu token, xóa session khách, làm mới giỏ hàng (`queryClient.invalidateQueries({ queryKey: ['cart'] })`).
     - Hiển thị toast thông báo nếu có hàng được gộp (`Đã đồng bộ giỏ hàng của bạn`).
   - Xử lý UX khi đăng nhập thất bại: Giữ nguyên giỏ hàng khách trong `localStorage`.
3. **Kiểm thử tự động M6.1:**
   - Viết component/flow test cho `authService` và `cartService` kiểm tra toàn bộ luồng merge giỏ hàng.

### B. Phạm vi TUYỆT ĐỐI KHÔNG triển khai trong M6.1 (Để lại các sub-milestone sau)

- **KHÔNG** làm Customer Profile, Addresses, Notifications, Password (để dành cho M6.2).
- **KHÔNG** làm Customer Reviews (để dành cho M6.3).
- **KHÔNG** làm Customer Returns (để dành cho M6.4).
- **KHÔNG** làm Admin Returns UI (để dành cho M6.5).

---

## 6. Lộ Trình Triển Khai Đề Xuất (M6 Roadmap)

| Sub-Milestone | Tên phân hệ                           | Trọng tâm công việc                                                               | Backend API tương ứng                                                  |
| :-----------: | :------------------------------------ | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
|   **M6.0**    | **Discovery & Business Verification** | Kiểm kê, đối soát TechPilot, chốt phạm vi và UI Freeze                            | _(Đã hoàn thành)_                                                      |
|   **M6.1**    | **API Foundation & Guest Cart Merge** | Chuẩn hóa service layer, tích hợp auto-merge giỏ hàng khi login/register          | `POST /cart/merge`, `/auth/login`, `/auth/register`                    |
|   **M6.2**    | **Customer Account & Profile Logic**  | Nối Profile info, Address Book CRUD + Default, Notifications, Change Password     | `GET/PUT /profile`, `/addresses`, `/notifications`, `/change-password` |
|   **M6.3**    | **Reviews Logic & Verified Purchase** | Nối Tab 3 Reviews tại Product Detail, form gửi review, huy hiệu verified purchase | `GET /catalog/products/:id/reviews`, `POST /catalog/reviews`           |
|   **M6.4**    | **Customer Returns Logic**            | Nối Tab Returns tại Profile, modal chọn đơn `DELIVERED` <= 7 ngày để tạo yêu cầu  | `GET /profile/returns`, `POST /profile/returns`                        |
|   **M6.5**    | **Admin Returns Management Logic**    | Bổ sung Tab Returns trong Admin Dashboard, xem chi tiết, duyệt/từ chối/hoàn tất   | `GET /admin/returns`, `PATCH /admin/returns/:id/status`                |
|   **M6.6**    | **Integration Testing & Acceptance**  | Playwright E2E full user journey, kiểm tra responsive và nghiệm thu Phase B       | Toàn bộ hệ thống                                                       |

---

## 7. Tiêu Chí Nghiệm Thu M6.1 (Acceptance Criteria for M6.1)

1. **Cart Merge on Login:** Khi khách vãng lai thêm sản phẩm vào giỏ hàng rồi đăng nhập tại `LoginPage` hoặc `AuthModal`, toàn bộ sản phẩm trong giỏ hàng khách phải xuất hiện trong giỏ hàng tài khoản người dùng trên giao diện.
2. **Cart Merge on Register:** Tương tự khi đăng ký tài khoản mới, giỏ hàng khách được gộp tự động.
3. **Session Lifecycle:** `nexora_guest_session` bị xóa khỏi `localStorage` sau khi merge thành công; giữ nguyên nếu đăng nhập thất bại.
4. **Header Sync:** Badge số lượng sản phẩm trên icon Giỏ hàng ở Header cập nhật ngay lập tức mà không cần F5 trang.
5. **UI Invariance:** Giao diện trang Login, Register, AuthModal, Header và Cart giữ nguyên vẹn 100% diện mạo và style visual.
6. **Quality Gates:** `typecheck`, `lint`, `format:check`, `test` đạt kết quả xanh (PASS).

---

## 8. Kết Luận & Khuyến Nghị

- Toàn bộ các API contracts, business logic và điều kiện kỹ thuật cho Milestone M6 đã được xác minh rõ ràng, minh bạch với file paths cụ thể.
- Nguyên tắc **ABSOLUTE UI FREEZE** được cam kết tuân thủ tuyệt đối: Không làm lại giao diện, chỉ thổi hồn cho UI hiện có bằng logic nghiệp vụ và dữ liệu thực tế từ MySQL 8.4.
- Đề xuất Tech Lead xem xét và kích hoạt **Milestone M6.1 (API Foundation & Guest Cart Merge)** theo đúng phạm vi đã định nghĩa ở Mục 5.

---

_(Báo cáo hoàn tất. Toàn bộ mã nguồn, cơ sở dữ liệu và Git repository được giữ nguyên trạng. Dừng tại đây và chờ chỉ thị tiếp theo)._
