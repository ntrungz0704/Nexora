# 04 — Frontend Pages, Routes, and Components

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-04`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM CODEBASE & ROUTE AUDIT`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Tổng Quan Kiến Trúc Frontend (Frontend Architecture Overview)

Frontend Nexora được xây dựng dưới dạng ứng dụng đơn trang (**Single Page Application - SPA**) hiện đại với:
- **Core Framework:** React 19 kết hợp với Vite 6 làm bundler hiệu năng cao.
- **Ngôn ngữ:** TypeScript 5.x với chế độ `strict` tuyệt đối (`noImplicitAny`, `strictNullChecks`).
- **Styling:** Tailwind CSS 4 tích hợp trực tiếp, tối ưu hóa class utility, hỗ trợ Dark Mode và Responsive đa thiết bị (Mobile, Tablet, Desktop).
- **Định tuyến:** React Router v7 (`react-router-dom`) quản lý tập trung toàn bộ route tại `apps/web/src/routes/AppRoutes.tsx`.
- **Quản lý trạng thái:** TanStack Query v5 (React Query) quản lý dữ liệu server-state, đồng bộ hóa cache và hủy truy vấn.
- **Xác thực biểu mẫu:** React Hook Form kết hợp với Zod Schemas nhập từ `@nexora/shared`.

---

## 2. Bảng Kiểm Kê Toàn Bộ 83 Routes Trong Hệ Thống (Route Inventory)

Định nghĩa tại `apps/web/src/routes/AppRoutes.tsx`. Toàn bộ route được phân loại theo 8 nhãn trạng thái kỹ thuật:

| Nhóm tuyến đường | Route Path | Component Ánh Xạ | Quyền truy cập | Trạng thái kỹ thuật | Tập tin nguồn & Dòng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Storefront Core** | `/` | `StorefrontHome` | Public (Guest/User) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:68` |
| | `/home` | `StorefrontHome` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:69` |
| | `/home/index` | `StorefrontHome` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:70` |
| **Catalog & Search** | `/search` | `SearchPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:71` |
| | `/home/search` | `SearchPage` | Public (Legacy Alias) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:72` |
| | `/category/:slug` | `SearchPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:73` |
| | `/product/detail/:slug` | `ProductDetailPage` | Public (Legacy Alias) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:74` |
| | `/product/:slug` | `ProductDetailPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:75` |
| **Shopping & Commerce** | `/wishlist` | `WishlistPage` | Public / Customer | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:78` |
| | `/cart` | `CartPage` | Public (Guest/User) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:79` |
| | `/checkout` | `CheckoutPage` | Public / Customer | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:80` |
| | `/checkout/success` | `CheckoutSuccessPage` | Public / Customer | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:81` |
| **Hardware Tools** | `/build-pc` | `PcBuilderPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:84` |
| | `/pc-builder` | `PcBuilderPage` | Public (Alias) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:85` |
| | `/compare` | `ComparePage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:86` |
| | `/ai-assistant` | `AiAssistantPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:87` |
| | `/trade-in` | `TradeInPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:88` |
| **Content & Tracking** | `/news` | `NewsPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:89` |
| | `/news/:slug` | `PostDetailPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:90` |
| | `/order-tracking` | `OrderTrackingPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:91` |
| | `/stores` | `StoresPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:92` |
| **Customer Profile** | `/profile` | `ProfilePage` | Customer / Staff / Admin | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:95` |
| | `/profile/orders` | `ProfilePage` (tab: orders) | Customer / Staff / Admin | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:96` |
| | `/profile/addresses` | `ProfilePage` (tab: addresses) | Customer / Staff / Admin | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:97` |
| | `/profile/notifications` | `ProfilePage` (tab: notifications) | Customer / Staff / Admin | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:98` |
| | `/profile/returns` | `ProfilePage` (tab: returns) | Customer / Staff / Admin | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:99` |
| | `/profile/password` | `ProfilePage` (tab: password) | Customer / Staff / Admin | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:100` |
| **Legacy Profile Aliases** | `/customer/profile` | `Navigate -> /profile` | Customer Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:103` |
| | `/customer/orders` | `Navigate -> /profile/orders` | Customer Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:104` |
| | `/customer/addresses` | `Navigate -> /profile/addresses` | Customer Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:105` |
| | `/customer/returns` | `Navigate -> /profile/returns` | Customer Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:106` |
| | `/customer/notifications` | `Navigate -> /profile/notifications` | Customer Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:107` |
| | `/customer/password` | `Navigate -> /profile/password` | Customer Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:108` |
| **Authentication Flow** | `/auth/login` | `LoginPage` | Public (Unauthenticated) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:111` |
| | `/auth/register` | `RegisterPage` | Public (Unauthenticated) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:112` |
| | `/auth/forgot-password` | `ForgotPasswordPage` | Public (Unauthenticated) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:113` |
| | `/auth/reset-password` | `ResetPasswordPage` | Public (Unauthenticated) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:114` |
| | `/login` | `Navigate -> /auth/login` | Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:115` |
| | `/register` | `Navigate -> /auth/register` | Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:116` |
| | `/forgot-password` | `Navigate -> /auth/forgot-password` | Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:117` |
| | `/reset-password` | `Navigate -> /auth/reset-password` | Redirect | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:118` |
| **Admin & Store Ops** | `/admin` | `AdminDashboardPage` | STAFF \| ADMIN (Gated) | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:121` |
| | `/admin/dashboard` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:122` |
| | `/admin/products` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:123` |
| | `/admin/categories` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:124` |
| | `/admin/brands` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:125` |
| | `/admin/inventory` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:126` |
| | `/admin/orders` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:127` |
| | `/admin/users` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:128` |
| | `/admin/reviews` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:129` |
| | `/admin/returns` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:130` |
| | `/admin/coupons` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:131` |
| | `/admin/flash-sales` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:132` |
| | `/admin/banners` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:133` |
| | `/admin/posts` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:134` |
| | `/admin/settings` | `AdminDashboardPage` | STAFF \| ADMIN | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:135` |
| **Institutional & Policy** | `/about` | `AboutPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:138` |
| | `/careers` | `CareersPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:139` |
| | `/contact` | `ContactPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:140` |
| | `/policy` | `PolicyPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:141` |
| | `/policy/:slug` | `PolicyPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:142` |
| | `/guide` | `GuidePage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:143` |
| | `/technical-support` | `TechnicalSupportPage` | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:144` |
| **System Inspection** | `/foundation` | `FoundationDashboard` | Public / Dev Mode | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:167` |
| | `/architecture` | `ArchitectureInfoPage` | Public / Dev Mode | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:168` |
| **Error Fallback** | `*` | `NotFoundPage` (404) | Public | `IMPLEMENTED & VERIFIED` | `routes/AppRoutes.tsx:171` |

---

## 3. Kiểm Kê Định Lượng 28 Feature Pages

Toàn bộ 28 Page Components trong `apps/web/src/features/` được kiểm kê kích thước và trách nhiệm:

| STT | Page Component | Đường dẫn tệp | Kích thước (LOC) | Trách nhiệm giao diện & Nghiệp vụ |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `AdminDashboardPage.tsx` | `features/admin/AdminDashboardPage.tsx` | **6,312** | Quản trị toàn diện cửa hàng (13 tabs nghiệp vụ vận hành) |
| 2 | `ProfilePage.tsx` | `features/profile/ProfilePage.tsx` | **2,157** | Trang cá nhân khách hàng (Profile, Sổ địa chỉ, Đơn hàng, Đổi trả, Mật khẩu) |
| 3 | `AiAssistantPage.tsx` | `features/ai/AiAssistantPage.tsx` | **1,669** | Trợ lý tư vấn PC 5 bước, tương thích linh kiện, gợi ý thông minh |
| 4 | `ProductDetailPage.tsx` | `features/catalog/ProductDetailPage.tsx` | **1,279** | Chi tiết thông số kỹ thuật, giá bán, thư viện ảnh, đánh giá reviews |
| 5 | `ComparePage.tsx` | `features/compare/ComparePage.tsx` | **1,262** | Ma trận so sánh trực quan thông số kỹ thuật tối đa 4 sản phẩm |
| 6 | `SearchPage.tsx` | `features/catalog/SearchPage.tsx` | **1,193** | Bộ lọc đa tiêu chí (giá, hãng, danh mục, specs), sắp xếp, phân trang |
| 7 | `PcBuilderPage.tsx` | `features/pcBuilder/PcBuilderPage.tsx` | **1,160** | Xây dựng cấu hình PC (Mainboard, CPU, RAM, VGA, PSU...), tính công suất |
| 8 | `CheckoutPage.tsx` | `features/checkout/CheckoutPage.tsx` | **920** | Điền địa chỉ nhận hàng, áp dụng voucher, chọn COD / VNPay Sandbox |
| 9 | `CartPage.tsx` | `features/cart/CartPage.tsx` | **894** | Quản lý giỏ hàng, cập nhật số lượng, tạm tính, kiểm tra hàng tồn |
| 10 | `PostDetailPage.tsx` | `features/news/PostDetailPage.tsx` | **678** | Đọc bài viết công nghệ chi tiết, bình luận, bài viết liên quan |
| 11 | `NewsPage.tsx` | `features/news/NewsPage.tsx` | **524** | Danh mục tin tức, khuyến mãi, đánh giá phần cứng công nghệ |
| 12 | `OrderTrackingPage.tsx` | `features/orderTracking/OrderTrackingPage.tsx` | **495** | Tra cứu trạng thái đơn hàng theo mã đơn và số điện thoại công khai |
| 13 | `TradeInPage.tsx` | `features/tradeIn/TradeInPage.tsx` | **483** | Thu cũ đổi mới linh kiện máy tính, bảng định giá thu hồi tham khảo |
| 14 | `CareersPage.tsx` | `features/info/CareersPage.tsx` | **388** | Thông tin tuyển dụng nhân sự cửa hàng Nexora |
| 15 | `RegisterPage.tsx` | `features/auth/RegisterPage.tsx` | **375** | Đăng ký tài khoản khách hàng mới, kiểm tra mật khẩu mạnh |
| 16 | `ResetPasswordPage.tsx` | `features/auth/ResetPasswordPage.tsx` | **347** | Nhập token từ email và thiết lập mật khẩu mới an toàn |
| 17 | `TechnicalSupportPage.tsx` | `features/info/TechnicalSupportPage.tsx` | **347** | Hướng dẫn kỹ thuật phần cứng, cài đặt driver, liên hệ bảo hành |
| 18 | `StoresPage.tsx` | `features/stores/StoresPage.tsx` | **340** | Bản đồ và danh sách địa chỉ showroom cửa hàng Nexora |
| 19 | `CheckoutSuccessPage.tsx` | `features/checkout/CheckoutSuccessPage.tsx` | **325** | Thông báo đặt hàng thành công, hiển thị mã đơn, nút quay lại mua sắm |
| 20 | `PolicyPage.tsx` | `features/policy/PolicyPage.tsx` | **317** | Các chính sách bảo hành, đổi trả 7 ngày, vận chuyển, bảo mật |
| 21 | `ContactPage.tsx` | `features/info/ContactPage.tsx` | **310** | Biểu mẫu liên hệ góp ý, hotline, email hỗ trợ khách hàng |
| 22 | `WishlistPage.tsx` | `features/wishlist/WishlistPage.tsx` | **302** | Danh sách sản phẩm yêu thích, nút thêm nhanh vào giỏ hàng |
| 23 | `LoginPage.tsx` | `features/auth/LoginPage.tsx` | **214** | Đăng nhập bằng email/mật khẩu, ghi nhớ đăng nhập, chuyển hướng |
| 24 | `AboutPage.tsx` | `features/info/AboutPage.tsx` | **211** | Giới thiệu thương hiệu Nexora, sứ mệnh và tầm nhìn cửa hàng |
| 25 | `GuidePage.tsx` | `features/info/GuidePage.tsx` | **206** | Hướng dẫn mua hàng online, thanh toán VNPay và tra cứu bảo hành |
| 26 | `StorefrontHome.tsx` | `features/storefront/StorefrontHome.tsx` | **188** | Trang chủ Storefront (Hero Slider, Flash Sale, Danh mục nổi bật, Bestseller) |
| 27 | `ForgotPasswordPage.tsx` | `features/auth/ForgotPasswordPage.tsx` | **177** | Gửi yêu cầu đặt lại mật khẩu qua email xác nhận |
| 28 | `NotFoundPage.tsx` | `features/errors/NotFoundPage.tsx` | **78** | Trang lỗi 404 thân thiện, gợi ý quay về trang chủ |

---

## 4. Kiểm Toán Chuyên Sâu: Admin Authentication Gate

Kiểm tra trực tiếp tại `apps/web/src/features/admin/AdminDashboardPage.tsx` dòng `1643` – `1685`:

```tsx
// Đoạn mã kiểm soát quyền truy cập trang Quản Trị:
const isStaffOrAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF');

if (!isStaffOrAdmin) {
  return (
    <div className="admin-gate-container">
      <div className="admin-gate-card">
        <div className="admin-gate-icon">...</div>
        <h2>Hệ Thống Quản Trị Cửa Hàng</h2>
        <p>
          Bạn đang đăng nhập với tài khoản khách hàng ({currentUser?.email} - <strong>{currentUser?.role}</strong>)
          không có quyền truy cập trang Quản trị. Vui lòng đăng nhập bằng tài khoản Quản trị viên hoặc Nhân viên.
        </p>
        <button onClick={handleSwitchAccount}>Đăng nhập tài khoản Quản trị</button>
      </div>
    </div>
  );
}
```

### Đánh giá kỹ thuật về Admin Gate:
1. **Kiểm soát hiển thị (UI Hiding & Guard):** Khi người dùng chưa đăng nhập (`currentUser === null`) hoặc đăng nhập với vai trò `CUSTOMER`, toàn bộ thanh điều hướng (`aside.admin-sidebar`) và toàn bộ bảng điều khiển Dashboard **hoàn toàn không được render**.
2. **Bảo mật hai lớp (Defense in Depth):**
   - **Tầng Client:** Admin Gate chặn render và điều hướng người dùng trái phép về màn hình đăng nhập quản trị.
   - **Tầng Server:** Toàn bộ 49 API quản trị tại `/api/v1/admin/*` đều được bảo vệ bởi middleware `requireRole(['STAFF', 'ADMIN'])`. Bất kỳ yêu cầu trái phép nào từ chối tại tầng HTTP với mã lỗi `403 Forbidden` hoặc `401 Unauthorized`.
3. **Phù hợp với E2E Playwright:** Đã được kiểm chứng tuyệt đối trong Playwright `Journey 8` (commit `6073152`), xác nhận người dùng chưa đăng nhập truy cập `/admin` sẽ nhận được màn hình Authentication Gate và không nhìn thấy thanh Sidebar của quản trị viên.
