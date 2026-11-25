# 08. EVIDENCE INDEX — FINAL 49-POINT AUDIT

Toàn bộ bằng chứng kiểm chứng được tạo mới hoàn toàn trong phiên này và lưu tại `D:\Nexora\comprehensive-audit\final-runtime-verification\evidence\`. Không chứa API keys, JWT secrets, database passwords hay user passwords.

---

## 1. Báo cáo Audit trong `D:\Nexora\comprehensive-audit\final-runtime-verification\`

| File | Nội dung chính |
| --- | --- |
| [`FINAL_49_POINT_RUNTIME_AUDIT_REPORT.md`](FINAL_49_POINT_RUNTIME_AUDIT_REPORT.md) | Báo cáo chính tổng hợp đầy đủ 8 mục A–H, Verdict `PASS WITH LIMITATIONS`, đủ 49/49 tiêu chí & 17 defects. |
| [`01_EXECUTIVE_SUMMARY.md`](01_EXECUTIVE_SUMMARY.md) | Tóm tắt điều hành, scorecard `29 PASS / 19 PARTIAL / 1 FAIL / 0 BLOCKED / 0 NOT TESTED`, phân bổ `P0–P4`. |
| [`02_49_POINT_CHECKLIST_RESULTS.md`](02_49_POINT_CHECKLIST_RESULTS.md) | Bảng chi tiết 49 tiêu chí (Group 1–8) kèm phương pháp, bằng chứng, file/route và giải thích. |
| [`03_DEFECT_REVALIDATION.md`](03_DEFECT_REVALIDATION.md) | Hồ sơ tái kiểm chứng `DEF-RT-01`..`DEF-RT-13` + `4` lỗi mới `DEF-RT-14`..`DEF-RT-17` (đủ 14 trường, `Approval required: YES`). |
| [`04_QUALITY_GATES_AND_TEST_RESULTS.md`](04_QUALITY_GATES_AND_TEST_RESULTS.md) | Kết quả thực thi `typecheck`, `lint`, `format:check`, `build` và `320/320` tests trên DB cô lập `3307/nexora_test`. |
| [`05_RUNTIME_BROWSER_AND_RESPONSIVE_AUDIT.md`](05_RUNTIME_BROWSER_AND_RESPONSIVE_AUDIT.md) | Kết quả duyệt thực tế `14` desktop routes, `13` Admin tabs, `31` ma trận responsive, luồng D3–D12, scan 674 sản phẩm. |
| [`06_SECURITY_AND_DATABASE_INTEGRITY.md`](06_SECURITY_AND_DATABASE_INTEGRITY.md) | Kết quả 13 security HTTP checks, 4-role RBAC, secret scan bundle `dist/`, cross-tab cache & đối chiếu DB before/after. |
| [`07_GIT_AND_PROCESS_HANDOVER.md`](07_GIT_AND_PROCESS_HANDOVER.md) | Đối chiếu Git `before/after`, bảng URL xác minh cuối phiên, PIDs/Ports và lệnh dừng/khởi chạy chính xác. |
| [`08_EVIDENCE_INDEX.md`](08_EVIDENCE_INDEX.md) | Danh mục toàn bộ logs, JSON output và screenshots bằng chứng. |

---

## 2. Logs & Structured Evidence Files (`evidence/`)

| File | Nhóm kiểm chứng | Kích thước / Ghi chú |
| --- | --- | --- |
| `evidence/01_preflight_git_env.log` | Preflight Git, OS/Node/Docker versions, Ports/PIDs ban đầu, `npm ls --depth=0` | Baseline trước audit |
| `evidence/01_env_audit.log` | Phân loại key `.env` (redacted 100% secrets) | Configured vs Missing |
| `evidence/01_dev_db_before.json` | Snapshot Dev DB `3306/nexora` trước audit (`27` bảng, `842` dòng, `carts: 28`) | Baseline DB |
| `evidence/02_typecheck.log` | Log `npm run typecheck` (`ExitCode: 0`, `10.36s`) | Quality Gate |
| `evidence/02_lint.log` | Log `npm run lint` (`ExitCode: 0`, `36.45s`, 0 errors/warnings) | Quality Gate |
| `evidence/02_prettier.log` | Log `npm run format:check` (`ExitCode: 1`, `6.58s`, `71` files) | Quality Gate (`DEF-RT-11`) |
| `evidence/02_build.log` | Log `npm run build` (`ExitCode: 0`, `15.69s`, `288` modules, `1,186.36 kB` chunk) | Quality Gate (`DEF-RT-13`) |
| `evidence/02_quality_gates_summary.json` | Metadata chính xác thời gian & exit code 4 quality gates | Summary JSON |
| `evidence/03_isolated_db_identity.txt` | Kết quả `SELECT DATABASE(), @@hostname` (`nexora_test`, `48dc62fd9cb6`, `8.4.13`) | Bằng chứng cách ly DB |
| `evidence/03_isolated_migrate.log` / `03_isolated_migrate2.log` | Prisma `migrate deploy` trên container test `:3307` | Test DB setup |
| `evidence/03_isolated_seed.log` / `03_isolated_seed2.log` | Prisma seed trên `:3307` | Test DB setup |
| `evidence/03_live_startup_precheck.log` | Kiểm tra HTTP `/api/v1/health`, `/system/meta`, `/docs.json`, `:5173/`, `categories` (`22`), `products` (`674`) | Runtime precheck |
| `evidence/03_test_unit_rtl.log` | Output `npm run test:unit`: `12/12` files, `135/135` PASS | Test Suite Tier 1 |
| `evidence/03_test_tier2a_backend.log` | Output Tier 2A: `11/11` files, `175/175` PASS (`3307/nexora_test`) | Test Suite Tier 2A |
| `evidence/03_test_tier2b_db.log` | Output Tier 2B: `1/1` file, `1/1` PASS (`3307/nexora_test`) | Test Suite Tier 2B |
| `evidence/03_test_tier3_playwright.log` | Output Playwright E2E cô lập (`:5174/:3001 -> 3307`): `2/2` files, `9/9` PASS | Test Suite Tier 3 |
| `evidence/03_tests_summary.json` / `03_test_tier3_meta.json` | Exit codes & duration các đợt chạy test | Summary JSON |
| `evidence/04_live_browser_security_admin_audit.json` | 14 desktop routes, 31 responsive matrix, 13 HTTP security checks, bundle scan, API timings, `89` rate-limit `429` console errors | Browser Live Read-Only Audit |
| `evidence/04_admin13_clean_populated.json` | Kiểm tra sạch `13/13` Admin tabs sau restart API (`0` HTTP/console err, clipping tại `orders`, `brands`, `coupons`) | Admin Populated Audit |
| `evidence/05_isolated_interactive_rbac_crud.json` | Kết quả giao dịch cô lập D4–D12, Google 401, Forgot `500`, Cross-tab logout, Returns 7d, COD, VNPay HMAC, 4-role RBAC, CRUD `500` (`DEF-RT-14`) | Isolated Functional & RBAC |
| `evidence/05_isolated_followup_staff_pcbuilder_ai.json` | Check `STAFF` sidebar UI (12 nav items), đủ 12 slot PC Builder (`DEF-RT-02`, `Esc: false`), Chatbot `200` | Followup Deep Verification |
| `evidence/05_isolated_api.log` / `05_isolated_api_err.log` | Log server API cô lập `:3001` | Server logs |
| `evidence/05_isolated_web.log` / `05_isolated_web_err.log` | Log Vite Web cô lập `:5174` | Server logs |
| `evidence/05_followup_api*.log` / `05_followup_web*.log` / `05_followup_migrate.log` / `05_followup_seed.log` | Log phiên followup STAFF / PC Builder / AI cô lập | Server/DB logs |
| `evidence/06_def_rt01_catalog_674_scan.json` | Quét toàn bộ `674` SP Dev DB (`175` sai sang máy in, `31` console Ryzen sai sang CPU) | `DEF-RT-01` Evidence |
| `evidence/07_dev_db_after.json` | Snapshot cuối Dev DB (`27` bảng, `843` dòng, đối chiếu `+1` dòng `carts` rỗng `id 225` & `+8` dòng `id 217..224`) | Integrity After Audit |

---

## 3. Screenshots (`evidence/screenshots/` — 9 PNGs)

| File | Nội dung minh họa | Tham chiếu Defect / Tiêu chí |
| --- | --- | --- |
| `screenshots/final49_mobile_home_375.png` | Storefront Trang chủ trên Mobile `375x812` không tràn ngang | Tiêu chí `#36` Responsive |
| `screenshots/final49_def07_tablet_product_overflow.png` | Product Detail ở Tablet `768x1024` tràn ngang `920px`, cắt giá `94.990.000đ` & CTA | **`DEF-RT-07`**, Tiêu chí `#36` |
| `screenshots/final49_def10_popup_chatbot.png` | Promo modal overlay `zIndex: 99999` đè lên khung Chatbot trên `/` | **`DEF-RT-10`**, Tiêu chí `#18` |
| `screenshots/final49_admin_dashboard_1440.png` | Giao diện Admin Dashboard Tổng quan ở `1440x900` | Tiêu chí `#28`, `#29` |
| `screenshots/final49_admin_tablet_768.png` | Admin Dashboard tại `768x1024` hiện `0đ` / rỗng khi API gặp `429` không báo lỗi | **`DEF-RT-15`**, Tiêu chí `#29`, `#37` |
| `screenshots/final49_def08_admin_brands_1440.png` | Tab Admin Brands khi chưa có dữ liệu (khi bị rate-limit `429`) | **`DEF-RT-08`**, **`DEF-RT-15`** |
| `screenshots/final49_def08_admin_brands_populated.png` | Tab `/admin/brands` với `10` rows thật trên `1440x900`, bảng `1136 > 1065` bị cắt mép phải | **`DEF-RT-08`**, Tiêu chí `#28` |
| `screenshots/final49_staff_admin_portal.png` | Cổng đăng nhập Admin Authentication Gate | Tiêu chí `#27` |
| `screenshots/final49_staff_admin_logged_in.png` | Giao diện `/admin` sau khi đăng nhập tài khoản `STAFF` thấy cả 12 tab điều hướng | Tiêu chí `#27`, `#31`, **`DEF-RT-17`** |
