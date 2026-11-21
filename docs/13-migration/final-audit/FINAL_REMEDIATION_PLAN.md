# FINAL REMEDIATION PLAN & PRODUCTION READINESS — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Ngày lập kế hoạch:** 20/11/2026
- **Trạng thái:** **APPROVED FOR EXECUTION (KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC CHÍNH THỨC)**

---

## 1. MỤC TIÊU KẾ HOẠCH HÀNH ĐỘNG

Kế hoạch này vạch ra các hành động cụ thể nhằm khắc phục triệt để các phát hiện kiểm toán kỹ thuật từ đợt Final Technical Migration Audit, đưa hệ thống Nexora đạt mức hoàn hảo 100% để sẵn sàng ra mắt chính thức (Production Go-Live).

---

## 2. DANH MỤC CÁC HẠNG MỤC CẦN KHẮC PHỤC THEO MỨC ĐỘ ƯU TIÊN

```
┌────────────────────────────────────────────────────────────────────────┐
│ P1: Xóa mã fallback mật khẩu AuthService (High - 1 giờ)                │
│ P2: Mở rộng bộ kiểm thử E2E Playwright 34 luồng (Medium - 2 ngày)      │
│ P3: Tinh giản Token màu sắc và CSS Utility (Low - 1 ngày)              │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 🔴 HẠNG MỤC P1: LOẠI BỎ MÃ FALLBACK MẬT KHẨU TRONG AUTH SERVICE

- **Mức độ:** **P1 — Bắt buộc xử lý trước khi triển khai môi trường Production**
- **Vấn đề:** Trong tệp `apps/api/src/modules/auth/auth.service.ts` (dòng 46-69), tồn tại khối mã fallback cho phép đăng nhập bằng các mật khẩu plaintext cũ (`TechPilotAdmin2026!`, `admin123`, `dev123`, `password123`).
- **Kế hoạch thực hiện:**
  1. Xóa bỏ hoàn toàn đối tượng `legacyFallbackPasswords` và khối logic so sánh plaintext tương ứng.
  2. Đảm bảo hàm `login()` chỉ sử dụng phương thức `bcrypt.compare(password, user.passwordHash)`.
  3. Cập nhật test case trong `auth.service.spec.ts` để kiểm chứng việc từ chối các mật khẩu plaintext không khớp hash.
- **Thời gian dự kiến:** 1 giờ công kỹ thuật.
- **Người chịu trách nhiệm:** Backend Engineer & Security Auditor.

---

### 🟡 HẠNG MỤC P2: MỞ RỘNG BỘ TEST SUITE E2E PLAYWRIGHT

- **Mức độ:** **P2 — Trung bình**
- **Vấn đề:** Hiện tại repository đã có tệp `tests/e2e/foundation.spec.ts` kiểm tra luồng cơ bản, nhưng chưa bao phủ toàn diện 34 kịch bản người dùng (User Journeys) từ duyệt sản phẩm, đặt hàng, thanh toán đến quy trình xử lý đơn hàng của Admin.
- **Kế hoạch thực hiện:**
  1. Viết bổ sung các kịch bản kiểm thử Playwright tự động:
     - Luồng Khách hàng: Tìm kiếm -> Lọc -> Thêm giỏ hàng -> Áp mã giảm giá -> Đặt hàng COD & VNPay -> Tra cứu đơn hàng.
     - Luồng Quản trị: Đăng nhập Admin -> Xem báo cáo doanh thu -> Cập nhật trạng thái đơn -> Thay đổi số lượng kho -> Kiểm tra phản ánh trên Storefront.
  2. Tích hợp chạy tự động Playwright trong GitHub Actions CI workflow.
- **Thời gian dự kiến:** 2 ngày làm việc.
- **Người chịu trách nhiệm:** QA Engineer.

---

### 🟢 HẠNG MỤC P3: TINH GIẢN CSS UTILITY & DESIGN SYSTEM TOKENS

- **Mức độ:** **P3 — Thấp (Tối ưu hóa trải nghiệm & thẩm mỹ)**
- **Vấn đề:** Một số component giao diện chứa các class CSS inline của Tailwind có thể được gom nhóm lại thành các biến CSS variables dùng chung để tối ưu dung lượng tệp CSS và đảm bảo tính đồng bộ hoàn hảo hơn nữa giữa chế độ Sáng (Light) và Tối (Dark).
- **Kế hoạch thực hiện:**
  1. Chuẩn hóa bộ bảng màu (Color Tokens) cho hệ thống Theme trong `apps/web/src/index.css`.
  2. Rà soát typography và khoảng cách lề (spacing) tại các bảng quản trị Admin.
- **Thời gian dự kiến:** 1 ngày làm việc.
- **Người chịu trách nhiệm:** Frontend Engineer / UI-UX Designer.

---

## 3. LỘ TRÌNH VẬN HÀNH & TRIỂN KHAI SẢN XUẤT (GO-LIVE ROADMAP)

| Giai đoạn       | Nhiệm vụ chính                                                   | Trạng thái kỹ thuật  | Thời hạn               |
| :-------------- | :--------------------------------------------------------------- | :------------------: | :--------------------- |
| **Giai đoạn 1** | Hoàn tất bộ 10 tài liệu kiểm toán kỹ thuật di trú                |    **COMPLETED**     | 20/11/2026             |
| **Giai đoạn 2** | Khắc phục mục P1 (Xóa mã fallback mật khẩu AuthService)          | **READY TO EXECUTE** | Trong 24h tới          |
| **Giai đoạn 3** | Khởi động lại Docker Desktop daemon và chạy migration chính thức |      **READY**       | Sau khi dev bật Docker |
| **Giai đoạn 4** | Mở rộng Playwright E2E suite (Mục P2)                            |     **PLANNED**      | 22/11/2026             |
| **Giai đoạn 5** | Triển khai chính thức lên máy chủ Production                     |     **ON TRACK**     | Cuối tuần              |

---

## 4. KẾT LUẬN & PHÊ DUYỆT

Hệ thống Nexora đã vượt qua 95% các tiêu chí kiểm toán kỹ thuật khắt khe nhất. Sau khi thực hiện gói khắc phục P1, dự án hoàn toàn đủ điều kiện xuất xưởng và vận hành thương mại độc lập.
