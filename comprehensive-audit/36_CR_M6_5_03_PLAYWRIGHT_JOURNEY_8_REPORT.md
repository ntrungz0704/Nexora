# CR-M6.5-03 — PLAYWRIGHT JOURNEY 8 E2E SPEC REPAIR & VERIFICATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213`
- **Order:** `OFFICIAL IMPLEMENTATION ORDER — CR-M6.5-03 PLAYWRIGHT JOURNEY 8`
- **Mode:** `CONTROLLED IMPLEMENTATION — EXACT ALLOWLIST — NO COMMIT/PUSH — NO DB MUTATIONS`
- **Allowlist (Strictly Adhered to):**
  1. `tests/e2e/storefront_journeys.spec.ts` (MODIFY — ONLY FILE)
- **Previous References:**
  - Report 29: [`comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/29_M6_5_INTEGRATION_QA_EXECUTION_REPORT.md) (Tier 3 Playwright 8/9 PASS, 1 FAIL)
  - Report 34: [`comprehensive-audit/34_CR_M6_5_01_CROSS_TAB_AUTH_STATE_FIX_REPORT.md`](file:///d:/Nexora/comprehensive-audit/34_CR_M6_5_01_CROSS_TAB_AUTH_STATE_FIX_REPORT.md)
  - Report 35: [`comprehensive-audit/35_CR_M6_5_02_CHECKOUT_ORDERS_INVALIDATION_REPORT.md`](file:///d:/Nexora/comprehensive-audit/35_CR_M6_5_02_CHECKOUT_ORDERS_INVALIDATION_REPORT.md)
- **Final Verdict:** **`PASS` — STALE SPEC FIXED — 9/9 PLAYWRIGHT E2E PASSED**

---

## 1. Executive Summary

Trong đợt nghiệm thu kiểm thử tích hợp M6.5 (Report 29), tầng kiểm thử **Tier 3 Playwright E2E** đạt kết quả **8/9 tests PASS, 1/9 test FAIL** do lỗi tại `Journey 8` ([`tests/e2e/storefront_journeys.spec.ts:84-93`](file:///d:/Nexora/tests/e2e/storefront_journeys.spec.ts#L84-L93)).

Thực hiện nghiêm ngặt theo **OFFICIAL IMPLEMENTATION ORDER — CR-M6.5-03 PLAYWRIGHT JOURNEY 8**:
1. **Tuân thủ đúng allowlist (chính xác 1 file duy nhất):** Chỉ chỉnh sửa `tests/e2e/storefront_journeys.spec.ts`. Hoàn toàn không sửa mã nguồn ứng dụng, backend, API, Prisma schema hay Playwright configuration.
2. **Khắc phục nguyên nhân gốc rễ (Stale Test Expectation):** Bài test cũ mở đường dẫn `/admin` mà không đăng nhập, nhưng lại kỳ vọng nhìn thấy giao diện Dashboard quản trị nội bộ (`Quản trị viên|Dashboard|Tổng quan`) và các tab điều hướng (`Sản phẩm`, `Đơn hàng`). Hành vi thực tế của ứng dụng là kích hoạt **Admin Authentication Gate** (màn hình form đăng nhập quản trị `Hệ Thống Quản Trị Cửa Hàng`), chặn đứng truy cập trái phép. Test đã được sửa để xác thực đúng cổng bảo vệ xác thực quản trị và khẳng định rằng người dùng chưa đăng nhập **không thể** nhìn thấy sidebar hoặc nội dung bảng điều khiển.
3. **Thực thi trên môi trường test cô lập tuyệt đối:**
   - Khởi tạo container MySQL 8.4 ephemeral trên cổng `3307` (`nexora_test`).
   - Chạy đầy đủ 8 Prisma migrations và script seed tổng hợp trên cổng `3307`.
   - Chạy Playwright với `CI=true` và các biến môi trường trỏ trực tiếp tới port `3307` (`DATABASE_URL=mysql://nexora_test_user:***@127.0.0.1:3307/nexora_test`).
   - Sau khi kiểm thử hoàn tất, container ephemeral được hủy sạch (`docker rm -fv`). Cơ sở dữ liệu phát triển (`nexora:3306`) được bảo toàn 100% với 0 đột biến.
4. **Kết quả nghiệm thu:** Toàn bộ **9/9 tests Playwright E2E PASSED (Exit Code: 0)**; 99/99 tests Frontend PASSED; 4/4 Quality Gates đạt chuẩn.

---

## 2. Nguyên nhân Gốc rễ & Phân tích Kỳ vọng (Root Cause & Behavior Analysis)

### 2.1. Mã nguồn kiểm tra quyền truy cập tại `AdminDashboardPage.tsx`

Tại [`apps/web/src/features/admin/AdminDashboardPage.tsx:1642-1745`](file:///d:/Nexora/apps/web/src/features/admin/AdminDashboardPage.tsx#L1642-L1745):

```tsx
  // AUTH GATE: Require authenticated ADMIN or STAFF account before exposing Admin Portal
  if (!isStaffOrAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] ... admin-page-wrapper">
        <div className="w-full max-w-md bg-white ... admin-card-surface">
          <div className="bg-[#091830] ...">
            ...
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Hệ Thống Quản Trị Cửa Hàng
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-8 space-y-5">
            ...
            <div>
              <label>Email quản trị</label>
              <input type="email" placeholder="admin@nexora.local" ... />
            </div>

            <div>
              <label>Mật khẩu</label>
              <input type="password" placeholder="••••••••" ... />
            </div>

            <button type="submit">Đăng nhập Quản trị</button>
            <Link to="/">Quay lại Website</Link>
          </form>
        </div>
      </div>
    );
  }
```

### 2.2. So sánh Expected vs Actual Behavior

| Thuộc tính | Hành vi mong đợi của bài test cũ (Stale Spec) | Hành vi thực tế chuẩn bảo mật (RBAC Secure Gate) |
|---|---|---|
| **Truy cập `/admin` chưa đăng nhập** | Kỳ vọng xem được Dashboard quản trị | Kích hoạt cổng xác thực `Hệ Thống Quản Trị Cửa Hàng` |
| **Giao diện hiển thị** | Header và nội dung tổng quan hoạt động | Form đăng nhập quản trị (Email, Mật khẩu, Nút Đăng nhập, Nút Quay lại Website) |
| **Thanh điều hướng Sidebar (`aside.admin-sidebar`)** | Kỳ vọng hiển thị link `Sản phẩm`, `Đơn hàng` | Hoàn toàn bị ẩn, không xuất hiện trên DOM |
| **Đánh giá bảo mật** | **Vi phạm nghiêm trọng** nếu cho phép khách vãng lai xem dashboard | **Đúng chuẩn bảo mật**: Chặn triệt để người dùng chưa xác thực |

---

## 3. Chi tiết Thay đổi Mã nguồn (Code Changes)

File duy nhất được sửa đổi: [`tests/e2e/storefront_journeys.spec.ts`](file:///d:/Nexora/tests/e2e/storefront_journeys.spec.ts)

```diff
@@ -81,14 +81,20 @@ test.describe('Nexora E2E Storefront & Commerce User Journeys', () => {
     await expect(page.locator('input').first()).toBeVisible();
   });
 
-  test('Journey 8: Admin Dashboard renders operational overview and navigation tabs', async ({
+  test('Journey 8: Unauthenticated access to /admin is blocked by Admin Authentication Gate', async ({
     page,
   }) => {
     await page.goto('/admin');
 
-    // Verify Admin Dashboard view
-    await expect(page.getByText(/Quản trị viên|Dashboard|Tổng quan/i).first()).toBeVisible();
-    await expect(page.getByText('Sản phẩm').first()).toBeVisible();
-    await expect(page.getByText('Đơn hàng').first()).toBeVisible();
+    // 1. Verify Admin Authentication Gate is presented
+    await expect(page.getByText('Hệ Thống Quản Trị Cửa Hàng')).toBeVisible();
+    await expect(page.locator('input[type="email"]')).toBeVisible();
+    await expect(page.locator('input[type="password"]')).toBeVisible();
+    await expect(page.getByRole('button', { name: /Đăng nhập Quản trị/i })).toBeVisible();
+    await expect(page.getByRole('link', { name: /Quay lại Website/i })).toBeVisible();
+
+    // 2. Verify internal Admin Dashboard & navigation tabs are NOT exposed to unauthenticated users
+    await expect(page.locator('aside.admin-sidebar')).not.toBeVisible();
+    await expect(page.getByText('Tổng quan hoạt động')).not.toBeVisible();
   });
 });
```

---

## 4. Bằng chứng Thực thi Kiểm thử Thực nghiệm (Empirical Verification)

### 4.1. Thực thi riêng Journey 8 trên môi trường cô lập

Lệnh thực thi:
```powershell
Set-Item -Path env:CI -Value "true"
Set-Item -Path env:NODE_ENV -Value "test"
Set-Item -Path env:DATABASE_URL -Value "mysql://nexora_test_user:nexora_test_pass@127.0.0.1:3307/nexora_test"
Set-Item -Path env:AUTH_SECRET -Value "m65-ephemeral-test-secret-key-minimum-32-chars-long"
Set-Item -Path env:CLIENT_URL -Value "http://127.0.0.1:5173"
Set-Item -Path env:SERVER_URL -Value "http://127.0.0.1:3000"
Set-Item -Path env:CORS_ALLOWED_ORIGINS -Value "http://localhost:5173,http://127.0.0.1:5173"
Set-Item -Path env:TRUST_PROXY -Value "false"
npm run test:e2e -- -g "Journey 8" --reporter=list
```

Kết quả:
```
> nexora-monorepo@0.1.0 test:e2e
> playwright test --config=tests/playwright.config.ts -g Journey 8 --reporter=list

Running 1 test using 1 worker

  ok 1 tests\e2e\storefront_journeys.spec.ts:84:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 8: Unauthenticated access to /admin is blocked by Admin Authentication Gate (4.0s)

  1 passed (8.5s)
```
**Exit Code:** `0` — **`PASS`**

---

### 4.2. Thực thi toàn bộ 9 tests Playwright E2E Suite

Lệnh thực thi:
```powershell
npm run test:e2e -- --reporter=list
```

Kết quả:
```
> nexora-monorepo@0.1.0 test:e2e
> playwright test --config=tests/playwright.config.ts --reporter=list

Running 9 tests using 2 workers

  ok 2 tests\e2e\storefront_journeys.spec.ts:4:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 1: Storefront Home renders header, hero, commitments, and navigation (839ms)
  ok 1 tests\e2e\foundation.spec.ts:3:1 › renders Nexora Foundation dashboard and verifies API/DB connectivity (840ms)
  ok 3 tests\e2e\storefront_journeys.spec.ts:20:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 2: Product Catalog & Search page loads and displays products (605ms)
  ok 4 tests\e2e\storefront_journeys.spec.ts:30:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 3: Customer Login page renders form validation (588ms)
  ok 5 tests\e2e\storefront_journeys.spec.ts:44:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 4: AI Advisor Survey renders 5-step questionnaire (583ms)
  ok 6 tests\e2e\storefront_journeys.spec.ts:52:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 5: PC Builder tool renders hardware component selection slots (662ms)
  ok 7 tests\e2e\storefront_journeys.spec.ts:63:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 6: Persona Comparison tool renders category and persona selectors (569ms)
  ok 8 tests\e2e\storefront_journeys.spec.ts:76:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 7: Order Tracking tool allows searching by order number (565ms)
  ok 9 tests\e2e\storefront_journeys.spec.ts:84:3 › Nexora E2E Storefront & Commerce User Journeys › Journey 8: Unauthenticated access to /admin is blocked by Admin Authentication Gate (568ms)

  9 passed (9.1s)
```
**Exit Code:** `0` — **`9/9 PASS`** (Tất cả 8 journeys storefront và 1 test foundation đều đạt 100%).

---

### 4.3. Monorepo Quality Gates

| Quality Gate | Lệnh thực thi | Kết quả | Trạng thái |
|---|---|---|---|
| **Prettier Formatting** | `npx prettier --write tests/e2e/storefront_journeys.spec.ts` | **PASS** (Exit 0) | Chuẩn formatting |
| **Monorepo Typecheck** | `npm run typecheck` | **PASS** (Exit 0) | 0 lỗi kiểu dữ liệu toàn repo |
| **Monorepo Lint** | `npm run lint` | **PASS** (Exit 0) | 0 errors, 0 warnings |
| **Frontend Test Suite** | `npx vitest run apps/web/tests` | **PASS** (Exit 0) | 7/7 files, 99/99 tests PASS |
| **Production Build** | `npm run build -w @nexora/web` | **PASS** (Exit 0) | Vite build production thành công |

---

## 5. Bằng chứng Cô lập Cơ sở Dữ liệu & An toàn Git (DB Isolation & Git Safety)

### 5.1. Bằng chứng cô lập Database

1. **Database Identity tại cổng 3307:**
   - Container ephemeral: `nexora-cr-m6503-test-mysql` (`3a90389da98d`).
   - Query: `SELECT DATABASE(), @@port, @@hostname;`
   - Kết quả: `nexora_test | 3306 | 3a90389da98d` (hoàn toàn tách biệt với container dev `7ffc1a14a558`).
2. **Bảo toàn Database phát triển cổng 3306 (`nexora`):**
   - Query kiểm tra sau khi chạy test: `SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'nexora' LIMIT 10;`
   - Số lượng migration: 8 (không đổi).
   - Số lượng bản ghi trên các bảng trọng yếu: không đổi, **0 đột biến dữ liệu**.
3. **Dọn dẹp môi trường test:**
   - `docker rm -fv nexora-cr-m6503-test-mysql` → Exit code `0`.
   - `docker ps` xác nhận chỉ còn các container hệ thống cơ sở.

### 5.2. Git Safety Audit

Lệnh: `git status --short`
```
 M apps/web/src/app/providers.tsx
 M apps/web/src/features/checkout/CheckoutPage.tsx
 M apps/web/src/features/storefront/StorefrontHeader.tsx
 M apps/web/src/features/wishlist/WishlistPage.tsx
 M apps/web/src/services/authService.ts
 M tests/e2e/storefront_journeys.spec.ts
?? apps/web/src/lib/authQueryCache.ts
?? apps/web/tests/m6_5_customer_integration_qa.test.tsx
```

- **Phạm vi file:**
  - 5 source files + 1 test file mới thuộc phạm vi đã được phê duyệt của CR-M6.5-01 và CR-M6.5-02.
  - Đúng 1 file duy nhất `tests/e2e/storefront_journeys.spec.ts` thuộc phạm vi của CR-M6.5-03.
- **Git HEAD:** `3d8adb18c967400dbc28787a6b8174b9a7cf8213` (Commit M6.4 ban đầu được bảo toàn nguyên vẹn).
- **Staged files:** 0 files (`git diff --cached` hoàn toàn rỗng).
- **Commit/Push:** Không thực hiện commit hoặc push theo đúng chỉ thị.

---

## 6. Các Giới hạn Còn lại (Declared Limitations)

1. **Customer Authenticated E2E Coverage:**
   - Bộ 9 bài test Playwright E2E hiện tại tập trung vào Storefront công khai (Home, Search, Login gate, AI survey, PC builder, Compare, Tracking, Admin auth gate) và Foundation API/DB connectivity.
   - Các luồng nghiệp vụ sâu của khách hàng sau khi đăng nhập (Customer Profile CRUD, Review CRUD, Return Request workflow) hiện được bảo đảm 100% bằng 20 tests integration tại `m6_5_customer_integration_qa.test.tsx` (jsdom) và 176 tests tại Tier 2 Backend Integration (Real MySQL).
   - Trong tương lai, khi có nhu cầu bổ sung kịch bản Playwright đa bước đăng nhập của Customer, có thể mở rộng thêm spec E2E riêng.

---

## 7. Kết luận & Đề xuất

- **Trạng thái CR-M6.5-03:** **`PASS`**
- **Tổng kết bộ 3 Change Requests của Milestone M6.5:**
  - **CR-M6.5-01 (R-02 Logout Cache Isolation & Cross-Tab Auth State):** `PASS — CLOSED`
  - **CR-M6.5-02 (R-03 Checkout Orders Cache Invalidation):** `PASS — CLOSED`
  - **CR-M6.5-03 (Playwright Journey 8 Stale Spec Repair):** `PASS — VERIFIED (9/9 E2E PASS)`
- **Trạng thái toàn diện của M6.5 Integration Testing & QA:**
  - Tier 1: 115/115 tests PASS.
  - M6.5 QA Suite: 20/20 tests PASS.
  - Tier 2 Backend Integration & Security: 176/176 tests PASS (trên MySQL 8.4 cô lập).
  - Tier 3 Playwright E2E: 9/9 tests PASS (trên môi trường cô lập).
  - Toàn bộ Frontend Unit/Integration: 99/99 tests PASS.
  - Quality Gates: 4/4 PASS (Typecheck, Lint, Prettier, Production Build).
  - Database Safety: 0 mutations trên Dev DB `nexora:3306`.
- **Đề xuất:** Kính trình Project Owner nghiệm thu đóng **CR-M6.5-03** và chính thức chuyển sang giai đoạn nghiệm thu tổng kết, đóng **Milestone M6.5 — Integration Testing & QA**.
