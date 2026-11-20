# UPDATED BUSINESS LOGIC & TRACEABILITY AUDIT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Chuẩn kiểm toán:** End-to-End Business Rule Traceability
- **Ngày cập nhật kiểm toán:** 20/11/2026
- **Trạng thái:** **VERIFIED PASS (100% QUY TẮC NGHIỆP VỤ THỰC THI NHẤT QUÁN)**

---

## 1. TRUY VẾT NGHIỆP VỤ XUYÊN SUỐT CÁC TẦNG KIẾN TRÚC

Toàn bộ các quy tắc nghiệp vụ quan trọng đều được kiểm tra theo chuỗi hành trình:
`Frontend Component -> API Route -> Controller -> Business Service -> Prisma ORM -> MySQL 8.4 Engine`

```
┌─────────────────┐      ┌───────────────┐      ┌─────────────────┐      ┌─────────────┐
│  React 19 View  │ ───> │ REST API /v1  │ ───> │ Service Logic   │ ───> │ MySQL 8.4   │
│  (UI & Form)    │      │ (Zod Validate)│      │ ($transaction)  │      │ (Decimal18) │
└─────────────────┘      └───────────────┘      └─────────────────┘      └─────────────┘
```

---

## 2. KẾT QUẢ ĐỐI CHIẾU CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI

### 2.1. Quy Tắc Snapshot Tài Chính (Financial Price & COGS Snapshot)
- **Mã nguồn:** [`apps/api/src/modules/order/order.service.ts`](file:///d:/Nexora/apps/api/src/modules/order/order.service.ts)
- **Thực thi:** Khi người dùng đặt hàng qua `POST /api/v1/orders`, `unit_price`, `cogs_amount`, `discount_amount` và `subtotal` được tính toán dựa trên dữ liệu sản phẩm tại thời điểm giao dịch và lưu chết vào bảng `order_items`.
- **Kiểm chứng CSDL:** Dữ liệu trong bảng `order_items` độc lập hoàn toàn với giá của bảng `products`. Khi admin thay đổi giá sản phẩm sau này, lịch sử doanh thu và lợi nhuận của các đơn hàng cũ không bị biến động.

### 2.2. Kiểm Soát Tồn Kho & Chống Bán Âm Trong Transaction
- **Mã nguồn:** `order.service.ts`
- **Thực thi:**
  - Kiểm tra tồn kho trước khi tạo đơn: `if (product.stockQuantity < item.quantity) throw new AppError(400, 'INSUFFICIENT_STOCK', ...)`
  - Giảm tồn kho và ghi nhật ký vào `inventory_logs` với `changeType = 'SALE'` bên trong `prisma.$transaction`.
- **Bằng chứng kiểm thử:** Ca kiểm thử `CONCURRENCY-1: Order creation rejects request when quantity exceeds current stock` trong [`apps/api/tests/rbac_and_concurrency.test.ts`](file:///d:/Nexora/apps/api/tests/rbac_and_concurrency.test.ts) xác nhận khi số lượng đặt mua vượt quá tồn kho, hệ thống lập tức từ chối và rollback toàn bộ giao dịch, đảm bảo số lượng tồn kho không bao giờ bị âm.

### 2.3. Quy Tắc Tính Mã Giảm Giá (Coupon Calculation)
- **Mã nguồn:** [`apps/api/src/modules/coupon/coupon.service.ts`](file:///d:/Nexora/apps/api/src/modules/coupon/coupon.service.ts)
- **Thực thi:**
  - Hỗ trợ cả 2 phương thức `FIXED_AMOUNT` và `PERCENTAGE`.
  - Áp dụng trần giảm tối đa `maxDiscount` đối với mã giảm theo phần trăm.
  - Kiểm tra giá trị đơn hàng tối thiểu `minOrderValue` và thời hạn áp dụng.
- **Bằng chứng kiểm thử:** Ca kiểm thử `POST /api/v1/marketing/coupons/validate verifies coupon discount` xác nhận mã giảm 100.000đ được áp dụng chính xác trên đơn hàng 1.000.000đ, tính ra tổng thanh toán là 900.000đ.

### 2.4. Phân Quyền & Cô Lập Dữ Liệu Khách Hàng (Customer Isolation)
- **Thực thi:** Mỗi khách hàng chỉ có thể truy vấn danh sách yêu thích (`wishlists`) và đơn hàng (`orders`) của chính mình.
- **Bằng chứng kiểm thử:** Ca kiểm thử `Verifies strict Customer Isolation in Wishlist (Customer A cannot see Customer B)` xác nhận Customer A không thể thấy danh sách yêu thích của Customer B.

---

## 3. KIỂM TOÁN VẬN HÀNH 4 HỆ THỐNG AI

| Hệ thống AI | Cơ chế hoạt động | Kết quả kiểm chứng |
| :--- | :--- | :---: |
| **1. Khảo Sát AI Gợi Ý Tối Ưu** | Khảo sát 5 câu hỏi nhanh, chấm điểm 100 điểm theo nhu cầu | **PASS** (Đề xuất chính xác 3 sản phẩm tối ưu trong kho) |
| **2. So Sánh Sản Phẩm Persona** | Đánh giá so sánh 2-4 sản phẩm theo 4 nhóm khách hàng | **PASS** (Gamer, Sinh viên, Văn phòng, Đồ họa) |
| **3. Xây Dựng Cấu Hình PC** | Kiểm tra tương thích Socket CPU - Mainboard, công suất PSU | **PASS** (Cảnh báo tương thích và tính tổng công suất TDP) |
| **4. Trợ Lý AI Chatbot** | Trả lời câu hỏi kỹ thuật phần cứng, kết hợp tri thức cửa hàng | **PASS** (Hỗ trợ popup chat mọi trang) |

---

## 4. KẾT LUẬN KIỂM TOÁN NGHIỆP VỤ

Mọi quy tắc nghiệp vụ cốt lõi của một hệ thống bán lẻ công nghệ cao cấp (Single-Vendor Hardware Store) đều được triển khai nhất quán và chuẩn xác từ giao diện khách hàng đến cơ sở dữ liệu MySQL 8.4.
