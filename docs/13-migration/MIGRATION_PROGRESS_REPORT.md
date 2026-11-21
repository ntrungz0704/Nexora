# MIGRATION_PROGRESS_REPORT.md — Báo Cáo Tiến Độ Chuyển Đổi Hệ Thống

- **Cập nhật lúc:** 2026-11-19
- **Trạng thái tổng thể:** **HOÀN THÀNH TOÀN BỘ GIAO DIỆN & DỮ LIỆU STOREFRONT THEO CHUẨN TECHPILOT**

---

## 1. Bảng Trạng Thái Chi Tiết Từng Hạng Mục

| Hạng mục                                             | Khối lượng chuyển đổi                                                                                                                                                                                                          | Kết quả thực tế                                        | Trạng thái |
| :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :--------: |
| **1. Khảo sát & Bảo toàn TechPilot**                 | Giữ nguyên 100% mã nguồn TechPilot làm tài liệu đối chiếu                                                                                                                                                                      | Không sửa, không xóa `TechPilot/`                      |   `PASS`   |
| **2. Tái hiện Storefront Gốc**                       | Topbar, Header, Nav, Category Sidebar, Mega Menu Flyout, Hero Carousel, Promo Cards, Flash Sale, Product Grid, Bottom Features, Footer                                                                                         | Tái hiện 100% cấu trúc HTML & CSS gốc                  |   `PASS`   |
| **3. Xử lý ảnh sắc nét (High-Res Assets)**           | Thay thế các icon/placeholder mờ bằng ảnh chụp phần cứng chính hãng chất lượng cao                                                                                                                                             | Ảnh chuột, phím, màn OLED, card RTX, CPU i9 sắc nét    |   `PASS`   |
| **4. Sửa lỗi Hero Section & Header**                 | Tách topbar khỏi sticky header stack, căn chỉnh vị trí nút bấm và slide                                                                                                                                                        | Cân đối hoàn hảo, không bị đè che khuất                |   `PASS`   |
| **5. Tái thiết kế Auth Modal & Pages**               | Chuyển đổi từ dark theme sang thẻ trắng `.auth-card` chuẩn TechPilot; tạo `/auth/login` và `/auth/register`                                                                                                                    | Đúng chuẩn light-theme, Google OAuth, demo helper      |   `PASS`   |
| **6. Database & Seed Dữ liệu**                       | Di trú bảng `users`, `categories`, `products`, `orders`, `banners` sang MySQL 8.4 LTS                                                                                                                                          | 13 sản phẩm, 16 danh mục, 8 banner đã nạp DB           |   `PASS`   |
| **7. Tài liệu kỹ thuật chuyển đổi**                  | 7 tài liệu đặc tả di trú trong `docs/13-migration/`                                                                                                                                                                            | Hoàn thành đầy đủ                                      |   `PASS`   |
| **8. Tách biệt 20 trang tính năng riêng**            | Wishlist, Cart, Checkout, Checkout Success, PC Builder, Compare, AI Assistant, Trade-In, News, Post Detail, Order Tracking, Stores, Profile, Search Catalog, Product Detail, Login, Register, Forgot Password, Admin Dashboard | Đầy đủ 20 trang riêng biệt, không còn fallback về Home |   `PASS`   |
| **9. Khắc phục triệt để lỗi đè Hero & Features Bar** | Sửa `min-height: 590px`, bỏ cưỡng ép `height: 480px` tại màn hình nhỏ, thêm khoảng đệm an toàn                                                                                                                                 | Zero overlap, hoàn toàn thông thoáng                   |   `PASS`   |

---

## 2. Kiểm Chứng Chất Lượng Kỹ Thuật (Quality Gates)

- **Lint:** `npm run lint` -> **0 errors, 0 warnings**.
- **Typecheck:** `npm run typecheck` -> **PASS trên toàn bộ Monorepo** (`@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web`).
- **Tests:** `npm run test` -> **14/14 tests pass (100%)**.
- **Build:** `npm run build` -> **Build thành công client bundle và API bundle**.
- **Playwright Visual E2E:** 14 ảnh chụp kiểm chứng trực tiếp từ môi trường live:
  - `homepage-no-overlap.png`
  - `page-wishlist.png`
  - `page-cart.png`
  - `page-checkout.png`
  - `page-build-pc.png`
  - `page-compare.png`
  - `page-ai-assistant.png`
  - `page-trade-in.png`
  - `page-news.png`
  - `page-order-tracking.png`
  - `page-stores.png`
  - `page-profile.png`
  - `page-search-catalog.png`
  - `page-admin-dashboard.png`
