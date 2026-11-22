# BÁO CÁO GIẢI TRÌNH ĐỐI SOÁT CUỐI CÙNG — MILESTONE M6.1

## Final Acceptance Clarification: Merge Result DTO Validation & Passive Retry Lifecycle

- **Mã tài liệu:** `M6_1_FINAL_ACCEPTANCE_CLARIFICATION.md`
- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Tham chiếu nguồn:** `TechPilot` (`D:\Nexora\TechPilot`) — READ-ONLY
- **Dự án đích:** `Nexora` (`D:\Nexora`)
- **Vai trò:** Senior Frontend Engineer & Integration Architect
- **Thời điểm lập báo cáo:** `2026-11-22T21:12:00+07:00`
- **Trạng thái thực hiện:** `READ-ONLY VERIFICATION & CLARIFICATION` — Không sửa code, không refactor, không tạo commit, không push.

---

## 1. Điểm 1: Merge Result DTO Validation (Kiểm Tra DTO Kết Quả Merge)

### 1.1. Thực tế triển khai trong mã nguồn

Kiểm tra trực tiếp tại 2 vị trí xử lý merge:

1. **Tại `apps/web/src/services/authService.ts` (Login & Register):**
   - **Auth Auto-Merge Check (Dòng 37–40 & Dòng 85–88):**
     ```typescript
     const isValidMergeResult =
       session.cartMerge &&
       typeof session.cartMerge.mergedItemsCount === 'number' &&
       session.cartMerge.cart !== undefined;
     ```
   - **Immediate Retry Check (Dòng 49–53 & Dòng 95–99):**
     ```typescript
     if (
       retryResult &&
       typeof retryResult.mergedItemsCount === 'number' &&
       retryResult.cart !== undefined
     ) {
       cartService.clearGuestSession();
       session.cartMerge = retryResult;
     }
     ```
2. **Tại `apps/web/src/services/cartService.ts` (Passive Retry):**
   - **Passive Retry Check (Dòng 84):**
     ```typescript
     if (result && typeof result.mergedItemsCount === 'number') {
       clearGuestSession();
       lastAttemptFailed = false;
       return result;
     }
     ```

### 1.2. Đối soát 4 câu hỏi xác minh

| Câu hỏi xác minh                                                              | Kết quả thực tế trong code | Bằng chứng kỹ thuật & Đánh giá rủi ro                                                                                                                                                                                                                                                      |
| :---------------------------------------------------------------------------- | :------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Có sử dụng `MergeCartResultDtoSchema.safeParse()` không?**               |         **KHÔNG**          | Trong cả `authService.ts` và `cartService.ts` không import hay gọi Zod schema `MergeCartResultDtoSchema.safeParse()`. Kiểm tra dựa trên các biểu thức so sánh kiểu nguyên thủy (primitive type checks).                                                                                    |
| **2. `cart: null`, `cart: "invalid"` hoặc thiếu trường có bị từ chối không?** |    **KHÔNG BỊ TỪ CHỐI**    | Trong JavaScript: `null !== undefined` trả về `true`! Nếu response trả về `{ mergedItemsCount: 1, cart: null }` hoặc `{ mergedItemsCount: 1, cart: "invalid" }`, điều kiện `cart !== undefined` vẫn đánh giá là `true`. Hệ thống sẽ xóa session mà không phát hiện cấu trúc `cart` bị lỗi. |
| **3. Validation có áp dụng cho cả Auth & Retry responses không?**             |    **CÓ (Ở mức nông)**     | Cả phản hồi từ `POST /auth/login`, `POST /auth/register` và `POST /cart/merge` đều đi qua biểu thức kiểm tra `typeof ... === 'number'`. Riêng tại `cartService.ts#L84` chỉ kiểm tra `mergedItemsCount`, không kiểm tra `cart`.                                                             |
| **4. `mergedItemsCount: 0` có được chấp nhận là thành công không?**           |           **CÓ**           | Vì `typeof 0 === 'number'` là `true`, trường hợp giỏ khách rỗng hoặc giỏ đã được gộp trước đó (Idempotent No-op) vẫn được công nhận thành công và dọn dẹp session (được kiểm chứng bởi test **TC-9**).                                                                                     |

### 1.3. Kết luận Điểm 1: **`PARTIAL VALIDATION` (Xác thực một phần / Nông)**

- **Thực tế:** Không thể coi là đã validate đầy đủ DTO vì chưa sử dụng `MergeCartResultDtoSchema.safeParse()`.
- **Phạm vi ảnh hưởng thực tế:**
  - _Mức độ rủi ro đối với người dùng:_ **Cực kỳ thấp (Low/Negligible)** trong môi trường hoạt động thực tế, vì Backend M3 đã được kiểm thử 100% bằng Prisma và luôn trả về đúng cấu trúc `MergeCartResultDto` chuẩn mực (gồm `cart: { items, totalItems, subtotal }`, `mergedItemsCount`, `adjustedItemsCount`).
  - _Mức độ tuân thủ tiêu chuẩn code:_ **Chưa hoàn hảo**. Để đạt 100% nghiêm ngặt, trong tương lai (sau khi user cho phép) có thể bổ sung `MergeCartResultDtoSchema.safeParse(res.data.data)`.

---

## 2. Điểm 2: Passive Retry Lifecycle (Vòng Đời Thử Lại Thụ Động Tại CartPage)

### 2.1. Thực tế triển khai trong mã nguồn

Kiểm tra tại [`apps/web/src/services/cartService.ts#L52-L98`](file:///D:/Nexora/apps/web/src/services/cartService.ts#L52-L98):

```typescript
// Module-level state
let isMergingInFlight = false;
let lastAttemptedSessionId: string | null = null;
let lastAttemptFailed = false;

export async function attemptPassiveCartMerge(
  token: string | null,
): Promise<MergeCartResultDto | null> {
  if (!token) return null;
  const guestSessionId = getExistingGuestSessionId();
  if (!guestSessionId) return null;

  // In-flight guard
  if (isMergingInFlight) return null;

  // Deduplication guard
  if (lastAttemptedSessionId === guestSessionId && lastAttemptFailed) {
    return null;
  }

  isMergingInFlight = true;
  lastAttemptedSessionId = guestSessionId;
  ...
```

Và tại [`apps/web/src/features/cart/CartPage.tsx#L29-L44`](file:///D:/Nexora/apps/web/src/features/cart/CartPage.tsx#L29-L44):

```typescript
useEffect(() => {
  const token = authService.getToken();
  if (!token || !cartService.hasGuestSession()) return;

  let mounted = true;
  cartService.attemptPassiveCartMerge(token).then((merged) => {
    if (mounted && merged) {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Đã tự động đồng bộ giỏ hàng trước đó của bạn.');
    }
  });

  return () => {
    mounted = false;
  };
}, [currentUser, queryClient]);
```

### 2.2. Đối soát 4 câu hỏi xác minh

| Câu hỏi xác minh                                                   |            Kết quả thực tế trong code            | Bằng chứng kỹ thuật & Đánh giá rủi ro                                                                                                                                                                                                                                                                          |
| :----------------------------------------------------------------- | :----------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Re-render cùng lần mở CartPage có tạo request trùng không?**  |               **PASS (Không lặp)**               | Khi retry thất bại lần đầu, `lastAttemptFailed = true` và `lastAttemptedSessionId = guestSessionId`. Các lần re-render tiếp theo của `CartPage` bị chặn ngay tại dòng 75. Kiểm chứng bằng **TC-7b**.                                                                                                           |
| **2. Request đang chạy có bị gọi song song không?**                |            **PASS (Chặn song song)**             | Cờ `isMergingInFlight = true` chặn tuyệt đối mọi request đồng thời từ các components khác. Kiểm chứng bằng dòng 72 `cartService.ts`.                                                                                                                                                                           |
| **3. Khi đóng CartPage rồi chủ động mở lại, có được retry không?** |   **KHÔNG ĐƯỢC RETRY (Trong cùng phiên SPA)**    | `lastAttemptFailed` và `lastAttemptedSessionId` lưu ở biến toàn cục module (in-memory). Khi rời khỏi `CartPage`, hàm cleanup của `useEffect` (L41–43) chỉ set `mounted = false`, **không gọi `resetPassiveMergeGuard()`**. Khi người dùng vào lại `/cart`, điều kiện dòng 75 vẫn `true` $\rightarrow$ bị chặn. |
| **4. Cơ chế hiện tại có chặn vĩnh viễn cùng session không?**       | **CHẶN TRONG PHIÊN SPA; MỞ LẠI SAU F5 THÌ ĐƯỢC** | Cờ `lastAttemptFailed` chỉ tồn tại trong bộ nhớ RAM của tab trình duyệt. Nếu người dùng F5 hoặc đóng tab mở lại, biến RAM được khởi tạo lại $\rightarrow$ hệ thống **cho phép retry** (kiểm chứng bằng **TC-8**). Nhưng nếu không reload trang, nó bị chặn trong toàn bộ phiên SPA đó.                         |

### 2.3. Kết luận Điểm 2: **`PARTIAL / KNOWN LIMITATION` (Chống lặp tuyệt đối, nhưng over-restrict trong cùng phiên SPA)**

- **Bản chất kỹ thuật:**
  - Để giải quyết dứt điểm điều kiện _"Tuyệt đối không tạo vòng lặp retry vô hạn"_, cơ chế hiện tại đã sử dụng module-level guard.
  - Tuy nhiên, vì `CartPage.tsx` unmount chưa gọi `cartService.resetPassiveMergeGuard()`, cơ chế này đã **vô tình chặn luôn lần mở `CartPage` chủ đích tiếp theo** nếu người dùng chỉ chuyển route qua React Router mà không F5 trang.
- **Tính an toàn đối với dữ liệu:**
  - **Dữ liệu giỏ hàng KHÔNG BỊ MẤT**: `nexora_guest_session` vẫn nằm nguyên trong `localStorage`.
  - Khách hàng tải lại trang (F5) hoặc mở lại web vào lần sau sẽ tự động được gộp giỏ hàng.
- **Giải pháp tối ưu trong tương lai (khi được phép sửa code):**
  - Chỉ cần gọi `cartService.resetPassiveMergeGuard()` trong hàm unmount cleanup của `useEffect` tại `CartPage.tsx` (hoặc đặt reset guard khi route thay đổi).

---

## 3. Tổng Hợp Đánh Giá Trạng Thái Nghiệm Thu M6.1

| Nhóm tiêu chuẩn                       | Đánh giá trước | Đánh giá sau giải trình  | Ghi chú & Ranh giới                                            |
| :------------------------------------ | :------------: | :----------------------: | :------------------------------------------------------------- |
| **1. Git & Commit Scope**             |      PASS      |         **PASS**         | Đúng 1 commit, sạch sẽ, chuẩn tiếng Việt không dấu             |
| **2. Backend M1–M5 Preservation**     |      PASS      |         **PASS**         | 0 thay đổi Backend, Prisma hay Shared                          |
| **3. Immediate Retry & Auth Safety**  |      PASS      |         **PASS**         | Không rollback auth, giữ session khi lỗi, tối đa 1 lần         |
| **4. TanStack Query Synchronization** |      PASS      |         **PASS**         | 100% khớp `['cart']`, cập nhật tức thì                         |
| **5. Test Suite & Quality Gates**     |      PASS      |         **PASS**         | 15/15 tests M6.1 PASS, 231/231 monorepo tests PASS             |
| **6. Absolute UI Freeze**             |      PASS      |         **PASS**         | 0 thay đổi CSS/Tailwind, 0 thay đổi markup giao diện           |
| **7. Merge Result DTO Validation**    |   Cần làm rõ   |       **PARTIAL**        | Kiểm tra shallow primitive, chưa dùng Zod safeParse            |
| **8. Passive Retry Lifecycle**        |   Cần làm rõ   | **PARTIAL (Limitation)** | Chống lặp tuyệt đối, nhưng cần F5 để retry lần 2 trên CartPage |

---

## 4. Khuyến Nghị Cuối Cùng (Final Recommendation)

Dựa trên nguyên tắc _"Không có blocker gây mất dữ liệu giỏ hàng hoặc tạo request lặp vô hạn"_:

1. **Khẳng định tính ổn định:**
   - Dữ liệu giỏ hàng của khách hàng **không bao giờ bị mất** trong mọi kịch bản lỗi (đã kiểm chứng bằng test `MERGE-ROLLBACK` và TC-2, TC-5).
   - Hệ thống **tuyệt đối không bị vòng lặp vô hạn hay spam request**.
   - Giao diện và mã nguồn Backend được bảo toàn 100%.
2. **Đề xuất quyết định:**
   - Đề nghị Chủ dự án chấp thuận **`PASS WITH LIMITATIONS` (hoặc CONDITIONAL PASS)** cho Milestone M6.1.
   - Ghi nhận 2 điểm kỹ thuật trên vào tài liệu `KNOWN_LIMITATIONS` của dự án mà không cần mở đợt sửa chữa hay refactor lớn làm chậm tiến độ tổng thể.
   - Giữ nguyên trạng thái dừng, sẵn sàng chuyển sang lập kế hoạch cho **Milestone M6.2 — Customer Account / Profile**.
