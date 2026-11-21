# THIẾT KẾ CƠ SỞ DỮ LIỆU MYSQL 8.4 & LƯỢC ĐỒ PRISMA ORM

**Tài liệu:** `03_DATABASE_PRISMA_MYSQL_SCHEMA.md`  
**Dự án:** Nexora

---

## 1. Tổng Quan Lược Đồ Dữ Liệu 24 Bảng Chuẩn Hóa 3NF

Cơ sở dữ liệu Nexora bao gồm 24 bảng dữ liệu, thiết kế chuẩn hóa bậc 3 (3NF), ngăn chặn dư thừa dữ liệu và đảm bảo tính toàn vẹn:

1. `User`: Quản lý danh tính người dùng, mật khẩu băm Argon2, vai trò (`Role`: CUSTOMER, STAFF, ADMIN), trạng thái khóa tài khoản.
2. `PasswordResetToken`: Lưu trữ token đặt lại mật khẩu ngẫu nhiên, thời hạn hết hạn 15 phút, cờ `usedAt` nguyên tử.
3. `Category`: Phân loại 16 ngành hàng phần cứng và thiết bị công nghệ.
4. `Brand`: Danh mục 26 thương hiệu đối tác phần cứng hàng đầu.
5. `Product`: Thông tin 650+ sản phẩm, giá bán, giá khuyến mãi, giá vốn (COGS), số lượng tồn kho thực tế, bảo hành.
6. `ProductSpecification`: Lưu trữ thông số kỹ thuật chi tiết theo cặp key-value (Socket CPU, Bus RAM, Chuẩn form factor...).
7. `ProductImage`: Thư viện ảnh chi tiết của sản phẩm.
8. `Banner`: 5 concept banner độc quyền thương hiệu Nexora (Hero & Sidebar).
9. `Cart`: Giỏ hàng người dùng.
10. `CartItem`: Chi tiết từng mặt hàng và số lượng trong giỏ hàng.
11. `Order`: Đơn hàng bán lẻ, mã đơn `TP-...`, tổng tiền, chiết khấu, trạng thái đơn (`PENDING`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`).
12. `OrderItem`: Bản ghi snapshot từng sản phẩm trong đơn hàng (giá bán, giá vốn, số lượng, chiết khấu tại thời điểm mua).
13. `Payment`: Bản ghi giao dịch thanh toán (COD hoặc VNPay), mã giao dịch cổng thanh toán, trạng thái thanh toán.
14. `Coupon`: Quản lý mã giảm giá, giới hạn ngân sách, số lượt sử dụng và điều kiện đơn hàng tối thiểu.
15. `FlashSale`: Chiến dịch giảm giá sốc có giới hạn khung giờ (Start Time - End Time).
16. `FlashSaleProduct`: Liên kết sản phẩm tham gia Flash Sale, giá ưu đãi sốc và số lượng quota phân bổ.
17. `Wishlist`: Danh sách sản phẩm yêu thích của khách hàng có phân quyền cô lập dữ liệu.
18. `Review`: Đánh giá xếp hạng sao và bình luận của khách hàng đã mua sản phẩm.
19. `Article`: Bài viết tin tức công nghệ, thủ thuật và hướng dẫn build PC.
20. `StoreLocation`: Hệ thống địa chỉ showroom và trung tâm bảo hành toàn quốc.
21. `AuditLog`: Nhật ký theo dõi toàn bộ thao tác nhạy cảm của quản trị viên và nhân viên.
22. `InventoryLog`: Nhật ký nhập kho và xuất kho linh kiện theo thời gian thực.
23. `SupportTicket`: Phiếu yêu cầu bảo hành và hỗ trợ kỹ thuật khách hàng.
24. `SystemSetting`: Cấu hình thông số vận hành toàn hệ thống.
