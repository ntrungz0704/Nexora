# BÁO CÁO NGHIỆM THU TRIỂN KHAI MILESTONE M6.1

## API Foundation, Guest Cart Merge & Cơ Chế Phục Hồi An Toàn (Failure-Safety)

- **Mã tài liệu:** `M6_1_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md`
- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Tham chiếu nguồn:** `TechPilot` (`D:\Nexora\TechPilot`) — READ-ONLY
- **Dự án đích:** `Nexora` (`D:\Nexora`)
- **Vai trò:** Senior Frontend Engineer & Integration Architect
- **Thời điểm nghiệm thu:** `2026-11-22T21:05:00+07:00`
- **Branch:** `main`
- **Initial Commit HEAD:** `a307dd382a127e7ec47d74258c8d6b236e47b513`

---

## 1. Executive Summary (Tóm Tắt Điều Hành)

Milestone **M6.1 — API Foundation & Guest Cart Merge** đã được triển khai hoàn chỉnh 100%, tuân thủ nghiêm ngặt nguyên tắc **Absolute UI Freeze** (giữ nguyên diện mạo, bố cục, CSS/Tailwind classes và assets) và bảo toàn tuyệt đối Backend M1–M5:

1. **Khép kín luồng Guest Cart Merge an toàn:** Tự động đính kèm `guestSessionId` từ client khi đăng nhập/đăng ký, tận dụng cơ chế Backend Auto-Merge đã được nghiệm thu tại Milestone M3.
2. **Cơ chế Phục hồi An toàn (Failure-Safety & Multi-tier Retry):**
   - Phân biệt rạch ròi giữa việc xác thực danh tính thành công và việc gộp giỏ hàng thành công.
   - Chỉ xóa `nexora_guest_session` khi nhận được xác nhận merge thành công (`session.cartMerge` hợp lệ hoặc retry HTTP 200).
   - Tự động kích hoạt **Immediate Retry** (đúng 1 lần) khi Backend auto-merge gặp lỗi ngầm hoặc vắng mặt `cartMerge`.
   - Trang bị **Passive Retry** với cơ chế Deduplication & In-flight guard tại `CartPage.tsx`, cho phép khôi phục giỏ hàng khi người dùng mở trang giỏ mà không tạo vòng lặp vô hạn.
3. **Đồng bộ hóa tức thời (TanStack Query Synchronization):** Invalidate query `['cart']` ngay sau khi merge thành công, cập nhật lập tức số lượng giỏ hàng trên Header badge và nội dung trang Cart mà không cần tải lại trang.
4. **Kiểm chứng chất lượng:** Toàn bộ 15 test cases trong suite M6.1 (bao gồm TC-1 đến TC-9 và các luồng UI Sync) cùng 231 tests toàn hệ thống đều đạt `PASS` 100%.

---

## 2. Initial Git State (Trạng Thái Git Ban Đầu)

- **Branch:** `main`
- **Initial Commit Hash:** `a307dd382a127e7ec47d74258c8d6b236e47b513`
- **Working tree:** Sạch sẽ trước khi triển khai, không có thay đổi dở dang của người dùng.

---

## 3. Files Changed (Danh Sách Tệp Thay Đổi & Tạo Mới)

| STT | Đường dẫn tệp tin                                                                                                    | Loại thay đổi | Mục đích & Trách nhiệm                                                                                                          |
| :-: | :------------------------------------------------------------------------------------------------------------------- | :-----------: | :------------------------------------------------------------------------------------------------------------------------------ |
|  1  | [`apps/web/src/services/cartService.ts`](file:///D:/Nexora/apps/web/src/services/cartService.ts)                     |   Modified    | Quản lý vòng đời `nexora_guest_session`, bổ sung `mergeCart()`, hàm Passive Retry có Deduplication & In-flight guard            |
|  2  | [`apps/web/src/services/authService.ts`](file:///D:/Nexora/apps/web/src/services/authService.ts)                     |   Modified    | Mở rộng `AuthSession` nhận diện `cartMerge`, tự động gửi `guestSessionId` khi login/register, kích hoạt Immediate Retry an toàn |
|  3  | [`apps/web/src/features/auth/LoginPage.tsx`](file:///D:/Nexora/apps/web/src/features/auth/LoginPage.tsx)             |   Modified    | Invalidate TanStack Query `['cart']` sau khi login thành công (giữ nguyên 100% UI/CSS)                                          |
|  4  | [`apps/web/src/features/auth/RegisterPage.tsx`](file:///D:/Nexora/apps/web/src/features/auth/RegisterPage.tsx)       |   Modified    | Invalidate TanStack Query `['cart']` sau khi register thành công (giữ nguyên 100% UI/CSS)                                       |
|  5  | [`apps/web/src/features/storefront/AuthModal.tsx`](file:///D:/Nexora/apps/web/src/features/storefront/AuthModal.tsx) |   Modified    | Invalidate TanStack Query `['cart']` sau khi login/register qua Modal (giữ nguyên 100% UI/CSS)                                  |
|  6  | [`apps/web/src/features/cart/CartPage.tsx`](file:///D:/Nexora/apps/web/src/features/cart/CartPage.tsx)               |   Modified    | Bổ sung `useEffect` kích hoạt Passive Retry an toàn khi mở trang giỏ hàng (giữ nguyên 100% UI/CSS)                              |
|  7  | [`apps/web/tests/m6_1_guest_cart_merge.test.tsx`](file:///D:/Nexora/apps/web/tests/m6_1_guest_cart_merge.test.tsx)   |    Created    | Bộ kiểm thử tự động toàn diện kiểm chứng 15 kịch bản (TC-1 đến TC-9, Register, UI Sync, Passive Retry)                          |

---

## 4. API Foundation Implementation (Chuẩn Hóa Nền Tảng Tích Hợp API)

- **Tận dụng `apiClient`:** Sử dụng nguyên trạng `apps/web/src/lib/apiClient.ts`. Request interceptor tự động gắn `Authorization: Bearer <token>` từ `localStorage.getItem('nexora_token')`.
- **Hợp đồng kiểu dữ liệu (@nexora/shared):** Sử dụng trực tiếp `LoginInput`, `RegisterInput`, `MergeCartResultDto`, `CartSummaryDto` từ `@nexora/shared`, bảo đảm tính nhất quán kiểu dữ liệu tuyệt đối giữa Client và Server.
- **Envelope chuẩn:** Toàn bộ API calls đều bọc trong `ApiSuccessEnvelope<T>`, trích xuất dữ liệu qua `res.data.data`.

---

## 5. Guest Cart Merge Implementation (Cơ Chế Auto-Merge Giỏ Hàng)

Trong [`apps/web/src/services/cartService.ts`](file:///D:/Nexora/apps/web/src/services/cartService.ts):

- **Khóa lưu trữ chuẩn:** `export const GUEST_SESSION_KEY = 'nexora_guest_session';`
- **`getExistingGuestSessionId(): string | null`:** Chỉ đọc session ID hiện có trong `localStorage`. **Tuyệt đối không tự ý sinh mới** nếu chưa có, ngăn chặn phát sinh session giả mạo.
- **`getGuestSessionId(): string`:** Được gọi khi khách thực sự thêm sản phẩm vào giỏ hàng hoặc xem giỏ hàng. Nếu chưa có mới sinh chuỗi dạng `guest_<random_36>_<timestamp_36>`.
- **`clearGuestSession(): void`:** Xóa sạch `nexora_guest_session` khỏi `localStorage` khi và chỉ khi có xác nhận merge hoàn tất.
- **`mergeCart(guestSessionId: string): Promise<MergeCartResultDto>`:** Gọi `POST /api/v1/cart/merge` kèm Bearer Token (yêu cầu `requireAuth()`).

---

## 6. Authentication Flow (Luồng Xác Thực Login / Register An Toàn)

Trong [`apps/web/src/services/authService.ts`](file:///D:/Nexora/apps/web/src/services/authService.ts):

1. **Kiểm tra Session khách trước khi gửi:**
   ```typescript
   const existingGuestSessionId = cartService.getExistingGuestSessionId();
   const guestSessionId = input.guestSessionId ?? (existingGuestSessionId || undefined);
   ```
2. **Gửi request xác thực:**
   Đính kèm `guestSessionId` vào payload gửi tới `POST /api/v1/auth/login` hoặc `POST /api/v1/auth/register`.
3. **Lưu trữ Session khi thành công:**
   ```typescript
   localStorage.setItem('nexora_token', session.token);
   localStorage.setItem('nexora_user', JSON.stringify(session.user));
   ```
4. **Kiểm chứng tính hợp lệ của `cartMerge`:**
   ```typescript
   const isValidMergeResult =
     session.cartMerge &&
     typeof session.cartMerge.mergedItemsCount === 'number' &&
     session.cartMerge.cart !== undefined;
   ```
   - Nếu `isValidMergeResult === true`: Auto-Merge thành công $\rightarrow$ gọi `cartService.clearGuestSession()`.
   - Nếu `isValidMergeResult === false` (và có `guestSessionId`): Kích hoạt **Immediate Retry**.

---

## 7. Immediate Retry (Cơ Chế Thử Lại Tức Thì)

Khi xác thực thành công nhưng phản hồi không có `cartMerge` (do Backend nuốt lỗi ngầm trong `try/catch` non-blocking):

- Vì token đã được lưu vào `localStorage`, mọi request tiếp theo của `apiClient` đều tự động có header `Authorization: Bearer <token>`.
- `authService` lập tức gọi:
  ```typescript
  try {
    const retryResult = await cartService.mergeCart(guestSessionId);
    if (
      retryResult &&
      typeof retryResult.mergedItemsCount === 'number' &&
      retryResult.cart !== undefined
    ) {
      cartService.clearGuestSession();
      session.cartMerge = retryResult;
    }
  } catch {
    // Immediate retry thất bại -> Bảo toàn nexora_guest_session trong localStorage
  }
  ```
- **Cam kết:** Không gọi immediate retry lần thứ hai trong cùng luồng authentication; không làm rollback trạng thái đăng nhập của người dùng.

---

## 8. Passive Retry & Deduplication (Cơ Chế Phục Hồi Thụ Động Tại CartPage)

Trong [`apps/web/src/services/cartService.ts`](file:///D:/Nexora/apps/web/src/services/cartService.ts) và [`apps/web/src/features/cart/CartPage.tsx`](file:///D:/Nexora/apps/web/src/features/cart/CartPage.tsx):

- **In-flight guard:** Biến `isMergingInFlight` ngăn chặn tuyệt đối việc phát sinh hai request merge đồng thời.
- **Deduplication guard:** `lastAttemptedSessionId === guestSessionId && lastAttemptFailed` bảo đảm nếu một phiên khách đã thử merge thất bại trên CartPage, các lần re-render tiếp theo của component sẽ **không gọi lặp lại request**.
- **Kích hoạt tại CartPage:**
  ```typescript
  useEffect(() => {
    const token = authService.getToken();
    if (!token || !cartService.hasGuestSession()) return;

    let mounted = true;
    cartService.attemptPassiveCartMerge(token).then((merged) => {
      if (mounted && merged) {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        showToast('Đã tự động đồng bộ giỏ hàng trước đó của bạn.');
      }
    });

    return () => {
      mounted = false;
    };
  }, [currentUser, queryClient]);
  ```

---

## 9. Session Cleanup Verification (Kiểm Chứng Dọn Dẹp Session)

| Tình huống                                               | Trạng thái Session trước | Thao tác thực hiện                            | Trạng thái Session sau                             | Kết quả kiểm chứng |
| :------------------------------------------------------- | :----------------------- | :-------------------------------------------- | :------------------------------------------------- | :----------------: |
| **Login thành công, Auto-Merge thành công**              | `guest_123`              | Login 200 có `cartMerge`                      | `localStorage.getItem` trả về `null`               |  **PASS (TC-1)**   |
| **Login sai mật khẩu**                                   | `guest_123`              | Login 401                                     | `guest_123` được giữ nguyên vẹn                    |  **PASS (TC-2)**   |
| **Login thành công, Auto-Merge thiếu, Retry thành công** | `guest_123`              | Login 200 thiếu merge $\rightarrow$ Retry 200 | `localStorage.getItem` trả về `null`               |  **PASS (TC-4)**   |
| **Login thành công, Auto-Merge thiếu, Retry thất bại**   | `guest_123`              | Login 200 thiếu merge $\rightarrow$ Retry 500 | `guest_123` được giữ nguyên vẹn                    |  **PASS (TC-5)**   |
| **Không có giỏ khách ban đầu**                           | `null`                   | Login 200                                     | `null` (không sinh rác)                            |  **PASS (TC-6)**   |
| **Tải lại trang sau lỗi merge**                          | `guest_123`              | F5 Reload trình duyệt                         | Đọc lại chính xác `guest_123` để tiếp tục phục hồi |  **PASS (TC-8)**   |

---

## 10. TanStack Query Synchronization (Đồng Bộ Cache & Header Badge)

- Cả 3 điểm xác thực gồm `LoginPage.tsx`, `RegisterPage.tsx`, và `AuthModal.tsx` đều gọi `queryClient.invalidateQueries({ queryKey: ['cart'] })` ngay sau khi đăng nhập/đăng ký thành công.
- Khi query `['cart']` bị invalidate:
  - TanStack Query tự động phát request `GET /api/v1/cart` với Bearer Token mới.
  - Backend trả về giỏ hàng hợp nhất của User.
  - Header badge (`cartCount` tại `StorefrontHeader`) và Cart Drawer lập tức hiển thị dữ liệu mới mà **không cần reload trang**.

---

## 11. TC-1 to TC-9 Test Results (Kết Quả Bộ Kiểm Thử M6.1)

Chạy thực tế qua lệnh: `npx vitest run apps/web/tests/m6_1_guest_cart_merge.test.tsx`

```
 RUN  v5.1.1 D:/Nexora

 ✓ apps/web/tests/m6_1_guest_cart_merge.test.tsx (15 tests) 301ms
   ✓ M6.1: Guest Cart Merge & Failure-Safety Test Suite (TC-1 to TC-9) (15)
     ✓ TC-1: Login thành công và Auto-Merge thành công -> Lưu JWT/User, xóa guest session, trả về cartMerge
     ✓ TC-2: Login sai mật khẩu -> Báo lỗi, TUYỆT ĐỐI không xóa guest session, không gọi merge retry
     ✓ TC-3: Auth thành công nhưng thiếu cartMerge -> Giữ session và kích hoạt đúng 1 lần Immediate Retry
     ✓ TC-4: Immediate retry thành công -> Cập nhật session.cartMerge và xóa guest session an toàn
     ✓ TC-5: Immediate retry thất bại -> VẪN GIỮ guest session trong localStorage, không làm hỏng login
     ✓ TC-6: Không có guest session -> Authentication bình thường, không gửi ID khách, không gọi merge/retry
     ✓ TC-7: Passive retry tại CartPage -> Kích hoạt khi có session và user đã đăng nhập, deduplicate không gọi lặp
     ✓ TC-7b: Deduplication guard ngăn chặn retry lặp vô hạn khi passive retry thất bại
     ✓ TC-8: Reload sau khi merge thất bại -> Khôi phục được guestSessionId và có thể tiếp tục recovery
     ✓ TC-9: Duplicate merge request -> Tuân thủ Idempotency, không nhân đôi sản phẩm (Backend trả về no-op)
     ✓ REGISTER-FLOW: Đăng ký tài khoản mới đính kèm guestSessionId và xử lý auto-merge
     ✓ UI-QUERY-SYNC: LoginPage gọi authService.login và invalidate query [cart]
     ✓ UI-AUTH-MODAL: AuthModal xử lý đăng nhập và invalidate query [cart]
     ✓ UI-REGISTER-SYNC: RegisterPage gọi authService.register và invalidate query [cart]
     ✓ UI-CART-PAGE-MOUNT: CartPage kích hoạt passive retry khi user đã đăng nhập và có session khách

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  1.75s
```

---

## 12. Regression Test Results (Kiểm Thử Hồi Quy Toàn Hệ Thống)

Chạy thực tế qua lệnh: `npm test`

```
Test Files: 19 passed (19 files)
Tests:      231 passed (231 tests)
Duration:   66.73s
```

Bao gồm:

- Toàn bộ 14 tests backend `phase_b_cart_merge.test.ts` (ACID transaction, locking, capping, rollback).
- Toàn bộ 30 tests backend `phase_b_returns_and_admin_crud.test.ts` (M5).
- Toàn bộ 29 tests backend `phase_b_customer_reviews.test.ts` (M4).
- Toàn bộ 26 tests backend `phase_b_profile_addresses.test.ts` (M2).
- Toàn bộ các suites bảo mật (Phase A Security, Payment Security, IDOR, Password Reset).
- Toàn bộ 20 tests frontend tại `apps/web/tests/`.

---

## 13. Quality Gates Summary (Đối Soát Tiêu Chuẩn Chất Lượng)

| Quality Gate         | Lệnh thực thi                   | Kết quả  | Chi tiết kiểm chứng                                                      |
| :------------------- | :------------------------------ | :------: | :----------------------------------------------------------------------- |
| **Typecheck**        | `npm run typecheck`             | **PASS** | 0 lỗi TypeScript trên cả 4 workspaces (`config`, `shared`, `api`, `web`) |
| **Lint**             | `npm run lint`                  | **PASS** | 0 lỗi, 0 cảnh báo ESLint                                                 |
| **Format**           | `npm run format:check`          | **PASS** | 100% tệp tin tuân thủ Prettier code style                                |
| **Frontend Tests**   | `npx vitest run apps/web/tests` | **PASS** | 3/3 tệp test, 20/20 tests passed                                         |
| **Monorepo Tests**   | `npm test`                      | **PASS** | 19/19 tệp test, 231/231 tests passed                                     |
| **Production Build** | `npm run build`                 | **PASS** | Build thành công toàn bộ packages, api, và web bundle (Vite)             |

---

## 14. UI Freeze Compliance (Kiểm Soát Tuân Thủ Đóng Băng Giao Diện)

- **Kiểm tra Git Diff:** Hoàn toàn không có bất kỳ dòng thay đổi nào liên quan đến CSS, Tailwind classes, màu sắc, font chữ, bố cục layout hoặc assets.
- **Không thêm màn hình / tab mới:** Không thêm tab mới vào `AdminDashboardPage.tsx`. Giao diện giữ nguyên vẹn 100% diện mạo TechPilot.

---

## 15. Backend M1–M5 Preservation (Bảo Toàn Backend Đã Nghiệm Thu)

- **Thư mục `apps/api/**`:** 0 tệp bị sửa đổi.
- **Thư mục `packages/shared/**`:** 0 tệp bị sửa đổi.
- **Prisma Schema & Migrations:** 0 thay đổi, không tạo migration mới.
- **Database:** Giữ nguyên vẹn 100% cấu trúc và logic đã được nghiệm thu tại M1–M5.

---

## 16. Git Commit Information (Thông Tin Commit Git)

Theo quy định bắt buộc, commit message được viết bằng **tiếng Việt không dấu** theo chuẩn Conventional Commits:

- **Commit Message đề xuất:**
  ```
  feat(web): hoan thien guest cart merge va api foundation m6.1

  - cap nhat authService login va register tu dong gui guestSessionId
  - tich hop co che failure-safety va immediate retry khi auto-merge thieu
  - bo sung passive retry voi in-flight guard va deduplication tai CartPage
  - invalidate query cart dong bo header badge va cart drawer
  - bo sung 15 automated tests kiem chung toan dien TC-1 den TC-9
  ```

---

## 17. Known Limitations (Giới Hạn Đã Biết & Phân Định Ranh Giới)

1. **Khách hàng xóa dữ liệu trình duyệt thủ công:** Nếu khách hàng chủ động vào Cài đặt trình duyệt và xóa toàn bộ Local Storage trước khi mở lại `CartPage`, `guestSessionId` sẽ bị mất và không thể thực hiện Passive Retry. Đây là hành vi tiêu chuẩn của tất cả các hệ thống web hiện đại.
2. **Admin Returns UI:** Vẫn tiếp tục được **HOÃN LẠI (DEFERRED)** vì lý do Absolute UI Freeze.
3. **Customer Profile, Reviews & Returns:** Sẽ được đấu nối tuần tự tại các milestone tiếp theo (M6.2, M6.3, M6.4).

---

## 18. Final Acceptance Recommendation (Đề Xuất Nghiệm Thu Chính Thức)

Milestone M6.1 đã hoàn thành xuất sắc mọi tiêu chí kỹ thuật và chất lượng đặt ra:

- **Trạng thái đề xuất:** **`FINAL PASS` cho Milestone M6.1**.
- **Hành động tiếp theo:** Sau khi Người Dùng kiểm tra và ký nghiệm thu M6.1, dự án có thể thực hiện commit Git chính thức và chuẩn bị bước vào phân kỳ **M6.2 — Customer Account / Profile**.
