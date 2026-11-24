# FUTURE STAFF SCOPE & GOVERNANCE — NEXORA

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Tài liệu:** Quy chuẩn Quản trị & Ranh giới Kiến trúc cho Vai trò STAFF (Nội bộ Cửa hàng)
- **Ngày ban hành:** 2026-11-22
- **Trạng thái:** **APPROVED ARCHITECTURAL GOVERNANCE — FUTURE SCOPE ONLY**
- **Hiệu lực:** Áp dụng cho toàn bộ các giai đoạn phát triển hiện tại và tương lai của Nexora.

---

## 1. MỤC ĐÍCH & NGUYÊN TẮC CỐT LÕI

Tài liệu này xác lập quy chuẩn quản trị kiến trúc, ranh giới vai trò và nguyên tắc bảo mật đối với người dùng nội bộ mang vai trò `STAFF` trong hệ thống Nexora.

> [!IMPORTANT]
> **Quy định bất khả xâm phạm tại Milestone M6 hiện tại:**
> Hiện tại dự án **CHƯA TRIỂN KHAI** bất kỳ luồng nghiệp vụ, giao diện, trang quản trị, dashboard, portal hay quyền hạn mới nào dành riêng cho `STAFF`. Toàn bộ nội dung trong tài liệu này là **ranh giới kiến trúc dành cho các giai đoạn tương lai**, tuyệt đối không được tự ý triển khai code trong Phase B hay Milestone M6.

---

## 2. TÁM NGUYÊN TẮC BẢO VỆ VAI TRÒ STAFF (THE 8 GOVERNANCE PRINCIPLES)

1. **Bảo toàn 3 vai trò người dùng chuẩn hóa:**
   Hệ thống Nexora chỉ hỗ trợ 3 vai trò người dùng xác thực chính thức: `CUSTOMER`, `STAFF`, `ADMIN` (cùng vai trò `GUEST` cho khách vãng lai chưa đăng nhập). Tuyệt đối không tự ý thêm các vai trò trung gian (như `SELLER`, `VENDOR`, `MANAGER`, `OPERATOR`).
2. **Không đồng nhất `STAFF` với `ADMIN` (Principle of Least Privilege):**
   `STAFF` là nhân viên vận hành nội bộ của cửa hàng đơn nhất, **hoàn toàn KHÔNG phải là Quản trị viên hệ thống (`ADMIN`)**. Nhân viên `STAFF` không có quyền quản lý người dùng, thay đổi vai trò (role assignment), can thiệp cấu hình hệ thống, xem thông tin tài chính nhạy cảm hoặc đảo ngược các ràng buộc bảo mật.
3. **Phân quyền dựa trên sự phê duyệt rõ ràng (Explicit Permission Grant):**
   Người dùng mang vai trò `STAFF` chỉ được phép truy cập và thực thi các chức năng khi có Ma trận phân quyền (Permission Matrix) cụ thể đã được Chủ dự án (Owner) phê duyệt chính thức bằng văn bản hoặc Architecture Decision Record (ADR).
4. **Quy trình nghiệp vụ độc lập (Dedicated Workflows):**
   Mọi luồng công việc dành cho `STAFF` trong tương lai (ví dụ: tiếp nhận đơn hàng, đóng gói, kiểm tra tình trạng hàng đổi trả) phải có User Stories, Use Cases, Business Rules và Acceptance Criteria (ACs) độc lập, không được "mượn" tạm luồng của Admin hoặc Customer.
5. **Không tự suy diễn quyền hạn từ định danh role:**
   Việc tài khoản người dùng có `role === 'STAFF'` trong JWT token không tự động cấp bất kỳ quyền hạn quản trị nào. Mọi endpoint cần bảo vệ phải kiểm tra quyền hạn cụ thể (fine-grained authorization) tại backend middleware, không dựa vào kiểm tra giao diện đơn thuần.
6. **Kiểm toán bảo mật bắt buộc (Mandatory Security & Audit Trail):**
   Mọi thay đổi liên quan đến phân quyền RBAC hoặc hành động nghiệp vụ do `STAFF` thực hiện (ví dụ: duyệt đổi trả, điều chỉnh kho) bắt buộc phải trải qua đánh giá an ninh mạng (Authentication, Authorization, Anti-IDOR, Input Validation) và phải được ghi nhận vào bảng nhật ký kiểm toán hệ thống (`audit_logs`) với đầy đủ `userId`, `action`, `targetId`, `timestamp`, `ipAddress`.
7. **Triển khai trong Milestone tương lai độc lập:**
   Các tính năng và giao diện phục vụ `STAFF` chỉ được phép phát triển khi có Milestone riêng biệt được phê duyệt sau khi hoàn thành toàn bộ Phase B và M6 Storefront.
8. **Không ảnh hưởng đến quyền của `CUSTOMER` và `ADMIN`:**
   Mọi thiết kế hoặc điều chỉnh kiến trúc dành cho `STAFF` tuyệt đối không được làm thay đổi, gián đoạn hoặc suy giảm quyền lợi, bảo mật và trải nghiệm mua sắm của `CUSTOMER` cũng như thẩm quyền điều hành tối cao của `ADMIN`.

---

## 3. RANH GIỚI BỊ CẤM TUYỆT ĐỐI TẠI MILESTONE M6 (`MUST NOT`)

Trong khuôn khổ Milestone M6 (từ M6.1 đến M6.5), các AI Agents và Kỹ sư phần mềm **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP**:

- **MUST NOT** tạo `STAFF Dashboard`, `STAFF Portal`, `STAFF Workspace` hay bất kỳ trang quản trị nào dành riêng cho nhân viên.
- **MUST NOT** tạo các route navigation, thanh sidebar, menu hay liên kết dành cho `STAFF` trên Storefront hoặc Admin Web.
- **MUST NOT** tự ý định nghĩa các quyền hạn mới (permissions) hoặc nghiệp vụ mới cho `STAFF`.
- **MUST NOT** sửa đổi `apps/api/**`, `prisma/schema.prisma` hoặc tạo database migrations để mở rộng bảng liên quan đến nhân viên.
- **MUST NOT** cho phép người dùng role `STAFF` truy cập các module quản lý cấu hình hệ thống, quản lý người dùng (`/admin/users/role`), hoặc điều chỉnh giá trị tài chính.

---

## 4. MA TRẬN PHÂN QUYỀN THAM CHIẾU CHO TƯƠNG LAI (FUTURE REFERENCE MATRIX)

Khi Chủ dự án chính thức kích hoạt Milestone dành cho `STAFF`, ma trận phân quyền sau đây sẽ là cơ sở thiết kế:

| Nhóm chức năng nghiệp vụ | CUSTOMER | STAFF (Tương lai) | ADMIN (Hiện tại) | Ghi chú & Ranh giới |
| :--- | :---: | :---: | :---: | :--- |
| **Storefront Browsing & Shopping** | Đầy đủ | Như Customer | Đầy đủ | Mua sắm thông thường. |
| **Profile, Address, Notifications** | Của chính mình | Của chính mình | Của chính mình | Tuân thủ nghiêm ngặt Anti-IDOR. |
| **Customer Returns (Yêu cầu đổi trả)** | Gửi yêu cầu | Xem & Kiểm tra thực tế | Toàn quyền duyệt/từ chối | Phân cấp quy trình đổi trả. |
| **Order Processing (Xử lý đơn hàng)** | Xem đơn của mình | Đóng gói, cập nhật trạng thái giao | Toàn quyền quản trị đơn | STAFF không được xóa đơn hàng. |
| **Inventory Stock Adjustment** | Không | Không (hoặc chỉ kiểm kê) | Toàn quyền điều chỉnh kho | STAFF chỉ ghi nhận log hư hỏng nếu được cấp quyền. |
| **User Role & Status Management** | Không | **CẤM TUYỆT ĐỐI** | Toàn quyền thay đổi | Duy nhất ADMIN tối cao sở hữu. |
| **Financial / Profitability Analytics** | Không | **CẤM TUYỆT ĐỐI** | Toàn quyền xem | Bảo mật dữ liệu kinh doanh cửa hàng. |

---

## 5. KẾT LUẬN

Tài liệu này là cam kết kiến trúc chính thức. Mọi nỗ lực tự ý đưa tính năng `STAFF` vào mã nguồn trong Milestone M6.2 hoặc các milestone Frontend hiện tại đều bị coi là **vi phạm ranh giới quản trị dự án** và sẽ bị từ chối nghiệm thu ngay lập tức.
