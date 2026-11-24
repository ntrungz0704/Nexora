# CR-M6.5-02 — CHECKOUT ORDERS CACHE INVALIDATION IMPLEMENTATION & VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **Order:** `OFFICIAL IMPLEMENTATION ORDER — CR-M6.5-02 CHECKOUT ORDERS CACHE INVALIDATION`
- **Mode:** `CONTROLLED IMPLEMENTATION — EXACT ALLOWLIST — NO COMMIT/PUSH — NO DB MUTATIONS`
- **Allowlist (Strictly Adhered to):**
  1. `apps/web/src/features/checkout/CheckoutPage.tsx` (MODIFY)
  2. `apps/web/tests/m6_5_customer_integration_qa.test.tsx` (MODIFY)
- **Previous References:**
  - Report 29: [`comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md) (R-03 Initial Finding)
  - Report 34: [`comprehensive-audit/34_CR_M6_5_01_CROSS_TAB_AUTH_STATE_FIX_REPORT.md`](file:///d:/Nexora/comprehensive-audit/34_CR_M6_5_01_CROSS_TAB_AUTH_STATE_FIX_REPORT.md)
- **Final Verdict:** **`PASS` — R-03 RESOLVED**

---

## 1. Executive Summary

Trong đợt kiểm thử tích hợp M6.5 (Report 29), phát hiện **R-03** (P2 — Bug: CheckoutPage thiếu cache invalidation `['my-orders']`) đã được ghi nhận: khi khách hàng hoàn tất đặt hàng thành công tại `/checkout`, trang chỉ thực hiện invalidate cho `['cart']`, `['products']`, và `['admin-data']`. Nếu khách hàng đã mở `/profile/orders` trước đó, query `['my-orders', currentUser?.id]` vẫn còn trong trạng thái fresh (staleTime 5 phút tại production), dẫn đến việc danh sách đơn hàng không tải dữ liệu mới từ backend.

Thực hiện theo **OFFICIAL IMPLEMENTATION ORDER — CR-M6.5-02 CHECKOUT ORDERS CACHE INVALIDATION**:
1. **Tuân thủ đúng allowlist (2/2 files):** Chỉ chỉnh sửa `CheckoutPage.tsx` và cập nhật test suite `m6_5_customer_integration_qa.test.tsx`.
2. **Xử lý dứt điểm R-03:** Bổ sung `queryClient.invalidateQueries({ queryKey: ['my-orders'] });` ngay sau khi backend xác nhận tạo đơn hàng thành công (`res.ok === true`).
3. **An toàn giao dịch:** Lệnh invalidate chỉ kích hoạt khi đơn hàng đã tạo thành công. Nếu tạo đơn hàng thất bại (`res.ok === false`), ngoại lệ được ném ra trước khi tới khối invalidate, đảm bảo không có cache nào bị invalidate sai lệch.
4. **Bảo toàn toàn bộ chức năng & tests:** Giữ nguyên các invalidation cho cart, products, admin-data; bảo toàn 100% các bài kiểm thử CR-M6.5-01 và M6.5 trước đó.
5. **Kiểm thử thực nghiệm:** 20/20 tests trong `m6_5_customer_integration_qa.test.tsx` PASS, 99/99 tests toàn bộ Frontend PASS, 4/4 Quality Gates PASS (Typecheck, Lint, Prettier, Production Build).

---

## 2. Nguyên nhân Gốc rễ & Phân tích Mã nguồn (Root Cause Analysis)

### 2.1. Phân tích hiện trạng tại `CheckoutPage.tsx`

Trước khi sửa đổi, tại [`apps/web/src/features/checkout/CheckoutPage.tsx:158-166`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx#L158-L166):

```tsx
      const json = await res.json();
      const order = json.data;

      // 2. Sync Cart, Catalog Stock & Admin Dashboard
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-data'] });

      // Save order info for success page
      sessionStorage.setItem('lastOrder', ...);
```

### 2.2. Sự không đồng bộ với `ProfilePage.tsx`

Tại [`apps/web/src/features/profile/ProfilePage.tsx:439-443`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L439-L443):

```tsx
  const { data: userOrders = [], isLoading: isOrdersLoading } = useQuery<OrderDto[]>({
    queryKey: ['my-orders', currentUser?.id],
    queryFn: () => returnService.getMyOrders(),
    enabled: !!currentUser,
  });
```

- Query key của danh sách đơn hàng là `['my-orders', currentUser?.id]`.
- TanStack Query sử dụng cơ chế prefix matching mặc định khi invalidate: `queryClient.invalidateQueries({ queryKey: ['my-orders'] })` sẽ so khớp và đánh dấu stale cho tất cả các query key bắt đầu bằng `['my-orders']`, bất kể `userId` hay phân trang.
- Do thiếu lệnh này, cache `['my-orders']` vẫn giữ trạng thái cũ cho tới khi hết hạn `staleTime` (5 phút) hoặc khi người dùng tải lại trang thủ công (F5).

---

## 3. Chi tiết Triển khai (Code Changes)

### 3.1. `apps/web/src/features/checkout/CheckoutPage.tsx`

File: [`apps/web/src/features/checkout/CheckoutPage.tsx`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx)

```diff
@@ -158,10 +158,11 @@ export const CheckoutPage: React.FC = () => {
       const json = await res.json();
       const order = json.data;
 
-      // 2. Sync Cart, Catalog Stock & Admin Dashboard
+      // 2. Sync Cart, Catalog Stock, Admin Dashboard & Customer Orders
       queryClient.invalidateQueries({ queryKey: ['cart'] });
       queryClient.invalidateQueries({ queryKey: ['products'] });
       queryClient.invalidateQueries({ queryKey: ['admin-data'] });
+      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
 
       // Save order info for success page
       sessionStorage.setItem(
```

**Tính an toàn của thay đổi:**
- Vị trí bổ sung nằm ngay sau `const order = json.data;`, nghĩa là server đã phản hồi HTTP status 201 Created và dữ liệu đơn hàng hợp lệ.
- Nếu server trả lỗi (status 400, 422, 500...), dòng 153-156:
  ```tsx
  if (!res.ok) {
    const errJson = await res.json();
    throw new Error(errJson.error?.message || 'Không thể tạo đơn hàng.');
  }
  ```
  sẽ ném ra Exception, luồng chạy nhảy thẳng vào khối `catch (err: unknown)` để gán `setErrorMsg(message)`. Các lệnh invalidate hoàn toàn không được thực thi.

---

### 3.2. `apps/web/tests/m6_5_customer_integration_qa.test.tsx`

File: [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx)

1. **Cập nhật bài test Flow 8 từ tái hiện lỗi (Bug Reproduction) sang xác minh khắc phục (Fix Verification):**
   - Trước khi checkout, truy cập `/profile/orders` để làm ấm cache `['my-orders', 101]` (chứa đơn cũ `NX-2026-8801`).
   - Đặt hàng thành công đơn mới `NX-2026-NEW99`.
   - Xác nhận `queryClient.invalidateQueries` được gọi với đúng 4 key: `['cart']`, `['products']`, `['admin-data']`, và `['my-orders']`.
   - Điều hướng quay lại `/profile/orders` trong khoảng thời gian staleTime.
   - Xác nhận đơn hàng mới `NX-2026-NEW99` hiển thị ngay lập tức trên UI và số lần gọi API `/orders/my-orders` tăng từ 1 lên 2.
2. **Bổ sung bài test cho kịch bản Checkout thất bại (Failed Checkout):**
   - Mock API POST `/orders` trả về HTTP 400 Bad Request (`Sản phẩm đã hết hàng trong kho.`).
   - Thực hiện submit đặt hàng.
   - Xác nhận giao diện hiển thị thông báo lỗi.
   - Xác nhận `invalidateSpy` KHÔNG được gọi với bất kỳ query key nào (`['my-orders']`, `['cart']`, `['products']`, `['admin-data']`).

---

## 4. Bằng chứng Kiểm thử Thực nghiệm (Empirical Verification)

### 4.1. Dedicated M6.5 Integration QA Suite (20/20 PASS)

Lệnh thực thi:
```powershell
npx vitest run apps/web/tests/m6_5_customer_integration_qa.test.tsx
```

Kết quả:
```
 RUN  v5.1.1 D:/Nexora

 ✓ apps/web/tests/m6_5_customer_integration_qa.test.tsx (20 tests) 1228ms

 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  20:22:37
   Duration  2.83s (tests 45%, environment 33%, import 16%, transform 5%)
```

Danh sách 20/20 tests:
1. `Flow 1: Guest browse -> Product Detail (/product/:slug) -> Add to Cart creates guest session & invalidates cart` — **PASS**
2. `Flow 2: Guest Cart -> Login (/login) -> Auto-Merge clears guest session and invalidates cart` — **PASS**
3. `Flow 3: Authenticated Customer -> Profile -> Address CRUD invalidates customer-addresses cache` — **PASS**
4. `Flows 4 & 5: Delivered Order -> Product Detail Review Eligibility -> Create (POST) -> Edit (PUT) -> Delete (DELETE)` — **PASS**
5. `Flow 6 & 8: Orders Tab shortcut -> /profile/return -> Create Return -> List & Detail -> Invalidates returns & notifications` — **PASS**
6. `Flow 7 + CR-M6.5-01 (R-02 Fixed): Account A wishlist -> logout -> Account B login never sees A wishlist and uses identity-scoped cache` — **PASS**
7. `Flow 7 + CR-M6.5-01: Even with no new network response (pending/offline), Account B never sees Account A cached wishlist` — **PASS**
8. `Flow 7 + CR-M6.5-01: ProfilePage logout purges ALL private cache (including profile & addresses) consistently` — **PASS**
9. `CR-M6.5-01: Direct login-over-session (without clicking logout) isolates & purges previous account cache` — **PASS**
10. `CR-M6.5-01: All 18 private query prefixes are purged on logout while public catalog/content caches remain preserved` — **PASS**
11. `CR-M6.5-01: Post-logout guest cart does not inherit Account A private cart data` — **PASS**
12. `CR-M6.5-01: Cross-tab storage logout event clears Tab B private cache without wiping public cache or reacting to unrelated keys` — **PASS**
13. `CR-M6.5-01 Cross-Tab UI: Tab A logout immediately redirects Tab B WishlistPage to login, clears Header & private cache, and preserves public cache` — **PASS**
14. `CR-M6.5-01 Cross-Tab UI: Tab A logout immediately clears Account A PII from Tab B ProfilePage and CheckoutPage` — **PASS**
15. `CR-M6.5-01 Cross-Tab Account Switch: Tab A switching to Account B syncs Tab B UI identity & prevents cross-identity cache poisoning` — **PASS**
16. `CR-M6.5-01 Cross-Tab Remount Discipline: Unrelated storage keys do NOT remount route tree, and listener deduplication/cleanup hold across remounts` — **PASS**
17. `CR-M6.5-01: In-flight private requests from Account A never re-populate cache when resolving after logout` — **PASS**
18. `CR-M6.5-01: WeakMap reference-counted binding prevents duplicate listeners and safely handles nested mount/unmount` — **PASS**
19. `Flow 8 + CR-M6.5-02 (R-03 Fixed): CheckoutPage invalidates ["my-orders"], ensuring new order immediately appears in order history` — **PASS**
20. `CR-M6.5-02: Failed checkout does NOT invalidate ["my-orders"] or other caches` — **PASS**

---

### 4.2. Full Frontend Test Suite (99/99 PASS)

Lệnh thực thi:
```powershell
npx vitest run apps/web/tests
```

Kết quả:
```
 RUN  v5.1.1 D:/Nexora

 ✓ apps/web/tests/m6_3_customer_reviews.test.tsx (17 tests) 1171ms
 ✓ apps/web/tests/m6_5_customer_integration_qa.test.tsx (20 tests) 1200ms
 ✓ apps/web/tests/m6_2_customer_profile.test.tsx (18 tests) 1316ms
 ✓ apps/web/tests/m6_4_customer_returns.test.tsx (16 tests) 991ms
 ✓ apps/web/tests/m6_1_guest_cart_merge.test.tsx (23 tests) 403ms
 ✓ apps/web/tests/ResetPasswordFlow.test.tsx (4 tests) 179ms
 ✓ apps/web/tests/FoundationDashboard.test.tsx (1 test) 45ms

 Test Files  7 passed (7)
      Tests  99 passed (99)
   Start at  20:22:51
   Duration  15.68s
```

---

### 4.3. Monorepo Quality Gates (4/4 PASS)

| Quality Gate | Lệnh thực thi | Kết quả | Ghi chú |
|---|---|---|---|
| **Prettier Formatting** | `npx prettier --write apps/web/src/features/checkout/CheckoutPage.tsx apps/web/tests/m6_5_customer_integration_qa.test.tsx` | **PASS** (Exit 0) | Đúng 2 file allowlist chuẩn formatting 100% |
| **Monorepo Typecheck** | `npm run typecheck` | **PASS** (Exit 0) | `config`, `shared`, `api`, `web` hoàn toàn không có lỗi kiểu dữ liệu |
| **Monorepo Lint** | `npm run lint` | **PASS** (Exit 0) | `eslint .` sạch sẽ, không có warning hay error |
| **Production Build** | `npm run build -w @nexora/web` | **PASS** (Exit 0) | Vite build production thành công (`dist/assets/index-BGv7BAM2.js`) |

---

## 5. Kiểm chứng Ranh giới An toàn (Git & Database Safety)

### 5.1. Git Status & Allowlist Audit

Lệnh: `git status --short`
```
 M apps/web/src/app/providers.tsx
 M apps/web/src/features/checkout/CheckoutPage.tsx
 M apps/web/src/features/storefront/StorefrontHeader.tsx
 M apps/web/src/features/wishlist/WishlistPage.tsx
 M apps/web/src/services/authService.ts
?? apps/web/src/lib/authQueryCache.ts
?? apps/web/tests/m6_5_customer_integration_qa.test.tsx
```

- Các file thay đổi tracked và untracked thuộc chính xác phạm vi CR-M6.5-01 và CR-M6.5-02 đã được Project Owner phê duyệt. Lệnh lần này chỉ sửa đúng 2 file:
  - `apps/web/src/features/checkout/CheckoutPage.tsx`
  - `apps/web/tests/m6_5_customer_integration_qa.test.tsx`
- **Git HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` (Commit M6.4 ban đầu được bảo toàn).
- **Staged files:** 0 files (`git diff --cached` hoàn toàn rỗng).
- **Commit/Push:** Không thực hiện commit hoặc push.

### 5.2. Database Isolation Audit

- **Tác động Database:** **0 mutations** (Không chạy migration, không gọi `prisma migrate`, không ghi vào development hoặc ephemeral test database).
- Toàn bộ các kiểm thử chạy trên môi trường jsdom độc lập với mock network và localStorage.

---

## 6. Kết luận & Đề xuất Bước tiếp theo

- **Trạng thái CR-M6.5-02:** **`PASS` — R-03 RESOLVED TRIỆT ĐỂ**
  - Khách hàng sau khi đặt hàng thành công tại `/checkout` sẽ luôn nhận được dữ liệu mới nhất khi chuyển sang trang danh sách đơn hàng (`/profile/orders` hoặc `/orders`).
  - Giao dịch thất bại không kích hoạt bất kỳ invalidation sai lệch nào.
  - Các invalidation hiện có (`['cart']`, `['products']`, `['admin-data']`) được bảo toàn 100%.
- **Hành động đề xuất tiếp theo:**
  - Nghiệm thu đóng **CR-M6.5-02**.
  - Xem xét chỉ thị cho **CR-M6.5-03** (Xử lý phát hiện E2E Journey 8 trong Playwright) hoặc chỉ thị tiếp theo từ Project Owner.
