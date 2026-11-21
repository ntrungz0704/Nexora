# BÁO CÁO HỆ THỐNG CHUYỂN ĐỘNG & TƯƠNG TÁC NGƯỜI DÙNG (ANIMATION SYSTEM)

**Mã tài liệu:** `NEXORA-DOC-13-ANIMATION-04`  
**Ngày cập nhật:** `21/11/2026`  
**Trạng thái:** `ĐÃ HOÀN TẤT & ĐÃ XÁC MINH (PASS)`  
**Tác giả:** Motion Design Specialist & Frontend Engineer

---

## 1. Nguyên Tắc Thiết Kế Chuyển Động

Hệ thống animation của Nexora tuân thủ 3 nguyên tắc cốt lõi:

1. **Mục đích rõ ràng (Purposeful):** Animation chỉ xuất hiện để định hướng sự chú ý, phản hồi tương tác (feedback) hoặc biểu thị tiến trình tải, không gây phân tâm hoặc giảm tốc độ trải nghiệm của người dùng.
2. **Thời lượng chuẩn mực (Timing):** Toàn bộ micro-interactions có thời lượng từ `150ms` đến `300ms` với easing curve `cubic-bezier(0.4, 0, 0.2, 1)`.
3. **Hiệu năng GPU (60fps / 120fps):** Chỉ tác động lên các thuộc tính `transform` và `opacity`, không kích hoạt reflow/repaint layout của trình duyệt.

---

## 2. Danh Mục Các Hiệu Ứng Chuyển Động Đã Triển Khai

| STT | Vị Trí / Thành Phần                    | Hiệu Ứng Chuyển Động         | Triển Khai Kỹ Thuật                                                       | Trải Nghiệm Người Dùng                                              |
| --- | -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **Hero Carousel Banners**              | Fade & Slide Transition (5s) | CSS transition `opacity 500ms ease-in-out`                                | Chuyển đổi giữa 5 concept banner mượt mà, không giật khung hình.    |
| 2   | **Card Sản Phẩm Storefront**           | Hover Elevate & Image Scale  | `hover:-translate-y-1 hover:shadow-xl group-hover:scale-105 duration-300` | Tạo cảm giác chiều sâu 3D và khích lệ người dùng nhấn xem chi tiết. |
| 3   | **Quick Action (Giỏ hàng, Yêu thích)** | Button Pulse & Heart Fill    | `transition-transform active:scale-95 duration-150`                       | Phản hồi xúc giác trực quan khi người dùng click thêm sản phẩm.     |
| 4   | **Badge Giảm Giá / Flash Sale**        | Shimmer & Countdown Tick     | CSS `@keyframes pulse` và gradient animation                              | Tăng tính cấp thiết và thúc đẩy tỷ lệ chuyển đổi đơn hàng.          |
| 5   | **Modal / Dialog Quản Trị Admin**      | Backdrop Blur & Scale In     | `backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200`             | Tập trung thị giác vào form chỉnh sửa, không gây đột ngột.          |
| 6   | **Skeleton Loading State**             | Gradient Shimmer Wave        | `bg-gradient-to-r animate-pulse`                                          | Thay thế spinner cứng nhắc khi API đang nạp dữ liệu.                |
| 7   | **Drawer / Mobile Menu**               | Slide Over From Left         | `translate-x-0 transition-transform duration-300`                         | Trải nghiệm vuốt chạm chuẩn mực ứng dụng di động native.            |

---

## 3. Khả Năng Tiếp Cận & Hỗ Trợ Giảm Chuyển Động (Reduced Motion)

- Sử dụng media query chuẩn của Tailwind CSS `@media (prefers-reduced-motion: reduce)`:
  - Khi người dùng bật tính năng giảm chuyển động trên hệ điều hành (Windows Settings -> Accessibility -> Visual Effects -> Animation effects: OFF), toàn bộ các hiệu ứng chuyển đổi sẽ tự động chuyển thành instant transition (0ms), bảo vệ tối đa người dùng nhạy cảm với hội chứng tiền đình.
