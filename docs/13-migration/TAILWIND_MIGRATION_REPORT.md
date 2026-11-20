# BÁO CÁO CHUYỂN ĐỔI TAILWIND CSS & HỆ THỐNG GIAO DIỆN ĐỒNG NHẤT
**Mã tài liệu:** `NEXORA-DOC-13-TAILWIND-03`  
**Ngày cập nhật:** `21/11/2026`  
**Trạng thái:** `ĐÃ HOÀN TẤT & ĐÃ XÁC MINH (PASS)`  
**Tác giả:** Senior Frontend Architect & Design System Specialist  

---

## 1. Mục Tiêu Chuyển Đổi

Chuyển đổi toàn bộ phong cách giao diện và quy tắc bố cục từ các file CSS rời rạc của TechPilot sang kiến trúc **Tailwind CSS Utility-First** hiện đại, kết hợp CSS Variables để tối ưu hoá khả năng mở rộng, nén dung lượng bundle và hỗ trợ chuyển đổi chủ đề (Light Mode / Dark Mode) mượt mà.

---

## 2. Hệ Thống Màu Sắc & Bảng Mã Chuẩn Mực

| Token / Biến | Mã Màu Hex | Mục Đích Sử Dụng | Phản Hồi Dark Mode |
|---|---|---|---|
| **Primary Blue** | `#2563EB` (Blue-600) | Nút bấm chính, liên kết kích hoạt, viền tiêu điểm | `#3B82F6` (Blue-500) |
| **Primary Navy** | `#0A1128` | Sidebar Admin, thanh menu chính, text đậm | `#0B132B` (Nền chính Dark Mode) |
| **Storefront Surface** | `#FFFFFF` | Nền card sản phẩm, modal, input | `#1E293B` (Slate-800) |
| **Storefront Background** | `#F8FAFC` (Slate-50) | Nền tổng thể trang mua hàng | `#0F172A` (Slate-900) |
| **Admin Background** | `#F4F6F9` | Nền bảng quản trị Admin | `#0B132B` |
| **Admin Surface** | `#FFFFFF` | Thẻ card nội dung admin, bảng biểu | `#131E3D` / `.admin-card-surface` |
| **Accent Red** | `#EF4444` (Red-500) | Badge giảm giá, Flash Sale, thông báo cảnh báo | `#F87171` (Red-400) |
| **Success Emerald** | `#10B981` (Emerald-500) | Đơn hàng hoàn thành, hàng còn trong kho, badge COD | `#34D399` (Emerald-400) |

---

## 3. Khắc Phục Lỗi Hiển Thị Admin Layout (Visual Parity)

Trong các đợt kiểm thử trước, giao diện Admin từng gặp hiện tượng:
1. Chiều rộng bảng bị co hẹp, chiếm nửa màn hình.
2. Nửa bên phải màn hình để lại khoảng trống màu trắng khi ở Dark Mode.
3. Chữ và đường viền không đồng bộ màu nền tối.

### Các Giải Pháp Kỹ Thuật Đã Áp Dụng:
- **Cấu hình `w-full` và `min-w-0`:** Trong `AdminDashboardPage.tsx`, wrapper chính sử dụng `w-full min-h-screen flex bg-[#F4F6F9] dark:bg-[#0B132B] admin-page-wrapper`. Container nội dung `<main>` sử dụng `flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto max-h-screen`.
- **Áp dụng CSS Rule toàn cục trong `index.css`:**
  ```css
  html.dark-mode,
  html.dark-mode body,
  html.dark-mode #root {
    background-color: #0B132B !important;
    color: #F8FAFC !important;
  }

  .admin-card-surface {
    width: 100% !important;
  }

  .admin-header-bar {
    width: 100% !important;
  }
  ```
- **Chuẩn hoá typography và bảng biểu:** Toàn bộ bảng sản phẩm, đơn hàng, khách hàng, flash sale đều áp dụng `w-full text-left text-xs border-collapse` với `th` và `td` được padding đồng đều (`py-3.5 px-4`), text wrap có kiểm soát và horizontal scroll khi kích thước viewport thu nhỏ.

---

## 4. Tối Ưu Hoá Hiệu Năng Bundle CSS

- Toàn bộ Tailwind CSS được nén thông qua PostCSS và Vite.
- Kích thước tệp CSS sản xuất: `dist/assets/index-xLTKlREh.css` đạt **61.03 kB** (chỉ **10.95 kB** khi gzip nén mạng), loại bỏ hoàn toàn 100% CSS class dư thừa thông qua Tailwind Content Scanning.
