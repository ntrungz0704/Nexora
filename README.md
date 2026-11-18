# Nexora — Nền tảng Thương mại Điện tử và Quản lý Cửa hàng Công nghệ

> **Trạng thái:** `Hoàn thành Nền tảng (Foundation Hardened)` | **Kiến trúc:** `Modular Monolith (npm Monorepo)` | **Mô hình nghiệp vụ:** `Cửa hàng đơn lẻ (Single-Vendor Store)` _(KHÔNG phải sàn thương mại điện tử đa gian hàng / Marketplace)_ | **Slogan:** `Smart Tech. Better Life.`

Nexora là dự án tái cấu trúc và hiện đại hóa toàn diện từ mã nguồn tham chiếu `TechPilot`, chuyên kinh doanh máy tính để bàn (PC), laptop, linh kiện phần cứng, phụ kiện và thiết bị ngoại vi công nghệ. Hệ thống tích hợp trực tiếp phân hệ quản lý vận hành nội bộ và công cụ phân tích hiệu quả tài chính **SellerMargin**.

---

## 1. Công nghệ Chính thức (Locked Tech Stack)

- **Giao diện người dùng (`apps/web`):** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form, Zod, Axios.
- **Dịch vụ máy chủ (`apps/api`):** Node.js 22 LTS, TypeScript, Express.js, Prisma Client, Zod, Helmet, CORS, Swagger/OpenAPI (`/api/docs`).
- **Cơ sở dữ liệu (`prisma/`):** MySQL 8.4 LTS (`utf8mb4`), Prisma ORM, Prisma Migrate, seeders dữ liệu mẫu an toàn bằng TypeScript.
- **Chất lượng mã nguồn & DevOps:** npm Workspaces, ESLint, Prettier, Vitest, Supertest, Playwright, Docker, Docker Compose, GitHub Actions.

---

## 2. Mô hình Nghiệp vụ & 3 Vai trò Người dùng (User Roles)

Nexora phục vụ **duy nhất MỘT cửa hàng bán lẻ công nghệ**. Hệ thống nghiêm cấm mọi hình thức mở rộng thành sàn thương mại điện tử (Marketplace), không cho phép đăng ký người bán ngoài (External Seller), không có chiết khấu hoa hồng gian hàng, không chia tách đơn hàng đa người bán.

Hệ thống có chính xác 3 vai trò tài khoản:

1. **ADMIN (Quản trị viên cấp cao):** Quản lý toàn quyền tài khoản, cấu hình hệ thống, phân quyền vai trò (RBAC), xem báo cáo tài chính tổng thể và nhật ký kiểm toán (Audit Logs).
2. **STAFF (Nhân viên nội bộ cửa hàng):** Nhân viên thuộc biên chế cửa hàng, trực tiếp vận hành danh mục sản phẩm (Catalog), kho hàng (Inventory), đơn hàng (Orders), nhà cung cấp (Suppliers), nhập hàng (Purchasing), bảo hành đổi trả (Returns & Warranty) và theo dõi chỉ số lợi nhuận **SellerMargin**.
3. **CUSTOMER (Khách hàng):** Người mua hàng trực tuyến, thực hiện tìm kiếm, xem chi tiết, giỏ hàng, đặt hàng (Checkout), thanh toán trực tuyến (VNPay), theo dõi đơn hàng, đánh giá sản phẩm và yêu cầu bảo hành.
4. _Ghi chú:_ `GUEST` là khách vãng lai chưa đăng nhập, chỉ có quyền xem danh mục công khai. Phân hệ **SellerMargin** là tên gọi của mô hình phân tích biên lợi nhuận của cửa hàng, không phải là vai trò tài khoản người dùng.

---

## 3. Cấu trúc Thư mục Dự án (Monorepo)

```text
Nexora/
├── AGENTS.md / GEMINI.md    # Quy tắc bắt buộc dành cho AI coding agents
├── .github/                 # Mẫu PR, Issue template, CODEOWNERS, CI workflow
├── apps/
│   ├── web/                 # @nexora/web — Ứng dụng Single Page Application (React + Vite)
│   └── api/                 # @nexora/api — Dịch vụ REST API (Express + Prisma)
├── packages/
│   ├── config/              # @nexora/config — Hằng số cấu hình không bảo mật dùng chung
│   └── shared/              # @nexora/shared — Hợp đồng dữ liệu DTO Zod và định dạng API chung
├── prisma/                  # Lược đồ MySQL 8.4, các file migration và kịch bản seed mẫu
├── docker/                  # Dockerfile tối ưu đa tầng cho API và Web
├── docker-compose.yml       # Môi trường container hoàn chỉnh (MySQL 8.4 + API + Web)
├── docs/                    # Tài liệu quản trị, chuẩn kỹ thuật, kiến trúc, database, roadmap
├── tests/                   # Cấu hình và kịch bản kiểm thử tự động Playwright E2E
├── TechPilot/               # [BẢO TỒN / BỎ QUA] Mã nguồn tham chiếu cũ (chỉ đọc)
└── audit-output/            # [BẢO TỒN / BỎ QUA] 13 báo cáo kiểm toán Phase 0
```

---

## 4. Danh sách Thành viên & Phân bổ Nhánh Git (Git Branches)

Dự án có 6 nhánh Git chính thức khởi tạo từ cùng một commit nền tảng:

| Thành viên                  | Mã số sinh viên | Email liên hệ                    | Tài khoản GitHub           | Nhánh phụ trách |
| :-------------------------- | :-------------- | :------------------------------- | :------------------------- | :-------------- |
| **Nguyễn Phạm Thành Trung** | PS47261         | `ntrungz0704@gmail.com`          | `@ntrungz0704` (Chủ dự án) | `main`, `trung` |
| **Nguyễn Minh Hiếu**        | PS47378         | `Minhhieu3901@gmail.com`         | `@hieungrx`                | `hieu`          |
| **Trần Ngọc Xuân Đình**     | PS47346         | `tranngocxuandinh2004@gmail.com` | Đang xác nhận              | `dinh`          |
| **Bàn Tiến Kim**            | PS47376         | `bantienkim204@gmail.com`        | Đang xác nhận              | `kim`           |
| **Lê Bùi Hồng Phúc**        | PS47318         | `lephuc34tanlap@gmail.com`       | `@lephuc34tanlap-dev`      | `phuc`          |

---

## 5. Hướng dẫn Cài đặt & Khởi chạy (Quickstart)

### Điều kiện tiên quyết

- **Node.js** phiên bản `>= 20` (khuyến nghị `v22.23.4`) và **npm** `>= 10` (`10.9.9`).
- **Docker Desktop** (đang chạy engine Linux để phục vụ container MySQL 8.4).

### Các bước khởi chạy môi trường phát triển (Local Development)

```bash
# 1. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env

# 2. Cài đặt toàn bộ thư viện trong monorepo
npm install

# 3. Khởi động container MySQL 8.4
docker compose up -d mysql

# 4. Sinh Prisma Client, áp dụng migrations và nạp dữ liệu mẫu an toàn
npm run db:generate
npm run db:deploy
npm run db:seed

# 5. Khởi chạy đồng thời Backend (port 3000) và Frontend (port 5173)
npm run dev
```

### Các lệnh kiểm tra chất lượng bắt buộc (Quality Gates)

```bash
npm run typecheck     # Kiểm tra kiểu dữ liệu TypeScript toàn bộ packages và apps
npm run lint          # Kiểm tra chuẩn cú pháp mã nguồn bằng ESLint
npm run format:check  # Kiểm tra định dạng mã nguồn bằng Prettier
npm run test          # Chạy kiểm thử đơn vị (Unit Tests) với Vitest
npm run test:integration # Chạy kiểm thử tích hợp thực tế với MySQL 8.4
npm run test:e2e      # Chạy kiểm thử giao diện đầu cuối với Playwright
npm run build         # Biên dịch mã nguồn production cho toàn bộ hệ thống
```

---

## 6. Quy định Bắt buộc về Quy trình Git & Commit Messages

1. **Ngôn ngữ commit:** Toàn bộ thông điệp commit Git bắt buộc phải viết bằng **tiếng Việt không dấu** theo định dạng Conventional Commits.
   - Ví dụ: `feat(auth): khoi tao module dang nhap va phan quyen rbac`
   - Ví dụ: `fix(order): sua loi tinh tien giam gia don hang`
   - Ví dụ: `docs(readme): cap nhat tai lieu tieng viet cho du an`
2. **Quy tắc làm việc trên nhánh:**
   - Các thành viên làm việc độc lập trên nhánh cá nhân của mình (`trung`, `hieu`, `kim`, `dinh`, `phuc`).
   - Mọi thay đổi đưa vào nhánh `main` phải thông qua Pull Request, vượt qua quy trình kiểm thử tự động của GitHub Actions (`Nexora CI`).
   - Tuyệt đối không force push (`git push -f`) lên nhánh `main`.
