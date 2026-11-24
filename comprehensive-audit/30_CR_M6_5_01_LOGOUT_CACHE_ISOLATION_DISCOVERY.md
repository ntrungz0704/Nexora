# CR-M6.5-01 — R-02 PRIVATE QUERY CACHE ISOLATION DISCOVERY

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` *(M6.4 Customer Returns — COMMITTED)*
- **Priority:** `P0 — SECURITY / CROSS-ACCOUNT DATA EXPOSURE`
- **Mode:** `STRICT READ-ONLY TARGETED DISCOVERY — NO CODE CHANGES`
- **Discovery Reference:** [`comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md)
- **Final Status:** **`PASS`**

---

## 1. Executive Summary

Khảo sát toàn diện 100% mã nguồn `apps/web/src` (63 file `.ts`/`.tsx`) xác nhận **R-02 không phải lỗi cục bộ của riêng `WishlistPage.tsx`**, mà là **khiếm khuyết kiến trúc hệ thống** phát sinh từ 3 nguyên nhân cộng hưởng:

1. **Không có `AuthContext` và cơ chế dọn cache tập trung:** `authService.logout()` chỉ xóa `nexora_token` và `nexora_user` khỏi `localStorage`. Toàn bộ ứng dụng có **27 điểm gọi `authService.logout()` phân tán trên 24 file**, trong đó **19/24 file (20 điểm gọi) không hề đụng tới TanStack Query cache**, 4 file chỉ `invalidateQueries` cục bộ (`cart`, `wishlist-count`), và 1 file (`ProfilePage`) chỉ `removeQueries` 3 key (`customer-returns`, `customer-return-detail`, `my-orders`).
2. **`QueryClient` sống suốt vòng đời tab SPA với `staleTime: 30_000` và `gcTime: 300_000`:** Được khởi tạo 1 lần duy nhất tại [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx#L6-L16). Không bị reset khi logout, khi login tài khoản mới đè lên phiên cũ, khi token hết hạn 401/403 ở `/admin`, hay khi tab khác đăng xuất.
3. **10/18 private query key prefixes không gắn `userId` (identity discriminator):** Gồm 3 key phía Customer (`['wishlist']`, `['wishlist-count']`, `['cart']`) và 7 key phía Admin (`['admin-brands']`, `['admin-coupons']`, `['admin-flash-sales']`, `['admin-banners']`, `['admin-posts']`, `['admin-users']`, `['admin-reviews']`). Ngoài ra, `sessionStorage['lastOrder']` cũng không bị xóa khi logout.

**Thiết kế khắc phục đề xuất (Kết hợp 2 lớp bảo vệ với blast radius tối thiểu — 5 file nguồn + 1 file test):**
- **Lớp 1 (Centralized Auth Session Event + Private Cache Purge):** Tạo module thuần `apps/web/src/lib/authQueryCache.ts` chứa danh mục chuẩn `PRIVATE_QUERY_KEY_PREFIXES` (18 prefix private) và hàm `clearPrivateQueryCache(queryClient)` (`cancelQueries` + `removeQueries`), phát sự kiện tập trung từ `authService.logout()`, `authService.login()`, `authService.register()`, gắn đồng bộ vào root `QueryClient` tại `AppProviders` (kèm lắng nghe `storage` event liên tab) và gắn idempotent tại `StorefrontHeader` (đảm bảo cả 23 trang storefront lẫn mọi test render không qua `<AppProviders>` đều được bảo vệ). Bảo toàn 100% public cache và Guest Cart Merge.
- **Lớp 2 (Identity-Scoped Private Query Keys):** Bổ sung `currentUser?.id` vào `['wishlist', currentUser?.id]` tại `WishlistPage.tsx` (100% nơi khai báo `wishlist`, 0 phân mảnh key). Các đề xuất mở rộng tùy chọn cho `AdminDashboardPage.tsx` (7 key admin) và 22 trang `['cart']`/`['wishlist-count']` được phân tích minh bạch để Project Owner quyết định.

---

## 2. R-02 Root Cause

### Chuỗi nguyên nhân kỹ thuật đầy đủ

| Thành phần | Vị trí mã nguồn | Hành vi hiện tại gây lỗi |
|---|---|---|
| **Root `QueryClient` singleton** | [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx#L6-L16) | Khởi tạo 1 `QueryClient` duy nhất trong `useState` với `staleTime: 30_000`, `refetchOnWindowFocus: false` (và `gcTime` mặc định `300_000ms` = 5 phút của TanStack Query v5). Không có listener nào theo dõi sự kiện thay đổi phiên đăng nhập. |
| **Auth Service không phát sự kiện** | [`apps/web/src/services/authService.ts`](file:///d:/Nexora/apps/web/src/services/authService.ts#L138-L141) | `logout()` chỉ xóa `nexora_token` và `nexora_user` trong `localStorage`. `login()` (lines 29–70) và `register()` (lines 72–111) ghi đè token/user mới mà không thông báo dọn cache của phiên trước, không xóa `sessionStorage['lastOrder']`, không gọi `cartService.resetPassiveMergeGuard()`. |
| **Không có `AuthContext` toàn cục** | Toàn bộ `apps/web/src` | Không tồn tại `createContext` cho Auth. Mỗi trang tự quản lý `useState<AuthUser | null>(() => authService.getCurrentUser())` độc lập và tự viết hàm `onLogout` khác nhau. |
| **Non-user-scoped `['wishlist']` key** | [`apps/web/src/features/wishlist/WishlistPage.tsx`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L38-L42) | Khai báo `queryKey: ['wishlist']` không chứa `currentUser?.id`, không có `removeQueries` ở `handleLogout` (lines 71–74). |
| **Non-user-scoped `['cart']` & `['wishlist-count']`** | 22 trang (`cart`) & 20 trang (`wishlist-count`) | Không chứa `userId`; 20/24 trang logout không dọn 2 key này; 4 trang còn lại chỉ gọi `invalidateQueries` (đánh dấu stale chứ không xóa khỏi RAM — với `enabled: !!currentUser`, `wishlist-count` không refetch khi logout và vẫn giữ nguyên số đếm của Account A trong bộ nhớ!). |
| **Login/Register chỉ invalidate `['cart']`** | [`LoginPage.tsx`](file:///d:/Nexora/apps/web/src/features/auth/LoginPage.tsx#L30), [`RegisterPage.tsx`](file:///d:/Nexora/apps/web/src/features/auth/RegisterPage.tsx#L79), [`AuthModal.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/AuthModal.tsx#L33) | Khi Account B đăng nhập (kể cả sau logout hoặc ghi đè trực tiếp không bấm logout), chỉ gọi `invalidateQueries({ queryKey: ['cart'] })` — bỏ qua hoàn toàn `wishlist`, `wishlist-count`, `my-orders`, `profile`, `customer-addresses`, `notifications`, `customer-returns`, `review-eligibility`, `admin-*`. |
| **Không có 401 token-expiry interceptor** | [`apps/web/src/lib/apiClient.ts`](file:///d:/Nexora/apps/web/src/lib/apiClient.ts#L14-L20) | Chỉ có request interceptor gắn `Bearer` token; không có response interceptor. Riêng `AdminDashboardPage.tsx:333-336` tự xử lý `401/403` bằng `authService.logout()` nhưng không xóa 8 query cache `admin-*`. |

---

## 3. Logout Handler Inventory (Toàn bộ 27 điểm gọi trên 24 file + 4 điểm Login/Register)

### 3.1. Toàn bộ 24 file gọi `authService.logout()`

| # | File Path & Function / Line | Trang / Module | Cách xóa Auth State | Cách xử lý TanStack Query Cache | Rủi ro & Khác biệt |
|---|---|---|---|---|---|
| 1 | [`services/authService.ts`](file:///d:/Nexora/apps/web/src/services/authService.ts#L138-L141) (`logout`) | Core Auth Service | Xóa `nexora_token`, `nexora_user` khỏi `localStorage` | **Không có** | Không emit event, không xóa `sessionStorage['lastOrder']`, không reset `passiveMergeGuard` |
| 2 | [`features/wishlist/WishlistPage.tsx`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L71-L74) (`handleLogout`) | `/wishlist` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | **BLOCKER (R-02):** Để nguyên `['wishlist']`, `['cart']` trong RAM 30s fresh / 5m `gcTime` |
| 3 | [`features/profile/ProfilePage.tsx`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L461-L469) (`handleLogout`, 2 nút: Header line 506 & Sidebar line 654) | `/profile/*` | `authService.logout()` + `setCurrentUser(null)` + `navigate('/')` | `removeQueries`: `['customer-returns']`, `['customer-return-detail']`, `['my-orders']` | **Sót:** `['cart']`, `['wishlist']`, `['wishlist-count']`, `['profile']`, `['customer-addresses']`, `['notifications']`, `['review-eligibility']`, `['admin-*']` |
| 4 | [`features/catalog/ProductDetailPage.tsx`](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx#L415-L421) & [L501-L509](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx#L501-L509) (2 nhánh inline `onLogout`) | `/product/:slug` | `authService.logout()` + `setCurrentUser(null)` | `invalidateQueries`: `['cart']`, `['wishlist-count']`; `removeQueries`: `['review-eligibility']` | **Sót:** `['wishlist']`, `['profile']`, `['my-orders']`, `['customer-addresses']`, `['notifications']`, `['customer-returns']`, `['admin-*']`; `wishlist-count` bị disable nên không refetch |
| 5 | [`features/storefront/StorefrontHome.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHome.tsx#L93-L99) (`handleLogout`) | `/` | `authService.logout()` + `setCurrentUser(null)` | `invalidateQueries`: `['cart']`, `['wishlist-count']` | **Sót** toàn bộ 16 prefix còn lại; chỉ invalidate (không remove) |
| 6 | [`features/cart/CartPage.tsx`](file:///d:/Nexora/apps/web/src/features/cart/CartPage.tsx#L184-L189) (inline `onLogout`) | `/cart` | `authService.logout()` + `setCurrentUser(null)` | `invalidateQueries`: `['cart']`, `['wishlist-count']` | **Sót** toàn bộ 16 prefix còn lại; chỉ invalidate (không remove) |
| 7 | [`features/catalog/SearchPage.tsx`](file:///d:/Nexora/apps/web/src/features/catalog/SearchPage.tsx#L644-L649) (inline `onLogout`) | `/search` | `authService.logout()` + `setCurrentUser(null)` | `invalidateQueries`: `['cart']`, `['wishlist-count']` | **Sót** toàn bộ 16 prefix còn lại; chỉ invalidate (không remove) |
| 8 | [`features/admin/AdminDashboardPage.tsx`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L334), [L637](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L637), [L1856](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L1856) (3 điểm gọi: 401/403 auto-logout, non-admin reject, Sidebar logout) | `/admin` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | **HIGH/CRITICAL:** Để nguyên cả 8 key `admin-*` (gồm `admin-users` chứa toàn bộ PII khách hàng!) trong RAM khi ADMIN logout hoặc hết phiên |
| 9 | [`features/checkout/CheckoutPage.tsx`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx#L201) | `/checkout` | `authService.logout()` *(không có `setCurrentUser`!)* | **KHÔNG CÓ (`0` keys)** | `['cart']` & form PII vẫn hiển thị, không xóa cache |
| 10 | [`features/checkout/CheckoutSuccessPage.tsx`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutSuccessPage.tsx#L53) | `/checkout/success` | `authService.logout()` *(không có `setCurrentUser`!)* | **KHÔNG CÓ (`0` keys)** | Để nguyên `sessionStorage['lastOrder']` + mọi query cache |
| 11 | [`features/auth/LoginPage.tsx`](file:///d:/Nexora/apps/web/src/features/auth/LoginPage.tsx#L59) | `/auth/login`, `/login` | `authService.logout()` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 12 | [`features/auth/RegisterPage.tsx`](file:///d:/Nexora/apps/web/src/features/auth/RegisterPage.tsx#L101) | `/auth/register` | `authService.logout()` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 13 | [`features/ai/AiAssistantPage.tsx`](file:///d:/Nexora/apps/web/src/features/ai/AiAssistantPage.tsx#L402-L403) | `/ai-assistant` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên `['cart']`, `['wishlist']`, `['wishlist-count']`, ... |
| 14 | [`features/compare/ComparePage.tsx`](file:///d:/Nexora/apps/web/src/features/compare/ComparePage.tsx#L336-L337) | `/compare` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 15 | [`features/pcBuilder/PcBuilderPage.tsx`](file:///d:/Nexora/apps/web/src/features/pcBuilder/PcBuilderPage.tsx#L538-L539) | `/pc-builder` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 16 | [`features/orderTracking/OrderTrackingPage.tsx`](file:///d:/Nexora/apps/web/src/features/orderTracking/OrderTrackingPage.tsx#L130-L131) | `/order-tracking` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 17 | [`features/stores/StoresPage.tsx`](file:///d:/Nexora/apps/web/src/features/stores/StoresPage.tsx#L107-L108) | `/stores` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 18 | [`features/tradeIn/TradeInPage.tsx`](file:///d:/Nexora/apps/web/src/features/tradeIn/TradeInPage.tsx#L102-L103) | `/trade-in` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 19 | [`features/news/NewsPage.tsx`](file:///d:/Nexora/apps/web/src/features/news/NewsPage.tsx#L164-L165) | `/news` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 20 | [`features/news/PostDetailPage.tsx`](file:///d:/Nexora/apps/web/src/features/news/PostDetailPage.tsx#L150-L151) | `/news/:slug` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 21 | [`features/policy/PolicyPage.tsx`](file:///d:/Nexora/apps/web/src/features/policy/PolicyPage.tsx#L139-L140) | `/policy/:type` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 22 | [`features/info/AboutPage.tsx`](file:///d:/Nexora/apps/web/src/features/info/AboutPage.tsx#L37-L38) | `/about` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 23 | [`features/info/CareersPage.tsx`](file:///d:/Nexora/apps/web/src/features/info/CareersPage.tsx#L147-L148) | `/careers` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 24 | [`features/info/ContactPage.tsx`](file:///d:/Nexora/apps/web/src/features/info/ContactPage.tsx#L79-L80) | `/contact` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 25 | [`features/info/GuidePage.tsx`](file:///d:/Nexora/apps/web/src/features/info/GuidePage.tsx#L76-L77) | `/guide` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 26 | [`features/info/TechnicalSupportPage.tsx`](file:///d:/Nexora/apps/web/src/features/info/TechnicalSupportPage.tsx#L86-L87) | `/support` | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |
| 27 | [`features/errors/NotFoundPage.tsx`](file:///d:/Nexora/apps/web/src/features/errors/NotFoundPage.tsx#L40-L41) | `*` (404) | `authService.logout()` + `setCurrentUser(null)` | **KHÔNG CÓ (`0` keys)** | Để nguyên toàn bộ cache phiên trước |

*(Lưu ý: `StorefrontHeader.tsx:594` là component UI trung tâm nhận prop `onLogout` và được render bởi toàn bộ 23 trang Customer/Storefront phía trên; `ForgotPasswordPage.tsx` và `ResetPasswordPage.tsx` không có logout handler.)*

### 3.2. Các điểm Login / Register / Account Switching

| # | File Path & Line | Cơ chế xác thực | Xử lý Query Cache sau Login/Register | Rủi ro khi đổi tài khoản không qua Logout |
|---|---|---|---|---|
| 1 | [`features/auth/LoginPage.tsx`](file:///d:/Nexora/apps/web/src/features/auth/LoginPage.tsx#L29-L30) | `authService.login()` | Chỉ `invalidateQueries(['cart'])` | Nếu Account B đăng nhập trực tiếp khi Account A chưa logout → toàn bộ cache private của A vẫn còn nguyên trong RAM! |
| 2 | [`features/auth/RegisterPage.tsx`](file:///d:/Nexora/apps/web/src/features/auth/RegisterPage.tsx#L78-L79) | `authService.register()` | Chỉ `invalidateQueries(['cart'])` | Tương tự: để nguyên cache private của tài khoản trước |
| 3 | [`features/storefront/AuthModal.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/AuthModal.tsx#L32-L33) & [L55-L56](file:///d:/Nexora/apps/web/src/features/storefront/AuthModal.tsx#L55-L56) | `authService.login()` / `register()` | Chỉ `invalidateQueries(['cart'])` | Tương tự: để nguyên cache private của tài khoản trước |
| 4 | [`features/admin/AdminDashboardPage.tsx`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L632-L644) | `authService.login()` | `syncAllCaches()` (invalidate, không remove) | Dữ liệu cũ hiển thị tạm thời (stale-while-revalidate) trước khi refetch xong |

---

## 4. Private Query Key Inventory (100% Toàn bộ `apps/web/src`)

### 4.1. Toàn bộ 18 Private / Account-Scoped Query Key Families

| # | Query Key hiện tại | File khai báo & dòng | Endpoint / Query Function | Có `userId`? | Dọn khi Logout? | Nguy cơ rò rỉ khi Account Switch? | Các trang hiển thị dữ liệu |
|---|---|---|---|---|---|---|---|
| 1 | `['wishlist']` | [`WishlistPage.tsx:39`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx#L39) | `GET /wishlist` (`wishlistService.getWishlist`) | **KHÔNG (`❌`)** | **KHÔNG (0/24 trang)** | **CRITICAL (ĐÃ TÁI HIỆN — R-02)** | `/wishlist` |
| 2 | `['wishlist-count']` | **20 trang** (`StorefrontHome`, `CartPage`, `ProductDetailPage`, `SearchPage`, `ProfilePage`, `AiAssistantPage`, `ComparePage`, `PcBuilderPage`, `OrderTrackingPage`, `StoresPage`, `TradeInPage`, `NewsPage`, `PostDetailPage`, `PolicyPage`, `AboutPage`, `CareersPage`, `ContactPage`, `GuidePage`, `TechnicalSupportPage`, `NotFoundPage`) | `GET /wishlist/count` (`wishlistService.getWishlistCount`) | **KHÔNG (`❌`)** | Chỉ `invalidate` ở 4/24 trang *(không remove; bị `enabled: !!currentUser` khóa refetch khi logout!)* | **HIGH** — Account B thấy ngay badge đếm wishlist của Account A | Header trên 20 trang |
| 3 | `['cart']` | **22 trang** (20 trang trên + `WishlistPage:33`, `CheckoutPage:49`) | `GET /cart` (`cartService.getCart`, kèm Bearer token + `x-guest-session-id`) | **KHÔNG (`❌`)** | Chỉ `invalidate` ở 4/24 trang; **0/24 trang remove** | **CRITICAL** — Guest sau logout hoặc Account B trong 30s thấy giỏ hàng riêng tư của Account A nếu A logout từ `ProfilePage`/`WishlistPage`/`CheckoutPage`/16 trang khác! | Header badge (22 trang), `/cart`, `/checkout` |
| 4 | `['profile', currentUser?.id]` | [`ProfilePage.tsx:73`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L73) | `GET /profile` (`profileService.getProfile`) | **CÓ (`userId`)** | **KHÔNG (0/24 trang)** | Thấp giữa A→B (tách key), nhưng **PII của A tồn tại trong RAM 5 phút sau logout** | `/profile` |
| 5 | `['customer-addresses', currentUser?.id]` | [`ProfilePage.tsx:133`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L133) | `GET /addresses` (`profileService.getAddresses`) | **CÓ (`userId`)** | **KHÔNG (0/24 trang)** | Thấp giữa A→B (tách key), nhưng **địa chỉ & SĐT của A tồn tại trong RAM 5 phút sau logout** | `/profile/addresses` |
| 6 | `['notifications', currentUser?.id]` | [`ProfilePage.tsx:327`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L327) | `GET /notifications` (`profileService.getNotifications`) | **CÓ (`userId`)** | **KHÔNG (0/24 trang)** | Thấp giữa A→B (tách key), nhưng **thông báo đơn hàng của A tồn tại trong RAM 5 phút sau logout** | `/profile/notifications` |
| 7 | `['my-orders', currentUser?.id]` | [`ProfilePage.tsx:440`](file:///d:/Nexora/apps/web/src/features/profile/ProfilePage.tsx#L440) | `GET /orders/my-orders` (`returnService.getMyOrders`) | **CÓ (`userId`)** | Chỉ `remove` ở `ProfilePage` (1/24 trang) | Thấp giữa A→B, nhưng **tồn tại trong RAM 5 phút nếu logout từ 23 trang còn lại** | `/profile/orders`, `/profile/return` |
| 8 | `['customer-returns', currentUser?.id, page, limit]` | [`CustomerReturnsTab.tsx:791`](file:///d:/Nexora/apps/web/src/features/profile/components/CustomerReturnsTab.tsx#L791) | `GET /returns/my-returns` | **CÓ (`userId`)** | Chỉ `remove` ở `ProfilePage` (1/24 trang) | Thấp giữa A→B, nhưng **tồn tại trong RAM 5 phút nếu logout từ 23 trang còn lại** | `/profile/return` |
| 9 | `['customer-return-detail', currentUser?.id, activeDetailId]` | [`CustomerReturnsTab.tsx:803`](file:///d:/Nexora/apps/web/src/features/profile/components/CustomerReturnsTab.tsx#L803) | `GET /returns/my-returns/:id` | **CÓ (`userId`)** | Chỉ `remove` ở `ProfilePage` (1/24 trang) | Thấp giữa A→B, nhưng **tồn tại trong RAM 5 phút nếu logout từ 23 trang còn lại** | Modal chi tiết `/profile/return` |
| 10 | `['review-eligibility', productId, currentUser?.id]` | [`ProductDetailPage.tsx:269`](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx#L269) | `GET /products/:id/reviews/eligibility` | **CÓ (`userId`)** | Chỉ `remove` ở `ProductDetailPage` (1/24 trang) | Thấp giữa A→B, nhưng **tồn tại trong RAM 5 phút nếu logout từ 23 trang còn lại** | `/product/:slug` |
| 11 | `['admin-data', currentUser?.id, currentUser?.role]` | [`AdminDashboardPage.tsx:321`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L321) | `/admin/dashboard/summary`, `/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/inventory/logs` | **CÓ (`id, role`)** | **KHÔNG (0/24 trang)** | Dữ liệu doanh thu/đơn hàng cửa hàng lưu trong RAM 5 phút sau logout / 401 | `/admin` |
| 12 | `['admin-brands']` | [`AdminDashboardPage.tsx:357`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L357) | `GET /admin/brands` | **KHÔNG (`❌`)** | **KHÔNG** | **MEDIUM-HIGH** (ADMIN → STAFF đổi phiên trong 30s) | `/admin` (tab Brands/Products) |
| 13 | `['admin-coupons']` | [`AdminDashboardPage.tsx:367`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L367) | `GET /admin/coupons` | **KHÔNG (`❌`)** | **KHÔNG** | **MEDIUM-HIGH** (ADMIN → STAFF đổi phiên trong 30s) | `/admin` (tab Coupons) |
| 14 | `['admin-flash-sales']` | [`AdminDashboardPage.tsx:377`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L377) | `GET /admin/flash-sales` | **KHÔNG (`❌`)** | **KHÔNG** | **MEDIUM-HIGH** | `/admin` (tab Flash Sales) |
| 15 | `['admin-banners']` | [`AdminDashboardPage.tsx:387`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L387) | `GET /admin/banners` | **KHÔNG (`❌`)** | **KHÔNG** | **MEDIUM-HIGH** | `/admin` (tab Banners) |
| 16 | `['admin-posts']` | [`AdminDashboardPage.tsx:397`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L397) | `GET /admin/posts` | **KHÔNG (`❌`)** | **KHÔNG** | **MEDIUM-HIGH** | `/admin` (tab Posts) |
| 17 | `['admin-users']` | [`AdminDashboardPage.tsx:407`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L407) | `GET /admin/users` *(chứa toàn bộ danh sách khách hàng + email + role!)* | **KHÔNG (`❌`)** | **KHÔNG** | **HIGH** — STAFF (hoặc phiên sau) có thể thấy danh sách toàn bộ tài khoản từ cache của ADMIN trước khi RBAC từ chối! | `/admin` (tab Users) |
| 18 | `['admin-reviews']` | [`AdminDashboardPage.tsx:417`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L417) | `GET /admin/reviews` *(gồm cả review HIDDEN)* | **KHÔNG (`❌`)** | **KHÔNG** | **MEDIUM-HIGH** | `/admin` (tab Reviews) |

### 4.2. Lưu trữ ngoài TanStack Query mang dữ liệu theo tài khoản

- **`sessionStorage['lastOrder']`** ([`CheckoutPage.tsx:167`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx#L167), [`CheckoutSuccessPage.tsx:25`](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutSuccessPage.tsx#L25)): Lưu thông tin đơn hàng gần nhất (mã đơn, tổng tiền, phương thức thanh toán) và không bị xóa khi logout.
- **In-memory passive merge guard** ([`cartService.ts:58-60, 113`](file:///d:/Nexora/apps/web/src/services/cartService.ts#L58-L60)): Biến module `lastAttemptedSessionId` & `lastAttemptFailed` không được reset khi logout/login dù comment ở line 111 đã khuyến cáo phải reset khi đổi tài khoản.

### 4.3. Public Query Keys (Bắt buộc GIỮ NGUYÊN, không xóa khi logout)

- `['categories']`, `['products']`, `['products-full-catalog']`, `['product-detail', slug]`, `['product-reviews', productId, page, limit]`, `['reviews', 'home']`, `['active-flash-sale']`, `['brands']`, `['posts', ...]`, `['post-detail', slug]`, `['banners', 'hero' | 'sidebar' | 'popup']`, `['live-search', ...]`, `['active-coupons']`, `['system', 'health']`, `['system', 'meta']`.

---

## 5. Cross-Account Exposure Scope

| Kịch bản phơi nhiễm dữ liệu | Mức độ nghiêm trọng | Điều kiện xảy ra | Dữ liệu bị lộ |
|---|---|---|---|
| **1. Wishlist Cross-Account Leak (R-02 — ĐÃ TÁI HIỆN)** | **P0 / BLOCKER** | Account A mở `/wishlist` → logout từ bất kỳ trang nào (24/24 trang!) → Account B mở `/wishlist` trong vòng `30s` (fresh) hoặc `5 phút` (stale-while-revalidate) | Toàn bộ danh sách sản phẩm yêu thích riêng tư của Account A hiển thị cho Account B với `0` API request trong 30s đầu |
| **2. Cart Cross-Account & Post-Logout Guest Leak** | **P0 / BLOCKER** | Account A mở `/cart` hoặc bất kỳ trang nào có header → logout từ `ProfilePage`, `WishlistPage`, `CheckoutPage`, hoặc 16 trang không dọn `['cart']` → Guest mở `/cart` (hoặc Account B đăng nhập trong 30s) | Giỏ hàng riêng tư, số lượng và tổng tiền của Account A hiển thị cho Guest ngay sau logout hoặc nháy dữ liệu cũ cho Account B |
| **3. Wishlist Count Badge Leak** | **P1 / HIGH** | Account A mở bất kỳ trang storefront nào → logout (kể cả từ 4 trang có gọi `invalidateQueries`, vì `enabled: !!currentUser` làm query không refetch) → Account B đăng nhập | Số lượng wishlist của Account A hiện ngay trên header của Account B trước khi refetch |
| **4. Admin → Staff Role Downgrade Cache Leak** | **P1 / HIGH** | ADMIN mở `/admin` (tab `users`, `coupons`, `reviews`...) → logout hoặc hết phiên 401 → STAFF đăng nhập `/admin` trong 30s | Toàn bộ cache `admin-users` (PII khách hàng), `admin-coupons`, `admin-reviews` của ADMIN phục vụ trực tiếp cho STAFF từ cache |
| **5. Residual PII in SPA Memory (`gcTime: 5m`)** | **P2 / MEDIUM** | Account A mở `/profile` (`profile`, `customer-addresses`, `notifications`, `my-orders`, `customer-returns`) → logout từ trang khác (hoặc ngay tại `ProfilePage` đối với `profile`, `customer-addresses`, `notifications`) | PII (họ tên, email, SĐT, địa chỉ nhà, thông báo) của Account A vẫn nằm nguyên trong bộ nhớ JS `QueryClient` tới 5 phút sau logout |
| **6. Direct Login-Over-Session (không bấm Logout)** | **P0 / BLOCKER** | Account A bỏ phiên chưa bấm Logout (hoặc token hết hạn) → Account B mở `/auth/login` đăng nhập trực tiếp | Mọi key không gắn `userId` (`wishlist`, `wishlist-count`, `cart`, `admin-*`) của Account A vẫn fresh trong RAM và truyền sang Account B |
| **7. `sessionStorage['lastOrder']` Leak** | **P2 / MEDIUM** | Account A đặt hàng xong tại `/checkout/success` → logout → Account B mở `/checkout/success` trong cùng tab | Thông tin đơn hàng vừa đặt của Account A hiển thị cho Account B |

---

## 6. Evidence và Reproduction Analysis

### 6.1. Bằng chứng đã xác minh từ M6.5

- **Test tái hiện thực nghiệm:** [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx#L584-L656) (`Flow 7 + R-02 Empirical Reproduction`, đã chạy thực tế PASS tái hiện lỗi trong Report 29).
- **Diễn biến tái hiện chính xác:**
  1. SPA dùng chung 1 `QueryClient` với `staleTime: 30_000` (khớp `apps/web/src/app/providers.tsx:11`).
  2. Account A (`userId: 101`) mở `/wishlist` → `GET /api/v1/wishlist` chạy 1 lần, trả `"Wishlist Riêng Tư Của User A"` và lưu vào key `['wishlist']`.
  3. Account A bấm đăng xuất trên `WishlistPage` → `WishlistPage.handleLogout` chỉ gọi `authService.logout()` + `setCurrentUser(null)`. Kiểm tra trực tiếp `queryClient.getQueryData(['wishlist'])` xác nhận dữ liệu của User A **vẫn còn nguyên trong cache**.
  4. Account B (`userId: 202`) đăng nhập trên cùng SPA instance trong vòng `30s` và mở `/wishlist`.
  5. **Quan sát:** `wishlistService.getWishlist()` **KHÔNG được gọi thêm lần nào** (`toHaveBeenCalledTimes(1)` — giữ nguyên số lần của User A), trong khi màn hình của Account B **hiển thị trực tiếp `"Wishlist Riêng Tư Của User A"`**.
- **Test đối chứng phân mảnh `R-02B`** ([`m6_5_customer_integration_qa.test.tsx:658-698`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx#L658-L698)): Chứng minh `ProfilePage` xóa `customer-returns` và `my-orders`, nhưng bỏ sót `['profile', userA.id]` trong RAM sau logout.

### 6.2. Phân biệt lỗi Frontend Cache vs Backend Data Leak

- **Backend KHÔNG rò rỉ dữ liệu:** Toàn bộ 176/176 bài test Real MySQL Integration & Security ở Tier 2 (`phase_a_security_remediation.test.ts`, `phase_b_profile_addresses.test.ts`, `phase_b_customer_reviews.test.ts`, `phase_b_returns_and_admin_crud.test.ts`, `phase_b_cart_merge.test.ts`) đã chứng minh Backend tách biệt tuyệt đối dữ liệu theo JWT `req.user.id` và chống IDOR 100%.
- **Bản chất R-02 là 100% Frontend Client-Side State/Cache Isolation Failure:** Do TanStack Query thỏa điều kiện `staleTime: 30_000` trên key không gắn `userId` và không bị xóa khi logout, trình duyệt **thậm chí không gửi request lên Backend** mà phục vụ thẳng dữ liệu RAM của Account A cho Account B. Ngoài cửa sổ 30s (từ 30s đến 5 phút `gcTime`), dữ liệu cũ của Account A vẫn bị nháy hiển thị tạm thời (stale-while-revalidate) trước khi response của Account B trả về.

---

## 7. Remediation Design

### 7.1. So sánh 3 phương án kiến trúc

| Phương án | Cơ chế | Ưu điểm | Nhược điểm | Đánh giá |
|---|---|---|---|---|
| **Phương án 1: Chỉ Centralized Logout/Session Cache Cleanup** | Phát sự kiện từ `authService` (`logout`/`login`/`register`) → `clearPrivateQueryCache(queryClient)` (`cancelQueries` + `removeQueries` cho toàn bộ 18 prefix private) tại `AppProviders` + `StorefrontHeader`. | Phủ tức thì 100% cả 27 điểm logout + 4 điểm login/register + Admin 401/403 + liên tab (`storage` event); xóa sạch PII khỏi RAM; bảo toàn 100% public cache; blast radius cực nhỏ (4 file). | Thiếu lớp phòng vệ dự phòng (defense-in-depth) nếu tương lai có code/test thay `localStorage` trực tiếp mà bỏ qua `authService`. | Mạnh ở Lớp 1, thiếu Lớp 2. |
| **Phương án 2: Chỉ Identity-Scoped Private Query Keys** | Thêm `userId` vào mọi private query key (`['wishlist', userId]`, `['cart', userId ?? 'guest']`, `['wishlist-count', userId]`, `['admin-*', userId, role]`). | Tách biệt bucket giữa Account A và Account B ngay cả khi không gọi `removeQueries`. | **Không giải quyết triệt để:** (1) PII của Account A vẫn tồn tại trong RAM 5 phút sau logout; (2) Nếu cùng 1 user đăng xuất rồi đăng nhập lại (hoặc chuyển A → Guest trên `cart`), dễ sót dữ liệu cũ; (3) Phải sửa **22+ file trang** cho `cart`/`wishlist-count` để tránh phân mảnh key! | Không đủ đơn độc; blast radius quá lớn nếu áp dụng cho 22 file. |
| **Phương án 3 (KHUYẾN NGHỊ): Kết hợp Lớp 1 (Centralized Auth Session Cache Purge) + Lớp 2 (Identity-Scoped Key cho các single-owner private query chưa có `userId`)** | **Lớp 1:** Module tập trung `authQueryCache.ts` + sự kiện `authService` (`logout`, `login`, `register`) + đăng ký tự động tại `AppProviders` (kèm cross-tab `storage`) & `StorefrontHeader` (`useAuthQueryCacheSync` idempotent qua `WeakSet`). **Lớp 2:** Thêm `currentUser?.id` vào `['wishlist', currentUser?.id]` tại `WishlistPage.tsx` (7 key Customer khác đã có `userId` sẵn!). | Đạt **cả 2 lớp bảo vệ**: (1) Xóa sạch 18 prefix private + cancel in-flight requests + xóa `sessionStorage['lastOrder']` + reset `passiveMergeGuard` bất kể logout từ trang nào hay login-over-session; (2) `['wishlist', userId]` tách tuyệt đối identity kể cả khi bypass `authService`; (3) Bảo toàn 100% public cache & Guest Cart Merge; (4) **Chỉ chạm đúng 5 file nguồn + 1 file test**, KHÔNG gây key-split cho `['cart']` / `['wishlist-count']` trên 22 trang! | `['cart']` & `['wishlist-count']` (trải trên 22 trang) dựa vào Lớp 1 purge thay vì sửa hàng loạt 22 file *(đã được chứng minh an toàn tuyệt đối vì mọi transition Auth đều đi qua `authService` và xóa sạch `['cart']`/`['wishlist-count']` đồng bộ)*. | **TỐI ƯU NHẤT CHO P0 HOTFIX** |

### 7.2. Kiểm tra 8 yêu cầu bắt buộc đối với Phương án 3

1. **Nhất quán, không phụ thuộc trang logout:** Mọi trang (24/24) đều gọi `authService.logout()` → phát sự kiện tập trung → `clearPrivateQueryCache(queryClient)` chạy đồng nhất bất kể nút logout nằm ở đâu.
2. **Xử lý sạch private query cache của tài khoản hiện tại:** Dùng `cancelQueries` (ngăn request đang bay của A trả về muộn ghi đè cache của B) kết hợp `removeQueries` (xóa hoàn toàn khỏi RAM, loại bỏ cả stale-while-revalidate flash) cho đúng 18 prefix private + `sessionStorage.removeItem('lastOrder')`.
3. **Account switching an toàn (kể cả không bấm Logout):** `authService.login()` và `authService.register()` cũng phát sự kiện `'session-change'` → xóa sạch 18 prefix private của phiên trước ngay khi phiên mới được thiết lập, đồng thời lắng nghe `window.addEventListener('storage', ...)` cho trường hợp đăng xuất/đổi tài khoản ở tab khác.
4. **Đánh giá thêm `userId` vào private query keys:**
   - 8/18 prefix **đã có sẵn `userId`** (`profile`, `customer-addresses`, `notifications`, `my-orders`, `customer-returns`, `customer-return-detail`, `review-eligibility`, `admin-data`).
   - `['wishlist']` chỉ khai báo ở **1 file duy nhất** (`WishlistPage.tsx:39`) → **bắt buộc đổi thành `['wishlist', currentUser?.id]`**.
   - `['cart']` (22 file) và `['wishlist-count']` (20 file): **KHÔNG nên sửa nửa vời vài file** vì sẽ tạo 2 cache bucket song song (`['cart']` và `['cart', userId]`) gây double-fetch và lệch đồng bộ giữa các trang. Với P0, Lớp 1 đã hủy & xóa sạch `['cart']` và `['wishlist-count']` trên mọi chuyển đổi Auth; việc trích `useCartQuery`/`useWishlistCountQuery` trên 22 trang nên tách thành refactor riêng hậu M6.5 nếu cần.
5. **Bảo toàn 100% public cache:** Danh sách `PRIVATE_QUERY_KEY_PREFIXES` là explicit allow-list chỉ xóa 18 prefix private; KHÔNG gọi `queryClient.clear()` toàn cục nên `categories`, `products`, `product-detail`, `product-reviews`, `banners`, `brands`, `posts`, `active-flash-sale`, `system` được giữ nguyên vẹn.
6. **Không phá Guest Cart & Guest Cart Merge (M6.1):**
   - Trong `authService.login()` / `register()`, luồng `guestSessionId` + `validateMergeResult` + Immediate Retry + `clearGuestSession()` giữ nguyên 100%; chỉ phát sự kiện `emitAuthSessionChange('login')` sau khi lưu token/user và hoàn tất bước merge, đồng thời giữ nguyên `queryClient.invalidateQueries({ queryKey: ['cart'] })` ở `LoginPage`, `RegisterPage`, `AuthModal` (bảo toàn 100% assertions trong `m6_1_guest_cart_merge.test.tsx`).
   - Khi Customer đăng xuất về Guest, `removeQueries({ queryKey: ['cart'] })` xóa giỏ hàng của Customer khỏi RAM; `useQuery(['cart'])` tự động fetch lại `GET /cart` bằng `x-guest-session-id` mà không gửi `Bearer` token → Guest nhận đúng giỏ hàng guest sạch.
7. **Không phá query invalidation hiện có:** TanStack Query mặc định khớp theo prefix (`exact: false`). Do đó `invalidateQueries({ queryKey: ['wishlist'] })` tại `WishlistPage.tsx:62` vẫn khớp hoàn hảo với `['wishlist', currentUser?.id]`, và toàn bộ assertions hiện có trong `m6_1`..`m6_4` (`['cart']`, `['review-eligibility']`, `['customer-returns']`, `['customer-return-detail']`, `['my-orders']`, `['notifications']`, `['customer-addresses']`) đều tương thích 100%.
8. **Không thay đổi API contract hoặc Backend business logic:** 100% thay đổi nằm thuần trong `apps/web`.

---

## 8. Exact Proposed File Allowlist

### 8.1. Core Allowlist Đề Xuất (Bắt buộc — 5 source files + 1 test file = 6 files)

| # | File Path | Loại | Function / Component liên quan | Lý do phải sửa | Thay đổi dự kiến | Có thể tránh sửa file này không? |
|---|---|---|---|---|---|---|
| 1 | `apps/web/src/lib/authQueryCache.ts` | **NEW** | `PRIVATE_QUERY_KEY_PREFIXES`, `clearPrivateQueryCache()`, `subscribeAuthSessionChange()`, `emitAuthSessionChange()`, `bindQueryClientToAuthEvents()`, `useAuthQueryCacheSync()` | Tạo nguồn chân lý duy nhất (Single Source of Truth) định nghĩa 18 private query key prefixes và cơ chế pub/sub đồng bộ `QueryClient` không lặp code giữa 24 trang. | Tạo module nhẹ (~80 dòng), dùng `WeakSet<QueryClient>` chống đăng ký trùng giữa `AppProviders` và `StorefrontHeader`, gọi `cancelQueries` + `removeQueries` cho 18 prefix private. | **KHÔNG** — nếu không có module trung tâm này sẽ phải copy-paste `removeQueries` vào cả 24 file và lặp lại lỗi phân mảnh R-02. |
| 2 | [`apps/web/src/services/authService.ts`](file:///d:/Nexora/apps/web/src/services/authService.ts) | **MODIFY** | `authService.logout()`, `authService.login()`, `authService.register()` | Là điểm hội tụ duy nhất của 100% thao tác đăng xuất (27 chỗ) và đăng nhập/đăng ký (4 chỗ). | Trong `logout()`: xóa `nexora_token`, `nexora_user`, xóa `sessionStorage['lastOrder']`, gọi `cartService.resetPassiveMergeGuard()`, gọi `emitAuthSessionChange('logout')`. Trong `login()`/`register()`: gọi `cartService.resetPassiveMergeGuard()`, giữ nguyên logic Guest Cart Merge, gọi `emitAuthSessionChange('login')`. | **KHÔNG** — mọi trang đều đi qua `authService`; phát sự kiện tại đây là điều kiện tiên quyết để không phụ thuộc trang logout. |
| 3 | [`apps/web/src/app/providers.tsx`](file:///d:/Nexora/apps/web/src/app/providers.tsx) | **MODIFY** | `AppProviders` | Nơi khởi tạo và sở hữu root `QueryClient` singleton của toàn SPA. | Dùng `useEffect` gọi `bindQueryClientToAuthEvents(queryClient)` và đăng ký `window.addEventListener('storage', ...)` để khi tab khác xóa/đổi `nexora_token` hoặc `nexora_user` thì tab hiện tại cũng lập tức xóa sạch 18 prefix private. | **KHÔNG** — đây là nơi duy nhất gắn kết root `QueryClient` cho mọi route (gồm cả `/admin` không dùng `StorefrontHeader`). |
| 4 | [`apps/web/src/features/storefront/StorefrontHeader.tsx`](file:///d:/Nexora/apps/web/src/features/storefront/StorefrontHeader.tsx) | **MODIFY** | `StorefrontHeader` | Được mount trên toàn bộ 23 trang Customer/Storefront; đảm bảo cả các bài test component/integration mount `<QueryClientProvider>` cục bộ (không bọc `<AppProviders>`) cũng tự động đồng bộ cache khi logout/login. | Gọi 1 dòng `useAuthQueryCacheSync()` trong `StorefrontHeader` (an toàn & idempotent nhờ `WeakSet` khi chạy chung với `AppProviders`). | **KHÔNG NÊN TRÁNH** — nếu bỏ qua file này, mọi test render trang trực tiếp với `<QueryClientProvider>` (như `m6_5`, `m6_1..m6_4`) sẽ không kích hoạt listener ở `AppProviders` trừ khi test phải tự bọc `AppProviders`. |
| 5 | [`apps/web/src/features/wishlist/WishlistPage.tsx`](file:///d:/Nexora/apps/web/src/features/wishlist/WishlistPage.tsx) | **MODIFY** | `WishlistPage` (`useQuery` line 39) | Triển khai Lớp 2 (identity-scoped key) cho `['wishlist']` — query dữ liệu riêng tư duy nhất phía Customer chưa gắn `userId` và chỉ xuất hiện tại đúng 1 file này. | Đổi `queryKey: ['wishlist']` → `queryKey: ['wishlist', currentUser?.id]`. (Giữ nguyên `invalidateQueries({ queryKey: ['wishlist'] })` ở line 62 vì TanStack Query prefix-match.) | **KHÔNG** — Project Owner yêu cầu đủ cả 2 lớp bảo vệ (cleanup khi logout + phân vùng theo identity). |
| 6 | [`apps/web/tests/m6_5_customer_integration_qa.test.tsx`](file:///d:/Nexora/apps/web/tests/m6_5_customer_integration_qa.test.tsx) | **MODIFY** | R-02 & R-02B test cases + bổ sung regression suite cho CR-M6.5-01 | Cập nhật test R-02/R-02B từ "chứng minh lỗi tồn tại" sang "chứng minh lỗ hổng đã đóng triệt để" và kiểm chứng toàn bộ các kịch bản chuyển tài khoản, Guest Cart, Public Cache. | Cập nhật test #6 & #7 và bổ sung các regression tests theo Mục 9 dưới đây. (Giữ nguyên test #8 tái hiện R-03 vì R-03 thuộc `CR-M6.5-02`!) | **KHÔNG** — bắt buộc phải có regression tests chứng minh Account B không thể thấy dữ liệu Account A. |

### 8.2. Các file ĐÃ XEM XÉT nhưng KHÔNG CẦN ĐƯA VÀO ALLOWLIST (tránh mở rộng scope)

- **`AdminDashboardPage.tsx` (6,311 dòng):** Có thể **TRÁNH SỬA** trong `CR-M6.5-01` vì Lớp 1 tại `providers.tsx` đã tự động purge toàn bộ 8 key `admin-*` (`admin-data`, `admin-brands`, `admin-coupons`, `admin-flash-sales`, `admin-banners`, `admin-posts`, `admin-users`, `admin-reviews`) trên cả 3 điểm `authService.logout()` (kể cả 401/403) và `authService.login()` trong ứng dụng thực tế. *(Chỉ đưa thêm vào allowlist nếu Project Owner muốn gắn thêm `[..., currentUser?.id, currentUser?.role]` cho 7 tab admin ngay lúc này.)*
- **21 trang storefront còn lại (`ProfilePage`, `CartPage`, `ProductDetailPage`, `StorefrontHome`, `SearchPage`, `CheckoutPage`, `LoginPage`, `RegisterPage`, `AboutPage`, ...):** Có thể **TRÁNH SỬA** hoàn toàn vì Lớp 1 chạy tập trung qua `authService` → `providers.tsx` + `StorefrontHeader.tsx`, không cần đụng từng trang và không phá bất kỳ test spy nào trong `m6_1..m6_4`.
- **`apiClient.ts`:** **TRÁNH SỬA** trong `CR-M6.5-01` để không gây tác dụng phụ logout nhầm khi người dùng nhập sai mật khẩu cũ ở `PUT /profile/password` (cũng trả `401`).
- **`CheckoutPage.tsx` (R-03) và `tests/e2e/storefront_journeys.spec.ts` (Journey 8):** Thuộc `CR-M6.5-02` và `CR-M6.5-03` — giữ tách biệt hoàn toàn theo quyết định Project Owner.

---

## 9. Regression Test Plan

Sau khi triển khai `CR-M6.5-01` (theo Implementation Order riêng), cần xác minh đầy đủ các kịch bản DB-free sau trong `apps/web/tests/m6_5_customer_integration_qa.test.tsx` (và chạy regression trên bộ unit/frontend hiện có):

1. **R-02 Primary Fix (Wishlist Logout → Account Switch trong `30s`):**
   - Account A mở `/wishlist` → cache `['wishlist', userA.id]` có sản phẩm riêng tư của A.
   - Account A bấm Logout từ `WishlistPage` → `['wishlist', userA.id]` bị xóa sạch khỏi `QueryClient` (`undefined`), `sessionStorage['lastOrder']` bị xóa.
   - Account B đăng nhập trong `30s` và mở `/wishlist` → **PHẢI** phát sinh request `GET /api/v1/wishlist` mới cho Account B; màn hình **KHÔNG** hiển thị sản phẩm của Account A và chỉ hiển thị dữ liệu của Account B.
2. **R-02 Cross-Page Logout Consistency (Logout từ trang khác không phải Wishlist/Profile):**
   - Account A nạp đầy cache private (`wishlist`, `wishlist-count`, `cart`, `profile`, `customer-addresses`, `notifications`, `my-orders`, `customer-returns`, `review-eligibility`, `admin-users`).
   - Account A logout từ 1 trang trung tính (ví dụ `ProfilePage` hoặc bất kỳ trang nào gọi `authService.logout()`).
   - Xác nhận **100% cả 18 prefix private đều `undefined`** trong `QueryClient`, không còn sót `['profile', userA.id]` hay `['wishlist']` hay `['cart']` hay `['admin-users']`.
3. **Direct Account Switch (Login-Over-Session không bấm Logout):**
   - Account A đang có cache `['wishlist', userA.id]`, `['cart']`, `['wishlist-count']`.
   - Không bấm Logout; gọi trực tiếp `authService.login()` bằng Account B.
   - Xác nhận cache của Account A bị purge ngay lập tức trước khi Account B đọc dữ liệu.
4. **Post-Logout Guest Cart Isolation & M6.1 Guest Cart Merge Safety:**
   - Account A có giỏ hàng trong `['cart']` → Logout → `['cart']` của A bị xóa sạch → Guest fetch giỏ hàng guest riêng, không thấy giỏ hàng A.
   - Chạy toàn bộ **23/23 tests của `m6_1_guest_cart_merge.test.tsx`** xác nhận Guest Cart Merge, Immediate Retry, Passive Retry và `invalidateQueries({ queryKey: ['cart'] })` không hề bị hồi quy.
5. **Public Cache Preservation:**
   - Nạp sẵn `['categories']` và `['products']` vào `QueryClient`.
   - Account A logout → xác nhận `['categories']` và `['products']` **VẪN CÒN NGUYÊN** trong `QueryClient` (không bị xóa oan).
6. **Cross-Tab Storage Sync Unit Verification:**
   - Kiểm chứng helper `bindQueryClientToAuthEvents` / `storage` event xóa đúng private cache khi `nexora_token` bị thay đổi/xóa từ tab khác.
7. **Targeted Regression Suite & Static Gates (100% DB-Free, không cần chạy lại DB tests vì không đụng Backend/Prisma):**
   - `npm run test:unit` (gồm `m6_1`..`m6_4`, `m6_5`, `ResetPasswordFlow`, `FoundationDashboard`, shared & backend unit tests).
   - `npm run typecheck`, `npm run lint`, `npm run build`, `npx prettier --check` trên các file trong allowlist.

---

## 10. Acceptance Criteria cho `CR-M6.5-01` (Khi bước vào Implementation)

- [ ] Chỉ chỉnh sửa đúng 6 file trong Core Allowlist được Project Owner phê duyệt; 0 sửa đổi Backend, Prisma, database, R-03, hay Playwright Journey 8.
- [ ] `authService.logout()`, `authService.login()`, `authService.register()` đều kích hoạt đồng bộ `clearPrivateQueryCache(queryClient)` bất kể trang gọi là trang nào.
- [ ] Toàn bộ 18 private query key prefixes đều bị `cancelQueries` + `removeQueries` khi logout / đổi tài khoản; `sessionStorage['lastOrder']` bị xóa; `cartService.resetPassiveMergeGuard()` được gọi.
- [ ] `WishlistPage.tsx` sử dụng `queryKey: ['wishlist', currentUser?.id]`.
- [ ] Public query keys (`categories`, `products`, `banners`, `product-detail`, `product-reviews`, ...) được giữ nguyên khi logout.
- [ ] Regression tests mới chứng minh Account B **không thể nhìn thấy** dữ liệu của Account A sau logout/login và sau direct login-over-session.
- [ ] Toàn bộ `m6_1` (23/23), `m6_2` (18/18), `m6_3` (17/17), `m6_4` (16/16), `m6_5` (all PASS), `npm run test:unit`, `typecheck`, `lint`, `build`, `prettier` đạt 100% `PASS`.

---

## 11. Risks và Compatibility Considerations

| # | Rủi ro / Điểm tương thích | Mức độ | Cách phòng ngừa trong thiết kế |
|---|---|---|---|
| 1 | **Double-registration listener giữa `AppProviders` và `StorefrontHeader`** | Thấp | Dùng `WeakSet<QueryClient>` (hoặc ref-counted map per `QueryClient`) trong `authQueryCache.ts` để đảm bảo mỗi `QueryClient` instance chỉ chạy `clearPrivateQueryCache` đúng 1 lần trên mỗi sự kiện auth. |
| 2 | **Memory leak listener khi `StorefrontHeader` mount/unmount nhiều lần khi chuyển trang** | Trung bình | `useAuthQueryCacheSync()` phải trả về hàm `unsubscribe` trong cleanup của `useEffect` (dùng ref-count cho từng `QueryClient` để khi `AppProviders` vẫn đang mount thì không gỡ nhầm subscription của `AppProviders`). |
| 3 | **Gây hỏng Guest Cart Merge (M6.1) nếu xóa nhầm `nexora_guest_session`** | Cao | `authService.logout()` và `clearPrivateQueryCache()` **TUYỆT ĐỐI KHÔNG** gọi `cartService.clearGuestSession()`. Chỉ gọi `cartService.resetPassiveMergeGuard()` (reset in-memory deduplication guard) và chỉ xóa `nexora_guest_session` khi merge DTO hợp lệ như M6.1 quy định. |
| 4 | **Breaking existing Vitest spies (`invalidateQueries(['cart'])`, `removeQueries(['review-eligibility'])`, `removeQueries(['customer-returns'])`)** | Trung bình | Giữ nguyên các lời gọi `invalidateQueries(['cart'])` trong `LoginPage`, `RegisterPage`, `AuthModal` và giữ vòng lặp `removeQueries({ queryKey: [prefix] })` với từng prefix rời để mọi spy trong `m6_1`..`m6_4` khớp chính xác 100%. |
| 5 | **Tác dụng phụ nếu thêm 401 auto-logout vào `apiClient.ts`** | Cao | **KHÔNG sửa `apiClient.ts`** trong `CR-M6.5-01` vì `PUT /profile/password` (sai mật khẩu hiện tại) và `POST /auth/login` cũng trả HTTP `401`. |
| 6 | **In-flight request race condition** | Trung bình | Gọi `queryClient.cancelQueries({ queryKey: [prefix] })` ngay trước `queryClient.removeQueries({ queryKey: [prefix] })` để request chậm của Account A không thể resolve sau khi Account B đăng nhập và ghi ngược dữ liệu cũ vào cache. |

---

## Verification of Discovery Constraints (Read-Only Compliance)

- **Git Branch:** `main`
- **Git HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` (không đổi)
- **Tracked Modified Files:** `0`
- **New/Modified Source or Test Files:** `0`
- **Database Mutations:** `0` (chưa chạy bất kỳ lệnh DB hay test nào)
- **Commit / Push:** Không thực hiện

**Final Discovery Status:** **`PASS`** — Đã hoàn tất kiểm kê 100% logout entry points (27 điểm / 24 file), 100% private query keys (18 prefix + `sessionStorage['lastOrder']`), root cause, thiết kế 2 lớp tối giản (6 file allowlist) và kế hoạch regression tests. Dừng tại đây chờ Project Owner phê duyệt allowlist và ban hành Implementation Order cho `CR-M6.5-01`.
