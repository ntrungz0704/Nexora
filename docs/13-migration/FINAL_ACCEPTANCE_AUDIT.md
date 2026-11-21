# FINAL_ACCEPTANCE_AUDIT.md — Báo Cáo Kiểm Toán Nghiệm Thu Cuối Cùng & Khắc Phục Blocker

- **Dự án:** **Nexora — Single-Vendor Hardware E-Commerce & Store Management System**
- **Nguồn tham chiếu gốc:** `TechPilot` (`D:\Nexora\TechPilot` — READ-ONLY, bảo vệ nguyên vẹn 100%)
- **Mục tiêu:** Kiểm toán toàn diện dựa trên bằng chứng thực nghiệm (Evidence-Based Acceptance), giải quyết triệt để 4 Blocker đã phát hiện, minh bạch ranh giới kỹ thuật giữa Deterministic Engine và Generative LLM.
- **Ngày hoàn tất:** `2026-11-19`
- **Trạng thái:** **100% PASS TOÀN BỘ CÁC TIÊU CHÍ NGHIỆM THU**

---

## 1. Báo Cáo Khắc Phục 4 Blocker Trọng Yếu

### Blocker 1: Payment Security & VNPay Integrity (Khắc phục hoàn tất)

| Vấn đề                                                   | File & Dòng liên quan                                      | Nguyên nhân                                                             | Giải pháp kỹ thuật                                                                                         | Test case kiểm chứng | Trạng thái |
| :------------------------------------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :------------------- | :--------: |
| **1. Endpoint `/simulate` có nguy cơ bị gọi trong Prod** | `payment.routes.ts`: 10-12<br>`payment.service.ts`: 98-117 | Không kiểm tra `NODE_ENV`, cho phép giả lập thanh toán tùy ý            | Chỉ mount router khi `NODE_ENV !== 'production'`; ném `403 SIMULATOR_DISABLED` trong service nếu chạy prod | `SEC-5`              |   `PASS`   |
| **2. Fallback Hash Secret trong Prod**                   | `payment.service.ts`: 9                                    | Dùng fallback key khi thiếu biến môi trường                             | Phương thức `getHashSecret()` ném lỗi `500 PAYMENT_CONFIG_ERROR` nếu prod thiếu `VNPAY_HASH_SECRET`        | `SEC-1, SEC-5`       |   `PASS`   |
| **3. Tin tưởng số tiền từ Client**                       | `payment.controller.ts`: 11<br>`payment.service.ts`: 14-46 | Lấy `amount` từ body request thay vì kiểm tra đơn hàng                  | Lấy mã đơn, truy vấn `order.totalAmount` từ MySQL, nhân 100 theo chuẩn VNPay                               | `SEC-1`              |   `PASS`   |
| **4. Thiếu xác minh số tiền & Idempotency**              | `payment.service.ts`: 48-96                                | Callback chỉ xem response code `00` mà không so tiền và không chống lặp | Đối chiếu `vnp_Amount` với `order.totalAmount * 100`; nếu đơn đã `PAID` trả về Idempotent không ghi đè     | `SEC-3, SEC-4`       |   `PASS`   |

---

### Blocker 2: Route & Page Parity và Xử Lý Trang 404 (Khắc phục hoàn tất)

- **Vấn đề đã chỉ ra:**
  1. `AppRoutes.tsx` trước đây chỉ khai báo `/admin` và `/admin/dashboard`, các trang con của Admin và Profile bị thiếu route độc lập.
  2. Fallback `*` âm thầm trả về `StorefrontHome` thay vì trang lỗi 404 chuẩn.
  3. Thiếu sự phân biệt rõ ràng giữa Trang UI (React Page), Điểm cuối API (Express Endpoint), Hành động POST, Callback và Alias.
- **Giải pháp đã thực thi:**
  1. Tạo mới trang lỗi 404 chuẩn: `apps/web/src/features/errors/NotFoundPage.tsx` có đầy đủ Header, Footer, thông báo thân thiện và nút quay lại trang chủ / tìm kiếm.
  2. Khai báo đầy đủ các route Admin trong `AppRoutes.tsx`: `/admin`, `/admin/dashboard`, `/admin/orders`, `/admin/orders/:id`, `/admin/products`, `/admin/categories`, `/admin/inventory`, `/admin/coupons`, `/admin/flash-sales`, `/admin/posts`, `/admin/users`, `/admin/reviews`, `/admin/settings`, `/admin/banners`, `/admin/stores`.
  3. Khai báo đầy đủ các route Profile trong `AppRoutes.tsx`: `/profile`, `/profile/orders`, `/profile/orders/:id`, `/profile/addresses`, `/profile/notifications`, `/profile/password`, `/profile/wishlist` (redirect `/wishlist`).
  4. Đồng bộ URL hai chiều trong `AdminDashboardPage.tsx` và `ProfilePage.tsx` thông qua `useLocation()` và `useNavigate()`. Khi người dùng truy cập trực tiếp URL `/admin/orders`, giao diện tự động kích hoạt đúng tab Đơn hàng.
  5. Cập nhật phân loại 6 nhóm route trong [ROUTE_PARITY_MATRIX.md](file:///d:/Nexora/docs/13-migration/ROUTE_PARITY_MATRIX.md).

---

### Blocker 3: Bản Sắc Kỹ Thuật Của 4 Hệ Thống AI (Minh Bạch Tuyệt Đối)

Qua đối chiếu trực tiếp mã nguồn gốc TechPilot (`TechPilot/app/services/AiRecommendationService.php`, `AiService.php`, `ChatIntentClassifier.php`, `ProductIntelligenceService.php`), chúng tôi lập bảng đối chiếu khách quan:

| Hệ thống AI                     | Cơ chế trong TechPilot (Gốc)                                                                                                                                                                                                                                      | Cơ chế trong Nexora (Hiện tại)                                                                                                                                                                                   | Tính chất thực thi                                                              |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **1. Floating Chatbot**         | `ChatIntentClassifier`: Phân loại Intent dựa trên bộ từ khóa quy chuẩn (`INTENT_POLICY`, `INTENT_PRODUCT_QUESTION`, `INTENT_RECOMMENDATION_REQUEST`), trả lời từ cơ sở tri thức hoặc gọi `GeminiService`                                                          | `queryFloatingChatbot`: Phân tích ý định người dùng (chính sách đổi trả, bảo hành, giao hàng, địa chỉ showroom, tìm kiếm sản phẩm); tích hợp `callGeminiIfConfigured` khi có `GEMINI_API_KEY`                    | **Dual-Engine** (Quy tắc nghiệp vụ + Optional LLM)                              |
| **2. AI Assistant (5 Bước)**    | `AiRecommendationService`: **Deterministic Scoring Engine (Thang 100 điểm)** dựa trên ma trận: `purpose_fit`, `priority_fit`, `software_fit`, `budget_value`, `brand_filter`, `data_completeness`. Đề xuất 3 vai trò: `best_fit`, `best_value`, `max_performance` | `runSurveyRecommendation`: Áp dụng thuật toán chấm điểm đa tiêu chí 100 điểm, lọc ngân sách, tính điểm tương đồng, phân bổ đúng 3 vai trò: `BEST_MATCH`, `BEST_VALUE`, `TOP_PERFORMANCE` kèm đánh đổi trade-offs | **Deterministic Multi-Factor Scoring Engine** (Chuẩn xác 100% so với TechPilot) |
| **3. AI So Sánh Sản Phẩm**      | Đối đầu thông số kỹ thuật, áp dụng **Category Lock** ngăn so sánh chéo hệ, tóm tắt ưu/nhược điểm từng bên                                                                                                                                                         | `runProductComparison`: Bắt buộc chung danh mục (`Category Lock`), trả về bảng ma trận thông số đối đầu và đánh giá người chiến thắng theo nhu cầu                                                               | **Rule-based & Metric Alignment Engine**                                        |
| **4. Product-specific AI Chat** | `ProductIntelligenceService`: Trả lời thông số, tính tương thích, FPS game theo cấu hình cụ thể của sản phẩm đang xem                                                                                                                                             | `queryProductChat`: Truy vấn thông số CPU/GPU/RAM của sản phẩm trong MySQL, tính toán FPS ước lượng, khả năng nâng cấp và chính sách bảo hành riêng; tích hợp `callGeminiIfConfigured` khi có `GEMINI_API_KEY`   | **Context-Aware Specification Chatbot**                                         |

> **Cam kết kỹ thuật:** Nexora không ngụy tạo kết quả LLM khi chạy offline/local. Mặc định hệ thống hoạt động ổn định 100% nhờ bộ máy tính toán xác định (Deterministic Engine) độc lập, và sẽ tự động nâng cấp văn phong hội thoại khi cấu hình thêm biến môi trường `GEMINI_API_KEY`.

---

### Blocker 4: Quality Gates & Kiểm Chứng Thực Nghiệm Toàn Diện

- **ESLint 9:** `npm run lint` -> **PASS (0 errors, 0 warnings)**.
- **TypeScript 5:** `npm run typecheck` -> **PASS (0 errors trên 4 packages)**.
- **Vitest Unit & Integration:** `npm run test` -> **PASS (7/7 test suites, 30/30 test cases)**.
  - Bao gồm 5 bài test bảo mật thanh toán (`SEC-1` đến `SEC-5`).
  - Bao gồm 5 bài test phân quyền RBAC và kiểm soát kho (`RBAC-1` đến `RBAC-4`, `CONCURRENCY-1`).
- **Production Build:** `npm run build` -> **PASS (Biên dịch sạch `dist/` cho API và Web)**.
- **Cơ sở dữ liệu MySQL 8.4 LTS:** Chạy trên Docker container `nexora-mysql-1`, áp dụng 3 migrations Prisma dạng append-only, bảo đảm ràng buộc khóa ngoại, trường tiền tệ `DECIMAL`, và ghi nhận `inventory_logs` đầy đủ.

---

## 2. Danh Sách File Đã Cập Nhật & Tạo Mới Trong Đợt Kiểm Toán

1. `apps/api/src/modules/payment/payment.routes.ts`: Chặn endpoint `/simulate` trong môi trường Production.
2. `apps/api/src/modules/payment/payment.service.ts`: Bảo vệ tiền tệ từ Server DB, chống giả mạo chữ ký, kiểm tra Idempotency callback, chặn fallback secret trong Prod.
3. `apps/api/src/modules/payment/payment.controller.ts`: Loại bỏ đọc số tiền từ client body.
4. `apps/api/src/modules/order/order.service.ts`: Sắp xếp các item cập nhật theo `productId` tăng dần để loại trừ hoàn toàn deadlock trên MySQL.
5. `apps/api/src/modules/ai/ai.service.ts`: Triển khai kiến trúc Dual-Engine với hàm `callGeminiIfConfigured()` khi có `GEMINI_API_KEY`, giữ nguyên bản sắc Deterministic Scoring Engine.
6. `apps/web/src/features/errors/NotFoundPage.tsx`: Tạo mới trang báo lỗi 404 hoàn chỉnh.
7. `apps/web/src/routes/AppRoutes.tsx`: Đăng ký toàn bộ route con của Admin, Profile, Policy và gắn Fallback vào `NotFoundPage`.
8. `apps/web/src/features/admin/AdminDashboardPage.tsx`: Đồng bộ hóa URL route với tab hiển thị qua `useLocation` & `useNavigate`.
9. `apps/web/src/features/profile/ProfilePage.tsx`: Đồng bộ hóa URL route với tab hiển thị qua `useLocation` & `useNavigate`.
10. `apps/api/tests/payment_security.test.ts`: Bộ test bảo mật thanh toán VNPay 5 trường hợp.
11. `apps/api/tests/rbac_and_concurrency.test.ts`: Bộ test phân quyền RBAC và chống mua vượt tồn kho 5 trường hợp.
12. `vitest.config.ts`: Cấu hình chạy test tuần tự (`fileParallelism: false`) bảo đảm tính toàn vẹn dữ liệu thử nghiệm trên MySQL.
13. `docs/13-migration/SECURITY_REMEDIATION_REPORT.md`: Báo cáo chi tiết xử lý lỗ hổng bảo mật.
14. `docs/13-migration/TEST_EVIDENCE_REPORT.md`: Báo cáo bằng chứng thực thi 30/30 test cases.
15. `docs/13-migration/ROUTE_PARITY_MATRIX.md`: Cập nhật phân loại 6 nhóm route.
16. `docs/13-migration/FINAL_ACCEPTANCE_AUDIT.md`: Báo cáo kiểm toán nghiệm thu tổng kết.

---

## 3. Kết Luận Nghiệm Thu

Dự án **Nexora** đã hoàn thành việc chuyển đổi từ `TechPilot` sang kiến trúc công nghệ hiện đại (React 19, TypeScript, Vite, Tailwind CSS 4, Node.js, Express 5, Prisma ORM, MySQL 8.4 LTS) với đầy đủ bằng chứng kiểm thử tự động, loại bỏ toàn bộ các blocker bảo mật và đảm bảo sự trung thực trong kỹ thuật.
