# CR-M6.5-01 — TARGETED READ-ONLY VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **Mode:** `STRICT READ-ONLY VERIFICATION — NO CODE EDITS — NO TEST EXECUTION — NO DB ACCESS`
- **References:**
  - Discovery: [`comprehensive-audit/30_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_DISCOVERY.md`](file:///d:/Nexora/comprehensive-audit/30_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_DISCOVERY.md)
  - Implementation Report: [`comprehensive-audit/31_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_IMPLEMENTATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/31_CR_M6_5_01_LOGOUT_CACHE_ISOLATION_IMPLEMENTATION_REPORT.md)

---

## Tổng hợp kết luận theo từng mục

| Mục xác minh | Kết luận | Tóm tắt bằng chứng / Giới hạn |
|---|---|---|
| **1. Đối chiếu Registry 18 private query prefixes** | **`PASS`** | Khớp **18/18** (1-1) với Discovery 30; **0** prefix thiếu; **0** public query lọt vào registry. |
| **2. Xác minh cơ chế chống race condition** | **`PASS WITH DOCUMENTED LIMITS`** | Cơ chế `cancelQueries(..., { silent: true })` → `removeQueries(...)` chặn ghi ngược cache **ngay cả khi `queryFn` không dùng `AbortSignal`** (đã đối chiếu trực tiếp mã nguồn `@tanstack/query-core`). Đã nêu rõ 3 giới hạn thực tế (không ngắt HTTP ở tầng mạng vì 0 `queryFn` dùng `AbortSignal`, test in-flight dùng `fetchQuery` thay vì mount component + concurrent `['cart']` refetch). |
| **3. Xác minh event lifecycle** | **`PASS WITH DOCUMENTED LIMITS`** | `logout()`, `login()`, `register()`, `AppProviders`, `WeakMap` ref-counting và `StorefrontHeader` khớp 100% yêu cầu; 0 duplicate listener, 0 memory leak, 0 cross-tab event loop. Ghi nhận trung thực giới hạn cross-tab: `storage` event xóa sạch private QueryClient cache ở Tab B nhưng local `useState(currentUser)` của trang đang mở ở Tab B không tự re-render cho tới khi điều hướng/reload (do kiến trúc không có `AuthContext`). |
| **4. Đối chiếu 15 regression tests & bảo toàn R-03** | **`PASS`** | Đã ánh xạ đầy đủ 15/15 test cases kèm dòng số; xác nhận test R-03 ([`m6_5_customer_integration_qa.test.tsx:1097-1193`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx#L1097-L1193)) giữ nguyên 100% nội dung và tiêu chí. |
| **5. Git safety** | **`PASS`** | Branch `main`, HEAD `3d8adb18c967400dbc28787a6b8174b9a7cf8213`, `0` staged files, `0` commit/push mới, đúng 6 file allowlist, `0` DB mutations. |

---

## 1. Đối chiếu Registry 18 Private Query Prefixes

### 1.1. Trích dẫn nguyên văn mã nguồn khai báo

File: [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L11-L32)

```ts
11: export const PRIVATE_QUERY_KEY_PREFIXES = [
12:   'cart',
13:   'wishlist',
14:   'wishlist-count',
15:   'profile',
16:   'my-orders',
17:   'customer-addresses',
18:   'notifications',
19:   'customer-returns',
20:   'customer-return-detail',
21:   'review-eligibility',
22:   'admin-data',
23:   'admin-brands',
24:   'admin-coupons',
25:   'admin-flash-sales',
26:   'admin-banners',
27:   'admin-posts',
28:   'admin-users',
29:   'admin-reviews',
30: ] as const;
31:
32: export type PrivateQueryKeyPrefix = (typeof PRIVATE_QUERY_KEY_PREFIXES)[number];
```

### 1.2. Bảng đối chiếu 1-1 với Discovery 30 (Mục 4.1)

| # | Prefix trong `authQueryCache.ts` (dòng) | Key trong Discovery 30 (Mục 4.1) | Nơi khai báo `useQuery` thực tế | Public hay Private? | Khớp |
|---|---|---|---|---|---|
| 1 | `'cart'` (`authQueryCache.ts:12`) | `['cart']` (#3) | 22 trang storefront (`CartPage.tsx:62`, `StorefrontHome.tsx:69`, `CheckoutPage.tsx:49`, `WishlistPage.tsx:33`, ...) | Private / Session-scoped | **KHỚP** |
| 2 | `'wishlist'` (`authQueryCache.ts:13`) | `['wishlist']` (#1) | [`WishlistPage.tsx:39`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L39) (`['wishlist', currentUser?.id]`) | Private | **KHỚP** |
| 3 | `'wishlist-count'` (`authQueryCache.ts:14`) | `['wishlist-count']` (#2) | 20 trang storefront (`StorefrontHome.tsx:75`, `ProfilePage.tsx:456`, ...) | Private | **KHỚP** |
| 4 | `'profile'` (`authQueryCache.ts:15`) | `['profile', currentUser?.id]` (#4) | [`ProfilePage.tsx:73`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L73) | Private | **KHỚP** |
| 5 | `'my-orders'` (`authQueryCache.ts:16`) | `['my-orders', currentUser?.id]` (#7) | [`ProfilePage.tsx:440`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L440) | Private | **KHỚP** |
| 6 | `'customer-addresses'` (`authQueryCache.ts:17`) | `['customer-addresses', currentUser?.id]` (#5) | [`ProfilePage.tsx:133`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L133) | Private | **KHỚP** |
| 7 | `'notifications'` (`authQueryCache.ts:18`) | `['notifications', currentUser?.id]` (#6) | [`ProfilePage.tsx:327`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L327) | Private | **KHỚP** |
| 8 | `'customer-returns'` (`authQueryCache.ts:19`) | `['customer-returns', currentUser?.id, page, limit]` (#8) | [`CustomerReturnsTab.tsx:791`](file:///d:/Nexora/apps/web/src/features/profile/components/CustomerReturnsTab.tsx#L791) | Private | **KHỚP** |
| 9 | `'customer-return-detail'` (`authQueryCache.ts:20`) | `['customer-return-detail', currentUser?.id, activeDetailId]` (#9) | [`CustomerReturnsTab.tsx:803`](file:///d:/Nexora/apps/web/src/features/profile/components/CustomerReturnsTab.tsx#L803) | Private | **KHỚP** |
| 10 | `'review-eligibility'` (`authQueryCache.ts:21`) | `['review-eligibility', productId, currentUser?.id]` (#10) | [`ProductDetailPage.tsx:269`](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx#L269) | Private | **KHỚP** |
| 11 | `'admin-data'` (`authQueryCache.ts:22`) | `['admin-data', currentUser?.id, currentUser?.role]` (#11) | [`AdminDashboardPage.tsx:321`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L321) | Private (Admin/Staff) | **KHỚP** |
| 12 | `'admin-brands'` (`authQueryCache.ts:23`) | `['admin-brands']` (#12) | [`AdminDashboardPage.tsx:357`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L357) | Private (Admin/Staff) | **KHỚP** |
| 13 | `'admin-coupons'` (`authQueryCache.ts:24`) | `['admin-coupons']` (#13) | [`AdminDashboardPage.tsx:367`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L367) | Private (Admin/Staff) | **KHỚP** |
| 14 | `'admin-flash-sales'` (`authQueryCache.ts:25`) | `['admin-flash-sales']` (#14) | [`AdminDashboardPage.tsx:377`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L377) | Private (Admin/Staff) | **KHỚP** |
| 15 | `'admin-banners'` (`authQueryCache.ts:26`) | `['admin-banners']` (#15) | [`AdminDashboardPage.tsx:387`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L387) | Private (Admin/Staff) | **KHỚP** |
| 16 | `'admin-posts'` (`authQueryCache.ts:27`) | `['admin-posts']` (#16) | [`AdminDashboardPage.tsx:397`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L397) | Private (Admin/Staff) | **KHỚP** |
| 17 | `'admin-users'` (`authQueryCache.ts:28`) | `['admin-users']` (#17) | [`AdminDashboardPage.tsx:407`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L407) | Private (Admin/Staff PII) | **KHỚP** |
| 18 | `'admin-reviews'` (`authQueryCache.ts:29`) | `['admin-reviews']` (#18) | [`AdminDashboardPage.tsx:417`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L417) | Private (Admin/Staff) | **KHỚP** |

### 1.3. Xác nhận loại trừ Public Queries
Các public query keys từ Discovery 30 (Mục 4.3): `['categories']`, `['products']`, `['products-full-catalog']`, `['product-detail', slug]`, `['product-reviews', ...]`, `['reviews', 'home']`, `['active-flash-sale']`, `['brands']`, `['posts', ...]`, `['post-detail', slug]`, `['banners', ...]`, `['live-search', ...]`, `['active-coupons']`, `['system', 'health']`, `['system', 'meta']` — **không có bất kỳ key nào xuất hiện hoặc bị khớp prefix trong `PRIVATE_QUERY_KEY_PREFIXES`**.

**Kết luận Mục 1:** **`PASS`** — Đầy đủ chính xác 18/18 private prefixes, không thiếu, không thừa, không đụng public cache.

---

## 2. Xác minh Cơ chế Chống Race Condition

### 2.1. Trích dẫn đầy đủ `clearPrivateQueryCache()`

File: [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L70-L79)

```ts
70: export function clearPrivateQueryCache(queryClient: QueryClient): void {
71:   for (const prefix of PRIVATE_QUERY_KEY_PREFIXES) {
72:     // 1. Synchronously cancel in-flight fetch retryers so late responses from the
73:     //    previous session cannot resolve and re-populate cache after logout/switch.
74:     void queryClient.cancelQueries({ queryKey: [prefix] }, { silent: true });
75:     // 2. Synchronously detach and delete matching private queries from QueryCache
76:     //    to eliminate stale-while-revalidate exposure across accounts.
77:     queryClient.removeQueries({ queryKey: [prefix] });
78:   }
79: }
```

### 2.2. Kiểm tra `AbortSignal` trong toàn bộ `apps/web/src`

- Quét toàn bộ 64 file `.ts`/`.tsx` trong `apps/web/src` với pattern `\bsignal\b|AbortController|AbortSignal`: **0 kết quả khớp**.
- **Sự thật kỹ thuật:** Hiện tại **không có `queryFn` nào** (trong `wishlistService`, `cartService`, `profileService`, `returnService`, `reviewService`, `AdminDashboardPage`) nhận và truyền `signal` (`AbortSignal`) xuống `fetch()` hoặc `apiClient`.
- Do đó, khi `cancelQueries()` chạy, `abortController.abort()` được gọi ở [`node_modules/@tanstack/query-core/build/modern/query.js:428`](file:///d:/Nexora/node_modules/@tanstack/query-core/build/modern/query.js#L428), nhưng **request HTTP thực tế trên mạng không bị hủy ở tầng socket/XHR**; trình duyệt vẫn có thể nhận HTTP response từ server nếu request đã gửi đi trước lúc logout.

### 2.3. Thứ tự thực thi chính xác & lý do response trễ KHÔNG THỂ ghi dữ liệu cũ vào TanStack Query cache

Đối chiếu trực tiếp mã nguồn `@tanstack/query-core` đang cài trong workspace (`node_modules/@tanstack/query-core/build/modern/`):

1. **Bước 1 — `queryClient.cancelQueries({ queryKey: [prefix] }, { silent: true })`** (`authQueryCache.ts:74`):
   - Tại [`queryClient.js:303-309`](file:///d:/Nexora/node_modules/@tanstack/query-core/build/modern/queryClient.js#L303-L309), dù `cancelQueries` trả về `Promise`, vòng lặp `this.#queryCache.findAll(filters).map((query) => query.cancel(defaultedCancelOptions))` chạy **đồng bộ ngay lập tức** bên trong `notifyManager.batch(...)` trước khi trả `Promise.all(promises)`.
   - `query.cancel()` gọi `retryer.cancel({ revert: true, silent: true })` tại [`retryer.js:78-84`](file:///d:/Nexora/node_modules/@tanstack/query-core/build/modern/retryer.js#L78-L84):
     - Kiểm tra `if (!isResolved())` (với `status === "pending"`).
     - Tạo `new CancelledError({ revert: true, silent: true })` và gọi `reject(error)` **đồng bộ** (`retryer.js:100-106`), lập tức đổi `status = "rejected"` và reject `retryer.promise`.
   - Tại [`query.js:449-468`](file:///d:/Nexora/node_modules/@tanstack/query-core/build/modern/query.js#L449-L468), nhánh `await retryer.promise` nhảy vào `catch (error)` với `CancelledError` → **`this.setData(data)` tại `query.js:455` không chạy**.
   - **Khi Promise của `queryFn` (không dùng `AbortSignal`) resolve trễ sau logout:** `retryer.js:93-99` (`resolve(value)`) kiểm tra `if (!isResolved())` → trả **`false`** vì `status` đã là `"rejected"`. Giá trị trễ của Account A **bị loại bỏ hoàn toàn, không thể gọi `this.setData(data)`**.

2. **Bước 2 — `queryClient.removeQueries({ queryKey: [prefix] })`** (`authQueryCache.ts:77`):
   - Tại [`queryClient.js:250-257`](file:///d:/Nexora/node_modules/@tanstack/query-core/build/modern/queryClient.js#L250-L257), chạy **đồng bộ** `queryCache.remove(query)` tách và xóa hẳn toàn bộ đối tượng `Query` khớp `[prefix]` khỏi `QueryCache`.
   - Bất kỳ truy vấn mới nào sau logout (cho Guest hoặc Account B) đều tạo một đối tượng `Query` mới hoàn toàn độc lập trong `QueryCache`.

### 2.4. Đối chiếu test mô phỏng request hoàn tất trễ & giới hạn của test

File: [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx#L1031-L1068)

```ts
1038:       let resolveSlowWishlist!: (value: unknown) => void;
1039:       const slowWishlistPromise = new Promise((resolve) => {
1040:         resolveSlowWishlist = resolve;
1041:       });
1042:
1043:       // Start an in-flight private query for Account A (no AbortSignal used by queryFn)
1044:       const inFlightFetch = queryClient
1045:         .fetchQuery({
1046:           queryKey: ['wishlist', userA.id],
1047:           queryFn: () => slowWishlistPromise,
1048:         })
1049:         .catch(() => undefined);
1050:
1051:       // Verify query is currently fetching
1052:       expect(queryClient.isFetching({ queryKey: ['wishlist', userA.id] })).toBe(1);
1053:
1054:       // Account A logs out WHILE the private request is still in-flight!
1055:       authService.logout();
1056:
1057:       // Now Account A's slow response arrives AFTER logout
1058:       resolveSlowWishlist([{ id: 99, product: { ...sampleProduct, name: 'Late Stale A Data' } }]);
1059:       await inFlightFetch;
1060:       await Promise.resolve();
1061:
1062:       // Cache MUST remain empty — late in-flight response MUST NOT write Account A data back!
1063:       expect(queryClient.getQueryData(['wishlist', userA.id])).toBeUndefined();
1064:       expect(queryClient.getQueryCache().findAll({ queryKey: ['wishlist'] })).toHaveLength(0);
```

- **Test chứng minh được điều gì:** Chứng minh trực tiếp trong `QueryClient` với cấu hình giống production (`staleTime: 30_000`) rằng 1 `queryFn` **không dùng `AbortSignal`** đang ở trạng thái `isFetching === 1`, khi `authService.logout()` chạy giữa chừng và Promise cũ resolve trễ với `'Late Stale A Data'`, cache vẫn `undefined` và `findAll({ queryKey: ['wishlist'] }).length === 0`.
- **Những giới hạn / điều chưa thể chứng minh (khai báo trung thực):**
  1. **Không hủy HTTP ở tầng mạng:** Do không có `queryFn` nào truyền `AbortSignal`, gói tin HTTP đang bay vẫn hoàn tất ở tầng trình duyệt (chỉ bị chặn ở tầng TanStack Query `retryer` + `QueryCache`).
  2. **Test gọi `queryClient.fetchQuery(...)` trực tiếp:** Không mount React component `<WishlistPage />` hoặc `<CartPage />` đang loading rồi chuyển sang Account B trên UI trong cùng 1 test in-flight.
  3. **Chưa có test riêng cho concurrent in-flight trên un-scoped key `['cart']`:** Tức kịch bản Account A đang fetch `['cart']` chậm → logout → Guest/Account B bắt đầu fetch `['cart']` mới ngay lập tức → Promise cũ của A resolve sau Promise mới của B. (Cơ chế `query-core` đã cô lập vì `removeQueries` tạo instance `Query` mới tách biệt với `retryer` cũ đã `rejected`, nhưng kịch bản UI chồng chéo này mới được chứng minh qua code inspection chứ chưa có test tự động riêng.)

**Kết luận Mục 2:** **`PASS WITH DOCUMENTED LIMITS`** — Chống ghi ngược cache đã được chứng minh bằng cả mã nguồn `@tanstack/query-core` lẫn unit test; các giới hạn tầng mạng (`AbortSignal`) và test UI in-flight đã được ghi nhận rõ ràng.

---

## 3. Xác minh Event Lifecycle

### 3.1. `logout()`, `login()`, `register()` trong [`apps/web/src/services/authService.ts`](file:///d:/Nexora/apps/web/src/services/authService.ts)

- **`login()` (lines 38–91):**
  - Line `39`: `const previousUserId = this.getCurrentUser()?.id ?? null;`
  - Lines `53–58`: Ghi `nexora_token`, `nexora_user`; nếu `previousUserId !== null && previousUserId !== session.user.id` gọi `clearSensitiveSessionStorage()` (`sessionStorage.removeItem('lastOrder')`, lines 29–35); gọi `cartService.resetPassiveMergeGuard()`.
  - Lines `61–81`: Giữ nguyên 100% logic Guest Cart Merge (`validateMergeResult`, `clearGuestSession`, 1 lần Immediate Retry).
  - Lines `84–88`: Phát `emitAuthSessionChange({ type: 'LOGIN', previousUserId, nextUserId: session.user.id })`.
- **`register()` (lines 93–143):**
  - Line `94`: `const previousUserId = this.getCurrentUser()?.id ?? null;`
  - Lines `109–114`: Ghi `nexora_token`, `nexora_user`; xóa `lastOrder` khi đổi user; gọi `cartService.resetPassiveMergeGuard()`.
  - Lines `116–134`: Giữ nguyên 100% logic Guest Cart Merge.
  - Lines `136–140`: Phát `emitAuthSessionChange({ type: 'REGISTER', previousUserId, nextUserId: session.user.id })`.
- **`logout()` (lines 170–181):**
  ```ts
  170:   logout(): void {
  171:     const previousUserId = this.getCurrentUser()?.id ?? null;
  172:     localStorage.removeItem('nexora_token');
  173:     localStorage.removeItem('nexora_user');
  174:     clearSensitiveSessionStorage();
  175:     cartService.resetPassiveMergeGuard();
  176:     emitAuthSessionChange({
  177:       type: 'LOGOUT',
  178:       previousUserId,
  179:       nextUserId: null,
  180:     });
  181:   },
  ```

### 3.2. Root `QueryClient` binding & cross-tab `storage` listener trong [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx#L19-L31)

```ts
19:   useEffect(() => {
20:     const unbindAuthEvents = bindQueryClientToAuthEvents(queryClient);
21:
22:     const onStorage = (event: StorageEvent) => {
23:       handleCrossTabAuthStorageEvent(event, queryClient);
24:     };
25:
26:     window.addEventListener('storage', onStorage);
27:     return () => {
28:       unbindAuthEvents();
29:       window.removeEventListener('storage', onStorage);
30:     };
31:   }, [queryClient]);
```

Kết hợp [`handleCrossTabAuthStorageEvent()` (`authQueryCache.ts:138-151`)](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L138-L151):
```ts
138: export function handleCrossTabAuthStorageEvent(
139:   event: Pick<StorageEvent, 'key' | 'oldValue' | 'newValue'>,
140:   queryClient: QueryClient,
141: ): boolean {
142:   if (event.key !== null && !AUTH_STORAGE_KEYS.has(event.key)) {
143:     return false;
144:   }
145:   if (event.key !== null && event.oldValue === event.newValue) {
146:     return false;
147:   }
148:
149:   clearPrivateQueryCache(queryClient);
150:   return true;
151: }
```
- **Chống event loop liên tab:** Chỉ gọi `clearPrivateQueryCache(queryClient)`, **không bao giờ ghi hoặc xóa ngược `localStorage`**, do đó Tab B không phát sinh `storage` event quay ngược lại Tab A.
- **Chống phản ứng sai:** Bỏ qua mọi key ngoài `{'nexora_token', 'nexora_user'}` (trừ `key === null` khi `localStorage.clear()`) và bỏ qua khi `oldValue === newValue`.

### 3.3. Cơ chế `WeakMap` Reference Counting & Cleanup trong [`apps/web/src/lib/authQueryCache.ts`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L63-L130)

```ts
63: const boundQueryClients = new WeakMap<QueryClient, QueryClientBindingEntry>();
...
105: export function bindQueryClientToAuthEvents(queryClient: QueryClient): () => void {
106:   const existing = boundQueryClients.get(queryClient);
107:   if (existing) {
108:     existing.refCount += 1;
109:   } else {
110:     const unsubscribe = subscribeAuthSessionChange(() => {
111:       clearPrivateQueryCache(queryClient);
112:     });
113:     boundQueryClients.set(queryClient, { refCount: 1, unsubscribe });
114:   }
115:
116:   let released = false;
117:   return () => {
118:     if (released) return;
119:     released = true;
120:
121:     const current = boundQueryClients.get(queryClient);
122:     if (!current) return;
123:
124:     current.refCount -= 1;
125:     if (current.refCount <= 0) {
126:       current.unsubscribe();
127:       boundQueryClients.delete(queryClient);
128:     }
129:   };
130: }
```

### 3.4. `useAuthQueryCacheSync()` trong [`apps/web/src/features/storefront/StorefrontHeader.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx#L6-L52)

- Import tại `StorefrontHeader.tsx:6`: `import { useAuthQueryCacheSync } from '../../lib/authQueryCache';`
- Gọi tại `StorefrontHeader.tsx:51`: `useAuthQueryCacheSync();`
- Định nghĩa tại [`authQueryCache.ts:158-164`](file:///d:/Nexora/apps/web/src/lib/authQueryCache.ts#L158-L164):
  ```ts
  158: export function useAuthQueryCacheSync(): void {
  159:   const queryClient = useQueryClient();
  160:
  161:   useEffect(() => {
  162:     return bindQueryClientToAuthEvents(queryClient);
  163:   }, [queryClient]);
  164: }
  ```

### 3.5. Đánh giá Listener, Memory Leak, Event Loop và Giới hạn chưa chứng minh

- **Không đăng ký listener trùng:** `boundQueryClients.get(queryClient)` tìm thấy entry của `AppProviders` (`refCount = 1`) thì `StorefrontHeader` chỉ tăng `refCount = 2`, không gọi lại `subscribeAuthSessionChange`.
- **Không memory leak / không gỡ sớm:** Khi `StorefrontHeader` unmount lúc chuyển trang, `refCount` giảm về `1` nên root binding ở `AppProviders` vẫn sống; khi `AppProviders` (hoặc test `QueryClientProvider`) unmount, `refCount === 0` gọi `current.unsubscribe()` xóa khỏi `sessionListeners` `Set` và xóa khỏi `WeakMap`. Cờ `released` chặn double-decrement.
- **Không event loop:** `emitAuthSessionChange` chỉ chạy `clearPrivateQueryCache`, không gọi lại `authService` hay `localStorage`.
- **Giới hạn khai báo trung thực:**
  1. Ở kịch bản cross-tab trong trình duyệt thật (chưa có Playwright 2-tab test): `storage` event xóa sạch **TanStack Query private cache** ở Tab B, nhưng vì ứng dụng không có `AuthContext` toàn cục (mỗi trang giữ `useState<AuthUser | null>(() => authService.getCurrentUser())`), thanh header ở Tab B sẽ chỉ cập nhật nhãn tên user sau khi chuyển trang/reload hoặc khi một API trả lỗi. Tuy nhiên, nếu Tab B đang mount query có `enabled: !!currentUser` mà cache bị xóa và refetch, `apiClient` đọc `localStorage.getItem('nexora_token')` (đã là `null`) nên không gửi token của Account A lên server.
  2. `useEffect` chạy sau lần commit đầu tiên của React: nếu có code ngoài gọi `authService.logout()` đồng bộ *trước* khi `AppProviders` hoặc `StorefrontHeader` mount xong, listener chưa đăng ký; tuy nhiên trong runtime thực tế không thể bấm nút logout hoặc đăng nhập khi root chưa mount.

**Kết luận Mục 3:** **`PASS WITH DOCUMENTED LIMITS`** — Event lifecycle, `WeakMap` ref-counting, cleanup và chống event loop được xác minh chính xác trong source code; giới hạn cross-tab local `useState(currentUser)` đã được nêu rõ.

---

## 4. Đối chiếu 15 Regression Tests (`m6_5_customer_integration_qa.test.tsx`)

### 4.1. Bảng ánh xạ đầy đủ 15/15 test cases

File: [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx)

| # | Dòng | Tên Test Case nguyên văn | Ánh xạ tình huống yêu cầu |
|---|---:|---|---|
| 1 | `166` | `Flow 1: Guest browse -> Product Detail (/product/:slug) -> Add to Cart creates guest session & invalidates cart` | Guest Cart cơ bản |
| 2 | `224` | `Flow 2: Guest Cart -> Login (/login) -> Auto-Merge clears guest session and invalidates cart` | **Guest Cart Merge** |
| 3 | `274` | `Flow 3: Authenticated Customer -> Profile -> Address CRUD invalidates customer-addresses cache` | Profile / Addresses compatibility |
| 4 | `339` | `Flows 4 & 5: Delivered Order -> Product Detail Review Eligibility -> Create (POST) -> Edit (PUT) -> Delete (DELETE)` | Reviews compatibility |
| 5 | `458` | `Flow 6 & 8: Orders Tab shortcut -> /profile/return -> Create Return -> List & Detail -> Invalidates returns & notifications` | Customer Returns compatibility |
| 6 | `592` | `Flow 7 + CR-M6.5-01 (R-02 Fixed): Account A wishlist -> logout -> Account B login never sees A wishlist and uses identity-scoped cache` | **Account A logout → Account B login** + Logout từ `WishlistPage` + Identity-scoped `['wishlist', userB.id]` + xóa `sessionStorage['lastOrder']` |
| 7 | `707` | `Flow 7 + CR-M6.5-01: Even with no new network response (pending/offline), Account B never sees Account A cached wishlist` | **Account A → Account B không có response mới** (chứng minh Lớp 2 `['wishlist', currentUser?.id]`) |
| 8 | `772` | `Flow 7 + CR-M6.5-01: ProfilePage logout purges ALL private cache (including profile & addresses) consistently` | **Logout từ nhiều entry point** (`ProfilePage`) + **Private cache cleanup** |
| 9 | `832` | `CR-M6.5-01: Direct login-over-session (without clicking logout) isolates & purges previous account cache` | **Direct login-over-session** + **Public cache preservation** |
| 10 | `870` | `CR-M6.5-01: All 18 private query prefixes are purged on logout while public catalog/content caches remain preserved` | **Private cache cleanup (18/18 prefixes)** + **Public cache preservation (9 public keys)** |
| 11 | `920` | `CR-M6.5-01: Post-logout guest cart does not inherit Account A private cart data` | **Guest Cart isolation** sau logout từ `CartPage` |
| 12 | `978` | `CR-M6.5-01: Cross-tab storage logout event clears Tab B private cache without wiping public cache or reacting to unrelated keys` | **Cross-tab logout/session change** + `AppProviders` listener cleanup |
| 13 | `1031` | `CR-M6.5-01: In-flight private requests from Account A never re-populate cache when resolving after logout` | **In-flight request hoàn tất trễ** |
| 14 | `1070` | `CR-M6.5-01: WeakMap reference-counted binding prevents duplicate listeners and safely handles nested mount/unmount` | **Listener deduplication** (`WeakMap` ref-counting) |
| 15 | `1097` | `Flow 8 + R-03 Empirical Reproduction: CheckoutPage does not invalidate ["my-orders"], leaving stale orders visible within 30s staleTime` | **R-03 (CR-M6.5-02) — Bảo toàn nguyên vẹn** |

*(Lưu ý minh bạch: Không chạy lại test suite trong đợt xác minh read-only này; trạng thái 15/15 PASS & 94/94 Frontend tests PASS được tham chiếu từ lần chạy sau format cuối cùng trong Report 31.)*

### 4.2. Xác nhận bảo toàn Test R-03 (CR-M6.5-02)

Đối chiếu từng dòng [`m6_5_customer_integration_qa.test.tsx:1097-1193`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx#L1097-L1193):
- Tiêu đề giữ nguyên 100%: `'Flow 8 + R-03 Empirical Reproduction: CheckoutPage does not invalidate ["my-orders"], leaving stale orders visible within 30s staleTime'`.
- Các assertion cốt lõi giữ nguyên 100% (lines `1177–1192`):
  - `expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });`
  - `expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });`
  - `expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-data'] });`
  - `expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['my-orders'] });`
  - `expect(screen.queryByText('NX-2026-NEW99')).not.toBeInTheDocument();`
  - `expect(myOrdersCallsAfterCheckout).toBe(1);`
- Không có bất kỳ chỉnh sửa nào về nội dung, dữ liệu mock hay tiêu chí nghiệm thu của test R-03.

**Kết luận Mục 4:** **`PASS`** — Đủ 15/15 test cases ánh xạ đầy đủ mọi nhóm tình huống yêu cầu và bảo toàn nguyên vẹn test R-03.

---

## 5. Git Safety Verification

Kết quả lệnh kiểm tra read-only trực tiếp:

| Tiêu chí | Kết quả quan sát thực tế | Trạng thái |
|---|---|---|
| Branch (`git branch --show-current`) | `main` | **`PASS`** |
| HEAD (`git rev-parse HEAD`) | `3d8adb18c967400dbc28787a6b8174b9a7cf8213` | **`PASS`** |
| Staged changes (`git diff --cached --name-status`) | Trống (`0` files) | **`PASS`** |
| Tracked modified files (`git diff --name-status`) | Chính xác 4 file allowlist: `apps/web/src/app/providers.tsx`, `apps/web/src/features/storefront/StorefrontHeader.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`, `apps/web/src/services/authService.ts` | **`PASS`** |
| Untracked files trong allowlist (`git status --short`) | Chính xác 2 file allowlist: `apps/web/src/lib/authQueryCache.ts`, `apps/web/tests/m6_5_customer_integration_qa.test.tsx` | **`PASS`** |
| Commit mới / Push / History rewrite | Không thực hiện (`0`) | **`PASS`** |
| Thay đổi database | Không thực hiện (`0` — không truy cập MySQL) | **`PASS`** |
| Tài liệu & seed files untracked có trước | Còn nguyên vẹn 100% | **`PASS`** |

**Kết luận Mục 5:** **`PASS`**.

---

## Điểm chưa thể chứng minh trong phạm vi Read-Only Verification này

1. Không chạy lại test suite trong lần xác minh này theo đúng yêu cầu (`Không chạy thêm test suite`); kết quả chạy 94/94 Frontend tests & 15/15 M6.5 tests được giữ từ Report 31 (sau khi không có thêm bất kỳ chỉnh sửa mã nguồn nào kể từ thời điểm đó).
2. Hành vi hủy HTTP ở tầng mạng (`AbortSignal`) chưa tồn tại trong các service hiện hành; bảo vệ in-flight hiện hoạt động ở tầng TanStack Query (`cancelQueries` → `Retryer` `rejected` + `removeQueries` tách `QueryCache`), chưa có test tự động riêng cho kịch bản concurrent in-flight chồng chéo trên un-scoped key `['cart']`.
3. Chưa có Playwright E2E đa tab thật để kiểm chứng UI đồng bộ cross-tab; local `useState(currentUser)` ở Tab B không tự đổi về `null` cho tới khi điều hướng/reload (mặc dù private QueryClient cache ở Tab B đã bị xóa sạch ngay khi nhận `storage` event).

Dừng tại đây và chờ quyết định nghiệm thu `CR-M6.5-01` của Project Owner.
