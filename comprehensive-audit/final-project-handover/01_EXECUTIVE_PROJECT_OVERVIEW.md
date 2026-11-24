# 01 — Executive Project Overview

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Loại hình:** Hệ thống Thương mại Điện tử và Quản trị Vận hành Bán lẻ Phần cứng Công nghệ Đơn cửa hàng (Single-Vendor)
- **Mã phân loại kiểm kê:** `AUDIT-HANDOVER-01`
- **Phiên bản tài liệu:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái kiểm kê:** `READ-ONLY AUDIT — COMPLETED`
- **Branch:** `main`
- **Latest Accepted Commit:** `607315261fcf802c517e0d32e210817d2080341d` (`feat(web): hoan tat milestone m6.5 integration qa`)

---

## 1. Tóm Lược Điều Hành (Executive Summary)

Dự án **Nexora** là hệ thống thương mại điện tử chuyên ngành phần cứng, thiết bị công nghệ máy tính (PC, Laptop, Linh kiện, Phụ kiện), được tái thiết kế và xây dựng lại từ nền tảng tham chiếu kế thừa PHP/MySQL (`TechPilot`). Nexora được phát triển độc lập với lịch sử Git sạch, kiến trúc nguyên khối phân mô-đun (**Modular Monolith**), sử dụng công nghệ hiện đại đồng nhất TypeScript xuyên suốt từ Frontend đến Backend và cơ sở dữ liệu quan hệ chuẩn mực MySQL 8.4 LTS.

Tại thời điểm chốt bàn giao, dự án đã hoàn thành toàn bộ chu kỳ phát triển nền tảng bao gồm:
1. **Giai đoạn Phase A:** Thiết lập kiến trúc Monorepo, Data Model 3NF, API Foundation, Bảo mật cốt lõi và Visual Parity Storefront/Admin.
2. **Giai đoạn Phase B Backend (M1 – M5):** Triển khai toàn diện các module nghiệp vụ Backend (Customer Profile, Shipping Addresses, Guest Cart Merge với khóa đồng thời `FOR UPDATE`, Product Reviews với chống trùng lặp P2002, Return Requests state machine và Admin CRUD).
3. **Giai đoạn Phase B Frontend & Integration (M6.1 – M6.5):** Tích hợp giao diện Storefront với API Backend, quản lý vòng đời giỏ hàng khách vãng lai, trang cá nhân khách hàng, đánh giá sản phẩm, quy trình đổi trả trực tuyến, và đợt kiểm thử tích hợp toàn diện (Integration Testing & QA) với 3 Change Requests hoàn tất (`CR-M6.5-01`, `CR-M6.5-02`, `CR-M6.5-03`).

### Chỉ Số Kỹ Thuật Tổng Thể (Verified Metrics)

| Chỉ số kỹ thuật | Giá trị thực tế kiểm kê | Ghi chú & Nguồn kiểm chứng |
| :--- | :--- | :--- |
| **Tổng số files trong repo** | **726 files** | Toàn bộ repo (loại trừ `node_modules`, `.git`, `dist`) |
| **Tổng số dòng code/text** | **386,948 dòng** | Bao gồm source code, styles, configs, docs và audit logs |
| **Source Code TypeScript/TSX** | **152 files / 54,891 dòng** | Web: 81 files (43,190 LOC); API: 68 files (14,417 LOC); Shared: 4 files (1,136 LOC); Config: 1 file (14 LOC) |
| **Số lượng Frontend Pages** | **28 Page Components** | Nằm trong `apps/web/src/features/` |
| **Số lượng Route khai báo** | **83 Routes** | Khai báo trong `apps/web/src/routes/AppRoutes.tsx` (bao gồm canonical routes, alias redirects và fallback) |
| **Số lượng Backend Endpoints** | **107 APIs** | Phân bổ trong 11 module tại `apps/api/src/modules/` |
| **Số lượng Prisma Models** | **26 Models** | Định nghĩa chuẩn mực trong `prisma/schema.prisma` |
| **Số lượng Enums** | **11 Enums** | Phục vụ chặt chẽ RBAC, trạng thái đơn hàng, thanh toán, đổi trả |
| **Số lượng Prisma Migrations** | **8 Migrations** | Áp dụng tuần tự không lỗi từ `20261118162807` đến `20261122160000` |
| **Tổng số Test Cases Pass** | **320 / 320 Tests PASS (100%)** | 36 Unit + 99 Frontend + 176 Backend MySQL + 9 Playwright E2E |
| **Tình trạng Working Tree** | **Clean Tracked Files** | Không có file tracked nào bị sửa đổi; HEAD nguyên vẹn |
| **Tình trạng Database Dev** | **Zero Mutations** | 674 sản phẩm, 31 thương hiệu, 36 danh mục, 3 tài khoản được bảo toàn |

---

## 2. Ranh Giới Phạm Vi & Mô Hình Kinh Doanh (Scope Boundaries)

Dự án Nexora tuân thủ nghiêm ngặt các ranh giới nghiệp vụ đã được Project Owner và Architecture Rules phê duyệt:

### A. Ranh giới bắt buộc (`MUST`)
- **Single-Vendor E-Commerce:** Hệ thống phục vụ duy nhất **MỘT cửa hàng bán lẻ công nghệ**. Mọi nghiệp vụ nhập hàng, tồn kho, định giá, bán hàng, bảo hành và đổi trả đều thuộc quyền quản lý trực tiếp của chủ sở hữu cửa hàng.
- **Tách biệt vai trò người dùng:**
  - `Guest`: Phiên truy cập của khách vãng lai chưa đăng nhập. Giỏ hàng lưu trữ cục bộ với `guestSessionId`, hỗ trợ tự động gộp giỏ hàng (Guest Cart Merge) ngay khi đăng nhập.
  - `CUSTOMER`: Khách hàng mua sắm đã có tài khoản, được quản lý hồ sơ cá nhân, sổ địa chỉ nhận hàng, lịch sử đơn hàng, gửi đánh giá sản phẩm và yêu cầu đổi trả.
  - `STAFF`: Nhân viên vận hành nội bộ cửa hàng, xử lý đơn hàng, kho bãi, đối soát đổi trả và chăm sóc khách hàng.
  - `ADMIN`: Quản trị viên cấp cao nhất, toàn quyền quản lý hệ thống, cấu hình giá, khuyến mãi, nhân sự, kiểm duyệt đánh giá và phân quyền.

### B. Vùng cấm tuyệt đối (`MUST NOT`)
- **KHÔNG PHẢI Marketplace:** Tuyệt đối không triển khai mô hình sàn thương mại điện tử đa người bán (Multi-Vendor Marketplace).
- **KHÔNG CÓ Seller Portal / Multi-store:** Không có luồng đăng ký gian hàng đối tác, không có ví người bán (Seller Wallet), không có cơ chế chia sẻ hoa hồng (Commission/Payout), không có tách đơn theo người bán (Multi-store order splitting). Module `SellerMargin` (nếu đề cập trong tài liệu tương lai) chỉ là tên gọi của mô-đun phân tích tài chính/tỷ suất lợi nhuận nội bộ của cửa hàng, hoàn toàn không phải role người dùng hay cổng bán hàng bên thứ ba.
- **KHÔNG PHẢI ERP/HRM/CRM đa doanh nghiệp:** Không xây dựng hệ thống quản trị nhân sự tổng thể, bảng chấm công, hoặc phần mềm quan hệ khách hàng doanh nghiệp phức tạp ngoài phạm vi quản trị bán lẻ.

---

## 3. Ngăn Xếp Công Nghệ Thực Tế (Locked Technology Stack)

Ngăn xếp công nghệ của Nexora đã được khóa theo quy chuẩn `AGENTS.md` và kiểm chứng trực tiếp trên mã nguồn:

```
+-----------------------------------------------------------------------------------+
|                                  NEXORA TECH STACK                                |
+-----------------------------------------------------------------------------------+
|  FRONTEND LAYER      : React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query |
|                        React Hook Form, Zod, Lucide React / FontAwesome           |
+-----------------------------------------------------------------------------------+
|  BACKEND API LAYER   : Node.js, Express.js 5, TypeScript, Modular Monolith        |
|                        Zod Schema Validation, Helmet, CORS, Rate Limiting         |
+-----------------------------------------------------------------------------------+
|  SHARED CONTRACTS    : @nexora/shared (Zod DTOs, TypeScript Types, Constants)     |
|                        @nexora/config (ESLint, Prettier, TSConfig Base)           |
+-----------------------------------------------------------------------------------+
|  PERSISTENCE LAYER   : MySQL 8.4 LTS, Prisma ORM 5.x, Prisma Migrate             |
|                        Strict Foreign Keys, Transactions, Decimal for Money       |
+-----------------------------------------------------------------------------------+
|  TESTING & QA        : Vitest (Unit & Integration), React Testing Library (Web),  |
|                        Supertest (API HTTP), Playwright (E2E Journeys)            |
+-----------------------------------------------------------------------------------+
|  DEVOPS & CONTAINER  : Docker, Docker Compose, Nginx Reverse Proxy,               |
|                        GitHub Actions CI/CD Pipeline                              |
+-----------------------------------------------------------------------------------+
```

---

## 4. Tình Trạng Hoàn Thành Của Các Giai Đoạn Dự Án

### Lịch Sử Các Milestone Đã Đóng (Chronological Milestones)

| Milestone | Tên gọi & Phạm vi | Trạng thái kỹ thuật | Commit hoàn tất | Bằng chứng nghiệm thu |
| :--- | :--- | :--- | :--- | :--- |
| **Phase A** | Kiến trúc nền tảng, Prisma ORM, Auth, Catalog, Admin Visual Parity | `PASS — CLOSED` | `5e2f511` ~ `db33932` | `01_PROJECT_INVENTORY.md` ~ `11_FINAL_PROJECT_AUDIT_REPORT.md` |
| **M1 & M2** | Backend Profile Khách hàng, Quản lý Sổ địa chỉ | `PASS — CLOSED` | `01a8f53` | `05_API_AND_BUSINESS_LOGIC_AUDIT.md` |
| **M3** | Backend Guest Cart Merge với khóa đồng thời `FOR UPDATE` | `PASS — CLOSED` | `68b1e4c`, `93fa529` | `M6_1_FINAL_CLOSURE_VERIFICATION.md` |
| **M4** | Backend Customer Reviews, Moderation & Chống lỗi P2002 | `PASS — CLOSED` | `29d2f4d`, `02b8a6d` | `22_M6_3_FINAL_CLOSURE_VERIFICATION.md` |
| **M5** | Backend Quy trình Đổi trả hàng (Returns) & Admin CRUD | `PASS — CLOSED` | `3c42638`, `7e3dcda` | `26_M6_4_FINAL_CLOSURE_VERIFICATION.md` |
| **M6.1** | Frontend Tích hợp Guest Cart Merge & API Foundation | `PASS — CLOSED` | `9880019`, `4c6c261` | `M6_1_FINAL_CLOSURE_VERIFICATION.md` |
| **M6.2** | Frontend Tích hợp Customer Profile, Address, Security | `PASS — CLOSED` | `b5ba48b` | `M6_2_FINAL_ACCEPTANCE_VERIFICATION.md` |
| **M6.3** | Frontend Tích hợp Đánh giá sản phẩm Customer Reviews | `PASS — CLOSED` | `e0e517b` | `22_M6_3_FINAL_CLOSURE_VERIFICATION.md` |
| **M6.4** | Frontend Tích hợp Đổi trả hàng Customer Returns | `PASS — CLOSED` | `3d8adb1` | `26_M6_4_FINAL_CLOSURE_VERIFICATION.md` |
| **M6.5** | Integration Testing & QA (Xử lý CR-01, CR-02, CR-03) | `PASS — CLOSED` | `6073152` | `37_M6_5_OFFICIAL_FINAL_ACCEPTANCE_REPORT.md` |

---

## 5. Kết Luận Bàn Giao Cốt Lõi (Handover Core Conclusion)

Repository Nexora tại commit `6073152` đạt trạng thái ổn định kỹ thuật cao nhất từ trước đến nay:
1. **Kiến trúc mạch lạc:** Mã nguồn sạch, phân chia rõ ràng giữa Presentation (`apps/web`), API Service (`apps/api`), và Contracts (`packages/shared`).
2. **Chất lượng kiểm thử tuyệt đối:** Toàn bộ 320 bài test tự động đều vượt qua, bao phủ từ Unit logic, tích hợp giao diện, tích hợp cơ sở dữ liệu MySQL 8.4, đến E2E Playwright.
3. **An toàn dữ liệu:** Database phát triển được bảo toàn nguyên trạng, không bị đột biến dữ liệu trong suốt quá trình kiểm thử và nghiệm thu.
4. **Sẵn sàng cho giai đoạn tiếp theo:** Hệ thống đã sẵn sàng để đội ngũ kỹ thuật mới hoặc chủ sở hữu tiếp quản, vận hành thử nghiệm và triển khai môi trường Production theo đúng khuyến nghị tại bộ tài liệu bàn giao này.
