# NEXORA — WAVE 2 TASK 4 REPORT: B-05 CATEGORY & BRAND SOFT DELETE

- **Task ID:** `WAVE2-TASK-4` (`B-05 — Category & Brand Soft Delete`)
- **Severity:** `P1/P2 (Data Integrity & Historical Preservation)`
- **Date:** `2026-11-26`
- **Branch:** `main`
- **Parent Baseline Commit:** `032189c` (`fix(catalog): dong bo visibility san pham va thuong hieu`)
- **Commit Message:** `fix(admin): chuyen category va brand sang soft delete` _(SHA-1 thực tế ghi nhận tại `WAVE_2_FINAL_ACCEPTANCE_REPORT.md` sau commit, không dùng `--amend`)_
- **Verdict:** **`PASS`**

---

## 1. Root Cause & Đối chiếu TechPilot (READ-ONLY)

### Hiện trạng trước khi sửa trong Nexora

1. **`AdminService.deleteBrand` (`apps/api/src/modules/admin/admin.service.ts`):**
   - Thực thi `prisma.brand.delete({ where: { id } })` xóa vật lý hoàn toàn bản ghi thương hiệu, bỏ qua kiểm tra tồn tại (`P2025` -> 500) và kích hoạt `onDelete: SetNull` trên `Product.brandId`, làm **mất hoàn toàn mối quan hệ lịch sử giữa Product và Brand**.
2. **`AdminService.deleteCategory` (`apps/api/src/modules/admin/admin.service.ts`):**
   - Chặn `400` nếu danh mục có sản phẩm/danh mục con, và gọi `tx.category.delete({ where: { id } })` xóa vật lý nếu danh mục rỗng, không đồng bộ `isActive = false` theo chính sách soft delete mới của Project Owner.
3. **`AdminController` (`apps/api/src/modules/admin/admin.controller.ts`):**
   - `updateCategory`, `updateBrand`, `deleteBrand` thiếu guard kiểm tra `:id` nguyên dương (`400 INVALID_ID`).

### Đối chiếu hành vi TechPilot (`READ-ONLY`) vs Chính sách Project Owner

Đã đọc trực tiếp `D:\02_Dự Án Phần Mềm\TechPilot (Bản Chính Thức)\app\controllers\AdminCategoryController.php` và `AdminBrandController.php`:

- **Điểm tương đồng:**
  - `AdminCategoryController::delete` (`lines 256-265`): khóa xóa cứng, chuyển `status = 'inactive'` (`isActive = false`) và đồng bộ `UPDATE categories SET status = 'inactive' WHERE parent_id = :id` ("Đồng bộ tạm ẩn toàn bộ danh mục con"), giữ nguyên `products`.
  - `AdminBrandController::delete` (`lines 228-235`): khóa xóa cứng, chuyển `status = 'inactive'`, giữ nguyên `brand_id` và `products`.
- **Điểm khác biệt đã tuân theo quy tắc Project Owner (Section 3.3 & 4.2):**
  - TechPilot `AdminCategoryController::update` (`line 226`) và `toggleStatus` (`line 305`) tự động bật/tắt cả các danh mục con khi bật lại cha.
  - Theo quy tắc Project Owner trong Wave 2: khi xóa/tạm ẩn (`DELETE /categories/:id` hoặc `PUT /categories/:id { isActive: false }`), Nexora **đồng bộ tạm ẩn (`isActive = false`) toàn bộ cây danh mục con/cháu**; còn khi **khôi phục (`PUT /categories/:id { isActive: true }`)**, hệ thống chỉ cập nhật trạng thái riêng của từng đối tượng, **không tự động kích hoạt lại các sản phẩm vốn `INACTIVE`** và không ép kích hoạt các danh mục con đang tắt riêng lẻ.
- **API Restore:** Hiện tại Nexora đã sử dụng `PUT /api/v1/admin/categories/:id` và `PUT /api/v1/admin/brands/:id` (payload `{ isActive: true }`, được gọi bởi switch bật/tắt trong `AdminDashboardPage.tsx`) nên không mở rộng tạo endpoint `/restore` mới ngoài phạm vi.

---

## 2. Files Created / Modified

| Status   | File Path                                                                                   | Summary                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `apps/api/src/modules/admin/admin.controller.ts`                                            | Bổ sung kiểm tra `id > 0` (`400 INVALID_ID`) cho `updateCategory`, `updateBrand`, `deleteBrand`                                                                                                                                                         |
| Modified | `apps/api/src/modules/admin/admin.service.ts`                                               | Thêm `deactivateCategoryWithDescendants` trong `$transaction`; chuyển `deleteCategory` & `deleteBrand` sang soft delete (`isActive = false`), ném `404` rõ ràng khi thiếu bản ghi, bảo toàn `Product.status` & `Product.brandId` & `Product.categoryId` |
| Modified | `apps/api/tests/phase_b_returns_and_admin_crud.test.ts`                                     | Cập nhật các case `CAT-02`, `CAT-03`, `CAT-04` từ hard-delete / block cũ sang policy soft delete (`isActive = false`, giữ nguyên bản ghi & đồng bộ danh mục con)                                                                                        |
| Created  | `apps/api/tests/task4_b05_category_brand_soft_delete.test.ts`                               | Bộ regression integration tests bao phủ đầy đủ 14/14 kịch bản soft delete, cascade cây danh mục, khóa mua hàng, khôi phục an toàn và bảo toàn đơn hàng/hậu mãi                                                                                          |
| Created  | `comprehensive-audit/implementation-wave-2/TASK_4_B05_CATEGORY_BRAND_SOFT_DELETE_REPORT.md` | Báo cáo nghiệm thu Task 4                                                                                                                                                                                                                               |

---

## 3. Regression Test Cases (`14/14` Scenarios Verified)

Thực thi trên MySQL 8.4 cô lập (`127.0.0.1:3307/nexora_test`) qua `task4_b05_category_brand_soft_delete.test.ts` (`4/4` tests PASS) và `phase_b_returns_and_admin_crud.test.ts` (`30/30` tests PASS):

| Kịch bản (1-14)                                                                                                               | Kết quả  |
| ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1. Xóa Category rỗng: row còn nguyên, `isActive = false` (`DELETE /admin/categories/:id` & `CAT-04`)                          | **PASS** |
| 2. Xóa Category có Product: không xóa Product hay mất `categoryId`, giữ nguyên `Product.status` (`CAT-02` & Task 4 Cases 1-4) | **PASS** |
| 3. Xóa Category cha (cả 2 tầng con/cháu): đồng bộ `isActive = false`, không xóa vật lý                                        | **PASS** |
| 4. Không xóa vật lý Category (cả empty, populated, parent)                                                                    | **PASS** |
| 5. Xóa Brand rỗng: row còn nguyên, `isActive = false` (`DELETE /admin/brands/:id`)                                            | **PASS** |
| 6. Xóa Brand có Product: không xóa Product, `Product.brandId` **không bị đặt `null`**, giữ nguyên `Product.status`            | **PASS** |
| 7. Không xóa vật lý Brand (kể cả `404 BRAND_NOT_FOUND` & `403 FORBIDDEN` với CUSTOMER)                                        | **PASS** |
| 8. Product thuộc Brand inactive bị chặn mua mới (`400 PRODUCT_UNAVAILABLE` trên Cart & Order, detail `BRAND_INACTIVE`)        | **PASS** |
| 9. Product thuộc Category inactive bị chặn mua mới (`400 PRODUCT_UNAVAILABLE` trên Cart & Order, detail `CATEGORY_INACTIVE`)  | **PASS** |
| 10. Khôi phục Category (`PUT /admin/categories/:id { isActive: true }`) không kích hoạt lại Product vốn `INACTIVE`            | **PASS** |
| 11. Khôi phục Brand (`PUT /admin/brands/:id { isActive: true }`) không kích hoạt lại Product vốn `INACTIVE`                   | **PASS** |
| 12. `OrderItem` snapshot vẫn nguyên vẹn (`productName`, `productSku`, `unitPrice`)                                            | **PASS** |
| 13. Lịch sử đơn hàng vẫn tra cứu được (`/orders/detail/:code`, `/orders/track`)                                               | **PASS** |
| 14. Return / warranty flow vẫn tạo yêu cầu thành công (`POST /profile/returns` `201`)                                         | **PASS** |

---

## 4. Quality Gates & Database Isolation Evidence

- **Prettier (`admin.controller.ts`, `admin.service.ts`, `phase_b_returns_and_admin_crud.test.ts`, `task4_b05_category_brand_soft_delete.test.ts`):** PASS.
- **Typecheck (`npm run typecheck`):** PASS.
- **ESLint (`npm run lint`):** PASS (`0` errors).
- **Unit & Frontend Tests (`npm run test:unit`):** PASS — `15/15` files, `158/158` tests.
- **Build (`npm run build`):** PASS (`452ms` Vite bundle).
- **Full Isolated Backend Integration Suite (`127.0.0.1:3307/nexora_test`):**
  - Toàn bộ `17/17` integration/security/concurrency suites (`211/211` tests) PASS, bao gồm `task1` (`4`), `task2` (`5`), `task3` (`4`), `task4` (`4`), `b01` (`11`), `b02` (`8`), `phase_b_returns_and_admin_crud` (`30`), `phase_b_cart_merge` (`14`), `phase_b_customer_reviews` (`29`), `phase_b_profile_addresses` (`26`), `phase_a_security_remediation` (`25`), `auth_password_reset_security` (`8`), `commerce_and_ai` (`11`), `rbac_and_concurrency` (`10`), `payment_security` (`13`), `seed_and_auth_credentials` (`2`), `storefront` (`7`).
  - `npm run test:integration -w @nexora/api` (`db.integration.test.ts`): `1/1` PASS.
- **Dev DB Integrity (`127.0.0.1:3306/nexora`):** `DEV_DB_IMMUTABILITY_CHECK=MATCH_100_PERCENT tables=26 totalRows=837`.

---

## 5. Out-of-Scope Issues Noted (Unchanged in Task 4)

- Các endpoint Admin CRUD khác chưa dùng Zod schema tập trung (`DEF-RT-14`), nút xóa cứng khác không liên quan đến Category/Brand (`deleteCoupon`, `deleteBanner`, `deletePost`, `deleteFlashSale`), và chưa bổ sung nút Delete mới trên `AdminDashboardPage` (hiện đang dùng toggle switch `isActive`).
