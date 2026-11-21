# BÁO CÁO TRIỂN KHAI CÁC TRANG THÔNG TIN THƯƠNG HIỆU VÀ HỖ TRỢ KHÁCH HÀNG

**Mã tài liệu:** `NEXORA-DOC-13-INFO-02`  
**Ngày cập nhật:** `21/11/2026`  
**Trạng thái:** `ĐÃ HOÀN TẤT & ĐÃ XÁC MINH (PASS)`  
**Tác giả:** Full-Stack Architect & Frontend Lead

---

## 1. Bối Cảnh & Mục Tiêu

Nhằm bảo toàn 100% trải nghiệm và cấu trúc liên kết chân trang của sản phẩm TechPilot gốc, đồng thời loại bỏ mọi đường link hỏng (404 Not Found), Nexora đã triển khai đầy đủ 2 nhóm trang chuyên biệt:

- **Nhóm A: Về Nexora (Giới thiệu, Tuyển dụng, Liên hệ, Hệ thống Showroom, Chính sách bảo mật)**
- **Nhóm B: Hỗ trợ khách hàng (Hướng dẫn mua hàng, Chính sách đổi trả, Chính sách bảo hành, Tra cứu đơn hàng, Hỗ trợ kỹ thuật)**

Toàn bộ các trang đều kế thừa hệ thống Header & Footer chung (`StorefrontHeader`, `StorefrontFooter`), đồng bộ giỏ hàng, danh sách yêu thích và hỗ trợ cả Light Mode lẫn Dark Mode.

---

## 2. Danh Mục Các Trang & Route Hoàn Chỉnh

| STT | Tên Trang                           | URL Route         | File Nguồn Component                                  | Chức Năng Chính & Dữ Liệu                                                                                                                                            |
| --- | ----------------------------------- | ----------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Giới thiệu thương hiệu**          | `/about`          | `apps/web/src/features/info/AboutPage.tsx`            | Lịch sử hình thành, triết lý kinh doanh "Technology for a Better Tomorrow", số liệu thống kê (100% chính hãng, 50.000+ khách hàng, 63 tỉnh thành).                   |
| 2   | **Tuyển dụng & Cơ hội nghề nghiệp** | `/careers`        | `apps/web/src/features/info/CareersPage.tsx`          | Môi trường làm việc, chế độ đãi ngộ, danh sách 4 vị trí tuyển dụng thực tế (Kỹ thuật viên PC, Chuyên viên tư vấn, Dev Fullstack, Kế toán), form ứng tuyển tương tác. |
| 3   | **Liên hệ & Góp ý**                 | `/contact`        | `apps/web/src/features/info/ContactPage.tsx`          | Kênh liên hệ đa phương tiện (Hotline 1900 8888, Email contact@nexora.local, Zalo), bản đồ chỉ dẫn, form gửi tin nhắn phản hồi trực tiếp.                             |
| 4   | **Hệ thống Showroom**               | `/stores`         | `apps/web/src/features/info/StoresPage.tsx`           | Danh sách 5 showroom tiêu biểu tại Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Hải Phòng với giờ mở cửa và hotline riêng.                                                      |
| 5   | **Chính sách bảo mật**              | `/privacy`        | `apps/web/src/features/info/PolicyPage.tsx`           | Cam kết bảo mật thông tin chuẩn mực theo quy định pháp luật thương mại điện tử, chính sách lưu trữ cookie và bảo vệ thanh toán.                                      |
| 6   | **Hướng dẫn mua hàng**              | `/guide`          | `apps/web/src/features/info/GuidePage.tsx`            | 5 bước đặt hàng trực tuyến trực quan, hình thức thanh toán (COD, VNPay), thời gian giao hàng và chính sách đồng kiểm.                                                |
| 7   | **Chính sách đổi trả**              | `/returns`        | `apps/web/src/features/info/PolicyPage.tsx`           | Quy định đổi trả 1 đổi 1 trong 30 ngày đối với lỗi từ nhà sản xuất, hoàn tiền 100% khi sản phẩm giao không đúng mô tả.                                               |
| 8   | **Chính sách bảo hành**             | `/warranty`       | `apps/web/src/features/info/PolicyPage.tsx`           | Tra cứu bảo hành linh kiện (CPU/VGA 36 tháng, RAM/SSD 36-60 tháng, Màn hình 24-36 tháng), quy trình tiếp nhận và thời gian xử lý 3-7 ngày.                           |
| 9   | **Tra cứu đơn hàng**                | `/order-tracking` | `apps/web/src/features/orders/OrderTrackingPage.tsx`  | Tra cứu đơn hàng theo mã đơn `TP-...` và số điện thoại, theo dõi trạng thái vận chuyển thời gian thực.                                                               |
| 10  | **Hỗ trợ kỹ thuật & Tạo Ticket**    | `/support`        | `apps/web/src/features/info/TechnicalSupportPage.tsx` | Tiếp nhận sự cố phần cứng, lỗi Windows màn hình xanh, tư vấn nâng cấp linh kiện; tạo ticket hỗ trợ tự động cấp ID `SUP-XXXXXX`.                                      |

---

## 3. Loại Bỏ Hoàn Toàn Liên Kết Giả "Kiểm chứng kiến trúc hệ thống"

Theo phản ánh từ đợt nghiệm thu hình ảnh:

- Chân trang gốc `StorefrontFooter.tsx` từng chứa text link `<Link to="/foundation">Kiểm chứng kiến trúc hệ thống</Link>`.
- Liên kết này không thuộc hệ thống thương mại bán lẻ TechPilot gốc.
- **Biện pháp xử lý đã thực hiện:** Đã loại bỏ hoàn toàn thẻ `<Link>` này khỏi cột "HỖ TRỢ KHÁCH HÀNG" trong file `apps/web/src/features/storefront/StorefrontFooter.tsx`. Cột chân trang hiện tại hiển thị đúng 5 liên kết chuẩn mực: _Hướng dẫn mua hàng, Chính sách đổi trả, Chính sách bảo hành, Tra cứu đơn hàng, Hỗ trợ kỹ thuật_.

---

## 4. Tích Hợp Router & Kiểm Thử Tính Năng

- File `apps/web/src/routes/AppRoutes.tsx` đã đăng ký đầy đủ các route trên.
- Đã xác minh bằng TypeScript typecheck (`tsc --noEmit`), build bundle (`vite build`) và automated test: **PASS 100%**.
- Giỏ hàng và số lượng badge (`cart?.totalItems`) được liên kết chính xác, không phát sinh lỗi re-render hoặc undefined.
