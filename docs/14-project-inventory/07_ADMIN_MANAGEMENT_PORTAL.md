# CỔNG QUẢN TRỊ BÁN HÀNG NEXORA ADMIN PORTAL

**Tài liệu:** `07_ADMIN_MANAGEMENT_PORTAL.md`  
**Dự án:** Nexora

---

## 1. Kiến Trúc Giao Diện & Bố Cục Toàn Màn Hình

Giao diện Admin Portal (`AdminDashboardPage.tsx`) được thiết kế đồng nhất 100% với chuẩn thị giác TechPilot gốc:

- **Thanh điều hướng Sidebar trái (`w-64`):** Nền xanh đen sâu `#0A1128`, logo thương hiệu Nexora kết hợp badge `ADMIN`, 10 mục điều hướng với icon trực quan và nút "Đăng xuất" màu đỏ nổi bật ở chân trang.
- **Vùng nội dung chính (`flex-1 min-w-0`):** Kéo dài toàn bộ chiều rộng màn hình (`w-full`), tự động co giãn theo tỷ lệ hiển thị của màn hình từ laptop 13 inch đến màn hình đồ họa 4K.
- **Hỗ trợ Dark Mode chuẩn mực:** Nền trang `#0B132B`, nền thẻ bảng biểu `#131E3D`, chữ sáng tương phản cao `#F8FAFC`, loại bỏ hoàn toàn hiện tượng hở viền trắng.

---

## 2. Danh Sách 10 Phân Hệ Quản Trị Vận Hành

1. **Tổng quan (Dashboard):** 5 ô chỉ số KPI (Doanh thu, Mẫu sản phẩm, Tồn kho, Sắp hết hàng, Hết hàng), Biểu đồ doanh thu 7 ngày gần nhất, Biểu đồ tròn (Donut Chart) trạng thái đơn hàng và bảng đơn hàng mới nhất.
2. **Quản lý Sản phẩm:** Bảng dữ liệu sản phẩm, bộ lọc danh mục/thương hiệu, switch bật/tắt trạng thái Đang bán/Ngừng bán, chức năng Thêm sản phẩm mới và Lịch sử Nhập/Xuất kho.
3. **Quản lý Đơn hàng:** Tra cứu theo mã đơn/tên/số điện thoại, lọc trạng thái (`PENDING`, `COMPLETED`, `CANCELLED`), xem chi tiết đơn và cập nhật trạng thái giao hàng.
4. **Quản lý Khách hàng & Phân quyền:** Danh sách tài khoản, vai trò người dùng (Customer, Staff, Admin), tính năng khóa/mở khóa tài khoản bảo mật.
5. **Quản lý Danh mục:** Phân cấp ngành hàng, biểu tượng icon FontAwesome và thứ tự sắp xếp hiển thị.
6. **Quản lý Thương hiệu:** Logo thương hiệu và thông tin nhà phân phối chính hãng.
7. **Mã giảm giá (Coupons):** Tạo mã khuyến mãi, tỷ lệ giảm giá, ngày hết hạn và hạn mức đơn hàng.
8. **Flash Sale:** Tạo chiến dịch giảm giá theo khung giờ, gán sản phẩm khuyến mãi và số lượng quota bán ra.
9. **Bài viết (News & Articles):** Soạn thảo bài viết đánh giá công nghệ và hướng dẫn kỹ thuật.
10. **Banner:** Quản lý hiển thị các banner quảng cáo trên trang chủ storefront.
