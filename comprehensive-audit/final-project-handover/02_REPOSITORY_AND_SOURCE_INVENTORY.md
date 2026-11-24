# 02 — Repository and Source Inventory

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-02`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY VIA REPO SCAN`
- **Branch:** `main` | **HEAD:** `607315261fcf802c517e0d32e210817d2080341d`

---

## 1. Cấu Trúc Phân Cấp Thư Mục (Folder Hierarchy)

Nexora được cấu trúc theo mô hình **Monorepo** chuẩn mực sử dụng **npm Workspaces**. Cây thư mục cấp cao và vai trò của từng khu vực:

```
d:/Nexora/
├── .github/                      # Cấu hình tự động hóa CI/CD GitHub Actions
│   └── workflows/ci.yml          # Pipeline kiểm thử chất lượng, Typecheck, Lint, Test & Build
├── apps/                         # Không gian ứng dụng thực thi (Application Workspaces)
│   ├── api/                      # Backend REST API Service (Node.js, Express 5, TypeScript)
│   │   ├── src/                  # Mã nguồn chính API (Controllers, Services, Middlewares)
│   │   └── tests/                # Bộ kiểm thử Unit, Integration và Security cho API
│   └── web/                      # Frontend Single Page Application (React 19, Vite, Tailwind CSS)
│       ├── public/               # Static assets (Favicons, Logo, Banners, Product images)
│       ├── src/                  # Mã nguồn chính Web (Features, Components, Routes, Services)
│       └── tests/                # Bộ kiểm thử Component và luồng giao diện (Vitest, RTL)
├── packages/                     # Thư viện dùng chung nội bộ (Shared Workspaces)
│   ├── shared/                   # DTOs Zod Schemas, TypeScript Interfaces, Constants dùng chung
│   └── config/                   # Cấu hình chuẩn hóa dùng chung (ESLint, Prettier, TSConfig)
├── prisma/                       # Quản lý cơ sở dữ liệu và lược đồ ORM
│   ├── migrations/               # 8 bản ghi di chuyển dữ liệu (Prisma Migrations) đã áp dụng
│   ├── schema.prisma             # Định nghĩa 26 Data Models và 11 Enums
│   ├── seed.ts                   # Kịch bản khởi tạo dữ liệu mẫu tổng hợp an toàn
│   ├── seed_nexora_catalog.sql   # Dữ liệu danh mục 674 sản phẩm nhập từ TechPilot
│   └── seed_techpilot_full.ts    # Script bóc tách dữ liệu gốc TechPilot sang Prisma
├── docker/                       # Cấu hình đóng gói container
│   ├── api.Dockerfile            # Multi-stage Dockerfile cho Backend API
│   ├── web.Dockerfile            # Multi-stage Dockerfile đóng gói Frontend SPA
│   ├── nginx/                    # Cấu hình Nginx reverse proxy (default.conf)
│   └── mysql/                    # Cấu hình phân quyền MySQL ban đầu
├── tests/                        # Kiểm thử cấp hệ thống
│   └── e2e/                      # Playwright E2E Spec (Foundation & Storefront Journeys)
├── docs/                         # Toàn bộ hồ sơ kiến trúc, tiêu chuẩn kỹ thuật và quy chuẩn vận hành
│   ├── architecture/             # Tài liệu kiến trúc hệ thống
│   ├── database/                 # Tài liệu ERD và Data Dictionary
│   ├── governance/               # Quy chế phân ranh giới, Working Rules và Definition of Done
│   └── standards/                # 11 bộ tiêu chuẩn kỹ thuật bắt buộc
├── comprehensive-audit/          # Toàn bộ 38 báo cáo kiểm toán, nghiệm thu và đối soát lịch sử
└── docker-compose.yml            # Điều phối chạy toàn bộ hệ thống gồm MySQL 8.4, API và Web
```

---

## 2. Kiểm Kê Định Lượng File & Dòng Code (LOC Inventory)

### A. Phân loại theo phần mở rộng tập tin (By File Extension)

| Định dạng file | Số lượng files | Tổng số dòng (LOC) | Mục đích sử dụng chính trong dự án |
| :--- | :--- | :--- | :--- |
| `.tsx` | **58 files** | **35,611 dòng** | Giao diện React Components, Pages, Layouts, Providers |
| `.ts` | **94 files** | **19,280 dòng** | Backend API, Services, Repositories, Schemas, Seeds, Tests |
| **Tổng TS / TSX** | **152 files** | **54,891 dòng** | **Tổng dung lượng mã nguồn TypeScript lõi** |
| `.css` | **6 files** | **10,499 dòng** | Tailwind CSS 4 styles, custom store themes, animation styles |
| `.sql` | **9 files** | **1,397 dòng** | Dữ liệu catalog nhập liệu, di chuyển schema cơ sở dữ liệu |
| `.prisma` | **1 file** | **600 dòng** | Lược đồ ORM Prisma (`prisma/schema.prisma`) |
| `.json` | **18 files** | **3,195 dòng** | Cấu hình Workspaces, Package dependencies, TSConfig |
| `.md` | **202 files** | **25,092 dòng** | Tài liệu kiến trúc, tiêu chuẩn, audit reports và hướng dẫn |
| `.yml` / `.yaml` | **2 files** | **195 dòng** | Cấu hình Docker Compose và GitHub Actions Workflows |
| `.png` / `.jpg` / `.webp` / `.svg` | **313 files** | *Binary Assets* | Hình ảnh sản phẩm, banners, icons, favicons trong public |
| **TỔNG CỘNG** | **726 files** | **386,948 dòng** | **Toàn bộ kho lưu trữ (loại trừ node_modules, .git, dist)** |

### B. Phân loại theo không gian gói (By Workspace Package)

| Không gian gói (Workspace) | Số files | Tổng dòng | TS/TSX Files | TS/TSX LOC | Vai trò trong hệ thống |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `apps/web` | 366 | 291,382 | 81 | 43,190 | Frontend SPA client (React 19 + Vite) |
| `apps/api` | 70 | 14,470 | 68 | 14,417 | Backend REST API Service (Express 5) |
| `packages/shared` | 6 | 1,172 | 4 | 1,136 | Zod Schemas, Shared Types, Constants |
| `packages/config` | 3 | 46 | 1 | 14 | ESLint, Prettier, Base TSConfig |
| `prisma` | 13 | 3,940 | 2 | 1,939 | Database Schema, Migrations, Seed scripts |
| `tests` | 5 | 233 | 2 | 233 | Playwright E2E specs & configuration |
| `docs` | 184 | 55,566 | 0 | 0 | Kiến trúc, Governance, Quy chuẩn kỹ thuật |
| `comprehensive-audit` | 37 | 7,097 | 0 | 0 | 38 Báo cáo kiểm toán và đối soát lịch sử |
| Root configs (`.github`, docker...) | 42 | 13,042 | 0 | 0 | Dockerfiles, Compose, CI/CD, Readmes |

---

## 3. Phân Phối Trách Nhiệm Từng Thư Mục Chi Tiết

### `apps/web` — Frontend Single Page Application
- `src/features/`: Phân chia theo mô-đun chức năng nghiệp vụ (Feature-Driven Architecture):
  - `admin/`: Trang quản trị `AdminDashboardPage.tsx` (6,312 dòng) quản lý 13 phân hệ vận hành.
  - `ai/`: Trang trợ lý mua sắm AI `AiAssistantPage.tsx` (1,669 dòng) và chatbot nổi toàn hệ thống.
  - `auth/`: Trang đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu.
  - `cart/`: Trang giỏ hàng, cập nhật số lượng, xóa sản phẩm, hiển thị giá ưu đãi.
  - `catalog/`: Trang chi tiết sản phẩm `ProductDetailPage.tsx` và tìm kiếm `SearchPage.tsx`.
  - `checkout/`: Trang thanh toán `CheckoutPage.tsx` (920 dòng) và xác nhận `CheckoutSuccessPage.tsx`.
  - `compare/`: So sánh thông số kỹ thuật tối đa 4 sản phẩm `ComparePage.tsx`.
  - `news/`: Danh sách tin tức công nghệ `NewsPage.tsx` và bài viết chi tiết `PostDetailPage.tsx`.
  - `orderTracking/`: Tra cứu đơn hàng theo mã công khai `OrderTrackingPage.tsx`.
  - `pcBuilder/`: Công cụ xây dựng cấu hình máy tính theo linh kiện tương thích `PcBuilderPage.tsx`.
  - `policy/`, `info/`, `stores/`: Các trang chính sách, giới thiệu, hệ thống cửa hàng, tuyển dụng.
  - `profile/`: Trang quản lý tài khoản khách hàng `ProfilePage.tsx` (2,157 dòng) gồm 5 tab chuyên biệt.
  - `tradeIn/`: Thu cũ đổi mới linh kiện, định giá máy tính cũ.
  - `wishlist/`: Danh sách sản phẩm yêu thích của khách hàng.
- `src/components/`: Các thành phần giao diện dùng chung (Header, Footer, FloatingChatbot, Modals).
- `src/routes/AppRoutes.tsx`: Định tuyến tập trung toàn bộ 83 route của ứng dụng.
- `src/app/providers.tsx`: Quản lý QueryClient, sessionEpoch đồng bộ auth cross-tab, Toast notifications.

### `apps/api` — Backend REST API
- `src/modules/`: Cấu trúc Modular Monolith chuẩn:
  - `admin/`: Quản lý toàn bộ 49 API dành cho nhân viên Staff và Admin quản trị.
  - `ai/`: API tương tác LLM, phân tích cấu hình PC, tư vấn sản phẩm thông minh.
  - `auth/`: Đăng ký, đăng nhập JWT, làm mới mật khẩu, lấy thông tin người dùng hiện tại `/me`.
  - `cart/`: Quản lý giỏ hàng, gộp giỏ hàng khách vãng lai (Guest Cart Merge với khóa đồng thời).
  - `catalog/`: Danh mục sản phẩm, bộ lọc tìm kiếm, đánh giá của khách hàng (Reviews).
  - `marketing/`: Quản lý phiếu giảm giá (Coupons), đợt Flash Sale, banners quảng cáo, bài viết.
  - `order/`: Tạo đơn hàng, trừ kho nguyên tử, quản lý đơn hàng, quy trình đổi trả (Returns).
  - `payment/`: Tích hợp cổng thanh toán VNPay, xử lý callback IPN và xác thực chữ ký HMAC.
  - `profile/`: Quản lý thông tin cá nhân khách hàng, sổ địa chỉ nhận hàng, đổi mật khẩu, thông báo.
  - `system/`: Giám sát sức khỏe hệ thống `/api/v1/health`, chỉ số metrics, cấu hình cửa hàng.
  - `wishlist/`: Quản lý thêm/xóa sản phẩm yêu thích.
- `src/middleware/`: Bộ lọc trung gian bảo mật:
  - `auth.middleware.ts`: Xác thực Bearer JWT token, phân quyền RBAC (`requireRole`, `requireAdmin`, `requireStaffOrAdmin`).
  - `errorHandler.ts`: Bắt lỗi tập trung, không để rò rỉ stack trace ra môi trường bên ngoài.
  - `rateLimit.ts`: Giới hạn tần suất gọi API (Rate Limiting) chống Brute-force và DDoS.
  - `validateRequest.ts`: Xác thực đầu vào tự động bằng Zod Schema.

---

## 4. Điểm Khởi Chạy Hệ Thống (Entry Points)

| Thành phần | Điểm khởi chạy (Entry Point) | Chức năng thực hiện |
| :--- | :--- | :--- |
| **Frontend Web** | `apps/web/src/main.tsx` | Khởi tạo React DOM Root, nhúng CSS styles, bọc trong `AppProviders` |
| **Web Root Component** | `apps/web/src/App.tsx` | Quản lý Router, Header, Footer, Banner quảng cáo và Chatbot |
| **Web Routing Hub** | `apps/web/src/routes/AppRoutes.tsx` | Khai báo toàn bộ 83 route, phân quyền Admin Gate |
| **Backend API Server** | `apps/api/src/server.ts` | Điểm kích hoạt lắng nghe cổng HTTP, xử lý Graceful Shutdown |
| **API Express App** | `apps/api/src/app.ts` | Cấu hình Helmet, CORS, Body Parser, Rate Limiting, Routes Hub |
| **API Route Hub** | `apps/api/src/routes/index.ts` | Kết nối 11 module routers vào tiền tố chuẩn `/api/v1` |
| **Prisma Client** | `apps/api/src/common/prisma.ts` | Quản lý vòng đời Singleton PrismaClient kết nối MySQL |

---

## 5. Danh Mục Kịch Bản Thực Thi (Scripts Inventory)

Được định nghĩa tại `package.json` gốc:

```json
{
  "scripts": {
    "dev": "npm run dev:all",
    "dev:all": "concurrently -k -p \"[{name}]\" -n \"API,WEB\" -c \"cyan,magenta\" \"npm run dev -w @nexora/api\" \"npm run dev -w @nexora/web\"",
    "build": "npm run build:packages && npm run build:api && npm run build:web",
    "build:packages": "npm run build -w @nexora/shared",
    "build:api": "npm run build -w @nexora/api",
    "build:web": "npm run build -w @nexora/web",
    "typecheck": "npm run typecheck:packages && npm run typecheck:api && npm run typecheck:web",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,css,md}\"",
    "format:write": "prettier --write \"**/*.{ts,tsx,json,css,md}\"",
    "test": "vitest run",
    "test:unit": "vitest run apps/api/tests/app.test.ts apps/api/tests/returns_state_machine.unit.test.ts apps/api/tests/review_p2002_isolation.unit.test.ts apps/web/tests/",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## 6. Phân Loại Tài Nguyên Theo 8 Nhóm Trạng Thái

1. **Application Source Code:** `apps/web/src`, `apps/api/src`, `packages/shared/src` -> `IMPLEMENTED & VERIFIED`.
2. **Automated Test Suites:** `apps/web/tests`, `apps/api/tests`, `tests/e2e` -> `IMPLEMENTED & VERIFIED` (320/320 PASS).
3. **Configurations:** `package.json`, `tsconfig.json`, `vite.config.ts`, `docker-compose.yml`, `.github/workflows/ci.yml` -> `IMPLEMENTED & VERIFIED`.
4. **Documentation:** `docs/`, `comprehensive-audit/` -> `IMPLEMENTED & VERIFIED`.
5. **Database Schemas & Migrations:** `prisma/schema.prisma`, `prisma/migrations/` (8 bản ghi) -> `IMPLEMENTED & VERIFIED`.
6. **Seed Scripts:** `prisma/seed.ts` -> `IMPLEMENTED & VERIFIED`; `seed_nexora_catalog.sql` -> `IMPLEMENTED & VERIFIED`; `seed_techpilot_full.ts` -> `IMPLEMENTED — NOT VERIFIED` (chỉ dùng chuyển đổi offline).
7. **Build Artifacts:** Đã loại trừ khỏi Git qua `.gitignore` (`dist/`, `.vite/`, `build/`).
8. **Legacy References:** Mã nguồn tham chiếu TechPilot được bảo tồn nguyên vẹn ngoài repo tại `D:\02_Dự Án Phần Mềm\TechPilot (Bản Chính Thức)`.
