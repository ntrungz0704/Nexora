# DATABASE_MIGRATION_MAPPING.md — Bản Đồ Ánh Xạ Cơ Sở Dữ Liệu

Tài liệu này ghi lại chi tiết quá trình chuyển đổi toàn bộ lược đồ cơ sở dữ liệu từ TechPilot cũ (MySQL không ràng buộc chặt chẽ) sang Nexora (MySQL 8.4 LTS + Prisma ORM + Khóa ngoại toàn vẹn + Ràng buộc tiền tệ DECIMAL).

---

## 1. Bảng Ánh Xạ Thực Thể (Entity Mapping)

| Bảng TechPilot Cũ      | Mô hình Prisma Mới (`prisma/schema.prisma`) | Cải tiến kỹ thuật & Bảo mật                                                                                                                                                                     |
| :--------------------- | :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                | `User`                                      | - Mật khẩu chuyển sang Argon2id.<br>- Enum Role chuyển từ `CUSTOMER/SELLER/ADMIN` sang chuẩn Single-Vendor: `CUSTOMER`, `STAFF`, `ADMIN`.<br>- Tách số điện thoại và email thành Unique Index.  |
| `categories`           | `Category`                                  | - Hỗ trợ cây phân cấp cha-con (`parentId` tham chiếu `Category.id`).<br>- Slug duy nhất cho SEO thân thiện.                                                                                     |
| `products`             | `Product`                                   | - Đổi kiểu dữ liệu tiền tệ từ `FLOAT/DOUBLE` sang `DECIMAL(14,2)` bắt buộc.<br>- Lưu thông số kỹ thuật dạng cấu trúc `specs Json` linh hoạt cho phần cứng.<br>- Cờ `isPublished`, `isFeatured`. |
| `product_variants`     | `ProductVariant`                            | - Quản lý SKU, biến thể cấu hình (RAM, SSD, Màu sắc), giá biến thể và số lượng tồn kho theo SKU.                                                                                                |
| `orders`               | `Order`                                     | - Mã đơn hàng UUID/Nanoid chuẩn format `NEX-YYYYMMDD-XXXX`.<br>- ACID Transaction đảm bảo thanh toán và trừ kho nguyên tử.                                                                      |
| `order_items`          | `OrderItem`                                 | - **Bắt buộc Snapshot giá:** Lưu lại `unitPrice`, `salePrice`, `cogsPrice` tại thời điểm đặt hàng, không tính lợi nhuận hồi tố từ giá hiện tại.                                                 |
| `carts` & `cart_items` | `Cart` & `CartItem`                         | - Hỗ trợ giỏ hàng cả Guest (Session token) và Khách hàng đã đăng nhập.                                                                                                                          |
| `banners`              | `Banner`                                    | - Quản lý banner Hero Carousel và Banner quảng cáo theo thứ tự `sortOrder` và vị trí `position`.                                                                                                |
| `posts`                | `Post`                                      | - Bài viết tin công nghệ, cẩm nang build PC chuẩn SEO.                                                                                                                                          |
| `audit_logs`           | `AuditLog`                                  | - Lưu vết toàn bộ thay đổi dữ liệu nhạy cảm của hệ thống.                                                                                                                                       |

---

## 2. Quy Định Bắt Buộc Về Tiền Tệ & Tồn Kho (Database Rules)

1. **Tuyệt đối không dùng FLOAT hoặc DOUBLE cho tiền tệ:** Mọi trường `price`, `salePrice`, `unitPrice`, `cogsPrice`, `subtotal`, `totalAmount` đều phải dùng `Decimal @db.Decimal(14, 2)`.
2. **Ngăn chặn tồn kho âm:** Trường `stockQuantity` có ràng buộc kiểm tra không âm, việc trừ tồn kho phải thực hiện bên trong Prisma Interactive Transaction:

```typescript
await prisma.$transaction(async (tx) => {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (product.stockQuantity < quantity) {
    throw new BadRequestError('Sản phẩm đã hết hàng hoặc không đủ số lượng.');
  }
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: { decrement: quantity } },
  });
});
```

3. **Bảo tồn lịch sử di trú:** Không sửa trực tiếp các migration đã áp dụng; mọi thay đổi lược đồ đều phải thực hiện qua migration tiến mới (`prisma migrate dev`).

---

## 3. Nhật Ký Bơm Toàn Bộ Dữ Liệu Gốc TechPilot (100% Full Seed Execution)

Đã hoàn tất nạp 100% dữ liệu gốc từ `TechPilot/database/seed_dev.sql` vào cơ sở dữ liệu MySQL 8.4 LTS của Nexora qua script `scripts/seed_full_from_techpilot.cjs` với cơ chế batching tốc độ cao:

| Bảng dữ liệu         | Số lượng bản ghi đã nạp                             | Nguồn dữ liệu                              | Trạng thái xác minh |
| :------------------- | :-------------------------------------------------- | :----------------------------------------- | :------------------ |
| `categories`         | 21 danh mục phân cấp                                | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `brands`             | 30 thương hiệu công nghệ                            | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `products`           | 651 sản phẩm cấu hình cao                           | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `product_images`     | 2,604 ảnh sản phẩm                                  | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `coupons`            | 3 mã giảm giá chính thức                            | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `flash_sales`        | 1 chiến dịch Flash Sale                             | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `flash_sale_items`   | 5 sản phẩm Flash Sale                               | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `banners`            | 5 banners tiếp thị (Hero & Sidebar)                 | `TechPilot/database/seed_dev.sql` + RTX 50 | `PASS`              |
| `posts`              | 7 bài viết tin tức công nghệ                        | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `reviews`            | 6 đánh giá khách hàng (5 sao)                       | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `orders`             | 10 đơn hàng mẫu TechPilot                           | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `order_items`        | 10 chi tiết đơn hàng snapshot                       | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `inventory_logs`     | 5 nhật ký xuất nhập kho                             | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `notifications`      | 9 thông báo hệ thống                                | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `wishlists`          | 1 mục yêu thích mẫu                                 | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `users`              | Toàn bộ tài khoản TechPilot + tài khoản test Nexora | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `customer_addresses` | Danh bạ địa chỉ giao hàng                           | `TechPilot/database/seed_dev.sql`          | `PASS`              |
| `store_settings`     | Cấu hình cửa hàng đơn TechPilot                     | `TechPilot/database/seed_dev.sql`          | `PASS`              |
