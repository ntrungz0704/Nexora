# NEXORA — WAVE 2 TASK 2 REPORT: B-03 AI PRODUCT VISIBILITY

- **Task ID:** `WAVE2-TASK-2` (`B-03 — AI Product Visibility`)
- **Severity:** `P1 High`
- **Date:** `2026-11-26`
- **Branch:** `main`
- **Parent Baseline Commit:** `0546135` (`fix(cart): bao ve ownership khi xoa cart item`)
- **Commit Message:** `fix(ai): loc san pham theo dieu kien kinh doanh` _(SHA-1 thực tế ghi nhận tại `WAVE_2_FINAL_ACCEPTANCE_REPORT.md` sau commit, không dùng `--amend`)_
- **Verdict:** **`PASS`**

---

## 1. Root Cause Analysis

Qua kiểm tra trực tiếp `apps/api/src/modules/ai/ai.service.ts` (`AiService`), cả 4 luồng AI đều tồn tại lỗ hổng visibility sản phẩm/danh mục/thương hiệu:

1. **`queryFloatingChatbot`:**
   - Truy vấn `product.findMany` chỉ kiểm tra `status: 'ACTIVE'`, thiếu kiểm tra `category.isActive === true` và thiếu điều kiện thương hiệu (`brandId === null || brand.isActive === true`).
   - Điều kiện `searchCategory ? { category: ... } : {}` tạo mệnh đề `{}` rỗng bên trong `OR` khi không khớp từ khóa danh mục, làm SQL khớp tùy ý sản phẩm và bỏ qua fallback `callGeminiIfConfigured` / `GENERAL_ASSISTANCE`.
2. **`runSurveyRecommendation` (kể cả nhánh fallback):**
   - Query chính chỉ đặt `status: 'ACTIVE'` và ghi đè `whereClause.category = { slug }` mà không có `isActive: true`, không kiểm tra `brand`.
   - Nhánh fallback (`candidates.length === 0`) chạy `findMany({ where: { status: 'ACTIVE' } })`, làm lọt toàn bộ sản phẩm thuộc danh mục hoặc thương hiệu đã tạm ẩn.
3. **`compareProducts`:**
   - Truy vấn `{ id: { in: productIds } }` không kiểm tra `status === 'ACTIVE'`, `category.isActive`, hay `brand.isActive` — cho phép so sánh công khai sản phẩm ngừng bán hoặc bị ẩn danh mục/thương hiệu.
4. **`queryProductChat`:**
   - Truy vấn `findUnique({ where: { id: productId } })` không kiểm tra điều kiện kinh doanh trước khi bơm tên, giá, `specs` sản phẩm ẩn vào Gemini prompt, lưu `ProductAiChatHistory` và trả về cho người dùng.

---

## 2. Files Created / Modified

| Status   | File Path                                                                              | Summary                                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `apps/api/src/modules/ai/ai.service.ts`                                                | Định nghĩa điều kiện thống nhất `PRODUCT_ELIGIBILITY_WHERE`, inject `getPrismaClient()`, áp dụng đồng nhất cho cả 4 luồng AI & fallback, loại bỏ `{}` catch-all ở chatbot search |
| Created  | `apps/api/tests/task2_b03_ai_product_visibility.test.ts`                               | Bộ regression integration tests bao phủ đầy đủ 13/13 kịch bản B-03 trên MySQL 8.4 cô lập                                                                                         |
| Created  | `comprehensive-audit/implementation-wave-2/TASK_2_B03_AI_PRODUCT_VISIBILITY_REPORT.md` | Báo cáo nghiệm thu Task 2                                                                                                                                                        |

---

## 3. Implementation Details

- **Điều kiện kinh doanh thống nhất (`PRODUCT_ELIGIBILITY_WHERE`):**
  - `status: 'ACTIVE'` (loại bỏ `INACTIVE` và `OUT_OF_STOCK`).
  - `category: { isActive: true }`.
  - `OR: [{ brandId: null }, { brand: { isActive: true } }]` (bảo toàn 100% sản phẩm hợp lệ không có thương hiệu `brandId = null`, đồng thời chặn sản phẩm có thương hiệu `isActive = false`).
- **Chống ghi đè `OR` trong Prisma:** Mọi truy vấn kết hợp thêm bộ lọc (search text/category, `id in ...`, `categoryPreference`) đều gộp qua `where: { AND: [PRODUCT_ELIGIBILITY_WHERE, ...] }`, đảm bảo `OR` của tìm kiếm không bao giờ ghi đè `OR` kiểm tra `brandId = null`.
- **Bảo vệ Prompt & Fallback:**
  - `queryProductChat` lọc bằng `findFirst({ where: { AND: [PRODUCT_ELIGIBILITY_WHERE, { id: productId }] } })` -> ném `404 PRODUCT_NOT_FOUND` **trước** khi gọi `callGeminiIfConfigured(...)` hoặc tạo `ProductAiChatHistory`.
  - `runSurveyRecommendation` dùng `PRODUCT_ELIGIBILITY_WHERE` ở cả nhánh chính và nhánh fallback; khi `0` ứng viên hợp lệ toàn kho -> ném `404 NO_CANDIDATES`, không lấp chỗ bằng sản phẩm ẩn.
  - `queryFloatingChatbot` loại bỏ `{}` khỏi `OR`; chỉ khớp theo token/cụm tìm kiếm hợp lệ và nhóm danh mục (`laptop`, `chuot`/`mouse`, `ban-phim`/`keyboard`, `man-hinh`/`monitor`, `vga`/`main-cpu-vga`), luôn nằm dưới `PRODUCT_ELIGIBILITY_WHERE`. Khi không có sản phẩm hợp lệ hoặc khi AI provider lỗi (`HTTP 500` / timeout / reject), fallback trả `GENERAL_ASSISTANCE` sạch không chứa sản phẩm ẩn.
  - Không thay đổi provider Gemini, tham số cấu hình secrets hay API contract DTO.

---

## 4. Regression Test Cases & Results (`task2_b03_ai_product_visibility.test.ts`)

| Kịch bản bắt buộc (1-13)                                          | Phương thức kiểm chứng                                              | Kết quả  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| 1. Product ACTIVE + Cat ACTIVE + Brand ACTIVE được đề xuất        | Cases 1-7, Case 8, Case 9                                           | **PASS** |
| 2. Product INACTIVE / OUT_OF_STOCK không được đề xuất             | Cases 1-7, 8, 9, 10                                                 | **PASS** |
| 3. Category INACTIVE không được đề xuất                           | Cases 1-7, 8, 9, 10                                                 | **PASS** |
| 4. Brand INACTIVE không được đề xuất                              | Cases 1-7, 8, 9, 10                                                 | **PASS** |
| 5. Product `brandId = null` hợp lệ vẫn được đề xuất               | Cases 1-7 (isolated no-brand cat), Case 8, Case 9, Case 10          | **PASS** |
| 6. Survey recommendation lọc đúng                                 | `POST /api/v1/ai/assistant/survey` (Cases 1-7)                      | **PASS** |
| 7. Survey fallback (khi category chỉ định ẩn) lọc đúng            | `POST /api/v1/ai/assistant/survey` với `inactiveCatSlug`            | **PASS** |
| 8. Floating chatbot lọc đúng                                      | `POST /api/v1/ai/chatbot/query` (Case 8)                            | **PASS** |
| 9. `compareProducts` không trả sản phẩm ẩn                        | `POST /api/v1/ai/compare` (Case 9: 2 items & mixed 3 items)         | **PASS** |
| 10. `queryProductChat` không trả sản phẩm ẩn                      | `POST /api/v1/ai/product-chat` (Case 10 -> `404`)                   | **PASS** |
| 11. Toàn DB 0 sản phẩm hợp lệ: fallback không lộ sản phẩm ẩn      | Case 11 (`404 NO_CANDIDATES`, chatbot no suggestions)               | **PASS** |
| 12. AI provider lỗi (HTTP 500 / network reject): fallback an toàn | Cases 10, 12, 13 (`vi.spyOn(globalThis, 'fetch')`)                  | **PASS** |
| 13. Không lộ dữ liệu sản phẩm ẩn vào AI prompt hay response       | Prompt spy (`capturedPrompts`) & `ProductAiChatHistory` count = `0` | **PASS** |

---

## 5. Quality Gates & Database Isolation Evidence

- **Prettier (`ai.service.ts`, `task2_b03_ai_product_visibility.test.ts`):** PASS (`All matched files use Prettier code style!`).
- **Typecheck (`npm run typecheck`):** PASS.
- **ESLint (`npm run lint`):** PASS (`0` errors).
- **Unit Tests (`npm run test:unit`):** PASS — `14/14` files, `152/152` tests.
- **Build (`npm run build`):** PASS (`358ms` Vite bundle).
- **Isolated MySQL Integration (`127.0.0.1:3307/nexora_test`):**
  - `task2_b03_ai_product_visibility.test.ts`: `5/5` PASS
  - `phase_a_security_remediation.test.ts`: `25/25` PASS
  - `commerce_and_ai.integration.test.ts`: `11/11` PASS
  - `db.integration.test.ts`: `1/1` PASS
- **Dev DB Integrity (`127.0.0.1:3306/nexora`):** `DEV_DB_IMMUTABILITY_CHECK=MATCH_100_PERCENT tables=26 totalRows=837`.

---

## 6. Out-of-Scope Issues Noted (Unchanged in Task 2)

- `B-04` (Catalog/Marketing visibility & `ProductDetailPage` unavailable banner) và `B-05` (Category/Brand soft delete) giữ nguyên cho Task 3 và Task 4.
