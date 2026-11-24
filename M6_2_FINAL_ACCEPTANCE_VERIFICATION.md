# BÁO CÁO NGHIỆM THU ĐỘC LẬP CUỐI CÙNG — MILESTONE M6.2
## Customer Account / Profile — Frontend API Integration Final Acceptance Verification

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Milestone:** M6.2 — Customer Account / Profile Frontend API Integration
- **Chế độ kiểm tra:** READ-ONLY POST-IMPLEMENTATION VERIFICATION
- **Branch:** `main`
- **Target Commit:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`
- **Expected Parent:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646` (M6.1 Closure Baseline)
- **Thời điểm thực hiện:** 2026-11-22
- **Kết luận thẩm định:** **FINAL PASS** (Đủ điều kiện đóng chính thức Milestone M6.2)

---

## 1. GIT VÀ TÍNH TOÀN VẸN COMMIT (GIT & COMMIT INTEGRITY)

Thực thi đối soát độc lập các lệnh Git trên repository thực tế tại local:

```bash
$ git branch --show-current
main

$ git rev-parse HEAD
b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1

$ git rev-parse HEAD^
4c6c261cd6b8c0e72286449df052da4fd2ca9646

$ git show --stat --oneline HEAD
b5ba48b feat(web): tich hop tai khoan khach hang m6.2
 apps/web/src/features/profile/ProfilePage.tsx | 1907 +++++++++++++++++++++----
 apps/web/src/services/profileService.ts       |  129 ++
 apps/web/tests/m6_2_customer_profile.test.tsx |  783 ++++++++++
 3 files changed, 2506 insertions(+), 313 deletions(-)

$ git diff HEAD^ HEAD --name-status
M	apps/web/src/features/profile/ProfilePage.tsx
A	apps/web/src/services/profileService.ts
A	apps/web/tests/m6_2_customer_profile.test.tsx

$ git status --short
?? FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md
?? M6_1_FINAL_CLOSURE_VERIFICATION.md
?? M6_2_FINAL_ACCEPTANCE_VERIFICATION.md
?? M6_2_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md
?? M6_2_PRE_IMPLEMENTATION_VERIFICATION.md

$ git status -sb
## main...origin/main [ahead 3]
?? FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md
?? M6_1_FINAL_CLOSURE_VERIFICATION.md
?? M6_2_FINAL_ACCEPTANCE_VERIFICATION.md
?? M6_2_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md
?? M6_2_PRE_IMPLEMENTATION_VERIFICATION.md

$ git diff --stat
(0 files changed, 0 insertions, 0 deletions)

$ git diff --cached --stat
(0 files changed, 0 insertions, 0 deletions)
```

### Đánh giá tính toàn vẹn:
1. **HEAD Check:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` khớp 100% với commit triển khai M6.2 mục tiêu.
2. **Parent Check:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646` khớp chính xác với Baseline đã nghiệm thu đóng M6.1.
3. **Commit Content:** Commit chứa đúng 3 tệp nguồn được phê duyệt, không có tệp thừa.
4. **Untracked Documents:** 4 tài liệu Markdown khảo sát & quản trị trước đó vẫn được bảo toàn nguyên vẹn tại thư mục gốc, không bị xóa hay sửa đổi.
5. **Push State:** `[ahead 3]` so với `origin/main` xác nhận toàn bộ 3 commit M6.1 & M6.2 vẫn nằm hoàn toàn tại local repository, chưa bị push lên remote.
6. **Working Tree:** Không có bất kỳ thay đổi nào chưa stage (`git diff`) hoặc đã stage (`git diff --cached`).

---

## 2. DANH SÁCH TỆP TIN CHÍNH XÁC TRONG COMMIT M6.2

| STT | Trạng thái | Đường dẫn tệp | Mục đích |
| :---: | :---: | :--- | :--- |
| 1 | `A` (Tạo mới) | `apps/web/src/services/profileService.ts` | Service module tích hợp 10 endpoint API Backend Phase B qua `apiClient` |
| 2 | `M` (Cập nhật) | `apps/web/src/features/profile/ProfilePage.tsx` | Kết nối TanStack Query, Form State, Address Book Modal, Notifications, Password Change |
| 3 | `A` (Tạo mới) | `apps/web/tests/m6_2_customer_profile.test.tsx` | Bộ kiểm thử tự động 18 test cases kiểm tra sâu hành vi 4 nhóm chức năng |

---

## 3. XÁC MINH PHẠM VI ĐƯỢC BẢO VỆ (PROTECTED SCOPE VERIFICATION)

Thực hiện kiểm tra Git Diff đối với tất cả các thư mục và thành phần được bảo vệ:

```bash
$ git diff HEAD^ HEAD -- apps/api prisma packages/shared TechPilot audit-output
(Empty output - Exit code 0)
```

### Bằng chứng xác nhận ranh giới:
1. **Backend M1–M5 (`apps/api/**`):** 0 thay đổi. Toàn bộ logic nghiệp vụ, controller, service, repository, routing của Phase B được bảo toàn tuyệt đối.
2. **Database & Migrations (`prisma/**`):** 0 thay đổi. Schema database, chỉ mục, khóa ngoại và các file migration không bị can thiệp.
3. **Shared Contracts (`packages/shared/**`):** 0 thay đổi. Toàn bộ DTO, Zod validation schemas (`ChangePasswordInputSchema`, `UpdateProfileInputSchema`, `CreateAddressInputSchema`, `UpdateAddressInputSchema`) được tái sử dụng trực tiếp từ packages dùng chung.
4. **Mã nguồn tham chiếu (`TechPilot/**`, `audit-output/**`):** 0 thay đổi. Thư mục tham chiếu và kết quả kiểm toán giữ nguyên trạng thái đóng băng.
5. **Ranh giới vai trò STAFF & Phân quyền:**
   - Không tạo mới role hoặc permission trong hệ thống.
   - Không tạo STAFF Dashboard, STAFF Workspace, hay thanh điều hướng dành cho nhân viên.
   - Tuân thủ nghiêm ngặt tài liệu quản trị ranh giới `FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`.
6. **Không mở rộng ngoài phạm vi:**
   - Không can thiệp sang Milestone M6.3 (Đánh giá sản phẩm - Reviews).
   - Không can thiệp sang Milestone M6.4 (Yêu cầu đổi trả - Returns - chỉ giữ nguyên form mockup cũ).
   - Không can thiệp sang quy trình Đặt hàng / Thanh toán (Checkout) hay Quản trị hệ thống (Admin).

---

## 4. KẾT QUẢ RÀ SOÁT TRIỂN KHAI (IMPLEMENTATION REVIEW)

Đã rà soát chi tiết 100% dòng mã nguồn trong `apps/web/src/services/profileService.ts` và `apps/web/src/features/profile/ProfilePage.tsx`:

### 4.1. Thông tin cá nhân (Customer Profile)
- **Tích hợp API thực:** Sử dụng `profileService.getProfile()` tải dữ liệu tài khoản từ `GET /api/v1/profile` qua `useQuery(['profile', currentUser?.id])`.
- **Payload cập nhật chuẩn:** `updateProfileMutation` gọi `PUT /api/v1/profile` với payload gồm `{ fullName, phone, avatarUrl }`.
- **Bất biến Email & Role:** Trường `email` và `role` được set `disabled`, hiển thị nền xám `#F1F5F9`, `cursor: not-allowed` và bị loại bỏ hoàn toàn khỏi payload gửi lên Backend (xác nhận trong test TC-PROF-03).
- **Validation & Phản hồi:** Validate phía client `fullName >= 2` ký tự, `phone` đúng định dạng `0\d{9}`. Hiển thị loading spinner trên nút submit khi `isPending`, toast thông báo thành công hoặc lỗi từ backend envelope.
- **Đồng bộ Cache & LocalStorage:** Invalidate query cache `['profile']`, cập nhật state `currentUser` và đồng bộ lại `localStorage.setItem('nexora_user', ...)` ngay khi mutation thành công.

### 4.2. Sổ địa chỉ (Address Book - Full CRUD)
- **5 Endpoint Backend chính xác:**
  - `GET /profile/addresses` -> `profileService.getAddresses()`
  - `POST /profile/addresses` -> `profileService.createAddress()`
  - `PUT /profile/addresses/:id` -> `profileService.updateAddress()`
  - `DELETE /profile/addresses/:id` -> `profileService.deleteAddress()`
  - `PATCH /profile/addresses/:id/default` -> `profileService.setDefaultAddress()`
- **Ánh xạ DTO 1:1:** Hỗ trợ đầy đủ các trường địa giới hành chính riêng biệt: `province`, `district`, `ward`, `streetAddress`, `recipientName`, `phone`, `isDefault`.
- **Hộp thoại xác nhận xóa (Delete Confirmation Dialog):** Khi bấm nút "Xóa", hiển thị modal `role="dialog"` với tiêu đề "Xác Nhận Xóa Địa Chỉ" và thông điệp cảnh báo rõ ràng. Chỉ xóa khi người dùng bấm "Xác nhận xóa".
- **Giao diện khi trống (Empty State):** Khi mảng địa chỉ rỗng, hiển thị icon vị trí, tiêu đề "Chưa có địa chỉ nào trong sổ địa chỉ" và nút bấm "Thêm địa chỉ ngay", đảm bảo chuẩn nhận diện TechPilot.
- **Quy tắc địa chỉ mặc định:** Badge "MẶC ĐỊNH" chỉ hiển thị ở thẻ có `isDefault: true`. Các thẻ khác hiển thị nút "Đặt làm mặc định". Khi gọi API set default, query cache `['customer-addresses']` được invalidate để cập nhật dữ liệu phản ánh từ server, không dùng state lạc quan giả mạo.

### 4.3. Thông báo hệ thống (Notifications)
- **Tích hợp API:** Tải danh sách thông báo và `unreadCount` từ `GET /api/v1/profile/notifications`.
- **Phân định trực quan Đã đọc / Chưa đọc:**
  - Thông báo chưa đọc (`isRead: false`): Nền xanh nhạt `#EFF6FF`, viền `#BFDBFE`, con trỏ dạng `pointer`.
  - Thông báo đã đọc (`isRead: true`): Nền trắng `#FFFFFF`, viền `#E2E8F0`.
- **Đánh dấu đã đọc:**
  - Đánh dấu 1 thông báo: Click vào card chưa đọc gọi `PATCH /api/v1/profile/notifications/:id/read`.
  - Đánh dấu tất cả đã đọc: Nút "Đánh dấu tất cả đã đọc" gọi `PATCH /api/v1/profile/notifications/read-all`.
- **An toàn BigInt ID:** Giữ nguyên Notification ID ở kiểu dữ liệu chuỗi `string`, truyền an toàn qua URL param, tuyệt đối không parse sang `number` trong JavaScript để tránh tràn số 64-bit BigInt của MySQL.
- **Đồng bộ Cache:** Tự động gọi `invalidateQueries({ queryKey: ['notifications'] })` sau khi mutation thành công.

### 4.4. Đổi mật khẩu (Password Change)
- **Schema xác thực Zod:** Tái sử dụng `ChangePasswordInputSchema` từ `@nexora/shared`.
- **Validation đa tầng:** Kiểm tra độ dài $\ge 8$ ký tự, bắt buộc chứa cả chữ cái và chữ số; kiểm tra xác nhận mật khẩu mới phải khớp chính xác trước khi gửi API.
- **Xử lý mã lỗi `INVALID_CURRENT_PASSWORD`:** Bắt mã lỗi 400 và `INVALID_CURRENT_PASSWORD`, hiển thị thông báo alert thân thiện: *"Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại."*
- **Bảo mật dữ liệu nhạy cảm:**
  - Khi đổi mật khẩu thành công, toàn bộ form inputs (`currentPassword`, `newPassword`, `confirmPassword`) lập tức được xóa trắng về rỗng `""`.
  - Không bao giờ lưu trữ mật khẩu trong `localStorage`, `sessionStorage`, cookies hay log debug.

### 4.5. Đánh giá chung
- **Xóa bỏ Mock Data:** Toàn bộ 4 quy trình trên hoạt động 100% bằng dữ liệu thực từ API backend.
- **Chống gửi trùng (Duplicate Submissions):** Các nút hành động đều có cờ `disabled={mutation.isPending}`, hiển thị spinner xoay và ngăn chặn click liên tiếp.
- **Không unhandled promise rejections:** Tất cả mutations đều có khối `onError` xử lý ngoại lệ an toàn và hiển thị thông báo cho người dùng.
- **Bảo toàn Design System:** Giữ vững bảng màu, font chữ, layout responsive và cấu trúc visual của Nexora Storefront.

---

## 5. TÍNH TOÀN VẸN KIỂM THỬ & ĐỐI SOÁT HỒI QUY (TEST INTEGRITY & REGRESSION)

### 5.1. Bộ test M6.2 mới (`apps/web/tests/m6_2_customer_profile.test.tsx`)
Bộ kiểm thử gồm 18 test cases chia làm 4 nhóm chức năng, kiểm tra sâu hành vi nghiệp vụ thực tế:
- **Group 1: Profile (4 tests):**
  - `TC-PROF-01`: Tải profile từ API và render dữ liệu đúng các trường.
  - `TC-PROF-02`: Cập nhật các trường cho phép (`fullName`, `phone`, `avatarUrl`) và kiểm tra payload PUT.
  - `TC-PROF-03`: Khẳng định `email` và `role` bị disabled và hoàn toàn vắng mặt trong payload cập nhật.
  - `TC-PROF-04`: Xử lý loading, kiểm tra validation chặn form và xử lý lỗi phản hồi từ API.
- **Group 2: Address Book (6 tests):**
  - `TC-ADDR-01`: Tải danh sách địa chỉ và hiển thị đúng badge "MẶC ĐỊNH".
  - `TC-ADDR-02`: Mở modal, nhập form với đầy đủ 4 cấp địa chỉ (`province`, `district`, `ward`, `streetAddress`) và kiểm tra payload POST.
  - `TC-ADDR-03`: Chặn gửi API khi các trường bắt buộc để trống, kiểm tra thông báo lỗi hiển thị dưới input.
  - `TC-ADDR-04`: Mở modal sửa, prefill chính xác dữ liệu cũ và gửi PUT cập nhật.
  - `TC-ADDR-05`: Gửi PATCH đặt địa chỉ làm mặc định và invalidate cache.
  - `TC-ADDR-06`: Mở dialog xác nhận xóa, gửi DELETE sau xác nhận, và kiểm tra hiển thị Empty State chuẩn khi danh sách trống.
- **Group 3: Notifications (4 tests):**
  - `TC-NOTIF-01`: Tải danh sách thông báo và số lượng chưa đọc (`unreadCount`).
  - `TC-NOTIF-02`: Kiểm tra styling trực quan phân biệt thông báo chưa đọc (`#EFF6FF`) và đã đọc (`#FFFFFF`).
  - `TC-NOTIF-03`: Click thông báo gửi PATCH đánh dấu đã đọc, bảo toàn string ID (BigInt safety).
  - `TC-NOTIF-04`: Bấm "Đánh dấu tất cả đã đọc" gửi PATCH `/read-all`.
- **Group 4: Password Change (4 tests):**
  - `TC-PASS-01`: Kiểm tra validation độ dài (< 8 ký tự), thiếu số, thiếu chữ trước khi gửi API.
  - `TC-PASS-02`: Chặn gửi API khi mật khẩu xác nhận không khớp.
  - `TC-PASS-03`: Bắt mã lỗi `INVALID_CURRENT_PASSWORD` từ API và hiển thị cảnh báo phù hợp.
  - `TC-PASS-04`: Xóa sạch form input sau khi đổi mật khẩu thành công và xác nhận không có dữ liệu nhạy cảm rò rỉ vào Storage.

### 5.2. Đối soát bảo toàn số lượng kiểm thử toàn bộ hệ thống
- **Baseline trước M6.2:** `239 tests` (bao gồm backend M1–M5, Phase A security, shared tests, và M6.1 guest cart merge tests).
- **Test M6.2 bổ sung mới:** `18 tests`.
- **Tổng số test kỳ vọng:** $239 + 18 = 257\text{ tests}$.
- **Kết quả thực tế ghi nhận qua `npm test`:** **257/257 tests PASS** trên 20 test files.
- **Tỷ lệ bảo toàn:** 100% test cũ không bị suy yếu, sửa đổi hay xóa bỏ.

---

## 6. BẰNG CHỨNG CÁC CỔNG CHẤT LƯỢNG (QUALITY GATE EVIDENCE)

Toàn bộ 7 cổng chất lượng đã được chạy kiểm tra thực tế, thu thập mã thoát lệnh (exit code) và kết quả chi tiết:

| Cổng kiểm tra (Gate) | Lệnh thực thi | Mã thoát | Kết quả quan sát | Đánh giá |
| :--- | :--- | :---: | :--- | :---: |
| **1. TypeScript** | `npm run typecheck` | `0` | Biên dịch sạch 0 lỗi qua `@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` | **PASS** |
| **2. ESLint** | `npm run lint` | `0` | 0 lỗi, 0 cảnh báo trên toàn bộ monorepo | **PASS** |
| **3. Prettier** | `npx prettier --check apps/web/src/features/profile/ProfilePage.tsx apps/web/src/services/profileService.ts apps/web/tests/m6_2_customer_profile.test.tsx` | `0` | "All matched files use Prettier code style!" | **PASS** |
| **4. M6.2 Test Suite** | `npx vitest run apps/web/tests/m6_2_customer_profile.test.tsx` | `0` | **18/18 tests pass** (1.16s) | **PASS** |
| **5. Frontend Test Suite** | `npx vitest run apps/web/tests` | `0` | **46/46 tests pass** qua 4 test files | **PASS** |
| **6. Monorepo Test Suite** | `npm test` | `0` | **257/257 tests pass** qua 20 test files | **PASS** |
| **7. Production Build** | `npm run build` | `0` | Vite v8.3.8 xuất bundle production thành công (dist/assets sạch sẽ) | **PASS** |

---

## 7. ĐÁNH GIÁ AN NINH VÀ TOÀN VẸN DỮ LIỆU (SECURITY & DATA INTEGRITY)

1. **Phân quyền và Bảo mật Hồ sơ:**
   - Trường `email` và `role` là bất biến từ phía giao diện, đồng thời backend đã có RBAC xác thực quyền sở hữu (ownership check).
   - Không thể gửi request thay đổi role của bản thân thành STAFF hoặc ADMIN qua form Profile.
2. **Bảo mật Mật khẩu:**
   - Mật khẩu chỉ tồn tại trong React component state trong thời gian nhập liệu, không được log ra console hay lưu vào LocalStorage/SessionStorage.
   - Khi thành công, state được reset ngay lập tức.
3. **An toàn ID Thông báo (BigInt Safety):**
   - MySQL sử dụng cột `id BIGINT AUTO_INCREMENT` cho thông báo. Khi serialize về JSON, ID được biểu diễn dạng chuỗi (`string`). Frontend xử lý và truyền lại dưới dạng chuỗi nguyên vẹn, ngăn chặn hoàn toàn nguy cơ sai lệch số học do giới hạn `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$) trong JavaScript engine.
4. **Tính toàn vẹn Dữ liệu Địa chỉ:**
   - DTO phân tách rõ `province`, `district`, `ward`, `streetAddress` giúp đồng bộ chính xác với cơ sở dữ liệu và sẵn sàng cho việc tính phí vận chuyển sau này.
   - Thao tác xóa có bước xác nhận giúp chống mất mát dữ liệu do vô tình bấm nhầm.

---

## 8. DANH MỤC LỖI CÒN LẠI (REMAINING DEFECTS)

- **Lỗi mức Nghiêm trọng (Critical):** `0`
- **Lỗi mức Cao (High):** `0`
- **Lỗi mức Trung bình (Medium):** `0`
- **Lỗi mức Thấp (Low / Cosmetic):** `0`

*Ghi chú:* Toàn bộ các flow được cấp phép trong M6.2 hoạt động đúng 100% hợp đồng API và đạt chuẩn chất lượng nghiêm ngặt. Không phát hiện bất kỳ khiếm khuyết nào tồn đọng.

---

## 9. QUYẾT ĐỊNH NGHIỆM THU CUỐI CÙNG (FINAL RECOMMENDATION)

# **FINAL PASS**

**Căn cứ phê duyệt:**
1. **Tính toàn vẹn Git:** Commit `b5ba48b` chuẩn mực, parent đúng baseline `4c6c261`, chỉ thay đổi đúng 3 file được cấp phép, chưa push lên remote.
2. **Ranh giới bảo vệ:** Không can thiệp `apps/api/**`, `prisma/**`, `packages/shared/**`, `TechPilot/**`, `audit-output/**`. Không tạo STAFF hay mở rộng ngoài phạm vi.
3. **Chất lượng triển khai:** Đầy đủ 4 nhóm chức năng (Profile, Address Book CRUD, Notifications, Password Change) kết nối API thật, bảo vệ an toàn dữ liệu và giữ vững Design System.
4. **Bảo toàn kiểm thử:** 257/257 tests monorepo PASS (bảo toàn 100% 239 tests cũ và bổ sung 18 tests mới).
5. **Quality Gates:** 100% đạt chuẩn (TypeScript, ESLint, Prettier, Tests, Build).

*Milestone M6.2 đã hoàn tất toàn diện và đủ điều kiện để Chủ dự án chính thức đóng lại.*
