# 06. SECURITY, CACHE ISOLATION & DATABASE INTEGRITY

---

## 1. Environment Configuration & Secrets Hygiene (`evidence/01_env_audit.log`)

- **Cấu hình lõi (`REQUIRED AND CONFIGURED`):** `NODE_ENV=development`, `APP_NAME=Nexora`, `WEB_PORT=5173`, `API_PORT=3000`, `VITE_API_BASE_URL=http://localhost:3000/api/v1`, `DATABASE_URL` (`SET`, len `69`), `MYSQL_ROOT_PASSWORD`/`MYSQL_PASSWORD` (`SET`, len `32`), `MYSQL_DATABASE=nexora`, `MYSQL_USER=nexora`, `AUTH_SECRET` (`SET`, len `64`), `CLIENT_URL=http://localhost:5173`, `SERVER_URL=http://localhost:3000`, `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`.
- **Biến tích hợp chưa cấu hình (`MISSING`):** `TRUST_PROXY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **Bảo vệ Secret trên Frontend Bundle (`04_live_browser_security_admin_audit.json:896-901`):** Quét toàn bộ file `apps/web/dist/assets/index-iG3JJKO1.js` -> **`findings: []` (`0` rò rỉ)**; không lộ bất kỳ password, JWT secret, hay chuỗi kết nối DB nào trong mã nguồn đóng gói.

---

## 2. HTTP Security, JWT, CORS, Input Validation & 4-Role RBAC

### A. Live `:3000` Unauthenticated, Forged JWT, IDOR, SQLi & CORS (`13 / 13` Verified)
*(Nguồn: `evidence/04_live_browser_security_admin_audit.json:699-895`)*

- **Protected endpoints khi thiếu JWT (6 checks):** `/admin/dashboard/summary`, `/admin/users`, `/admin/orders`, `/admin/returns`, `/profile`, `/orders/my-orders` -> tất cả trả **`401 UNAUTHORIZED`**.
- **Forged JWT (`/profile` với token giả):** trả **`401 INVALID_TOKEN`**.
- **Order IDOR Check:** `GET /orders/detail/NX-2026-0001` không auth -> **`401 UNAUTHORIZED`**; `GET /orders/track?code=NX-2026-0001&phone=0000000000` -> **`404 ORDER_NOT_FOUND`**.
- **Non-existent Slug & SQLi Payload:** `/catalog/products/nonexistent-final49-999` -> **`404 PRODUCT_NOT_FOUND`**; SQLi `?q=' OR 1=1 --` xử lý an toàn qua Prisma ORM (`200`, `products: [], total: 0`).
- **Validation & CORS Origin lạ:** `POST /auth/login` sai email -> **`400 VALIDATION_ERROR`**; request gửi `Origin` không thuộc allowlist bị CORS từ chối (`500`, không cấp header `Access-Control-Allow-Origin`).
- **Helmet & Stack Leak:** Toàn bộ `13/13` phản hồi có `hasStackLeak: false`, header `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, và `X-Powered-By: null`.

### B. 4-Role RBAC Matrix (`Isolated :3001 / :5174` — `05_isolated_interactive_rbac_crud.json` & `05_isolated_followup_staff_pcbuilder_ai.json`)

| Role | API `/admin/*` | API Leo thang `/admin/users/:id/role` | UI `/admin` | Ghi chú |
| --- | :---: | :---: | --- | --- |
| **GUEST** | **`401`** | **`401`** | Bị chặn ở Admin Auth Gate | Đạt |
| **CUSTOMER** | **`403`** | **`403`** | Bị chặn ở Admin UI Gate (`customerAdminUiBlocked: true`) | Đạt |
| **STAFF** | **`200`** *(read & ops)* | **`403`** *(admin-only guard tại `admin.routes.ts:74-75`)* | Vào được Workspace (`sidebarVisible: true`) | API chặn leo thang `403`; UI hiện vẫn liệt kê đủ 12 mục nav kể cả `Khách hàng`/`Cài đặt` (`DEF-RT-17`) |
| **ADMIN** | **`200`** | **`200`** | Toàn quyền 13 tab UI | **Hạn chế mới (`DEF-RT-14`):** `POST /admin/products` payload sai `{name:'', price:-50}` trả **`500`** do thiếu Zod validation |

---

## 3. Browser Cache Isolation & Session Hygiene

- **Cross-Tab Logout (`05_isolated_interactive_rbac_crud.json:69-72`):** Tab A đăng nhập User 1 -> Tab B thấy trạng thái đăng nhập User 1 (`tabBSawUser1: true`) -> Tab A đăng xuất -> Tab B tự xóa trạng thái & cache User 1 (`tabBClearedUser1: true`).
- **Account Switch Isolation (`line 73`):** Chuyển đăng nhập sang tài khoản khác không giữ dữ liệu cá nhân cũ (`accountSwitchClean: true`).
- **Tampered VNPay Callback (`line 113-117`):** Ký sai `vnp_SecureHash` trả `{ isSuccess: false, orderCode: "NX-183788-5128", message: "Chữ ký checksum VNPay không hợp lệ." }`.

---

## 4. Database Integrity Verification (`127.0.0.1:3306/nexora` vs `3307/nexora_test`)

### A. Cách ly tuyệt đối khi chạy test ghi dữ liệu
- Các đợt test Tier 2A, Tier 2B, Playwright Tier 3 và Browser E2E D3–D12 đều chạy trên container Docker tạm `nexora:8.4` với `--tmpfs` tại port **`3307/nexora_test`**.
- Giá trị xác minh `SELECT DATABASE(), @@hostname, @@port, VERSION()` trước chạy (`03_isolated_db_identity.txt` & `05_isolated_interactive_rbac_crud.json`): `nexora_test`, container IDs `48dc62fd9cb6` / `55f3a7144c28` (hoàn toàn khác Dev DB container `7ffc1a14a558` `nexora`). Container test tạm đã được xóa sạch (`docker ps -a` chỉ còn `nexora-mysql-1`, `bizpro_postgres`, `admiring_brattain`).

### B. Đối chiếu Dev DB `3306/nexora` Before vs After (`01_dev_db_before.json` vs `07_dev_db_after.json`)

| Metric / Bảng | Before Audit | After Audit | Chênh lệch | Giải thích bằng chứng thực nghiệm |
| --- | ---: | ---: | ---: | --- |
| **Engine & Container** | MySQL `8.4.13` (`7ffc1a14a558`) | MySQL `8.4.13` (`7ffc1a14a558`) | `0` | Kết nối đúng `nexora-mysql-1` |
| **Total Tables** | `27` | `27` | `0` | Đầy đủ schema, `8/8` Prisma migrations đã hoàn tất (`rolled_back_at: null`) |
| `products` / `categories` / `brands` | `674` / `22` / `31` | `674` / `22` / `31` | **`0`** | Không tạo/sửa/xóa sản phẩm hay danh mục nào trên Dev DB |
| `users` / `orders` / `order_items` | `3` / `2` / `2` | `3` / `2` / `2` | **`0`** | Không đăng ký/đặt đơn trên Dev DB (`NX-2026-0001` giữ nguyên `delivered_at: null`) |
| `reviews` / `return_requests` / `inventory_logs` | `0` / `0` / `0` | `0` / `0` / `0` | **`0`** | Toàn bộ thao tác review/return/inventory chạy trên `3307` |
| `ai_assistant_logs` / `coupons` / `posts` / `banners` | `12` / `5` / `8` / `9` | `12` / `5` / `8` / `9` | **`0`** | Không thay đổi nội dung hay log AI trên Dev DB |
| **`carts`** | `28` | **`29`** | **`+1`** | **`id 225`** (`user_id: null`, `guest_session_id: guest_vsaywla1ruhm...`, `item_count: 0`, `2026-11-25T10:57:24Z`) sinh ra do trình duyệt khách vãng lai mở `/` kích hoạt `GET /api/v1/cart` -> `getOrCreateCart()` (`DEF-RT-16`). Tương tự **`+8` dòng (`id 217..224`, `04:46–04:50Z`)** ở báo cáo cũ có cùng bản chất `0` item này (`07_dev_db_after.json:153-215`) và được giữ nguyên không xóa. |
| **Tổng cộng tất cả dòng (27 bảng)** | `842` | **`843`** | **`+1`** | Bảo toàn 100% dữ liệu nghiệp vụ & người dùng |
