# 12 — Git and Milestone History

- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce
- **Mã phân loại:** `AUDIT-HANDOVER-12`
- **Phiên bản:** `1.0.0 — Final Handover Baseline`
- **Thời điểm kiểm kê:** `2026-11-23`
- **Trạng thái:** `VERIFIED EMPIRICALLY FROM LOCAL GIT REPOSITORY LOGS`
- **Branch hiện tại:** `main`
- **Latest Accepted Commit:** `607315261fcf802c517e0d32e210817d2080341d`
- **Parent Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **Trạng thái Working Tree:** Tracked tree sạch tuyệt đối; untracked files được bảo toàn; chưa thực hiện `push`.

---

## 1. Biên Niên Sử Các Giai Đoạn Dự Án (Chronicle of Project Milestones)

Toàn bộ lịch sử phát triển của dự án Nexora được xây dựng độc lập với lịch sử Git sạch, tuân thủ quy chuẩn Conventional Commits với ngôn ngữ bắt buộc là **tiếng Việt không dấu**:

```
+-----------------------------------------------------------------------------------+
|                        LỊCH SỬ CÁC MILESTONE ĐÃ HOÀN TẤT                         |
+-----------------------------------------------------------------------------------+
|  1. GIAI ĐOẠN PHASE A: THIẾT LẬP NỀN TẢNG & KIẾN TRÚC                             |
|     ├── Khởi tạo Monorepo, Data Model 3NF, Prisma ORM, MySQL 8.4                 |
|     ├── Tái thiết kế toàn diện Visual Parity cho Admin Dashboard và Storefront   |
|     └── Vá lỗi bảo mật cốt lõi: RBAC, IDOR, Rate Limiting, Deadlock Transactions  |
|                                                                                   |
|  2. GIAI ĐOẠN PHASE B BACKEND (M1 – M5): HOÀN THIỆN NGHIỆP VỤ LÕI                |
|     ├── M1 & M2: Hoàn thiện API Contracts & Backend Profile, Sổ địa chỉ          |
|     ├── M3: Backend Giỏ hàng & Guest Cart Merge với khóa đồng thời FOR UPDATE     |
|     ├── M4: Backend Đánh giá Customer Reviews, Kiểm duyệt & Xử lý Unique P2002   |
|     └── M5: Backend Quy trình Đổi trả hàng (Returns Workflow) & Admin CRUD       |
|                                                                                   |
|  3. GIAI ĐOẠN PHASE B FRONTEND & TÍCH HỢP (M6.1 – M6.5): TRẢI NGHIỆM NGƯỜI DÙNG   |
|     ├── M6.1: Tích hợp Frontend Guest Cart Merge & API Foundation                |
|     ├── M6.2: Tích hợp Frontend Customer Profile, Sổ địa chỉ & Bảo mật           |
|     ├── M6.3: Tích hợp Frontend Đánh giá sản phẩm Customer Reviews               |
|     ├── M6.4: Tích hợp Frontend Đổi trả hàng Customer Returns                    |
|     └── M6.5: Integration Testing & QA (320/320 Tests PASS, CR-01, 02, 03 CLOSED)|
+-----------------------------------------------------------------------------------+
```

---

## 2. Bảng Danh Mục Các Commit Trọng Yếu (Key Milestones Commit Table)

Trích xuất trực tiếp từ nhật ký Git thực tế (`git log --oneline`):

| Commit Hash | Milestone / Phạm vi | Thông điệp Commit (Tiếng Việt Không Dấu) | Tác động kỹ thuật chính |
| :--- | :---: | :--- | :--- |
| `6073152` | **M6.5 Final** | `feat(web): hoan tat milestone m6.5 integration qa` | Nghiệm thu đóng M6.5, chốt 3 Change Requests, đạt 320/320 tests PASS |
| `3d8adb1` | **M6.4** | `feat(web): tich hop doi tra don hang m6.4` | Tích hợp giao diện gửi yêu cầu đổi trả, quản lý đơn đổi trả tại Profile |
| `e0e517b` | **M6.3** | `feat(web): tich hop danh gia san pham m6.3` | Tích hợp form đánh giá, chấm sao và danh sách reviews tại trang sản phẩm |
| `85f3a52` | Post-M6.2 | `fix(web): sua loi trung lap danh muc sidebar va toi uu giao dien tin tuc` | Tối ưu hóa UI danh mục và hiển thị tin tức sau khi hoàn tất M6.2 |
| `b5ba48b` | **M6.2** | `feat(web): tich hop tai khoan khach hang m6.2` | Tích hợp trang cá nhân khách hàng, sổ địa chỉ nhận hàng, đổi mật khẩu |
| `4c6c261` | M6.1 Polish | `fix(web): hoan thien dto validation va passive retry lifecycle m6.1` | Hoàn thiện xác thực DTO Zod và cơ chế thử lại thụ động giỏ hàng |
| `9880019` | **M6.1** | `feat(web): hoan thien guest cart merge va api foundation m6.1` | Tích hợp tự động gộp giỏ hàng khách vãng lai khi đăng nhập |
| `a307dd3` | M5 Polish | `docs(audit): bao cao xac minh tinh toan ven du lieu migration delivered_at m5` | Báo cáo đối soát tính toàn vẹn trường `deliveredAt` trong database |
| `7e3dcda` | M5 Safety | `fix(returns): siet chat deliveredAt va loai bo hoan toan fallback updatedAt m5` | Loại bỏ fallback nguy hiểm `updatedAt`, siet chặt thời hạn đổi trả 7 ngày |
| `3c42638` | **M5** | `feat(returns): trien khai quy trinh doi tra va admin crud m5` | Xây dựng Data model, Service, State machine đổi trả và Admin CRUD |
| `02b8a6d` | M4 Polish | `fix(review): siet chat xu ly p2002 va xac nhan rbac m4` | Bắt lỗi vi phạm ràng buộc Unique P2002, chuyển thành 409 Conflict |
| `29d2f4d` | **M4** | `feat(review): hoan thien customer reviews backend m4` | Triển khai Backend API đánh giá sản phẩm, kiểm duyệt và phân quyền |
| `93fa529` | M3 Safety | `fix(cart-lock): chuyen sang prisma queryraw for update dong bo cross user merge` | Khóa hàng bằng `SELECT ... FOR UPDATE` chống race condition gộp giỏ |
| `68b1e4c` | **M3** | `feat(cart): hoan thien guest cart merge backend m3 va don sach techpilot css` | Triển khai API gộp giỏ hàng backend M3 và dọn dẹp CSS rác cũ |
| `01a8f53` | **M1 & M2** | `feat(profile): hoan thien api contracts m1 va backend profile dia chi m2` | Triển khai API Profile và Sổ địa chỉ nhận hàng của khách |
| `db33932` | Phase A | `fix(security): dong bo chinh sach rbac admin bo sung test order track` | Đồng bộ chính sách RBAC Admin, kiểm tra IDOR và Rate Limiting |
| `03d13be` | Phase A | `fix(order): xu ly write conflict va deadlock trong transaction don hang dong thoi` | Xử lý triệt để tranh chấp ghi và deadlock khi tạo đơn hàng đồng thời |
| `1aa6ed2` | Phase A | `feat(branding): chuan hoa 100% thuong hieu nexora tu css topbar database orders` | Chuẩn hóa thương hiệu Nexora trên toàn bộ giao diện và cơ sở dữ liệu |
| `5e2f511` | Phase A | `fix(admin): tai thiet toan dien visual parity admin dashboard theo anh tham chieu` | Tái thiết kế Visual Parity Admin Dashboard theo ảnh tham chiếu gốc |

---

## 3. Chiến Lược Phân Nhánh & Quy Chuẩn Git (Branching Hygiene)

1. **Các nhánh chính thức quy định trong `AGENTS.md`:**
   - `main`: Nhánh sản phẩm chính thức, ổn định, nơi hội tụ các phiên bản đã nghiệm thu.
   - 5 nhánh cá nhân của thành viên đội ngũ: `trung`, `hieu`, `kim`, `dinh`, `phuc`.
2. **Quy tắc bảo vệ commit:**
   - Mọi commit đều được kiểm soát nghiêm ngặt về danh mục file trong Allowlist.
   - Tuyệt đối không commit trực tiếp các tập tin nhạy cảm: `.env`, khóa API, thông tin PII, hoặc mật khẩu văn bản thô.
   - Toàn bộ commit message phải viết bằng tiếng Việt không dấu theo chuẩn Conventional Commits.
3. **Trạng thái Push:**
   - Tính đến thời điểm bàn giao, commit hoàn tất M6.5 `6073152` được lưu trữ an toàn tại Local Git Repository.
   - Chưa thực hiện lệnh `git push` lên GitHub remote (`origin/main`) theo đúng chỉ thị kiểm soát an toàn của Project Owner.
