# 05 — Feature and Business Workflow Inventory

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-05`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY VIA CODE & BUSINESS RULES AUDIT`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Phương Pháp Kiểm Kê Nghiệp Vụ (Methodology)

Toàn bộ các tính năng nghiệp vụ của Nexora được kiểm kê dựa trên đối chiếu mã nguồn 3 chiều:
1. **Giao diện người dùng (Frontend UI):** Tệp tin component, biểu mẫu, xử lý tương tác và phản hồi lỗi.
2. **Xử lý máy chủ (Backend Logic):** Tuyến API, controller, kiểm tra hợp lệ DTO qua Zod, và service nghiệp vụ.
3. **Mô hình dữ liệu (Database Layer):** Bảng, cột, khóa ngoại, ràng buộc toàn vẹn, và chỉ mục liên quan trong MySQL 8.4.

Trạng thái từng tính năng được phân định chính xác theo 8 nhãn tiêu chuẩn:
- `IMPLEMENTED & VERIFIED`
- `IMPLEMENTED — NOT VERIFIED`
- `PARTIALLY IMPLEMENTED`
- `UI ONLY / MOCKED`
- `NOT IMPLEMENTED`
- `DEFERRED`
- `BLOCKED`
- `UNKNOWN — INSUFFICIENT EVIDENCE`

---

## 2. Miền Nghiệp Vụ 1: Trải Nghiệm Khách Hàng Mặt Tiền (Storefront Experience)

### 1.1 Trang Chủ (Homepage Experience)
- **Mục đích:** Giới thiệu thương hiệu cửa hàng Nexora, biểu ngữ khuyến mãi, danh mục phần cứng chính, sản phẩm Flash Sale, và sản phẩm bán chạy.
- **Quyền truy cập:** Public (Khách vãng lai và người dùng đã đăng nhập).
- **Frontend:** `apps/web/src/features/storefront/StorefrontHome.tsx` kết hợp các components `HeroSlider`, `FeaturedCategories`, `FlashSaleSection`, `BestsellerGrid`.
- **Backend / API:** `GET /api/v1/catalog/products/featured`, `GET /api/v1/marketing/banners`, `GET /api/v1/marketing/flash-sale/active`.
- **Database:** Bảng `Product`, `Banner`, `Category`, `FlashSale`, `FlashSaleItem`.
- **Quy tắc nghiệp vụ:** Chỉ hiển thị banners có `isActive: true`, flash sale trong khoảng thời gian `startTime <= NOW() <= endTime`, và sản phẩm có trạng thái `PUBLISHED`.
- **Bằng chứng kiểm thử:** Playwright `Journey 1` (Storefront navigation test), Vitest `storefront.integration.test.ts`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.
- **Giới hạn đã biết:** Dữ liệu Flash Sale hiện có 1 chiến dịch mẫu với 1 sản phẩm liên kết trong dev DB.

### 1.2 Tìm Kiếm, Lọc & Phân Trang Sản Phẩm (Catalog Search & Filtering)
- **Mục đích:** Tra cứu sản phẩm phần cứng theo từ khóa, lọc theo danh mục, thương hiệu, khoảng giá, trạng thái tồn kho, và sắp xếp.
- **Quyền truy cập:** Public.
- **Frontend:** `apps/web/src/features/catalog/SearchPage.tsx` (1,193 dòng) với Sidebar lọc linh kiện, thanh tìm kiếm tức thì, sắp xếp giá/mới nhất.
- **Backend / API:** `GET /api/v1/catalog/products` (hỗ trợ params: `q`, `category`, `brand`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `sortOrder`, `page`, `limit`).
- **Database:** Bảng `Product`, `Category`, `Brand`.
- **Quy tắc nghiệp vụ:** Tìm kiếm không phân biệt hoa thường (case-insensitive) trên `name`, `sku`, `shortDescription`; phân trang chuẩn 12 hoặc 20 sản phẩm/trang.
- **Bằng chứng kiểm thử:** `apps/api/tests/storefront.integration.test.ts`, Playwright `Journey 2`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.
- **Giới hạn đã biết:** Hiện sử dụng tìm kiếm chuỗi qua Prisma `contains` thay vì MySQL Full-Text Search.

### 1.3 Trang Chi Tiết Sản Phẩm (Product Detail Page)
- **Mục đích:** Hiển thị thông số kỹ thuật chi tiết, thư viện ảnh (gallery), giá niêm yết, giá khuyến mãi, tình trạng còn hàng, chính sách bảo hành, và danh sách đánh giá.
- **Quyền truy cập:** Public.
- **Frontend:** `apps/web/src/features/catalog/ProductDetailPage.tsx` (1,279 dòng).
- **Backend / API:** `GET /api/v1/catalog/products/:slug`, `GET /api/v1/catalog/products/:id/reviews`.
- **Database:** Bảng `Product`, `ProductImage`, `Brand`, `Category`, `Review`.
- **Quy tắc nghiệp vụ:** Khóa nút "Thêm vào giỏ" nếu `stockQuantity <= 0`; tính toán % giảm giá từ `price` và `salePrice`.
- **Bằng chứng kiểm thử:** Playwright `Journey 3`, Vitest `m6_3_customer_reviews.test.tsx`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.
- **Giới hạn đã biết:** 558/674 sản phẩm trong database chưa có ảnh đại diện (`thumbnailUrl = null`), hiển thị placeholder mặc định của hệ thống.

### 1.4 Công Cụ Xây Dựng Cấu Hình PC (PC Builder Tool)
- **Mục đích:** Hỗ trợ người dùng lựa chọn từng linh kiện (CPU, Mainboard, RAM, VGA, Ổ cứng, Nguồn, Vỏ case, Tản nhiệt), tự động cộng dồn giá và thêm cả cấu hình vào giỏ hàng.
- **Quyền truy cập:** Public.
- **Frontend:** `apps/web/src/features/pcBuilder/PcBuilderPage.tsx` (1,160 dòng).
- **Backend / API:** Gọi `GET /api/v1/catalog/products?category=...` theo từng nhóm linh kiện.
- **Database:** Bảng `Product`, `Category`.
- **Quy tắc nghiệp vụ:** Lọc sản phẩm theo danh mục linh kiện tương ứng; kiểm tra tính tương thích socket cơ bản; tính tổng công suất nguồn khuyến nghị.
- **Bằng chứng kiểm thử:** Playwright `Journey 5` (Build PC flow).
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.
- **Giới hạn đã biết:** Logic tương thích nâng cao (như chiều cao tản nhiệt so với case) được kiểm tra dựa trên thông số text trong specs thay vì engine AI chuyên sâu.

### 1.5 So Sánh Sản Phẩm (Product Comparison)
- **Mục đích:** So sánh trực quan thông số kỹ thuật song song giữa tối đa 4 sản phẩm cùng loại.
- **Quyền truy cập:** Public.
- **Frontend:** `apps/web/src/features/compare/ComparePage.tsx` (1,262 dòng).
- **Backend / API:** `GET /api/v1/catalog/products/:slug` cho từng sản phẩm được chọn.
- **Database:** Bảng `Product`.
- **Quy tắc nghiệp vụ:** Đối chiếu bảng thông số JSON `specs`, làm nổi bật các điểm khác biệt về xung nhịp, dung lượng, cổng kết nối.
- **Bằng chứng kiểm thử:** Vitest component test, Playwright `Journey 6`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

---

## 3. Miền Nghiệp Vụ 2: Quản Lý Khách Hàng (Customer Account Experience)

### 2.1 Giỏ Hàng & Gộp Giỏ Hàng Khách Vãng Lai (Guest Cart Merge)
- **Mục đích:** Cho phép khách chưa đăng nhập thêm hàng vào giỏ (`guestSessionId`); khi đăng nhập, toàn bộ hàng trong giỏ tạm được gộp tự động vào tài khoản chính thức.
- **Quyền truy cập:** Khách vãng lai (Guest) và Khách hàng đã đăng nhập (Customer).
- **Frontend:** `apps/web/src/features/cart/CartPage.tsx`, Header cart badge, đồng bộ `x-guest-session-id`.
- **Backend / API:** `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PUT /api/v1/cart/items/:id`, `DELETE /api/v1/cart/items/:id`, `POST /api/v1/cart/merge`.
- **Database:** Bảng `Cart`, `CartItem`, `Product`.
- **Quy tắc nghiệp vụ:** Sử dụng truy vấn khóa đồng thời `SELECT ... FOR UPDATE` trong transaction để chống tranh chấp dữ liệu (race condition) khi gộp giỏ hàng đa phiên; cộng dồn số lượng nếu sản phẩm đã có trong giỏ chính; chặn vượt quá tồn kho hiện tại.
- **Bằng chứng kiểm thử:** `apps/api/tests/phase_b_cart_merge.test.ts` (10 tests PASS), `apps/web/tests/m6_1_guest_cart_merge.test.tsx` (12 tests PASS).
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

### 2.2 Quản Lý Hồ Sơ Cá Nhân & Đổi Mật Khẩu (Customer Profile & Security)
- **Mục đích:** Cập nhật họ tên, số điện thoại, ảnh đại diện, và thay đổi mật khẩu tài khoản.
- **Quyền truy cập:** Customer đã xác thực (Bearer JWT).
- **Frontend:** `apps/web/src/features/profile/ProfilePage.tsx` (Tab Profile & Tab Password).
- **Backend / API:** `GET /api/v1/profile`, `PUT /api/v1/profile`, `PUT /api/v1/profile/password`.
- **Database:** Bảng `User`.
- **Quy tắc nghiệp vụ:** Đổi mật khẩu bắt buộc nhập đúng mật khẩu hiện tại (`oldPassword`); mật khẩu mới phải đạt tối thiểu 8 ký tự và được mã hóa bằng `bcrypt` (10 rounds); vô hiệu hóa các phiên đăng nhập cũ nếu cần.
- **Bằng chứng kiểm thử:** `apps/api/tests/phase_b_profile_addresses.test.ts`, `apps/web/tests/m6_2_customer_profile.test.tsx`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

### 2.3 Sổ Địa Chỉ Nhận Hàng (Shipping Address Book)
- **Mục đích:** Quản lý danh sách địa chỉ nhận hàng cá nhân, đặt địa chỉ mặc định khi đặt hàng.
- **Quyền truy cập:** Customer đã xác thực.
- **Frontend:** `apps/web/src/features/profile/ProfilePage.tsx` (Tab Addresses) với modal Thêm/Sửa địa chỉ, chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã.
- **Backend / API:** `GET /api/v1/profile/addresses`, `POST /api/v1/profile/addresses`, `PUT /api/v1/profile/addresses/:id`, `DELETE /api/v1/profile/addresses/:id`, `PUT /api/v1/profile/addresses/:id/default`.
- **Database:** Bảng `CustomerAddress`.
- **Quy tắc nghiệp vụ:** Khi một địa chỉ được đặt làm mặc định (`isDefault = true`), toàn bộ các địa chỉ khác của người dùng đó tự động chuyển về `isDefault = false` trong cùng một transaction. Chặn IDOR: người dùng chỉ được sửa/xóa địa chỉ của chính mình.
- **Bằng chứng kiểm thử:** `apps/api/tests/phase_b_profile_addresses.test.ts`, `apps/web/tests/m6_2_customer_profile.test.tsx`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

### 2.4 Đánh Giá Sản Phẩm (Customer Reviews & Ratings)
- **Mục đích:** Khách hàng đã mua sản phẩm được viết đánh giá, chấm điểm sao (1 - 5 sao), gửi phản hồi trải nghiệm.
- **Quyền truy cập:** Customer đã xác thực.
- **Frontend:** `apps/web/src/features/catalog/ProductDetailPage.tsx` (phần Form đánh giá và danh sách reviews).
- **Backend / API:** `POST /api/v1/catalog/products/:id/reviews`, `GET /api/v1/catalog/products/:id/reviews`.
- **Database:** Bảng `Review`, `Order`, `OrderItem`.
- **Quy tắc nghiệp vụ:**
  - Kiểm tra điều kiện mua hàng đã xác thực: Đơn hàng phải ở trạng thái `DELIVERED` để được gắn cờ `isVerifiedPurchase = true`.
  - Chống trùng lặp P2002: Mỗi người dùng chỉ được tạo 1 đánh giá cho mỗi sản phẩm (`@@unique([productId, userId])`). Gửi lại sẽ cập nhật đánh giá cũ.
  - Kiểm duyệt (Moderation): Đánh giá mới tạo mặc định ở trạng thái `PENDING` (chờ quản trị viên duyệt) hoặc `APPROVED` tùy cấu hình cửa hàng.
- **Bằng chứng kiểm thử:** `apps/api/tests/phase_b_customer_reviews.test.ts`, `apps/api/tests/review_p2002_isolation.unit.test.ts`, `apps/web/tests/m6_3_customer_reviews.test.tsx` (15 tests PASS).
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

### 2.5 Yêu Cầu Đổi Trả Hàng (Customer Return Requests)
- **Mục đích:** Khách hàng gửi yêu cầu đổi hàng hoặc trả hàng hoàn tiền cho sản phẩm lỗi.
- **Quyền truy cập:** Customer đã xác thực.
- **Frontend:** `apps/web/src/features/profile/ProfilePage.tsx` (Tab Returns) và nút "Yêu cầu đổi trả" tại chi tiết đơn hàng đã giao.
- **Backend / API:** `POST /api/v1/orders/returns`, `GET /api/v1/orders/returns`, `GET /api/v1/orders/returns/:id`, `PUT /api/v1/orders/returns/:id/cancel`.
- **Database:** Bảng `ReturnRequest`, `ReturnItem`, `ReturnAuditLog`, `Order`.
- **Quy tắc nghiệp vụ:**
  - Chỉ đơn hàng ở trạng thái `DELIVERED` mới được phép đổi trả.
  - Thời hạn đổi trả nghiêm ngặt: Trong vòng **7 ngày** tính từ `deliveredAt` (`order.deliveredAt >= NOW() - 7 days`).
  - Nghiêm cấm sử dụng fallback `updatedAt` để tính hạn đổi trả (đã được sửa và chốt an toàn tại M5 / M6.4).
  - Khách hàng có thể tự hủy yêu cầu khi đang ở trạng thái `PENDING`.
- **Bằng chứng kiểm thử:** `apps/api/tests/returns_state_machine.unit.test.ts`, `apps/api/tests/phase_b_returns_and_admin_crud.test.ts`, `apps/web/tests/m6_4_customer_returns.test.tsx` (18 tests PASS).
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

---

## 4. Miền Nghiệp Vụ 3: Quản Trị Cửa Hàng (Admin & Store Operations)

Toàn bộ nghiệp vụ quản trị được tập trung tại `AdminDashboardPage.tsx` và nhóm API `/api/v1/admin/*`, yêu cầu vai trò `STAFF` hoặc `ADMIN`.

| Phân hệ Admin | Frontend Tab | API Endpoints Chính | Database Models | Trạng thái kỹ thuật | Khả năng nghiệp vụ thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tổng quan (Dashboard)** | `dashboard` | `GET /api/v1/admin/dashboard/stats` | `Order`, `Product`, `User`, `Review` | `IMPLEMENTED & VERIFIED` | Thống kê doanh thu, số đơn hàng, khách hàng mới, đánh giá chờ duyệt |
| **Quản lý Sản phẩm** | `products` | `GET/POST/PUT/DELETE /api/v1/admin/products` | `Product`, `ProductImage` | `IMPLEMENTED & VERIFIED` | CRUD sản phẩm, cập nhật giá, tồn kho, specs, trạng thái `DRAFT/PUBLISHED` |
| **Quản lý Danh mục** | `categories` | `GET/POST/PUT/DELETE /api/v1/admin/categories` | `Category` | `IMPLEMENTED & VERIFIED` | CRUD danh mục sản phẩm, cấu hình biểu tượng icon, phân cấp danh mục |
| **Quản lý Thương hiệu** | `brands` | `GET/POST/PUT/DELETE /api/v1/admin/brands` | `Brand` | `IMPLEMENTED & VERIFIED` | CRUD thương hiệu (Asus, Dell, HP, Apple...), logo và website |
| **Quản lý Tồn kho** | `inventory` | `GET /api/v1/admin/inventory/logs`, `POST /adjust` | `InventoryLog`, `Product` | `IMPLEMENTED & VERIFIED` | Điều chỉnh số lượng tồn kho thủ công, ghi nhật ký biến động kho |
| **Quản lý Đơn hàng** | `orders` | `GET /api/v1/admin/orders`, `PUT /:id/status` | `Order`, `OrderItem`, `AuditLog` | `IMPLEMENTED & VERIFIED` | Xem chi tiết đơn hàng, chuyển trạng thái `CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED` |
| **Quản lý Người dùng** | `users` | `GET /api/v1/admin/users`, `PUT /:id/role` | `User` | `IMPLEMENTED & VERIFIED` | Phân quyền người dùng (`CUSTOMER`, `STAFF`, `ADMIN`), khóa tài khoản |
| **Kiểm duyệt Đánh giá** | `reviews` | `GET /api/v1/admin/reviews`, `PUT /:id/status` | `Review` | `IMPLEMENTED & VERIFIED` | Duyệt đánh giá hiển thị công khai (`APPROVED`) hoặc từ chối (`REJECTED`) |
| **Xử lý Đổi trả hàng** | `returns` | `GET /api/v1/admin/returns`, `PUT /:id/process` | `ReturnRequest`, `ReturnAuditLog` | `IMPLEMENTED & VERIFIED` | Duyệt tiếp nhận, kiểm định, bồi hoàn tiền hoặc gửi sản phẩm thay thế |
| **Phiếu Giảm giá** | `coupons` | `GET/POST/PUT/DELETE /api/v1/admin/coupons` | `Coupon` | `IMPLEMENTED & VERIFIED` | Tạo mã giảm giá theo %, số tiền cố định, giá trị đơn tối thiểu, hạn dùng |
| **Đợt Flash Sale** | `flash-sales` | `GET/POST/PUT/DELETE /api/v1/admin/flash-sales` | `FlashSale`, `FlashSaleItem` | `IMPLEMENTED & VERIFIED` | Thiết lập khung giờ Flash Sale, gán sản phẩm giảm giá số lượng có hạn |
| **Quản lý Banner** | `banners` | `GET/POST/PUT/DELETE /api/v1/admin/banners` | `Banner` | `IMPLEMENTED & VERIFIED` | Quản lý banner slider trang chủ, banner quảng cáo khuyến mãi |
| **Bài viết & Tin tức** | `posts` | `GET/POST/PUT/DELETE /api/v1/admin/posts` | `Post` | `IMPLEMENTED & VERIFIED` | Soạn thảo tin tức công nghệ, bài viết tư vấn, hướng dẫn kỹ thuật |
| **Cấu hình Cửa hàng** | `settings` | `GET/PUT /api/v1/admin/settings` | `StoreSetting` | `IMPLEMENTED & VERIFIED` | Cấu hình hotline, địa chỉ cửa hàng, email liên hệ, phí giao hàng |

---

## 5. Miền Nghiệp Vụ 4: Quy Trình Đặt Hàng & Thanh Toán (Checkout & Orders)

### 5.1 Khởi Tạo Đơn Hàng & Khóa Kho Nguyên Tử
- **Frontend:** `apps/web/src/features/checkout/CheckoutPage.tsx`.
- **Backend / API:** `POST /api/v1/orders`.
- **Quy tắc nghiệp vụ:**
  - Xác thực giỏ hàng không rỗng.
  - Kiểm tra tồn kho từng sản phẩm với truy vấn `SELECT ... FOR UPDATE` trong transaction của Prisma. Nếu có sản phẩm không đủ số lượng, trả về lỗi `409 Conflict` và rollback toàn bộ.
  - Áp dụng mã giảm giá (Coupon): Kiểm tra hợp lệ, hạn sử dụng, giá trị đơn hàng tối thiểu, và giới hạn số lần dùng.
  - Tính phí vận chuyển theo cấu hình cửa hàng.
  - Trừ kho nguyên tử ngay khi đơn hàng được tạo.
- **Bằng chứng kiểm thử:** `apps/api/tests/commerce_and_ai.integration.test.ts`, `apps/web/tests/m6_5_customer_integration_qa.test.tsx`.
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED`.

### 5.2 Tích Hợp Cổng Thanh Toán VNPay Sandbox
- **Frontend:** `apps/web/src/features/checkout/CheckoutPage.tsx` chuyển hướng đến URL cổng VNPay khi chọn phương thức `VNPAY`.
- **Backend / API:** `POST /api/v1/payment/vnpay/create-url`, `GET /api/v1/payment/vnpay/return`, `GET /api/v1/payment/vnpay/ipn`.
- **Quy tắc nghiệp vụ:**
  - Ký số dữ liệu bằng thuật toán `HMAC-SHA512` với khóa bí mật `VNPAY_HASH_SECRET`.
  - Kiểm tra toàn vẹn chữ ký khi nhận kết quả từ VNPay (IPN / Return callback).
  - Cập nhật trạng thái `PaymentStatus.COMPLETED` và `OrderStatus.CONFIRMED` khi giao dịch hợp lệ.
- **Bằng chứng kiểm thử:** `apps/api/tests/payment_security.test.ts` (kiểm tra giả mạo chữ ký HMAC và callback).
- **Trạng thái kỹ thuật:** `IMPLEMENTED & VERIFIED` (trên môi trường VNPay Sandbox).
- **Giới hạn đã biết:** Cần cấu hình thông tin Merchant Production thực tế khi đưa hệ thống lên môi trường thật.
