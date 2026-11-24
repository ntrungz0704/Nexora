# NEXORA — M6.4 CUSTOMER RETURNS
## PHASE B: FRONTEND IMPLEMENTATION REPORT

- **Project:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Workspace:** `D:\Nexora`
- **Branch:** `main`
- **HEAD Commit:** `e0e517b9da962218b292adb8ca302a4c895590a6` *(Parent: `85f3a52a0a1bde175d28cbdd5d540f9867671b81`)*
- **Milestone:** M6.4 — Customer Returns (Frontend Implementation & Testing)
- **Final Decision:** **`PASS`**

---

## 1. IMPLEMENTATION SUMMARY

Hoàn tất triển khai toàn diện **M6.4 Customer Returns** trên Frontend `apps/web`, thay thế hoàn toàn form mockup cũ trong `ProfilePage.tsx` bằng luồng tích hợp API thực tế với Backend M5 trong đúng **4 file allowlist** được phê duyệt (không chạm `AppRoutes.tsx`, không chạm Backend/Shared/Prisma):

1. **Typed Return API Service (`returnService.ts`):** Tích hợp đủ 3 Customer Returns endpoints (`POST /profile/returns`, `GET /profile/returns`, `GET /profile/returns/:id`) và supporting endpoint `GET /orders/my-orders` qua `apiClient`, đọc chính xác top-level `{ returns, total, page, limit }` cho danh sách (không giả định `data.returns`), kèm pure helpers kiểm tra hạn 7 ngày từ `deliveredAt` (không fallback `updatedAt`) và tính `remainingEligible` theo đúng công thức Backend.
2. **Customer Returns UI (`CustomerReturnsTab.tsx`):**
   - **Lịch sử đổi/trả:** Hiển thị mã yêu cầu, mã đơn, ngày tạo, trạng thái (badge màu theo 5 trạng thái State Machine), lý do, số lượng sản phẩm, phân trang và nút xem chi tiết; đủ Loading / Empty / Error (+ Retry) và bố cục responsive.
   - **Tạo yêu cầu đổi/trả:** Hỗ trợ chọn đơn hàng đủ điều kiện (`DELIVERED` + có `deliveredAt` + trong 7 ngày), chọn nhiều sản phẩm trong cùng đơn, nhập số lượng không vượt `remainingEligible`, chọn `resolution` theo đúng enum viết hoa (`REFUND` / `REPLACE` / `REPAIR`), nhập `reason` (3–255 ký tự) & `notes` (tối đa 2000 ký tự), validate bằng `CreateReturnRequestInputSchema`, chặn double-submit 2 lớp (`useRef` + `isPending`), và hiển thị nguyên văn lỗi từ Backend.
   - **Chi tiết yêu cầu:** Gọi `GET /profile/returns/:id`, hiển thị đầy đủ mã yêu cầu, trạng thái, ngày tạo, `resolvedAt`, `reason`, `notes`, `rejectionReason` (khi `REJECTED`), danh sách sản phẩm/số lượng/resolution, và chỉ render Audit Timeline khi `auditLogs` thực sự được API trả về.
   - **Đúng ranh giới Customer:** Không có nút chuyển trạng thái Admin/STAFF, không có nút sửa/hủy giả, không có upload ảnh.
3. **ProfilePage Integration (`ProfilePage.tsx`):** Thay thế toàn bộ mockup Tab Returns bằng `<CustomerReturnsTab />`, sửa điều hướng tab về route chuẩn `/profile/return` (khắc phục hoàn toàn lỗi 404 `/profile/returns`), hỗ trợ deep link `/profile/return/:id`, bổ sung nút tắt `"Yêu cầu đổi trả"` cho các đơn hàng đủ điều kiện ngay tại Tab Orders, và xóa sạch cache returns/orders khi logout.
4. **Testing & Quality Gates:** 16 test cases M6.4 bao phủ đủ 20 kịch bản yêu cầu, 79/79 frontend tests PASS, `typecheck`, `lint`, `prettier`, và `vite build` đều **PASS (exit code 0)**.

---

## 2. EXACT FILE CHANGE LIST (CHÍNH XÁC 4/4 ALLOWLIST)

| # | File Path | Action | Git Status | Summary |
|---|---|---|---|---|
| 1 | `apps/web/src/services/returnService.ts` | **NEW** | `??` | Typed service cho 3 Customer Returns endpoints + `getMyOrders` qua `apiClient`, error extractor, eligibility helper 7 ngày từ `deliveredAt`, và remaining-quantity helper. |
| 2 | `apps/web/src/features/profile/components/CustomerReturnsTab.tsx` | **NEW** | `??` | Giao diện đầy đủ: Returns History + Pagination, Create Return Request Modal (đa sản phẩm, Zod validation, chống double submit), và Return Detail Modal (kèm conditional Audit Timeline). |
| 3 | `apps/web/src/features/profile/ProfilePage.tsx` | **MODIFY** | ` M` | Thay mockup Tab Returns (`+58 / -172` dòng), sửa `handleTabChange('returns')` sang `/profile/return`, đọc `:id` cho deep link `/profile/return/:id`, nút tắt đổi/trả trên đơn đủ điều kiện ở Tab Orders, dọn cache khi logout. |
| 4 | `apps/web/tests/m6_4_customer_returns.test.tsx` | **NEW** | `??` | 16 test cases Vitest + React Testing Library kiểm chứng toàn bộ hành vi, validation, API contracts, deep link và cache hygiene. |

> **Xác nhận:** Không sửa `AppRoutes.tsx`; không tạo file thừa; **0 file** thay đổi ở `apps/api/**`, `packages/shared/**`, `prisma/**`, M6.3, `TechPilot/`, hay `audit-output/`.

---

## 3. API INTEGRATION MAPPING

| Chức năng | Service Method | Endpoint (trên `apiClient` baseURL `/api/v1`) | Response Envelope Handling |
|---|---|---|---|
| Lấy danh sách đổi/trả của tôi | `returnService.getOwnReturns` | `GET /profile/returns?page=&limit=` | Đọc top-level `res.data.returns`, `res.data.total`, `res.data.page`, `res.data.limit` (KHÔNG dùng `res.data.data`) |
| Xem chi tiết yêu cầu đổi/trả | `returnService.getOwnReturnDetail` | `GET /profile/returns/:id` | Đọc `res.data.data` (`ReturnRequestDto`, kèm `items` & `auditLogs` thực tế từ API) |
| Tạo yêu cầu đổi/trả mới | `returnService.createReturnRequest` | `POST /profile/returns` | Body `{ orderId, orderCode, reason, notes?, items: [{ orderItemId, productId?, quantity, resolution }] }`; đọc `res.data.message` & `res.data.data` |
| Lấy đơn hàng của tôi | `returnService.getMyOrders` | `GET /orders/my-orders` | Đọc `res.data.data` (`OrderDto[]` có `orderStatus`, `deliveredAt`, `items[]`) |

---

## 4. BUSINESS RULES IMPLEMENTATION

- **Eligibility UX (`checkOrderReturnEligibility`):** Kiểm tra `orderStatus === 'DELIVERED'`, `deliveredAt` không null/hợp lệ (tuyệt đối không fallback `updatedAt`), và `0 <= diffDays <= 7`. Đơn không đạt hiển thị rõ lý do và vô hiệu hóa submit. Backend vẫn là nguồn xác thực cuối cùng.
- **Quantity (`calculateRemainingReturnQuantity`):** `remainingEligible = orderedQuantity - sum(previous non-REJECTED requests)`; các yêu cầu `REJECTED` không bị trừ hạn mức.
- **Multi-item & Uppercase Enum:** Hỗ trợ chọn đồng thời nhiều sản phẩm trên cùng 1 đơn (mỗi `orderItemId` chỉ xuất hiện 1 lần qua checkbox); `resolution` chỉ chấp nhận `'REFUND' | 'REPLACE' | 'REPAIR'`.
- **Zod Validation (`CreateReturnRequestInputSchema`):** Trim `reason` (bắt buộc 3–255 ký tự, chặn chuỗi khoảng trắng thuần), `notes` tối đa 2000 ký tự, `items.min(1)`, `quantity >= 1`.
- **State Machine & Customer Boundary:** Chỉ hiển thị trạng thái (`PENDING`, `APPROVED`, `PROCESSING`, `COMPLETED`, `REJECTED`), không hiển thị nút chuyển trạng thái Admin/STAFF, không hiển thị nút sửa/hủy, không có upload ảnh.

---

## 5. UI/UX BEHAVIOR

- **Loading / Empty / Error (+ Retry):** Đầy đủ cho cả danh sách lịch sử và modal chi tiết.
- **Pagination:** Hiển thị `"Trang trước"`, `"Trang X / Y"`, `"Trang sau"` khi `totalPages > 1`.
- **Route & Deep Link:** Nhấn tab `"Yêu cầu đổi trả"` điều hướng tới `/profile/return` (không bị 404); truy cập `/profile/return/:id` tự mở modal chi tiết và gọi `GET /profile/returns/:id`; đóng modal quay về `/profile/return`.
- **Orders Tab Shortcut:** Các đơn hàng thỏa `checkOrderReturnEligibility(order).eligible` có nút `"Yêu cầu đổi trả"` mở thẳng modal tạo yêu cầu với đơn hàng đã được chọn sẵn.
- **Duplicate Submit Prevention:** Chặn 2 lớp bằng `submitGuardRef` (`useRef`) + `isSubmitting` (`disabled` nút gửi + đổi nhãn `"Đang gửi yêu cầu..."`).

---

## 6. QUERY / CACHE BEHAVIOR

- **Query Keys:**
  - `['customer-returns', currentUser?.id, page, 10]` — danh sách yêu cầu đổi/trả.
  - `['customer-return-detail', currentUser?.id, activeDetailId]` — chi tiết yêu cầu theo ID.
  - `['my-orders', currentUser?.id]` — danh sách đơn hàng của tài khoản hiện tại.
- **Sau khi `POST /profile/returns` thành công:**
  - `queryClient.invalidateQueries({ queryKey: ['customer-returns'] })`
  - `queryClient.invalidateQueries({ queryKey: ['notifications'] })` *(vì Backend tạo thông báo `type: 'RETURN'` trong cùng transaction)*
- **Khi Logout (`ProfilePage.tsx` `handleLogout`):**
  - `queryClient.removeQueries({ queryKey: ['customer-returns'] })`
  - `queryClient.removeQueries({ queryKey: ['customer-return-detail'] })`
  - `queryClient.removeQueries({ queryKey: ['my-orders'] })`
  - Không thay đổi global `QueryClient` configuration.

---

## 7. TEST CASES VÀ KẾT QUẢ THỰC TẾ (`apps/web/tests/m6_4_customer_returns.test.tsx`)

Command: `npx vitest run apps/web/tests/m6_4_customer_returns.test.tsx` — **Exit Code: `0` — 16/16 PASSED (989ms)**:

1. `1. Displays customer return history from top-level { returns, total, page, limit } envelope` — **PASS**
2. `2. Displays loading state while return list query is pending` — **PASS**
3. `3. Displays empty state when customer has 0 return requests` — **PASS**
4. `4. Displays error state on API failure and retries cleanly when clicking Thử lại` — **PASS**
5. `5. Supports pagination and passes page/limit parameters to GET /profile/returns` — **PASS**
6. `6. Opens detail modal via GET /profile/returns/:id and renders audit timeline only when provided` — **PASS**
7. `7. Creates a valid return request and invalidates returns + notifications caches` — **PASS**
8. `8-10. Blocks non-DELIVERED, missing deliveredAt (no updatedAt fallback), and >7-day expired orders` — **PASS**
9. `11. Calculates remainingEligible ignoring REJECTED requests and rejects quantity exceeding remaining limit` — **PASS**
10. `12. Validates required items selection and reason min length (rejects whitespace-only reason)` — **PASS**
11. `13-14. Supports multiple items with independent uppercase resolutions (REPLACE & REPAIR)` — **PASS**
12. `15. Prevents duplicate POST submission on synchronous double-click while in flight` — **PASS**
13. `16. Displays backend validation/eligibility error message without hiding it` — **PASS**
14. `17-18. Exposes zero Admin actions, zero Edit/Cancel buttons, zero file uploads, and Guest does not call /profile/returns` — **PASS**
15. `19. Deep link /profile/return/:id opens Return Detail directly & tab click navigates to canonical /profile/return` — **PASS**
16. `20. Logout removes cached customer-returns, detail, and orders queries to prevent leakage` — **PASS**

---

## 8. TYPECHECK / LINT / PRETTIER / BUILD & FULL FRONTEND SUITE RESULTS

| Kiểm tra | Lệnh thực thi | Exit Code | Bằng chứng đầu ra |
|---|---|---|---|
| **M6.4 Dedicated Suite** | `npx vitest run apps/web/tests/m6_4_customer_returns.test.tsx` | `0` | `Test Files 1 passed (1) \| Tests 16 passed (16)` (989ms) |
| **All Frontend Suites** | `npx vitest run apps/web/tests` | `0` | `Test Files 6 passed (6) \| Tests 79 passed (79)` (`m6_1` 23, `m6_2` 18, `m6_3` 17, `m6_4` 16, `ResetPasswordFlow` 4, `FoundationDashboard` 1) |
| **Monorepo Typecheck** | `npm run typecheck` | `0` | `@nexora/config`, `@nexora/shared`, `@nexora/api`, `@nexora/web` — 0 errors |
| **Monorepo ESLint** | `npm run lint` | `0` | `eslint .` — 0 errors, 0 warnings |
| **Prettier Check (4 files)** | `npx prettier --check apps/web/src/services/returnService.ts apps/web/src/features/profile/components/CustomerReturnsTab.tsx apps/web/src/features/profile/ProfilePage.tsx apps/web/tests/m6_4_customer_returns.test.tsx` | `0` | `All matched files use Prettier code style!` |
| **Frontend Prod Build** | `npm run build -w @nexora/web` | `0` | `tsc -b tsconfig.json && vite build` — 287 modules transformed, built in 662ms |

---

## 9. SECURITY VÀ SCOPE VERIFICATION

- Không gọi bất kỳ Admin API nào (`/api/v1/admin/returns*`).
- Guest không gửi request tới `/profile/returns`.
- Không render raw HTML (`dangerouslySetInnerHTML`), tránh XSS qua `reason`/`notes`/`rejectionReason`.
- Mọi kiểm tra eligibility/số lượng phía Frontend chỉ mang tính UX; lỗi từ Backend (`400`/`401`/`403`/`404`/`500`) luôn hiển thị nguyên vẹn.
- Bảo toàn tuyệt đối toàn bộ 100% file ngoài allowlist (bao gồm `AppRoutes.tsx`, Backend M1–M5, Shared Contracts, Prisma, M6.3).

---

## 10. GIT BRANCH, HEAD VÀ WORKING-TREE STATUS

- **`git branch --show-current`:** `main`
- **`git rev-parse HEAD`:** `e0e517b9da962218b292adb8ca302a4c895590a6`
- **`git rev-parse HEAD^`:** `85f3a52a0a1bde175d28cbdd5d540f9867671b81`
- **`git diff --name-status`:**
  ```text
  M	apps/web/src/features/profile/ProfilePage.tsx
  ```
- **`git diff --stat`:**
  ```text
   apps/web/src/features/profile/ProfilePage.tsx | 230 +++++++-------------------
   1 file changed, 58 insertions(+), 172 deletions(-)
  ```
- **`git diff --cached --name-status`:** *(trống — 0 staged files)*
- **`git status --short`:**
  ```text
   M apps/web/src/features/profile/ProfilePage.tsx
  ?? FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md
  ?? M6_1_FINAL_CLOSURE_VERIFICATION.md
  ?? M6_2_FINAL_ACCEPTANCE_VERIFICATION.md
  ?? M6_2_IMPLEMENTATION_AND_ACCEPTANCE_REPORT.md
  ?? M6_2_PRE_IMPLEMENTATION_VERIFICATION.md
  ?? NEXORA_COMPLETE_REPOSITORY_INVENTORY.md
  ?? apps/web/src/features/profile/components/
  ?? apps/web/src/services/returnService.ts
  ?? apps/web/tests/m6_4_customer_returns.test.tsx
  ?? comprehensive-audit/
  ?? prisma/seed_nexora_catalog.sql
  ?? prisma/seed_techpilot_full.ts
  ```
- **`git status --short -uall -- apps/web` (chính xác 4/4 file allowlist):**
  ```text
   M apps/web/src/features/profile/ProfilePage.tsx
  ?? apps/web/src/features/profile/components/CustomerReturnsTab.tsx
  ?? apps/web/src/services/returnService.ts
  ?? apps/web/tests/m6_4_customer_returns.test.tsx
  ```

---

## 11. DATABASE MUTATION VERIFICATION

- **Database Mutation Status:** **ZERO MUTATIONS.** Không chạy seed, migration, import, hay bất kỳ backend integration test nào ghi dữ liệu vào MySQL. Toàn bộ 79 frontend tests chạy hoàn toàn trong `jsdom` với mock `apiClient`.
- **Commit / Push Status:** **Không stage, không commit, không push.**

---

## 12. KNOWN LIMITATIONS VÀ UNRESOLVED ISSUES

1. **Giới hạn phân trang khi ước tính `remainingEligible` phía client:** `CreateReturnFormModal` sử dụng danh sách yêu cầu hiện có trên trang đang tải (`limit: 10`) để tính số lượng còn lại phục vụ UX; nếu một khách hàng có >10 yêu cầu trải dài nhiều trang, Backend vẫn thực thi đối soát toàn cục trên MySQL (`RETURN_QUANTITY_EXCEEDED`) và Frontend hiển thị rõ lỗi từ Backend.
2. **Không có upload ảnh, không có sửa/hủy yêu cầu từ Customer:** Tuân thủ đúng thiết kế Backend M5 hiện hữu.
3. **Cảnh báo kích thước chunk Vite (`index-*.js > 500 kB`):** Là cảnh báo nền có sẵn của toàn bộ ứng dụng `apps/web` từ trước M6.4, không ảnh hưởng kết quả build.

---

## 13. FINAL DECISION

### ✅ **`PASS`**

Toàn bộ 13/13 Acceptance Criteria của M6.4 Customer Returns đã đạt đầy đủ với bằng chứng kiểm thử và xác minh Git thực tế. Agent dừng toàn bộ thao tác tại đây — không commit/push và không bắt đầu M6.5 khi chưa có lệnh tiếp theo từ Project Owner.
