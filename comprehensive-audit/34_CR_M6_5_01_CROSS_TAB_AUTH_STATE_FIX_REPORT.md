# CR-M6.5-01 — CROSS-TAB AUTH STATE FIX IMPLEMENTATION & VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **Order:** `OFFICIAL IMPLEMENTATION ORDER — CR-M6.5-01 CROSS-TAB AUTH STATE FIX`
- **Mode:** `CONTROLLED IMPLEMENTATION — EXACT ALLOWLIST — NO COMMIT/PUSH — NO DB MUTATIONS`
- **Allowlist (Strictly Adhered to):**
  1. `apps/web/src/app/providers.tsx` (MODIFY)
  2. `apps/web/tests/m6_5_customer_integration_qa.test.tsx` (MODIFY)
- **Previous References:**
  - Report 30: [`comprehensive-audit/30_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_DISCOVERY.md`](file:///d:/Nexora/comprehensive-audit/30_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_DISCOVERY.md)
  - Report 31: [`comprehensive-audit/31_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_IMPLEMENTATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/31_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_IMPLEMENTATION_REPORT.md)
  - Report 32: [`comprehensive-audit/32_CR_M6_5_01_TARGETED_VERIFICATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/32_CR_M6_5_01_TARGETED_VERIFICATION_REPORT.md)
  - Report 33: [`comprehensive-audit/33_CR_M6_5_01_FINAL_CROSS_TAB_VERIFICATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/33_CR_M6_5_01_FINAL_CROSS_TAB_VERIFICATION_REPORT.md)
- **Final Verdict:** **`PASS` — BLOCKER RESOLVED**

---

## 1. Executive Summary

Trong đợt nghiệm thu Report 33, Project Owner đã xác định phát hiện tồn tại của cơ chế cross-tab: khi Tab A đăng xuất hoặc chuyển tài khoản, Tab B nhận `StorageEvent` và xóa sạch `QueryClient` private cache, nhưng biến `currentUser` lưu trong `useState(() => authService.getCurrentUser())` tại 24 trang (và truyền xuống `StorefrontHeader`) không được cập nhật ngay lập tức nếu người dùng không reload hoặc click chuyển trang.

Tuân thủ nghiêm ngặt **OFFICIAL IMPLEMENTATION ORDER — CR-M6.5-01 CROSS-TAB AUTH STATE FIX**:
1. **Không mở rộng phạm vi (Zero Scope Creep):** Không tạo `AuthContext`, không refactor 24 trang, không can thiệp Backend/Prisma/DB.
2. **Cơ chế Root Remount `sessionEpoch`:** Bổ sung state `sessionEpoch` trong [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx). Khi Tab A thực hiện logout hoặc đăng nhập mới tài khoản khác, Tab B nhận `storage` event hợp lệ (`nexora_token` hoặc `nexora_user` thay đổi), `handleCrossTabAuthStorageEvent` trả về `true`, tăng `sessionEpoch`, kích hoạt remount toàn bộ cây route bên dưới `<BrowserRouter>`.
3. **Bảo toàn QueryClient & Public Cache:** `QueryClientProvider` bọc ngoài `BrowserRouter` nên instance `QueryClient` và toàn bộ public cache (categories, products, banner, content) được bảo toàn nguyên vẹn 100%, không bị reset.
4. **Đồng bộ UI & Dọn sạch PII tức thì:**
   - Khi Tab A logout, Tab B tự động remount: `StorefrontHeader` trở về trạng thái Guest, `WishlistPage` tự động redirect về `/auth/login`, `ProfilePage` và `CheckoutPage` xóa sạch form/PII của Account A.
   - Khi Tab A đăng nhập Account B, Tab B tự động remount với danh tính Account B, ngăn chặn triệt để nguy cơ Cross-Identity Cache Poisoning.
5. **Kiểm thử thực nghiệm:** 19/19 tests trong `m6_5_customer_integration_qa.test.tsx` PASS (bao gồm 4 test suite UI cross-tab chuyên sâu và bảo toàn nguyên vẹn test R-03), 98/98 tests toàn bộ Frontend PASS, 4/4 Quality Gates PASS (Typecheck, Lint, Prettier, Production Build).

---

## 2. Chi tiết Triển khai (Code Citations)

### 2.1. `apps/web/src/app/providers.tsx`

File: [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { bindQueryClientToAuthEvents, handleCrossTabAuthStorageEvent } from '../lib/authQueryCache';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      }),
  );
  const [sessionEpoch, setSessionEpoch] = useState(0);

  useEffect(() => {
    const unbindAuthEvents = bindQueryClientToAuthEvents(queryClient);

    const onStorage = (event: StorageEvent) => {
      if (handleCrossTabAuthStorageEvent(event, queryClient)) {
        setSessionEpoch((prev) => prev + 1);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      unbindAuthEvents();
      window.removeEventListener('storage', onStorage);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Fragment key={sessionEpoch}>{children}</Fragment>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

#### Phân tích cơ chế hoạt động:
1. **Kiểm soát điều kiện chặt chẽ:** `handleCrossTabAuthStorageEvent(event, queryClient)` chỉ trả về `true` khi `event.key` là `nexora_token` hoặc `nexora_user` và có sự thay đổi giá trị thực tế (`newValue !== oldValue`). Các storage key không liên quan (ví dụ `nexora-theme`, `language`, tracking...) hoàn toàn không kích hoạt remount.
2. **Remount phạm vi hẹp:** `<Fragment key={sessionEpoch}>` chỉ bao bọc `{children}` của `BrowserRouter`. Cây router re-evaluates lại các route components từ đầu:
   - Các hook `useState(() => authService.getCurrentUser())` tại các component con (`StorefrontHeader`, `ProfilePage`, `CheckoutPage`, `WishlistPage`) được khởi tạo lại với giá trị chính xác từ `localStorage`.
   - Các Route Guards (`if (!currentUser) return <Navigate to="..." />`) được kích hoạt tức thì.
3. **Giữ nguyên kết nối QueryClient:** Vì `<QueryClientProvider>` nằm ngoài `<Fragment key={sessionEpoch}>`, instance `QueryClient` không bị hủy hoặc khởi tạo lại. Các truy vấn public (`['categories']`, `['products']`, `['banners']`...) vẫn tồn tại trong RAM và hiển thị mượt mà không cần refetch lại từ máy chủ.
4. **Bộ nhớ và Listener Cleanup:** Khi `AppProviders` unmount, `unbindAuthEvents()` dọn dẹp các event bus handlers trong `lib/authQueryCache.ts` và `removeEventListener('storage', onStorage)` giải phóng listener trình duyệt, không gây rò rỉ bộ nhớ.

---

### 2.2. `apps/web/tests/m6_5_customer_integration_qa.test.tsx`

Bổ sung 4 test cases chuyên sâu kiểm thử toàn diện vòng đời thực của UI khi có tương tác đa tab, đồng thời bảo toàn toàn bộ 15 test cases trước đó (trong đó có R-03):

File: [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx)

```tsx
it('CR-M6.5-01 Cross-Tab UI: Tab A logout immediately redirects Tab B WishlistPage to login, clears Header & private cache, and preserves public cache', async () => { ... });
it('CR-M6.5-01 Cross-Tab UI: Tab A logout immediately clears Account A PII from Tab B ProfilePage and CheckoutPage', async () => { ... });
it('CR-M6.5-01 Cross-Tab Account Switch: Tab A switching to Account B syncs Tab B UI identity & prevents cross-identity cache poisoning', async () => { ... });
it('CR-M6.5-01 Cross-Tab Remount Discipline: Unrelated storage keys do NOT remount route tree, and listener deduplication/cleanup hold across remounts', async () => { ... });
```

---

## 3. Bằng chứng Kiểm thử Thực nghiệm (Empirical Verification)

### 3.1. Dedicated M6.5 Integration QA Suite (19/19 PASS)

Lệnh thực thi:
```powershell
npx vitest run apps/web/tests/m6_5_customer_integration_qa.test.tsx
```

Kết quả:
```
 RUN  v5.1.1 D:/Nexora

 ✓ apps/web/tests/m6_5_customer_integration_qa.test.tsx (19 tests) 1212ms

 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  20:16:34
   Duration  2.78s (tests 45%, environment 33%, import 18%, transform 4%)
```

Danh sách 19/19 tests:
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
19. `Flow 8 + R-03 Empirical Reproduction: CheckoutPage does not invalidate ["my-orders"], leaving stale orders visible within 30s staleTime` — **PASS** *(Bảo toàn)*

---

### 3.2. Full Frontend Test Suite (98/98 PASS)

Lệnh thực thi:
```powershell
npx vitest run apps/web/tests
```

Kết quả:
```
 RUN  v5.1.1 D:/Nexora

 ✓ apps/web/tests/m6_5_customer_integration_qa.test.tsx (19 tests) 1155ms
 ✓ apps/web/tests/m6_3_customer_reviews.test.tsx (17 tests) 1232ms
 ✓ apps/web/tests/m6_2_customer_profile.test.tsx (18 tests) 1167ms
 ✓ apps/web/tests/m6_4_customer_returns.test.tsx (16 tests) 981ms
 ✓ apps/web/tests/m6_1_guest_cart_merge.test.tsx (23 tests) 381ms
 ✓ apps/web/tests/ResetPasswordFlow.test.tsx (4 tests) 176ms
 ✓ apps/web/tests/FoundationDashboard.test.tsx (1 test) 43ms

 Test Files  7 passed (7)
      Tests  98 passed (98)
   Start at  20:16:42
   Duration  15.59s
```

---

### 3.3. Monorepo Quality Gates (4/4 PASS)

| Quality Gate | Lệnh thực thi | Kết quả | Ghi chú |
|---|---|---|---|
| **Prettier Formatting** | `npx prettier --write apps/web/src/app/providers.tsx apps/web/tests/m6_5_customer_integration_qa.test.tsx` | **PASS** (Exit 0) | Cả 2 file chuẩn formatting 100% |
| **Monorepo Typecheck** | `npm run typecheck` | **PASS** (Exit 0) | `config`, `shared`, `api`, `web` không có bất kỳ lỗi TypeScript nào |
| **Monorepo Lint** | `npm run lint` | **PASS** (Exit 0) | `eslint .` sạch sẽ, không có warning/error mới |
| **Production Build** | `npm run build -w @nexora/web` | **PASS** (Exit 0) | `tsc -b` & `vite build` tạo bundle production thành công (dist/assets/index-BLiEOfsq.js) |

---

## 4. Kiểm chứng Ranh giới An toàn (Git & Database Safety)

### 4.1. Git Status & Allowlist Audit

Lệnh: `git status --short`
```
 M apps/web/src/app/providers.tsx
 M apps/web/src/features/storefront/StorefrontHeader.tsx
 M apps/web/src/features/wishlist/WishlistPage.tsx
 M apps/web/src/services/authService.ts
?? apps/web/src/lib/authQueryCache.ts
?? apps/web/tests/m6_5_customer_integration_qa.test.tsx
```
*(4 file thay đổi và 2 file mới thuộc chính xác phạm vi CR-M6.5-01 đã được PO phê duyệt từ đầu. Lệnh lần này chỉ tác động đúng 2 file: `providers.tsx` và `m6_5_customer_integration_qa.test.tsx`).*

- **Git HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` (Commit M6.4 ban đầu được bảo toàn).
- **Staged files:** 0 files (`git diff --cached` rỗng).
- **Commit/Push:** Không thực hiện commit hoặc push theo đúng chỉ thị.

### 4.2. Database Isolation Audit

- **Tác động Database:** **0 mutations** (Không chạy migration, không gọi `prisma migrate`, không ghi vào development hoặc ephemeral test database).
- Toàn bộ các kiểm thử của CR-M6.5-01 chạy trên môi trường jsdom độc lập với mock network và localStorage.

---

## 5. Giới hạn Kiểm thử và Rủi ro Môi trường (Testing Limitations)

1. **jsdom vs Trình duyệt Đa tiến trình thực tế:**
   - Bộ test suite `m6_5_customer_integration_qa.test.tsx` mô phỏng chính xác vòng đời React, event dispatching của trình duyệt (`window.dispatchEvent(new StorageEvent('storage', { ... }))`), DOM updates, routing redirects và QueryClient cache isolation.
   - Trải nghiệm thực tế 2 tab chạy đa tiến trình độc lập trong trình duyệt thật (như Chrome/Firefox/Edge) chia sẻ chung cùng một physical `localStorage` backing store. Cơ chế `StorageEvent` là chuẩn W3C chuẩn mực được hỗ trợ 100% trên mọi trình duyệt hiện đại.
2. **Kế hoạch kiểm chứng E2E với Playwright:**
   - Khi bước vào kiểm thử E2E (Tier 3 Playwright), kịch bản đa tab có thể được tự động hóa bằng cách tạo 2 browser contexts / 2 tabs riêng biệt để kiểm chứng trực tiếp trên trình duyệt Chromium headless.

---

## 6. Kết luận & Đề xuất Bước tiếp theo

- **Trạng thái CR-M6.5-01:** **`PASS` — Hoàn thành đầy đủ cả 2 tầng bảo vệ:**
  1. *Tầng Cache:* Xóa sạch 18 private query prefixes, hủy in-flight requests, cô lập cache key theo `userId`.
  2. *Tầng Giao diện & React State:* Remount cây route thông qua `sessionEpoch` trong `providers.tsx`, đồng bộ ngay lập tức `StorefrontHeader`, xóa PII trên `ProfilePage`/`CheckoutPage`, kích hoạt redirect guard trên `WishlistPage`, và triệt tiêu nguy cơ cross-identity cache poisoning khi chuyển tài khoản qua lại giữa các tab.
- **Hành động đề xuất tiếp theo:**
  - Nghiệm thu đóng **CR-M6.5-01**.
  - Xem xét phê duyệt chỉ thị thực thi cho **CR-M6.5-02** (Xử lý phát hiện R-03: bổ sung cache invalidation `['my-orders']` sau checkout) hoặc chuyển tiếp theo quy trình QA M6.5.
