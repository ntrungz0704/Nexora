# TỔNG HỢP QUYẾT ĐỊNH CHỦ DỰ ÁN & HÀNH ĐỘNG KỸ THUẬT
## (OWNER DECISIONS & TECHNICAL ACTIONS REPORT)

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System  
- **Văn bản:** `comprehensive-audit/17_OWNER_DECISIONS_AND_TECHNICAL_ACTIONS.md`  
- **Nhánh Git:** `main` | **HEAD:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81`  
- **Thời điểm ban hành:** 2026-11-23  

---

## 1. TỔNG HỢP 4 QUYẾT ĐỊNH CHỦ DỰ ÁN (AUTHORITATIVE OWNER DECISIONS)

| Mã Quyết định | Nội dung chỉ đạo của Chủ dự án | Trạng thái thực thi | Bằng chứng thực tế |
| :--- | :--- | :---: | :--- |
| **DECISION 01** | **Bảo toàn 100% catalog hiện tại (674 sản phẩm, 31 thương hiệu, 36 danh mục)**; tạo nguồn dữ liệu độc lập cho Nexora; không xóa, không seed đè. | **COMPLETED** | File `prisma/seed_nexora_catalog.sql` (0.85 MB); 674 sản phẩm nguyên vẹn trong DB. |
| **DECISION 02** | **Giữ nguyên BcryptJS (cost factor 10)**; không chuyển đổi Argon2; hiệu chỉnh tài liệu kỹ thuật đúng với hiện trạng mã nguồn. | **COMPLETED** | `apps/api/package.json` (`bcryptjs: ^3.0.3`); đã ghi nhận trong tài liệu đối soát. |
| **DECISION 03** | **Ghi nhận task VNPay Timing-Safe Comparison cho Phase C**; không sửa code thanh toán hiện tại. | **COMPLETED** | Đã lập đặc tả kỹ thuật chi tiết tại Section 3 của tài liệu này. |
| **DECISION 04** | **Phê duyệt commit độc lập trên local cho đúng 4 file Frontend** (`SearchPage.tsx`, `NewsPage.tsx`, `PostDetailPage.tsx`, `ProductCatalogSection.tsx`); không push. | **COMPLETED** | Commit Hash: `85f3a52a0a1bde175d28cbdd5d540f9867671b81`, Parent: `b5ba48b`. |

---

## 2. CHI TIẾT COMMIT FRONTEND (DECISION 04)

Thao tác commit đã được thực hiện chuẩn chỉ theo đúng quy định:
- **Lệnh thực hiện:** Stage chính xác 4 file bằng đường dẫn cụ thể, không dùng `git add .`.
- **Commit Hash:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81`
- **Parent Commit:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` (Commit nghiệm thu M6.2)
- **Commit Message:** `fix(web): sua loi trung lap danh muc sidebar va toi uu giao dien tin tuc` (Viết bằng tiếng Việt không dấu chuẩn quy định `AGENTS.md`).
- **Danh sách 4 file được commit:**
  1. `apps/web/src/features/catalog/SearchPage.tsx` (+95, -13): Khắc phục triệt để lỗi nhân đôi danh mục sidebar, chuẩn hóa icon FontAwesome.
  2. `apps/web/src/features/news/NewsPage.tsx` (+38, -12): Loại bỏ thẻ HTML trong phần tóm tắt tin tức, bổ sung fallback ảnh bài viết độc lập.
  3. `apps/web/src/features/news/PostDetailPage.tsx` (+53, -15): Render nội dung HTML bài viết an toàn (`dangerouslySetInnerHTML`), chuẩn hóa ảnh fallback.
  4. `apps/web/src/features/storefront/ProductCatalogSection.tsx` (+171, -55): Hiển thị 20 icon PNG danh mục hình tròn và slider carousel 15 sản phẩm.
- **Trạng thái Git sau commit:**
  - `git status -sb`: `## main...origin/main [ahead 4]`
  - Working tree: Hoàn toàn sạch sẽ đối với các file mã nguồn tracked.
  - Push status: **Chưa push** (bảo toàn nghiêm ngặt trên local repository).

---

## 3. ĐẶC TẢ TASK BẢO MẬT VNPAY (DECISION 03)

### Tên Task: VNPay Signature Timing-Safe Comparison Hardening
- **Giai đoạn dự kiến:** Phase C (Production Readiness & Hardening).
- **Mức độ ưu tiên:** HIGH (Trước khi Golive hoặc nghiệm thu thanh toán thật).
- **Vị trí file cần xử lý:** `apps/api/src/modules/payment/payment.service.ts` (Dòng 153).
- **Hiện trạng:**
  ```typescript
  // HIỆN TẠI: Dễ bị tấn công vét cạn thời gian phản hồi (Timing Attack)
  const isValidSignature = secureHash?.toLowerCase() === signed.toLowerCase();
  ```
- **Tiêu chí nghiệm thu (Acceptance Criteria) cho Phase C:**
  1. Giữ nguyên thuật toán băm HMAC-SHA512 (`crypto.createHmac('sha512', secret)`).
  2. Giữ nguyên thứ tự canonicalization alphabet các tham số query qua `sortObject`.
  3. Kiểm tra định dạng đầu vào: kiểm tra `secureHash` tồn tại và có độ dài hex hợp lệ (128 ký tự).
  4. Chuyển đổi cả 2 chữ ký thành `Buffer` nhị phân (`Buffer.from(..., 'hex')`).
  5. Xử lý an toàn trường hợp độ dài buffer khác nhau trước khi so sánh constant-time:
     ```typescript
     // GIẢI PHÁP MẪU CHO PHASE C:
     const incomingBuf = Buffer.from(secureHash, 'hex');
     const expectedBuf = Buffer.from(signed, 'hex');
     const isValidSignature = incomingBuf.length === expectedBuf.length && crypto.timingSafeEqual(incomingBuf, expectedBuf);
     ```
  6. Xây dựng tối thiểu 4 ca kiểm thử tự động (Unit Tests) trong Vitest:
     - Test chữ ký hợp lệ (Valid signature -> true).
     - Test chữ ký sai nội dung cùng độ dài (Invalid signature -> false).
     - Test chữ ký sai độ dài hoặc định dạng (Malformed length -> false mà không crash server).
     - Test chữ ký rỗng/undefined (Missing signature -> false an toàn).
  7. Không làm ảnh hưởng đến quy trình xử lý IPN và redirect thanh toán hiện hành.

---

## 4. BẢO TOÀN CATALOG & TÁCH NGUỒN DỮ LIỆU ĐỘC LẬP (DECISION 01)

- **Kết quả bảo toàn:**
  - Toàn bộ **674 sản phẩm** (23 sản phẩm baseline + 651 sản phẩm TechPilot) được bảo vệ nguyên vẹn trên MySQL 8.4 dev.
  - Không có bất kỳ SKU, slug, giá bán hay mô tả nào bị thay đổi ngoài ý muốn.
  - 31 thương hiệu và 36 danh mục được giữ nguyên vẹn.
- **Tài liệu nguồn độc lập mới:**
  - File: [`prisma/seed_nexora_catalog.sql`](file:///d:/Nexora/prisma/seed_nexora_catalog.sql) (0.85 MB).
  - Tách bỏ hoàn toàn sự phụ thuộc runtime vào thư mục gốc `TechPilot`.
  - Tuân thủ nghiêm ngặt điều kiện dừng: **Không thực thi seed/import vào database**.

---

## 5. KẾ HOẠCH DỌN DẸP DỮ LIỆU VÀ TRẠNG THÁI CỔNG PHÊ DUYỆT (CLEANUP STATUS)

- **Hiện trạng:** Đã hoàn thành 100% việc kiểm kê 27 bảng và phân loại dữ liệu tại văn bản [`14_PRODUCTION_DATA_CLEANUP_PLAN.md`](file:///d:/Nexora/comprehensive-audit/14_PRODUCTION_DATA_CLEANUP_PLAN.md).
- **Bản ghi đề xuất xóa:**
  - 6 giỏ hàng khách vãng lai rỗng (Carts ID: 147, 148, 149, 150, 151, 152).
  - 10 nhật ký khảo sát AI thử nghiệm (AI Logs ID: 1 đến 10).
- **Trạng thái cổng phê duyệt:** **STOP & WAIT FOR SEPARATE APPROVAL**.
- Tuyệt đối chưa có bất kỳ lệnh DELETE hay UPDATE nào được thực thi trên database.
