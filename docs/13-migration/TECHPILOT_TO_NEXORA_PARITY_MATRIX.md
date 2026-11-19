# TECHPILOT_TO_NEXORA_PARITY_MATRIX.md — Bảng Đối Chiếu 100% Tính Năng Cũ Sang Mới

- **Mục tiêu:** Đảm bảo hệ thống Nexora đạt tương đương 100% về giao diện, chức năng và hành vi người dùng so với TechPilot gốc, trên nền tảng công nghệ mới (React 19, TypeScript, Express, MySQL 8.4, Prisma ORM).

---

## 1. Storefront & Trang Chủ

| Tính năng trong TechPilot | Hiện trạng trong Nexora | Mức độ tương thích | Bằng chứng kiểm chứng |
|:---|:---|:---:|:---|
| **Top bar thông báo động** | Đã chuyển đổi thành component `StorefrontHeader.tsx` có marquee chạy chữ vô tận 2 nhóm | `100% PASS` | `hero-fixed-live.png` |
| **Header thanh tìm kiếm + chọn danh mục** | Form tìm kiếm tích hợp dropdown chọn danh mục, nút kính lúp, link Tra cứu đơn hàng, Hotline 1800 2097 | `100% PASS` | `hero-fixed-live.png` |
| **Nút Yêu thích, Giỏ hàng, Đăng nhập, Đổi theme** | Hoạt động thật với đếm số lượng giỏ hàng badge đỏ, giỏ hàng popup drawer, theme Light/Dark chuẩn | `100% PASS` | `hero-fixed-live.png` |
| **Menu danh mục dọc 16 nhóm (Category Sidebar)** | Đầy đủ 16 danh mục: Laptop, Laptop Gaming, PC, Main/CPU/VGA, Case/Nguồn/Tản, Ổ cứng, Loa/Webcam, Màn hình, Bàn phím, Chuột, Tai nghe, Ghế/Bàn, Phần mềm, Phụ kiện, TBVP, Sạc dự phòng | `100% PASS` | `hero-fixed-live.png` |
| **Mega Menu Flyout 4 cột khi hover** | Hover hiển thị 4 cột: Thương hiệu, Phân khúc giá, Thông số phần cứng, Nhu cầu sử dụng | `100% PASS` | `website-mega-menu-hover.png` |
| **Hero Banner Carousel** | 5 slide tự động chuyển động hoặc click dot: ROG Zephyrus G16, MacBook Pro 16 M3 Max, PC Gaming Ultra Max, Odyssey OLED G9, RTX 50 Series | `100% PASS` | `hero-fixed-live.png` |
| **3 Promo Cards bên phải banner** | 3 thẻ: Build PC theo yêu cầu, Mua ngay trả sau, Thu cũ đổi mới máy cũ kèm gradient chuẩn | `100% PASS` | `hero-fixed-live.png` |
| **Service Policy Bar (5 chính sách cam kết)** | 5 cam kết: Miễn phí giao hàng, Bảo hành chính hãng, Đổi trả dễ dàng, Thanh toán COD, Hỗ trợ kỹ thuật 24/7 | `100% PASS` | `hero-fixed-live.png` |
| **Flash Sale Section** | Đồng hồ đếm ngược Giờ:Phút:Giây, thanh tiến độ bán "Đã bán X/Y", badge lửa đỏ | `100% PASS` | `products-crisp-live.png` |
| **Sản phẩm nổi bật (Tabs lọc nhanh)** | Tabs: Tất cả, Laptop, PC TechPilot, Linh kiện PC, Màn hình, Gaming Gear kèm ảnh chụp sản phẩm độ phân giải cao | `100% PASS` | `products-crisp-live.png` |
| **Product Card tương tác** | Ảnh sắc nét, badge giảm giá, nút trái tim yêu thích, nút cân so sánh, specs pill microchip, sao đánh giá, nút "Thêm vào giỏ" trượt lên khi hover | `100% PASS` | `products-crisp-live.png` |
| **Footer Storefront chuẩn TechPilot** | 4 cột liên kết, danh sách chứng nhận, đối tác thanh toán, hotline, thông tin doanh nghiệp | `100% PASS` | `website-storefront-100-full.png` |

---

## 2. Xác Thực & Phân Quyền (Authentication & RBAC)

| Chức năng | Hiện trạng TechPilot | Chuyển đổi sang Nexora | Trạng thái |
|:---|:---|:---|:---:|
| **Auth Modal (Đăng nhập / Đăng ký nhanh)** | Thẻ trắng `.auth-card`, icon tròn xanh, tabs linh hoạt | Tái hiện nguyên bản trong `AuthModal.tsx` | `100% PASS` |
| **Trang Đăng nhập độc lập (`/auth/login`)** | Trang riêng biệt có trust badges | Đã tạo `LoginPage.tsx` tại route `/auth/login` và `/login` | `100% PASS` |
| **Trang Đăng ký độc lập (`/auth/register`)** | Trang riêng biệt có thanh tiến độ và form đầy đủ | Đã tạo `RegisterPage.tsx` tại route `/auth/register` và `/register` | `100% PASS` |
| **Cơ chế phân quyền** | Session PHP | JWT Token + HttpOnly Cookies + Express RBAC Middleware (`requireRole`) | `100% PASS` |
| **Chuẩn hóa User Roles** | Trước đây có lúc nhầm SELLER | Chuẩn hóa tuyệt đối 3 roles: `CUSTOMER`, `STAFF`, `ADMIN` (Single-Vendor Store) | `100% PASS` |

---

## 3. Quản Lý Giỏ Hàng & Mua Hàng (Cart & Checkout)

| Chức năng | Cơ chế cũ (TechPilot) | Triển khai mới (Nexora) | Trạng thái |
|:---|:---|:---|:---:|
| **Giỏ hàng trượt Drawer** | Modal popup giỏ hàng | `CartDrawer.tsx` trượt mượt mà từ cạnh phải, hỗ trợ tăng giảm số lượng tức thì | `100% PASS` |
| **Tính toán tổng tiền** | PHP Session array | Express API + TanStack Query + Prisma ACID transaction | `100% PASS` |
| **Bảo lưu giá Snapshot** | Lưu tạm | `OrderItem` snapshot `unitPrice`, `salePrice`, `cogsPrice` ngăn ngừa sửa giá hồi tố | `100% PASS` |
| **Thanh toán trực tuyến** | VNPay sandbox | VNPay v2.1.0 checksum HMAC SHA512 + COD + VietQR Napas | `100% PASS` |

---

## 4. Công Cụ Chuyên Sâu Công Nghệ (Specialized Tech Tools)

| Công cụ | TechPilot gốc | Nexora hiện đại hóa | Trạng thái |
|:---|:---|:---|:---:|
| **Xây dựng cấu hình PC (`/build-pc`)** | Form chọn từng linh kiện và kiểm tra socket tương thích | Component `PcBuilder` chọn 8 bộ phận, tự tính công suất nguồn PSU và tổng giá | `100% PASS` |
| **So sánh sản phẩm (`/compare`)** | Bảng so sánh 2-4 sản phẩm theo thông số specs | Bảng đối chiếu so sánh thông số JSON specs động | `100% PASS` |
| **AI Tư vấn (`/ai-assistant`)** | API chat tư vấn linh kiện | Tích hợp Google Gemini API tư vấn cấu hình chuẩn game/đồ họa | `100% PASS` |
| **Tin tức công nghệ (`/post`)** | Blog tin tức IT, thủ thuật | Danh mục bài viết công nghệ chuẩn SEO, Schema.org Article | `100% PASS` |
