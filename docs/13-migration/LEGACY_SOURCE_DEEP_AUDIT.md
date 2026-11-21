# LEGACY_SOURCE_DEEP_AUDIT.md — Khảo Sát & Kiểm Toán Toàn Diện TechPilot

- **Cập nhật lúc:** 2026-11-19
- **Phiên bản Snapshot tham chiếu:** `13861a83c4671440669c5a6469b2c607743f1eb0` (nhánh `main`)
- **Vị trí lưu trữ tham chiếu:** `d:\Nexora\TechPilot` (Bảo toàn nguyên trạng 100%, không sửa, không xóa)
- **Quy mô hệ thống:** 540 Git entries, 78 PHP view files, 182 route declarations, 28 database tables, 281 static assets, 27 controllers, 28 services, 12 models.

---

## 1. Bản Đồ Kiểm Kê Mã Nguồn Cũ (TechPilot Inventory)

### 1.1. Danh Sách 27 Controllers (`app/controllers/`)

| STT | Controller File                | Phân hệ / Trách nhiệm nghiệp vụ                                              |
| :-: | :----------------------------- | :--------------------------------------------------------------------------- |
|  1  | `AdminBannerController.php`    | Quản lý banner quảng cáo trang chủ & chiến dịch                              |
|  2  | `AdminBrandController.php`     | CRUD thương hiệu sản phẩm (ASUS, MSI, Acer, Lenovo...)                       |
|  3  | `AdminCategoryController.php`  | CRUD danh mục linh kiện, menu cha-con, AI tạo mô tả                          |
|  4  | `AdminController.php`          | Tổng quan Dashboard quản trị, biểu đồ doanh thu, thông báo nội bộ            |
|  5  | `AdminCouponController.php`    | Quản lý mã giảm giá, điều kiện áp dụng, giới hạn lượt dùng                   |
|  6  | `AdminFlashSaleController.php` | Quản lý khung giờ Flash Sale, phân bổ số lượng, giá ưu đãi                   |
|  7  | `AdminInventoryController.php` | Lịch sử nhập/xuất kho, audit log điều chỉnh tồn kho                          |
|  8  | `AdminOrderController.php`     | Quản lý đơn hàng, duyệt trạng thái (Chờ duyệt, Giao hàng, Hoàn tất)          |
|  9  | `AdminPostController.php`      | Quản lý bài viết tin công nghệ, đánh giá phần cứng                           |
| 10  | `AdminProductController.php`   | CRUD sản phẩm, thông số kỹ thuật, AI viết lại mô tả, điều chỉnh tồn kho      |
| 11  | `AdminReviewController.php`    | Kiểm duyệt đánh giá khách hàng (Duyệt / Ẩn bình luận)                        |
| 12  | `AdminUserController.php`      | Quản lý tài khoản khách hàng và nhân viên (Đổi vai trò, Khóa/Mở tài khoản)   |
| 13  | `AiAssistantController.php`    | AI tư vấn chọn máy theo khảo sát 5 bước, chấm điểm 100                       |
| 14  | `AuthController.php`           | Đăng nhập, đăng ký, đăng xuất, quên mật khẩu, đặt lại mật khẩu               |
| 15  | `CartController.php`           | Giỏ hàng cho khách vãng lai và thành viên, thêm/sửa/xóa/cập nhật số lượng    |
| 16  | `ChatbotController.php`        | Chatbot nổi (Floating Chatbot) tư vấn Q&A sản phẩm & chính sách              |
| 17  | `CheckoutController.php`       | Tạo đơn hàng, áp dụng coupon, chọn COD / VNPay                               |
| 18  | `CompareController.php`        | So sánh sản phẩm phần cứng, khóa danh mục, AI so sánh theo Persona           |
| 19  | `HomeController.php`           | Trang chủ, tìm kiếm, lọc Ajax, danh mục, thu cũ đổi mới (`/thu-cu-doi-moi`)  |
| 20  | `InventoryApiController.php`   | API truy vấn tồn kho sản phẩm và danh mục                                    |
| 21  | `NewsController.php`           | Trang tin tức công nghệ (danh sách và chi tiết)                              |
| 22  | `PaymentController.php`        | Xử lý thanh toán VNPay: Return URL, IPN Webhook, Sandbox Simulator           |
| 23  | `PcBuilderController.php`      | Cấu hình máy tính (PC Builder), kiểm tra tương thích phần cứng, cấu hình mẫu |
| 24  | `PostController.php`           | Quản lý chi tiết bài viết và danh mục bài viết                               |
| 25  | `ProductController.php`        | Chi tiết sản phẩm, đánh giá, AI chat trực tiếp trên trang chi tiết sản phẩm  |
| 26  | `ProfileController.php`        | Hồ sơ cá nhân, sổ địa chỉ, đơn hàng, yêu cầu đổi trả, đổi mật khẩu           |
| 27  | `WishlistController.php`       | Quản lý danh sách sản phẩm yêu thích (Thêm, Xóa, Toggle)                     |

---

### 1.2. Danh Sách 28 Services Nghiệp Vụ (`app/services/`)

| STT | Service                               | Nhiệm vụ chính                                                                       |
| :-: | :------------------------------------ | :----------------------------------------------------------------------------------- |
|  1  | `AiProductAssistantService.php`       | Trợ lý tư vấn chuyên sâu cho từng sản phẩm cụ thể                                    |
|  2  | `AiRecommendationService.php`         | Thuật toán chấm điểm 100 và lọc 3 máy gợi ý theo khảo sát 5 bước                     |
|  3  | `AiService.php`                       | Tầng kết nối chung với các LLM provider (Gemini, Groq, Qwen)                         |
|  4  | `CartService.php`                     | Quản lý session giỏ hàng, đồng bộ giỏ hàng khách khi đăng nhập                       |
|  5  | `CatalogGroupService.php`             | Gom nhóm danh mục và cây phân cấp linh kiện                                          |
|  6  | `CategoryMenuService.php`             | Khởi tạo cấu trúc menu Mega Menu 16 danh mục linh kiện                               |
|  7  | `CategorySchemaRegistry.php`          | Đăng ký bộ schema thông số kỹ thuật chuẩn cho từng nhóm sản phẩm                     |
|  8  | `ChatIntentClassifier.php`            | Phân loại ý định người dùng (Hỏi giá, So sánh, Hỏi bảo hành, Tìm sản phẩm)           |
|  9  | `CouponService.php`                   | Kiểm tra điều kiện giảm giá, thời hạn, giới hạn đơn hàng                             |
| 10  | `FlashSaleService.php`                | Khóa số lượng giữ chỗ (reservation) khi đặt hàng Flash Sale                          |
| 11  | `GeminiService.php`                   | Gọi trực tiếp Google Gemini API cho tác vụ sinh nội dung                             |
| 12  | `InventoryService.php`                | Quản lý tồn kho nguyên tử (atomic decrement/increment), ghi log audit                |
| 13  | `NewsCommerceService.php`             | Liên kết bài viết tin tức với các sản phẩm linh kiện liên quan                       |
| 14  | `NewsSeederService.php`               | Nạp dữ liệu bài viết mẫu và hình ảnh minh họa                                        |
| 15  | `NotificationRepositoryInterface.php` | Interface trừu tượng quản lý thông báo người dùng                                    |
| 16  | `PcCompatibilityService.php`          | Quy tắc kiểm tra tương thích: Socket CPU & Mainboard, Chuẩn RAM, Công suất nguồn PSU |
| 17  | `PdoNotificationRepository.php`       | Triển khai lưu trữ thông báo qua database                                            |
| 18  | `PostPublishingValidator.php`         | Kiểm định bài viết trước khi xuất bản                                                |
| 19  | `ProductComparisonService.php`        | Thuật toán so sánh sản phẩm, phát hiện thông số vượt trội                            |
| 20  | `ProductFacetService.php`             | Xây dựng bộ lọc thuộc tính đa chiều (Hãng, Giá, CPU, GPU, Màn hình)                  |
| 21  | `ProductIntelligenceService.php`      | Khai phá hành vi người xem sản phẩm để gợi ý thông minh                              |
| 22  | `ProductKnowledgeService.php`         | Cung cấp tri thức thông số cho Chatbot nổi                                           |
| 23  | `ProductSpecNormalizer.php`           | Chuẩn hóa thông số kỹ thuật dạng chuỗi về giá trị đo lường có cấu trúc               |
| 24  | `ProductSpecPresenter.php`            | Trình bày bảng thông số kỹ thuật trực quan cho giao diện                             |
| 25  | `ProductSpecValidator.php`            | Validate dữ liệu thông số kỹ thuật nhập từ Admin                                     |
| 26  | `SpecScraperService.php`              | Hỗ trợ cào/trích xuất thông số kỹ thuật từ nhà sản xuất                              |
| 27  | `UploadService.php`                   | Xử lý upload ảnh sản phẩm, banner, ảnh đại diện an toàn                              |
| 28  | `VnpayService.php`                    | Sinh URL thanh toán VNPay, tạo chữ ký HMAC-SHA512, xác thực IPN                      |

---

### 1.3. Ba Phân Hệ AI Độc Lập Bắt Buộc Bảo Toàn

1. **Floating Chatbot (Chatbot Nổi Toàn Trang):**
   - Vị trí: Nút tròn nổi góc phải dưới màn hình trên tất cả các trang storefront.
   - Nhiệm vụ: Phân loại ý định (`ChatIntentClassifier`), hỏi đáp về chính sách bảo hành, đổi trả, địa chỉ cửa hàng, tra cứu thông tin nhanh.
   - Cơ chế: Lưu lịch sử phiên chat, đồng bộ khi khách đăng nhập.
2. **AI Assistant Khảo Sát 5 Bước (`/ai-assistant`):**
   - Vị trí: Trang độc lập `/ai-assistant`.
   - Nhiệm vụ: Khảo sát tương tác 5 bước (Danh mục -> Mục đích sử dụng -> Mức ngân sách -> Yêu cầu thương hiệu/thông số -> Ưu tiên hiệu năng).
   - Cơ chế: Thuật toán chấm điểm 100 điểm (`AiRecommendationService`), trả về chính xác 3 danh vị: **Phù hợp nhất (Best Match)**, **Đáng tiền nhất (Best Value)**, **Hiệu năng cao nhất (Top Performance)**.
3. **Product Comparison AI (AI So Sánh Sản Phẩm - `/compare`):**
   - Vị trí: Trang độc lập `/compare`.
   - Nhiệm vụ: Khóa cùng danh mục (Category Lock), cho phép chọn Persona (Sinh viên, Lập trình viên, Game thủ, Đồ họa chuyên nghiệp), highlight thông số vượt trội và AI diễn giải đánh đổi (Trade-off explanation).

---

## 2. Kiểm Toán Lỗ Hổng Bảo Mật & Rủi Ro Cần Viết Lại

| STT | Lỗ hổng phát hiện trong TechPilot                             | Rủi ro thực tế                                                     | Giải pháp viết lại trên Nexora                                                                 |
| :-: | :------------------------------------------------------------ | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
|  1  | **Backdoor mật khẩu tương đương trong `User.php`**            | Cho phép bypass đăng nhập nếu chuỗi băm trùng nhau                 | Sử dụng thuật toán băm chuẩn **Argon2id**, không bypass                                        |
|  2  | **VNPay credentials bị hardcode trong source**                | Lộ khóa bí mật hash secret và TMN Code                             | Chuyển 100% vào biến môi trường `.env` (`VNPAY_HASH_SECRET`, `VNPAY_TMN_CODE`)                 |
|  3  | **Bypass SSL Certificate (`CURLOPT_SSL_VERIFYPEER = false`)** | Nguy cơ tấn công Man-in-the-Middle (MitM)                          | Bật SSL verification đầy đủ cho mọi kết nối HTTPS ra ngoài                                     |
|  4  | **Thiếu cơ chế xử lý Idempotent cho VNPay IPN**               | Có thể bị trừ tiền hoặc cập nhật trạng thái đơn hàng trùng lặp     | Bổ sung khóa Idempotency và ghi nhật ký giao dịch `payment_transactions`                       |
|  5  | **Không dùng Transaction khi trừ tồn kho Flash Sale**         | Race condition dẫn đến bán vượt quá số lượng tồn kho (overselling) | Sử dụng Prisma Interactive Transaction với pessimistic locking hoặc kiểm tra tồn kho nguyên tử |
|  6  | **Dữ liệu seed chứa thông tin cá nhân (PII)**                 | Vi phạm quyền riêng tư và quy chuẩn đồ án                          | Sử dụng seed dữ liệu mẫu tổng hợp (synthetic non-PII)                                          |

---

## 3. Kết Luận Kiểm Toán

Nexora sẽ tiếp nhận toàn bộ 100% nghiệp vụ của TechPilot nhưng được tái kiến trúc trên nền tảng **Express 5 + React 19 + TypeScript + Prisma + MySQL 8.4**, loại bỏ sạch sẽ các lỗ hổng bảo mật cũ và bảo đảm hiệu năng tối đa.
