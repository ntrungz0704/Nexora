# 26. Final Technical Handover & Onboarding Checklist

## 1. Thiết lập môi trường phát triển cho Kỹ sư mới (Quickstart)

1. Cài đặt **Node.js >= 20** (khuyến nghị v22 LTS) và **Docker Desktop**.
2. Clone repository: `git clone https://github.com/ntrungz0704/Nexora.git`
3. Sao chép `.env.example` thành `.env` và cấu hình `DATABASE_URL`, `AUTH_SECRET` (>= 32 ký tự), `MYSQL_*` (tùy chọn thêm `VNPAY_*`, `SMTP_*`, `GEMINI_API_KEY`).
4. Khởi động MySQL 8.4: `npm run docker:up` (hoặc `docker compose up -d mysql`).
5. Cài đặt dependencies & tạo Prisma Client: `npm ci && npm run db:generate`.
6. Áp dụng migrations & seed dữ liệu: `npm run db:deploy && npm run db:seed`.
7. Khởi chạy đồng thời API (:3000) & Web (:5173): `npm run dev`.
8. Truy cập:
   - Storefront: `http://localhost:5173`
   - Admin Portal: `http://localhost:5173/admin`
   - Swagger API Docs: `http://localhost:3000/api/docs`
   - Healthcheck: `http://localhost:3000/api/v1/health`

---

## 2. Handover Verification Sign-Off Checklist

|   # | Hạng mục bàn giao                                                                                           | Trạng thái xác minh         | Tài liệu tham chiếu    |
| --: | ----------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------- |
|   1 | Kiến trúc Single-Vendor & Locked Tech Stack được xác minh thực tế                                           | **PASS (Hybrid CSS noted)** | `00`, `04`, `05`, `12` |
|   2 | 100% cây thư mục & 602 tệp tin active đã được kiểm kê không rút gọn                                         | **PASS**                    | `01`, `02`, `23`       |
|   3 | 119 file source code đã trích xuất đầy đủ symbols/imports/exports/DB/API                                    | **PASS**                    | `03`                   |
|   4 | 82 Frontend routes & 85 Backend REST API endpoints đã lập tài liệu đầy đủ                                   | **PASS**                    | `04`, `06`             |
|   5 | 24 Prisma models, 9 enums, ERD Mermaid, 4 migrations & MySQL 8.4.13 runtime verified                        | **PASS**                    | `09`, `10`             |
|   6 | 11 sơ đồ Mermaid nghiệp vụ khớp mã nguồn thực tế                                                            | **PASS**                    | `07`, `08`, `14`       |
|   7 | 4 hệ thống AI đã phân tích minh bạch LLM vs Deterministic vs Rule/Heuristic                                 | **PASS**                    | `13`                   |
|   8 | Kiểm toán bảo mật đã khoanh vùng rõ các lỗ hổng P0/P1 cần sửa trước Go-Live                                 | **PASS (3 P0 Open)**        | `11`, `25`             |
|   9 | Quality Gates (`typecheck`, `lint`, `build`, `prisma`, 64 Vitest) PASS; Prettier drift & CI gap đã ghi nhận | **PARTIAL**                 | `16`, `17`             |
|  10 | Static assets (288 files), dependencies (5 workspaces) & technical debt đã kiểm kê                          | **PASS**                    | `18`, `19`, `20`, `21` |
|  11 | Đối chiếu TechPilot → Nexora Parity Matrix có bằng chứng, không nâng khống PASS                             | **PASS**                    | `22`                   |
|  12 | Đã giữ nguyên trạng 100% source code, DB, Git history theo Audit Rules                                      | **PASS**                    | `24`                   |
