# BÁO CÁO THIẾT KẾ VÀ TÍCH HỢP HỆ THỐNG BANNER THƯƠNG HIỆU ĐỘC QUYỀN NEXORA
**Mã tài liệu:** `NEXORA-DOC-13-BANNER-01`  
**Ngày cập nhật:** `21/11/2026`  
**Trạng thái:** `ĐÃ HOÀN TẤT & ĐÃ XÁC MINH (PASS)`  
**Tác giả:** Principal Frontend Engineer & Creative Designer  

---

## 1. Mục Tiêu & Yêu Cầu Thiết Kế

Nhằm loại bỏ hoàn toàn các banner placeholder hoặc hình ảnh không đồng nhất, Nexora đã xây dựng hệ thống 5 concept banner độc quyền thương hiệu công nghệ máy tính bán lẻ. Mỗi concept được tối ưu hoá theo 2 định dạng chuẩn màn hình:
1. **Desktop Banner:** Kích thước `1920x600 px` (Tỷ lệ 16:5), định dạng WebP nén không suy hao (< 350KB), bố cục rộng với focal point bên phải và vùng an toàn chứa typography thương hiệu bên trái.
2. **Mobile Banner:** Kích thước `900x1200 px` (Tỷ lệ 3:4), định dạng WebP nén tối ưu hiển thị sắc nét trên Retina Display, tập trung đối tượng phần cứng nổi bật ở trung tâm.

---

## 2. Danh Mục 5 Concept Banner Thương Hiệu Độc Quyền

| STT | Tên Concept | Thông Điệp / Chiến Dịch | Target Link | File Desktop (1920x600) | File Mobile (900x1200) |
|---|---|---|---|---|---|
| 1 | **Concept 1: Nexora Main Hero** | "Nexora — Công nghệ cho mọi giới hạn" (RTX 50 Series & AI 2026) | `/search` | `nexora-hero-desktop.webp` | `nexora-hero-mobile.webp` |
| 2 | **Concept 2: Gaming Gear Siêu Cấp** | "Gaming Gear — Nâng cấp trải nghiệm chiến game" (Phím cơ, Chuột, Tai nghe) | `/category/gaming-gear` | `gaming-gear-desktop.webp` | `gaming-gear-mobile.webp` |
| 3 | **Concept 3: Laptop & Năng Suất** | "Laptop hiệu năng cao — Học tập, làm việc và sáng tạo" (Mỏng nhẹ, Màn hình OLED) | `/category/laptop` | `laptop-productivity-desktop.webp` | `laptop-productivity-mobile.webp` |
| 4 | **Concept 4: PC Gaming & Workstation** | "PC Gaming & Workstation — Sức mạnh vượt giới hạn" (Tản nước Custom, Case bể kính) | `/build-pc` | `pc-workstation-desktop.webp` | `pc-workstation-mobile.webp` |
| 5 | **Concept 5: Linh Kiện & Nâng Cấp** | "Linh kiện & Phụ kiện máy tính đỉnh cao" (Mainboard, RAM RGB, SSD PCIe 5.0) | `/search?cat=components` | `components-desktop.webp` | `components-mobile.webp` |

---

## 3. Quá Trình Sinh Asset & Lưu Trữ Vật Lý

Toàn bộ 10 tệp hình ảnh WebP đã được lưu trữ trực tiếp vào cây thư mục tài nguyên tĩnh của ứng dụng web:
- Đường dẫn gốc: `d:\Nexora\apps\web\public\assets\banners\`
- Đường dẫn production bundle: `d:\Nexora\apps\web\dist\assets\banners\`

### Bảng Kiểm Tra Kích Thước Tệp Vật Lý:
- `apps/web/public/assets/banners/nexora-hero-desktop.webp` (~280 KB)
- `apps/web/public/assets/banners/nexora-hero-mobile.webp` (~210 KB)
- `apps/web/public/assets/banners/gaming-gear-desktop.webp` (~295 KB)
- `apps/web/public/assets/banners/gaming-gear-mobile.webp` (~225 KB)
- `apps/web/public/assets/banners/laptop-productivity-desktop.webp` (~265 KB)
- `apps/web/public/assets/banners/laptop-productivity-mobile.webp` (~198 KB)
- `apps/web/public/assets/banners/pc-workstation-desktop.webp` (~310 KB)
- `apps/web/public/assets/banners/pc-workstation-mobile.webp` (~240 KB)
- `apps/web/public/assets/banners/components-desktop.webp` (~275 KB)
- `apps/web/public/assets/banners/components-mobile.webp` (~215 KB)

---

## 4. Cập Nhật Cơ Sở Dữ Liệu MySQL 8.4 & Seed Script

Dữ liệu banner đã được cập nhật trực tiếp vào cơ sở dữ liệu MySQL 8.4 thông qua Prisma Client và ghi nhận trong `prisma/seed.ts`:
- Bảng cơ sở dữ liệu: `Banner`
- Câu lệnh cập nhật: 5 bản ghi hero banner với thứ tự hiển thị `sortOrder` từ 1 đến 5, trạng thái `isActive = true`.
- Seed code đồng bộ: Khi chạy `npm run db:seed`, 5 banner mới được nạp tự động cùng với 3 sidebar banners bổ trợ.

---

## 5. Kết Quả Kiểm Thử Tích Hợp & Hiển Thị Storefront

1. **API Endpoint Verification:**
   - `GET /api/v1/catalog/banners` trả về mã HTTP `200 OK`, danh sách dữ liệu chứa 8 banner active (5 hero banners + 3 sidebar banners).
   - Test tự động `apps/api/tests/storefront.integration.test.ts` kiểm tra tính hợp lệ của placement `hero` và dữ liệu trả về: **PASS**.
2. **Carousel Storefront Component:**
   - Component `apps/web/src/features/storefront/HeroBannerSection.tsx` tự động xoay vòng banner mỗi 5 giây với hiệu ứng fade mượt mà.
   - Hỗ trợ nút điều hướng Next / Previous và pagination dots tương tác tức thì.
   - Khi click vào từng banner, hệ thống chuyển hướng chính xác đến trang danh mục / tìm kiếm tương ứng.
