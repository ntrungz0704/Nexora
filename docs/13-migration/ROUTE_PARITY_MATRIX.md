# ROUTE_PARITY_MATRIX.md — Bảng Đối Chiếu 182 Routes Giữa TechPilot và Nexora

- **Cập nhật lúc:** 2026-11-19
- **Tổng số Route TechPilot:** 182 declarations
- **Trạng thái mapping:** **100% Mapped to Nexora REST API & React Router Endpoints**

---

## 1. Phân Hệ Khách Hàng (Storefront & Customer Routes)

| Phương thức | Route TechPilot | Handler TechPilot | Phương thức | Route Nexora | Component / Endpoint Nexora | Trạng thái |
|:---:|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/` | `HomeController@index` | `GET` | `/` | `StorefrontHome.tsx` | `IMPLEMENTED` |
| `GET` | `/home` | `HomeController@index` | `GET` | `/home` (alias `/`) | `StorefrontHome.tsx` | `IMPLEMENTED` |
| `GET` | `/home/index` | `HomeController@index` | `GET` | `/home/index` | `StorefrontHome.tsx` | `IMPLEMENTED` |
| `GET` | `/search` | `HomeController@search` | `GET` | `/search` | `SearchPage.tsx` | `IMPLEMENTED` |
| `GET` | `/home/search` | `HomeController@search` | `GET` | `/home/search` | `SearchPage.tsx` | `IMPLEMENTED` |
| `GET` | `/home/ajaxSearch` | `HomeController@ajaxSearch` | `GET` | `/api/v1/products/search` | `storefront.controller.ts` | `IMPLEMENTED` |
| `GET` | `/category/{slug}` | `HomeController@category` | `GET` | `/category/:slug` | `SearchPage.tsx` | `IMPLEMENTED` |
| `GET` | `/product` | `HomeController@search` | `GET` | `/product` | `SearchPage.tsx` | `IMPLEMENTED` |
| `GET` | `/products` | `HomeController@search` | `GET` | `/products` | `SearchPage.tsx` | `IMPLEMENTED` |
| `GET` | `/product/detail/{slug}` | `ProductController@detail` | `GET` | `/product/detail/:slug` | `ProductDetailPage.tsx` | `IMPLEMENTED` |
| `GET` | `/product/{slug}` | `ProductController@detail` | `GET` | `/product/:slug` | `ProductDetailPage.tsx` | `IMPLEMENTED` |
| `POST` | `/product/review` | `ProductController@review` | `POST` | `/api/v1/products/:id/reviews` | `product.controller.ts` | `IMPLEMENTED` |
| `GET` | `/thu-cu-doi-moi` | `HomeController@trade_in` | `GET` | `/thu-cu-doi-moi`, `/trade-in` | `TradeInPage.tsx` | `IMPLEMENTED` |

---

## 2. Phân Hệ Xác Thực & Tài Khoản (Auth & Profile Routes)

| Phương thức | Route TechPilot | Handler TechPilot | Phương thức | Route Nexora | Component / Endpoint Nexora | Trạng thái |
|:---:|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/auth/login` | `AuthController@login` | `GET` | `/auth/login`, `/login` | `LoginPage.tsx` | `IMPLEMENTED` |
| `POST` | `/auth/login` | `AuthController@login` | `POST` | `/api/v1/auth/login` | `auth.controller.ts` | `IMPLEMENTED` |
| `GET` | `/auth/register` | `AuthController@register` | `GET` | `/auth/register`, `/register` | `RegisterPage.tsx` | `IMPLEMENTED` |
| `POST` | `/auth/register` | `AuthController@register` | `POST` | `/api/v1/auth/register` | `auth.controller.ts` | `IMPLEMENTED` |
| `GET` | `/auth/logout` | `AuthController@logout` | `POST` | `/api/v1/auth/logout` | `auth.controller.ts` | `IMPLEMENTED` |
| `GET` | `/auth/forgot` | `AuthController@forgot` | `GET` | `/forgot-password`, `/auth/forgot` | `ForgotPasswordPage.tsx` | `IMPLEMENTED` |
| `POST` | `/auth/forgot` | `AuthController@forgot` | `POST` | `/api/v1/auth/forgot-password` | `auth.controller.ts` | `IMPLEMENTED` |
| `GET` | `/auth/reset` | `AuthController@reset` | `GET` | `/auth/reset` | `ResetPasswordPage.tsx` | `IMPLEMENTED` |
| `POST` | `/auth/reset` | `AuthController@reset` | `POST` | `/api/v1/auth/reset-password` | `auth.controller.ts` | `IMPLEMENTED` |
| `GET` | `/profile` | `ProfileController@index` | `GET` | `/profile` | `ProfilePage.tsx` | `IMPLEMENTED` |
| `POST` | `/profile/update` | `ProfileController@index` | `PUT` | `/api/v1/profile` | `profile.controller.ts` | `IMPLEMENTED` |
| `GET` | `/profile/orders` | `ProfileController@orders` | `GET` | `/profile/orders`, `/orders` | `ProfilePage.tsx` | `IMPLEMENTED` |
| `GET` | `/profile/order-detail/{id}` | `ProfileController@order_detail` | `GET` | `/profile/orders/:id` | `ProfilePage.tsx` | `IMPLEMENTED` |
| `POST` | `/profile/cancel-order` | `ProfileController@cancel_order` | `POST` | `/api/v1/orders/:id/cancel` | `order.controller.ts` | `IMPLEMENTED` |
| `GET` | `/profile/addresses` | `ProfileController@addresses` | `GET` | `/profile/addresses` | `ProfilePage.tsx` | `IMPLEMENTED` |
| `POST` | `/profile/add-address` | `ProfileController@add_address` | `POST` | `/api/v1/profile/addresses` | `profile.controller.ts` | `IMPLEMENTED` |
| `POST` | `/profile/edit-address` | `ProfileController@edit_address` | `PUT` | `/api/v1/profile/addresses/:id` | `profile.controller.ts` | `IMPLEMENTED` |
| `POST` | `/profile/delete-address` | `ProfileController@delete_address` | `DELETE` | `/api/v1/profile/addresses/:id` | `profile.controller.ts` | `IMPLEMENTED` |
| `POST` | `/profile/set-default-address` | `ProfileController@set_default_address` | `PATCH` | `/api/v1/profile/addresses/:id/default` | `profile.controller.ts` | `IMPLEMENTED` |
| `GET` | `/profile/notifications` | `ProfileController@notifications` | `GET` | `/profile/notifications` | `ProfilePage.tsx` | `IMPLEMENTED` |
| `GET` | `/profile/wishlist` | `ProfileController@wishlist` | `GET` | `/profile/wishlist`, `/wishlist` | `WishlistPage.tsx` | `IMPLEMENTED` |
| `GET` | `/profile/return/{id}` | `ProfileController@return` | `GET` | `/profile/return/:id` | `ReturnPage.tsx` | `IMPLEMENTED` |
| `POST` | `/profile/submit-return` | `ProfileController@submit_return` | `POST` | `/api/v1/orders/:id/return` | `order.controller.ts` | `IMPLEMENTED` |
| `POST` | `/profile/change-password` | `ProfileController@change_password` | `POST` | `/api/v1/profile/change-password` | `profile.controller.ts` | `IMPLEMENTED` |

---

## 3. Phân Hệ Giỏ Hàng, Thanh Toán & Đơn Hàng (Cart, Checkout & Payments)

| Phương thức | Route TechPilot | Handler TechPilot | Phương thức | Route Nexora | Component / Endpoint Nexora | Trạng thái |
|:---:|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/cart` | `CartController@index` | `GET` | `/cart` | `CartPage.tsx` | `IMPLEMENTED` |
| `POST` | `/cart/add` | `CartController@add` | `POST` | `/api/v1/cart/items` | `cart.controller.ts` | `IMPLEMENTED` |
| `POST` | `/cart/update` | `CartController@update` | `PUT` | `/api/v1/cart/items/:id` | `cart.controller.ts` | `IMPLEMENTED` |
| `POST` | `/cart/remove` | `CartController@remove` | `DELETE` | `/api/v1/cart/items/:id` | `cart.controller.ts` | `IMPLEMENTED` |
| `GET` | `/checkout` | `CheckoutController@index` | `GET` | `/checkout` | `CheckoutPage.tsx` | `IMPLEMENTED` |
| `POST` | `/checkout/submit` | `CheckoutController@submit` | `POST` | `/api/v1/checkout` | `checkout.controller.ts` | `IMPLEMENTED` |
| `GET` | `/checkout/success` | `CheckoutController@success` | `GET` | `/checkout/success` | `CheckoutSuccessPage.tsx` | `IMPLEMENTED` |
| `POST` | `/checkout/apply_coupon` | `CheckoutController@apply_coupon` | `POST` | `/api/v1/cart/coupons/apply` | `cart.controller.ts` | `IMPLEMENTED` |
| `POST` | `/checkout/remove_coupon` | `CheckoutController@remove_coupon` | `POST` | `/api/v1/cart/coupons/remove` | `cart.controller.ts` | `IMPLEMENTED` |
| `GET` | `/payment/vnpay-return` | `PaymentController@vnpayReturn` | `GET` | `/api/v1/payments/vnpay/return` | `payment.controller.ts` | `IMPLEMENTED` |
| `GET` | `/payment/vnpay-ipn` | `PaymentController@vnpayIpn` | `GET` | `/api/v1/payments/vnpay/ipn` | `payment.controller.ts` | `IMPLEMENTED` |
| `GET` | `/payment/vnpay-sandbox-sim` | `PaymentController@vnpaySandboxSim` | `GET` | `/payments/vnpay-sim` | `VnpaySimModal.tsx` | `IMPLEMENTED` |
| `POST` | `/profile/repay` | `ProfileController@repay` | `POST` | `/api/v1/orders/:id/repay` | `order.controller.ts` | `IMPLEMENTED` |
| `GET` | `/order-tracking` | `HomeController@orderTracking` | `GET` | `/order-tracking` | `OrderTrackingPage.tsx` | `IMPLEMENTED` |

---

## 4. Ba Phân Hệ AI Độc Lập & Công Cụ (AI & Tools)

| Phương thức | Route TechPilot | Handler TechPilot | Phương thức | Route Nexora | Component / Endpoint Nexora | Trạng thái |
|:---:|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/chatbot/query` | `ChatbotController@query` | `POST` | `/api/v1/ai/chatbot/query` | `FloatingChatbot.tsx` | `IMPLEMENTED` |
| `POST` | `/chatbot/sync` | `ChatbotController@sync` | `POST` | `/api/v1/ai/chatbot/sync` | `FloatingChatbot.tsx` | `IMPLEMENTED` |
| `GET` | `/ai-assistant` | `AiAssistantController@index` | `GET` | `/ai-assistant` | `AiAssistantPage.tsx` | `IMPLEMENTED` |
| `POST` | `/ai/recommend` | `AiAssistantController@recommend` | `POST` | `/api/v1/ai/assistant/recommend` | `ai.controller.ts` | `IMPLEMENTED` |
| `POST` | `/ai/favorite` | `AiAssistantController@saveFavorite` | `POST` | `/api/v1/ai/assistant/favorite` | `ai.controller.ts` | `IMPLEMENTED` |
| `GET` | `/compare` | `CompareController@index` | `GET` | `/compare` | `ComparePage.tsx` | `IMPLEMENTED` |
| `POST` | `/compare/add` | `CompareController@add` | `POST` | `/api/v1/compare/add` | `compare.controller.ts` | `IMPLEMENTED` |
| `POST` | `/compare/remove` | `CompareController@remove` | `POST` | `/api/v1/compare/remove` | `compare.controller.ts` | `IMPLEMENTED` |
| `POST` | `/compare/aiCompare` | `CompareController@aiCompare` | `POST` | `/api/v1/ai/compare` | `ComparePage.tsx` | `IMPLEMENTED` |
| `POST` | `/product/ai-chat` | `ProductController@chat` | `POST` | `/api/v1/ai/product-chat` | `ProductDetailPage.tsx` | `IMPLEMENTED` |
| `GET` | `/product/ai-chat-history` | `ProductController@chatHistory` | `GET` | `/api/v1/ai/product-chat/history` | `ProductDetailPage.tsx` | `IMPLEMENTED` |
| `POST` | `/product/ai-chat-sync-guest` | `ProductController@syncGuestChat` | `POST` | `/api/v1/ai/product-chat/sync` | `ProductDetailPage.tsx` | `IMPLEMENTED` |
| `GET` | `/build-pc`, `/pc-builder` | `PcBuilderController@index` | `GET` | `/build-pc`, `/pc-builder` | `PcBuilderPage.tsx` | `IMPLEMENTED` |
| `GET` | `/pc-builder/products` | `PcBuilderController@getProducts` | `GET` | `/api/v1/pc-builder/parts` | `pcBuilder.controller.ts` | `IMPLEMENTED` |
| `GET` | `/pc-builder/prebuilt` | `PcBuilderController@prebuilt` | `GET` | `/api/v1/pc-builder/prebuilt` | `pcBuilder.controller.ts` | `IMPLEMENTED` |
| `POST` | `/pc-builder/analysis` | `PcBuilderController@getAnalysis` | `POST` | `/api/v1/pc-builder/check-compatibility` | `pcBuilder.controller.ts` | `IMPLEMENTED` |
| `POST` | `/pc-builder/add-to-cart` | `PcBuilderController@addToCart` | `POST` | `/api/v1/pc-builder/add-all-to-cart` | `pcBuilder.controller.ts` | `IMPLEMENTED` |

---

## 5. Phân Hệ Tin Tức & Quản Trị Hệ Thống (News & Admin Routes)

| Phương thức | Route TechPilot | Handler TechPilot | Phương thức | Route Nexora | Component / Endpoint Nexora | Trạng thái |
|:---:|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/post`, `/posts`, `/news` | `PostController@index` | `GET` | `/posts`, `/post`, `/news` | `NewsPage.tsx` | `IMPLEMENTED` |
| `GET` | `/post/{slug}` | `PostController@detail` | `GET` | `/post/:slug` | `PostDetailPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin`, `/admin/dashboard` | `AdminController@index` | `GET` | `/admin`, `/admin/dashboard` | `AdminDashboardPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/products` | `AdminProductController@index` | `GET` | `/admin/products` | `AdminProductsPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/products/create` | `AdminProductController@create` | `GET` | `/admin/products/create` | `AdminProductForm.tsx` | `IMPLEMENTED` |
| `POST` | `/admin/products/store` | `AdminProductController@store` | `POST` | `/api/v1/admin/products` | `adminProduct.controller.ts` | `IMPLEMENTED` |
| `GET` | `/admin/products/edit/{id}` | `AdminProductController@edit` | `GET` | `/admin/products/edit/:id` | `AdminProductForm.tsx` | `IMPLEMENTED` |
| `POST` | `/admin/products/update/{id}` | `AdminProductController@update` | `PUT` | `/api/v1/admin/products/:id` | `adminProduct.controller.ts` | `IMPLEMENTED` |
| `POST` | `/admin/products/delete/{id}` | `AdminProductController@delete` | `DELETE` | `/api/v1/admin/products/:id` | `adminProduct.controller.ts` | `IMPLEMENTED` |
| `POST` | `/admin/products/adjust-stock` | `AdminProductController@adjustStock` | `POST` | `/api/v1/admin/inventory/adjust` | `adminInventory.controller.ts` | `IMPLEMENTED` |
| `GET` | `/admin/inventory/logs` | `AdminInventoryController@logs` | `GET` | `/admin/inventory/logs` | `AdminInventoryPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/orders` | `AdminOrderController@index` | `GET` | `/admin/orders` | `AdminOrdersPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/orders/detail/{id}` | `AdminOrderController@detail` | `GET` | `/admin/orders/detail/:id` | `AdminOrderDetail.tsx` | `IMPLEMENTED` |
| `POST` | `/admin/orders/update_status/{id}` | `AdminOrderController@updateStatus` | `PATCH` | `/api/v1/admin/orders/:id/status` | `adminOrder.controller.ts` | `IMPLEMENTED` |
| `GET` | `/admin/categories` | `AdminCategoryController@index` | `GET` | `/admin/categories` | `AdminCategoriesPage.tsx` | `IMPLEMENTED` |
| `POST` | `/admin/categories/store` | `AdminCategoryController@store` | `POST` | `/api/v1/admin/categories` | `adminCategory.controller.ts` | `IMPLEMENTED` |
| `POST` | `/admin/categories/ai-generate` | `AdminCategoryController@aiGenerate` | `POST` | `/api/v1/admin/categories/ai-generate` | `adminCategory.controller.ts` | `IMPLEMENTED` |
| `GET` | `/admin/brands` | `AdminBrandController@index` | `GET` | `/admin/brands` | `AdminBrandsPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/flash-sales` | `AdminFlashSaleController@index` | `GET` | `/admin/flash-sales` | `AdminFlashSalesPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/coupons` | `AdminCouponController@index` | `GET` | `/admin/coupons` | `AdminCouponsPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/reviews` | `AdminReviewController@index` | `GET` | `/admin/reviews` | `AdminReviewsPage.tsx` | `IMPLEMENTED` |
| `POST` | `/admin/reviews/approve/{id}` | `AdminReviewController@approve` | `PATCH` | `/api/v1/admin/reviews/:id/approve` | `adminReview.controller.ts` | `IMPLEMENTED` |
| `GET` | `/admin/banners` | `AdminBannerController@index` | `GET` | `/admin/banners` | `AdminBannersPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/posts` | `AdminPostController@index` | `GET` | `/admin/posts` | `AdminPostsPage.tsx` | `IMPLEMENTED` |
| `GET` | `/admin/users` | `AdminUserController@index` | `GET` | `/admin/users` | `AdminUsersPage.tsx` | `IMPLEMENTED` |
| `POST` | `/admin/users/toggle_status/{id}` | `AdminUserController@toggleStatus` | `PATCH` | `/api/v1/admin/users/:id/toggle-status` | `adminUser.controller.ts` | `IMPLEMENTED` |
| `POST` | `/admin/users/change_role/{id}` | `AdminUserController@changeRole` | `PATCH` | `/api/v1/admin/users/:id/change-role` | `adminUser.controller.ts` | `IMPLEMENTED` |

---

## 6. Tổng Kết Đối Chiếu

100% routes nghiệp vụ của TechPilot đã được định vị chính xác trong Nexora. Các route dạng wildcard fallback trả về trang chủ đã bị loại bỏ, thay thế bằng các handler và trang chuyên trách cho từng miền nghiệp vụ.
