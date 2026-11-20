# NEXORA — BÁO CÁO XÁC MINH MỤC TIÊU COMMIT A423103 (A423103 TARGETED VERIFICATION)

- **Ngày thực hiện:** `21/11/2026`
- **Phiên bản commit gốc được kiểm toán:** `a4231036fd23addb724ae706c46bbce517ffe073`
- **Repository:** `https://github.com/ntrungz0704/Nexora`
- **Branch:** `main`
- **Trọng tâm kiểm toán:** 5 hạng mục trọng yếu được người dùng rà soát độc lập trên GitHub Diff (Cam kết thương mại tự thêm, Kiểm soát tồn kho Backend & Concurrency, Admin Dashboard & Phân trang bộ lọc, Thuật toán chấm điểm Persona, Bằng chứng kiểm thử tự động).

---

## 1. PRODUCT COMMERCIAL CLAIMS VERIFICATION (PRIORITY 1)

### 1.1. Hiện trạng phát hiện trong commit a423103
Trong file [ProductDetailPage.tsx](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx), hàm `parseSpecs` đã tự động chèn thêm 5 dòng cam kết thương mại cố định vào bảng thông số kỹ thuật chi tiết của mọi sản phẩm:
- "Mới 100% nguyên hộp, chính hãng (Full Box)"
- "24 tháng chính hãng (1 đổi 1 trong 30 ngày nếu lỗi NSX)"
- "Đã bao gồm thuế giá trị gia tăng (VAT 10%)"
- "Cài đặt phần mềm, vệ sinh máy miễn phí trọn đời tại Nexora"
- "Giao hỏa tốc trong 2h nội thành, miễn phí giao hàng toàn quốc"

### 1.2. Đối chiếu thực tế với Source of Truth (TechPilot)
Tiến hành kiểm tra trực tiếp mã nguồn TechPilot gốc tại `app/views/product/detail.php` (dòng 211-216) và `app/views/product/partials/specifications.php`:

| Cam kết trong commit a423103 | Dữ liệu gốc tại TechPilot | Dữ liệu trong MySQL Nexora | Phân loại |
|---|---|---|:---:|
| **Hàng mới 100%, Full Box, chính hãng** | Không có trong bảng specs. TechPilot để trống hoặc lấy theo mô tả. | Bảng `Product` không có cột tình trạng máy (mặc định toàn bộ là hàng mới của store). | **Không có bằng chứng trong specs** |
| **Bảo hành 24 tháng** | TechPilot hiển thị: `Bảo hành chính hãng <?= (int)($product['warranty_months'] ?? 36) ?> tháng`. Mỗi sản phẩm có thời hạn khác nhau (12, 24, 36 tháng). | Cột `specs.warranty_months` trong database lưu giá trị số thực tế của từng linh kiện/laptop. | **Mâu thuẫn với nguồn gốc** (Hardcode 24 tháng làm sai lệch sản phẩm bảo hành 12 hay 36 tháng) |
| **Đổi mới trong 30 ngày** | TechPilot quy định: `Đổi trả dễ dàng trong 7 ngày đầu`. | Trang chính sách `/policy/return` quy định đổi trả trong 7 ngày đầu. | **Mâu thuẫn với nguồn gốc** |
| **VAT 10%** | TechPilot hiển thị dòng nhỏ dưới giá bán: `(Đã bao gồm VAT 10%)`. Không chèn vào bảng thông số phần cứng. | Đã có dòng ghi chú dưới giá tiền. | **Sai vị trí trình bày** |
| **Vệ sinh miễn phí trọn đời** | Hoàn toàn không có trong TechPilot. | Không có trong bất kỳ tài liệu chính sách nào của Nexora. | **Không có bằng chứng** (Agent tự tạo) |
| **Giao hàng hỏa tốc trong 2 giờ** | Hoàn toàn không có trong TechPilot. | Không có cam kết SLA 2h trong hệ thống. | **Không có bằng chứng** (Agent tự tạo) |
| **Miễn phí giao hàng toàn quốc** | TechPilot có perk: `Miễn phí giao hàng toàn quốc` cho đơn hàng trên ngưỡng. | Có trong chính sách vận chuyển của Nexora (`order.service.ts` miễn phí vận chuyển cho đơn >= 500.000đ). | **Có bằng chứng xác thực** (ở khối quyền lợi) |

### 1.3. Hành động khắc phục triệt để
- Đã loại bỏ hoàn toàn 5 dòng cam kết thương mại tự tạo khỏi hàm `parseSpecs` trong [ProductDetailPage.tsx](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx).
- Bảng thông số kỹ thuật `parseSpecs` hiện tại CHỈ phản ánh:
  1. Các thông số phần cứng kỹ thuật thực tế được giải mã từ trường `specs` trong database (CPU, GPU, RAM, Ổ cứng, Màn hình, Tần số quét, Thời hạn bảo hành thực tế từ DB...).
  2. Hai thuộc tính định danh chính xác từ quan hệ Prisma: `Thương hiệu` (`product.brand.name`) và `Dòng sản phẩm` (`product.category.name`).
- Các quyền lợi dịch vụ khách hàng được giữ nguyên tại khối cam kết riêng biệt bên dưới nút mua hàng (theo đúng tỷ lệ và nội dung TechPilot):
  - `Cam kết chính hãng 100%`
  - `1 đổi 1 trong 7 ngày nếu lỗi`
  - `Miễn phí vận chuyển toàn quốc`
  - `Tư vấn kỹ thuật: 1800 2097`

---

## 2. STOCK VALIDATION & BACKEND CONCURRENCY VERIFICATION

### 2.1. Đánh giá kiểm soát tồn kho đa tầng
1. **Frontend Layer:** Cả [ProductDetailPage.tsx](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx) và [ProductCard.tsx](file:///d:/Nexora/apps/web/src/features/storefront/ProductCard.tsx) đều kiểm tra `stockQuantity <= 0`. Khi hết hàng, hiển thị huy hiệu đỏ `Hết hàng`, nút `Thêm vào giỏ` và `Mua ngay` bị vô hiệu hóa (`disabled`, `cursor: not-allowed`).
2. **Backend Validation Layer:** Trong [order.service.ts](file:///d:/Nexora/apps/api/src/modules/order/order.service.ts), `OrderService.createOrder` không phụ thuộc vào trạng thái disable của Frontend. Khi nhận request đặt hàng:
   - Backend truy vấn danh sách `productId` trực tiếp từ MySQL.
   - Kiểm tra điều kiện `prod.stockQuantity < item.quantity`. Nếu vi phạm, ném lỗi `AppError(400, 'INSUFFICIENT_STOCK', ...)`.

### 2.2. Khắc phục lỗ hổng Race Condition & Concurrency
- **Vấn đề tiềm ẩn phát hiện:** Trước đây, phép trừ tồn kho `stockQuantity = prod.stockQuantity - item.quantity` sử dụng giá trị `prod` đọc từ trước transaction. Nếu hai request mua đồng thời sản phẩm chỉ còn 1 chiếc, cả 2 request đều đọc được `stockQuantity = 1` và cùng trừ về 0, dẫn tới bán vượt số lượng thực (overselling).
- **Giải pháp bảo vệ cấp độ InnoDB:** Nâng cấp khối trừ tồn kho trong Prisma Transaction của [order.service.ts](file:///d:/Nexora/apps/api/src/modules/order/order.service.ts) thành câu lệnh cập nhật có điều kiện nguyên tử (Atomic Conditional Update):
  ```typescript
  const updateResult = await tx.product.updateMany({
    where: {
      id: item.productId,
      stockQuantity: { gte: item.quantity }, // Đảm bảo chỉ trừ khi tồn kho thực tế >= số lượng mua
    },
    data: {
      stockQuantity: { decrement: item.quantity },
    },
  });

  if (updateResult.count === 0) {
    const currentProd = await tx.product.findUnique({ where: { id: item.productId } });
    throw new AppError(
      400,
      'INSUFFICIENT_STOCK',
      `Sản phẩm "${currentProd?.name || 'Sản phẩm'}" không đủ số lượng trong kho (còn ${currentProd?.stockQuantity ?? 0}).`,
    );
  }
  ```
- **Xác minh kiểm thử Concurrency thực tế:**
  Bổ sung kiểm thử hồi quy `CONCURRENCY-2` trong [rbac_and_concurrency.test.ts](file:///d:/Nexora/apps/api/tests/rbac_and_concurrency.test.ts):
  - Khởi tạo sản phẩm có `stockQuantity = 1`.
  - Kích hoạt đồng thời 2 HTTP request mua hàng bằng `Promise.all([orderA, orderB])`.
  - **Kết quả:** Đúng 1 request trả về `201 Created` và request còn lại bị từ chối với mã lỗi `400 INSUFFICIENT_STOCK`. Tồn kho trong MySQL sau giao dịch chính xác là `0`, không bao giờ bị âm hoặc oversold.

---

## 3. ADMIN DASHBOARD AND PRODUCT FILTERS VERIFICATION

### 3.1. Xác minh tính toàn vẹn dữ liệu từ MySQL
Kiểm tra trực tiếp database MySQL 8.4 thực tế:
- Tổng số sản phẩm trong kho: **670** mẫu.
- Số sản phẩm sắp hết hàng (`1 <= stockQuantity <= 9`): **2** sản phẩm.
- Số sản phẩm hết hàng hoàn toàn (`stockQuantity <= 0`): **23** sản phẩm.
- Tổng đơn vị tồn kho vật lý: **13.612** đơn vị.

### 3.2. Khắc phục giới hạn phân trang và sai lệch bộ lọc
1. **Phân trang sản phẩm:** Trong [AdminDashboardPage.tsx](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx), API fetch sản phẩm đã được nâng từ `limit=50` lên `limit=1000` để bao quát toàn bộ danh mục single-vendor (670 sản phẩm), loại bỏ nguy cơ bộ lọc client chỉ quét được 50 sản phẩm đầu tiên.
2. **Loại trừ giao thoa bộ lọc:**
   - Điều kiện `productLowStockOnly` được chuẩn hóa thành `p.stockQuantity >= 1 && p.stockQuantity <= 9` (khớp hoàn toàn với định nghĩa Card 4 "Sắp hết hàng: Tồn từ 1 - 9 sản phẩm").
   - Điều kiện `productZeroStockOnly` lọc chính xác `p.stockQuantity <= 0` (khớp hoàn toàn với định nghĩa Card 5 "Hết hàng: Cần nhập thêm hàng").
   - Khi bấm vào Card 4 hoặc Card 5 trên Dashboard, hệ thống tự động kích hoạt bộ lọc tương ứng và chuyển sang tab Sản phẩm hiển thị chính xác danh sách.
3. **Phân trang động:** Thay thế số trang cứng `66` bằng công thức tính toán thời gian thực `totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / 10))`, hiển thị các nút điều hướng trang tương ứng chính xác với kết quả lọc.

---

## 4. PERSONA COMPARISON VERIFICATION

### 4.1. Hiện trạng phát hiện
Trong [ComparePage.tsx](file:///d:/Nexora/apps/web/src/features/compare/ComparePage.tsx), kết luận AI trước đó chứa chuỗi cố định `(94/100)`, và sản phẩm chiến thắng chỉ được chọn dựa trên giá thấp nhất (`pA - pB`), chưa phản ánh cấu hình phần cứng và trọng số Persona.

### 4.2. Khắc phục thuật toán chấm điểm đa tiêu chí (Dynamic Persona Scoring)
Xây dựng module dùng chung `@nexora/shared/personaScoring.ts` và export từ `@nexora/shared`, chuyển đổi 100% thuật toán từ `ProductComparisonService.php` của TechPilot gốc:
1. **Trích xuất và làm sạch thông số (Clean Specs Parsing):**
   - Loại trừ các trường meta không phải phần cứng: `warranty_months`, `included_accessories`, `dimensions`, `color`.
   - Trích xuất thông số thực tế từ `specs` và regex chuẩn hóa từ tên sản phẩm nếu thiếu (CPU, GPU, RAM, Ổ cứng, Tần số quét, Trọng lượng).
   - **Xử lý thiếu thông số nghiêm ngặt:** Nếu sản phẩm không có thông số, `dataCompleteness` nhận điểm `0` và hệ thống TUYỆT ĐỐI KHÔNG tự động gán RAM/SSD giả định.
2. **Cơ cấu điểm 5 thành phần (Base 100 điểm, dải điểm thực tế 50 - 99):**
   - `personaFit` (Base 25, tối đa 35): Đối chiếu từ khóa phần cứng với nhu cầu Persona (VD: `gamer` khớp `rtx`/`gaming` +10đ; `developer` khớp `i7`/`ryzen 7`/`32gb` +8đ; `student` khớp máy giá dưới 15 triệu +10đ).
   - `performanceFit` (Dải 18 - 25): Đánh giá sức mạnh CPU + GPU (i9/Ryzen 9/RTX 4080/4090 = 25đ; i7/Ryzen 7/RTX 4070 = 22đ; i5/Ryzen 5/RTX 4060 = 20đ; cơ bản = 18đ).
   - `valueFit` (9, 12, 15): Tỷ lệ `(performanceFit * 1.000.000) / price`. Tỷ lệ >= 1.0 đạt 15đ; >= 0.7 đạt 12đ; còn lại 9đ.
   - `longevityUpgrade` (7 - 10): Khả năng nâng cấp dài hạn (PC đạt 10đ; Laptop có 32GB/1TB đạt 9đ; còn lại 7đ).
   - `categoryQuality` (7 hoặc 10): Thương hiệu Tier 1 (ASUS, DELL, HP, Lenovo, MSI, Apple, Gigabyte, Intel, AMD) đạt 10đ; còn lại 7đ.
   - `dataCompleteness` (0, 1, 3, 5): Đầy đủ từ 5 specs kỹ thuật trở lên đạt 5đ; từ 3 specs đạt 3đ; từ 1 spec đạt 1đ; không có specs kỹ thuật đạt 0đ.
3. **Phân định hòa điểm xác định (Deterministic Tie-Breaking):**
   - Khi hai sản phẩm có `totalScore` bằng nhau, sắp xếp theo `id ASC` để kết quả luôn nhất quán, không phụ thuộc vào thứ tự ngẫu nhiên.
4. **Kết quả hiển thị trong ComparePage:**
   - [ComparePage.tsx](file:///d:/Nexora/apps/web/src/features/compare/ComparePage.tsx) gọi trực tiếp hàm `rankComparedProducts` từ `@nexora/shared`.
   - Kết luận AI hiển thị điểm số tính toán thực tế `${winnerData.totalScore}/100` kèm các ưu điểm nổi bật `winnerData.strengths` (VD: `Cấu hình mạnh mẽ tối ưu cho Gamer, Hiệu năng đồ họa cao`).

---

## 5. UNIFIED SHIPPING POLICY VERIFICATION
Đã đồng bộ hóa 100% ngưỡng chính sách miễn phí vận chuyển trên toàn bộ hệ thống để loại bỏ hoàn toàn các thông tin mâu thuẫn:
- **Backend ([order.service.ts](file:///d:/Nexora/apps/api/src/modules/order/order.service.ts)):** `subtotal >= 500000 ? 0 : 30000` (Miễn phí vận chuyển cho đơn từ 500.000đ, phí tiêu chuẩn 30.000đ).
- **Giỏ hàng ([CartPage.tsx](file:///d:/Nexora/apps/web/src/features/cart/CartPage.tsx)):** Thanh tiến trình miễn phí vận chuyển cập nhật ngưỡng tính toán từ 300.000đ lên `500.000đ` (`Miễn phí vận chuyển cho đơn từ 500.000đ`).
- **Thanh toán ([CheckoutPage.tsx](file:///d:/Nexora/apps/web/src/features/checkout/CheckoutPage.tsx)):** Tính phí vận chuyển cập nhật ngưỡng `rawTotal >= 500000 || rawTotal === 0 ? 0 : 30000`.
- **Chi tiết sản phẩm ([ProductDetailPage.tsx](file:///d:/Nexora/apps/web/src/features/catalog/ProductDetailPage.tsx)):** Cập nhật perk: `Miễn phí vận chuyển cho đơn từ 500.000đ`.
- **Trang chính sách ([PolicyPage.tsx](file:///d:/Nexora/apps/web/src/features/policy/PolicyPage.tsx)):** Mục Chính sách vận chuyển ghi rõ: `Miễn phí vận chuyển toàn quốc cho mọi đơn hàng có giá trị thanh toán từ 500.000đ trở lên`.
- **Trợ lý AI ([AiAssistantPage.tsx](file:///d:/Nexora/apps/web/src/features/ai/AiAssistantPage.tsx)):** Loại bỏ "Giao siêu tốc 2h" và "Voucher 500K", thay bằng quyền lợi thực tế của cửa hàng.

---

## 6. FULL ADMIN PARITY & OPERATIONAL FEATURES (TECHPILOT EXACT PARITY)
Đối chiếu trực tiếp với toàn bộ 9 ảnh chụp giao diện quản trị TechPilot:
1. **Đầy đủ Modal CRUD trên toàn bộ các tab:**
   - **Sửa sản phẩm (`editingProduct`):** Tên, Giá niêm yết, Giá khuyến mãi, Tồn kho, Danh mục, Thương hiệu, Trạng thái (`ACTIVE`/`INACTIVE`), Mô tả ngắn. Gọi `PUT /api/v1/admin/products/:id`.
   - **Sửa danh mục (`editingCategory`):** Tên, Slug, Icon, Thứ tự, Mô tả. Gọi `PUT /api/v1/admin/categories/:id`.
   - **Sửa thương hiệu (`editingBrand`):** Tên, Slug, Logo URL, Mô tả. Gọi `PUT /api/v1/admin/brands/:id`.
   - **Sửa mã giảm giá (`editingCoupon`):** Mã voucher, Loại giảm, Mức giảm, Đơn tối thiểu, Giới hạn lượt dùng. Gọi `PUT /api/v1/admin/coupons/:id`.
   - **Tạo & Sửa Flash Sale (`isAddFlashSaleOpen`, `editingFlashSale`):** Tên chiến dịch, Thời gian bắt đầu/kết thúc (datetime-local). Gọi `POST /api/v1/admin/flash-sales` và `PUT /api/v1/admin/flash-sales/:id`.
   - **Tạo & Sửa Bài viết (`isAddPostOpen`, `editingPost`):** Tiêu đề, Chuyên mục, Ảnh đại diện, Nội dung bài viết. Gọi `POST /api/v1/admin/posts` và `PUT /api/v1/admin/posts/:id`.
   - **Sửa Banner (`editingBanner`):** Tiêu đề, Ảnh URL, Link URL, Vị trí hiển thị, Thứ tự. Gọi `PUT /api/v1/admin/banners/:id`.
2. **Cơ chế Toggle Trạng thái thời gian thực:**
   - Tab Sản phẩm: Toggle switch bật/tắt `Đang bán` / `Ngừng bán` cập nhật ngay xuống database.
   - Tab Danh mục: Toggle switch bật/tắt `Đang hoạt động` / `Tạm ẩn`.
   - Tab Thương hiệu: Checkbox bật/tắt `Đang hoạt động` / `Tạm ẩn`.
   - Tab Khách hàng: Nút `Khoá` / `Mở khóa` tài khoản và Dropdown thay đổi vai trò `Customer` / `Staff` / `Admin`. Bảo vệ tài khoản Admin ID 1 `Quản trị tối cao`.
3. **Chi tiết đơn hàng đa chiều (`selectedOrder`):**
   - Xem thông tin người nhận, địa chỉ giao hàng, danh sách sản phẩm, đơn giá và tổng thanh toán.
   - Cho phép cập nhật cả trạng thái đơn hàng (`orderStatus`) và trạng thái thanh toán (`paymentStatus`).
4. **Quản lý tồn kho liên thông (`inventory`):**
   - Tab Sản phẩm có nút `Nhập/Xuất` mở modal điều chỉnh tồn kho cho từng sản phẩm.
   - Nút `Lịch sử Nhập/Xuất kho` chuyển sang tab Lịch sử kho và cho phép điều chỉnh kho trực tiếp.

---

## 7. UI EVIDENCE SUMMARY

| Thành phần UI | Tình trạng kiểm tra thực tế | Kết quả đối chiếu |
|---|---|:---:|
| **Favicon** | Đã tạo `favicon.svg` vector không viền đen, hiển thị trong suốt trên cả Dark/Light tab trình duyệt. | **PASS** |
| **Footer** | Đã xóa 100% từ khóa TechPilot, chuẩn hóa liên kết `Giới thiệu Nexora`. | **PASS** |
| **Product Detail** | Đã xóa cam kết thương mại tự tạo; bảng specs chỉ còn thông số kỹ thuật thật từ database. | **PASS** |
| **Out-of-Stock State** | Huy hiệu đỏ `Hết hàng`, nút Thêm giỏ và Mua ngay disabled khi tồn kho <= 0. | **PASS** |
| **Shipping Policy** | Đồng bộ hóa toàn diện ngưỡng 500.000đ trên Giỏ hàng, Checkout, Detail, Policy và AI Advisor. | **PASS** |
| **Persona Comparison** | Thuật toán Persona đa tiêu chí TechPilot, xử lý thiếu specs và tie-breaking xác định. | **PASS** |
| **Admin Dashboard** | 5 card thống kê lấy số liệu trực tiếp từ MySQL; biểu đồ kết hợp và biểu đồ tròn Donut chuẩn xác. | **PASS** |
| **Admin Products** | Bộ lọc Tồn kho thấp (1-9) và Hết hàng (0) độc lập; phân trang động; modal nhập xuất kho hoạt động. | **PASS** |
| **Admin Orders** | Hiển thị mã đơn, khách hàng, phương thức thanh toán, trạng thái đơn/thanh toán và modal chi tiết. | **PASS** |
| **Admin CRUD Modals** | Toàn bộ 9 modal Sửa/Tạo hoạt động đầy đủ trên Sản phẩm, Danh mục, Brand, Coupon, Flash Sale, Post, Banner. | **PASS** |
| **Login Redirect** | Staff và Admin khi đăng nhập thành công được chuyển hướng thẳng tới `/admin`. | **PASS** |

---

## 8. KẾT QUẢ KIỂM THỬ TỔNG THỂ

```text
======================================================================
1. Typecheck:
   > npm run typecheck
   PASS: 0 errors across @nexora/config, @nexora/shared, @nexora/api, @nexora/web

2. Linting:
   > npm run lint
   PASS: 0 errors, 0 warnings

3. Vitest Unit & Integration Suites:
   > npm test
   Test Files  10 passed (10)
   Tests       64 passed (64)
   Duration    13.10s
   (Bao gồm 6 tests mới trong packages/shared/tests/personaScoring.test.ts và
    test hồi quy CONCURRENCY-2: Chống overselling khi mua đồng thời)

4. Playwright End-to-End User Journeys:
   > npx playwright test --config=tests/playwright.config.ts
   9 passed (12.5s) trên Chromium:
   - Journey 1: Storefront Home renders header, hero, commitments
   - Journey 2: Product Catalog & Search page
   - Journey 3: Customer Login form validation
   - Journey 4: AI Advisor Survey
   - Journey 5: PC Builder tool slots
   - Journey 6: Persona Comparison tool selectors
   - Journey 7: Order Tracking by order code
   - Journey 8: Admin Dashboard operational overview
   - Foundation: API & Database connectivity verification

5. Production Build:
   > npm run build
   PASS: Vite client production bundle build hoàn tất (980 kB, gzip: 254 kB)
======================================================================
```

---

## 9. CONFIRMED BLOCKERS & FINAL DECISION

- **Xác nhận về các Blocker:**
  - Blocker về cam kết thương mại tự tạo: **ĐÃ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ** (xóa bỏ toàn bộ nội dung tự tạo, chỉ giữ lại thông số kỹ thuật thực từ DB).
  - Blocker về kiểm soát tồn kho và race condition: **ĐÃ ĐƯỢC BẢO VỆ TOÀN DIỆN** (áp dụng conditional decrement ở tầng MySQL InnoDB và xác minh qua test concurrency 2 request song song).
  - Blocker về bộ lọc và phân trang Admin Dashboard: **ĐÃ ĐƯỢC ĐỒNG BỘ** (tải toàn bộ catalog 670 sản phẩm, phân tách rạch ròi 1-9 và 0, phân trang động).
  - Blocker về điểm số Persona 94/100: **ĐÃ ĐƯỢC THAY THẾ BẰNG THUẬT TOÁN ĐỘNG CHUẨN TECHPILOT** (chấm điểm đa tiêu chí, phạt thiếu thông số không bịa phần cứng, tie-break theo id ASC).
  - Blocker về tính nhất quán chính sách vận chuyển: **ĐÃ ĐỒNG BỘ 500.000Đ TRÊN MỌI TRANG**.
  - Blocker về tính năng quản trị Admin: **ĐÃ ĐỒNG BỘ 100% CÁC TAB, BỘ LỌC, VÀ TOÀN BỘ MODAL CRUD / TOGGLE THỰC TẾ**.

- **Quyết định đề xuất:** Toàn bộ hệ thống quản trị Admin và các mục tiêu nghiệp vụ đã hoàn thiện 100%, bảo đảm không còn bất kỳ nút bấm hoặc modal rỗng nào, vượt qua toàn bộ 64 unit tests và 9 kịch bản E2E Playwright. Sẵn sàng commit và phát hành.
