# CR-M6.5-01 — FINAL CROSS-TAB STATE VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **Mode:** `STRICT READ-ONLY VERIFICATION — NO CODE EDITS — NO COMMIT/PUSH — NO DB MUTATIONS`
- **References:**
  - Report 31: [`comprehensive-audit/31_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_IMPLEMENTATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/31_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_IMPLEMENTATION_REPORT.md)
  - Report 32: [`comprehensive-audit/32_CR_M6_5_01_TARGETED_VERIFICATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/32_CR_M6_5_01_TARGETED_VERIFICATION_REPORT.md)
- **Final Classification:** **`BLOCKER`**

---

## 1. Executive Verdict: **`BLOCKER`**

Phân tích truy vết đầy đủ mã nguồn cho thấy giới hạn cross-tab ghi nhận ở Report 32 **không chỉ dừng ở một nhãn tên hiển thị không nhạy cảm**, mà thỏa trực tiếp định nghĩa **`BLOCKER`** (*"Tab B tiếp tục hiển thị hoặc sử dụng trạng thái đăng nhập cũ, hoặc có thể truy cập dữ liệu riêng tư sau logout"*):

1. **Sau khi Tab A logout (chưa ai đăng nhập mới):**
   - **Về Backend / Token:** Tab B **KHÔNG THỂ** gửi request bằng JWT cũ hoặc truy cập dữ liệu mới từ Backend vì `localStorage.getItem('nexora_token')` đã thành `null`, và `apiClient`/`wishlistService` đọc `localStorage` động trên từng request (`401 Unauthorized`). Private TanStack Query cache trên Tab B cũng đã bị xóa sạch bởi `handleCrossTabAuthStorageEvent`.
   - **Về Authentication State & PII trong local React state trên Tab B (BLOCKER #1):**
     - `providers.tsx:22-24` chỉ gọi `clearPrivateQueryCache(queryClient)` và **không đồng bộ `currentUser`**.
     - Tất cả 24 trang đều giữ `currentUser` trong `useState` cục bộ (`useState(() => authService.getCurrentUser())`). Do đó:
       - [`StorefrontHeader.tsx:489-550`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx#L489-L550) trên toàn bộ 23 trang storefront tiếp tục hiển thị trạng thái đăng nhập của Account A (`fullName`, `role`, link `/admin` nếu là Admin/Staff).
       - [`ProfilePage.tsx:41-43, 82-84, 576-604, 778, 870`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L41-L84) tiếp tục hiển thị **PII nhạy cảm của Account A** (`email`, `phone`, `fullName`, `avatarUrl`, `role`) lấy từ `currentUser` local state và không redirect khỏi trang cá nhân.
       - [`CheckoutPage.tsx:15, 18-20`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx#L15-L20) tiếp tục giữ nguyên `fullName`, `phone`, `email` của Account A trong form state.
       - [`WishlistPage.tsx:15, 77-79`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L15-L79) giữ `currentUser !== null` nên guard `if (!currentUser) return <Navigate to="/auth/login?redirect=/wishlist" replace />;` **không kích hoạt**.
2. **Sau khi Tab A logout Account A rồi ĐĂNG NHẬP ACCOUNT B trong khi Tab B vẫn mở (BLOCKER #2 — Cross-Identity Cache Poisoning):**
   - Tab B nhận `storage` event khi Tab A đăng nhập Account B (`nexora_token = jwt-user-b`, `nexora_user = userB`).
   - `clearPrivateQueryCache(queryClient)` xóa cache `['wishlist', 101]`, `['profile', 101]`, `['my-orders', 101]`, `['customer-addresses', 101]`, `['notifications', 101]`, `['customer-returns', 101, ...]`.
   - Nhưng vì Tab B **vẫn giữ `currentUser = userA (id: 101)` trong React `useState`**, các `useQuery` đang active trên Tab B (`enabled: !!currentUser`) lập tức **dùng trạng thái đăng nhập cũ (`userA.id = 101`) làm `queryKey`**, gọi API kèm **`jwt-user-b` từ `localStorage`**, và **ghi dữ liệu của Account B vào cache key mang `userId: 101` của Account A**, đồng thời hiển thị UI trộn lẫn danh tính Account A (Header / Email) với dữ liệu của Account B!

---

## 2. Phân tích Mã nguồn Chi tiết (Mục 1)

### 2.1. Truy vết `currentUser` trong `StorefrontHeader` và toàn bộ các trang

- **`StorefrontHeader`** ([`apps/web/src/features/storefront/StorefrontHeader.tsx:14, 44, 489-550`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx#L489-L550)): Không tự đọc `localStorage` hay lắng nghe `storage`; nhận `currentUser: AuthUser | null` từ prop của component trang cha.
- **23 trang Storefront/Customer + 1 trang Admin** đều tự khởi tạo `currentUser` bằng `useState` một lần lúc mount:
  - [`ProfilePage.tsx:41-43`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L41-L43): `useState(() => authService.getCurrentUser())`
  - [`WishlistPage.tsx:15-17`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L15-L17): `useState(() => authService.getCurrentUser())`
  - [`CheckoutPage.tsx:15`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx#L15): `const [currentUser] = useState(() => authService.getCurrentUser());` *(thậm chí không có setter)*
  - [`CartPage.tsx:16-18`](file:///d:/Nexora/apps/web/src/features/cart/CartPage.tsx#L16-L18), [`ProductDetailPage.tsx:166-168`](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx#L166-L168), [`StorefrontHome.tsx:20-21`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHome.tsx#L20-L21), [`SearchPage.tsx:237`](file:///d:/Nexora/apps/web/src/features/catalog/SearchPage.tsx#L237), [`AdminDashboardPage.tsx:228-230`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L228-L230), và 16 trang còn lại (`AiAssistantPage`, `ComparePage`, `PcBuilderPage`, `OrderTrackingPage`, `StoresPage`, `TradeInPage`, `NewsPage`, `PostDetailPage`, `PolicyPage`, `AboutPage`, `CareersPage`, `ContactPage`, `GuidePage`, `TechnicalSupportPage`, `NotFoundPage`; riêng `LoginPage.tsx:56` và `RegisterPage.tsx:98` gọi `authService.getCurrentUser()` trong render nhưng không tự re-render khi có `storage` event).

### 2.2. Dữ liệu riêng tư đang được giữ trong Local React State (ngoài QueryClient)

| File & Dòng | Biến Local State / Prop | Dữ liệu chứa trong state | Bị ảnh hưởng bởi `clearPrivateQueryCache`? |
|---|---|---|---|
| [`ProfilePage.tsx:41, 78-84, 576-604, 778, 870`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L78-L85) | `currentUser`, `editedFullName`, `editedPhone`, `editedAvatarUrl` | **PII nhạy cảm:** `fullName`, `email`, `phone`, `avatarUrl`, `role` (fallback trực tiếp vào `currentUser?.fullName`, `currentUser?.phone`, `currentUser?.email` ngay cả khi `profileData` từ QueryClient bị xóa!) | **KHÔNG** — vẫn hiển thị đầy đủ PII trên UI Tab B |
| [`CheckoutPage.tsx:15, 18-24`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx#L15-L24) | `currentUser`, `fullName`, `phone`, `email`, `address`, `notes` | **PII nhạy cảm:** Họ tên, SĐT, email, địa chỉ giao hàng đã pre-fill của Account A | **KHÔNG** — vẫn giữ nguyên trong ô nhập liệu Tab B |
| [`WishlistPage.tsx:15, 77-79`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L15-L79) | `currentUser` | Trạng thái auth gating (`if (!currentUser) return <Navigate ... />`) và key `['wishlist', currentUser?.id]` | **KHÔNG** — không redirect khỏi `/wishlist` và giữ `userId` cũ |
| [`AdminDashboardPage.tsx:228, 245, 1877, 1997`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L228-L245) | `currentUser`, `isStaffOrAdmin` | Trạng thái cổng quản trị (`isStaffOrAdmin`), tên & vai trò quản trị viên | **KHÔNG ngay lúc `storage` event** *(chỉ thoát về login gate nếu/khi một API `/admin/dashboard/summary` refetch và trả `401/403` ở line 333-335)* |
| [`StorefrontHeader.tsx:489-550`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx#L489-L550) | prop `currentUser` (từ 23 trang cha) | Trạng thái đăng nhập header, tên khách hàng, vai trò (`ADMIN`/`STAFF`/`CUSTOMER`), liên kết `/admin` | **KHÔNG** — header vẫn hiển thị đang đăng nhập là Account A |
| [`ProductDetailPage.tsx:166, 222-224`](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx#L222-L225) | `currentUser`, `isReviewModalOpen`, `editingReview` | Trạng thái đăng nhập review và nội dung review đang mở sửa (nếu modal đang mở) | **KHÔNG** — modal/trạng thái đăng nhập giữ nguyên cho tới khi submit bị Backend trả `401` |

### 2.3. Xác minh `storage` event handler hiện tại

File: [`apps/web/src/app/providers.tsx:19-31`](file:///d:/Nexora/apps/web/src/app/providers.tsx#L19-L31) & [`apps/web/src/lib/authQueryCache.ts:138-151`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L138-L151):

- `onStorage` chỉ gọi `handleCrossTabAuthStorageEvent(event, queryClient)` → chỉ gọi `clearPrivateQueryCache(queryClient)`.
- **Xác nhận:** Handler **chỉ xóa private QueryClient cache**, hoàn toàn **không cập nhật authentication state (`currentUser`)** và **không reset các local `useState` đang mount** trên Tab B.

### 2.4. Khả năng hành động & gửi request trên Tab B sau Cross-Tab Logout

| Hành vi trên Tab B sau khi Tab A logout | Có xảy ra không? | Cơ chế thực tế & Bằng chứng mã nguồn |
|---|---|---|
| Gửi request bằng JWT cũ của Account A | **KHÔNG** | [`apiClient.ts:15`](file:///d:/Nexora/apps/web/src/lib/apiClient.ts#L15) và [`wishlistService.ts:15,38,62,80`](file:///d:/Nexora/apps/web/src/services/wishlistService.ts#L15) đọc `localStorage.getItem('nexora_token')` động tại thời điểm gọi → đã là `null`, không gắn header `Authorization`. |
| Thực hiện mutation yêu cầu đăng nhập (đổi profile, tạo/xóa address, sửa/xóa review, tạo return, xóa wishlist) | **KHÔNG (bị chặn)** | `wishlistService` ném `Error('UNAUTHORIZED')` ngay ở client; các endpoint qua `apiClient` gửi không token và bị Backend middleware auth từ chối `401`. |
| Tiếp tục hiển thị trạng thái đăng nhập & PII cục bộ của Account A | **CÓ (`BLOCKER`)** | Header 23 trang hiển thị đã đăng nhập; `ProfilePage` hiển thị `email`, `phone`, `fullName`, `avatarUrl`; `CheckoutPage` giữ nguyên PII trong form; `WishlistPage` không redirect. |
| Nhiễm độc cache & trộn danh tính nếu Tab A đăng nhập Account B | **CÓ (`BLOCKER`)** | `currentUser` cũ (`userA.id`) trên Tab B vẫn bật `enabled: !!currentUser` → active queries (`['wishlist', 101]`, `['profile', 101]`, `['my-orders', 101]`, ...) gọi API bằng `jwt-user-b` và lưu dữ liệu của Account B dưới key `userId: 101` của Account A! |

---

## 3. Hiện trạng Kiểm thử Thực tế (Mục 2 — Khai báo Trung thực)

**Khai báo minh bạch:** **KHÔNG thực hiện browser-level 2-tab test trực tiếp trong đợt xác minh này**, vì:
1. Chế độ lệnh hiện tại là `READ-ONLY` (`Không sửa code, không thay đổi database`), không được phép tạo test Playwright mới hoặc chỉnh sửa test hiện hành.
2. Ephemeral test database `nexora-m65-test-mysql` (`port 3307`) đã bị hủy sau M6.5 theo quy định cleanup, và tuyệt đối không được khởi động server chạy browser test chạm vào dev database `127.0.0.1:3306/nexora`.

### Bằng chứng từ mã nguồn và test hiện có (không phóng đại thành browser test)

- **Bằng chứng test hiện có ([`apps/web/tests/m6_5_customer_integration_qa.test.tsx:978-1029`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx#L978-L1029)):**
  - Test #12 chỉ chứng minh `handleCrossTabAuthStorageEvent` xóa cache `QueryClient` và `AppProviders` đăng ký/gỡ `window` `'storage'` listener khi render `<div>Tab B Active</div>` — **KHÔNG** render `StorefrontHeader`, `WishlistPage`, hay `ProfilePage` bên trong `AppProviders`, nên trước đây test #12 chưa kiểm tra việc `currentUser` state có cập nhật trên UI Tab B hay không.
- **Bằng chứng truy vết mã nguồn trực tiếp (Mục 2 ở trên):** Đủ để kết luận chắc chắn 100% rằng `AppProviders` hiện không trigger re-mount hoặc state update nào khi `storage` event xảy ra, nên `useState(() => authService.getCurrentUser())` ở cả 24 trang chắc chắn giữ nguyên giá trị `userA` cho đến khi người dùng tự điều hướng route hoặc reload trang.

---

## 4. Kết luận & Đề xuất Phạm vi Sửa Tối thiểu

### 4.1. Phân loại cuối cùng: **`BLOCKER`**

Lý do: Dù private `QueryClient` cache đã bị xóa và Tab B không thể gửi JWT cũ lên Backend, Tab B **vẫn tiếp tục hiển thị trạng thái đăng nhập và PII cục bộ của Account A (`ProfilePage`, `CheckoutPage`, `StorefrontHeader`), không kích hoạt route guard trên `WishlistPage`, và nghiêm trọng nhất là tiếp tục dùng `currentUser.id` cũ làm query key nếu Tab A đăng nhập tài khoản khác (gây cross-identity cache poisoning & UI trộn danh tính A/B)**.

### 4.2. Đề xuất Phạm vi Sửa Tối thiểu (KHÔNG xây `AuthContext`, KHÔNG sửa 24 trang)

Để đồng bộ toàn bộ authentication state & local form/PII state trên Tab B mà **không cần tái cấu trúc sang `AuthContext` hay chỉnh sửa 24 trang**:

- **Cơ chế đề xuất — `sessionEpoch` route-subtree reset trong `AppProviders`:**
  - Tại [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx), giữ một biến `const [sessionEpoch, setSessionEpoch] = useState(0);` và bọc `{children}` bằng `<Fragment key={sessionEpoch}>{children}</Fragment>` **bên trong `<QueryClientProvider>` và `<BrowserRouter>`**.
  - Trong `onStorage`, khi `handleCrossTabAuthStorageEvent(event, queryClient)` trả về `true` (tức chỉ khi có thay đổi thật sự ở `nexora_token` / `nexora_user` hoặc `localStorage.clear()` từ tab khác — **bỏ qua hoàn toàn** key không liên quan và no-op):
    1. `clearPrivateQueryCache(queryClient)` xóa sạch 18 private prefixes (đã có).
    2. `setSessionEpoch((prev) => prev + 1)` tự động remount nhẹ cây route bên dưới `<BrowserRouter>` **trong khi giữ nguyên `<QueryClientProvider>` cùng toàn bộ public cache (`categories`, `products`, `banners`, ...)** và không reload trang!
  - **Tác dụng ngay lập tức trên TẤT CẢ 24 trang (chỉ sửa đúng 1 file nguồn!):**
    - Tab A logout → Tab B lập tức chạy lại `useState(() => authService.getCurrentUser())` = `null`:
      - `StorefrontHeader` chuyển ngay về Guest.
      - `WishlistPage` kích hoạt ngay `<Navigate to="/auth/login?redirect=/wishlist" replace />`.
      - `ProfilePage` & `CheckoutPage` xóa sạch toàn bộ PII local state (`email`, `fullName`, `phone`, `avatarUrl`).
      - `AdminDashboardPage` khóa ngay về cổng đăng nhập quản trị (`isStaffOrAdmin === false`).
    - Tab A đăng nhập Account B → Tab B lập tức chạy lại `useState(() => authService.getCurrentUser())` = `userB (id: 202)`:
      - Mọi query (`['wishlist', 202]`, `['profile', 202]`, `['my-orders', 202]`, ...) và Header lập tức đồng bộ đúng danh tính Account B — **triệt tiêu 100% cross-identity cache poisoning và UI trộn danh tính!**
    - Tab hiện tại (same-tab) không bị ảnh hưởng vì trình duyệt chỉ phát `storage` event tới *các tab khác*.

### 4.3. Exact Proposed Allowlist Tối thiểu (Chờ Project Owner phê duyệt riêng)

| # | File Path | Quyền thay đổi | Thay đổi dự kiến |
|---|---|---|---|
| 1 | [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx) | **MODIFY** | Thêm `sessionEpoch` state + `<Fragment key={sessionEpoch}>{children}</Fragment>` bên trong `<BrowserRouter>`; chỉ tăng `sessionEpoch` khi `handleCrossTabAuthStorageEvent(event, queryClient)` trả về `true`. |
| 2 | [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx) | **MODIFY** | Nâng cấp test cross-tab để render real UI (`WishlistPage`, `ProfilePage`, `StorefrontHeader`) bên trong `AppProviders`, kiểm chứng trực tiếp: (a) Tab A logout → Tab B redirect `/auth/login` & xóa sạch PII/Header state của A, (b) Tab A login Account B → Tab B tự đồng bộ Header + `['wishlist', userB.id]` không nhiễm độc `['wishlist', userA.id]`, (c) storage key không liên quan (`nexora-theme`) không gây remount, (d) public cache trong `QueryClient` vẫn bảo toàn 100%. |

*(Ghi chú: Không cần thêm file nào khác ngoài 2 file vốn đã nằm trong allowlist của `CR-M6.5-01`!)*

---

## 5. Xác nhận Tuân thủ Read-Only & Git Safety

- **Branch / HEAD:** `main` / `3d8adb18c967400dbc28787a6b8174b9a7cf8213` (không đổi).
- **Source / Test edits trong đợt xác minh này:** `0`.
- **Staged files / Commit / Push / DB mutations:** `0`.

Tôi dừng hoàn toàn tại đây và chờ quyết định phê duyệt của Project Owner đối với phương án sửa tối thiểu 2 file cho phần cross-tab state của `CR-M6.5-01`.
