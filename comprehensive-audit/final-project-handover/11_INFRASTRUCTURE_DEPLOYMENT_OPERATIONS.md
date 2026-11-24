# 11 — Infrastructure, Deployment, and Operations

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-11`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM DOCKER, CI & CONFIGURATION FILES`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Hạ Tầng Đóng Gói Ứng Dụng (Container Infrastructure)

Nexora được đóng gói toàn diện bằng công nghệ container chuẩn hóa thông qua **Docker** và **Docker Compose**:

### A. Tệp điều phối trung tâm: `docker-compose.yml` (75 dòng)
Quản lý 3 dịch vụ liên kết chặt chẽ trong mạng nội bộ:
1. **Dịch vụ `mysql`:**
   - Image chính thức: `mysql:8.4` (LTS).
   - Biến môi trường: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE: nexora`, `MYSQL_USER: nexora`, `MYSQL_PASSWORD`.
   - Cổng công khai: `3306:3306`.
   - Khối lượng lưu trữ (Volume): `nexora_mysql_data_v2:/var/lib/mysql`.
   - Lệnh khởi động tối ưu: `--character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci`.
   - Healthcheck: Kiểm tra `mysqladmin ping` định kỳ 10s, timeout 5s, tối đa 20 lần thử.
2. **Dịch vụ `api` (Backend Express):**
   - Xây dựng từ: `docker/api.Dockerfile`.
   - Tên container: `nexora-api`.
   - Phụ thuộc (Depends on): `mysql` với điều kiện `condition: service_healthy`.
   - Cổng công khai: `3000:3000`.
   - Healthcheck: Sử dụng Node.js gọi thẳng endpoint `http://127.0.0.1:3000/api/v1/health`.
3. **Dịch vụ `web` (Frontend Single Page Application):**
   - Xây dựng từ: `docker/web.Dockerfile`.
   - Tên container: `nexora-web`.
   - Phụ thuộc: `api` với điều kiện `condition: service_healthy`.
   - Cổng công khai: `5173:80` (được phục vụ thông qua máy chủ web Nginx).
   - Healthcheck: Kiểm tra `wget -qO- http://127.0.0.1/`.

### B. Multi-stage Dockerfiles
- **`docker/api.Dockerfile`:** Sử dụng multi-stage build với base image `node:22-alpine`. Giai đoạn 1 (`builder`) biên dịch TypeScript và sinh Prisma Client; Giai đoạn 2 (`runner`) chỉ sao chép các gói dist và production dependencies, giúp kích thước image nhẹ và an toàn.
- **`docker/web.Dockerfile`:** Giai đoạn 1 sử dụng Node.js để chạy `npm run build` cho Vite SPA; Giai đoạn 2 sao chép thư mục `dist` vào `nginx:alpine` kèm file cấu hình tối ưu `docker/nginx/default.conf`.
- **`docker/nginx/default.conf`:** Cấu hình Nginx phục vụ Single Page Application với `try_files $uri $uri/ /index.html;`, bật Gzip compression, cấu hình cache headers cho static assets và reverse proxy an toàn cho API.

---

## 2. Đường Ống Tự Động Hóa CI/CD (GitHub Actions Workflow)

Định nghĩa tại `.github/workflows/ci.yml` (120 dòng), kích hoạt tự động khi có `push` lên các branch chính thức (`main`, `trung`, `hieu`, `kim`, `dinh`, `phuc`) hoặc `pull_request` vào `main`.

Quy trình bao gồm 2 Jobs tuần tự:
```
[ Job 1: quality-and-build ]
  ├── 1. Checkout repository & Setup Node.js 22 với bộ đệm npm cache
  ├── 2. Cài đặt dependencies sạch: npm ci
  ├── 3. Sinh Prisma Client & Kiểm tra tính hợp lệ của Schema: npx prisma validate
  ├── 4. Kiểm tra kiểu tĩnh toàn bộ Workspaces: npm run typecheck
  ├── 5. Phân tích mã nguồn tĩnh: npm run lint
  ├── 6. Kiểm tra quy chuẩn định dạng: npm run format:check
  ├── 7. Chạy bộ kiểm thử Unit & Frontend Flow không cần DB: npm run test:unit
  └── 8. Biên dịch sản phẩm production: npm run build
  ▼ (Chỉ chạy khi Job 1 thành công)
[ Job 2: mysql-integration ]
  ├── 1. Khởi tạo dịch vụ MySQL 8.4 container tạm thời trên GitHub runner
  ├── 2. Biên dịch packages & Sinh Prisma Client
  ├── 3. Chờ đợi MySQL 8.4 sẵn sàng tiếp nhận kết nối
  ├── 4. Triển khai toàn bộ 8 migrations: npm run db:deploy
  ├── 5. Nạp dữ liệu mẫu an toàn: npm run db:seed
  ├── 6. Chạy bộ kiểm thử tích hợp & bảo mật hoàn chỉnh: npm run test
  └── 7. Chạy kiểm thử hợp đồng database: npm run test:integration -w @nexora/api
```

---

## 3. Quản Lý Cấu Hình & Biến Môi Trường (Environment Management)

Hệ thống quản lý biến môi trường tập trung thông qua `.env` và xác thực qua schema Zod nghiêm ngặt tại `apps/api/src/config/env.ts`.

| Tên biến môi trường | Mô tả vai trò | Bắt buộc trên Production | Giá trị mẫu an toàn |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Môi trường thực thi (`development`, `test`, `production`) | **CÓ** | `production` |
| `API_PORT` | Cổng dịch vụ HTTP của Express | Không (mặc định 3000) | `3000` |
| `DATABASE_URL` | Chuỗi kết nối tới cơ sở dữ liệu MySQL 8.4 | **CÓ** | `mysql://user:pass@host:3306/nexora` |
| `AUTH_SECRET` | Khóa bí mật dùng để ký và giải mã JWT (>= 32 ký tự) | **CÓ** | Chuỗi băm ngẫu nhiên 64 ký tự |
| `CLIENT_URL` | URL gốc của Frontend Web | **CÓ** | `https://nexora.vn` |
| `SERVER_URL` | URL gốc của Backend API | **CÓ** | `https://api.nexora.vn` |
| `CORS_ALLOWED_ORIGINS`| Danh sách origin được phép gọi API (phân tách bởi dấu phẩy) | **CÓ** | `https://nexora.vn` |
| `VNPAY_TMN_CODE` | Mã định danh Merchant cấp bởi VNPay Sandbox/Prod | Khi tích hợp VNPay | `NEXORADEMO` |
| `VNPAY_HASH_SECRET` | Khóa bí mật băm dữ liệu HMAC-SHA512 của VNPay | Khi tích hợp VNPay | Chuỗi bí mật ký số |
| `GEMINI_API_KEY` | Khóa API truy cập Google Gemini AI LLM | Khi dùng AI | `AIzaSy...` |

---

## 4. Khả Năng Vận Hành Hệ Thống (Operational Capabilities)

1. **Giám sát sức khỏe dịch vụ (Health Check):**
   - Endpoint: `GET /api/v1/health`
   - Phản hồi: `{"success": true, "data": {"status": "ok", "db": "connected", "uptime": 12345}}`
   - Kiểm tra trực tiếp khả năng thực thi truy vấn của Prisma vào MySQL. Nếu DB mất kết nối, trả về HTTP `503 Service Unavailable`.
2. **Tắt ứng dụng an toàn (Graceful Shutdown):**
   - Lắng nghe tín hiệu `SIGTERM` và `SIGINT` tại `apps/api/src/server.ts`.
   - Khi nhận tín hiệu dừng, máy chủ ngừng tiếp nhận request mới, đợi các request đang xử lý hoàn tất, sau đó ngắt kết nối Prisma Client an toàn để không gây hỏng giao dịch trong cơ sở dữ liệu.
3. **Ghi nhật ký (Logging):**
   - Ghi log có cấu trúc tại console chuẩn của container (stdout/stderr).
   - Tương thích tốt với các hệ thống gom log tập trung như Docker Logging Driver, Grafana Loki, hoặc AWS CloudWatch.

---

## 5. Ma Trận Đánh Giá Mức Độ Sẵn Sàng Triển Khai (Readiness Matrix)

| Môi trường vận hành | Tình trạng kỹ thuật | Đánh giá mức độ sẵn sàng |
| :--- | :---: | :--- |
| **Local Development** | `ACTIVE & VERIFIED` | Sẵn sàng 100%. Chạy mượt mà qua `docker compose up` hoặc `npm run dev`. |
| **CI Automation** | `ACTIVE & VERIFIED` | Sẵn sàng 100%. GitHub Actions chạy trơn tru, kiểm thử toàn diện cả 320 tests. |
| **Staging Environment** | `CONFIGURED` | Đã có Dockerfiles và Compose. Cần hạ tầng máy chủ VPS (Ubuntu) để nạp container. |
| **Production Environment** | `DEFERRED / NOT CONFIGURED` | Cần bổ sung chứng chỉ SSL HTTPS (Let's Encrypt), cấu hình domain chính thức, tài khoản VNPay Merchant thật, và dịch vụ gửi email SMTP/SES thật. |
