# BÁO CÁO XÁC MINH TÍNH TOÀN VẸN DỮ LIỆU CUỐI CÙNG — MIGRATION DELIVERED_AT (MILESTONE M5)

- **Mã báo cáo:** `M5_DELIVERED_AT_FINAL_DATA_INTEGRITY_CHECK.md`
- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Hạng mục kiểm toán:** Tính toàn vẹn dữ liệu của Migration `20261122160000_sanitize_unverified_delivered_at`
- **Môi trường đối soát:** MySQL 8.4 LTS (Docker Container), Prisma ORM 6.19.3
- **Thời điểm thực hiện:** `2026-11-22T16:15:00+07:00`
- **Kết luận:** **`PASS`** (Chứng minh 100% bằng chứng thực nghiệm: Không có bất kỳ mốc thời gian giao hàng hợp lệ nào bị xóa nhầm).

---

## 1. Mục đích & Vấn đề cần xác minh

Trong quá trình nghiệm thu Milestone M5, hệ thống đã triển khai migration:
`prisma/migrations/20261122160000_sanitize_unverified_delivered_at/migration.sql`
với câu lệnh:

```sql
UPDATE `orders`
SET `delivered_at` = NULL
WHERE `delivered_at` = `updated_at`;
```

**Mối lo ngại kỹ thuật:**
Điều kiện `WHERE delivered_at = updated_at` được tạo ra để xóa các mốc thời gian backfill không xác thực từ `updatedAt` trước đó. Tuy nhiên, về mặt lý thuyết:

- Đơn hàng A: `deliveredAt` được backfill từ `updatedAt` $\rightarrow$ Cần xóa về `NULL`.
- Đơn hàng B: `deliveredAt` được ghi nhận từ sự kiện giao hàng thực tế của đơn hàng, nhưng tình cờ bằng `updatedAt` $\rightarrow$ Không được xóa.

Báo cáo này tiến hành kiểm tra lịch sử triển khai, đối soát từng bản ghi trong cơ sở dữ liệu MySQL 8.4 và truy vết nguồn gốc (data provenance) để chứng minh tính an toàn tuyệt đối của migration.

---

## 2. Lịch sử triển khai 2 Migration liên quan

Truy vấn đối soát bảng `_prisma_migrations` trên MySQL 8.4:

```sql
SELECT id, migration_name, finished_at, applied_steps_count, checksum
FROM _prisma_migrations
WHERE migration_name IN (
  '20261122140000_add_returns_workflow_and_order_delivered_at',
  '20261122160000_sanitize_unverified_delivered_at'
)
ORDER BY finished_at ASC;
```

**Kết quả thực tế từ MySQL:**

| Migration Name                                               |     Finished At (UTC)      | Applied Steps | Checksum                              |
| :----------------------------------------------------------- | :------------------------: | :-----------: | :------------------------------------ |
| `20261122140000_add_returns_workflow_and_order_delivered_at` | `2026-11-22T06:59:42.443Z` |       1       | `378e87540767bb0641a9707f01c0d692...` |
| `20261122160000_sanitize_unverified_delivered_at`            | `2026-11-22T08:34:02.285Z` |       1       | `14e11fd854f706e771a4460ffd97a3df...` |

Khoảng thời gian giữa hai migration là **1 giờ 34 phút 20 giây** (`06:59:42` $\rightarrow$ `08:34:02` UTC).

---

## 3. Xác minh dữ liệu thực tế trước và sau Migration

### A. Toàn bộ đơn hàng tồn tại trong cơ sở dữ liệu

Truy vấn toàn bộ bảng `orders`:

```sql
SELECT id, order_code, user_id, order_status, payment_status, created_at, updated_at, paid_at, delivered_at
FROM orders;
```

**Bảng dữ liệu thực tế thu thập từ MySQL 8.4:**

|  ID   | Order Code     | User ID |   Status    | Payment |      Created At (UTC)      |      Updated At (UTC)      |       Paid At (UTC)        | Delivered At |
| :---: | :------------- | :-----: | :---------: | :-----: | :------------------------: | :------------------------: | :------------------------: | :----------: |
| **1** | `NX-2026-0001` |    3    | `DELIVERED` | `PAID`  | `2026-11-22T06:51:10.628Z` | `2026-11-22T06:51:10.628Z` | `2026-11-19T06:51:10.627Z` |    `NULL`    |
| **2** | `NX-2026-0002` |    3    | `SHIPPING`  | `PAID`  | `2026-11-22T06:51:10.766Z` | `2026-11-22T06:51:10.766Z` | `2026-11-21T06:51:10.765Z` |    `NULL`    |

_(Ghi chú: Toàn bộ các đơn hàng trong test suite tích hợp như `apps/api/tests/phase_b_returns_and_admin_crud.test.ts` đều được tạo trong transaction `beforeAll` và dọn dẹp sạch sẽ 100% trong `afterAll`, không lưu lại rác trong cơ sở dữ liệu)._

### B. Đối soát số lượng theo yêu cầu

1. **Số lượng đơn hàng bị backfill bởi Migration `20261122140000`:**
   - **Số lượng:** **1 bản ghi**.
   - **Chi tiết:** Đơn hàng ID `1` (`NX-2026-0001`). Khi migration này chạy lúc `06:59:42Z`, chỉ có duy nhất đơn hàng này có `order_status = 'DELIVERED'` và `delivered_at IS NULL`.
2. **Số lượng bản ghi bị Migration `20261122160000` sanitize:**
   - **Số lượng:** **1 bản ghi**.
   - **Chi tiết:** Đơn hàng ID `1` (`NX-2026-0001`).
3. **Danh sách ID các bản ghi bị chuyển `delivered_at` về NULL:**
   - **Danh sách ID:** `[1]`.
4. **Có hay không đơn hàng có `deliveredAt` được ghi nhận từ sự kiện giao hàng thực tế nhưng bị xóa nhầm:**
   - **Kết quả:** **KHÔNG CÓ (0 bản ghi)**.

---

## 4. Chứng minh nguồn gốc dữ liệu (Data Provenance & Lifecycle Evidence)

Việc kết luận không có đơn hàng hợp lệ nào bị xóa nhầm **không dựa vào việc hai timestamp bằng nhau**, mà được chứng minh chặt chẽ bằng chuỗi sự kiện và kiến trúc vòng đời dữ liệu như sau:

### Bằng chứng 1: Thời điểm xuất hiện cột `delivered_at` trong Schema

- Tại migration khởi tạo các bảng đơn hàng `20261119070000_add_orders_coupons_inventory_ai_models/migration.sql`, bảng `orders` chỉ có các trường: `paid_at`, `cancelled_at`, `created_at`, `updated_at`. Trường `delivered_at` **chưa hề tồn tại** trong cơ sở dữ liệu Nexora từ M1 đến M4.
- Cột `delivered_at` lần đầu tiên được tạo ra vào ngày `2026-11-22T06:59:42.443Z` bởi migration `20261122140000`.
- Do đó, **không một đơn hàng nào trước thời điểm `2026-11-22T06:59:42.443Z` có thể mang một mốc thời gian giao hàng thực tế trong cơ sở dữ liệu**.

### Bằng chứng 2: Nguồn gốc của Đơn hàng ID 1 (`NX-2026-0001`)

- Đơn hàng `NX-2026-0001` được tạo ra từ file `prisma/seed.ts` (dòng 1388–1425) lúc `2026-11-22T06:51:10.628Z` để phục vụ dữ liệu demo storefront.
- Trong `seed.ts`, `NX-2026-0001` được gán cứng `orderStatus: 'DELIVERED'` và `paidAt: 3 ngày trước`, **hoàn toàn không có trường `deliveredAt`**.
- Tại thời điểm seed, `created_at` và `updated_at` của đơn hàng này mặc định bằng nhau (`2026-11-22T06:51:10.628Z`).
- Khi migration `20261122140000` chạy, nó đã lấy chính giá trị `updated_at` của seed data gán vào `delivered_at`.
- Vì vậy, giá trị `delivered_at` ban đầu của `NX-2026-0001` là **100% dữ liệu nhân tạo phát sinh từ câu lệnh backfill**, không phải sự kiện giao hàng thực tế.

### Bằng chứng 3: Không có đơn hàng nào được tạo hoặc cập nhật giữa hai Migration

Truy vấn kiểm tra các bản ghi phát sinh trong khoảng thời gian giữa Migration 6 (`06:59:42Z`) và Migration 7 (`08:34:02Z`):

```sql
SELECT id, order_code, order_status, created_at, updated_at, delivered_at
FROM orders
WHERE (created_at >= '2026-11-22 06:59:42' AND created_at <= '2026-11-22 08:34:02')
   OR (updated_at >= '2026-11-22 06:59:42' AND updated_at <= '2026-11-22 08:34:02');
```

**Kết quả:** `Empty set (0 rows)` — Hoàn toàn không có đơn hàng nào được tạo mới hoặc cập nhật trạng thái trong khoảng thời gian này.

### Bằng chứng 4: Kiểm tra Audit Log vòng đời đơn hàng (`audit_logs`)

Truy vấn toàn bộ sự kiện liên quan đến đơn hàng trong `audit_logs`:

```sql
SELECT id, actor_id, action, entity_type, entity_id, created_at
FROM audit_logs
WHERE entity_type = 'Order' OR action LIKE '%ORDER%';
```

**Kết quả:** `Empty set (0 rows)`.
Trong cơ sở dữ liệu, chỉ duy nhất có 1 bản ghi audit log là `FULL_MIGRATION_STOREFRONT_SEEDED` lúc `06:51:11Z`. Không có bất kỳ nhân viên (Staff) hay quản trị viên (Admin) nào từng gọi API chuyển trạng thái đơn hàng sang `DELIVERED`.

---

## 5. Tính an toàn của hệ thống trong tương lai (Future Safety)

1. **Cơ chế Migration bất biến (Append-Only / One-Time Execution):**
   - Migration `20261122160000_sanitize_unverified_delivered_at` đã hoàn tất thực thi và được ghi nhận trạng thái kết thúc trong `_prisma_migrations`.
   - Theo cơ chế của Prisma Migrate và MySQL, migration này **sẽ không bao giờ được kích hoạt lại** trên bất kỳ đơn hàng nào tạo mới hoặc cập nhật sau này.
2. **Hành vi khi đơn hàng thực tế chuyển sang `DELIVERED`:**
   - Trong `apps/api/src/modules/order/order.service.ts` (dòng 529–531): Khi Staff/Admin chuyển đơn hàng sang `DELIVERED`, hệ thống gán `deliveredAt = new Date()`.
   - Vì migration sanitize đã hoàn tất trong quá khứ, các đơn hàng thực tế sau này sẽ luôn giữ nguyên mốc `deliveredAt` xác thực này để tính toán thời hạn đổi trả 7 ngày một cách chính xác tuyệt đối.

---

## 6. Tổng hợp các câu lệnh SQL đối soát & Kết quả

```sql
-- 1. Đối soát migration đã chạy
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
WHERE migration_name LIKE '%delivered_at%';
-- Kết quả: 2 migrations, cả 2 đều finished_at thành công.

-- 2. Đối soát tình trạng delivered_at của các đơn hàng DELIVERED hiện tại
SELECT id, order_code, order_status, delivered_at, updated_at
FROM orders
WHERE order_status = 'DELIVERED';
-- Kết quả: id=1, order_code='NX-2026-0001', delivered_at=NULL, updated_at='2026-11-22 06:51:10.628'.

-- 3. Đếm số lượng đơn hàng DELIVERED có delivered_at NULL vs NOT NULL
SELECT
  COUNT(*) as total_delivered,
  SUM(CASE WHEN delivered_at IS NULL THEN 1 ELSE 0 END) as delivered_at_null,
  SUM(CASE WHEN delivered_at IS NOT NULL THEN 1 ELSE 0 END) as delivered_at_not_null
FROM orders
WHERE order_status = 'DELIVERED';
-- Kết quả: total_delivered = 1, delivered_at_null = 1, delivered_at_not_null = 0.
```

---

## 7. Kết luận Nghiệm thu

| Tiêu chí xác minh                          | Kết quả  | Bằng chứng đối soát                                        |
| :----------------------------------------- | :------: | :--------------------------------------------------------- |
| Xác định chính xác số đơn hàng bị backfill | **PASS** | Duy nhất 1 bản ghi (ID 1, `NX-2026-0001`)                  |
| Xác định chính xác số bản ghi bị sanitize  | **PASS** | Duy nhất 1 bản ghi (ID 1, `NX-2026-0001`)                  |
| Danh sách ID bản ghi chuyển về NULL        | **PASS** | `[1]`                                                      |
| Chứng minh nguồn gốc dữ liệu bị xóa        | **PASS** | Bản ghi bắt nguồn từ `seed.ts`, không có sự kiện giao hàng |
| Không xóa nhầm timestamp giao hàng hợp lệ  | **PASS** | Không có đơn hàng thực tế nào phát sinh giữa 2 migration   |
| Tính an toàn dữ liệu trong tương lai       | **PASS** | Migration đã đóng sổ, không chạy lại trên dữ liệu mới      |

**KẾT LUẬN CHÍNH THỨC:** **`PASS`**

Bằng chứng thực nghiệm khẳng định 100% Migration `20261122160000_sanitize_unverified_delivered_at` chỉ tác động đến bản ghi backfill không xác thực và **không gây ra bất kỳ sự mất mát nào đối với dữ liệu giao hàng hợp lệ**.

Milestone M5 hội đủ toàn bộ điều kiện kỹ thuật và dữ liệu để được phê chuẩn **FINAL PASS**.
Hệ thống dừng tại đây và chờ phê duyệt chính thức từ Tech Lead trước khi tiến hành Milestone M6.
