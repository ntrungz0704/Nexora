# NEXORA — FINAL 49-POINT RUNTIME AUDIT, DEFECT REVALIDATION & HANDOVER REPORT

- **Audit Mode:** `100% READ-ONLY AUDIT & DEFECT REVALIDATION` *(0 sửa mã nguồn, 0 sửa DB/migration/seed, 0 commit/push, `TechPilot` & lịch sử audit được bảo toàn)*
- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora` | **GitHub:** `https://github.com/ntrungz0704/Nexora`
- **Tài liệu bổ sung cùng bộ:** [`01_EXECUTIVE_SUMMARY.md`](01_EXECUTIVE_SUMMARY.md) | [`02_49_POINT_CHECKLIST_RESULTS.md`](02_49_POINT_CHECKLIST_RESULTS.md) | [`03_DEFECT_REVALIDATION.md`](03_DEFECT_REVALIDATION.md) | [`04_QUALITY_GATES_AND_TEST_RESULTS.md`](04_QUALITY_GATES_AND_TEST_RESULTS.md) | [`05_RUNTIME_BROWSER_AND_RESPONSIVE_AUDIT.md`](05_RUNTIME_BROWSER_AND_RESPONSIVE_AUDIT.md) | [`06_SECURITY_AND_DATABASE_INTEGRITY.md`](06_SECURITY_AND_DATABASE_INTEGRITY.md) | [`07_GIT_AND_PROCESS_HANDOVER.md`](07_GIT_AND_PROCESS_HANDOVER.md) | [`08_EVIDENCE_INDEX.md`](08_EVIDENCE_INDEX.md)

---

## A. Executive Summary

| Thông số Audit | Kết quả xác minh thực tế |
| --- | --- |
| **Ngày giờ Audit** | `2026-11-25 17:45 – 18:16 (+07:00)` |
| **Workspace** | `D:\Nexora` |
| **Branch / HEAD Commit** | `main` / `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` (`Ahead 0 / Behind 0` vs `origin/main`; tiến hơn 3 commit so với M6.5 `6073152`) |
| **Overall Verdict** | **`PASS WITH LIMITATIONS`** |
| **Tổng số tiêu chí** | **`49`** (`01`–`49` đủ 8 nhóm) |
| **Số `PASS`** | **`29`** |
| **Số `FAIL`** | **`1`** *(Tiêu chí `#07` Prettier Format Check: Exit `1`, `71` files)* |
| **Số `PARTIAL`** | **`19`** *(Bao gồm các chức năng có defect hoặc có phần chưa kiểm chứng được)* |
| **Số `BLOCKED`** | **`0`** |
| **Số `NOT TESTED` *(cấp tiêu chí)*** | **`0`** *(Các sub-scope ngoài hạ tầng được tách rõ `NOT VERIFIED` / `NOT TESTED`: Live `GEMINI_API_KEY`, Google OAuth thật, SMTP/Resend live, VNPay Production, Full WCAG 2.2 AA, Checkout `<500k` trên UI 23-SP seed, Load test `1.000` concurrent users)* |
| **Số Defect theo `P0–P4`** | **`P0: 0` \| `P1: 3` \| `P2: 6` \| `P3: 7` \| `P4: 1`** *(Tổng `17`: `13` tái xác minh + `4` lỗi mới)* |

---

## B. 49-Point Checklist (`01` – `49`)

| ID | Tiêu chí | Kết quả | Bằng chứng & Phương pháp kiểm tra | File / Route / API & Ref | Giải thích ngắn gọn |
| --- | --- | :---: | --- | --- | --- |
| **01** | Workspace, branch & HEAD | **`PASS`** | CLI: `D:\Nexora`, `main`, `bddbf44...`, `0/0` vs `origin/main` | `evidence/01_preflight_git_env.log` | Đúng repo, ghi nhận +3 commit sau M6.5 `6073152`, không reset |
| **02** | Git status & bảo toàn files | **`PASS`** | `git diff --stat` & `diff --cached --stat` trống; `TechPilot`=`False` | `evidence/01_preflight_git_env.log` | Không chạm source, seed, migration hay `runtime-launch/` |
| **03** | Runtime & dependencies | **`PASS`** | Win11, Node `v22.23.4`, npm `10.9.9`, Docker `29.9.3`, MySQL `8.4.13`, `npm ls --depth=0` OK | `evidence/01_preflight_git_env.log` | Đầy đủ dependency monorepo sạch lỗi thiếu gói |
| **04** | Env vars & port conflicts | **`PARTIAL`** | Core vars `SET`, port `:3000/:3306/:5173` sạch; thiếu SMTP, Gemini, Google OAuth, VNPay Prod | `.env`, `evidence/01_env_audit.log` | Đủ chạy local nhưng thiếu provider email/AI/SSO/VNPay Prod |
| **05** | TypeScript typecheck | **`PASS`** | `npm run typecheck` (`D:\Nexora`), Exit `0`, `10.36s` | `evidence/02_typecheck.log` | `0` lỗi TypeScript trên 4 workspace |
| **06** | ESLint | **`PASS`** | `npm run lint` (`eslint .`), Exit `0`, `36.45s`, `0` err/warn | `evidence/02_lint.log` | Đạt chuẩn lint toàn dự án |
| **07** | Prettier check | **`FAIL`** | `npm run format:check`, Exit `1`, `6.58s`, **`71` files** (`63` cũ + `8` `runtime-launch/`) | `evidence/02_prettier.log` | `4` TS/TSX source, `1` seed, `58` `.md` cũ + `8` audit artifacts |
| **08** | Production build | **`PASS`** | `npm run build`, Exit `0`, `15.69s`, `288` modules, JS `1,186.36 kB` (`>500 kB` warn) | `evidence/02_build.log` | Build thành công; cảnh báo kích thước chunk chính (`DEF-RT-13`) |
| **09** | Unit tests & Frontend RTL | **`PASS`** | `npm run test:unit`, Exit `0`, `22.2s`, `12/12` files, **`135/135` PASS** | `evidence/03_test_unit_rtl.log` | `36` Pure Unit + `99` RTL khớp baseline, 0 skip/fail |
| **10** | Backend integration trên DB cô lập | **`PASS`** | Tier 2A `11/11` `175/175` + Tier 2B `1/1` `1/1` trên `3307/nexora_test` (`48dc62fd9cb6`) | `evidence/03_test_tier2a_backend.log`, `03_test_tier2b_db.log` | Tổng `176/176` PASS, xác minh `SELECT DATABASE(), @@hostname` |
| **11** | Playwright E2E an toàn | **`PASS`** | Config cô lập `:5174/:3001 -> 3307/nexora_test`: Exit `0`, `11.78s`, **`9/9` PASS** | `evidence/03_test_tier3_playwright.log`, `03_test_tier3_meta.json` | 9/9 PASS; ghi chú `DEF-RT-17` selector Journey 3 |
| **12** | Backend API startup | **`PASS`** | `npm run dev:api`: `tsx watch` `35208` -> worker `13588` listening `::3000` | `apps/api/src/server.ts`, `task-22981` | Khởi động lại sạch để reset rate-limit, chạy ổn định |
| **13** | Frontend startup | **`PASS`** | `npm run dev:web`: Vite `32852` listening `::5173`, HTML `200` | `task-22812`, `03_live_startup_precheck.log` | Tiến trình Vite ban đầu duy trì liên tục, phục vụ đúng SPA |
| **14** | Database connection | **`PASS`** | Docker `nexora-mysql-1` (`healthy`), `127.0.0.1:3306/nexora`, `27` bảng, `8/8` migrations | `evidence/01_dev_db_before.json`, `07_dev_db_after.json` | Kết nối đúng `nexora`, MySQL `8.4.13`, `674` SP & `22` danh mục |
| **15** | API health check | **`PARTIAL`** | `GET /api/v1/health` -> `200` (`database: "up"`); nhưng `/health` gốc (baseline) -> **`404`** | `apps/api/src/app.ts:67-71` | Mount đúng tại `/api/v1/health`, đính chính URL ở baseline cũ |
| **16** | Browser access | **`PASS`** | Chromium mở thực tế `:5173/`, `/admin`, 14 routes: render đầy đủ (`textLen: 18,229`) | `evidence/04_live_browser_security_admin_audit.json` | Truy cập và tương tác trình duyệt thực tế thành công |
| **17** | Server stability | **`PASS`** | Worker `13588` (`uptimeSeconds: 554`) & Vite `32852` không crash suốt phiên | Runtime verify cuối phiên | Tiến trình chạy liên tục không sập bất thường |
| **18** | Homepage, nav, search & filters | **`PARTIAL`** | Tìm kiếm, lọc, 404 ổn; nhưng `CategorySidebar` hardcode `16` mục (`DEF-RT-06`), lệch copy (`DEF-RT-09`), popup z-index (`DEF-RT-10`) | `CategorySidebar.tsx:317`, `StorefrontHeader.tsx:190` | Sai đồng bộ danh mục động & thông tin freeship/hotline |
| **19** | Product Detail, images & specs | **`PARTIAL`** | Giá/tồn kho/thông số đúng (`0` 404); nhưng `DEF-RT-01` gán sai `175` SP sang ảnh máy in & `31` console sang CPU; tràn Tablet (`DEF-RT-07`) | `productImage.ts:169-240`, `06_def_rt01_catalog_674_scan.json` | Sai ánh xạ ảnh diện rộng & gãy responsive trên tablet |
| **20** | PC Builder & Compare | **`PARTIAL`** | Compare (Category Lock + AI Persona) PASS; PC Builder dính **`DEF-RT-02`** (Slot CPU & Case lọc sai) & `Esc` không đóng modal | `PcBuilderPage.tsx:432-486`, `05_isolated_followup_staff_pcbuilder_ai.json` | Lỗi P1 tại logic lọc slot CPU (VGA/Console) & Case (AIO) |
| **21** | Guest Cart & Cart Merge | **`PASS`** | Isolated `3307`: Guest add, chặn overstock `400 INSUFFICIENT_STOCK`, login gộp giỏ thành 1 dòng không trùng | `evidence/05_isolated_interactive_rbac_crud.json:25-31` | Luồng giỏ hàng và gộp giỏ hoạt động chuẩn *(note `GET /cart` ở `DEF-RT-16`)* |
| **22** | Register, Login, Logout & Session | **`PARTIAL`** | Login guard, JWT `401`, cross-tab logout PASS; Google ở `/register` gây `401` + unhandled rejection (`DEF-RT-03`); `forgot-password` `500` (`DEF-RT-04`) | `RegisterPage.tsx:332`, `email.service.ts:60` | Google là `UI ONLY / MOCKED`; `forgot-password` lỗi khi thiếu SMTP |
| **23** | Profile, Address & Notifications | **`PASS`** | Isolated `3307`: Sửa tên UI, thêm/sửa (`200`)/xóa (`200`) địa chỉ, mở tab Thông báo đều PASS | `evidence/05_isolated_interactive_rbac_crud.json:75-81` | CRUD hồ sơ cá nhân và sổ địa chỉ hoạt động ổn định |
| **24** | Reviews & Returns | **`PARTIAL`** | Reviews & Returns API/Customer UI đều PASS (`403` non-purchaser, return `201`, 2 audit logs, admin API `200`); thiếu **UI Admin Returns** (`DEF-RT-05`) | `AdminDashboardPage.tsx`, `admin.routes.ts:83-85` | Cần giao diện Admin duyệt đổi trả; Dev DB `NX-2026-0001` có `delivered_at: null` |
| **25** | Checkout, Orders & VNPay Sandbox | **`PARTIAL`** | Isolated `3307`: COD `201` (`NX-183759-3861`) giảm kho `28->26`; VNPay Sandbox URL `200` + HMAC; tampered hash bị từ chối. VNPay Prod: `NOT TESTED`; UI `<500k` thiếu SP trên seed 23 SP | `evidence/05_isolated_interactive_rbac_crud.json:99-119` | COD và VNPay Sandbox PASS; cổng VNPay Production chưa thử nghiệm |
| **26** | AI Shopping fallback | **`PARTIAL`** | Survey 5 bước tăng log (`+1`), Chatbot `200` (`PRODUCT_RECOMMENDATION`); Step 1 lộ raw key `under_10m` (`DEF-RT-09`); Live Gemini AI: **`NOT VERIFIED`** | `AiAssistantPage.tsx:23-28`, `05_isolated_followup_staff_pcbuilder_ai.json` | Chỉ xác minh rule-based fallback; chưa có `GEMINI_API_KEY` |
| **27** | Admin auth & route protection | **`PASS`** | Unauth & `CUSTOMER` bị chặn ở Admin Gate + `403`; `STAFF` & `ADMIN` đăng nhập thành công | `evidence/05_isolated_interactive_rbac_crud.json`, `screenshots/final49_staff_admin_logged_in.png` | Bảo vệ cổng `/admin` ở cả UI và Backend |
| **28** | 13 Admin tabs | **`PARTIAL`** | Đủ `13/13` tab tải sạch dữ liệu không lỗi; nhưng `brands`, `orders`, `coupons` tràn bảng nội bộ (`DEF-RT-08`), `inventory` vắng ở sidebar, `STAFF` thấy cả mục Admin-only (`DEF-RT-17`), thiếu tab Returns (`DEF-RT-05`) | `evidence/04_admin13_clean_populated.json`, `screenshots/final49_def08_admin_brands_populated.png` | Không tự ý thêm tab; ghi nhận đủ cả 13 tab thực tế & khuyết điểm |
| **29** | Dashboard data & API requests | **`PARTIAL`** | Khi bình thường hiển thị đúng KPI/table; khi API lỗi `429`/`500`, `AdminDashboardPage.tsx:339-343` nuốt lỗi hiện `0đ` & bảng trống (`DEF-RT-15`) | `AdminDashboardPage.tsx:339-351`, `screenshots/final49_admin_tablet_768.png` | Dễ gây hiểu nhầm dữ liệu doanh thu bằng 0 khi backend nghẽn/lỗi |
| **30** | CRUD & validation hiện có | **`PARTIAL`** | `POST/PUT/DELETE /admin/products` dữ liệu hợp lệ PASS (`201/200/200`); payload sai `{name:'', price:-50}` trả **`500`** thiếu Zod (`DEF-RT-14`) | `admin.controller.ts:41-60`, `05_isolated_interactive_rbac_crud.json:128` | Cần bổ sung Zod request validation trong `AdminController` |
| **31** | Unauthorized access (4 roles) | **`PASS`** | `GUEST`=`401`; `CUSTOMER`=`403` + UI gate; `STAFF`=`200` ops & `403` role/toggle escalation; `ADMIN`=`200` | `admin.routes.ts:10,74-75`, `05_isolated_interactive_rbac_crud.json` | Kiểm soát RBAC 4 vai trò ở backend an toàn, chống leo thang quyền |
| **32** | JS/React console errors | **`PARTIAL`** | `0` hydration/pageErrors trên routes tĩnh; click Google tại `/register` bắn `401` unhandled rejection (`DEF-RT-03`); sweep >30 page gây `89` `429` | `RegisterPage.tsx:332`, `04_live_browser_security_admin_audit.json:954-1315` | Phát hiện lỗi runtime JS tại nút Google trang Đăng ký |
| **33** | Network errors & failed API | **`PARTIAL`** | Normal flows 200; nhưng Google `/register` `401`, `forgot-password` `500` (`DEF-RT-04`), invalid admin product `500` (`DEF-RT-14`), burst `429` (`DEF-RT-13`) | Logs `04` & `05` | Các API lỗi `401`/`500` trùng khớp chính xác với danh sách defect |
| **34** | API 4xx/5xx classification | **`PASS`** | Phân biệt chuẩn: Expected security/validation (`400/401/403/404`), Rate limit (`429`) vs Genuine server bugs (`500` `DEF-RT-04`, `DEF-RT-14`) | Logs `04` & `05` | Không nhầm lẫn phản hồi bảo mật với lỗi hệ thống |
| **35** | Broken images, layout & overflow | **`PARTIAL`** | `21/22` route `0` broken img (file đĩa đủ, `/` có 62 ảnh lazy offscreen); còn `DEF-RT-01`, `DEF-RT-07`, `DEF-RT-08`, `DEF-RT-10`, `DEF-RT-12` (WCAG: `NOT VERIFIED`) | `04_live_browser_security_admin_audit.json`, screenshots | Chênh lệch lớn ở ánh xạ ảnh ngữ nghĩa và tràn layout bảng/tablet |
| **36** | Responsive | **`PARTIAL`** | `35/36` viewport checks PASS (`375x812`, `430x932`, `768x1024`, `1366x768`, `1440x900`); **duy nhất Tablet `768x1024` `/product/detail/macbook-pro-16-m3-max` tràn `920>768` (`DEF-RT-07`)** | `ProductDetailPage.tsx:551`, `screenshots/final49_def07_tablet_product_overflow.png` | Mobile & Desktop đạt; Tablet trang chi tiết sản phẩm cắt giá & nút mua |
| **37** | Modal, dropdown, forms & states | **`PARTIAL`** | Dialog CRUD chính chạy tốt; `.pc-modal` không đóng bằng `Esc` (`DEF-RT-17`), `#tpChatbotLauncher` lỗi stability click (`DEF-RT-10`), Dashboard thiếu error UI (`DEF-RT-15`) | `05_isolated_followup_staff_pcbuilder_ai.json`, `04_live...json` | Cần bổ sung xử lý phím Esc, stability nút chat và error banner |
| **38** | JWT, RBAC & Admin middleware | **`PASS`** | Missing JWT `401`, forged JWT `401`, IDOR `/orders/detail` `401`, sai SĐT `404`, `0` stack leaks | `evidence/04_live_browser_security_admin_audit.json:699-895` | `13/13` kiểm tra HTTP bảo mật đạt chuẩn |
| **39** | Secrets trong frontend | **`PASS`** | Quét `dist/assets/index-iG3JJKO1.js`: `findings: []` (`0` secret rò rỉ) | `evidence/04_live_browser_security_admin_audit.json:896-901` | Bundle production sạch không chứa thông tin nhạy cảm |
| **40** | Cache isolation giữa tài khoản | **`PASS`** | Tab A logout -> Tab B tự xóa thông tin User A (`tabBClearedUser1: true`); đổi tài khoản A->B sạch cache | `evidence/05_isolated_interactive_rbac_crud.json:69-73` | Đã xác minh trực tiếp đa tab trình duyệt |
| **41** | CORS & input validation | **`PARTIAL`** | Origin lạ bị CORS từ chối, Helmet chuẩn, SQLi qua Prisma an toàn, `/auth/login` validate `400`; nhưng Admin CRUD thiếu Zod (`DEF-RT-14`) | `app.ts`, `admin.controller.ts` | Bảo mật tầng biên tốt; cần bổ sung Zod validation tại Admin Controller |
| **42** | DB transaction & inventory consistency | **`PASS`** | Isolated `3307`: Checkout COD giảm kho `28 -> 26`, overstock `400`, Return ghi 2 audit logs; Dev DB bảo toàn | `evidence/05_isolated_interactive_rbac_crud.json`, `07_dev_db_after.json` | Giao dịch kho & đơn hàng nguyên tử trong `$transaction` |
| **43** | Performance & server stability | **`PARTIAL`** | Local API avg `1.8–16.3 ms`, page load `838–1157 ms`; nhưng bundle `1,186.36 kB`, burst hits `429` (`DEF-RT-13`), **Load test 1.000 CCU: `NOT TESTED`** | `04_live_browser_security_admin_audit.json:902-953`, `rateLimit.ts` | Hiệu năng single-user nhanh; chưa thực hiện bài stress test quy mô lớn |
| **44** | Defect register P0–P4 | **`PASS`** | Đầy đủ `DEF-RT-01`..`DEF-RT-17` theo chuẩn 14 trường, rõ mức độ & `Approval required: YES` | [`03_DEFECT_REVALIDATION.md`](03_DEFECT_REVALIDATION.md) | Báo cáo trung thực, mở rộng đúng thực tế |
| **45** | Screenshots & logs | **`PASS`** | Lưu đủ `36` logs/JSON và `9` PNG screenshots không chứa secrets | [`08_EVIDENCE_INDEX.md`](08_EVIDENCE_INDEX.md) | Đặt tên rõ ràng, liên kết đầy đủ |
| **46** | Báo cáo audit hoàn chỉnh | **`PASS`** | Đủ 1 báo cáo chính + 8 file bổ trợ tại `final-runtime-verification/`, giữ nguyên `runtime-launch/` | [`08_EVIDENCE_INDEX.md`](08_EVIDENCE_INDEX.md) | Độc lập, không ghi đè dữ liệu lịch sử |
| **47** | Website & API URLs | **`PASS`** | `:5173/`, `:5173/admin`, `/api/v1/health`, `/api/v1/system/meta`, `/api/docs.json` đều trả `HTTP 200` | [`07_GIT_AND_PROCESS_HANDOVER.md`](07_GIT_AND_PROCESS_HANDOVER.md) | Xác minh truy cập trực tiếp cuối phiên |
| **48** | PID, ports & stop commands | **`PASS`** | Ghi chính xác Vite `32852`/`16932` (`:5173`), API `13588`/`35208`/`11684` (`:3000`), MySQL `nexora-mysql-1` (`:3306`) & `taskkill` | [`07_GIT_AND_PROCESS_HANDOVER.md`](07_GIT_AND_PROCESS_HANDOVER.md) | Cung cấp chính xác lệnh dừng cho từng cây process |
| **49** | Git & database integrity | **`PASS`** | Git `main` HEAD `bddbf44...` không đổi; Dev DB `842->843` (`carts +1` do `GET /cart`, 26 bảng khác `0` đổi); test container đã xóa | `evidence/01_dev_db_before.json`, `07_dev_db_after.json` | Chứng minh toàn vẹn mã nguồn và dữ liệu trước/sau audit |

---

## C. Quality Gates & Baseline Comparison (`320 / 320 PASS`)

Chi tiết log tại [`04_QUALITY_GATES_AND_TEST_RESULTS.md`](04_QUALITY_GATES_AND_TEST_RESULTS.md):
- **TypeScript (`npm run typecheck`):** **`PASS`** (`ExitCode: 0`, `10.36s`) — khớp baseline.
- **ESLint (`npm run lint`):** **`PASS`** (`ExitCode: 0`, `36.45s`, `0` errors / `0` warnings) — khớp baseline.
- **Prettier (`npm run format:check`):** **`FAIL`** (`ExitCode: 1`, `6.58s`) — **`71` files** so với `63` baseline (chênh lệch **`+8` files** thuộc `comprehensive-audit/runtime-launch/` được sinh từ đợt kiểm toán trước: `4` TS/TSX active source + `1` TS seed + `58` `.md` + `8` JSON/MD của `runtime-launch/`). Không tự format.
- **Production Build (`npm run build`):** **`PASS`** (`ExitCode: 0`, `15.69s`, `288` modules, `index-iG3JJKO1.js 1,186.36 kB`, cảnh báo chunk `> 500 kB`).
- **Automated Test Suites (`320 / 320 PASS`, `0` double-counting, `0` chênh lệch với baseline M6.5):**
  - **Tier 1 (`npm run test:unit`):** **`135 / 135 PASS`** (`12/12` files: `36` Pure Unit + `99` Frontend RTL, `22.20s`).
  - **Tier 2A (Backend Integration & Security trên `3307/nexora_test`):** **`175 / 175 PASS`** (`11/11` files, `12.84s`).
  - **Tier 2B (DB Connectivity `3307/nexora_test`):** **`1 / 1 PASS`** (`1/1` file, `1.21s`) -> Backend/DB tổng `176 / 176 PASS`.
  - **Tier 3 (Playwright E2E cô lập `:5174 / :3001 -> 3307/nexora_test`):** Sau lần chạy đầu tiên exit `1` trước khi cấu hình port cô lập, lần chạy chuẩn xác nhận **`9 / 9 PASS`** (`2/2` files, `11.78s`, lưu ý `Journey 3` `storefront_journeys.spec.ts:34` dùng `input[type="email"]` khớp Footer newsletter thay vì `#login_email` `type="text"`).

---

## D. Defect Register (`DEF-RT-01` – `DEF-RT-17`, Tất cả `Approval required: YES`)

Chi tiết đủ 14 trường cho từng lỗi xem tại [`03_DEFECT_REVALIDATION.md`](03_DEFECT_REVALIDATION.md):

- **`P1 High (3)` — Tất cả `REPRODUCED`:**
  - `DEF-RT-01`: `productImage.ts:169-240` — `includes('in')` gán sai **`175/674`** SP không phải máy in (`23` màn hình, `31` tản, `47` PC/gaming, `31` loa/mic, `43` khác) sang `printer-canon.jpg`, và **`31`** handheld console có `"Ryzen"` sang `cpu_ryzen7.jpg`.
  - `DEF-RT-02`: `PcBuilderPage.tsx:432,442,486` — **Mở rộng phạm vi:** Không chỉ console Ryzen lọt vào Slot CPU trên DB 674 SP, tại DB 23 SP `catSlug.includes` lọt **VGA `RTX 4070 Ti SUPER` vào Slot 0 (CPU)** & **tản AIO `DeepCool LT720` vào Slot 6 (Case)**; `default: return true` giữ mở.
  - `DEF-RT-03`: `RegisterPage.tsx:332` — Nút Google gọi `POST /auth/login` với `customer@nexora.vn` -> **`401` + Unhandled Promise Rejection** (`LoginPage.tsx:152` hiện thông báo SSO ổn); Google OAuth là `UI ONLY / MOCKED`.
- **`P2 Medium (6)` — `4` cũ `REPRODUCED` + `2` MỚI (`OPEN`):**
  - `DEF-RT-04`: `email.service.ts:60-79` — `POST /auth/forgot-password` trả `500 EMAIL_DELIVERY_FAILED` cho email tồn tại khi dev thiếu SMTP/Resend (`200` cho email không tồn tại).
  - `DEF-RT-05`: `AdminDashboardPage.tsx` vs `admin.routes.ts:83-85` — Admin UI thiếu tab Đổi/Trả dù Backend & Customer UI đã hoàn tất; Dev DB `NX-2026-0001` có `delivered_at: null`.
  - `DEF-RT-06`: `CategorySidebar.tsx:311-320` — Bỏ qua prop `categories`, hiển thị cứng `16` danh mục tĩnh thay vì `22` danh mục API.
  - `DEF-RT-07`: `ProductDetailPage.tsx:551` — Tại Tablet `768x1024`, tràn ngang `920px > 768px` (`+152px`), cắt giá `94.990.000đ` & CTA (`final49_def07_tablet_product_overflow.png`).
  - **`DEF-RT-14` *(MỚI)*:** `admin.controller.ts:41-60` — Admin CRUD thiếu Zod validation đầu vào, payload lỗi `{name:'', price:-50}` trả **`HTTP 500`** thay vì `400 VALIDATION_ERROR`.
  - **`DEF-RT-15` *(MỚI)*:** `AdminDashboardPage.tsx:339-343` — Nuốt lỗi HTTP `429`/`500` và hiển thị giả tạo `0đ` / bảng trống không có thông báo lỗi (`final49_admin_tablet_768.png`).
- **`P3 Low (7)` — `5` cũ `REPRODUCED` + `2` MỚI (`OPEN`):**
  - `DEF-RT-08`: **Mở rộng phạm vi** — Không chỉ `/admin/brands` (`1136 > 1065`, `actionThRight: 1441 > wrapRight: 1370`), cả **`/admin/orders` & `/admin/coupons`** (`1112 > 1065`) bị tràn ngang bên trong card bao ngoài tại `1440x900`.
  - `DEF-RT-09`: `StorefrontHeader.tsx:190` (`300K` vs `500k`), `ServicePolicyBar.tsx:64` (`1900 1234` vs `1800 2097`), `AiAssistantPage.tsx:23-28` (`under_10m`..`over_35m`), và `20` sản phẩm `PC TechPilot...`/`PC-TP-*` trong bảng `products`.
  - `DEF-RT-10`: Promo modal `zIndex: 99999` đè Chatbot drawer (`final49_def10_popup_chatbot.png`), `#tpChatbotLauncher` đè Toast và timeout stability `2500ms`.
  - `DEF-RT-11`: `npm run format:check` Exit `1`, **`71` files** (`63` baseline + `8` file `runtime-launch/`).
  - `DEF-RT-12`: Thiếu `<h1>` tại `/`, `/compare`, `/ai-assistant`, `/admin` Gate; thiếu landmark `<header>/<main>/<footer>` tại AdminGate/ForgotPassword; `ProductCard.tsx:195-211` dùng `title` thay `aria-label`; Full WCAG: `NOT VERIFIED`.
  - **`DEF-RT-16` *(MỚI)*:** `cart.service.ts:9-56` — `GET /api/v1/cart` gọi `getOrCreateCart()` tự động `INSERT` row `carts` rỗng (`item_count: 0`) cho mỗi guest browser session mới (nguyên nhân trực tiếp `+8` dòng cũ & `+1` dòng mới).
  - **`DEF-RT-17` *(MỚI)*:** `.pc-modal` PC Builder không đóng bằng phím `Escape` (`escClosesModal: false`), UI Admin của `STAFF` vẫn hiển thị mục `Khách hàng`/`Cài đặt` dù API chặn `403`, và `storefront_journeys.spec.ts:34` dùng `input[type="email"]` khớp Footer thay vì `#login_email`.
- **`P4 Info (1)` — `REPRODUCED`:**
  - `DEF-RT-13`: Main JS bundle `1,186.36 kB > 500 kB`; `globalApi: 300/15m` (`rateLimit.ts:51-55`) kích `HTTP 429` khi quét >30 lượt mở trang liên tục (`10` API/Homepage); `62` ảnh lazy offscreen trong carousel `/`. **`Approval required: YES` — Chờ Project Owner chốt phương án tối ưu code-splitting / cấu hình rate-limit hoặc giữ nguyên.**

---

## E. Runtime & Browser Audit

*(Chi tiết tại [`05_RUNTIME_BROWSER_AND_RESPONSIVE_AUDIT.md`](05_RUNTIME_BROWSER_AND_RESPONSIVE_AUDIT.md))*
- **URLs kiểm tra thực tế:** Web `http://localhost:5173/`, Admin `http://localhost:5173/admin`, API `http://localhost:3000/api/v1`, Health `http://localhost:3000/api/v1/health` (`200`), Swagger `http://localhost:3000/api/docs.json` (`200`).
- **Console & Network Errors:** `0` JS errors trên 14 storefront routes tĩnh & 13 Admin tabs (sau khi reset rate-limit); `1` unhandled rejection khi bấm nút Google tại `/register` (`401`); `89` console `429` trên `AdminLive` ở sweep cường độ cao trước lúc restart API; `500` ở `/auth/forgot-password` (email thật) và `POST /admin/products` (invalid payload).
- **Responsive Screenshots & Viewports:** Kiểm tra `31` ma trận (`25` Customer qua `375x812`, `430x932`, `768x1024`, `1366x768`, `1440x900` + `6` Admin qua `768x1024`, `1366x768`), đạt `30/31` không tràn tài liệu — duy nhất Tablet `768x1024` Product Detail bị tràn (`DEF-RT-07`).
- **Luồng nghiệp vụ đã kiểm tra trên môi trường cô lập `3307/nexora_test`:** PC Builder (12 slots), Compare AI, Cart Merge & Overstock, Auth/Register/Cross-tab logout/Forgot password, Profile & Address CRUD, Verified Reviews CRUD, 7-day Return Request & Admin API Approve, COD Checkout + Inventory TX, VNPay Sandbox URL + Tampered Hash Reject, 4-Role RBAC & Admin CRUD, AI 5-step Survey + Chatbot Fallback, Rate Limit `429`.

---

## F. Security & Database Integrity

*(Chi tiết tại [`06_SECURITY_AND_DATABASE_INTEGRITY.md`](06_SECURITY_AND_DATABASE_INTEGRITY.md))*
- **Auth/RBAC & Cache Isolation:** Kiểm chứng `13/13` security HTTP checks (`401` unauth/forged JWT, `403` non-purchaser & `CUSTOMER`/`STAFF` escalation, IDOR `/orders/detail` `401`, SQLi safe `total: 0`, `0` stack leaks, Helmet `nosniff` + `SAMEORIGIN`), `4-role RBAC` đầy đủ, cross-tab logout & account switching sạch 100%.
- **CORS & Frontend Secret Scan:** Allowlist từ chối origin lạ cleanly; `dist/assets/index-iG3JJKO1.js` cho `0` phát hiện secrets.
- **Dev DB Before/After (`127.0.0.1:3306/nexora`, `7ffc1a14a558`):**
  - Before: `27` bảng, **`842` rows** (`carts: 28`).
  - After: `27` bảng, **`843` rows** (`carts: 29`).
  - **Chênh lệch duy nhất `+1` row `carts` (`id 225`, `user_id: null`, `item_count: 0`)** do trình duyệt guest đọc `/` kích hoạt `GET /api/v1/cart` -> `getOrCreateCart()` (`DEF-RT-16` — cùng nguyên nhân của `+8` rows `id 217..224` từ phiên trước). `26` bảng còn lại (`products: 674`, `orders: 2`, `users: 3`, `reviews: 0`, `return_requests: 0`, v.v.) **thay đổi = `0`**. Toàn bộ container test `:3307` đã được gỡ bỏ.

---

## G. Git Integrity

- **Initial & Final Branch:** `main` (`0/0` vs `origin/main`)
- **Initial & Final HEAD:** `bddbf444d651bcf8bd43765318fb4fd6bd9654d6` *(không đổi)*
- **Tracked Modified (`git diff --stat`):** `0` files *(CLEAN)*
- **Staged Files (`git diff --cached --stat`):** `0` files *(CLEAN)*
- **Untracked Files (`git status --short`):** Chỉ `?? comprehensive-audit/final-runtime-verification/` và `?? comprehensive-audit/runtime-launch/`.
- **Cam kết:** **0 commit**, **0 push**, **0 reset/clean/restore**, **`TechPilot` nguyên vẹn**.

---

## H. Handover (`Running Live Servers`)

| Thành phần | URL truy cập | Port | PID chính xác | Command khởi chạy | Lệnh dừng chính xác (PowerShell) | Trạng thái |
| --- | --- | :---: | ---: | --- | --- | :---: |
| **Customer Web** | `http://localhost:5173/` | `::5173` | **`32852`** *(Vite)* / `16932` *(npm)* | `npm run dev:web` | `taskkill /PID 16932 /T /F` | **RUNNING (`HTTP 200`)** |
| **Admin Portal** | `http://localhost:5173/admin` | `::5173` | *(chung Vite `32852`)* | *(SPA route)* | *(chung lệnh trên)* | **RUNNING (`HTTP 200`)** |
| **Backend API** | `http://localhost:3000/api/v1` | `::3000` | **`13588`** *(worker)* / `35208` *(`tsx`)* / `11684` *(npm)* | `npm run dev:api` | `taskkill /PID 11684 /T /F` | **RUNNING (`HTTP 200`)** |
| **API Health** | `http://localhost:3000/api/v1/health` | `::3000` | *(chung API)* | — | — | **`HTTP 200` (`database: up`)** |
| **Swagger Docs** | `http://localhost:3000/api/docs.json` *(UI `/api/docs`)* | `::3000` | *(chung API)* | — | — | **RUNNING (`HTTP 200`)** |
| **MySQL 8.4 DB** | `127.0.0.1:3306` (`nexora`) | `3306` | `nexora-mysql-1` | `docker compose up -d mysql` | `docker compose stop mysql` | **`healthy`** |

*(Tài khoản dev sẵn có trong DB: `admin@nexora.local` [`ADMIN`], `staff@nexora.local` [`STAFF`], `customer@nexora.local` [`CUSTOMER`]; không công bố mật khẩu trong tài liệu kiểm toán. Nếu tiến trình nền bị dừng sau khi đóng phiên IDE, chạy `docker compose up -d mysql`, sau đó mở 2 terminal riêng chạy `npm run dev:api` và `npm run dev:web`.)*
