# HỆ THỐNG TRUYỀN THÔNG & DỊCH VỤ HỖ TRỢ KHÁCH HÀNG
**Tài liệu:** `11_SUPPORT_AND_COMMUNICATION_SYSTEM.md`  
**Dự án:** Nexora  

---

## 1. Mạng Lưới Kênh Giao Tiếp Khách Hàng

- **Hotline Tổng Đài:** 1900 8888 (Hỗ trợ từ 08:00 đến 21:30 hàng ngày).
- **Email Hỗ Trợ:** `contact@nexora.local` (Phản hồi trong vòng 24 giờ làm việc).
- **Trợ Lý Ảo Nexora AI:** Trực tuyến 24/7 giải đáp thông số kỹ thuật, gợi ý linh kiện phù hợp ngân sách và kiểm tra tính tương thích socket CPU / mainboard.

---

## 2. Hệ Thống Phiếu Hỗ Trợ Kỹ Thuật (Support Tickets)

Trang Hỗ Trợ Kỹ Thuật (`/support` - `TechnicalSupportPage.tsx`) cho phép khách hàng tạo phiếu yêu cầu bảo hành hoặc tư vấn sửa chữa:
- Thu thập thông tin: Họ tên, số điện thoại, email, mã đơn hàng, loại sự cố (phần cứng, phần mềm, bảo hành, nâng cấp) và mô tả chi tiết lỗi.
- Hệ thống tự động sinh mã phiếu hỗ trợ duy nhất định dạng `SUP-XXXXXX`.
- Kỹ thuật viên liên hệ trực tiếp trong vòng 60 phút để hướng dẫn xử lý hoặc tiếp nhận thiết bị tại showroom gần nhất.
