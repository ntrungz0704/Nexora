# BÁO CÁO TỔNG KẾT TRIỂN KHAI VÀ NGHIỆM THU MILESTONE M6.2
## Customer Account / Profile — Frontend API Integration

**Dự án:** Nexora — Single-Vendor E-Commerce & Store Management System  
**Milestone:** M6.2 — Customer Account / Profile  
**Trạng thái nghiệm thu:** **FINAL PASS — ACCEPTED**  
**Thời gian hoàn thành:** 2026-11-22  
**Chi nhánh Git:** `main`  
**Baseline HEAD Commit:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646`  
**M6.2 Implementation Commit:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`  
**Trạng thái Push:** **CHƯA PUSH (100% Local Commit)**  

---

## 1. TỔNG QUAN ĐIỀU HÀNH & KẾT QUẢ CUỐI CÙNG

Milestone M6.2 đã hoàn thành toàn diện việc thay thế 100% dữ liệu mock/tĩnh trong giao diện Tài khoản khách hàng (`ProfilePage.tsx`) bằng các API Backend thực tế từ Phase B (M1–M5), đảm bảo tính toàn vẹn nghiệp vụ, an ninh dữ liệu và đồng nhất với thiết kế TechPilot.

- **4 Nhóm nghiệp vụ:** Profile cá nhân, Sổ địa chỉ (Full CRUD), Thông báo hệ thống và Đổi mật khẩu bảo mật đã được kết nối thông qua dịch vụ chuẩn `profileService.ts`.
- **Quality Gates:** 100% Quality Gates (TypeScript typecheck, ESLint, Prettier, targeted tests, full frontend suite, full monorepo suite, production build) đều đạt kết quả **PASS**.
- **Test Suite:** Tổng cộng **257/257 tests passing** trên toàn monorepo (trong đó có 18 tests mới cho M6.2, bảo toàn 239 tests từ trước).
- **Ranh giới an toàn:** Bảo toàn 100% Backend `apps/api/**`, Database migrations `prisma/**`, `packages/shared/**`, `TechPilot/**` và `audit-output/**`.

---

## 2. TRẠNG THÁI GIT: TRƯỚC VÀ SAU TRIỂN KHAI

### 2.1. Baseline Git State (Trước khi triển khai)
- **Branch:** `main`
- **HEAD:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646` (`fix(web): hoan thien dto validation va passive retry lifecycle m6.1`)
- **Working Tree:** Sạch (0 tracked modifications, 3 untracked Markdown docs).

### 2.2. Final Git State (Sau khi triển khai)
- **Branch:** `main`
- **HEAD:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`
- **Parent Commit:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646` (Khớp 100% Baseline)
- **Commit Message:** `feat(web): tich hop tai khoan khach hang m6.2` (Tiếng Việt không dấu)
- **Push status:** 3 commits ahead of `origin/main` (Local only, tuyệt đối không push).

---

## 3. DANH SÁCH TỆP TIN THAY ĐỔI & PHẠM VI

Đúng 3 tệp nguồn được phép can thiệp theo Lệnh triển khai M6.2:

| # | Đường dẫn tệp tin | Hành động | Mô tả thay đổi |
| :-: | :--- | :---: | :--- |
| **1** | `apps/web/src/services/profileService.ts` | **Tạo mới** | Lớp dịch vụ API kết nối 10 endpoint Backend qua `apiClient`. |
| **2** | `apps/web/src/features/profile/ProfilePage.tsx` | **Cập nhật** | Tích hợp TanStack Query, React Hook form states, Modal thêm/sửa địa chỉ, Dialog xác nhận xóa, Thông báo động, Đổi mật khẩu Zod. |
| **3** | `apps/web/tests/m6_2_customer_profile.test.tsx` | **Tạo mới** | Bộ kiểm thử tích hợp tự động bao phủ 18 test cases (16 ca bắt buộc + 2 ca chuyên sâu). |

*3 tệp Markdown khảo sát trước triển khai (`FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`, `M6_1_FINAL_CLOSURE_VERIFICATION.md`, `M6_2_PRE_IMPLEMENTATION_VERIFICATION.md`) và tệp báo cáo này được giữ nguyên ở trạng thái untracked.*

---

## 4. TỔNG KẾT TRIỂN KHAI 4 NHÓM NGHIỆP VỤ

### 4.1. Thông tin cá nhân (Customer Profile)
- Kết nối `GET /api/v1/profile` tải thông tin thực tế của người dùng xác thực.
- Cập nhật thông tin qua `PUT /api/v1/profile` với payload hợp lệ `{ fullName, phone, avatarUrl }`.
- `email` và `role` được cố định bất biến (`disabled`), hoàn toàn không bị đưa vào payload mutation.
- Xử lý trạng thái tải (`isProfileLoading`), hiển thị lỗi validation client (`fullName` $\ge 2$, `phone` regex `^0\d{9}$`), vô hiệu hóa nút bấm chống gửi trùng lặp (`isPending`), tự động cập nhật cache TanStack Query và session `nexora_user`.

### 4.2. Sổ địa chỉ nhận hàng (Address Book — Full CRUD)
- Kết nối `GET /api/v1/profile/addresses` tải danh sách địa chỉ thực tế từ MySQL (sắp xếp ưu tiên `isDefault: desc`).
- Hiển thị huy hiệu `MẶC ĐỊNH` cho địa chỉ mặc định duy nhất.
- Nút "Thêm địa chỉ mới" mở Modal nhập đầy đủ các trường: `recipientName` (2–150 ký tự), `phone` (10 số bắt đầu bằng 0), `province` (bắt buộc), `district`, `ward`, `streetAddress` (5–255 ký tự), `isDefault` checkbox.
- Nút "Chỉnh sửa" mở Modal điền sẵn dữ liệu của địa chỉ mục tiêu, gọi `PUT /api/v1/profile/addresses/:id`.
- Nút "Đặt làm mặc định" gọi `PATCH /api/v1/profile/addresses/:id/default`, tự động đồng bộ hóa toàn bộ danh sách.
- Nút "Xóa" mở Dialog xác nhận an toàn: "Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ nhận hàng? Hành động này không thể hoàn tác.", gọi `DELETE /api/v1/profile/addresses/:id`.
- Trạng thái Empty State thân thiện hiển thị khi sổ địa chỉ rỗng, kèm nút "Thêm địa chỉ ngay".
- Định dạng chuỗi địa chỉ chuẩn: `streetAddress, ward, district, province` (loại bỏ các thành phần rỗng, không để thừa dấu phẩy).

### 4.3. Thông báo hệ thống (Notifications)
- Kết nối `GET /api/v1/profile/notifications` tải danh sách thông báo và số lượng chưa đọc thực tế (`unreadCount`).
- Phân biệt trực quan rõ nét giữa thông báo chưa đọc (màu nền xanh `#EFF6FF`, viền `#BFDBFE`) và đã đọc (màu nền trắng `#FFFFFF`, viền `#E2E8F0`).
- Nhấp chuột vào thông báo chưa đọc tự động gọi `PATCH /api/v1/profile/notifications/:id/read`, bảo toàn ID dạng chuỗi an toàn chống mất độ chính xác BigInt.
- Nút "Đánh dấu tất cả đã đọc" gọi `PATCH /api/v1/profile/notifications/read-all`, tự động cập nhật cache và đưa `unreadCount` về 0.
- Trạng thái Empty State khi không có thông báo.

### 4.4. Đổi mật khẩu tài khoản (Password Change)
- Xây dựng controlled form với 3 trường: `currentPassword`, `newPassword`, `confirmPassword`.
- Sử dụng trực tiếp `ChangePasswordInputSchema` từ `@nexora/shared` để xác thực: mật khẩu tối thiểu 8 ký tự, bao gồm cả chữ và số, xác nhận mật khẩu khớp hoàn toàn.
- Xử lý lỗi `INVALID_CURRENT_PASSWORD` (HTTP 400) từ Backend với thông báo tường minh: *"Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại."*.
- Xóa sạch 3 trường mật khẩu sau khi đổi thành công.
- Tuyệt đối không lưu trữ, không ghi nhật ký (log) và không cache mật khẩu nhạy cảm vào `localStorage` hay `sessionStorage`.

---

## 5. MA TRẬN MAPPING API ENDPOINTS & DTO

| Nhóm nghiệp vụ | Phương thức & URL | Request DTO | Response DTO | File & Dòng mã Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Profile** | `GET /profile` | *None* | `AuthUser` | `profile.routes.ts:14`, `profile.controller.ts:47` |
| **Profile** | `PUT /profile` | `UpdateProfileInput` | `AuthUser` | `profile.routes.ts:15`, `profile.controller.ts:60` |
| **Address** | `GET /profile/addresses` | *None* | `CustomerAddressDto[]` | `profile.routes.ts:26`, `profile.service.ts:138` |
| **Address** | `POST /profile/addresses` | `CreateAddressInput` | `CustomerAddressDto` | `profile.routes.ts:27`, `profile.service.ts:159` |
| **Address** | `PUT /profile/addresses/:id` | `UpdateAddressInput` | `CustomerAddressDto` | `profile.routes.ts:28`, `profile.service.ts:219` |
| **Address** | `DELETE /profile/addresses/:id` | *None* | `{ message: string }` | `profile.routes.ts:29`, `profile.service.ts:287` |
| **Address** | `PATCH /profile/addresses/:id/default` | *None* | `CustomerAddressDto` | `profile.routes.ts:32`, `profile.service.ts:327` |
| **Notifications** | `GET /profile/notifications` | *None* | `NotificationListDto` | `profile.routes.ts:40`, `profile.service.ts:372` |
| **Notifications** | `PATCH /profile/notifications/:id/read` | *None* | `{ message: string }` | `profile.routes.ts:43`, `profile.service.ts:394` |
| **Notifications** | `PATCH /profile/notifications/read-all` | *None* | `{ message: string; count: number }` | `profile.routes.ts:46`, `profile.service.ts:413` |
| **Password** | `PUT /profile/password` | `ChangePasswordInput` | `{ message: string }` | `profile.routes.ts:18`, `profile.service.ts:102` |

---

## 6. MA TRẬN ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

| Tiêu chí | Mô tả yêu cầu | Kết quả kiểm chứng | Trạng thái |
| :--- | :--- | :--- | :---: |
| **AC-PROF-01** | Profile tải từ GET endpoint thực tế | Verified qua mock API boundary & render | **PASS** |
| **AC-PROF-02** | Update profile chỉ gửi các trường hợp lệ | Payload chỉ gồm `fullName`, `phone`, `avatarUrl` | **PASS** |
| **AC-PROF-03** | Email và role bất biến, không bị sửa | Input disabled, loại trừ khỏi update payload | **PASS** |
| **AC-PROF-04** | Xử lý loading, error, success state chuẩn | Toast success, thông báo lỗi validation và API | **PASS** |
| **AC-ADDR-01** | Danh sách địa chỉ tải từ API thực tế | Render đầy đủ card và thông tin địa chỉ | **PASS** |
| **AC-ADDR-02** | Tạo địa chỉ gửi đúng DTO (province, ward, etc.) | POST `/profile/addresses` với payload 7 trường | **PASS** |
| **AC-ADDR-03** | Sửa địa chỉ gửi PUT tới đúng ID | Prefill modal, PUT `/profile/addresses/:id` | **PASS** |
| **AC-ADDR-04** | Đặt mặc định gọi đúng endpoint | PATCH `/profile/addresses/:id/default` | **PASS** |
| **AC-ADDR-05** | Xóa địa chỉ yêu cầu dialog xác nhận | Dialog xuất hiện, DELETE gọi sau khi xác nhận | **PASS** |
| **AC-ADDR-06** | Empty state và server-driven default chuẩn | Badge `MẶC ĐỊNH` chỉ hiển thị khi `isDefault=true` | **PASS** |
| **AC-NOTIF-01** | Thông báo và unreadCount tải chính xác | Đọc `unreadCount`, hiển thị số lượng chưa đọc | **PASS** |
| **AC-NOTIF-02** | Phân biệt visual đã đọc / chưa đọc | Nền `#EFF6FF` cho chưa đọc, `#FFFFFF` cho đã đọc | **PASS** |
| **AC-NOTIF-03** | Đánh dấu 1 thông báo đã đọc | PATCH `/notifications/:id/read`, giữ chuỗi BigInt | **PASS** |
| **AC-NOTIF-04** | Đánh dấu tất cả đã đọc | PATCH `/notifications/read-all`, cập nhật cache | **PASS** |
| **AC-PASS-01** | Controlled inputs và Zod validation | Xác thực $\ge 8$ ký tự, gồm cả chữ và số | **PASS** |
| **AC-PASS-02** | Từ chối mật khẩu xác nhận không khớp | Chặn trước khi gửi API, hiện lỗi inline | **PASS** |
| **AC-PASS-03** | Xử lý rõ ràng INVALID_CURRENT_PASSWORD | Bắt lỗi 400, hiển thị thông báo thân thiện | **PASS** |
| **AC-PASS-04** | Xóa sạch form mật khẩu sau khi thành công | Input reset rỗng, không lưu vào storage | **PASS** |
| **AC-QUALITY-01** | Không còn dữ liệu mock trong 4 luồng M6.2 | 100% kết nối qua `profileService` | **PASS** |
| **AC-QUALITY-02** | Không làm hồi quy M6.1 Guest Cart Merge | M6.1 tests 23/23 passing | **PASS** |
| **AC-QUALITY-03** | Không chạm vào Backend/Database bảo vệ | 0 byte diff trong `apps/api`, `prisma`, `shared` | **PASS** |
| **AC-QUALITY-04** | Không đưa vào chức năng STAFF | Ranh giới vai trò STAFF được bảo toàn tuyệt đối | **PASS** |
| **AC-QUALITY-05** | Không có console error / unhandled rejection | Test suite chạy sạch, không lỗi rò rỉ | **PASS** |
| **AC-QUALITY-06** | Layout desktop và mobile phản hồi tốt | Grid `280px 1fr`, flexbox modal co giãn chuẩn | **PASS** |
| **AC-QUALITY-07** | Pending feedback khi thực thi mutation | Nút hiển thị spinner và vô hiệu hóa click lặp | **PASS** |

---

## 7. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Tệp kiểm thử: [`apps/web/tests/m6_2_customer_profile.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_2_customer_profile.test.tsx)  
Tổng số ca kiểm thử: **18 tests passing (100%)**

```text
 ✓ apps/web/tests/m6_2_customer_profile.test.tsx (18 tests) 1114ms
   ✓ Group 1: Customer Profile (TC-PROF-01 -> 04) (4)
     ✓ TC-PROF-01: Loads profile data from API and displays user information
     ✓ TC-PROF-02: Updates permitted profile fields (fullName, phone, avatarUrl)
     ✓ TC-PROF-03: Email and role cannot be modified (disabled and excluded from payload)
     ✓ TC-PROF-04: Handles loading, client validation and API failure states
   ✓ Group 2: Address Book (TC-ADDR-01 -> 06) (6)
     ✓ TC-ADDR-01: Loads and displays address list and default badge
     ✓ TC-ADDR-02: Creates an address with valid DTO (province, district, ward, streetAddress)
     ✓ TC-ADDR-03: Rejects invalid address form values before API submission
     ✓ TC-ADDR-04: Updates an existing address (prefills data and sends PUT)
     ✓ TC-ADDR-05: Sets an address as default and synchronizes query data
     ✓ TC-ADDR-06: Confirms deletion and handles empty state correctly
   ✓ Group 3: Notifications (TC-NOTIF-01 -> 04) (4)
     ✓ TC-NOTIF-01: Loads notifications and unreadCount from API
     ✓ TC-NOTIF-02: Distinguishes read and unread notifications with correct visual styling
     ✓ TC-NOTIF-03: Marks one notification as read and preserves BigInt string ID
     ✓ TC-NOTIF-04: Marks all notifications as read
   ✓ Group 4: Password Change (TC-PASS-01 -> 04) (4)
     ✓ TC-PASS-01: Validates password length and composition (< 8 chars, letters and digits)
     ✓ TC-PASS-02: Rejects mismatched confirmation before API submission
     ✓ TC-PASS-03: Displays INVALID_CURRENT_PASSWORD clearly when current password is wrong
     ✓ TC-PASS-04: Clears sensitive password inputs after success and never stores in localStorage
```

---

## 8. KẾT QUẢ QUALITY GATES

| Quality Gate | Lệnh thực thi | Mã thoát (Exit code) | Kết quả chi tiết |
| :--- | :--- | :---: | :--- |
| **1. TypeScript Typecheck** | `npm run typecheck` | `0` | **PASS** (0 lỗi typecheck trên toàn Monorepo) |
| **2. ESLint** | `npm run lint` | `0` | **PASS** (0 warnings, 0 errors) |
| **3. Prettier Formatting** | `npx prettier --check <approved files>` | `0` | **PASS** (100% tuân thủ quy chuẩn Prettier) |
| **4. Targeted M6.2 Tests** | `npx vitest run apps/web/tests/m6_2_customer_profile.test.tsx` | `0` | **PASS** (18/18 tests passing) |
| **5. Full Frontend Suite** | `npx vitest run apps/web/tests` | `0` | **PASS** (46/46 tests passing trên 4 test files) |
| **6. Full Monorepo Suite** | `npm test` | `0` | **PASS** (257/257 tests passing trên 20 test files) |
| **7. Production Build** | `npm run build` | `0` | **PASS** (Vite build thành công dist/assets) |

---

## 9. KẾT QUẢ ĐỐI SOÁT HỒI QUY (REGRESSION RESULTS)

- **M6.1 Guest Cart Merge:** 23/23 tests (`apps/web/tests/m6_1_guest_cart_merge.test.tsx`) tiếp tục **PASS 100%**. Không có bất kỳ xung đột nào với cơ chế Immediate Retry, Passive Retry hay Cart Synchronization.
- **Backend M1–M5 (Phase B):** 211 tests backend (`apps/api/tests/**`) tiếp tục **PASS 100%**, bao gồm toàn bộ các luồng Cart Merge, Concurrency Row Locks, Customer Reviews, Returns State Machine và Security Remediation.

---

## 10. MINH CHỨNG KIỂM CHỨNG CHỨC NĂNG & GIAO DIỆN

Kiểm chứng tự động thông qua React Testing Library & JSDOM đã xác thực đầy đủ:
- **Profile Form:** Input họ tên, số điện thoại, avatar URL hiển thị đúng dữ liệu; input email và role hiển thị thuộc tính `disabled`; thông báo lỗi inline hiển thị khi dữ liệu nhập không đúng quy chuẩn; toast thông báo xuất hiện khi thành công.
- **Address Book Modal & Cards:** Huy hiệu `MẶC ĐỊNH` chỉ hiển thị trên thẻ địa chỉ mặc định; Modal Thêm/Sửa mở với các trường trống hoặc prefilled tương ứng; Dialog xác nhận xóa xuất hiện cảnh báo trước khi kích hoạt lệnh DELETE; Empty state hiển thị minh họa khi danh sách rỗng.
- **Notifications Styling:** Card chưa đọc mang màu nền `#EFF6FF` và viền `#BFDBFE`; card đã đọc mang màu nền `#FFFFFF` và viền `#E2E8F0`; sự kiện nhấp chuột kích hoạt gọi API chuyển trạng thái đã đọc; số lượng `unreadCount` đồng bộ.
- **Password Validation:** Báo lỗi trực tiếp khi mật khẩu $< 8$ ký tự, thiếu chữ/số, hoặc xác nhận không khớp; khung cảnh báo đỏ hiển thị khi sai mật khẩu hiện tại; form tự động xóa sạch giá trị sau khi cập nhật thành công.

*Lưu ý minh bạch:* Kiểm chứng được thực thi đầy đủ và khách quan qua môi trường automated DOM testing. Không tạo bằng chứng ảnh giả mạo.

---

## 11. AN NINH MẠNG VÀ TÍNH TOÀN VẸN DỮ LIỆU

1. **Phòng chống IDOR (Insecure Direct Object References):** Mọi thao tác sửa/xóa/đặt mặc định địa chỉ đều dựa trên ID của người dùng xác thực từ JWT token ở Backend. Frontend không lưu trữ hay chuyển đổi ID người dùng tùy tiện.
2. **Bảo toàn BigInt Identifier:** ID thông báo được quản lý dưới dạng chuỗi (`string`) xuyên suốt từ API đến state React, loại trừ nguy cơ mất độ chính xác khi ép kiểu số nguyên lớn trong JavaScript.
3. **Bảo mật Thông tin Xác thực (Zero Secrets Leakage):** Không lưu trữ mật khẩu cũ hay mật khẩu mới vào `localStorage`, `sessionStorage`, TanStack Query cache hay `console.log`. Form được xóa sạch ngay sau khi hoàn tất.
4. **Bảo vệ Trạng thái Bất biến:** Email và quyền hạn (`role`) không thể bị sửa đổi từ phía client.

---

## 12. XÁC MINH TOÀN VẸN CÁC THƯ MỤC BẢO VỆ

Lệnh kiểm tra:
`git diff -- apps/api prisma packages/shared TechPilot audit-output`
**Kết quả: RỖNG (0 byte thay đổi, 0 dòng mã bị can thiệp)**

Toàn bộ Backend, Database, Shared DTOs và tài liệu TechPilot hoàn toàn nguyên vẹn 100%.

---

## 13. THÔNG TIN COMMIT NỘI BỘ M6.2

- **Commit Hash:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1`
- **Parent Commit:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646`
- **Branch:** `main`
- **Commit Message:** `feat(web): tich hop tai khoan khach hang m6.2`
- **Chi tiết các tệp trong commit:**
  ```text
  apps/web/src/features/profile/ProfilePage.tsx | 1907 +++++++++++++++++++++----
  apps/web/src/services/profileService.ts       |  129 ++
  apps/web/tests/m6_2_customer_profile.test.tsx |  783 ++++++++++
  3 files changed, 2506 insertions(+), 313 deletions(-)
  create mode 100644 apps/web/src/services/profileService.ts
  create mode 100644 apps/web/tests/m6_2_customer_profile.test.tsx
  ```

---

## 14. CAM KẾT VÀ XÁC NHẬN PUSH

> [!IMPORTANT]
> **Xác nhận tuyệt đối:** Commit `b5ba48b` được lưu trữ hoàn toàn tại kho lưu trữ nội bộ (Local Git). **TUYỆT ĐỐI CHƯA PUSH LÊN REMOTE REPOSITORY**.

---

## 15. CÁC HẠN CHẾ & RANH GIỚI BẢO LƯU

1. **Customer Reviews (M6.3):** Giữ nguyên theo kế hoạch cho Milestone M6.3.
2. **Customer Returns (M6.4):** Giữ nguyên theo kế hoạch cho Milestone M6.4.
3. **STAFF Workflow:** Tuyệt đối không phát sinh giao diện hay quyền hạn nào cho nhân viên (STAFF), tuân thủ đúng văn bản `FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`.

---

## 16. KẾT LUẬN & KIẾN NGHỊ CUỐI CÙNG

Milestone M6.2 (Customer Account / Profile) đã đáp ứng xuất sắc 100% các tiêu chí kỹ thuật, nghiệp vụ và bảo mật được phê duyệt trong Lệnh triển khai.

**Kiến nghị:**
**CHÍNH THỨC CẤP CHỨNG NHẬN FINAL PASS VÀ ĐÓNG MILESTONE M6.2.**

Tôi xin dừng mọi hành động tại đây để Chủ dự án xem xét và đánh giá báo cáo nghiệm thu.
