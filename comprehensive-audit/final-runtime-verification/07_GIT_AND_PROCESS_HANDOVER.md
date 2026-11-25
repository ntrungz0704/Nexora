# 07. GIT INTEGRITY & LIVE PROCESS HANDOVER

---

## 1. Git Integrity Before & After Audit

| Hạng mục kiểm tra | Trước Audit (`01_preflight_git_env.log`) | Sau Audit (Verify cuối phiên) | Kết luận |
| --- | --- | --- | --- |
| **Workspace** | `D:\Nexora` | `D:\Nexora` | Khớp |
| **Branch** | `main` | `main` | Không đổi |
| **HEAD Commit** | `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` | `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` | Không đổi *(+3 commit sau baseline M6.5 `6073152`, không reset)* |
| **Ahead / Behind vs `origin/main`** | `0 / 0` | `0 / 0` | Đồng bộ |
| **Tracked Modified (`git diff --stat`)** | Trống (`0` file) | Trống (`0` file) | **CLEAN** |
| **Staged Changes (`git diff --cached --stat`)** | Trống (`0` file) | Trống (`0` file) | **CLEAN** |
| **Untracked Paths (`git status --short`)** | `?? comprehensive-audit/runtime-launch/` | `?? comprehensive-audit/final-runtime-verification/`<br>`?? comprehensive-audit/runtime-launch/` | Chỉ chứa 2 thư mục báo cáo audit; **0 commit / 0 push** |
| **Legacy `TechPilot/`** | `False` (không tồn tại trên đĩa) | `False` (không tồn tại trên đĩa) | An toàn, không đụng chạm |

---

## 2. Running Website & API Status (Verified Live URLs)

Website và Backend API hiện **đang chạy thực tế** để Project Owner truy cập kiểm tra ngay:

| Thành phần | URL truy cập | Kết quả Verify cuối phiên | Ghi chú |
| --- | --- | --- | --- |
| **Customer Storefront** | `http://localhost:5173/` | `HTTP 200` (`12.7 ms`, `1,950` bytes HTML `<html lang="vi">`) | Đang phục vụ qua Vite dev server |
| **Admin Portal** | `http://localhost:5173/admin` | `HTTP 200` (SPA route) | Đăng nhập qua `admin@nexora.local` / `staff@nexora.local` (mật khẩu mặc định từ `prisma/seed.ts`, không hiển thị plaintext) |
| **Backend REST API Base** | `http://localhost:3000/api/v1` | Active | Mount đầy đủ 10 nhóm module routers (`app.ts` / `routes/index.ts`) |
| **API Health Endpoint** | `http://localhost:3000/api/v1/health` | `HTTP 200` (`46.2 ms`, `"status":"ok","database":"up","uptimeSeconds":554`) | Lưu ý: `http://localhost:3000/health` (root không prefix) trả `404` |
| **System Metadata** | `http://localhost:3000/api/v1/system/meta` | `HTTP 200` (`16.1 ms`) | `businessModel: "single-vendor"`, `storeSettingsCount: 5`, `usersCount: 3` |
| **Swagger / OpenAPI JSON** | `http://localhost:3000/api/docs.json` | `HTTP 200` (`11.8 ms`, `1,136` bytes) | Interactive UI tại `http://localhost:3000/api/docs` |
| **Dev MySQL Database** | `127.0.0.1:3306` (`nexora`) | Docker `nexora-mysql-1` (`healthy`) | Container ID `7ffc1a14a558`, MySQL `8.4.13` |

---

## 3. Exact Running PIDs, Ports & Stop Commands

*(Đã kiểm chứng trực tiếp bằng `Get-NetTCPConnection` và `Win32_Process` — Tuyệt đối không động chạm tiến trình bên ngoài phiên dự án.)*

| Vai trò tiến trình | Port | PID chính xác | Parent PID | Command Line thực tế | Lệnh dừng chính xác (PowerShell) |
| --- | :---: | ---: | ---: | --- | --- |
| **Vite Web Server** *(Task `task-22812`)* | `::5173` | **`32852`** | `13048` (`npm run dev -w @nexora/web`) <- **`16932`** (`npm run dev:web`) | `node ...\vite\bin\vite.js --port 5173` | `taskkill /PID 16932 /T /F` *(hoặc `taskkill /PID 32852 /T /F`)* |
| **Express API Worker** *(Task `task-22981`)* | `::3000` | **`13588`** | **`35208`** (`tsx watch src/server.ts`) | `node.exe --import tsx src/server.ts` | `taskkill /PID 11684 /T /F` *(hoặc `taskkill /PID 35208 /T /F`)* |
| **npm Backend Wrapper** | — | **`11684`** / `33524` | — | `npm run dev:api` -> `npm run dev -w @nexora/api` | Bao gồm khi dùng `/T` ở lệnh trên |
| **MySQL 8.4 Container** | `3306` | Docker `nexora-mysql-1` | Docker Desktop | `mysql:8.4` (`healthy`, giữ nguyên phục vụ app) | `docker compose stop mysql` *(chỉ chạy nếu muốn tắt cả DB)* |

### Lệnh khởi chạy lại dự phòng (nếu phiên IDE đóng hoặc máy sleep làm dừng tiến trình nền)
```powershell
cd D:\Nexora
docker compose up -d mysql
# Mở Terminal 1 (Backend API :3000):
npm run dev:api
# Mở Terminal 2 (Frontend Web :5173):
npm run dev:web
```
