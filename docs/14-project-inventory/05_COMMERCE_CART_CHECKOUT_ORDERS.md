# NGHIỆP VỤ THƯƠNG MẠI: GIỎ HÀNG, THANH TOÁN VÀ QUẢN LÝ ĐƠN HÀNG

**Tài liệu:** `05_COMMERCE_CART_CHECKOUT_ORDERS.md`  
**Dự án:** Nexora

---

## 1. Cơ Chế Xử Lý Giỏ Hàng (Cart Lifecycle)

- Hỗ trợ giỏ hàng khách vãng lai lưu trữ tạm thời qua session token và tự động hợp nhất (merge) vào tài khoản khách hàng ngay khi đăng nhập.
- Kiểm tra tính khả dụng của số lượng tồn kho theo thời gian thực: Nếu sản phẩm còn ít hơn số lượng khách yêu cầu, hệ thống sẽ tự động thông báo và điều chỉnh số lượng tối đa có thể mua.

---

## 2. Quy Trình Thanh Toán & Đặt Hàng Nguyên Tử (Atomic Checkout Flow)

1. **Khóa tồn kho (Inventory Lock):** Khi khách bấm "Đặt Hàng", backend mở một Database Transaction với lệnh `SELECT ... FOR UPDATE` trên các bản ghi `Product` liên quan.
2. **Kiểm tra tồn kho nghiêm ngặt:** Nếu `stockQuantity < requestedQuantity`, transaction lập tức rollback và trả về mã lỗi `OUT_OF_STOCK`. Cơ chế này loại bỏ hoàn toàn khả năng bán âm (Negative Stock) khi có hàng trăm request đồng thời.
3. **Snapshot dữ liệu đơn hàng:** Tạo bản ghi `Order` và `OrderItem` lưu lại chính xác giá gốc, giá bán, chiết khấu và giá vốn sản phẩm tại thời điểm mua.
4. **Trừ kho tự động:** `stockQuantity` được trừ chính xác theo số lượng đặt mua ngay trong transaction.
5. **Cập nhật mã giảm giá:** Tăng số lượt sử dụng của `Coupon` và kiểm tra điều kiện ngân sách.
