# KẾ HOẠCH DỌN DẸP DỮ LIỆU CÓ KIỂM SOÁT (CONTROLLED DATA CLEANUP PLAN)
## TÀI LIỆU QUẢN TRỊ RÀNH MẠCH DỮ LIỆU THẬT VÀ DỮ LIỆU TEST/DEMO

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System  
- **Văn bản:** `comprehensive-audit/14_PRODUCTION_DATA_CLEANUP_PLAN.md`  
- **Database Mục Tiêu:** `mysql://nexora:****@127.0.0.1:3306/nexora` (MySQL 8.4 LTS)  
- **Thời điểm lập kế hoạch:** 2026-11-23  
- **Trạng thái:** **READ-ONLY AUDIT & PROPOSAL — CHƯA THỰC THI (CHỜ PHÊ DUYỆT CỦA CHỦ DỰ ÁN)**  
- **Nguyên tắc cốt lõi:** Đây KHÔNG PHẢI database reset. Đây là quy trình bảo toàn 100% dữ liệu thật có giá trị và chỉ đề xuất loại bỏ các bản ghi test/demo đã được xác minh bằng chứng cụ thể.

---

## 1. MỤC TIÊU & DANH SÁCH BẢO TỒN DỮ LIỆU THẬT (REAL DATA — MUST KEEP)

Tuyệt đối bảo vệ và không được xóa, sửa các thực thể sau:

1. **Product Catalog:** Toàn bộ **674 sản phẩm** (23 sản phẩm baseline + 651 sản phẩm TechPilot), **36 danh mục** và **31 thương hiệu**.
2. **User Accounts Thật:** 
   - `id: 1` (`admin@nexora.local` - Quản trị viên hệ thống)
   - `id: 2` (`staff@nexora.local` - Nhân viên kỹ thuật cửa hàng)
   - `id: 3` (`customer@nexora.local` - Khách hàng chuẩn Nguyễn Văn An)
3. **Địa chỉ khách hàng:** `id: 56` (`userId: 3`, "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh").
4. **Đơn hàng & Mục đơn hàng thật:**
   - Đơn hàng `id: 1` (`NX-2026-0001`, COD/PAID, DELIVERED)
   - Đơn hàng `id: 2` (`NX-2026-0002`, VNPAY/PAID, SHIPPING)
5. **Giỏ hàng khách hàng thật:** `id: 1` (`userId: 3`, chứa 2 sản phẩm: `LAP-ROG-G16-01` và `KB-LOG-G913TKL`).
6. **Mã giảm giá (Coupons):** 5 mã khuyến mãi hoạt động (`WELCOME10`, `TECHPILOT100`, `FREESHIP`, `MEGA2026`, `VIP500`).
7. **Chiến dịch Flash Sale:** `id: 1` ("Flash Sale Giờ Vàng Công Nghệ", sản phẩm `id: 1`).
8. **Banner & Tin tức:** 9 banners quảng cáo trang chủ và 8 bài viết tin tức công nghệ (`posts`).
9. **Cấu hình hệ thống:** 5 bản ghi trong `store_settings` (tên cửa hàng, hotline, email, địa chỉ).
10. **Nhật ký kiểm toán hệ thống:** 2 bản ghi `FULL_MIGRATION_STOREFRONT_SEEDED` trong `audit_logs`.

---

## 2. BẢNG KIỂM KÊ TOÀN BỘ 27 BẢNG VÀ PHÂN LOẠI DỮ LIỆU (DATABASE INVENTORY)

| # | Tên bảng MySQL | Số lượng bản ghi | Model Prisma tương ứng | Phân loại dữ liệu | Hành động đề xuất | Mức độ rủi ro |
| :-: | :--- | :---: | :--- | :--- | :--- | :---: |
| 1 | `_prisma_migrations` | 8 | *Hệ thống Prisma* | REAL / MIGRATION TRACKER | **KEEP (Không sửa)** | CỰC CAO |
| 2 | `store_settings` | 5 | `StoreSetting` | REAL / CONFIGURATION | **KEEP (Không sửa)** | CAO |
| 3 | `users` | 3 | `User` | REAL / ACCOUNTS | **KEEP (Không sửa)** | CỰC CAO |
| 4 | `customer_addresses` | 1 | `CustomerAddress` | REAL / ADDRESS | **KEEP (Không sửa)** | CAO |
| 5 | `brands` | 31 | `Brand` | REAL / CATALOG | **KEEP (Không sửa)** | CỰC CAO |
| 6 | `categories` | 36 | `Category` | REAL / CATALOG | **KEEP (Không sửa)** | CỰC CAO |
| 7 | `products` | 674 | `Product` | REAL / CATALOG | **KEEP (Không sửa)** | CỰC CAO |
| 8 | `product_images` | 23 | `ProductImage` | REAL / MEDIA | **KEEP (Không sửa)** | CAO |
| 9 | `banners` | 9 | `Banner` | REAL / CMS | **KEEP (Không sửa)** | TRUNG BÌNH |
| 10 | `posts` | 8 | `Post` | REAL / CMS | **KEEP (Không sửa)** | TRUNG BÌNH |
| 11 | `coupons` | 5 | `Coupon` | REAL / COMMERCE | **KEEP (Không sửa)** | CAO |
| 12 | `flash_sales` | 1 | `FlashSale` | REAL / COMMERCE | **KEEP (Không sửa)** | CAO |
| 13 | `flash_sale_items` | 1 | `FlashSaleItem` | REAL / COMMERCE | **KEEP (Không sửa)** | CAO |
| 14 | `orders` | 2 | `Order` | REAL / COMMERCE | **KEEP (Không sửa)** | CỰC CAO |
| 15 | `order_items` | 2 | `OrderItem` | REAL / COMMERCE | **KEEP (Không sửa)** | CỰC CAO |
| 16 | `notifications` | 2 | `Notification` | REAL / USER DATA | **KEEP (Không sửa)** | THẤP |
| 17 | `wishlists` | 1 | `Wishlist` | REAL / USER DATA | **KEEP (Không sửa)** | THẤP |
| 18 | `audit_logs` | 2 | `AuditLog` | REAL / AUDIT TRAIL | **KEEP (Không sửa)** | TRUNG BÌNH |
| 19 | `carts` | 7 | `Cart` | 1 REAL / 6 TEST GUEST SESSIONS | **SELECTIVE DELETE (6 bản ghi rác)** | THẤP |
| 20 | `cart_items` | 2 | `CartItem` | REAL (thuộc Cart id 1) | **KEEP (Không sửa)** | TRUNG BÌNH |
| 21 | `ai_assistant_logs` | 10 | `AiAssistantLog` | TEST / TELEMETRY LOGS | **SELECTIVE DELETE (10 bản ghi test)** | THẤP |
| 22 | `reviews` | 0 | `Review` | *Bảng rỗng* | **NO ACTION** | THẤP |
| 23 | `inventory_logs` | 0 | `InventoryLog` | *Bảng rỗng* | **NO ACTION** | THẤP |
| 24 | `product_ai_chat_histories` | 0 | `ProductAiChatHistory` | *Bảng rỗng* | **NO ACTION** | THẤP |
| 25 | `return_requests` | 0 | `ReturnRequest` | *Bảng rỗng* | **NO ACTION** | THẤP |
| 26 | `return_items` | 0 | `ReturnItem` | *Bảng rỗng* | **NO ACTION** | THẤP |
| 27 | `return_audit_logs` | 0 | `ReturnAuditLog` | *Bảng rỗng* | **NO ACTION** | THẤP |

---

## 3. DANH SÁCH BẢN GHI ĐỀ XUẤT XÓA CHI TIẾT (RECORD-LEVEL DELETION CANDIDATES)

Chỉ có **duy nhất 2 bảng** có chứa dữ liệu phát sinh từ quá trình kiểm thử tự động (UI test sessions):

### Danh mục A: Bảng `carts` — 6 Giỏ hàng khách vãng lai rỗng (Empty Guest Carts)

| Record ID | `userId` | `guestSessionId` | Số items | Bằng chứng nhận dạng | Tác động khi xóa |
| :-: | :-: | :--- | :-: | :--- | :--- |
| **147** | `NULL` | `guest_tm9ocpguzvmwn3f1q5` | 0 | Tạo tự động trong browser test M6.1 | Hoàn toàn vô hại |
| **148** | `NULL` | `guest_v89lqpo812nnz92j31` | 0 | Tạo tự động trong browser test M6.1 | Hoàn toàn vô hại |
| **149** | `NULL` | `guest_x01pkqz119aam83x44` | 0 | Tạo tự động trong browser test M6.1 | Hoàn toàn vô hại |
| **150** | `NULL` | `guest_b45oprm99211z88k12` | 0 | Tạo tự động trong browser test M6.2 | Hoàn toàn vô hại |
| **151** | `NULL` | `guest_k77azpq00199m77x89` | 0 | Tạo tự động trong browser test M6.2 | Hoàn toàn vô hại |
| **152** | `NULL` | `guest_q88mzp110238k44v71` | 0 | Tạo tự động trong browser test M6.2 | Hoàn toàn vô hại |

*Ghi chú: Giỏ hàng `id: 1` của Khách hàng `userId: 3` chứa 2 sản phẩm hợp lệ ĐƯỢC GIỮ NGUYÊN 100%.*

### Danh mục B: Bảng `ai_assistant_logs` — 10 Nhật ký khảo sát thử nghiệm

| Record ID | `systemType` | `prompt` tóm tắt | `userId` | Bằng chứng nhận dạng | Tác động khi xóa |
| :-: | :--- | :--- | :-: | :--- | :--- |
| **1 đến 10** | `5_STEP_SURVEY` | `{"persona":"gaming","budgetRange":"15m-25m"}` | `NULL` | Chạy lặp lại trong các ca test chức năng AI Assistant | Giải phóng telemetry rác, không ảnh hưởng nghiệp vụ |

---

## 4. MA TRẬN KHÓA NGOẠI & THỨ TỰ XÓA AN TOÀN (DEPENDENCY GRAPH & DELETION ORDER)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THỨ TỰ THỰC THI DỌN DẸP                         │
├────────────────────────────────────────────────────────────────────────┤
│ Bước 1: Sao lưu toàn diện cơ sở dữ liệu (mysqldump có gắn timestamp)  │
│ Bước 2: Kiểm tra tính toàn vẹn và dung lượng file backup (> 0 bytes)   │
│ Bước 3: Xóa các bản ghi rác trong bảng ai_assistant_logs (ID 1 đến 10) │
│ Bước 4: Xóa các bản ghi rác trong bảng carts (ID 147 đến 152)          │
│ Bước 5: Xác nhận lại toàn bộ 674 sản phẩm, đơn hàng và user còn nguyên │
└────────────────────────────────────────────────────────────────────────┘
```

### Rủi ro khóa ngoại (Foreign Key Analysis):
- Bảng `ai_assistant_logs` là bảng độc lập, không có bảng con nào tham chiếu đến nó. -> **RỦI RO: 0%**.
- Bảng `carts` có bảng con là `cart_items` (`fields: [cartId], references: [id], onDelete: Cascade`). Tuy nhiên, cả 6 giỏ hàng khách vãng lai này đều có **0 items**, do đó không gây cascade ngoài ý muốn. -> **RỦI RO: 0%**.

---

## 5. DỰ THẢO CÂU LỆNH SQL THỰC THI (DRAFT SQL FOR FUTURE APPROVAL)

*(Các câu lệnh dưới đây CHỈ LÀ DỰ THẢO THAM KHẢO, TUYỆT ĐỐI CHƯA ĐƯỢC CHẠY trong phiên này)*:

```sql
-- DỰ THẢO CÂU LỆNH DỌN DẸP (CHỈ THỰC THI KHI CÓ PHÊ DUYỆT CỦA CHỦ DỰ ÁN)

-- 1. Xóa 10 bản ghi khảo sát AI thử nghiệm
DELETE FROM `ai_assistant_logs` WHERE `id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10) AND `user_id` IS NULL;

-- 2. Xóa 6 giỏ hàng khách vãng lai rỗng (không có user và không có items)
DELETE FROM `carts` WHERE `id` IN (147, 148, 149, 150, 151, 152) AND `user_id` IS NULL;

-- 3. Kiểm tra kiểm chứng sau khi xóa (Verification queries)
SELECT COUNT(*) AS remaining_ai_logs FROM `ai_assistant_logs`;
SELECT COUNT(*) AS remaining_carts FROM `carts`;
SELECT COUNT(*) AS verified_products FROM `products`;
SELECT COUNT(*) AS verified_orders FROM `orders`;
SELECT COUNT(*) AS verified_users FROM `users`;
```

---

## 6. CHIẾN LƯỢC SAO LƯU VÀ KHÔI PHỤC (BACKUP & ROLLBACK STRATEGY)

Trước khi thực hiện bất kỳ lệnh DELETE nào trong tương lai, quy trình bắt buộc phải là:

1. **Lệnh tạo Backup:**
   ```bash
   mysqldump -h 127.0.0.1 -P 3306 -u nexora -p nexora > D:\Nexora\backups\nexora_pre_cleanup_20261123.sql
   ```
2. **Kiểm tra tính toàn vẹn:** File dump phải có dung lượng xấp xỉ ~2.5 MB, không rỗng và chứa đầy đủ cấu trúc 27 bảng.
3. **Rollback trong trường hợp khẩn cấp:**
   ```bash
   mysql -h 127.0.0.1 -P 3306 -u nexora -p nexora < D:\Nexora\backups\nexora_pre_cleanup_20261123.sql
   ```

---

## 7. ĐIỀU KIỆN DỪNG & CỔNG PHÊ DUYỆT (APPROVAL GATE)

> [!IMPORTANT]
> **ĐIỀU KIỆN DỪNG BẮT BUỘC (STOP CONDITION):**
> Agent đã dừng toàn bộ thao tác ghi/xóa cơ sở dữ liệu sau khi lập kế hoạch này. Bất kỳ thao tác xóa nào trên database MySQL đều phải có **lệnh phê duyệt riêng biệt bằng văn bản** từ Chủ dự án, nêu rõ:
> 1. Database đích: `127.0.0.1:3306/nexora`.
> 2. Danh sách IDs được phép xóa: Carts `147..152`, AI Logs `1..10`.
> 3. Xác nhận đã chuẩn bị vị trí lưu file backup.
