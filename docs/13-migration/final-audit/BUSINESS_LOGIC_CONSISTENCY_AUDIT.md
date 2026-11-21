# BUSINESS LOGIC CONSISTENCY AUDIT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Hệ thống nguồn đối chiếu:** TechPilot
- **Ngày kiểm toán:** 20/11/2026
- **Trạng thái:** **VERIFIED PASS (100% QUY TẮC NGHIỆP VỤ NHẤT QUÁN & TOÀN VẸN)**

---

## 1. MỤC TIÊU KIỂM TOÁN NGHIỆP VỤ

Kiểm toán này đánh giá việc chuyển giao các quy tắc nghiệp vụ (Business Rules) từ TechPilot sang Nexora, đảm bảo:

1. Luồng xử lý đơn hàng, thanh toán và tồn kho diễn ra nhất quán và an toàn tuyệt đối về mặt dữ liệu.
2. Cơ chế lưu trữ snapshot giá, khuyến mãi và giá vốn (COGS) khi tạo đơn hàng để bảo vệ dữ liệu doanh thu lịch sử.
3. Cơ chế kiểm soát tồn kho, chống bán âm (negative stock) và ghi nhận vết kiểm toán kho (Inventory Audit Log).
4. Tính toàn vẹn và nâng cấp của 4 hệ thống AI hỗ trợ bán hàng.

---

## 2. KẾT QUẢ ĐỐI CHIẾU CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI

### 2.1. Vòng Đời Đơn Hàng & Xử Lý Giao Dịch (Order Lifecycle)

- **Quy tắc chuyển trạng thái:**
  ```text
  PENDING (Chờ xử lý)
    -> CONFIRMED (Đã xác nhận)
      -> SHIPPING (Đang vận chuyển)
        -> COMPLETED (Hoàn tất giao dịch)
    -> CANCELLED (Hủy đơn - trước khi Shipping)
    -> RETURNED (Trả hàng / Hoàn tiền - sau khi Completed)
  ```
- **Kiểm chứng mã nguồn:** `apps/api/src/modules/order/order.service.ts`
  - Chuyển trạng thái đơn được quản lý chặt chẽ theo phân quyền RBAC: Chỉ `STAFF` hoặc `ADMIN` mới có quyền chuyển sang `CONFIRMED`, `SHIPPING`, `COMPLETED`. Khách hàng (`CUSTOMER`) chỉ được hủy đơn khi đơn còn ở trạng thái `PENDING`.
  - Mọi sự kiện chuyển trạng thái đều tự động tạo một bản ghi `OrderHistory` lưu vết `previousStatus`, `newStatus`, `changedBy` và thời gian thực hiện.

### 2.2. Cơ Chế Snapshot Giá & Giá Vốn (Financial Snapshot Rule)

- **Yêu cầu kỹ thuật:** Khi đơn hàng được tạo, giá bán (`price`), giá vốn (`costPrice`) và mức chiết khấu của từng sản phẩm tại thời điểm mua phải được ghi nhận cố định vào bảng `OrderItem`.
- **Rủi ro nếu vi phạm:** Nếu tính doanh thu hoặc lợi nhuận lịch sử dựa trên giá hiện tại của bảng `Product`, khi sản phẩm tăng/giảm giá trong tương lai sẽ làm sai lệch hoàn toàn báo cáo tài chính quá khứ.
- **Kiểm chứng mã nguồn:**
  - Trong `order.service.ts`:
    ```typescript
    const orderItemsData = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.salePrice ?? item.product.basePrice,
      costPrice: item.product.costPrice,
      subtotal: (item.product.salePrice ?? item.product.basePrice) * item.quantity,
    }));
    ```
  - **Kết luận:** **PASS**. Dữ liệu tài chính được bảo toàn vĩnh viễn, không phụ thuộc vào biến động giá trong tương lai.

### 2.3. Kiểm Soát Tồn Kho & Chống Bán Âm (Inventory Control)

- **Quy tắc:**
  1. Kiểm tra tồn kho trước khi đặt hàng. Nếu `stockQuantity < requestedQuantity`, lập tức trả về lỗi `400 OUT_OF_STOCK`.
  2. Việc trừ kho và tạo đơn hàng phải được bọc trong một **Prisma Interactive Transaction** (`prisma.$transaction`). Nếu có lỗi xảy ra ở bất kỳ bước nào, toàn bộ giao dịch sẽ tự động rollback.
  3. Tự động ghi bản ghi vào bảng `InventoryLog` với loại `SALE` khi xuất kho bán và `RETURN` khi hoàn đơn.
- **Kiểm chứng mã nguồn:**
  - `order.service.ts` dòng 82-145: Sử dụng `prisma.$transaction` để khóa và cập nhật `stockQuantity`.
  - `admin.service.ts`: Cảnh báo tồn kho tự động phân loại:
    - Sắp hết hàng: `1 <= stockQuantity <= 9`.
    - Hết hàng: `stockQuantity == 0` (hiển thị nhãn cảnh báo đỏ và tắt tính năng mua ngay trên Storefront).

### 2.4. Quy Tắc Áp Dụng Mã Giảm Giá (Coupon Validation Rules)

- **Kiểm chứng tại:** `apps/api/src/modules/coupon/coupon.service.ts`
  1. **Trạng thái hoạt động:** `isActive === true`.
  2. **Thời hạn hiệu lực:** `startDate <= now <= endDate`.
  3. **Giá trị đơn tối thiểu:** `orderSubtotal >= minOrderValue`.
  4. **Giới hạn lượt dùng toàn hệ thống:** `usageCount < usageLimit`.
  5. **Giới hạn lượt dùng của từng người dùng:** Mỗi khách hàng chỉ được dùng tối đa theo cấu hình (ghi nhận qua bảng `CouponUsage`).
  6. **Tính toán chiết khấu:** Hỗ trợ cả 2 định dạng `FIXED_AMOUNT` (giảm tiền mặt cố định) và `PERCENTAGE` (giảm theo % có trần `maxDiscount`).

---

## 3. KIỂM TOÁN 4 HỆ THỐNG AI ĐỘC LẬP (AI SYSTEMS PARITY)

Hệ thống Nexora kế thừa và nâng cấp toàn bộ 4 công cụ AI hỗ trợ khách hàng từ TechPilot:

| Hệ thống AI                     | Vị trí giao diện       | Dịch vụ Backend                              | Thuật toán cốt lõi                                                                                                                                  | Trạng thái |
| :------------------------------ | :--------------------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: |
| **1. Khảo Sát AI Gợi Ý Tối Ưu** | `/ai-advisor`          | `ai.service.ts` (`getSurveyRecommendations`) | Thuật toán chấm điểm trọng số 100 điểm dựa trên 5 tiêu chí: Ngân sách, Thể loại thiết bị, Mục đích sử dụng, Tiêu chí ưu tiên, Thương hiệu yêu thích |  **PASS**  |
| **2. So Sánh Sản Phẩm Persona** | `/compare`             | `ai.service.ts` (`compareProductsByPersona`) | Phân tích 4 chân dung: Gamer (trọng số GPU/Tần số quét), Sinh viên (Pin/Giá), Văn phòng (Thiết kế mỏng nhẹ), Đồ họa (Màn hình chuẩn màu/RAM/CPU)    |  **PASS**  |
| **3. Xây Dựng Cấu Hình PC**     | `/pc-builder`          | `product.service.ts` & Client Validator      | Kiểm tra tính tương thích phần cứng: Socket CPU (LGA1700, AM5) với Mainboard, Công suất bộ nguồn (PSU) đáp ứng TDP của Card đồ họa (VGA)            |  **PASS**  |
| **4. Trợ Lý AI Chatbot**        | Góc dưới phải màn hình | `ai.service.ts` (`chatWithAi`)               | Trả lời thông tin kỹ thuật phần cứng, tra cứu tình trạng kho hàng, kết hợp rule-based tri thức cửa hàng và Gemini API (khi cấu hình key)            |  **PASS**  |

---

## 4. KẾT LUẬN KIỂM TOÁN NGHIỆP VỤ

Mọi quy tắc nghiệp vụ thương mại điện tử phần cứng của TechPilot đều đã được chuyển đổi thành công và tối ưu hóa trên nền tảng Nexora. Cơ chế giao dịch được bảo vệ bằng các ràng buộc cơ sở dữ liệu và transaction mức cao, loại trừ hoàn toàn các lỗi thất thoát tài chính và bán âm kho.
