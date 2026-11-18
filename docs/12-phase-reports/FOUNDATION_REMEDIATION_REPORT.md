# Báo cáo Khắc phục và Nghiệm thu Nền tảng (Foundation Remediation & Acceptance Report)

- **Dự án:** Nexora
- **Slogan:** Smart Tech. Better Life.
- **Mô hình nghiệp vụ:** Single-Vendor E-Commerce & Store Management System (Cửa hàng đơn lẻ; KHÔNG phải Marketplace)
- **Ngày thực hiện:** 2026-11-19
- **Nhánh thực hiện:** `trung` & chuẩn bị đồng bộ vào `main`
- **Chủ dự án / Lead:** Nguyễn Phạm Thành Trung (`@ntrungz0704`)

---

## 1. Tóm tắt Tổng quan (Executive Summary)

Theo yêu cầu chuẩn hóa nền tảng từ chủ dự án, đợt rà soát và khắc phục (Foundation Remediation) đã xử lý triệt để các vấn đề:

1. **Đồng bộ vai trò người dùng (User Roles):** Loại bỏ hoàn toàn vai trò `SELLER` trong mã nguồn và cơ sở dữ liệu; áp dụng migration mới chuyển đổi an toàn thành `STAFF` (nhân viên nội bộ cửa hàng). 3 vai trò chính thức là `CUSTOMER`, `STAFF`, `ADMIN`. Phân hệ **SellerMargin** được giữ nguyên tên gọi làm công cụ phân tích hiệu quả tài chính của cửa hàng.
2. **Khôi phục và kiểm chứng Docker:** Khởi động lại Docker Desktop daemon, kiểm tra container `nexora-mysql` (`mysql:8.4` LTS) trạng thái `healthy`, áp dụng migration và nạp seed dữ liệu mẫu an toàn.
3. **Kiểm thử tự động Playwright E2E:** Cài đặt Chromium headless, cấu hình `webServer` trong `tests/playwright.config.ts`, xử lý CORS cho cả `localhost` và `127.0.0.1`, chạy thành công kịch bản kiểm thử đầu cuối kết nối thực tế giữa Frontend React, Backend Express và MySQL 8.4 database (`1 passed`).
4. **Đồng bộ đội ngũ và chế độ công khai trên GitHub:** Chuyển đổi repository `https://github.com/ntrungz0704/Nexora` sang chế độ **Public**, gửi lời mời làm Collaborator qua GitHub CLI cho `@hieungrx` và `@lephuc34tanlap-dev`, cập nhật danh sách email đầy đủ vào `.github/CODEOWNERS`.
5. **Chuẩn hóa ngôn ngữ và tài liệu:** Viết lại `README.md` sang 100% tiếng Việt, thiết lập quy chuẩn bắt buộc toàn bộ commit Git tiếp theo phải viết bằng **tiếng Việt không dấu**.

---

## 2. Các Vấn đề Phát hiện & Phân tích Nguyên nhân

| STT | Vấn đề phát hiện                 | Hiện trạng trước khi sửa                         | Nguyên nhân                                                 | Tác động                                                    |
| :-- | :------------------------------- | :----------------------------------------------- | :---------------------------------------------------------- | :---------------------------------------------------------- |
| 1   | Vai trò người dùng chứa `SELLER` | `users.role` enum: `CUSTOMER`, `SELLER`, `ADMIN` | Kế thừa tên gọi từ tài liệu audit sơ khởi                   | Gây hiểu nhầm là sàn Marketplace đa người bán               |
| 2   | Migration cũ đã được áp dụng     | Migration `init_foundation` đã khóa trên MySQL   | Không được sửa migration cũ đã applied                      | Cần tạo migration mới an toàn bằng SQL mở rộng/thu hẹp enum |
| 3   | Docker Desktop daemon bị treo    | Lỗi kết nối named pipe engine Linux              | Tiến trình daemon bị ngắt trong lúc commit layer nặng       | Tiêu chí AC-18 bị đánh dấu `PARTIAL`                        |
| 4   | Playwright E2E chưa chạy live    | Chưa có kết quả thực tế trên database            | Thiếu browser binary Chromium và chưa cấu hình webServer    | Nghi ngờ tính năng tích hợp đầu cuối giữa FE và BE          |
| 5   | Lỗi CORS khi Playwright chạy     | Origin `http://127.0.0.1:5173` bị từ chối        | `CORS_ALLOWED_ORIGINS` chỉ khai báo `http://localhost:5173` | Playwright không tải được dữ liệu từ API qua `127.0.0.1`    |
| 6   | Repository đang ở chế độ Private | Repository `ntrungz0704/Nexora` là `PRIVATE`     | Mặc định cấu hình an toàn ban đầu                           | Cần mở Public theo yêu cầu đánh giá đồ án của chủ dự án     |
| 7   | Chưa mời đủ thành viên nhóm      | Thiếu email và tài khoản GitHub của 4 thành viên | Danh sách thành viên chưa được cung cấp chính thức          | Chưa phân quyền đóng góp mã nguồn cho các bạn               |

---

## 3. Các Thay đổi Đã Thực hiện

1. **Tạo Migration `20261118175000_rename_user_role_seller_to_staff`:**
   - Mở rộng enum `role` thành `('CUSTOMER', 'SELLER', 'STAFF', 'ADMIN')`.
   - Cập nhật an toàn bản ghi seed cũ từ `seller.demo@nexora.test` thành `staff.demo@nexora.test`, đổi vai trò thành `STAFF`.
   - Thu hẹp enum `role` về `('CUSTOMER', 'STAFF', 'ADMIN')`.
   - Áp dụng thành công qua `npx prisma migrate deploy` và nạp seed qua `npm run db:seed`.
2. **Cập nhật Mã nguồn Ứng dụng & Hợp đồng DTO:**
   - `@nexora/config`: `NEXORA_ROLES = ['CUSTOMER', 'STAFF', 'ADMIN']`, bổ sung `NEXORA_SLOGAN = 'Smart Tech. Better Life.'`.
   - `@nexora/shared`: Bổ sung `UserRoleSchema = z.enum(NEXORA_ROLES)`.
   - `apps/web`: Cập nhật route guards, giao diện `FoundationDashboard` và test Vitest.
   - `apps/api`: Cập nhật cấu hình CORS cho phép cả `localhost` và `127.0.0.1`.
3. **Cấu hình và Chạy Playwright E2E:**
   - Cài đặt Playwright Chromium v1255.
   - Cập nhật `tests/playwright.config.ts` tự động khởi chạy backend và frontend khi test.
   - Kiểm thử thành công kịch bản roundtrip: Render giao diện -> kiểm tra trạng thái API ONLINE -> kiểm tra kết nối MySQL 8.4 UP -> gửi request chẩn đoán qua Zod -> nhận echo phản hồi (`1 passed in 2.7s`).
4. **Cấu hình GitHub:**
   - Đổi visibility của `ntrungz0704/Nexora` thành `PUBLIC` qua GitHub CLI.
   - Mời `@hieungrx` và `@lephuc34tanlap-dev` với quyền push.
   - Cập nhật `.github/CODEOWNERS` với danh sách 5 thành viên kèm mã sinh viên và email.
5. **Tài liệu & Chuẩn hóa Ngôn ngữ:**
   - Viết lại `README.md` thành 100% tiếng Việt.
   - Thiết lập quy tắc bắt buộc commit Git bằng **tiếng Việt không dấu** trong `AGENTS.md` và `GEMINI.md`.
   - Chuẩn hóa lộ trình 13 Phase trong `docs/project/ROADMAP.md` và `docs/project/PHASE_STATUS.md`.
   - Lập ma trận chuyển đổi trong `docs/migration/LEGACY_TO_NEXORA_MIGRATION_MATRIX.md`.

---

## 4. Danh sách File Đã Tạo / Sửa đổi

### File tạo mới

- `prisma/migrations/20261118175000_rename_user_role_seller_to_staff/migration.sql`
- `docs/migration/LEGACY_TO_NEXORA_MIGRATION_MATRIX.md`
- `docs/project/PHASE_STATUS.md`
- `docs/12-phase-reports/FOUNDATION_REMEDIATION_REPORT.md`

### File sửa đổi

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `packages/config/src/index.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/shared.test.ts`
- `apps/web/src/routes/AppRoutes.tsx`
- `apps/web/tests/FoundationDashboard.test.tsx`
- `apps/api/src/config/env.ts`
- `.env.example` & `.env`
- `tests/playwright.config.ts`
- `tests/e2e/foundation.spec.ts`
- `README.md`
- `.github/CODEOWNERS`
- `AGENTS.md`
- `GEMINI.md`
- `docs/database/ERD.md`
- `docs/database/DATA_DICTIONARY.md`
- `docs/governance/DECISION_LOG.md`
- `docs/governance/PROJECT_CHARTER.md`
- `docs/governance/PROJECT_SCOPE.md`
- `docs/project/ROADMAP.md`

---

## 5. Dữ liệu Cơ sở Dữ liệu Thực tế Sau Migration

Truy vấn trực tiếp từ container `nexora-mysql` (`mysql:8.4`):

```sql
SELECT id, email, full_name, role, status, created_at, updated_at FROM users;
```

| id  | email                       | full_name            | role       | status   | created_at              | updated_at              |
| :-- | :-------------------------- | :------------------- | :--------- | :------- | :---------------------- | :---------------------- |
| 1   | `admin.demo@nexora.test`    | Nexora Demo Admin    | `ADMIN`    | `ACTIVE` | 2026-11-18 16:28:15.973 | 2026-11-18 18:02:25.012 |
| 2   | `staff.demo@nexora.test`    | Nexora Demo Staff    | `STAFF`    | `ACTIVE` | 2026-11-18 16:28:16.225 | 2026-11-18 18:02:26.625 |
| 3   | `customer.demo@nexora.test` | Nexora Demo Customer | `CUSTOMER` | `ACTIVE` | 2026-11-18 16:28:16.421 | 2026-11-18 18:02:26.777 |

Lược đồ bảng `users` sau khi migration áp dụng:

```sql
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('CUSTOMER','STAFF','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `idx_users_role_status` (`role`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Kết quả Kiểm thử Chất lượng (Quality Gates)

| Lệnh kiểm tra              | Kết quả             | Chi tiết output                                                                |
| :------------------------- | :------------------ | :----------------------------------------------------------------------------- |
| `npm run typecheck`        | **PASS** (`exit=0`) | `@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` sạch lỗi kiểu |
| `npm run lint`             | **PASS** (`exit=0`) | ESLint quét toàn bộ repository: `0` errors, `0` warnings                       |
| `npm run format:check`     | **PASS** (`exit=0`) | `All matched files use Prettier code style!`                                   |
| `npm run test`             | **PASS** (`exit=0`) | Vitest: 3 test files, 7 tests passed (bao gồm kiểm tra 3 role mới)             |
| `npm run test:integration` | **PASS** (`exit=0`) | Kết nối MySQL 8.4 qua Prisma Client và Supertest: `1 passed`                   |
| `npm run test:e2e`         | **PASS** (`exit=0`) | Playwright Chromium: `1 passed (2.7s)`                                         |
| `npm run build`            | **PASS** (`exit=0`) | Production build thành công: `@nexora/api` tsc + `@nexora/web` Vite bundle     |

---

## 7. Trạng thái GitHub & Đội ngũ Dự án

- **Repository URL:** `https://github.com/ntrungz0704/Nexora`
- **Visibility:** `PUBLIC` (Đã chuyển đổi công khai thành công)
- **Collaborators đã mời:**
  - `@hieungrx` (Nguyễn Minh Hiếu - PS47378 - `Minhhieu3901@gmail.com`) -> Lời mời đang chờ chấp nhận.
  - `@lephuc34tanlap-dev` (Lê Bùi Hồng Phúc - PS47318 - `lephuc34tanlap@gmail.com`) -> Lời mời đang chờ chấp nhận.
  - Trần Ngọc Xuân Đình (`tranngocxuandinh2004@gmail.com`) & Bàn Tiến Kim (`bantienkim204@gmail.com`) -> Đã ghi nhận thông tin và sẵn sàng thêm ngay khi có username GitHub.

---

## 8. Ma trận Nghiệm thu Cập nhật (Acceptance Matrix)

- **AC-01 -> AC-17:** `PASS`
- **AC-18 (Docker / MySQL Environment):** `PASS` (MySQL 8.4 healthy, migrate và seed thành công; các container chạy ổn định).
- **AC-19 -> AC-25:** `PASS`
- **Tiêu chí mới — Playwright E2E Live DB:** `PASS` (`1 passed (2.7s)`).
- **Tiêu chí mới — Role STAFF Migration:** `PASS` (Hoàn tất chuyển đổi dữ liệu và enum an toàn).
- **Tiêu chí mới — Public Repository & Collaborators:** `PASS`.

---

## 9. Đề xuất Bước Tiếp theo (Phase 4 — Identity & RBAC)

Nền tảng kỹ thuật và các quy tắc đã được khóa chặt chẽ và nghiệm thu đạt 100%. Bước tiếp theo là triển khai **Phase 4 (Identity & RBAC)** trực tiếp trên nhánh `main`:

1. Thiết kế bảng `users` mở rộng (mật khẩu băm Argon2id/bcrypt, trạng thái xác thực email), bảng phiên đăng nhập/refresh token `user_sessions`, và bảng sổ địa chỉ khách hàng `customer_addresses`.
2. Tạo Prisma migration cho Phase 4 và cập nhật ERD / Data Dictionary.
3. Triển khai API Authentication (Đăng ký, Đăng nhập, Đăng xuất, Quên mật khẩu, Đổi mật khẩu) kết hợp middleware phân quyền RBAC (`CUSTOMER`, `STAFF`, `ADMIN`).
4. Xây dựng giao diện Đăng ký / Đăng nhập và Trang quản lý hồ sơ cá nhân trên Frontend React.
