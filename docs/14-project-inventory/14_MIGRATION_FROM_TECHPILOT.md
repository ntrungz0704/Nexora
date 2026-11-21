# LỊCH SỬ VÀ TIẾN TRÌNH DI CHUYỂN TỪ TECHPILOT SANG NEXORA

**Tài liệu:** `14_MIGRATION_FROM_TECHPILOT.md`  
**Dự án:** Nexora

---

## 1. Bối Cảnh Dự Án Tái Thiết

Nexora được khởi tạo nhằm thay thế toàn diện hệ thống mã nguồn cũ TechPilot (PHP thuần/MVC) bằng kiến trúc hiện đại, an toàn và có khả năng mở rộng cao mà vẫn giữ nguyên 100% bản sắc thương hiệu, giao diện người dùng và nghiệp vụ bán lẻ.

---

## 2. Các Mốc Di Chuyển Quan Trọng

1. **Giai đoạn 1 — Khảo sát & Đóng băng:** Kiểm toán hiện trạng TechPilot, trích xuất cấu trúc cơ sở dữ liệu, phân loại tài sản hình ảnh và tài liệu hóa 100% use cases.
2. **Giai đoạn 2 — Thiết kế kiến trúc mới:** Xây dựng mô hình Modular Monolith với Node.js, Express, React, TypeScript và MySQL 8.4 LTS.
3. **Giai đoạn 3 — Di chuyển cơ sở dữ liệu & Nghiệp vụ:** Chuyển đổi toàn bộ dữ liệu danh mục, sản phẩm và logic sang Prisma ORM, áp dụng kiểu tiền tệ `Decimal` và snapshot đơn hàng.
4. **Giai đoạn 4 — Tái tạo giao diện Visual Parity:** Khôi phục trọn vẹn diện mạo TechPilot, từ trang chủ, danh mục sản phẩm, bộ lọc linh kiện, công cụ so sánh, build PC cho đến bảng quản trị Admin.
5. **Giai đoạn 5 — Tăng cường an ninh & Khắc phục khiếm khuyết:** Loại bỏ mật khẩu plaintext, vá lỗi IDOR, xây dựng cơ chế token quên mật khẩu nguyên tử, tích hợp cổng thanh toán an toàn và loại bỏ các liên kết giả.
6. **Giai đoạn 6 — Hoàn tất sản phẩm & Bàn giao:** Bổ sung hệ thống 5 concept banner độc quyền, 26 logo đối tác chuẩn vector, 10 trang thông tin hỗ trợ và chuẩn hóa toàn bộ hệ thống tài liệu.
