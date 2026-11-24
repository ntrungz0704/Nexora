# BÁO CÁO XÁC MINH NGHIỆM THU CUỐI CÙNG M6.1 (FINAL CLOSURE VERIFICATION)

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Milestone:** M6.1 — API Integration Foundation & Guest Cart Merge
- **Ngày xác minh:** 2026-11-22
- **Trạng thái:** **FINAL PASS, CLOSED**
- **Branch:** `main`
- **Quy tắc tuân thủ:** Không sửa code, không refactor, không tạo commit mới, không push lên remote, không tự ý chuyển sang M6.2.

---

## 1. GIT VERIFICATION

### 1.1. Kết quả thực thi các lệnh Git

#### `git rev-parse HEAD`
```
4c6c261cd6b8c0e72286449df052da4fd2ca9646
```

#### `git rev-parse HEAD^`
```
9880019dca649483ddcba8fce8736642006ba2c8
```

#### `git status --short`
```
(empty output - working tree completely clean)
```

#### `git show --stat --oneline HEAD`
```
4c6c261 fix(web): hoan thien dto validation va passive retry lifecycle m6.1
 M6_1_FINAL_ACCEPTANCE_CLARIFICATION.md        | 169 +++++++++
 M6_1_POST_IMPLEMENTATION_VERIFICATION.md      | 472 ++++++++++++++++++++++++++
 M6_1_TARGETED_ACCEPTANCE_FIX_REPORT.md        | 184 ++++++++++
 apps/web/src/features/cart/CartPage.tsx       |  24 +-
 apps/web/src/services/authService.ts          |  65 ++--
 apps/web/src/services/cartService.ts          |  27 +-
 apps/web/tests/m6_1_guest_cart_merge.test.tsx | 305 ++++++++++++++++-
 7 files changed, 1193 insertions(+), 53 deletions(-)
```

#### `git diff --name-status a307dd382a127e7ec47d74258c8d6b236e47b513..HEAD`
```
A	M6_0_FINAL_FUNCTIONAL_VERIFICATION_AND_SCOPE.md
A	M6_0_M6_1_PRE_IMPLEMENTATION_VERIFICATION.md
A	M6_1_FINAL_ACCEPTANCE_CLARIFICATION.md
A	M6_1_GUEST_CART_MERGE_FAILURE_SAFETY_REVIEW.md
A	M6_1_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md
A	M6_1_POST_IMPLEMENTATION_VERIFICATION.md
A	M6_1_TARGETED_ACCEPTANCE_FIX_REPORT.md
A	M6_FRONTEND_DISCOVERY_AND_TECHPILOT_PARITY_AUDIT.md
M	apps/web/src/features/auth/LoginPage.tsx
M	apps/web/src/features/auth/RegisterPage.tsx
M	apps/web/src/features/cart/CartPage.tsx
M	apps/web/src/features/storefront/AuthModal.tsx
M	apps/web/src/services/authService.ts
M	apps/web/src/services/cartService.ts
A	apps/web/tests/m6_1_guest_cart_merge.test.tsx
```

### 1.2. Xác nhận
- Commit `4c6c261cd6b8c0e72286449df052da4fd2ca9646` là commit khắc phục mới nhất trên branch `main`.
- Parent commit là `9880019dca649483ddcba8fce8736642006ba2c8` (commit triển khai M6.1 ban đầu).
- Toàn bộ commit so với baseline `a307dd382a127e7ec47d74258c8d6b236e47b513` chỉ bao gồm tài liệu đối soát M6.0/M6.1 và mã nguồn Frontend trong `apps/web/`, hoàn toàn không có thay đổi nào ngoài phạm vi M6.1.

**Kết luận Mục 1: PASS**

---

## 2. REACT STRICTMODE & PASSIVE RETRY LIFECYCLE VERIFICATION

### 2.1. Phân tích chi tiết cơ chế bảo vệ kép (Dual-Layer Guard)

Người dùng đã đặt câu hỏi chính xác về nguy cơ khi React `StrictMode` thực hiện chu trình:
1. Mount component $\rightarrow$ 2. Chạy effect $\rightarrow$ 3. Cleanup effect $\rightarrow$ 4. Chạy lại effect trong dev mode.
Nếu cleanup gọi `resetPassiveMergeGuard()` trong khi request trước đang in-flight, liệu effect tiếp theo có kích hoạt thêm 1 request trùng lặp không?

**Câu trả lời kỹ thuật từ mã nguồn thực tế:**
Hệ thống sử dụng **cơ chế bảo vệ 2 lớp độc lập**:

1. **Lớp 1 — Component Ref Layer (`CartPage.tsx`)**:
   ```tsx
   const passiveAttemptedRef = useRef(false);
   ```
   Trong React 18/19 StrictMode, component instance, internal state và các `useRef` **được bảo toàn nguyên vẹn** qua chu trình unmount/remount giả lập của dev mode.
   - Mount 1: `passiveAttemptedRef.current` chuyển từ `false` $\rightarrow$ `true`.
   - Cleanup 1: Chạy cleanup của lifecycle.
   - Mount 2: Effect chạy lại, gặp điều kiện kiểm tra:
     ```tsx
     if (passiveAttemptedRef.current) return;
     ```
     Vì `passiveAttemptedRef.current` đã là `true`, effect kết thúc ngay lập tức tại dòng kiểm tra này mà **không gọi `attemptPassiveCartMerge()`**.

2. **Lớp 2 — Service In-Flight Lock Layer (`cartService.ts`)**:
   Ngay cả trong tình huống giả định (nếu không có `useRef` hoặc ref bị reset), `cartService.ts` có cơ chế bảo vệ độc lập:
   ```typescript
   export function resetPassiveMergeGuard(): void {
     lastAttemptedSessionId = null;
     lastAttemptFailed = false;
   }
   ```
   Hàm `resetPassiveMergeGuard()` **TUYỆT ĐỐI KHÔNG CAN THIỆP VÀO `isMergingInFlight`**.
   Biến `isMergingInFlight` chỉ được quản lý duy nhất bởi khối `try...finally` của `attemptPassiveCartMerge`:
   ```typescript
   if (isMergingInFlight) return null; // Chặn ngay lập tức
   isMergingInFlight = true;
   try { ... } finally { isMergingInFlight = false; }
   ```
   Do đó, trong khi request đầu tiên đang in-flight, bất kỳ lời gọi nào khác tới `attemptPassiveCartMerge` đều bị chặn tức thì và trả về `null`.

### 2.2. Bằng chứng kiểm thử thực tế (Test Code & Assertions)

Tất cả các hành vi trên đều được kiểm chứng bằng test tự động thực tế trong `apps/web/tests/m6_1_guest_cart_merge.test.tsx`:

#### Test 1: React.StrictMode không kích hoạt duplicate request (`LIFECYCLE-5`)
- **Tên test:** `LIFECYCLE-5: React.StrictMode không kích hoạt duplicate merge requests ngoài ý muốn`
- **Source code kiểm chứng:**
```tsx
it('LIFECYCLE-5: React.StrictMode không kích hoạt duplicate merge requests ngoài ý muốn', async () => {
  const queryClient = new QueryClient();
  localStorage.setItem(GUEST_SESSION_KEY, 'guest_strict_mode_session');
  localStorage.setItem('nexora_token', 'jwt-token-strict');
  localStorage.setItem('nexora_user', JSON.stringify(mockUser));

  const passiveSpy = vi
    .spyOn(cartService, 'attemptPassiveCartMerge')
    .mockResolvedValueOnce(mockMergeResult);

  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );

  await waitFor(() => {
    // Trong React.StrictMode, mặc dù effect bị double-invoked trong dev mode,
    // passiveAttemptedRef ngăn chặn việc gọi attemptPassiveCartMerge 2 lần!
    expect(passiveSpy).toHaveBeenCalledTimes(1);
  });
});
```
- **Assertion:** `expect(passiveSpy).toHaveBeenCalledTimes(1)` $\rightarrow$ **PASS**.

#### Test 2: In-flight guard ngăn chặn gọi đồng thời khi đang có request (`LIFECYCLE-3`)
- **Tên test:** `LIFECYCLE-3: In-flight guard ngăn chặn gọi đồng thời khi một request merge đang diễn ra`
- **Source code kiểm chứng:**
```tsx
it('LIFECYCLE-3: In-flight guard ngăn chặn gọi đồng thời khi một request merge đang diễn ra', async () => {
  const testGuestId = 'guest_inflight_test';
  localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

  let resolvePromise: (value: MergeCartResultDto) => void;
  const delayedPromise = new Promise<MergeCartResultDto>((resolve) => {
    resolvePromise = resolve;
  });

  vi.spyOn(cartService, 'mergeCart').mockReturnValueOnce(delayedPromise);

  // Gọi lần 1: bắt đầu request (đang in-flight)
  const call1 = cartService.attemptPassiveCartMerge('valid-token');

  // Gọi lần 2: khi lần 1 chưa kết thúc
  const call2 = cartService.attemptPassiveCartMerge('valid-token');

  // Call 2 phải bị từ chối ngay lập tức do in-flight guard
  const result2 = await call2;
  expect(result2).toBeNull();

  // Cho call 1 hoàn thành
  resolvePromise!(mockMergeResult);
  const result1 = await call1;
  expect(result1).toEqual(mockMergeResult);
  expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
});
```
- **Assertion:** `expect(result2).toBeNull()` và `expect(result1).toEqual(mockMergeResult)` $\rightarrow$ **PASS**.

#### Test 3: Rời khỏi CartPage và mở lại trong cùng SPA cho phép retry mới không cần F5 (`LIFECYCLE-2`)
- **Tên test:** `LIFECYCLE-2: Cho phép thử lại khi người dùng rời khỏi CartPage (unmount) và quay lại (mount mới) mà không cần F5`
- **Source code kiểm chứng:**
```tsx
it('LIFECYCLE-2: Cho phép thử lại khi người dùng rời khỏi CartPage (unmount) và quay lại (mount mới) mà không cần F5', async () => {
  const queryClient = new QueryClient();
  const testGuestId = 'guest_lifecycle_remount';
  localStorage.setItem(GUEST_SESSION_KEY, testGuestId);
  localStorage.setItem('nexora_token', 'jwt-token-remount');
  localStorage.setItem('nexora_user', JSON.stringify(mockUser));

  // Lần mount 1: Thất bại do lỗi mạng
  const mergeSpy = vi
    .spyOn(cartService, 'mergeCart')
    .mockRejectedValueOnce(new Error('Network temporary failure'))
    .mockResolvedValueOnce(mockMergeResult);

  // 1. User truy cập /cart lần đầu
  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  await waitFor(() => {
    expect(mergeSpy).toHaveBeenCalledTimes(1);
  });
  expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId);

  // 2. User rời khỏi CartPage (unmount component)
  unmount();

  // 3. User quay lại /cart trong cùng một phiên SPA (mount mới)
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  // Lần mount mới BẮT BUỘC phải được phép kích hoạt retry mới!
  await waitFor(() => {
    expect(mergeSpy).toHaveBeenCalledTimes(2);
  });

  expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
});
```
- **Assertion:** `expect(mergeSpy).toHaveBeenCalledTimes(2)` $\rightarrow$ **PASS**.

#### Test 4: Re-render trên cùng một mount không gọi lại API (`LIFECYCLE-1`)
- **Tên test:** `LIFECYCLE-1: Chặn duplicate call khi CartPage re-render trong cùng một lần mount`
- **Assertion:** `expect(passiveSpy).toHaveBeenCalledTimes(1)` sau khi gọi `rerender(<CartPage />)` $\rightarrow$ **PASS**.

**Kết luận Mục 2: PASS**

---

## 3. DTO VALIDATION VERIFICATION

### 3.1. Trích dẫn mã nguồn thực tế

#### A. Hàm chuẩn hóa validateMergeResult() sử dụng `MergeCartResultDtoSchema.safeParse()`
(`apps/web/src/services/authService.ts`, dòng 20-24):
```typescript
function validateMergeResult(data: unknown): MergeCartResultDto | null {
  if (!data || typeof data !== 'object') return null;
  const parsed = MergeCartResultDtoSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
```

#### B. Áp dụng cho Auth Response và Immediate Retry trong `login()`
(`apps/web/src/services/authService.ts`, dòng 47-66):
```typescript
    if (guestSessionId) {
      const validMergeResult = validateMergeResult(session.cartMerge);

      if (validMergeResult) {
        // Backend Auto-Merge thành công với DTO hợp lệ -> xóa guest session an toàn
        cartService.clearGuestSession();
        session.cartMerge = validMergeResult;
      } else {
        // Backend Auto-Merge thất bại hoặc DTO không hợp lệ -> Kích hoạt đúng 1 lần Immediate Retry
        try {
          const retryRaw = await cartService.mergeCart(guestSessionId);
          const validRetryResult = validateMergeResult(retryRaw);
          if (validRetryResult) {
            cartService.clearGuestSession();
            session.cartMerge = validRetryResult;
          }
        } catch {
          // Immediate retry thất bại -> Bảo toàn nexora_guest_session trong localStorage cho Passive Retry
        }
      }
    }
```

#### C. Áp dụng cho Auth Response và Immediate Retry trong `register()`
(`apps/web/src/services/authService.ts`, dòng 90-109):
```typescript
    if (guestSessionId) {
      const validMergeResult = validateMergeResult(session.cartMerge);

      if (validMergeResult) {
        cartService.clearGuestSession();
        session.cartMerge = validMergeResult;
      } else {
        try {
          const retryRaw = await cartService.mergeCart(guestSessionId);
          const validRetryResult = validateMergeResult(retryRaw);
          if (validRetryResult) {
            cartService.clearGuestSession();
            session.cartMerge = validRetryResult;
          }
        } catch {
          // Immediate retry thất bại -> Bảo toàn nexora_guest_session cho Passive Retry
        }
      }
    }
```

#### D. Áp dụng cho Passive Retry Response trong `attemptPassiveCartMerge()`
(`apps/web/src/services/cartService.ts`, dòng 87-104):
```typescript
  try {
    const rawResult = await cartService.mergeCart(guestSessionId);
    const parsed = MergeCartResultDtoSchema.safeParse(rawResult);

    if (parsed.success) {
      clearGuestSession();
      lastAttemptFailed = false;
      return parsed.data;
    }

    // DTO trả về không hợp lệ (ví dụ: cart null, thiếu items, sai kiểu dữ liệu)
    lastAttemptFailed = true;
    return null;
  } catch {
    lastAttemptFailed = true;
    // Tuyệt đối không xóa session khi thất bại
    return null;
  } finally {
    isMergingInFlight = false;
  }
```

### 3.2. Bằng chứng kiểm chứng DTO dị dạng và `mergedItemsCount = 0`

- **Test `DTO-1`:** Từ chối `{ mergedItemsCount: 0, cart: null }` và `{ mergedItemsCount: 2, cart: "invalid_string" }` $\rightarrow$ `expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId)` (Bảo toàn session thành công).
- **Test `DTO-2`:** Chấp nhận `{ cart: { items: [], totalItems: 0, subtotal: '0' }, mergedItemsCount: 0, adjustedItemsCount: 0, warnings: [] }` $\rightarrow$ `expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull()` (Xóa session an toàn khi DTO hoàn toàn hợp lệ).
- **Test `DTO-3`:** Passive retry kiểm tra DTO thiếu cấu trúc qua `safeParse` $\rightarrow$ Trả về `null` và bảo toàn `nexora_guest_session`.

**Kết luận Mục 3: PASS**

---

## 4. GIT SCOPE & BẢO TOÀN DỰ ÁN

### 4.1. Kiểm tra các thư mục được bảo vệ (Protected Areas)
Lệnh kiểm tra:
```bash
git diff --stat a307dd382a127e7ec47d74258c8d6b236e47b513..HEAD -- apps/api prisma packages/shared TechPilot audit-output
```
**Kết quả thực tế:** Không có bất kỳ tệp tin nào bị thay đổi (**0 files changed, 0 insertions, 0 deletions**).
- `apps/api/**`: 100% nguyên vẹn.
- `prisma/**`: 100% nguyên vẹn.
- `packages/shared/**`: 100% nguyên vẹn (dùng schema có sẵn).
- `TechPilot/**`: 100% read-only.
- `audit-output/**`: 100% nguyên vẹn.

### 4.2. Kiểm tra Absolute UI Freeze
Lệnh kiểm tra:
```bash
git diff a307dd382a127e7ec47d74258c8d6b236e47b513..HEAD -- apps/web/src/features/
```
**Kết quả thực tế:**
- Các trang UI (`LoginPage.tsx`, `RegisterPage.tsx`, `AuthModal.tsx`): Chỉ thêm đúng lệnh `queryClient.invalidateQueries({ queryKey: ['cart'] })` trong callback xử lý đăng nhập/đăng ký thành công.
- Trang `CartPage.tsx`: Chỉ thêm 2 hooks `useRef` và 2 hooks `useEffect` để quản lý lifecycle và retry.
- **Hoàn toàn không có bất kỳ thay đổi nào đối với cấu trúc HTML/JSX markup, CSS, style inline hay class Tailwind CSS.**

**Kết luận Mục 4: PASS**

---

## 5. TỔNG HỢP KẾT LUẬN TỪNG HẠNG MỤC

| Hạng mục xác minh | Kết luận | Bằng chứng đối soát |
| :--- | :---: | :--- |
| **1. Git Verification** | **PASS** | `HEAD` = `4c6c261cd6b8c0e72286449df052da4fd2ca9646`, working tree clean, diff chỉ gồm tài liệu M6 và `apps/web`. |
| **2. React StrictMode Verification** | **PASS** | Kiểm chứng qua test `LIFECYCLE-5` (`<StrictMode>`), bảo vệ 2 lớp (Ref + `isMergingInFlight`), `LIFECYCLE-1, 2, 3`. |
| **3. DTO Validation Verification** | **PASS** | `MergeCartResultDtoSchema.safeParse()` áp dụng đầy đủ cho Auth response, Immediate Retry, Passive Retry; test `DTO-1, 2, 3`. |
| **4. Git Scope & Project Preservation** | **PASS** | `apps/api`, `prisma`, `packages/shared`, `TechPilot`, `audit-output` 0 diff; Absolute UI Freeze giữ nguyên 100%. |

---

## 6. KẾT LUẬN & TRẠNG THÁI NGHIỆM THU

Milestone **M6.1 — API Integration Foundation & Guest Cart Merge** đã vượt qua toàn diện mọi bước xác minh cuối cùng với đầy đủ bằng chứng mã nguồn và kết quả kiểm thử thực tế.

- **Trạng thái chính thức:** **FINAL PASS, CLOSED.**
- **Hành động tiếp theo:** Giữ nguyên commit `4c6c261`, không push lên remote, sẵn sàng chuyển sang **Milestone M6.2 — Core Storefront Integration** khi nhận được lệnh chính thức từ chủ dự án.
