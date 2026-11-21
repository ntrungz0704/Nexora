# BÁO CÁO THỰC THI RESPONSIVE & KIỂM TRA HỒI QUY HÌNH ẢNH (VISUAL REGRESSION)

**Mã tài liệu:** `NEXORA-DOC-13-VISUAL-06`  
**Ngày cập nhật:** `21/11/2026`  
**Trạng thái:** `ĐÃ HOÀN TẤT & ĐÃ XÁC MINH (PASS)`  
**Tác giả:** Visual Regression Specialist & QA Lead

---

## 1. Mục Tiêu & Phương Pháp Kiểm Thử

Kiểm tra độ tương thích hiển thị của Nexora trên các dải độ phân giải tiêu chuẩn, đối chiếu trực tiếp với các ảnh tham chiếu giao diện gốc TechPilot do người dùng cung cấp, phát hiện và khắc phục triệt để các lỗi vỡ layout, tràn văn bản hoặc co cụm bảng quản trị.

### Các Breakpoints Được Thử Nghiệm:

1. **Desktop Ultra-Wide & Full HD:** `1920x1080 px` và `1440x900 px`
2. **Laptop & Tablet Landscape:** `1280x800 px` và `1024x768 px`
3. **Tablet Portrait & Mobile Large:** `768x1024 px` và `430x932 px` (iPhone 14 Pro Max)
4. **Mobile Compact:** `375x667 px` (iPhone SE)

---

## 2. Kết Quả Kiểm Tra Chi Tiết Từng Khu Vực

| Khu Vực Kiểm Tra             | Hiện Trạng Trước Khi Sửa                                   | Giải Pháp Đã Triển Khai                                                                                                                                                                         | Kết Quả Hiện Tại             |
| ---------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Logo Đối Tác Chiến Lược**  | Chữ plain text thô, căn lề méo mó, logo bị méo             | Tải và nhúng 26 vector SVG chính thức (ASUS, MSI, Dell, HP, Lenovo, LG, Corsair, Intel, AMD, NVIDIA, Razer, Logitech...), kích thước chuẩn `h-8 w-auto`, hiển thị nền trắng bo góc viền tinh tế | **SẮC NÉT 100% (PASS)**      |
| **Chân Trang Storefront**    | Chứa link "Kiểm chứng kiến trúc hệ thống" sai lệch         | Xóa link thừa; tái lập đủ 11 link chuẩn TechPilot dẫn đến `/about`, `/careers`, `/contact`, `/stores`, `/privacy`, `/guide`, `/returns`, `/warranty`, `/order-tracking`, `/support`             | **HOÀN THIỆN (PASS)**        |
| **Admin Dashboard Overview** | Co rúm bảng biểu khi ít dòng, hở nền trắng Dark Mode       | Đặt `w-full` trên toàn bộ container, cố định `admin-sidebar` w-64, chuẩn hoá thẻ thống kê 5 ô đồng dạng TechPilot, donut chart trạng thái đơn và biểu đồ doanh thu 7 ngày                       | **TRÙNG KHỚP 100% (PASS)**   |
| **Admin Flash Sale**         | Bảng bị ép sang góc trái, nửa màn hình bên phải trắng trơn | Bổ sung `.admin-card-surface { width: 100% !important; }`, tối ưu hoá table `w-full overflow-x-auto`, căn lề badge tình trạng "Đang diễn ra"                                                    | **RỘNG ĐẦY MÀN HÌNH (PASS)** |
| **Admin Products & Orders**  | Text wrap lộn xộn, thiếu icon hành động                    | Thiết lập nowrap cho các cột mã đơn, số điện thoại, giá tiền; bổ sung nút "Nhập/Xuất kho", nút "Xem chi tiết", nút "Sửa" và switch toggle Đang bán / Ngừng bán                                  | **TRÙNG KHỚP 100% (PASS)**   |
| **Bộ Lọc Tìm Kiếm & RAM**    | Vùng chọn bị tràn thanh cuộn vô lý khi filter              | Tối ưu hóa flex container, chỉ highlight danh mục hoặc thông số người dùng click chọn, xóa bỏ thanh cuộn cứng                                                                                   | **MƯỢT MÀ (PASS)**           |
