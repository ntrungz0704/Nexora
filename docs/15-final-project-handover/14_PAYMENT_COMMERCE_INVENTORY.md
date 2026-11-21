# 14. Payment, Commerce & Inventory Integrity Audit

## 1. Giỏ hàng (Cart)

- **Dual Identity:** Hỗ trợ đồng thời Customer (JWT `userId`) và Guest (header `x-guest-session-id`).
- **Tính giá Server-Authoritative:** `CartService` luôn tính `subtotal` từ giá hiện hành (`salePrice || price`) trong MySQL, không tin giá gửi từ FE.
- **Gap:** Chưa có endpoint `POST /api/v1/cart/merge` gộp giỏ hàng khách vãng lai vào tài khoản khi đăng nhập.

## 2. Khuyến mãi & Mã giảm giá (Coupons & Flash Sale)

- **Coupons Active trong MySQL:** 6 mã (`NEXORA100`, `NEXORA999`, `NEXORA10`, `GIAM5PHANTRAM`, cộng 2 alias `TECHPILOT100`, `TECHPILOT999`).
- **UX Chọn nhanh Voucher:** `CartPage.tsx` và `CheckoutPage.tsx` tải danh sách mã khả dụng từ `GET /api/v1/marketing/coupons`, hiển thị nhãn điều kiện (`Chưa đủ điều kiện` nếu `subtotal < minOrderValue`) và thông báo lỗi inline màu đỏ dưới ô nhập mã.
- **Flash Sale:** Có 1 chiến dịch active với 5 `flash_sale_items`, nhưng `OrderService.createOrder` hiện chỉ lấy `product.salePrice || product.price` mà **chưa trừ `flashSaleItem.soldCount` / chưa giữ suất giới hạn `quantityLimit` của Flash Sale**.

## 3. Thanh toán (COD & VNPay)

- **COD:** Tạo đơn ở trạng thái `orderStatus = 'PENDING'`, `paymentStatus = 'PENDING'`. Khi Admin chuyển sang `DELIVERED`, hệ thống tự động đặt `paymentStatus = 'PAID'` và `paidAt = NOW()`.
- **VNPay 2.1.0 (`payment.service.ts`):**
  - `createVnpayPaymentUrl`: Lấy số tiền từ `order.totalAmount * 100`, xác thực quyền sở hữu (User ID hoặc Guest Email/Phone), ký HMAC-SHA512.
  - `verifyVnpayCallback`: Xác thực chữ ký, kiểm tra `receivedAmount === expectedAmount`, xử lý **Idempotent** nếu đơn đã `PAID`.
  - `simulatePaymentSuccess`: Vô hiệu hóa ở cả tầng Router lẫn Service khi `NODE_ENV === 'production'`.
  - **Hạn chế:** So sánh chữ ký dùng `===` thay vì `crypto.timingSafeEqual`; chưa có route VNPay IPN server-to-server riêng trả chuẩn `{ RspCode: "00", Message: "Confirm Success" }` theo spec VNPay production.

## 4. Tồn kho & Giao dịch nguyên tử (Atomic Inventory & Race Conditions)

- **Chống Overselling (VERIFIED BY CONCURRENCY TEST):** `OrderService.createOrder` sắp xếp sản phẩm theo `productId` tăng dần (ngăn MySQL deadlock) và thực thi `tx.product.updateMany({ where: { id, stockQuantity: { gte: qty } }, data: { stockQuantity: { decrement: qty } } })`. Kiểm chứng thực tế bởi test `CONCURRENCY-2` (2 request `Promise.all` tranh mua sản phẩm cuối cùng: chính xác 1 `201` và 1 `400`).
- **Nhật ký kho (`inventory_logs`):** Ghi đầy đủ `changeType` (`SALE`, `RETURN`, `IMPORT`, `EXPORT`, `ADJUSTMENT`), `quantity`, `balanceBefore`, `balanceAfter`, `referenceId` (`NX-...`) và `actorId`.
- **Các Edge Case cần xử lý trước Production:**
  1. **Chênh lệch ngưỡng miễn phí vận chuyển:** Topbar hiển thị _"Miễn phí cho đơn từ 300K"_ nhưng `OrderService` và `CartPage` tính miễn phí từ **500.000đ** (dưới 500k thu 30.000đ).
  2. **Thiếu Idempotency-Key cho `POST /orders`:** Double-click hoặc retry mạng có thể tạo 2 đơn trùng.
  3. **Race Condition nhẹ trên `Coupon.usageLimit` và `cancelOrder`:** Kiểm tra điều kiện hiện nằm ngoài `$transaction`.
  4. **COGS Snapshot cho SellerMargin tương lai:** `OrderItem` chưa lưu `unitCost` (giá vốn nhập kho tại thời điểm bán).
