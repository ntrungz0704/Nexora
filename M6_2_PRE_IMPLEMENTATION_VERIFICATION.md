# BÁO CÁO KHẢO SÁT & ĐỐI SOÁT TRƯỚC TRIỂN KHAI M6.2
## (M6.2 — PRE-IMPLEMENTATION VERIFICATION REPORT — UPDATED)

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Branch:** `main`
- **Milestone:** M6.2 — Customer Account / Profile
- **Chế độ:** **READ-ONLY AUDIT — NO IMPLEMENTATION**
- **Ngày cập nhật:** 2026-11-22
- **Cơ sở điều chỉnh:** Quyết định chính thức của Chủ dự án về **Chính sách Linh hoạt UI/UX (UI Flexibility)** và **Triển khai Đầy đủ CRUD Sổ địa chỉ (Full Frontend CRUD)**.

---

## 1. EXECUTIVE SUMMARY & CÁC QUYẾT ĐỊNH MỚI CỦA CHỦ DỰ ÁN

Trong đợt rà soát trước triển khai M6.2, Chủ dự án đã ban hành 2 quyết định quản trị chiến lược:

1. **Điều chỉnh Chính sách Giao diện (Targeted UI/UX Flexibility):**
   - Thay thế nguyên tắc Absolute UI Freeze khắt khe trước đây bằng chính sách linh hoạt có định hướng cho Milestone M6.2.
   - **Được phép:** Bổ sung markup JSX/HTML, điều chỉnh component layout, thêm nút bấm (Button), biểu mẫu (Form), hộp thoại xác nhận (Confirmation Dialog) và cửa sổ bật lên (Modal) cần thiết cho các thao tác người dùng.
   - **Nguyên tắc ràng buộc:** Phải giữ vững nhận diện thương hiệu Nexora, hệ thống thiết kế (Design System) hiện hành và đối chiếu với TechPilot để bảo toàn hành vi nghiệp vụ (Business Behavior & Parity). Tuyệt đối không redesign toàn bộ trang web.
2. **Cho phép Toàn quyền CRUD Sổ địa chỉ (Full Address Book CRUD):**
   - Bãi bỏ giới hạn chỉ đọc (Read-only).
   - Cho phép xây dựng đầy đủ chức năng: Xem danh sách thực, Thêm địa chỉ mới (kèm modal), Chỉnh sửa địa chỉ, Xóa địa chỉ (có xác nhận), Đặt địa chỉ mặc định, và hiển thị Empty State.
3. **Phân định Ranh giới Kiến trúc STAFF (Future Scope Only):**
   - Khẳng định 100% không triển khai bất kỳ luồng nghiệp vụ hay giao diện nào dành riêng cho `STAFF` tại M6.2.
   - Đã ban hành tài liệu ranh giới kiến trúc độc lập: [FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md](file:///d:/Nexora/FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md).

---

## 2. REPOSITORY & GIT STATE

- **Current HEAD SHA:** `4c6c261cd6b8c0e72286449df052da4fd2ca9646` (Commit M6.1 Targeted Fix)
- **Parent Commit:** `9880019dca649483ddcba8fce8736642006ba2c8`
- **Commit M6.1 Message:** `fix(web): hoan thien dto validation va passive retry lifecycle m6.1`
- **Working Tree:** Sạch sẽ, không có tệp mã nguồn nào bị thay đổi.
- **Remote Push Status:** Chưa push lên remote (chỉ lưu local trên branch `main`).
- **Bảo toàn phân vùng:**
  - `apps/api/**`: 0 tệp thay đổi.
  - `prisma/**`: 0 tệp thay đổi.
  - `packages/shared/**`: 0 tệp thay đổi.
  - `TechPilot/**` (tại `D:\02_Dự Án Phần Mềm\TechPilot (Bản Chính Thức)`): 100% READ-ONLY.
  - `audit-output/**`: 0 tệp thay đổi.

---

## 3. BACKEND ENDPOINT VERIFICATION (CHI TIẾT 10 ENDPOINTS)

Tất cả các endpoint dưới đây đều được khảo sát trực tiếp từ mã nguồn thực tế tại [profile.routes.ts](file:///d:/Nexora/apps/api/src/modules/profile/profile.routes.ts), [profile.controller.ts](file:///d:/Nexora/apps/api/src/modules/profile/profile.controller.ts), [profile.service.ts](file:///d:/Nexora/apps/api/src/modules/profile/profile.service.ts) và bộ test `apps/api/tests/phase_b_profile_addresses.test.ts`.

### 3.1. Nhóm 1: Customer Profile

#### Endpoint 1.1: Lấy thông tin cá nhân
- **Method & URL:** `GET /api/v1/profile`
- **Auth & Middleware:** `requireAuth()` (Bắt buộc JWT Bearer token).
- **Controller & Service:** `profileController.getProfile` $\rightarrow$ `profileService.getProfile(userId)`.
- **Request:** Không body, không query. `userId` được trích xuất an toàn từ `req.user?.sub`.
- **Response DTO:** `ApiSuccessEnvelope<AuthUser>`
  ```json
  {
    "success": true,
    "data": {
      "id": 101,
      "email": "customer@nexora.local",
      "fullName": "Nguyễn Văn An",
      "phone": "0901234567",
      "avatarUrl": null,
      "role": "CUSTOMER"
    }
  }
  ```
- **Business Rules:** Kiểm tra `status === 'ACTIVE'`. Nếu user không tồn tại hoặc bị khóa $\rightarrow$ ném lỗi 404 `USER_NOT_FOUND`.
- **Test Evidence:** Test `PROF-B1` và `AUTH-1` trong `phase_b_profile_addresses.test.ts` (PASS).
- **Trạng thái:** **VERIFIED**.

#### Endpoint 1.2: Cập nhật thông tin cá nhân
- **Method & URL:** `PUT /api/v1/profile`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.updateProfile` $\rightarrow$ `profileService.updateProfile(userId, body)`.
- **Request DTO:** `UpdateProfileInputSchema`
  ```typescript
  {
    fullName: string;      // min 2, max 150 ký tự
    phone?: string;         // regex /^0\d{9}$/ hoặc rỗng
    avatarUrl?: string;     // url hợp lệ hoặc rỗng
  }
  ```
- **Response DTO:** `ApiSuccessEnvelope<AuthUser>` (Dữ liệu người dùng sau khi cập nhật).
- **Business Rules:**
  - `email` và `role` là bất biến, không được phép sửa qua endpoint này.
  - `fullName` bắt buộc tối thiểu 2 ký tự.
  - `phone` nếu cung cấp phải đúng 10 số bắt đầu bằng `0`.
- **Error Codes:** 400 `VALIDATION_ERROR` (kèm danh sách chi tiết field), 401 `UNAUTHORIZED`, 404 `USER_NOT_FOUND`.
- **Test Evidence:** Test `PROF-B2` (thành công), `PROF-B3` (lỗi định dạng phone), `PROF-B4` (lỗi url avatar), `AUTH-2`.
- **Trạng thái:** **VERIFIED**.

---

### 3.2. Nhóm 2: Address Book (Sổ địa chỉ nhận hàng)

#### Endpoint 2.1: Danh sách địa chỉ
- **Method & URL:** `GET /api/v1/profile/addresses`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.getAddresses` $\rightarrow$ `profileService.getAddresses(userId)`.
- **Request:** Không body. Lọc nghiêm ngặt `where: { userId }`.
- **Response DTO:** `ApiSuccessEnvelope<CustomerAddressDto[]>`
  - Sắp xếp: `isDefault: desc`, `createdAt: desc` (địa chỉ mặc định luôn ở đầu danh sách).
- **Test Evidence:** Test `ADDR-B1`, `ADDR-B2`, `AUTH-3`.
- **Trạng thái:** **VERIFIED**.

#### Endpoint 2.2: Tạo địa chỉ mới
- **Method & URL:** `POST /api/v1/profile/addresses`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.createAddress` $\rightarrow$ `profileService.createAddress(userId, body)`.
- **Request DTO:** `CreateAddressInputSchema`
  ```typescript
  {
    recipientName: string;   // min 2, max 150
    phone: string;           // regex /^0\d{9}$/ (10 số bắt đầu bằng 0)
    streetAddress: string;   // min 5, max 255
    ward?: string;           // max 100
    district?: string;       // max 100
    province: string;        // min 2, max 100
    isDefault?: boolean;     // mặc định false
  }
  ```
- **Response DTO:** `201 CREATED` kèm `ApiSuccessEnvelope<CustomerAddressDto>`.
- **Business Rules & InnoDB Lock:**
  - Khóa hàng người dùng bằng `SELECT id FROM users WHERE id = ${userId} FOR UPDATE` trong transaction.
  - **Tự động đặt làm mặc định:** Nếu đây là địa chỉ đầu tiên của người dùng (`existingCount === 0`) $\rightarrow$ tự động gán `isDefault = true`.
  - **Chuyển đổi mặc định duy nhất:** Nếu người dùng tick chọn `isDefault = true` $\rightarrow$ tự động chuyển tất cả địa chỉ còn lại của người dùng thành `isDefault = false`. Đảm bảo invariant: **luôn có duy nhất 1 địa chỉ mặc định**.
- **Test Evidence:** Test `ADDR-B1` (tự động mặc định), `ADDR-B2` (chuyển đổi mặc định), `ADDR-B3` (lỗi validation), `ADDR-B9` (concurrency serialized).
- **Trạng thái:** **VERIFIED**.

#### Endpoint 2.3: Cập nhật địa chỉ
- **Method & URL:** `PUT /api/v1/profile/addresses/:id`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.updateAddress` $\rightarrow$ `profileService.updateAddress(userId, addressId, body)`.
- **Request DTO:** `UpdateAddressInputSchema` (`CreateAddressInputSchema.partial()`).
- **Response DTO:** `ApiSuccessEnvelope<CustomerAddressDto>`.
- **Business Rules:**
  - **Anti-IDOR:** Kiểm tra `address.userId !== userId` $\rightarrow$ lập tức ném lỗi 403 `FORBIDDEN` (không cho phép sửa địa chỉ của người khác).
  - Khóa transaction InnoDB `FOR UPDATE`. Nếu cập nhật `isDefault: true`, tự động hạ cờ các địa chỉ khác về `false`.
- **Test Evidence:** Test `ADDR-B4` (cập nhật thành công), `ADDR-B6` (anti-IDOR 403).
- **Trạng thái:** **VERIFIED**.

#### Endpoint 2.4: Xóa địa chỉ
- **Method & URL:** `DELETE /api/v1/profile/addresses/:id`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.deleteAddress` $\rightarrow$ `profileService.deleteAddress(userId, addressId)`.
- **Response DTO:** `ApiSuccessEnvelope<{ message: string }>`.
- **Business Rules:**
  - **Anti-IDOR:** `address.userId !== userId` $\rightarrow$ 403 `FORBIDDEN`.
  - **Auto-Promotion Default:** Nếu địa chỉ bị xóa đang là địa chỉ mặc định (`address.isDefault === true`), hệ thống tự động tìm địa chỉ mới nhất còn lại và thăng hạng thành `isDefault = true`!
- **Test Evidence:** Test `ADDR-B7` (anti-IDOR 403), `ADDR-B8` (xóa và tự động thăng hạng địa chỉ còn lại thành mặc định).
- **Trạng thái:** **VERIFIED**.

#### Endpoint 2.5: Đặt làm địa chỉ mặc định
- **Method & URL:** `PATCH /api/v1/profile/addresses/:id/default` (Backend hỗ trợ thêm alias `POST /api/v1/profile/set-default-address/:id`).
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.setDefaultAddress` $\rightarrow$ `profileService.setDefaultAddress(userId, addressId)`.
- **Response DTO:** `ApiSuccessEnvelope<CustomerAddressDto>`.
- **Business Rules:**
  - Anti-IDOR 403 nếu địa chỉ không thuộc về user.
  - Hạ tất cả địa chỉ khác về `isDefault: false`, gán địa chỉ này `isDefault: true`.
- **Test Evidence:** Test `ADDR-B5`.
- **Trạng thái:** **VERIFIED**.

---

### 3.3. Nhóm 3: Notifications (Thông báo hệ thống)

#### Endpoint 3.1: Lấy danh sách thông báo & số lượng chưa đọc
- **Method & URL:** `GET /api/v1/profile/notifications`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.getNotifications` $\rightarrow$ `profileService.getNotifications(userId)`.
- **Response DTO:** `ApiSuccessEnvelope<NotificationListDto>`
  ```typescript
  {
    notifications: Array<{
      id: string;        // BigInt stringified
      userId: number;
      title: string;
      message: string;
      type: string;      // 'ORDER', 'PROMO', 'SYSTEM'
      linkUrl: string | null;
      isRead: boolean;
      createdAt: string; // ISO 8601
    }>;
    unreadCount: number; // Số lượng thông báo có isRead = false
  }
  ```
- **Test Evidence:** Test `NOTIF-B1` (lấy đúng thông báo của mình kèm unreadCount), `AUTH-4`.
- **Trạng thái:** **VERIFIED**.

#### Endpoint 3.2: Đánh dấu một thông báo là đã đọc
- **Method & URL:** `PATCH /api/v1/profile/notifications/:id/read`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.markNotificationAsRead` $\rightarrow$ `profileService.markNotificationAsRead(userId, notifId)`.
- **Response DTO:** `ApiSuccessEnvelope<NotificationDto>` (trả về notification đã được cập nhật `isRead: true`).
- **Business Rules:**
  - Chuyển đổi và xác thực an toàn ID dạng `BigInt`.
  - Anti-IDOR: `notif.userId !== userId` $\rightarrow$ 403 `FORBIDDEN`.
- **Test Evidence:** Test `NOTIF-B2`, `NOTIF-B3` (anti-IDOR).
- **Trạng thái:** **VERIFIED**.

#### Endpoint 3.3: Đánh dấu tất cả thông báo là đã đọc
- **Method & URL:** `PATCH /api/v1/profile/notifications/read-all`
- **Auth & Middleware:** `requireAuth()`.
- **Controller & Service:** `profileController.markAllNotificationsAsRead` $\rightarrow$ `profileService.markAllNotificationsAsRead(userId)`.
- **Response DTO:** `ApiSuccessEnvelope<{ message: string; count: number }>`.
- **Test Evidence:** Test `NOTIF-B4` (chuyển tất cả thông báo chưa đọc của user thành đã đọc).
- **Trạng thái:** **VERIFIED**.

---

### 3.4. Nhóm 4: Password Change (Đổi mật khẩu)

#### Endpoint 4.1: Đổi mật khẩu tài khoản
- **Method & URL:** `PUT /api/v1/profile/password` (Backend hỗ trợ thêm alias `POST /api/v1/profile/change-password`).
- **Auth & Middleware:** `requireAuth()`, `rateLimiters.passwordResetConfirm` (ngăn chặn brute-force mật khẩu cũ).
- **Controller & Service:** `profileController.changePassword` $\rightarrow$ `profileService.changePassword(userId, body)`.
- **Request DTO:** `ChangePasswordInputSchema`
  ```typescript
  {
    currentPassword: string;  // min 6 ký tự
    newPassword: string;      // min 8 ký tự, bao gồm cả chữ và số (regex /^(?=.*[A-Za-z])(?=.*\d)/)
    confirmPassword: string;  // min 8 ký tự, phải khớp chính xác với newPassword
  }
  ```
- **Response DTO:** `ApiSuccessEnvelope<{ message: 'Đổi mật khẩu thành công.' }>`.
- **Business Rules:**
  - Kiểm tra `user.passwordHash` tồn tại.
  - So khớp `currentPassword` với mật khẩu băm trong DB bằng `bcrypt.compare`. Nếu sai $\rightarrow$ 400 `INVALID_CURRENT_PASSWORD`.
  - Băm mật khẩu mới bằng `bcrypt.hash(newPassword, 10)` và lưu vào MySQL.
- **Test Evidence:** Test `PASS-B1` (sai pass cũ), `PASS-B2` (pass xác nhận không khớp), `PASS-B3` (pass mới thiếu chữ hoặc số), `PASS-B4` (thành công, verify đăng nhập lại bằng mật khẩu mới), `AUTH-5`.
- **Trạng thái:** **VERIFIED**.

---

## 4. DTO & VALIDATION VERIFICATION

Tất cả các Schemas đã được định nghĩa tại `packages/shared/src/index.ts` và export qua package `@nexora/shared`:

| Tên Schema | Export Type | Phạm vi áp dụng | Các ràng buộc cốt lõi |
| :--- | :--- | :--- | :--- |
| `UpdateProfileInputSchema` | `UpdateProfileInput` | `PUT /profile` | `fullName`: 2–150 ký tự; `phone`: đúng 10 số `^0\d{9}$` hoặc rỗng; `avatarUrl`: định dạng URL hoặc rỗng. |
| `CreateAddressInputSchema` | `CreateAddressInput` | `POST /profile/addresses` | `recipientName`: 2–150; `phone`: `^0\d{9}$`; `streetAddress`: 5–255; `province`: 2–100; `isDefault`: boolean. |
| `UpdateAddressInputSchema` | `UpdateAddressInput` | `PUT /profile/addresses/:id` | `CreateAddressInputSchema.partial()` (tất cả các trường đều là optional khi cập nhật). |
| `CustomerAddressDtoSchema` | `CustomerAddressDto` | Address responses | `id` (number), `userId`, `recipientName`, `phone`, `streetAddress`, `province`, `isDefault` (boolean), timestamps. |
| `NotificationDtoSchema` | `NotificationDto` | Notification item | `id` (stringified BigInt), `userId`, `title`, `message`, `type`, `linkUrl`, `isRead` (boolean), `createdAt`. |
| `NotificationListDtoSchema` | `NotificationListDto` | `GET /profile/notifications` | `notifications` (array), `unreadCount` (số nguyên $\ge 0$). |
| `ChangePasswordInputSchema` | `ChangePasswordInput` | `PUT /profile/password` | `currentPassword`: $\ge 6$; `newPassword`: $\ge 8$ (chữ + số); `confirmPassword`: $\ge 8$; refine: khớp 100%. |

---

## 5. FRONTEND MOCK & STUB INVENTORY (KIỂM KÊ TẠI `ProfilePage.tsx`)

Kiểm tra trực tiếp tệp mã nguồn [ProfilePage.tsx](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx):

```
File: apps/web/src/features/profile/ProfilePage.tsx
Total Lines: 989 lines
```

### 5.1. Tab Profile (Dòng 40–90 & 340–430)
- **Dòng 40–41:** `useState(currentUser?.fullName || 'Nguyễn Văn An')`, `useState('0901234567')` $\rightarrow$ **MOCK**: Phone bị fix cứng, chưa dùng query đọc từ DB.
- **Dòng 83–90:** `handleUpdateProfile` chỉ kiểm tra họ tên rỗng và gọi `showToast('Đã cập nhật...')` $\rightarrow$ **STUB**: Chưa gọi `PUT /api/v1/profile`.

### 5.2. Tab Address Book (Dòng 533–585)
- **Dòng 548–584:** Một thẻ card tĩnh hiển thị cứng `Nguyễn Văn An - 0901234567`, `Số 123 Đường Nguyễn Huệ...` $\rightarrow$ **100% HARDCODED HTML**: Thiếu query đọc địa chỉ thật, thiếu nút thêm địa chỉ, thiếu modal và thiếu nút đặt mặc định/xóa.

### 5.3. Tab Notifications (Dòng 602–696)
- **Dòng 604:** Hardcode `3 thông báo`.
- **Dòng 608–633:** Mảng tĩnh 3 phần tử $\rightarrow$ **100% HARDCODED ARRAY**: Chưa gọi `GET /api/v1/profile/notifications`, chưa có click handler gọi `PATCH /notifications/:id/read` và `read-all`.

### 5.4. Tab Password Change (Dòng 858–981)
- **Dòng 873–876 & 896–960:** 3 input password chưa bind state (`uncontrolled`), form submit chỉ gọi `showToast('Đã đổi mật khẩu...')` $\rightarrow$ **STUB**: Chưa gọi `PUT /api/v1/profile/password`, không có client validation.

---

## 6. TECHPILOT BUSINESS PARITY

Khảo sát đối chiếu trực tiếp với mã nguồn tham chiếu TechPilot tại `D:\02_Dự Án Phần Mềm\TechPilot (Bản Chính Thức)`:

| Tính năng | TechPilot Reference Implementation | Nexora Target (M6.2 Đã Phê Duyệt) | Đánh giá Parity |
| :--- | :--- | :--- | :--- |
| **Profile Form** | `ProfileController::index()` submit tới `POST /profile`, cập nhật `full_name` và `phone` với định dạng `+84` hoặc `0...`. | Form kết nối `GET /api/v1/profile` và `PUT /api/v1/profile`, đồng bộ state và cache. | **ĐỒNG NHẤT** |
| **Address List** | `ProfileController::addresses()`, hiển thị danh sách từ DB kèm badge `Mặc định`. | Render danh sách địa chỉ thực tế từ `GET /api/v1/profile/addresses`, sắp xếp mặc định lên đầu. | **ĐỒNG NHẤT** |
| **Add/Edit Address** | `showAddModal()`, form modal gửi `POST /profile/add-address`, `edit_address()`. | Modal Thêm/Sửa địa chỉ đầy đủ các trường (Tên, SĐT, Tỉnh/TP, Quận/Huyện, Phường/Xã, Địa chỉ cụ thể, Mặc định). | **ĐỒNG NHẤT (Đã duyệt)** |
| **Set Default Address** | Nút bấm gửi `POST /profile/set-default-address`. | Nút "Đặt mặc định" gọi `PATCH /api/v1/profile/addresses/:id/default`. | **ĐỒNG NHẤT** |
| **Delete Address** | Nút bấm gửi `POST /profile/delete-address` kèm popup confirm. | Nút "Xóa" kèm dialog xác nhận gọi `DELETE /api/v1/profile/addresses/:id`. | **ĐỒNG NHẤT** |
| **Notification List** | `ProfileController::notifications()`, render danh sách từ DB, phân biệt nền màu xanh `#EFF6FF` cho tin chưa đọc. | Render từ `GET /api/v1/profile/notifications`, hiển thị đúng `unreadCount`, phân biệt màu tin chưa đọc. | **ĐỒNG NHẤT** |
| **Mark As Read** | TechPilot cập nhật khi user click xem hoặc có endpoint `apiUnreadNotifications()`. | Click vào thông báo gọi `PATCH /notifications/:id/read`; nút "Đánh dấu tất cả đã đọc" gọi `PATCH /notifications/read-all`. | **ĐỒNG NHẤT** |
| **Password Change** | `ProfileController::change_password()`, so khớp `old_password` với DB, băm password mới. | Controlled form kết nối `PUT /api/v1/profile/password`, validation Zod client-side và bắt lỗi từ server. | **ĐỒNG NHẤT** |

---

## 7. API MAPPING MATRIX (ĐÃ CẬP NHẬT FULL SCOPE)

Bảng ánh xạ hoàn chỉnh 100% các hành vi UI sang Backend API:

| STT | UI Interaction / Action | Existing Code | Target Backend API | Request / Response DTO | Business Rules | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **1** | Mở Tab Profile / Mount trang | `useState(currentUser)` (L40) | `GET /api/v1/profile` | Response: `AuthUser` | Đọc profile thực từ DB, đồng bộ `fullName`, `phone`, `email`. | **VERIFIED & READY** |
| **2** | Nhấn nút "Lưu Thay Đổi" (Profile) | `handleUpdateProfile` fake toast (L83) | `PUT /api/v1/profile` | Request: `UpdateProfileInput`<br>Response: `AuthUser` | `fullName` $\ge 2$, `phone` đúng 10 số. Cập nhật `localStorage` và query cache. | **VERIFIED & READY** |
| **3** | Mở Tab Sổ Địa Chỉ / Mount trang | Thẻ tĩnh `Nguyễn Văn An...` (L548) | `GET /api/v1/profile/addresses` | Response: `CustomerAddressDto[]` | Lấy danh sách địa chỉ thực, sắp xếp địa chỉ mặc định lên đầu. | **VERIFIED & READY** |
| **4** | Nhấn "Thêm địa chỉ mới" $\rightarrow$ Mở Modal $\rightarrow$ Submit | Bổ sung nút & Modal theo TechPilot | `POST /api/v1/profile/addresses` | Request: `CreateAddressInput`<br>Response: `CustomerAddressDto` | Địa chỉ đầu tiên tự thành mặc định; nếu tick `isDefault`, hạ các địa chỉ khác về false. | **VERIFIED & READY** |
| **5** | Nhấn "Chỉnh sửa" trên thẻ địa chỉ $\rightarrow$ Submit | Bổ sung nút & Modal theo TechPilot | `PUT /api/v1/profile/addresses/:id` | Request: `UpdateAddressInput`<br>Response: `CustomerAddressDto` | Anti-IDOR 403; cập nhật thông tin và trạng thái mặc định. | **VERIFIED & READY** |
| **6** | Nhấn "Xóa" trên thẻ địa chỉ $\rightarrow$ Xác nhận | Bổ sung nút & Confirm Dialog | `DELETE /api/v1/profile/addresses/:id` | Response: `{ message: string }` | Anti-IDOR 403; nếu xóa địa chỉ mặc định, tự động thăng hạng địa chỉ còn lại. | **VERIFIED & READY** |
| **7** | Nhấn "Đặt làm mặc định" trên thẻ địa chỉ | Bổ sung nút trên thẻ phụ | `PATCH /api/v1/profile/addresses/:id/default` | Response: `CustomerAddressDto` | Anti-IDOR 403; chuyển địa chỉ này thành mặc định duy nhất. | **VERIFIED & READY** |
| **8** | Mở Tab Thông Báo / Mount trang | Mảng tĩnh 3 mục (L608) | `GET /api/v1/profile/notifications` | Response: `NotificationListDto` | Hiển thị thông báo thực từ DB kèm số lượng `unreadCount`. | **VERIFIED & READY** |
| **9** | Click vào một thông báo chưa đọc | Bổ sung onClick handler | `PATCH /api/v1/profile/notifications/:id/read` | Response: `NotificationDto` | Anti-IDOR 403; chuyển `isRead = true`, giảm `unreadCount` đi 1. | **VERIFIED & READY** |
| **10** | Nhấn "Đánh dấu tất cả đã đọc" | Bổ sung nút hành động nhỏ tại subheader | `PATCH /api/v1/profile/notifications/read-all` | Response: `{ message: string, count: number }` | Chuyển toàn bộ thông báo của user thành đã đọc, đưa `unreadCount` về 0. | **VERIFIED & READY** |
| **11** | Nhập form Đổi Mật Khẩu | Input chưa bind state (L896) | Client-side Zod validation | `ChangePasswordInputSchema` | Kiểm tra mật khẩu cũ $\ge 6$, mật khẩu mới $\ge 8$ (chữ + số), mật khẩu xác nhận khớp. | **VERIFIED & READY** |
| **12** | Nhấn "Cập Nhật Mật Khẩu" | Fake toast submit (L873) | `PUT /api/v1/profile/password` | Request: `ChangePasswordInput`<br>Response: `{ message: string }` | Rate limit chống brute-force; báo lỗi 400 nếu mật khẩu hiện tại không đúng. | **VERIFIED & READY** |

---

## 8. VALIDATION & STATE MANAGEMENT PLAN

### 8.1. Client-Side Validation Rules
- **Profile:** Sử dụng `UpdateProfileInputSchema` (từ `@nexora/shared`). Báo lỗi inline hoặc toast nếu `fullName` $< 2$ ký tự hoặc `phone` không khớp `^0\d{9}$`.
- **Address Book (Create / Update Modal):** Sử dụng `CreateAddressInputSchema` (từ `@nexora/shared`):
  - `recipientName`: Bắt buộc, 2–150 ký tự.
  - `phone`: Bắt buộc, đúng 10 số `^0\d{9}$`.
  - `streetAddress`: Bắt buộc, tối thiểu 5 ký tự.
  - `province`: Bắt buộc, tối thiểu 2 ký tự.
- **Password Change:** Sử dụng `ChangePasswordInputSchema` (từ `@nexora/shared`):
  - `currentPassword`: Bắt buộc, $\ge 6$ ký tự.
  - `newPassword`: Bắt buộc, $\ge 8$ ký tự, chứa cả chữ cái và số.
  - `confirmPassword`: Bắt buộc, phải khớp chính xác với `newPassword`.
  - Bắt lỗi HTTP 400 `INVALID_CURRENT_PASSWORD` từ API và hiển thị thông báo lỗi rõ ràng.

### 8.2. TanStack Query Keys & Synchronization Convention
- `['profile', currentUser?.id]`: Dữ liệu hồ sơ người dùng (`GET /api/v1/profile`).
- `['customer-addresses', currentUser?.id]`: Danh sách sổ địa chỉ khách hàng (`GET /api/v1/profile/addresses`).
- `['notifications', currentUser?.id]`: Danh sách thông báo và số lượng chưa đọc (`GET /api/v1/profile/notifications`).

### 8.3. Invalidation Strategy
- **Lưu Profile thành công:** Invalidate `['profile']`, cập nhật `localStorage.setItem('nexora_user', ...)`, cập nhật state `currentUser`.
- **Thêm/Sửa/Xóa/Đặt mặc định Địa chỉ thành công:** Invalidate `['customer-addresses']`, đóng modal, reset form.
- **Đọc thông báo thành công:** Invalidate `['notifications']`.
- **Đổi mật khẩu thành công:** Reset form, xóa trắng các trường password, hiện toast thông báo.

### 8.4. UI/UX States (Loading, Error, Empty, Submitting)
- **Loading State:** Hiển thị indicator nhẹ nhàng khi tải dữ liệu.
- **Error State:** Hiển thị banner lỗi hoặc toast thông báo khi API thất bại hoặc mất mạng.
- **Empty State:**
  - Sổ địa chỉ: Hiển thị thông báo "Bạn chưa lưu địa chỉ nhận hàng nào" kèm nút "Thêm địa chỉ ngay".
  - Thông báo: Hiển thị icon chuông và thông báo "Bạn không có thông báo nào" (chuẩn TechPilot).
- **Submitting State:** Vô hiệu hóa nút (`disabled={isSubmitting}`) và hiển thị trạng thái "Đang lưu..." để chống duplicate click.

---

## 9. TEST PLAN & ACCEPTANCE CRITERIA (16 TEST CASES)

Bộ test tự động `apps/web/tests/m6_2_customer_profile.test.tsx` sẽ bao phủ toàn bộ 16 ca kiểm thử:

| Test Case ID | Mục tiêu kiểm thử | Tiền điều kiện | Hành động / Input | Kết quả kỳ vọng (Assertion) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PROF-01** | Load Profile thành công | Đã đăng nhập (có JWT token) | Render Tab Profile | Hiển thị đúng `fullName`, `phone`, `email` lấy từ API `GET /profile`. |
| **TC-PROF-02** | Update Profile thành công | Đã đăng nhập | Nhập họ tên & SĐT mới $\rightarrow$ bấm Lưu | Gọi `PUT /profile`, cập nhật cache `['profile']`, hiện toast thành công. |
| **TC-PROF-03** | Update Profile lỗi SĐT sai định dạng | Đã đăng nhập | Nhập SĐT `12345` (không đủ 10 số) | Chặn submit hoặc hiển thị lỗi validation, không gọi API sai. |
| **TC-PROF-04** | Email là trường Read-Only | Đã đăng nhập | Kiểm tra trường email | Input có thuộc tính `disabled`, không thể sửa đổi. |
| **TC-ADDR-01** | Load danh sách địa chỉ thực | Có 2 địa chỉ trong DB | Render Tab Sổ địa chỉ | Hiển thị 2 thẻ địa chỉ, địa chỉ có `isDefault: true` mang badge "MẶC ĐỊNH". |
| **TC-ADDR-02** | Empty State sổ địa chỉ | 0 địa chỉ trong DB | Render Tab Sổ địa chỉ | Hiển thị thông báo rỗng thân thiện, có nút mở modal thêm địa chỉ. |
| **TC-ADDR-03** | Mở Modal Thêm địa chỉ mới & Submit thành công | Đang ở tab Sổ địa chỉ | Nhập đủ tên, SĐT, địa chỉ, tỉnh/thành $\rightarrow$ Submit | Gọi `POST /profile/addresses`, đóng modal, invalidate query `['customer-addresses']`. |
| **TC-ADDR-04** | Mở Modal Sửa địa chỉ & Submit thành công | Có địa chỉ tồn tại | Click "Chỉnh sửa" $\rightarrow$ sửa tên $\rightarrow$ Submit | Gọi `PUT /profile/addresses/:id`, đóng modal, invalidate query `['customer-addresses']`. |
| **TC-ADDR-05** | Set Default Address thành công | Có ít nhất 2 địa chỉ | Click "Đặt mặc định" tại địa chỉ thứ 2 | Gọi `PATCH /addresses/:id/default`, invalidate query `['customer-addresses']`. |
| **TC-ADDR-06** | Xóa địa chỉ nhận hàng có xác nhận | Có 2 địa chỉ | Click "Xóa" $\rightarrow$ Confirm xác nhận | Gọi `DELETE /addresses/:id`, invalidate query `['customer-addresses']`. |
| **TC-NOTIF-01** | Load danh sách thông báo thực | Có 2 thông báo (1 chưa đọc) | Render Tab Thông báo | Hiển thị 2 thẻ thông báo, badge hiển thị "1 chưa đọc". |
| **TC-NOTIF-02** | Đánh dấu 1 thông báo đã đọc | Có thông báo chưa đọc | Click vào thẻ thông báo chưa đọc | Gọi `PATCH /notifications/:id/read`, chuyển màu nền từ xanh sang trắng. |
| **TC-NOTIF-03** | Đánh dấu tất cả thông báo đã đọc | Có 3 thông báo chưa đọc | Click "Đánh dấu tất cả đã đọc" | Gọi `PATCH /notifications/read-all`, chuyển toàn bộ sang đã đọc. |
| **TC-NOTIF-04** | Empty State thông báo | 0 thông báo trong DB | Render Tab Thông báo | Hiển thị icon chuông và thông báo "Bạn không có thông báo nào". |
| **TC-PASS-01** | Đổi mật khẩu thành công | Nhập đúng pass cũ, pass mới khớp | Submit form đổi mật khẩu | Gọi `PUT /profile/password`, xóa trắng các ô input, hiện toast thành công. |
| **TC-PASS-02** | Lỗi xác nhận mật khẩu không khớp | Pass mới `Abc@1234`, xác nhận `Abc@9999` | Submit form | Báo lỗi client-side "Mật khẩu xác nhận không khớp", không gọi API. |
| **TC-PASS-03** | Lỗi mật khẩu mới quá yếu | Pass mới `abcdefgh` (thiếu số) | Submit form | Báo lỗi client-side "Mật khẩu mới phải bao gồm cả chữ và số". |
| **TC-PASS-04** | Bắt lỗi Backend khi sai mật khẩu cũ | Nhập pass cũ không đúng $\rightarrow$ API 400 | Submit form | Bắt lỗi 400 `INVALID_CURRENT_PASSWORD`, hiển thị thông báo lỗi rõ ràng. |

---

## 10. EXACT FRONTEND FILE INVENTORY (DỰ KIẾN THỰC HIỆN)

Phạm vi can thiệp khi triển khai M6.2 hoàn toàn nằm trong thư mục `apps/web`:

1. **`apps/web/src/services/profileService.ts` (Tạo mới):**
   - Đóng gói 10 hàm gọi API qua `apiClient` (Axios).
2. **`apps/web/src/features/profile/ProfilePage.tsx` (Cập nhật):**
   - Nối data fetching cho Tab Profile, Tab Addresses, Tab Notifications, Tab Password.
   - Thêm Modal Thêm/Sửa địa chỉ và dialog xác nhận xóa địa chỉ.
3. **`apps/web/tests/m6_2_customer_profile.test.tsx` (Tạo mới):**
   - Bộ 16 integration test cases theo Test Plan.

---

## 11. FUTURE STAFF GOVERNANCE (TÓM TẮT RANH GIỚI)

Chi tiết đầy đủ được xác lập tại: [FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md](file:///d:/Nexora/FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md).

- **Tuyên bố cốt lõi:** Milestone M6.2 **TUYỆT ĐỐI KHÔNG** tạo bất kỳ giao diện, luồng công việc, dashboard, portal, permissions hay routes nào dành cho `STAFF`.
- **Ranh giới bất khả xâm phạm:**
  1. Role `STAFF` giữ nguyên định nghĩa phân quyền hiện có; không tương đương `ADMIN`.
  2. Mọi tính năng nhân viên chỉ được xem xét trong milestone tương lai có phê duyệt riêng.
  3. Không thay đổi Backend hay Database để phục vụ `STAFF`.

---

## 12. EXPLICIT OUT-OF-SCOPE (RANH GIỚI LOẠI TRỪ)

- **Customer Reviews:** Thuộc phạm vi riêng của Milestone **M6.3**.
- **Customer Returns (Yêu cầu đổi trả):** Tab "Yêu cầu đổi trả" trong `ProfilePage.tsx` thuộc phạm vi riêng của Milestone **M6.4**.
- **Admin Returns UI:** Quản trị đổi trả hàng phía Admin Dashboard (tiếp tục hoãn do UI Freeze).
- **Checkout Address Auto-fill:** Thuộc phạm vi tích hợp luồng Checkout của Storefront.
- **Sửa đổi Backend / Migrations:** Cấm tuyệt đối (Backend M1–M5 đã hoàn thiện 100%).

---

## 13. TÌNH TRẠNG BLOCKERS & KẾT LUẬN

- **Blocker 1 (Nút thao tác Sổ địa chỉ):** **ĐÃ ĐƯỢC GIẢI QUYẾT TOÀN DIỆN** nhờ quyết định của Chủ dự án cho phép linh hoạt UI/UX và triển khai Full CRUD Sổ địa chỉ theo chuẩn TechPilot.
- **Blocker 2 (STAFF Workflow):** **ĐÃ ĐƯỢC PHÂN ĐỊNH RÕ RÀNG** là Out-of-Scope cho M6 và đã có văn bản quản trị [FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md](file:///d:/Nexora/FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md).
- **Kết luận:** Milestone M6.2 đã hoàn thành xuất sắc giai đoạn khảo sát Pre-Implementation Verification, có đầy đủ căn cứ kỹ thuật, kế hoạch kiểm thử và mapping API.

Tôi đã dừng lại theo đúng điều kiện dừng (Stop Condition). Sẵn sàng chờ lệnh chính thức của Chủ dự án để bắt đầu triển khai mã nguồn Milestone M6.2!
