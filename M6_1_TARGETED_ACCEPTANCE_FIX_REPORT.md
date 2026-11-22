# BÁO CÁO NGHIỆM THU KHẮC PHỤC MỤC TIÊU M6.1 (TARGETED ACCEPTANCE FIX REPORT)

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Milestone:** M6.1 — API Integration Foundation & Guest Cart Merge (Khắc phục nghiệm thu bổ sung)
- **Ngày thực hiện:** 2026-11-22
- **Trạng thái nghiệm thu:** **FINAL PASS** (100% Tiêu chí & Khắc phục đạt chuẩn)
- **Branch:** `main`
- **Cam kết:** Giữ nguyên trạng giao diện (Absolute UI Freeze), không sửa đổi Backend/Database/Shared, commit local bằng tiếng Việt không dấu, không push lên remote.

---

## 1. TỔNG QUAN KHẮC PHỤC & KẾT QUẢ ĐẠT ĐƯỢC

Trong đợt nghiệm thu trước của Milestone M6.1, hai hạn chế kỹ thuật đã được xác định cụ thể và đưa vào diện khắc phục mục tiêu:
1. **Merge Result DTO Validation:** Trước đây sử dụng kiểm tra nông (`typeof mergedItemsCount === 'number' && cart !== undefined`), dẫn đến việc các dữ liệu lỗi như `{ mergedItemsCount: 0, cart: null }` hoặc `{ mergedItemsCount: 2, cart: "invalid" }` có thể bị coi là thành công và xóa nhầm session khách.
2. **Passive Retry Lifecycle:** Trước đây biến guard `lastAttemptFailed` và `lastAttemptedSessionId` nằm ở cấp module trong `cartService.ts` mà không có cơ chế reset theo vòng đời component. Khi một lần retry thất bại, nếu người dùng điều hướng sang trang khác rồi quay lại `/cart` trong cùng phiên SPA, yêu cầu retry mới bị chặn vĩnh viễn cho đến khi nhấn F5 tải lại toàn bộ trang.

### Kết quả sau khắc phục:
- **Merge Result DTO Validation: FINAL PASS.** Tích hợp xác thực toàn diện bằng `MergeCartResultDtoSchema.safeParse()` từ `@nexora/shared` vào cả 3 vị trí: `authService.login()`, `authService.register()`, và `cartService.attemptPassiveCartMerge()`. Từ chối 100% các dữ liệu dị dạng (`cart: null`, `cart: "invalid"`, thiếu items); chấp nhận chính xác DTO hợp lệ kể cả khi `mergedItemsCount: 0`.
- **Passive Retry Lifecycle: FINAL PASS.** Gắn kết guard giữa `CartPage` component lifecycle (`useRef`, `useEffect`) và `cartService`:
  - Chặn duplicate network calls khi component re-render trong cùng một lần mount.
  - Chặn song song bằng in-flight lock (`isMergingInFlight`).
  - Tự động reset guard khi rời khỏi `CartPage` (unmount cleanup), cho phép kích hoạt lần thử mới khi người dùng chủ động quay lại `/cart` mà không cần F5.
  - Tự động reset guard khi người dùng tương tác với giỏ hàng (`addItem`, `updateItem`, `removeItem`).
  - Hoạt động ổn định dưới React `StrictMode` (React 18/19), không kích hoạt duplicate network calls trong môi trường development.
  - Bảo toàn tuyệt đối `nexora_guest_session` khi merge/retry thất bại.

---

## 2. CHI TIẾT KỸ THUẬT & GIẢI PHÁP TRIỂN KHAI

### 2.1. Khắc phục Điểm 1: Merge Result DTO Validation

**Nguyên lý triển khai:**
Thay thế toàn bộ logic kiểm tra nguyên thủy (`typeof === 'number'`) bằng hàm `validateMergeResult(data: unknown)` chuẩn hóa:

```typescript
function validateMergeResult(data: unknown): MergeCartResultDto | null {
  if (!data || typeof data !== 'object') return null;
  const parsed = MergeCartResultDtoSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
```

- **Khi đăng nhập (`login`) & đăng ký (`register`)**:
  - Dữ liệu `session.cartMerge` trả về từ Backend được validate qua `validateMergeResult()`.
  - Nếu `validMergeResult` hợp lệ: Lưu session, gán `session.cartMerge = validMergeResult`, gọi `cartService.clearGuestSession()`.
  - Nếu `validMergeResult` trả về `null` (thiếu `cartMerge` hoặc dữ liệu malformed như `cart: null`): Kích hoạt đúng 1 lần Immediate Retry tới `POST /cart/merge`.
  - Dữ liệu trả về từ Immediate Retry tiếp tục được validate qua `validateMergeResult()`. Nếu hợp lệ mới xóa session; nếu không hợp lệ hoặc ném lỗi ngoại lệ: **Bảo toàn `nexora_guest_session` trong localStorage**.
- **Khi thử lại thụ động (`attemptPassiveCartMerge`)**:
  - Kết quả từ `cartService.mergeCart(guestSessionId)` được parse bằng `MergeCartResultDtoSchema.safeParse(rawResult)`.
  - Nếu `parsed.success`: Xóa session khách, reset cờ lỗi, trả về DTO.
  - Nếu `!parsed.success`: Đánh dấu `lastAttemptFailed = true`, **không xóa session khách**, trả về `null`.

### 2.2. Khắc phục Điểm 2: Passive Retry Lifecycle & StrictMode

**Nguyên lý triển khai:**
1. **Deduplication trên cùng một mount (`CartPage.tsx`)**:
   - Sử dụng `const passiveAttemptedRef = useRef(false)`.
   - Khi `useEffect` chạy lần đầu: kiểm tra `if (passiveAttemptedRef.current) return;`, sau đó đánh dấu `passiveAttemptedRef.current = true`.
   - Các lần re-render tiếp theo của `CartPage` (do thay đổi state mã giảm giá, cập nhật số lượng, refetch queries...) hoàn toàn không kích hoạt thêm bất kỳ network request nào.
2. **Khôi phục khả năng retry khi chuyển hướng trong SPA**:
   - `CartPage.tsx` đăng ký lifecycle cleanup:
     ```typescript
     useEffect(() => {
       isMountedRef.current = true;
       return () => {
         isMountedRef.current = false;
         cartService.resetPassiveMergeGuard();
       };
     }, []);
     ```
   - Khi người dùng điều hướng rời khỏi `/cart` (ví dụ sang `/products`, `/profile`): component unmount $\rightarrow$ gọi `resetPassiveMergeGuard()` để đưa `lastAttemptFailed` về `false` và `lastAttemptedSessionId` về `null`.
   - Khi người dùng quay lại `/cart`: component mount mới với `passiveAttemptedRef.current = false`, cho phép kích hoạt một lần passive retry mới mà hoàn toàn không cần F5.
3. **Chống duplicate call trong React StrictMode**:
   - Trong React 18/19 dev mode, React mount $\rightarrow$ unmount $\rightarrow$ remount ngay lập tức trên cùng component instance.
   - `passiveAttemptedRef` được React bảo toàn qua quá trình remount, ngăn chặn effect thứ hai gọi lại API.
   - Ref `isMountedRef` đảm bảo khi promise mạng hoàn thành sau đó, component vẫn cập nhật query invalidation và hiển thị thông báo toast thành công.
4. **Tương tác giỏ hàng tự động mở khóa retry**:
   - Các hàm `addItem()`, `addToCart()`, `updateItem()`, `removeItem()` trong `cartService` đều gọi `resetPassiveMergeGuard()`, đảm bảo mọi thay đổi giỏ hàng từ người dùng đều kích hoạt lại khả năng đồng bộ nếu trước đó từng gặp lỗi.

---

## 3. DANH SÁCH TỆP THAY ĐỔI & PHẠM VI (DIFF AUDIT)

Tất cả thay đổi chỉ nằm trong **3 tệp mã nguồn** và **1 tệp kiểm thử** thuộc thư mục `apps/web`:

| STT | Tệp tin | Vị trí thay đổi | Mô tả nội dung thay đổi |
| :--- | :--- | :--- | :--- |
| 1 | `apps/web/src/services/authService.ts` | Dòng 1-105 | Thêm `MergeCartResultDtoSchema.safeParse` qua hàm `validateMergeResult()`. Áp dụng cho cả luồng `login()` và `register()`. |
| 2 | `apps/web/src/services/cartService.ts` | Dòng 1-160 | Thêm `MergeCartResultDtoSchema.safeParse` vào `attemptPassiveCartMerge()`. Thêm `resetPassiveMergeGuard()` vào `addItem`, `updateItem`, `removeItem`. |
| 3 | `apps/web/src/features/cart/CartPage.tsx` | Dòng 1-50 | Bổ sung `passiveAttemptedRef` và `isMountedRef`. Reset guard khi component unmount. Giữ nguyên 100% markup và styling. |
| 4 | `apps/web/tests/m6_1_guest_cart_merge.test.tsx` | Toàn bộ tệp | Bổ sung 8 test cases chuyên sâu kiểm thử DTO Schema Validation, Lifecycle navigation, StrictMode, In-flight blocking và Cart mutations. |

### Cam kết bảo vệ phạm vi (Scope Protection):
- `apps/api/**`: **0 tệp thay đổi** (Giữ nguyên tuyệt đối backend M1–M5).
- `prisma/**`: **0 tệp thay đổi** (Không sửa đổi database migrations).
- `packages/shared/**`: **0 tệp thay đổi** (Tận dụng schema `MergeCartResultDtoSchema` sẵn có).
- `TechPilot/` & `audit-output/`: **0 tệp thay đổi** (Read-only nguyên vẹn).
- **Absolute UI Freeze**: Không thêm bất kỳ thẻ HTML, CSS selector hay class Tailwind nào vào giao diện.

---

## 4. KẾT QUẢ KIỂM THỬ & CHỨNG THỰC (EMPIRICAL VERIFICATION)

### 4.1. Bộ kiểm thử tích hợp chuyên sâu M6.1 (`apps/web/tests/m6_1_guest_cart_merge.test.tsx`)
- **Lệnh thực thi:** `npx vitest run apps/web/tests/m6_1_guest_cart_merge.test.tsx`
- **Kết quả:** **23/23 tests PASS** (100%)
- **Bao phủ kịch bản:**
  - `TC-1`: Login thành công + Auto-Merge thành công $\rightarrow$ Lưu Auth, xóa session khách, trả về `cartMerge`. (PASS)
  - `TC-2`: Login sai thông tin $\rightarrow$ Báo lỗi, bảo toàn nguyên vẹn `nexora_guest_session`. (PASS)
  - `TC-3`: Login thành công nhưng Auto-Merge thiếu `cartMerge` $\rightarrow$ Giữ session và kích hoạt 1 lần Immediate Retry. (PASS)
  - `TC-4`: Immediate Retry thành công $\rightarrow$ Cập nhật `session.cartMerge` và xóa session khách an toàn. (PASS)
  - `TC-5`: Immediate Retry thất bại $\rightarrow$ Bảo toàn session khách trong localStorage, không làm hỏng đăng nhập. (PASS)
  - `TC-6`: Không có session khách $\rightarrow$ Đăng nhập bình thường, không gửi ID khách, không gọi merge/retry. (PASS)
  - `TC-7`: Passive Retry tại `CartPage` $\rightarrow$ Kích hoạt khi có session và user đã đăng nhập, deduplicate không gọi lặp. (PASS)
  - `TC-7b`: Deduplication guard ngăn chặn retry lặp vô hạn khi passive retry thất bại. (PASS)
  - `TC-8`: Khôi phục `guestSessionId` sau khi tải lại trang và recovery thành công. (PASS)
  - `TC-9`: Duplicate merge request tuân thủ Idempotency (Backend no-op). (PASS)
  - `REGISTER-FLOW`: Đăng ký tài khoản đính kèm `guestSessionId` và xử lý auto-merge. (PASS)
  - `UI-QUERY-SYNC`: `LoginPage` gọi `login` và invalidate query `['cart']`. (PASS)
  - `UI-AUTH-MODAL`: `AuthModal` gọi `login` và invalidate query `['cart']`. (PASS)
  - `UI-REGISTER-SYNC`: `RegisterPage` gọi `register` và invalidate query `['cart']`. (PASS)
  - `UI-CART-PAGE-MOUNT`: `CartPage` kích hoạt passive retry khi mount. (PASS)
  - `DTO-1 (Mới)`: Từ chối `cartMerge` dị dạng `{ mergedItemsCount: 0, cart: null }` $\rightarrow$ Thử retry, nếu retry cũng lỗi thì bảo toàn session. (PASS)
  - `DTO-2 (Mới)`: Chấp nhận DTO hợp lệ ngay cả khi `mergedItemsCount: 0` $\rightarrow$ Xóa session khách an toàn. (PASS)
  - `DTO-3 (Mới)`: Passive retry kiểm tra DTO schema bằng `safeParse` $\rightarrow$ Từ chối kết quả malformed và bảo toàn session. (PASS)
  - `LIFECYCLE-1 (Mới)`: Chặn duplicate call khi `CartPage` re-render trong cùng một lần mount. (PASS)
  - `LIFECYCLE-2 (Mới)`: Cho phép thử lại khi người dùng rời khỏi `CartPage` (unmount) và quay lại (mount mới) mà không cần F5. (PASS)
  - `LIFECYCLE-3 (Mới)`: In-flight guard ngăn chặn gọi đồng thời khi một request merge đang diễn ra. (PASS)
  - `LIFECYCLE-4 (Mới)`: Thao tác giỏ hàng (`addItem`, `updateItem`, `removeItem`) tự động reset guard để sẵn sàng đồng bộ. (PASS)
  - `LIFECYCLE-5 (Mới)`: `React.StrictMode` không kích hoạt duplicate merge requests ngoài ý muốn trong môi trường dev. (PASS)

### 4.2. Toàn bộ kiểm thử Frontend (`apps/web/tests`)
- **Lệnh thực thi:** `npx vitest run apps/web/tests`
- **Kết quả:** **3/3 test files PASS, 28/28 tests PASS** (100%)

### 4.3. Toàn bộ kiểm thử Monorepo (`npm test`)
- **Lệnh thực thi:** `npm test` (`vitest run` toàn bộ dự án)
- **Kết quả:** **19/19 test files PASS, 239/239 tests PASS** (100%)
  - Bao gồm toàn bộ Backend tests (M1 Security, M2 Commerce & AI, M3 Cart Merge, M4 Reviews, M5 Returns) và Frontend tests.

### 4.4. Kiểm tra Typecheck (`npm run typecheck`)
- **Lệnh thực thi:** `npm run typecheck`
- **Kết quả:** **PASS** (Mã thoát 0, 0 lỗi TypeScript trên toàn bộ API, Web, Packages).

### 4.5. Kiểm tra Lint (`npm run lint`)
- **Lệnh thực thi:** `npm run lint`
- **Kết quả:** **PASS** (Mã thoát 0, 0 lỗi ESLint).

### 4.6. Kiểm tra Định dạng Prettier (`npm run format:check`)
- **Lệnh thực thi:** `npm run format:check`
- **Kết quả:** **PASS** (Tất cả tệp mã nguồn tuân thủ Prettier code style).

### 4.7. Kiểm tra Build Monorepo (`npm run build`)
- **Lệnh thực thi:** `npm run build`
- **Kết quả:** **PASS** (Xây dựng thành công `@nexora/config`, `@nexora/shared`, `@nexora/api`, và `@nexora/web` với Vite).

---

## 5. BẢNG TỔNG HỢP TRẠNG THÁI NGHIỆM THU (ACCEPTANCE MATRIX)

| Tiêu chí nghiệm thu | Trạng thái trước | Trạng thái sau khắc phục | Bằng chứng kiểm chứng |
| :--- | :---: | :---: | :--- |
| **AC-1: Login Auto-Merge DTO Validation** | PARTIAL | **PASS** | `MergeCartResultDtoSchema.safeParse` từ chối `cart: null` và dị dạng; test `DTO-1`, `DTO-2`. |
| **AC-2: Register Auto-Merge DTO Validation** | PARTIAL | **PASS** | Đồng bộ hàm `validateMergeResult()`; test `REGISTER-FLOW`. |
| **AC-3: Immediate Retry Safety** | PASS | **PASS** | Kích hoạt đúng 1 lần khi thiếu/sai DTO; test `TC-3`, `TC-4`, `TC-5`. |
| **AC-4: Passive Retry DTO Validation** | PARTIAL | **PASS** | `safeParse` kiểm tra toàn diện cấu trúc cart; test `DTO-3`. |
| **AC-5: In-Flight Concurrency Guard** | PASS | **PASS** | `isMergingInFlight` chặn các cuộc gọi đồng thời; test `LIFECYCLE-3`. |
| **AC-6: Re-render Deduplication** | PASS | **PASS** | `passiveAttemptedRef` ngăn chặn duplicate call trên cùng 1 mount; test `LIFECYCLE-1`. |
| **AC-7: Navigation / Remount Recovery** | PARTIAL | **PASS** | Reset guard khi unmount `CartPage`; test `LIFECYCLE-2` chứng minh retry thành công không cần F5. |
| **AC-8: StrictMode Resilience** | CHƯA RÕ | **PASS** | React `StrictMode` dev mode không gọi duplicate call; test `LIFECYCLE-5`. |
| **AC-9: Cart Mutation Guard Reset** | CHƯA RÕ | **PASS** | `addItem`, `updateItem`, `removeItem` tự động mở khóa retry; test `LIFECYCLE-4`. |
| **AC-10: Absolute UI Freeze** | PASS | **PASS** | Git diff xác nhận 0 dòng thay đổi CSS/HTML layout/assets. |
| **AC-11: Backend & DB Isolation** | PASS | **PASS** | 0 tệp thay đổi trong `apps/api/**`, `prisma/**`, `packages/shared/**`. |
| **AC-12: Full Monorepo Quality Gates** | PASS | **PASS** | 239/239 tests pass, typecheck pass, lint pass, format pass, build pass. |

---

## 6. THÔNG TIN COMMIT & KẾT LUẬN

- **Commit Message (Tiếng Việt không dấu):** `fix(web): hoan thien dto validation va passive retry lifecycle m6.1`
- **Git Push Status:** **Chưa push** (Theo đúng quy tắc: chỉ commit local và chờ lệnh từ chủ dự án).
- **Kết luận:** Milestone M6.1 đã hoàn thành toàn diện cả 2 nội dung khắc phục, đạt trạng thái **FINAL PASS** tuyệt đối, sẵn sàng để chủ dự án xem xét và cấp lệnh bắt đầu Milestone M6.2.
