# CR-M6.5-01 — PRIVATE QUERY CACHE ISOLATION (R-02)
## IMPLEMENTATION & VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` *(unchanged — no commit/push)*
- **Priority:** `P0 — SECURITY BLOCKER (R-02)`
- **Execution Mode:** `CONTROLLED IMPLEMENTATION — EXACT ALLOWLIST (6 FILES)`
- **Discovery Reference:** [`comprehensive-audit/30_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_DISCOVERY.md`](file:///d:/Nexora/comprehensive-audit/30_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_DISCOVERY.md)
- **Final Status:** **`PASS`**

---

## 1. Root Cause và Remediation Summary

### Root Cause (đã xác minh ở Discovery 30)
- `authService.logout()` chỉ xóa `nexora_token` và `nexora_user` trong `localStorage` mà không phát sự kiện đồng bộ cho `QueryClient` singleton (`staleTime: 30_000`, `gcTime: 300_000`).
- 19/24 file gọi `authService.logout()` (gồm `WishlistPage`, `AdminDashboardPage` kể cả 401/403 auto-logout, `CheckoutPage`, ...) không hề xóa bất kỳ TanStack Query cache nào; `login()`/`register()` chỉ `invalidateQueries(['cart'])` nên login-over-session trực tiếp cũng giữ nguyên private cache cũ.
- `WishlistPage.tsx` khai báo `queryKey: ['wishlist']` không gắn `currentUser?.id`, khiến Account B đăng nhập trong cửa sổ `30s` nhận trực tiếp cache wishlist riêng tư của Account A với `0` API request mới.

### Remediation 2 lớp đã triển khai
1. **Lớp 1 — Centralized Private Cache Registry & Auth Event Bus:**
   - Tạo [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts) với registry chuẩn 18 `PRIVATE_QUERY_KEY_PREFIXES`, hàm `clearPrivateQueryCache(queryClient)` (`cancelQueries(..., { silent: true })` đồng bộ trước `removeQueries(...)`), event bus `LOGOUT`/`LOGIN`/`REGISTER`/`SESSION_CHANGED`, binding dùng **`WeakMap` reference-counted** chống đăng ký listener trùng, và handler `storage` liên tab.
   - Phát sự kiện tập trung tại `authService.logout()`, `authService.login()`, `authService.register()`, kèm xóa `sessionStorage['lastOrder']` và gọi `cartService.resetPassiveMergeGuard()`.
   - Gắn root `QueryClient` + cross-tab `storage` listener trong [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx), và gắn `useAuthQueryCacheSync()` idempotent trong [`apps/web/src/features/storefront/StorefrontHeader.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx).
2. **Lớp 2 — Identity-Scoped Private Query Key:**
   - Chuyển [`apps/web/src/features/wishlist/WishlistPage.tsx`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L39) từ `['wishlist']` sang `['wishlist', currentUser?.id]` (giữ nguyên `enabled: !!currentUser` và tương thích prefix-matching với `invalidateQueries({ queryKey: ['wishlist'] })`).

---

## 2. Exact Changed Files (Chính xác 6/6 File Allowlist)

| # | File Path | Trạng thái Git | Tóm tắt thay đổi thực tế |
|---|---|---|---|
| 1 | [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts) | **NEW** (`??`) | Registry 18 private query prefixes, `clearPrivateQueryCache`, auth session pub/sub, `WeakMap` ref-counted `bindQueryClientToAuthEvents`, `handleCrossTabAuthStorageEvent`, `useAuthQueryCacheSync`. |
| 2 | [`apps/web/src/services/authService.ts`](file:///d:/Nexora/apps/web/src/services/authService.ts) | **MODIFY** (`M`) | Phát sự kiện `LOGOUT` / `LOGIN` / `REGISTER`, xóa `sessionStorage['lastOrder']`, gọi `cartService.resetPassiveMergeGuard()`, bảo toàn nguyên vẹn luồng Guest Cart Merge. |
| 3 | [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx) | **MODIFY** (`M`) | Bind root `QueryClient` qua `bindQueryClientToAuthEvents(queryClient)` và đăng ký `window.addEventListener('storage', ...)` kèm cleanup đầy đủ khi unmount. |
| 4 | [`apps/web/src/features/storefront/StorefrontHeader.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx) | **MODIFY** (`M`) | Gọi `useAuthQueryCacheSync()` (idempotent nhờ `WeakMap` ref-counting) để hỗ trợ cả các render/test context gắn `QueryClientProvider` trực tiếp không qua `AppProviders`. |
| 5 | [`apps/web/src/features/wishlist/WishlistPage.tsx`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx) | **MODIFY** (`M`) | Đổi `queryKey: ['wishlist']` → `queryKey: ['wishlist', currentUser?.id]` (giữ `enabled: !!currentUser`, không dùng userId giả). |
| 6 | [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx) | **MODIFY** (`??` M6.5) | Cập nhật R-02/R-02B sang regression asserts và bổ sung đầy đủ bộ regression tests (15/15 PASS); giữ nguyên test R-03 cho `CR-M6.5-02`. |

**Xác nhận:** 0 file ngoài allowlist bị chỉnh sửa; 0 thay đổi Backend, API, Prisma, migrations, dependencies hay database.

---

## 3. Private Query Key Registry

Định nghĩa typed tại [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L10-L31):

- **Customer private prefixes (10):** `'cart'`, `'wishlist'`, `'wishlist-count'`, `'profile'`, `'my-orders'`, `'customer-addresses'`, `'notifications'`, `'customer-returns'`, `'customer-return-detail'`, `'review-eligibility'`.
- **Admin/Staff private prefixes (8):** `'admin-data'`, `'admin-brands'`, `'admin-coupons'`, `'admin-flash-sales'`, `'admin-banners'`, `'admin-posts'`, `'admin-users'`, `'admin-reviews'`.
- **Public queries được loại trừ có chủ đích (bảo toàn 100%):** `'categories'`, `'products'`, `'products-full-catalog'`, `'product-detail'`, `'product-reviews'`, `'reviews'`, `'active-flash-sale'`, `'brands'`, `'posts'`, `'post-detail'`, `'banners'`, `'live-search'`, `'active-coupons'`, `'system'`.

### Thứ tự dọn dẹp chống Race Condition (đối chiếu trực tiếp `@tanstack/query-core`)
```ts
for (const prefix of PRIVATE_QUERY_KEY_PREFIXES) {
  void queryClient.cancelQueries({ queryKey: [prefix] }, { silent: true });
  queryClient.removeQueries({ queryKey: [prefix] });
}
```
1. `cancelQueries(..., { silent: true })` chạy `query.cancel({ revert: true, silent: true })` **đồng bộ** trong `notifyManager.batch`, hủy `Retryer` của các request đang bay để kết quả trả về muộn không bao giờ gọi `onSuccess`.
2. `removeQueries` chạy **đồng bộ** ngay kế tiếp, tách và xóa hẳn `Query` khỏi `QueryCache` nhằm loại bỏ cả stale-while-revalidate flash.

---

## 4. Logout / Auth Event Architecture & Dependency Graph Check

- **Event semantics:** `AuthSessionEventType = 'LOGOUT' | 'LOGIN' | 'REGISTER' | 'SESSION_CHANGED'` mang payload `{ type, previousUserId, nextUserId }`.
- **`WeakMap` Reference Counting (thay cho `WeakSet`):** `boundQueryClients = new WeakMap<QueryClient, { refCount: number; unsubscribe: () => void }>()`.
  - Khi cả `AppProviders` và `StorefrontHeader` cùng bind một `QueryClient`, chỉ đăng ký đúng **1** listener (`refCount = 2`).
  - Khi `StorefrontHeader` unmount lúc chuyển trang, `refCount` giảm về `1` nên root binding của `AppProviders` **không bị gỡ sớm**.
  - Khi `refCount === 0`, listener được gỡ sạch và xóa khỏi `WeakMap`; hàm `release()` bảo vệ bằng cờ `released` (gọi lặp nhiều lần vẫn an toàn).
- **Kiểm tra Dependency Graph (`authService` ↔ `cartService`):**
  - `authService.ts` đã import `cartService.ts` từ trước; `cartService.ts` chỉ import `apiClient` và `@nexora/shared` (không import `authService`).
  - Đồ thị phụ thuộc là DAG một chiều `authService -> cartService -> apiClient`, **0 circular dependency**.

---

## 5. Cross-Tab Synchronization

Triển khai tại [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L120-L133) (`handleCrossTabAuthStorageEvent`) và gắn tại [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx#L21-L32):
- Chỉ kích hoạt khi `event.key === null` (`localStorage.clear()`) hoặc `AUTH_STORAGE_KEYS.has(event.key)` (`'nexora_token'`, `'nexora_user'`).
- Bỏ qua các storage key không liên quan (ví dụ `'nexora-theme'`) và bỏ qua ghi no-op (`oldValue === newValue`).
- Chỉ gọi `clearPrivateQueryCache(queryClient)` mà **không ghi ngược vào `localStorage`**, đảm bảo **0 event loop giữa các tab** và bảo toàn public cache.

---

## 6. Guest Cart Merge Compatibility

- `authService.logout()` và `clearPrivateQueryCache()` **tuyệt đối không** xóa `nexora_guest_session` (`GUEST_SESSION_KEY`).
- Trong `authService.login()` và `register()`: gọi `cartService.resetPassiveMergeGuard()`, giữ nguyên 100% logic auto-merge, `MergeCartResultDtoSchema.safeParse()`, immediate retry 1 lần và bảo toàn `nexora_guest_session` khi thất bại cho passive retry; chỉ phát `emitAuthSessionChange('LOGIN' | 'REGISTER')` sau khi lưu session và hoàn tất bước merge.
- Toàn bộ **23/23 tests** trong [`apps/web/tests/m6_1_guest_cart_merge.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_1_guest_cart_merge.test.tsx) đều **PASS** không chỉnh sửa bất kỳ dòng nào.

---

## 7. Regression Test Cases & Kết quả (`m6_5_customer_integration_qa.test.tsx` — 15/15 PASS)

Toàn bộ 15 test cases trong [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx) đều **100% DB-free** (`jsdom` + mocked HTTP), kiểm tra trực tiếp cả **cache contents (`queryClient.getQueryData`)** lẫn **UI state (`screen`)**:

| # | Test Case | Kịch bản yêu cầu | Kết quả |
|---|---|---|---|
| 1 | Flow 1: Guest browse → Product Detail → Add to Cart | Guest Cart intact | **`PASS`** |
| 2 | Flow 2: Guest Cart → Login → Auto-Merge clears guest session & invalidates cart | Guest Cart Merge intact (#7) | **`PASS`** |
| 3 | Flow 3: Profile → Address CRUD invalidates `customer-addresses` | Profile/Addresses intact | **`PASS`** |
| 4 | Flows 4 & 5: Delivered Order → Review Eligibility → POST/PUT/DELETE | Reviews intact | **`PASS`** |
| 5 | Flow 6 & 8: Orders → `/profile/return` → Create/List/Detail | Returns intact | **`PASS`** |
| 6 | **Flow 7 + CR-M6.5-01 (R-02 Fixed):** Account A wishlist → logout → Account B login never sees A wishlist & uses `['wishlist', userB.id]` | Scenarios #1, #11 | **`PASS`** |
| 7 | **Flow 7 + CR-M6.5-01:** Even with no new network response (pending/offline), Account B never sees Account A cached wishlist | Scenario #2 | **`PASS`** |
| 8 | **Flow 7 + CR-M6.5-01:** ProfilePage logout purges ALL private cache (including `profile`, `customer-addresses`, `notifications`, `my-orders`, `customer-returns`) | Scenario #4 | **`PASS`** |
| 9 | **CR-M6.5-01:** Direct login-over-session (without clicking logout) purges previous session private cache & `sessionStorage['lastOrder']`, preserves public cache | Scenario #3 | **`PASS`** |
| 10 | **CR-M6.5-01:** All 18 private query prefixes purged on logout while 9 public catalog/content caches remain preserved | Scenarios #8, #9 | **`PASS`** |
| 11 | **CR-M6.5-01:** Post-logout guest cart does not inherit Account A private cart data | Scenario #6 | **`PASS`** |
| 12 | **CR-M6.5-01:** Cross-tab `storage` logout clears Tab B private cache, ignores unrelated/no-op keys, preserves public cache, cleans up `AppProviders` listener | Scenario #5 | **`PASS`** |
| 13 | **CR-M6.5-01:** In-flight private requests from Account A resolving after logout never re-populate cache | Scenario #10 | **`PASS`** |
| 14 | **CR-M6.5-01:** `WeakMap` reference-counted binding prevents duplicate listeners and safely handles nested mount/unmount | Scenario #12 | **`PASS`** |
| 15 | Flow 8 + R-03 Empirical Reproduction (`CheckoutPage` → `['my-orders']`) | Giữ nguyên cho `CR-M6.5-02` | **`PASS`** |

---

## 8. Test Commands, Counts và Exit Codes

| Lệnh thực thi | Files | Pass / Fail / Skip | Duration | Exit Code | Trạng thái |
|---|---:|---|---:|---:|---|
| `npx vitest run apps/web/tests/m6_5_customer_integration_qa.test.tsx` | 1 | **15 pass / 0 fail / 0 skip** | 2.49s | `0` | **`PASS`** |
| `npx vitest run apps/web/tests` (Toàn bộ Frontend Test Suite) | 7 | **94 pass / 0 fail / 0 skip** | 15.51s | `0` | **`PASS`** |

Chi tiết 7 files trong Frontend Test Suite (`npx vitest run apps/web/tests`):
- `apps/web/tests/m6_1_guest_cart_merge.test.tsx`: **23/23 PASS**
- `apps/web/tests/m6_2_customer_profile.test.tsx`: **18/18 PASS**
- `apps/web/tests/m6_3_customer_reviews.test.tsx`: **17/17 PASS**
- `apps/web/tests/m6_4_customer_returns.test.tsx`: **16/16 PASS**
- `apps/web/tests/m6_5_customer_integration_qa.test.tsx`: **15/15 PASS**
- `apps/web/tests/ResetPasswordFlow.test.tsx`: **4/4 PASS**
- `apps/web/tests/FoundationDashboard.test.tsx`: **1/1 PASS**

*(Không chạy lại Backend DB integration suites theo đúng mục 6 của Implementation Order vì thay đổi thuần Frontend và 0 ảnh hưởng Backend/DB.)*

---

## 9. Typecheck / Lint / Prettier / Build

| Gate | Lệnh thực thi | Exit Code | Kết quả quan sát |
|---|---|---:|---|
| **Prettier (6 allowlist files)** | `npx prettier --check apps/web/src/lib/authQueryCache.ts apps/web/src/services/authService.ts apps/web/src/app/providers.tsx apps/web/src/features/storefront/StorefrontHeader.tsx apps/web/src/features/wishlist/WishlistPage.tsx apps/web/tests/m6_5_customer_integration_qa.test.tsx` | `0` | `All matched files use Prettier code style!` — **`PASS`** |
| **Typecheck (Monorepo)** | `npm run typecheck` | `0` | `config`, `shared`, `api`, `web` (`tsc --noEmit`) — **`PASS`** |
| **ESLint (Monorepo)** | `npm run lint` | `0` | 0 errors, 0 warnings — **`PASS`** |
| **Production Build (`@nexora/web`)** | `npm run build -w @nexora/web` | `0` | `tsc -b tsconfig.json && vite build`: `288 modules transformed`, `built in 376ms` — **`PASS`** |

---

## 10. Security Verification (Bằng chứng Account A → Logout → Account B)

1. **Account A → Logout từ `WishlistPage` → Account B login trong `30s` (Test #6):**
   - Trước logout: `queryClient.getQueryData(['wishlist', 101])` chứa 1 item (`"Wishlist Riêng Tư Của User A"`), `sessionStorage['lastOrder']` có dữ liệu của A.
   - Sau logout: `queryClient.getQueryData(['wishlist', 101]) === undefined`, `queryClient.getQueryData(['wishlist']) === undefined`, `sessionStorage.getItem('lastOrder') === null`, và `['cart']` không còn dữ liệu của A (`undefined` hoặc guest cart rỗng `totalItems === 0`).
   - Account B đăng nhập & mở `/wishlist`: phát sinh **+1 request mới** `GET /wishlist` cho Account B, UI hiển thị `"Wishlist Riêng Tư Của User B"` và **`queryByText('Wishlist Riêng Tư Của User A') === null`**.
2. **Account B không nhận được response mới / offline (Test #7):**
   - Dù request `/wishlist` của Account B bị treo (`pending` vô hạn) và kể cả không gọi `logout()`, Lớp 2 identity-scoped key `['wishlist', 202]` đảm bảo Account B **tuyệt đối không thấy** `"Wishlist Bí Mật Của User A"`.
3. **In-flight request race condition (Test #13):**
   - Request chậm `['wishlist', 101]` của Account A đang chạy (`isFetching === 1`), Account A bấm `authService.logout()`, sau đó Promise của Account A resolve với `"Late Stale A Data"` → `queryClient.getQueryData(['wishlist', 101])` vẫn **`undefined`** và `findAll({ queryKey: ['wishlist'] }).length === 0`.
4. **Direct Login-Over-Session & Cross-Tab Logout (Tests #9, #12):**
   - Đăng nhập trực tiếp tài khoản B đè lên A hoặc `StorageEvent` xóa `nexora_token` từ tab khác đều lập tức xóa sạch private cache trong RAM mà giữ nguyên public cache.

---

## 11. Git Status và Baseline

- **Branch:** `main`
- **HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` (giữ nguyên)
- **Staged files:** `0` | **Commit / Push:** Không thực hiện | **DB Mutations:** `0`
- **Tracked modified (`git diff --name-status` — đúng 4 files):**
  - `M apps/web/src/app/providers.tsx`
  - `M apps/web/src/features/storefront/StorefrontHeader.tsx`
  - `M apps/web/src/features/wishlist/WishlistPage.tsx`
  - `M apps/web/src/services/authService.ts`
- **Untracked mới trong allowlist (`git status --short` — đúng 2 files):**
  - `?? apps/web/src/lib/authQueryCache.ts`
  - `?? apps/web/tests/m6_5_customer_integration_qa.test.tsx` *(đã tồn tại từ M6.5, được cập nhật regression tests)*
- **Untracked tài liệu & seed files có trước:** Bảo toàn 100% nguyên vẹn.

---

## 12. Acceptance Criteria Matrix

| Tiêu chí nghiệm thu (Mục 7 Implementation Order) | Trạng thái | Bằng chứng |
|---|---|---|
| Account B không thể nhìn thấy private cached data của Account A sau logout/login | **`PASS`** | Tests #6, #7, #8 |
| Tất cả logout entry points có hành vi cleanup nhất quán | **`PASS`** | `authService.logout()` → event bus → `AppProviders` + `StorefrontHeader` |
| Direct login-over-session được cô lập | **`PASS`** | `authService.login()`/`register()` emit event + Test #9 |
| Cross-tab logout được xử lý không gây event loop | **`PASS`** | `providers.tsx` `storage` listener + Test #12 |
| In-flight private requests không tái đưa dữ liệu cũ vào cache | **`PASS`** | `cancelQueries(..., { silent: true })` trước `removeQueries` + Test #13 |
| Guest Cart và Guest Cart Merge vẫn hoạt động | **`PASS`** | `m6_1_guest_cart_merge.test.tsx` 23/23 PASS + Tests #1, #2, #11 |
| Public cache được bảo toàn | **`PASS`** | Explicit 18-prefix private allow-list + Tests #9, #10, #12 |
| 18 private prefixes được xử lý đầy đủ | **`PASS`** | `PRIVATE_QUERY_KEY_PREFIXES` (18 items) + Test #10 |
| Không phát sinh duplicate listener | **`PASS`** | `WeakMap` ref-counted binding + Test #14 |
| Frontend tests, typecheck, lint, Prettier, build PASS | **`PASS`** | 94/94 tests, `typecheck=0`, `lint=0`, `prettier=0`, `build=0` |
| Chính xác 6 file allowlist, 0 DB mutation, không commit/push | **`PASS`** | `git diff --name-status` & `git status --short` |

---

## 13. Remaining Risks (Ngoài phạm vi CR-M6.5-01)

- **`CR-M6.5-02` (P1 — R-03):** `CheckoutPage.tsx` vẫn chưa invalidate `['my-orders']` sau khi tạo đơn (được giữ nguyên có chủ đích theo lệnh tách CR).
- **`CR-M6.5-03` (P2 — Playwright Journey 8):** Test E2E cũ trên `/admin` vẫn cần cập nhật theo Admin auth gate.
- **Lớp 2 mở rộng tùy chọn hậu M6.5:** 7 key `admin-*` trong `AdminDashboardPage.tsx` và `['cart']`/`['wishlist-count']` trên 22 trang hiện đã được bảo vệ đầy đủ bởi Lớp 1 (`clearPrivateQueryCache` chạy trên mọi logout/login/401/cross-tab); việc thêm `userId` cho 22 trang này có thể cân nhắc refactor gom hook chung về sau nếu cần.

---

## 14. Final Status

### **`PASS`**

Toàn bộ yêu cầu bảo mật P0 của **CR-M6.5-01** đã được triển khai đúng allowlist 6 file và xác minh đầy đủ bằng chứng thực nghiệm. Tôi dừng tại đây theo đúng điều kiện dừng và chờ Project Owner nghiệm thu trước khi chuyển sang bước tiếp theo (`CR-M6.5-02`).
