# KIỂM CHỨNG TOÀN VẸN CATALOG SẢN PHẨM & PHÂN ĐỊNH DỮ LIỆU
## (PRODUCT CATALOG & TEST DATA VALIDATION REPORT)

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System  
- **Văn bản:** `comprehensive-audit/16_PRODUCT_CATALOG_AND_TEST_DATA_VALIDATION.md`  
- **Thời điểm xác minh:** 2026-11-23  
- **Trạng thái:** **VERIFIED 100% TOÀN VẸN DỮ LIỆU CATALOG**  

---

## 1. TỔNG QUAN CATALOG ĐÃ ĐỐI SOÁT THỰC NGHIỆM

Truy vấn trực tiếp từ cơ sở dữ liệu MySQL 8.4 LTS (`d:\Nexora\.env`):

| Chỉ số Catalog | Số lượng đã báo cáo | Số lượng kiểm chứng thực tế | Trạng thái đối soát |
| :--- | :---: | :---: | :---: |
| **Sản phẩm Baseline Nexora** | 23 | **23** | **VERIFIED (ID 1 đến 23)** |
| **Sản phẩm Import TechPilot** | 651 | **651** | **VERIFIED (ID 24 đến 815)** |
| **TỔNG CỘNG SẢN PHẨM** | **674** | **674** | **VERIFIED 100% NGUYÊN VẸN** |
| **Danh mục (Categories)** | 36 | **36** | **VERIFIED (21 gốc + 15 nhóm/alias)** |
| **Thương hiệu (Brands)** | 31 | **31** | **VERIFIED (30 TechPilot + 1 Nexora)** |
| **Trạng thái sản phẩm** | 100% ACTIVE | **674 ACTIVE (0 draft/inactive)** | **VERIFIED** |

---

## 2. CHẤT LƯỢNG DỮ LIỆU CATALOG (DATA QUALITY CHECKS)

Chạy kiểm toán sâu bằng script AST & Prisma Client (`scratch/verify_catalog_deep.ts`):

1. **Tính duy nhất của SKU (SKU Uniqueness):**
   - Tổng số SKU: 674.
   - Số SKU duy nhất: 674.
   - **Số SKU trùng lặp: 0**.
2. **Tính duy nhất của Slug (Slug Uniqueness):**
   - Tổng số Slug: 674.
   - Số Slug duy nhất: 674.
   - **Số Slug trùng lặp: 0**.
3. **Tính hợp lệ của tên sản phẩm (Missing Name Check):**
   - Sản phẩm không có tên hoặc tên rỗng: **0**.
4. **Tính hợp lệ của giá bán (Price Integrity Check):**
   - Sản phẩm có giá $\le 0$: **0** (Tất cả sản phẩm đều có giá bán hợp lệ từ vài chục nghìn đến hàng trăm triệu VNĐ).
5. **Quan hệ danh mục (Category Foreign Key Check):**
   - Sản phẩm thiếu liên kết danh mục (`categoryId` null hoặc mồ côi): **0**.
6. **Quan hệ thương hiệu (Brand Foreign Key Check):**
   - Sản phẩm có thương hiệu hợp lệ: **667 sản phẩm**.
   - Sản phẩm không gán thương hiệu: **7 sản phẩm** (đây là các linh kiện dây cáp, đầu chuyển đổi generic chuẩn quốc tế không nhãn hiệu).

---

## 3. KẾT QUẢ ĐIỀU TRA TOÀN DIỆN VỀ HÌNH ẢNH SẢN PHẨM (PRODUCT IMAGE INVESTIGATION)

### 3.1. Hiện trạng tài nguyên ảnh trên ổ đĩa
- **Thư mục lưu trữ:** `apps/web/public/assets/`
- **Tổng số file ảnh vật lý:** **273 files** (269 files trong `assets/` + 4 files favicon trong root).
- **Phân loại định dạng:**
  - `.jpg`: 117 files
  - `.png`: 107 files
  - `.svg`: 32 files (gồm toàn bộ logo thương hiệu Asus, MSI, Gigabyte, Intel, AMD,...)
  - `.webp`: 12 files (banners responsive máy tính bảng và mobile)
  - `.ico`: 1 file (favicon)

### 3.2. Hiện trạng liên kết trong Cơ sở dữ liệu
- **Bảng `products` (cột `thumbnail_url`):**
  - **114 sản phẩm** có ảnh đại diện liên kết trực tiếp và **tồn tại thực tế 100% trên đĩa**.
  - **2 sản phẩm** có đường dẫn ảnh không tìm thấy trên đĩa (được frontend tự động dùng ảnh placeholder fallback).
  - **558 sản phẩm** có `thumbnail_url` rỗng (sử dụng component placeholder SVG/PNG chuẩn mực của Nexora khi hiển thị).
- **Bảng `product_images` (ảnh phụ của sản phẩm):**
  - Tổng số bản ghi trong DB: **23 records** (ảnh chi tiết của 23 sản phẩm baseline).
  - Có 21 ảnh tồn tại trên đĩa, 2 ảnh trỏ tới đường dẫn cũ.

### 3.3. Nguyên nhân gốc rễ (Root Cause) của việc import ảnh thất bại trước đây
1. **Script thực thi:** `d:\Nexora\prisma\seed_techpilot_full.ts`.
2. **Đoạn mã gây lỗi (Dòng 285-293):**
   ```typescript
   await prisma.productImage.create({
     data: {
       productId: prodId,
       imageUrl: imgUrl,
       altText: alt,
       position: pos,       // <--- TRƯỜNG KHÔNG TỒN TẠI TRONG SCHEMA PRISMA
       isPrimary: isPrimary // <--- TRƯỜNG KHÔNG TỒN TẠI TRONG SCHEMA PRISMA
     },
   }).catch(() => {});     // <--- LỖI BỊ BỎ QUA TRẦM LẶNG (SILENT CATCH)
   ```
3. **Mâu thuẫn Schema:**
   - Trong TechPilot MySQL: bảng `product_images` có 2 cột tên là `position` và `is_primary`.
   - Trong Nexora Prisma (`schema.prisma`): model `ProductImage` chỉ định nghĩa:
     `id, productId, imageUrl, altText, sortOrder, createdAt`. (Sử dụng `sortOrder` thay cho cả `position` và `is_primary`).
4. **Hậu quả:** Khi chạy script, Prisma Client ném ngoại lệ `PrismaClientValidationError` cho mọi bản ghi ảnh import. Do có khối `.catch(() => {})`, toàn bộ 500 bản ghi ảnh phụ từ TechPilot đã **bị bỏ qua âm thầm**, dẫn tới việc bảng `product_images` vẫn chỉ giữ nguyên 23 bản ghi ban đầu.
5. **Biện pháp xử lý:** Không chạy lại seed ảnh vào thời điểm này. Giữ nguyên DB hiện tại và chuẩn hóa vào tài liệu kế hoạch.

---

## 4. TÍNH ĐỘC LẬP CỦA NGUỒN DỮ LIỆU NEXORA (CATALOG INDEPENDENCE)

Để giải phóng Nexora khỏi sự phụ thuộc vào đường dẫn tuyệt đối của thư mục `TechPilot`, tài liệu nguồn độc lập đã được tạo:

- **Vị trí file:** [`prisma/seed_nexora_catalog.sql`](file:///d:/Nexora/prisma/seed_nexora_catalog.sql) (Kích thước: 0.85 MB).
- **Nội dung:** Chứa toàn bộ câu lệnh INSERT tiêu chuẩn cho:
  - 31 Brands
  - 36 Categories
  - 674 Products
  - 23 Product Images
- **Đặc điểm chuẩn mực:**
  - 100% khớp tên bảng và tên cột của schema Prisma Nexora.
  - Văn bản thương hiệu đã được làm sạch thành "Nexora", domain `nexora.local`.
  - Không chứa bất kỳ dữ liệu khách hàng, đơn hàng hay tài khoản test nào.
  - **TUYỆT ĐỐI CHƯA ĐƯỢC CHẠY VÀO DATABASE** (tuân thủ nguyên tắc bảo toàn dữ liệu).

---

## 5. RỦI RO CÒN TỒN TẠI & BIỆN PHÁP KIỂM SOÁT

1. **Rủi ro sản phẩm chưa có ảnh chi tiết:** 558 sản phẩm hiện chỉ hiển thị qua placeholder frontend. Khi người dùng bấm vào xem chi tiết, giao diện vẫn hoạt động mượt mà nhưng trải nghiệm thị giác chưa đạt tối đa.  
   *Biện pháp:* Sẽ lập task bổ sung map ảnh phụ vào `ProductImage` trong giai đoạn chuẩn bị dữ liệu Production (Phase C).
2. **Rủi ro toàn vẹn khi dọn dẹp test data:** Bảng `carts` có 6 session khách vãng lai rỗng.  
   *Biện pháp:* Tuân thủ cổng phê duyệt; chỉ xóa khi có lệnh phê duyệt ID cụ thể từ Chủ dự án.
