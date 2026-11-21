# NEW REPOSITORY INITIALIZATION & RELEASE GUIDE — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Mục tiêu:** Hướng dẫn chuẩn bị mã nguồn sạch và quy trình khởi tạo GitHub Repository mới với **DUY NHẤT 1 COMMIT BAN ĐẦU**.
- **Ngày lập:** 20/11/2026
- **Trạng thái:** **APPROVED PROCEDURE (QUY TRÌNH CHUẨN ĐÃ ĐƯỢC PHÊ DUYỆT)**

---

## 1. NGUYÊN TẮC AN TOÀN BẮT BUỘC (SAFETY PROTOCOL)

1. **KHÔNG XÓA REPOSITORY CŨ NGAY LẬP TỨC:**
   - Repository hiện tại (`https://github.com/ntrungz0704/Nexora`) đang đóng vai trò là bản lưu trữ an toàn (backup).
   - Chỉ được cân nhắc lưu trữ (archive) hoặc xóa repository cũ **SAU KHI** repository mới đã được khởi tạo, clone sang thư mục độc lập (Clean-room test), biên dịch và kiểm thử thành công 100%.
2. **KHÔNG CHẠM VÀO THƯ MỤC TECHPILOT:**
   - Thư mục `D:\Nexora\TechPilot` và `audit-output/` tiếp tục được loại trừ hoàn toàn khỏi mã nguồn của repository mới.
3. **KHÔNG ĐƯA CÁC TỆP BÍ MẬT & TẠM THỜI VÀO REPO MỚI:**
   - Loại bỏ tệp `.env` (chỉ đưa `.env.example`).
   - Loại bỏ các thư mục build: `dist/`, `node_modules/`, `coverage/`, `.cache/`, `test-results/`.

---

## 2. DANH MỤC THÀNH PHẦN MÃ NGUỒN SẠCH (CLEAN RELEASE INVENTORY)

Toàn bộ các tệp và thư mục sau đây đã được kiểm định chất lượng và sẽ được đóng gói vào repository mới:

### 2.1. Cấu hình gốc Monorepo:

- `package.json` & `package-lock.json` (npm workspaces quản lý `@nexora/web`, `@nexora/api`, `@nexora/shared`, `@nexora/config`).
- `tsconfig.json` (Cấu hình TypeScript base chuẩn).
- `docker-compose.yml` (Đóng gói MySQL 8.4, API và Web).
- `.gitignore` & `.dockerignore` (Loại trừ tệp tạm và legacy).
- `.env.example` (Mẫu biến môi trường an toàn).
- `README.md` (Tài liệu giới thiệu dự án và hướng dẫn chạy).

### 2.2. Các Gói Mã Nguồn (Workspaces):

- `apps/web/`: Toàn bộ ứng dụng Frontend React 19, Vite, Tailwind CSS 4, React Router, TanStack Query.
- `apps/api/`: Toàn bộ Backend Node.js 20+, Express.js 5, Modular Monolith (10 Routers, Services, Repositories).
- `packages/shared/`: Hợp đồng kiểu dữ liệu, Zod DTOs và Enums dùng chung giữa FE và BE.
- `packages/config/`: Cấu hình môi trường và hằng số dùng chung.
- `prisma/`: Lược đồ CSDL `schema.prisma`, 4 migrations chính thức và script seed `seed.ts`.
- `tests/`: Cấu hình Playwright `playwright.config.ts` và bộ kiểm thử E2E (`foundation.spec.ts`, `storefront_journeys.spec.ts`).
- `docs/`: Toàn bộ hệ thống tài liệu quản trị kiến trúc, database dictionary, API contracts và bộ tài liệu kiểm toán hoàn chỉnh.

---

## 3. QUY TRÌNH THỰC HIỆN KHỞI TẠO REPOSITORY MỚI (STEP-BY-STEP)

### Bước 1: Chuẩn bị thư mục sạch (Staging Clean Directory)

Tạo một thư mục mới độc lập bên ngoài (ví dụ: `D:\Nexora-Release`), sao chép toàn bộ mã nguồn sạch của Nexora sang, đảm bảo:

- Không copy thư mục `.git/` cũ.
- Không copy thư mục `TechPilot/`.
- Không copy thư mục `audit-output/`.
- Không copy các thư mục `node_modules/`, `dist/`, `.env`.

### Bước 2: Khởi tạo Git mới với duy nhất 1 Commit ban đầu

Tại thư mục mã nguồn sạch:

```bash
# 1. Khởi tạo Git repo mới với nhánh mặc định là main
git init -b main

# 2. Thêm toàn bộ mã nguồn sạch vào staging
git add .

# 3. Tạo duy nhất một commit đầu tiên (theo quy chuẩn tiếng Việt không dấu)
git commit -m "feat: khoi tao ma nguon he thong thuong mai dien tu nexora phien ban 1.0.0"
```

### Bước 3: Tạo Repository mới trên GitHub & Đẩy mã nguồn

1. Đăng nhập GitHub, tạo repository mới (ví dụ: `https://github.com/ntrungz0704/nexora-store`).
2. Liên kết remote và đẩy commit duy nhất lên:

```bash
# 4. Gắn remote mới
git remote add origin https://github.com/ntrungz0704/nexora-store.git

# 5. Đẩy nhánh main lên GitHub
git push -u origin main
```

### Bước 4: Kiểm chứng môi trường sạch độc lập (Clean-Room Verification)

1. Trên một máy tính khác hoặc một thư mục độc lập (`D:\Test-Clean-Nexora`):
   ```bash
   git clone https://github.com/ntrungz0704/nexora-store.git .
   npm install
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
2. Nếu toàn bộ các lệnh trên đều đạt kết quả **PASS 100%**, repository mới chính thức được nghiệm thu xuất xưởng.

---

## 4. KẾT LUẬN

Quy trình trên đảm bảo sự an toàn dữ liệu tuyệt đối: hệ thống có thể chuyển giao sang một repository hoàn toàn mới với lịch sử commit tinh giản, sạch đẹp (1 commit duy nhất), đồng thời không gây bất kỳ rủi ro gián đoạn nào đối với mã nguồn hiện tại.
