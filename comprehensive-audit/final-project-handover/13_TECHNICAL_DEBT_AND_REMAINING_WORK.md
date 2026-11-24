# 13 — Technical Debt and Remaining Work

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-13`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM COMPREHENSIVE TECHNICAL AUDIT`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Phương Pháp Phân Loại Nợ Kỹ Thuật (Methodology)

Toàn bộ các phát hiện kỹ thuật, giới hạn hệ thống và công việc tồn đọng được tổng hợp dựa trên bằng chứng kiểm tra thực tế, phân tách minh bạch thành 4 cấp độ bản chất:
1. **Confirmed Issue (Lỗi/Thiếu hụt đã xác nhận):** Sự sai lệch giữa mã nguồn thực tế và đặc tả yêu cầu hoặc kỳ vọng người dùng.
2. **Potential Risk (Rủi ro tiềm ẩn):** Các vấn đề chưa gây lỗi ở môi trường hiện tại nhưng có thể phát sinh khi tải cao hoặc chạy môi trường thật.
3. **Improvement Suggestion (Đề xuất cải tiến):** Tối ưu hóa kiến trúc, trải nghiệm người dùng hoặc hiệu năng.
4. **Deferred Decision (Quyết định hoãn lại có chủ đích):** Các tính năng đã được Project Owner thống nhất chưa triển khai ở Phase B.

---

## 2. Bảng Đăng Ký Nợ Kỹ Thuật Toàn Diện (Technical Debt Register)

| Mã ID | Vấn đề phát hiện | Phân loại bản chất | Mức độ nghiêm trọng | Tác động thực tế đến hệ thống | Khuyến nghị giải pháp | Giai đoạn đề xuất |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
| **TD-01** | **Google OAuth chỉ có UI và Mock cứng** | `Confirmed Issue` | **Cao (High)** | Người dùng bấm "Tiếp tục với Google" tại Register bị đăng nhập nick mẫu, tại Login chỉ thấy thông báo text | Tích hợp thư viện OAuth 2.0 tại Backend (`google-auth-library`), cấu hình Client ID/Secret, hoàn thiện luồng SSO | **Phase C (Prod Launch)** |
| **TD-02** | **Thiếu hụt hình ảnh chi tiết sản phẩm** | `Confirmed Issue` | **Trung bình (Medium)** | 558/674 sản phẩm có `thumbnailUrl = null` (phải dùng ảnh placeholder); bảng `product_images` chỉ có 23 dòng | Chạy kịch bản bóc tách 2,760 ảnh từ `seed_dev.sql` gốc của TechPilot để nạp đầy đủ thư viện ảnh vào MySQL | **Phase C (Catalog Polish)** |
| **TD-03** | **Chênh lệch số lượng sản phẩm Catalog** | `Confirmed Issue` | **Thấp (Low)** | Database dev hiện có 674 sản phẩm trong khi phạm vi phê duyệt của Project Owner là 651 sản phẩm | Chạy script lọc và xóa bỏ 23 sản phẩm thử nghiệm / dữ liệu rác cũ kế thừa từ TechPilot | **Phase C (Pre-Prod Cleanup)** |
| **TD-04** | **Trang Admin nguyên khối quá lớn** | `Improvement Suggestion` | **Trung bình (Medium)** | `AdminDashboardPage.tsx` có dung lượng lên tới 6,312 dòng code, khó bảo trì dài hạn | Tách nhỏ 13 tabs nghiệp vụ thành các feature components riêng biệt (`AdminProductsTab`, `AdminOrdersTab`...) | **Phase D (Refactoring)** |
| **TD-05** | **Cấu hình VNPay Production thực tế** | `Deferred Decision` | **Trung bình (Medium)** | Hệ thống hiện cấu hình theo tham số thử nghiệm VNPay Sandbox; chưa có thông tin Merchant thật | Đăng ký tài khoản doanh nghiệp VNPay thật, cập nhật `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` trên máy chủ Prod | **Phase C (Go-Live)** |
| **TD-06** | **Thiếu tự động hóa triển khai Production** | `Potential Risk` | **Trung bình (Medium)** | Chưa có script tự động deploy lên VPS / Cloud (như Ansible, Terraform, hoặc CD pipeline tự động) | Xây dựng GitHub Actions CD job để tự động build Docker images, đẩy lên Docker Registry và deploy qua SSH | **Phase C (DevOps)** |
| **TD-07** | **Dịch vụ gửi Email đang chạy Console Mock** | `Potential Risk` | **Trung bình (Medium)** | Token đặt lại mật khẩu hiện chỉ in ra log console của API thay vì gửi email thật đến hộp thư khách | Tích hợp dịch vụ gửi thư SMTP (như Resend, SendGrid, Amazon SES hoặc Gmail SMTP) tại `email.service.ts` | **Phase C (User Experience)** |
| **TD-08** | **Khóa API Google Gemini AI chưa cấu hình** | `Deferred Decision` | **Thấp (Low)** | Trợ lý AI đang sử dụng bộ quy tắc phản hồi cục bộ (Rule-based fallback) khi không có `GEMINI_API_KEY` | Đăng ký Google AI Studio API Key, nạp vào biến môi trường máy chủ để kích hoạt năng lực LLM đầy đủ | **Phase C (AI Enhancement)** |

---

## 3. Phân Tích Chuyên Sâu Các Hạng Mục Nợ Kỹ Thuật Trọng Điểm

### A. Nợ Kỹ Thuật TD-01: Google OAuth
- **Hiện trạng:**
  - `LoginPage.tsx`: Nút Google set message text: `"Đăng nhập qua Google hiện đang được nâng cấp bảo mật SSO."`
  - `RegisterPage.tsx`: Nút Google gọi `authService.login({ email: 'customer@nexora.vn', password: 'password123' })`.
  - Backend: Không có route, không có middleware, không có controller xử lý Google OAuth.
- **Rủi ro:** Nếu đưa lên Production mà không sửa, người dùng bấm đăng ký Google sẽ lập tức rơi vào tài khoản test, gây mất an toàn và khó hiểu cho khách hàng.
- **Biện pháp tạm thời (nếu ra mắt nhanh):** Ẩn nút "Tiếp tục với Google" tại cả hai trang đăng nhập và đăng ký cho đến khi Backend hoàn thiện.

### B. Nợ Kỹ Thuật TD-02: Thư Viện Hình Ảnh Sản Phẩm
- **Hiện trạng:**
  - 674 sản phẩm đã có thông số kỹ thuật `specs` JSON, giá niêm yết và số lượng tồn kho.
  - Tuy nhiên, chỉ có 116 sản phẩm có `thumbnailUrl`. 558 sản phẩm còn lại đang hiển thị placeholder đồ họa mặc định.
  - Bảng `product_images` chỉ chứa 23 bản ghi thay vì 2,760 bản ghi như trong dữ liệu gốc TechPilot.
- **Đánh giá nghiệp vụ:** Hệ thống không bị crash (nhờ cơ chế fallback ảnh thông minh), khách hàng vẫn có thể tìm kiếm, đọc thông số, thêm vào giỏ và đặt hàng bình thường. Tuy nhiên, mặt thẩm mỹ của sàn linh kiện công nghệ cần hình ảnh thực tế để tạo độ tin cậy cao cho người mua.

### C. Nợ Kỹ Thuật TD-04: Kích Thước Component `AdminDashboardPage.tsx`
- **Hiện trạng:** Tệp tin `AdminDashboardPage.tsx` có dung lượng 6,312 dòng, tập trung toàn bộ state, modal, bảng dữ liệu và form của 13 tabs quản trị.
- **Đánh giá:** Mã nguồn chạy hoàn toàn ổn định, không có lỗi runtime hay memory leak (đã được xác minh qua Playwright Journey 8). Tuy nhiên, đây là món nợ kỹ thuật về khả năng bảo trì (Maintainability Debt). Khi nhiều lập trình viên cùng làm việc trên phần Admin, xung đột Git (Merge Conflicts) sẽ dễ xảy ra nếu không tách mô-đun.

---

## 4. Ranh Giới Nghiêm Ngặt: Những Gì Tuyệt Đối Không Tự Triển Khai

Để bảo đảm tính an toàn cho đợt kiểm kê READ-ONLY này:
- **KHÔNG TỰ Ý VÁ LỖI:** Không tự ý sửa code Google OAuth, không tự ý nạp thêm ảnh, không tự ý tách component Admin.
- **KHÔNG TỰ MỞ MILESTONE MỚI:** Toàn bộ các hạng mục trên đều được ghi nhận vào sổ đăng ký nợ kỹ thuật để Project Owner xem xét, phê duyệt kế hoạch phân bổ nguồn lực cho các Phase phát triển tiếp theo.
