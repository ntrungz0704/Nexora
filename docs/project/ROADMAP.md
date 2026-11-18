# Lộ trình Phát triển Dự án Nexora (Project Roadmap)

- **Trạng thái:** `Phê duyệt chính thức (Approved)`
- **Cập nhật lần cuối:** `2026-11-19`
- **Mô hình nghiệp vụ:** `Single-Vendor E-Commerce` (Cửa hàng đơn lẻ; vai trò: `CUSTOMER`, `STAFF`, `ADMIN`)

---

## 1. Lộ trình 13 Giai đoạn (Standardized 13-Phase Roadmap)

| Giai đoạn    | Tên Phase chính thức                  | Phạm vi thực hiện                                                                                                                                                      | Trạng thái    |
| :----------- | :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| **Phase 0**  | **Discovery & Safe Migration**        | Khảo sát 13 báo cáo audit TechPilot, bảo vệ source cũ, kiểm kê tài nguyên tái sử dụng, thiết lập ma trận chuyển đổi.                                                   | `COMPLETED`   |
| **Phase 1**  | **Product Requirements & Governance** | Xây dựng Project Charter, Project Scope, 10 bộ quy chuẩn kỹ thuật, quy tắc AI Agent, tiêu chí Definition of Done.                                                      | `COMPLETED`   |
| **Phase 2**  | **Architecture & Database Design**    | Thiết kế Modular Monolith, phân chia ranh giới module, thiết kế ERD, Data Dictionary, ADR-0001, ADR-0002.                                                              | `COMPLETED`   |
| **Phase 3**  | **Foundation & DevOps**               | Monorepo (React 19, Express, MySQL 8.4, Prisma), Docker, CI/CD, repository GitHub Public, 6 nhánh chính thức, chuẩn hóa role `STAFF`, kiểm thử tự động Playwright E2E. | `COMPLETED`   |
| **Phase 4**  | **Identity & RBAC**                   | Đăng ký, đăng nhập, phân quyền 3 vai trò `ADMIN`, `STAFF`, `CUSTOMER`, hồ sơ cá nhân, sổ địa chỉ, token bảo mật Argon2id/bcrypt.                                       | `IN PROGRESS` |
| **Phase 5**  | **Catalog & Product**                 | Danh mục, thương hiệu, sản phẩm, biến thể SKU, thông số kỹ thuật phần cứng, quản lý hình ảnh, tìm kiếm và bộ lọc đa tiêu chí.                                          | `PLANNED`     |
| **Phase 6**  | **Commerce**                          | Danh sách yêu thích (Wishlist), giỏ hàng, mã giảm giá (Coupons), quy trình đặt hàng (Checkout), luồng mua lại (Reorder) an toàn.                                       | `PLANNED`     |
| **Phase 7**  | **Payment**                           | Tích hợp cổng thanh toán trực tuyến VNPay Sandbox, kiểm tra chữ ký HMAC-SHA512, xác thực IPN với Idempotency, đối soát giao dịch.                                      | `PLANNED`     |
| **Phase 8**  | **Inventory & Procurement**           | Quản lý kho, sổ cái xuất nhập tồn, nhà cung cấp, đơn đặt hàng mua (PO), phiếu nhập kho (Goods Receipt), lịch sử giá vốn.                                               | `PLANNED`     |
| **Phase 9**  | **Customer Service**                  | Đánh giá sản phẩm đã mua, quy trình yêu cầu đổi trả bảo hành (RMA), gửi email thông báo giao dịch tự động.                                                             | `PLANNED`     |
| **Phase 10** | **Staff & Admin Operations**          | Bảng điều khiển Staff, Admin Dashboard, phân quyền chi tiết cho nhân viên, quản lý tài khoản người dùng, nhật ký kiểm toán.                                            | `PLANNED`     |
| **Phase 11** | **SellerMargin & Analytics**          | Tính toán và báo cáo doanh thu thuần (Net Sales), giá vốn (COGS), chi phí vận hành (Opex), lợi nhuận gộp/ròng theo sản phẩm, SKU và kỳ.                                | `PLANNED`     |
| **Phase 12** | **Full QA & Production Readiness**    | Bộ kiểm thử tự động toàn diện (Unit, Integration, E2E), rà soát an ninh mạng, đóng gói Docker hoàn chỉnh, nghiệm thu bảo vệ đồ án tốt nghiệp.                          | `PLANNED`     |
