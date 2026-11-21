# KIẾN TRÚC FRONTEND REACTJS, VITE & HỆ THỐNG GIAO DIỆN

**Tài liệu:** `04_FRONTEND_REACT_VITE_TAILWIND.md`  
**Dự án:** Nexora

---

## 1. Cấu Trúc Mã Nguồn Frontend `apps/web`

Frontend của Nexora được xây dựng hoàn toàn bằng **React 18** và bundler siêu tốc **Vite 8**:

- `src/features/storefront/`: Các khối giao diện trang chủ, Hero Banner Carousel, Danh mục ngành hàng, Flash Sale đếm ngược, Đối tác chiến lược 26 logo SVG và Chân trang chuẩn mực 11 link.
- `src/features/catalog/`: Trang danh sách sản phẩm, bộ lọc linh kiện động đa tiêu chí, sắp xếp theo giá và độ phổ biến.
- `src/features/product/`: Trang chi tiết sản phẩm, thư viện ảnh gallery, bảng thông số kỹ thuật động, đánh giá khách hàng.
- `src/features/cart/`: Drawer giỏ hàng trượt và trang giỏ hàng chi tiết.
- `src/features/checkout/`: Giao diện đặt hàng 2 bước, chọn phương thức COD hoặc VNPay, áp dụng mã voucher tức thì.
- `src/features/admin/`: Cổng quản trị toàn năng 10 phân hệ với bố cục full-width edge-to-edge và Dark Mode độc quyền.
- `src/features/info/`: Các trang thông tin thương hiệu và dịch vụ khách hàng (`/about`, `/careers`, `/contact`, `/stores`, `/privacy`, `/guide`, `/returns`, `/warranty`, `/support`).
- `src/features/compare/`: Công cụ so sánh thông số kỹ thuật 2 linh kiện cùng phân khúc kèm thuật toán chấm điểm Persona.
- `src/features/build-pc/`: Công cụ tự cấu hình dàn máy tính (PC Builder) kiểm tra độ tương thích giữa Mainboard, CPU, RAM và Nguồn.
