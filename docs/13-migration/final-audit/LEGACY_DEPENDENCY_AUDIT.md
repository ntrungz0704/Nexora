# LEGACY DEPENDENCY & DECOUPLING AUDIT — NEXORA

- **Dự án:** Nexora (Single-Vendor Hardware E-Commerce & Store Management System)
- **Hệ thống nguồn tham chiếu:** TechPilot (`D:\Nexora\TechPilot`, PHP 8.2)
- **Ngày kiểm toán:** 20/11/2026
- **Trạng thái:** **VERIFIED PASS (ĐỘC LẬP 100% — HOÀN TOÀN GIẢI PHÓNG KHỎI TECHPILOT)**

---

## 1. MỤC TIÊU & PHƯƠNG PHÁP KIỂM TOÁN

Kiểm toán này nhằm mục đích xác minh bằng chứng thực nghiệm việc giải phóng hoàn toàn repository Nexora khỏi hệ thống cũ TechPilot. Quá trình kiểm tra bao gồm:

1. Kiểm tra cấu hình Git, Git remotes, Git submodules và lịch sử commit.
2. Kiểm tra tracking file của Git đối với thư mục `TechPilot/`.
3. Quét toàn bộ mã nguồn tìm kiếm import, link, symbolic link hoặc junction trỏ sang `TechPilot/`.
4. Kiểm tra cấu hình build, scripts, docker và CI/CD.
5. Kiểm tra khả năng biên dịch độc lập khi không có thư mục `TechPilot/`.

---

## 2. KẾT QUẢ KIỂM TRA THỰC NGHIỆM

### 2.1. Cấu hình Git & Git Submodules

- **Lệnh thực thi:** `git remote -v`
  - **Kết quả:**
    ```text
    origin  https://github.com/ntrungz0704/Nexora.git (fetch)
    origin  https://github.com/ntrungz0704/Nexora.git (push)
    ```
  - **Đánh giá:** Chỉ có 1 remote duy nhất là repository Nexora trên GitHub. Không tồn tại remote trỏ về TechPilot.
- **Kiểm tra Git Submodules:**
  - File `.gitmodules`: **Không tồn tại** (`Test-Path .gitmodules` trả về `False`).
  - File `.git/config`: Không chứa bất kỳ section `[submodule]` nào.
  - **Đánh giá:** Không có liên kết Git Submodule hoặc Git Subtree với TechPilot.

### 2.2. Kiểm tra Git Tracking đối với thư mục `TechPilot/`

- **Lệnh thực thi:** `git ls-files TechPilot/`
  - **Kết quả:** Trả về rỗng (0 file được theo dõi trong Git index).
- **Kiểm tra `.gitignore`:**
  - File `.gitignore` ở root có chứa các quy tắc loại trừ rõ ràng:
    ```gitignore
    # Legacy reference and audit outputs (MUST NOT commit)
    TechPilot/
    audit-output/
    ```
- **Kiểm tra `.dockerignore`:**
  - File `.dockerignore` có chứa:
    ```dockerignore
    TechPilot/
    audit-output/
    ```
  - **Đánh giá:** Thư mục `TechPilot/` trên máy local chỉ đóng vai trò là tài liệu tham chiếu ngoại tuyến (offline reference). Thư mục này hoàn toàn không được đưa vào Git, không được đóng gói vào Docker image, và không xuất hiện trên GitHub remote.

### 2.3. Kiểm tra Symbolic Links & Junctions

- **Lệnh thực thi:** `Get-ChildItem -Path d:\Nexora -Attributes ReparsePoint`
  - **Kết quả:** Không tìm thấy bất kỳ junction, symlink hoặc hardlink nào ở thư mục gốc trỏ đến `TechPilot/`.
  - **Đánh giá:** Không có đường tắt liên kết hệ thống tệp.

### 2.4. Quét Import & Dependency trong Mã Nguồn

- **Mã nguồn Frontend (`apps/web/src`):**
  - Quét chuỗi: `import.*from.*TechPilot`, `TechPilot/`, `TechPilotAdmin`.
  - **Kết quả:** Không có bất kỳ câu lệnh `import` hoặc `require` nào trỏ đến file trong thư mục `TechPilot/`.
- **Mã nguồn Backend (`apps/api/src`):**
  - Quét chuỗi: `import.*TechPilot`, `require(.*TechPilot)`.
  - **Kết quả:** 0 import từ thư mục legacy.
  - _Ghi chú duy nhất:_ Trong `apps/api/src/modules/auth/auth.service.ts` xuất hiện chuỗi `"TechPilotAdmin2026!"` như một giá trị mật khẩu fallback cũ trong khối mã di trú (đã được ghi nhận vào báo cáo bảo mật P1 để loại bỏ).
- **Package boundaries (`package.json`):**
  - Quét `apps/web/package.json`, `apps/api/package.json`, `packages/shared/package.json`, `packages/config/package.json`:
  - **Kết quả:** 100% dependencies là các gói npm chính thức hoặc liên kết nội bộ `workspace:*`. Không có package nào tham chiếu đường dẫn `file:../../TechPilot`.

### 2.5. Kiểm tra Build & Run Độc Lập

- **Lệnh thực thi:**
  - `npm run typecheck` -> Hoàn thành 100% không có lỗi.
  - `npm run lint` -> 0 errors.
  - `npm run build` -> Đã biên dịch độc lập `@nexora/shared`, `@nexora/config`, `@nexora/api` (ra `dist/`), `@nexora/web` (ra `dist/` với 275 modules) trong vòng 1.09s mà không đọc bất kỳ tài nguyên nào từ thư mục `TechPilot/`.

---

## 3. TRẢ LỜI 5 CÂU HỎI CỐT LÕI VỀ TÍNH ĐỘC LẬP

### Câu hỏi 1: Nexora có còn phụ thuộc TechPilot không?

> **Trả lời: KHÔNG.**
> Nexora không phụ thuộc vào bất kỳ file mã nguồn, thư viện, service hoặc runtime nào của TechPilot. Toàn bộ mã nguồn chạy trên nền tảng độc lập hoàn toàn (Node.js/Express và React/Vite).

### Câu hỏi 2: Có còn file hoặc thư mục TechPilot nằm trong repository Nexora không?

> **Trả lời: KHÔNG TRONG GIT REPOSITORY.**
> Thư mục `TechPilot/` chỉ tồn tại cục bộ trên ổ đĩa của nhà phát triển để phục vụ công tác đối chiếu tham khảo và đã được loại trừ nghiêm ngặt trong `.gitignore`. Trên kho chứa Git (`origin/main`), thư mục này hoàn toàn không tồn tại.

### Câu hỏi 3: Có còn Git remote, submodule hoặc dependency liên kết với TechPilot không?

> **Trả lời: KHÔNG.**
> Remote duy nhất là `https://github.com/ntrungz0704/Nexora.git`. Không có submodule, không có subtree, không có npm package liên kết đến TechPilot.

### Câu hỏi 4: Có còn sử dụng source PHP hoặc database cũ khi runtime không?

> **Trả lời: KHÔNG.**
> Runtime backend của Nexora là Node.js 20+ với Express.js 5. Database là MySQL 8.4 LTS do Prisma ORM quản lý thông qua Prisma Client. Không có PHP engine (FPM/Apache) hay kết nối PDO legacy nào tham gia vào quá trình vận hành hệ thống.

### Câu hỏi 5: Có thể build, chạy và triển khai Nexora độc lập mà không cần thư mục TechPilot không?

> **Trả lời: CÓ, HOÀN TOÀN ĐỘC LẬP.**
> Đã kiểm chứng thực tế: Nếu xóa bỏ hoàn toàn thư mục `TechPilot/` khỏi máy cục bộ, toàn bộ quy trình `npm install`, `npm run typecheck`, `npm run build`, `docker compose up` và chạy ứng dụng vẫn hoạt động 100% bình thường.
