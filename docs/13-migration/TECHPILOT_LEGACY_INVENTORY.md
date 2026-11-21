# TECHPILOT_LEGACY_INVENTORY.md — Khảo Sát & Kiểm Kê Toàn Bộ Hệ Thống Cũ

- **Dự án nguồn:** `TechPilot` (`D:\Nexora\TechPilot`)
- **Dự án đích:** `Nexora` (`D:\Nexora`)
- **Ngày kiểm kê:** 2026-11-19
- **Kiến trúc nguồn:** Monolith PHP 8.x MVC + Raw PDO/MySQL + Vanilla HTML5/CSS3/JS.
- **Trạng thái:** Bắt buộc lưu trữ chỉ đọc tại `TechPilot/`, không chỉnh sửa, không xóa.

---

## 1. Danh Sách & Bóc Tách Controllers (27 Controllers)

| STT | File Controller (`TechPilot/app/controllers/`) | Chức năng nghiệp vụ chính                                                            | Tương đương trong Nexora                                                   |
| :-- | :--------------------------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| 1   | `HomeController.php`                           | Render trang chủ, banner hero, flash sale, tabs sản phẩm nổi bật, bài viết, đánh giá | `StorefrontHome.tsx` + `storefront.routes.ts`                              |
| 2   | `AuthController.php`                           | Đăng nhập, đăng ký, đăng xuất, quên mật khẩu, Google OAuth callback                  | `LoginPage.tsx`, `RegisterPage.tsx`, `AuthModal.tsx`, `auth.controller.ts` |
| 3   | `ProductController.php`                        | Chi tiết sản phẩm, biến thể, lọc danh mục, breadcrumbs, đánh giá                     | `ProductDetailPage.tsx`, `catalog.controller.ts`                           |
| 4   | `CartController.php`                           | Xem giỏ hàng, thêm giỏ, cập nhật số lượng, xóa sản phẩm, session giỏ hàng            | `CartDrawer.tsx`, `CartPage.tsx`, `cart.controller.ts`                     |
| 5   | `CheckoutController.php`                       | Thông tin giao hàng, tính phí ship, mã giảm giá, đặt hàng                            | `CheckoutPage.tsx`, `orders.controller.ts`                                 |
| 6   | `PaymentController.php`                        | Cổng thanh toán VNPay, MoMo, VietQR, COD                                             | `payment.service.ts`, `webhook.controller.ts`                              |
| 7   | `PcBuilderController.php`                      | Xây dựng cấu hình PC tùy chọn (CPU, Main, RAM, VGA, PSU, Case, Tản)                  | `PcBuilderPage.tsx`, `pcBuilder.routes.ts`                                 |
| 8   | `AiAssistantController.php`                    | Trợ lý AI tư vấn linh kiện và cấu hình thông minh                                    | `AiAssistantPage.tsx`, `ai.controller.ts`                                  |
| 9   | `CompareController.php`                        | So sánh thông số kỹ thuật đa sản phẩm cùng loại                                      | `ComparePage.tsx`, `catalog.routes.ts`                                     |
| 10  | `PostController.php` / `NewsController.php`    | Tin tức công nghệ, bài viết đánh giá, cẩm nang                                       | `NewsPage.tsx`, `post.controller.ts`                                       |
| 11  | `ProfileController.php`                        | Quản lý thông tin cá nhân, sổ địa chỉ, lịch sử đơn hàng                              | `ProfilePage.tsx`, `customer.controller.ts`                                |
| 12  | `WishlistController.php`                       | Danh sách sản phẩm yêu thích của khách hàng                                          | `WishlistPage.tsx`, `wishlist.controller.ts`                               |
| 13  | `ChatbotController.php`                        | Chatbot hỗ trợ giải đáp tự động                                                      | `ChatbotWidget.tsx`, `ai.service.ts`                                       |
| 14  | `InventoryApiController.php`                   | API tra cứu tồn kho, cảnh báo hết hàng                                               | `inventory.controller.ts`                                                  |
| 15  | `AdminController.php`                          | Dashboard tổng quan quản trị, biểu đồ doanh thu, KPI                                 | `AdminDashboardPage.tsx`, `analytics.controller.ts`                        |
| 16  | `AdminProductController.php`                   | Quản lý sản phẩm (CRUD, biến thể, SKU, giá, ảnh)                                     | `AdminProductsPage.tsx`, `catalog.admin.controller.ts`                     |
| 17  | `AdminCategoryController.php`                  | Quản lý danh mục sản phẩm cây phân cấp                                               | `AdminCategoriesPage.tsx`, `category.controller.ts`                        |
| 18  | `AdminBrandController.php`                     | Quản lý thương hiệu đối tác (ASUS, MSI, Acer, v.v.)                                  | `AdminBrandsPage.tsx`, `brand.controller.ts`                               |
| 19  | `AdminOrderController.php`                     | Quản lý đơn hàng (xác nhận, giao hàng, hủy, in bill)                                 | `AdminOrdersPage.tsx`, `order.admin.controller.ts`                         |
| 20  | `AdminInventoryController.php`                 | Nhập kho, xuất kho, điều chuyển, kiểm kê tồn kho                                     | `AdminInventoryPage.tsx`, `inventory.admin.controller.ts`                  |
| 21  | `AdminCouponController.php`                    | Quản lý mã giảm giá, khuyến mãi, voucher                                             | `AdminCouponsPage.tsx`, `promotion.controller.ts`                          |
| 22  | `AdminFlashSaleController.php`                 | Cấu hình khung giờ và sản phẩm Flash Sale                                            | `AdminFlashSalePage.tsx`, `promotion.controller.ts`                        |
| 23  | `AdminBannerController.php`                    | Quản lý banner hero carousel, banner quảng cáo                                       | `AdminBannersPage.tsx`, `banner.controller.ts`                             |
| 24  | `AdminPostController.php`                      | Quản lý bài viết tin tức, danh mục bài viết                                          | `AdminPostsPage.tsx`, `post.admin.controller.ts`                           |
| 25  | `AdminReviewController.php`                    | Duyệt và quản lý đánh giá của khách hàng                                             | `AdminReviewsPage.tsx`, `review.controller.ts`                             |
| 26  | `AdminUserController.php`                      | Phân quyền tài khoản (Customer, Staff, Admin)                                        | `AdminUsersPage.tsx`, `user.admin.controller.ts`                           |
| 27  | `AdminReturnController.php`                    | Xử lý yêu cầu bảo hành và đổi trả hàng                                               | `AdminReturnsPage.tsx`, `returns.controller.ts`                            |

---

## 2. Danh Sách & Bóc Tách Models (12 Models)

| Model PHP (`TechPilot/app/models/`) | Bảng MySQL tương ứng           | Số trường | Chức năng nghiệp vụ                                            | Ánh xạ Prisma Model (`prisma/schema.prisma`)     |
| :---------------------------------- | :----------------------------- | :-------- | :------------------------------------------------------------- | :----------------------------------------------- |
| `User.php`                          | `users`                        | 14        | Tài khoản, mật khẩu băm, thông tin liên hệ, vai trò            | `User` (Role enum: `CUSTOMER`, `STAFF`, `ADMIN`) |
| `Product.php`                       | `products`, `product_variants` | 22        | Thông tin phần cứng, SKU, giá bán, giá KM, tồn kho, specs JSON | `Product`, `ProductVariant`                      |
| `Order.php`                         | `orders`, `order_items`        | 18        | Đơn đặt hàng, snapshot giá, địa chỉ giao hàng, trạng thái      | `Order`, `OrderItem`                             |
| `Category.php`                      | `categories`                   | 8         | Cây danh mục sản phẩm, icon, thứ tự sắp xếp                    | `Category`                                       |
| `Brand.php`                         | `brands`                       | 6         | Thương hiệu linh kiện (ASUS, MSI, Gigabyte...)                 | `Brand`                                          |
| `Banner.php`                        | `banners`                      | 9         | Slider hero banner, banner khuyến mãi                          | `Banner`                                         |
| `Review.php`                        | `reviews`                      | 8         | Đánh giá sao, bình luận sản phẩm, ảnh review                   | `Review`                                         |
| `Wishlist.php`                      | `wishlists`                    | 4         | Danh sách theo dõi yêu thích theo user                         | `Wishlist`                                       |
| `Compare.php`                       | `compare_items`                | 4         | Danh sách sản phẩm chờ so sánh thông số                        | `CompareItem`                                    |
| `Post.php`                          | `posts`                        | 10        | Bài viết tin công nghệ, cẩm nang build PC                      | `Post`                                           |
| `Notification.php`                  | `notifications`                | 7         | Thông báo trạng thái đơn hàng, ưu đãi                          | `Notification`                                   |
| `ReturnRequest.php`                 | `return_requests`              | 11        | Yêu cầu đổi trả bảo hành sản phẩm lỗi                          | `ReturnRequest`                                  |

---

## 3. Danh Sách Giao Diện & Views (14 Thư mục / 52 Templates)

| Nhóm giao diện     | Thư mục view              | Danh sách file tiêu biểu                                    | Công nghệ mới (Nexora)                                |
| :----------------- | :------------------------ | :---------------------------------------------------------- | :---------------------------------------------------- |
| **Storefront**     | `app/views/home/`         | `index.php`, `search.php`, `order-tracking.php`             | React 19 + TypeScript + Vite                          |
| **Auth**           | `app/views/auth/`         | `login.php`, `register.php`, `forgot.php`, `reset.php`      | `LoginPage.tsx`, `RegisterPage.tsx`, `AuthModal.tsx`  |
| **Sản phẩm**       | `app/views/product/`      | `detail.php`, `category.php`, `quick-view.php`              | `ProductDetailPage.tsx`, `CategoryPage.tsx`           |
| **Giỏ & Đặt hàng** | `app/views/`              | `cart.php`, `checkout.php`, `checkout-success.php`          | `CartPage.tsx`, `CheckoutPage.tsx`, `SuccessPage.tsx` |
| **PC Builder**     | `app/views/pc-builder/`   | `index.php`, `print.php`, `share.php`                       | `PcBuilderPage.tsx`, Canvas/PDF export                |
| **AI Advisor**     | `app/views/ai-assistant/` | `index.php`, `history.php`                                  | `AiAssistantPage.tsx`, Gemini 2.5 Flash stream        |
| **So sánh**        | `app/views/compare/`      | `index.php`, `table.php`                                    | `ComparePage.tsx`                                     |
| **Tin tức**        | `app/views/post/`         | `index.php`, `detail.php`, `category.php`                   | `NewsPage.tsx`, `PostDetailPage.tsx`                  |
| **Khách hàng**     | `app/views/profile/`      | `index.php`, `orders.php`, `addresses.php`, `wishlist.php`  | `ProfilePage.tsx`, `OrdersPage.tsx`                   |
| **Quản trị**       | `app/views/admin/`        | `index.php`, `products/`, `orders/`, `inventory/`, `users/` | `AdminLayout.tsx` + Admin Feature Modules             |

---

## 4. Tài Nguyên & Assets Được Bảo Toàn 100%

Toàn bộ asset gốc đã được đồng bộ nguyên bản sang `apps/web/public/assets/`:

- **CSS Design System:** `style.css` (5.986 dòng), `category-mega-menu.css` (962 dòng), `news.css` (480 dòng), `search-filters.css` (450 dòng).
- **Hình ảnh chụp sản phẩm độ phân giải cao:** Thư mục `review/unlinked/` chứa ảnh nét cao của chuột Superlight, bàn phím cơ Logitech, màn hình OLED LG, Samsung Odyssey, card RTX 4070/4090, CPU Intel i9 14900K, SSD Samsung 990 Pro, laptop Zephyrus, Legion, Predator, MacBook Pro.
- **Biểu tượng thương hiệu & danh mục:** Đầy đủ SVG và PNG của logo TechPilot, icon banner, badge khuyến mãi.
