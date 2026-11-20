# NEXORA — MASTER PROJECT INVENTORY & SYSTEM OVERVIEW
**Tài liệu:** `00_MASTER_PROJECT_INVENTORY.md`  
**Phiên bản:** `1.0.0` | **Trạng thái:** `ĐÃ PHÊ DUYỆT (APPROVED)`  
**Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System  

---

## 1. Bản Đồ Tổng Quan Cấu Trúc Workspace Monorepo

Nexora được tổ chức theo kiến trúc Monorepo tiêu chuẩn bằng npm Workspaces, phân định ranh giới tách bạch giữa mã nguồn giao diện người dùng, dịch vụ backend API và các thư viện chia sẻ:

```
Nexora/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript Backend Service
│   │   ├── src/
│   │   │   ├── config/          # Centralized configuration (env, secrets)
│   │   │   ├── middlewares/     # Auth, error handling, rate limiting, request validation
│   │   │   ├── modules/         # Feature modules: auth, catalog, cart, orders, payment, admin...
│   │   │   └── server.ts        # Express application bootstrap
│   │   └── tests/               # 64 Automated Vitest & Supertest integration suites
│   └── web/                     # ReactJS + Vite + Tailwind CSS Frontend Application
│       ├── public/              # Static assets: 26 official brand SVGs, 10 WebP concept banners
│       └── src/
│           ├── components/      # Reusable UI primitives (Buttons, Inputs, Modals)
│           ├── features/        # Business feature modules: storefront, cart, checkout, admin, info...
│           ├── hooks/           # Custom React hooks & TanStack query hooks
│           ├── routes/          # Central React Router configuration
│           └── services/        # API client services wrapping Axios/Fetch
├── packages/
│   ├── config/                  # Shared TypeScript, ESLint & Tailwind base configurations
│   └── shared/                  # Shared Zod validation schemas, DTOs & TypeScript contracts
├── prisma/
│   ├── schema.prisma            # 24 3NF Normalized MySQL 8.4 tables & relations
│   ├── migrations/              # Version-controlled migration histories
│   └── seed.ts                  # Production-ready catalog & credential seeders
└── docs/                        # Complete architecture, database, API and migration documentation
```

---

## 2. Thống Kê Tài Nguyên Hệ Thống

- **Tổng số bảng cơ sở dữ liệu:** 24 bảng quan hệ, 100% tuân thủ chuẩn 3NF, kiểu dữ liệu tiền tệ `Decimal(12, 2)`.
- **Tổng số Endpoints RESTful:** 48 routes có bọc Envelope JSON chuẩn `{ success, data, error }`.
- **Tổng số trang giao diện người dùng:** 22 trang Storefront, Giỏ hàng, Đặt hàng, Tra cứu, Hỗ trợ và 10 phân hệ Quản trị Admin.
- **Tài sản thương hiệu:** 5 concept banner độc quyền (10 tệp WebP Desktop & Mobile), 26 logo đối tác chuẩn vector SVG.
- **Độ bao phủ kiểm thử tự động:** 10 tệp kiểm thử tích hợp, 64 bài kiểm thử hoàn thành với tỷ lệ 100% PASS.
