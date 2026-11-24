# 09 — TechPilot to Nexora Data Migration

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-09`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM LEGACY DUMP & NEXORA DATABASE`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Nguồn Dữ Liệu Gốc & Mục Tiêu Di Chuyển (Migration Context)

Nexora được phát triển trên cơ sở tái cấu trúc toàn diện từ nền tảng tiền thân **TechPilot** (PHP MVC / MariaDB). Quá trình di chuyển dữ liệu (Data Migration) tập trung chủ yếu vào việc kế thừa toàn bộ danh mục sản phẩm phần cứng, thương hiệu, danh mục và cấu trúc dữ liệu kỹ thuật, đồng thời chuẩn hóa theo mô hình TypeScript / Prisma / MySQL 8.4 mới.

### Nguồn Dữ Liệu Tham Chiếu:
- **Kho lưu trữ TechPilot gốc:** Nằm độc lập ngoài repo tại `D:\02_Dự Án Phần Mềm\TechPilot (Bản Chính Thức)\`.
- **Tập tin lược đồ gốc:** `TechPilot/database/schema.sql` (28 bảng MariaDB).
- **Tập tin kết xuất dữ liệu mẫu gốc:** `TechPilot/database/seed_dev.sql` (chứa các chuỗi INSERT tuple lớn).
- **Hệ thống đích:** Cơ sở dữ liệu Nexora MySQL 8.4 LTS (`127.0.0.1:3306/nexora`).

---

## 2. Bảng Đối Soát Định Lượng Nguồn và Đích (Source vs Target Reconciliation)

| Nhóm dữ liệu | TechPilot Gốc (`seed_dev.sql`) | Đích Nexora Dev DB | Quyết định Phạm vi Đã Duyệt | Ghi chú & Trạng thái đối soát |
| :--- | :---: | :---: | :---: | :--- |
| **Sản phẩm (Products)** | **696 tuples** | **674 sản phẩm** | **651 sản phẩm** | Đã nhập 674 sản phẩm qua `seed_nexora_catalog.sql`. 23 sản phẩm dôi dư thuộc diện dữ liệu kiểm thử cũ của TechPilot cần lọc bỏ để về mốc chuẩn 651 |
| **Thương hiệu (Brands)** | **30 thương hiệu** | **31 thương hiệu** | **31 thương hiệu** | 30 thương hiệu kế thừa (Asus, MSI, Dell...) + 1 thương hiệu tự xây dựng (Nexora) |
| **Danh mục (Categories)** | **21 danh mục** | **36 danh mục** | **36 danh mục** | 21 danh mục đơn lẻ kế thừa + 15 danh mục mở rộng và nhóm tiện ích (PC Nexora, Main-CPU-VGA...) |
| **Ảnh Thư viện (ProductImage)** | **2,760 tuples** | **23 bản ghi** | **Cần hoàn thiện** | `seed_nexora_catalog.sql` chỉ nhập bảng `products`, chưa nhập bảng phụ `product_images` |
| **Ảnh Đại diện (ThumbnailUrl)** | Có trong sản phẩm | **116 sản phẩm** | **Cần bổ sung** | 116 sản phẩm có đường dẫn ảnh thật; 558 sản phẩm đang để `null` (hiển thị placeholder) |
| **Ảnh Tĩnh Trong Assets** | Khá lớn | **271 tệp ảnh** | **Đã bảo tồn** | 109 PNG, 117 JPG, 12 WebP, 33 SVG nằm trong `apps/web/public/assets/` |
| **Tài khoản Người dùng** | Dữ liệu cũ | **3 tài khoản** | **Bảo mật tuyệt đối** | Loại bỏ toàn bộ tài khoản cũ; khởi tạo 3 tài khoản mới an toàn bằng `bcrypt` |

---

## 3. Chiến Lược Ánh Xạ & Chuyển Đổi Dữ Liệu (Mapping Strategy)

### A. Chuẩn hóa Mã Sản Phẩm (SKU) & Định Danh URL (Slug)
- **SKU:** Giữ nguyên 100% mã SKU gốc của TechPilot (ví dụ: `LAP-ASU-G16`, `CPU-INT-14900K`, `VGA-ASU-4070TIS`) để bảo đảm tính liên tục trong quản lý kho phần cứng.
- **Slug:** Giữ nguyên cấu trúc slug SEO thân thiện (ví dụ: `asus-rog-zephyrus-g16`, `cpu-intel-core-i9-14900k`). Không có slug nào bị trùng lặp trong cơ sở dữ liệu nhờ ràng buộc `@@unique([slug])`.

### B. Tái cấu trúc Cây Danh Mục (Categories Restructuring)
- Trong TechPilot, danh mục được lưu trữ phẳng hoặc tự liên kết lỏng lẻo.
- Trong Nexora, cây danh mục được thiết kế lại với quan hệ tự tham chiếu (Self-relation) `parentId -> id` trong Prisma, hỗ trợ danh mục đa cấp:
  - Cấp 1 (Gốc): Máy tính, Laptop, Linh kiện, Thiết bị ngoại vi...
  - Cấp 2 (Con): CPU, Mainboard, RAM, Ổ cứng, Card màn hình...
  - Nhóm tiện ích mở rộng: Đã bổ sung 9 danh mục gộp (như `main-cpu-vga`, `case-nguon-tan`, `o-cung`) để tương thích ngược với thói quen tìm kiếm của người dùng cũ.

### C. Chuẩn hóa Thương Hiệu (Rebranding TechPilot -> Nexora)
- Toàn bộ các chuỗi văn bản mô tả, tên cấu hình PC (`PC TechPilot`) đều được chuyển đổi tự động thành `PC Nexora`.
- Tên miền liên kết trong văn bản `techpilot.vn` / `techpilot.io.vn` được chuẩn hóa thành `nexora.local`.

---

## 4. Phân Tích Lỗ Hổng Di Chuyển Hình Ảnh (Image Migration Gap)

Đây là điểm sai lệch lớn nhất đã được kiểm toán phát hiện và ghi nhận khách quan:

1. **Thực trạng dữ liệu:**
   - Trong `seed_dev.sql` gốc của TechPilot, bảng `product_images` chứa tới **2,760 dòng**, phản ánh thư viện ảnh đầy đủ của các sản phẩm.
   - Khi tạo tập tin `seed_nexora_catalog.sql` (786 dòng SQL), đội ngũ trước chỉ xuất câu lệnh `INSERT INTO products ...` (674 sản phẩm) mà **bỏ quên câu lệnh INSERT INTO product_images**.
   - Hậu quả: Bảng `product_images` trong database Nexora hiện chỉ có **23 bản ghi** (được tạo bởi kịch bản mẫu `seed.ts` cho 23 sản phẩm demo).
   - Trong 674 sản phẩm ở bảng `products`, chỉ có **116 sản phẩm** có trường `thumbnailUrl` trỏ về các file ảnh hợp lệ tại `/assets/images/review/unlinked/...`. Còn lại **558 sản phẩm** có `thumbnailUrl = null`.

2. **Cách ứng dụng đang xử lý:**
   - Tại Frontend (`apps/web/src/features/catalog/ProductCard.tsx` và `ProductDetailPage.tsx`), hệ thống đã cài đặt cơ chế an toàn: nếu `thumbnailUrl` là `null` hoặc tải ảnh lỗi (`onError`), giao diện tự động hiển thị ảnh placeholder phần cứng mặc định. Nhờ đó, giao diện người dùng không bị vỡ bố cục, nhưng trải nghiệm hình ảnh chưa đạt độ phong phú tối đa.

3. **Hướng khắc phục đề xuất:**
   - Chạy kịch bản di chuyển hình ảnh offline (sử dụng logic trong `prisma/seed_techpilot_full.ts`) để bóc tách 2,760 dòng ảnh từ `seed_dev.sql` của TechPilot, kiểm tra sự tồn tại của file ảnh trên đĩa, và thực hiện bulk insert vào bảng `product_images` của Nexora.

---

## 5. Đối Soát Các Tập Tin Kịch Bản Khởi Tạo (Seed Scripts Inventory)

Hệ thống hiện có 3 tập tin kịch bản liên quan đến dữ liệu:

1. **`prisma/seed.ts` (1,522 dòng TypeScript):**
   - *Mục đích:* Kịch bản khởi tạo chuẩn (Default Seed) cho môi trường phát triển và kiểm thử.
   - *Dữ liệu tạo ra:* 3 tài khoản người dùng an toàn, 31 thương hiệu, 36 danh mục, 23 sản phẩm demo có đủ ảnh và thông số JSON, 5 coupon, 1 flash sale, 9 banners, 8 bài viết, và các cài đặt cửa hàng.
   - *Đánh giá:* Hoạt động hoàn hảo, được tích hợp vào `npm run db:seed` và CI pipeline.

2. **`prisma/seed_nexora_catalog.sql` (786 dòng SQL - Untracked):**
   - *Mục đích:* Dữ liệu kết xuất trực tiếp chứa 674 sản phẩm phần cứng từ TechPilot.
   - *Đánh giá:* Đã được nạp vào MySQL dev database hiện tại. Cần lọc bỏ 23 sản phẩm rác để đưa về đúng mốc 651 sản phẩm đã được phê duyệt.

3. **`prisma/seed_techpilot_full.ts` (417 dòng TypeScript - Untracked):**
   - *Mục đích:* Kịch bản bóc tách và phân tích cú pháp SQL dump từ TechPilot sang Prisma.
   - *Đánh giá:* Kịch bản công cụ chuyển đổi (Migration Tooling Script). Tuyệt đối **KHÔNG CHẠY** kịch bản này trong môi trường hiện tại để tránh ghi đè làm biến động dữ liệu đã ổn định.
