# M6.0 — M6.1 PRE-IMPLEMENTATION TECHNICAL VERIFICATION REPORT

## Đối Soát Kỹ Thuật Trước Triển Khai M6.1: Guest Cart Merge, Vòng Đời Guest Session & Ranh Giới UI Freeze

- **Mã tài liệu:** `M6_0_M6_1_PRE_IMPLEMENTATION_VERIFICATION.md`
- **Dự án:** Nexora — Single-Vendor Hardware E-Commerce & Store Management System
- **Tham chiếu nguồn:** `TechPilot` (`D:\Nexora\TechPilot`) — READ-ONLY
- **Dự án đích:** `Nexora` (`D:\Nexora`)
- **Vai trò:** Principal Frontend Architect & Full-Stack Integration Auditor
- **Thời điểm lập báo cáo:** `2026-11-22T16:37:00+07:00`
- **Trạng thái thực hiện:** `READ-ONLY VERIFICATION` — Không sửa đổi code, không tạo commit, không chạy migration.

---

## 1. Bằng Chứng Kỹ Thuật Về Cơ Chế Auto-Merge Tại Login / Register (Backend Ground Truth)

Qua đối soát trực tiếp mã nguồn Backend (`apps/api`) và thư viện dùng chung (`packages/shared`), cơ chế Auto-Merge giỏ hàng đã được thiết kế và triển khai hoàn chỉnh ở tầng Backend từ Milestone M3 với mức độ bảo vệ dữ liệu tối đa.

### 1.1. Hợp đồng dữ liệu DTO & Schema (`packages/shared/src/index.ts`)

- **`LoginInputSchema` (Dòng 53–58):**
  ```typescript
  export const LoginInputSchema = z.object({
    email: z.string().trim().email('Email không đúng định dạng.'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    guestSessionId: z.string().trim().optional(),
  });
  export type LoginInput = z.infer<typeof LoginInputSchema>;
  ```
- **`RegisterInputSchema` (Dòng 60–76):**
  ```typescript
  export const RegisterInputSchema = z.object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Họ tên tối thiểu 2 ký tự.')
      .max(100, 'Họ tên tối đa 100 ký tự.'),
    email: z.string().trim().email('Email không đúng định dạng.'),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    guestSessionId: z.string().trim().optional(),
  });
  export type RegisterInput = z.infer<typeof RegisterInputSchema>;
  ```
- **`MergeCartInputSchema` & `MergeCartResultDtoSchema` (Dòng 674–685):**
  ```typescript
  export const MergeCartInputSchema = z.object({
    guestSessionId: z.string().trim().min(5, 'Mã phiên khách không hợp lệ.'),
  });
  export const MergeCartResultDtoSchema = z.object({
    cart: CartSummarySchema,
    mergedItemsCount: z.number().int().nonnegative(),
    adjustedItemsCount: z.number().int().nonnegative(),
    warnings: z.array(z.string()).optional(),
  });
  ```

### 1.2. Tiếp nhận tham số tại Controller (`apps/api/src/modules/auth/auth.controller.ts`)

Tại `auth.controller.ts`, cả hai phương thức `login` (Dòng 9–21) và `register` (Dòng 24–36) đều chủ động trích xuất `guestSessionId` từ body hoặc từ HTTP Header `x-guest-session-id`:

```typescript
const guestSessionId =
  req.body?.guestSessionId || (req.headers['x-guest-session-id'] as string) || undefined;
const input = LoginInputSchema.parse({
  ...req.body,
  guestSessionId,
});
const result = await this.service.login(input);
```

### 1.3. Cơ chế gọi merge không gây nghẽn (Non-blocking) (`apps/api/src/modules/auth/auth.service.ts`)

Trong `auth.service.ts`:

- **Luồng Login (Dòng 72–79):**
  ```typescript
  let cartMerge: MergeCartResultDto | undefined;
  if (input.guestSessionId && input.guestSessionId.trim()) {
    try {
      cartMerge = await this.cartService.mergeGuestCartToUser(input.guestSessionId, user.id);
    } catch {
      // Non-blocking merge error during login
    }
  }
  ```
- **Luồng Register (Dòng 122–129):**
  ```typescript
  let cartMerge: MergeCartResultDto | undefined;
  if (input.guestSessionId && input.guestSessionId.trim()) {
    try {
      cartMerge = await this.cartService.mergeGuestCartToUser(input.guestSessionId, user.id);
    } catch {
      // Non-blocking merge error during register
    }
  }
  ```
- **Kết quả trả về (Dòng 91 & 143):** Trả về đối tượng `{ user, token, ...(cartMerge ? { cartMerge } : {}) }`.
- **Đặc tính kỹ thuật quan trọng:** Việc merge giỏ hàng được bọc trong khối `try/catch`. Nếu quá trình merge giỏ hàng gặp bất kỳ sự cố nào, luồng xác thực (Login/Register) **không bao giờ bị gián đoạn**, người dùng vẫn đăng nhập/đăng ký thành công và nhận JWT Token.

### 1.4. Bản chất ACID Transaction & Cơ chế triệt tiêu Double-Merge (`apps/api/src/modules/cart/cart.service.ts`)

Trong `CartService.mergeGuestCartToUser(guestSessionId, userId)` (Dòng 213–394):

1. **Khóa dòng độc quyền MySQL InnoDB (`FOR UPDATE`):**
   - Dòng 230–232: `SELECT id, guest_session_id FROM carts WHERE guest_session_id = ${cleanGuestSessionId} FOR UPDATE` $\rightarrow$ Khóa độc quyền bản ghi giỏ hàng khách, ngăn chặn tuyệt đối hai request đồng thời cùng merge một guest session.
   - Dòng 261–263: `SELECT id FROM users WHERE id = ${userId} FOR UPDATE` $\rightarrow$ Khóa độc quyền bản ghi người dùng đích.
2. **Kiểm tra trạng thái giỏ hàng khách (Idempotent No-op):**
   - Dòng 237–244: Nếu `!firstLockedCart` (giỏ khách không tồn tại, trống, hoặc đã bị merge và xóa trước đó), hàm lập tức trả về an toàn:
     ```typescript
     if (!firstLockedCart) {
       return { mergedItemsCount: 0, adjustedItemsCount: 0, warnings: [] };
     }
     ```
3. **Xóa triệt để giỏ hàng khách trong cùng Transaction:**
   - Dòng 370–376: Sau khi gộp và điều chỉnh số lượng tồn kho sang giỏ người dùng, hệ thống xóa toàn bộ cart items và xóa luôn bản ghi giỏ khách trong DB:
     ```typescript
     await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
     await tx.cart.delete({ where: { id: guestCart.id } });
     ```
4. **Bằng chứng triệt tiêu rủi ro Double-Merge:**
   - Vì bản ghi `carts` của khách bị `tx.cart.delete` ngay trong transaction, nếu có bất kỳ request thứ hai nào cố tình gọi merge cùng một `guestSessionId`, câu truy vấn khóa dòng sẽ tìm thấy 0 bản ghi, kích hoạt nhánh `if (!firstLockedCart)` và trả về kết quả rỗng (0 items merged). **Tuyệt đối không có khả năng nhân đôi số lượng sản phẩm hay trùng lặp item ở tầng Database.**

---

## 2. Toàn Diện Về Vòng Đời Guest Session (Guest Session Lifecycle)

Hiện trạng tại `apps/web/src/services/cartService.ts` (Dòng 4–11):

```typescript
function getGuestSessionId(): string {
  let id = localStorage.getItem('nexora_guest_session');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('nexora_guest_session', id);
  }
  return id;
}
```

### 2.1. Khởi tạo & Định danh lưu trữ

- **Thời điểm sinh ra:** Khi khách chưa đăng nhập thực hiện thao tác giỏ hàng đầu tiên (thêm sản phẩm, xem giỏ hàng).
- **Vị trí lưu trữ:** Trình duyệt phía Client, `localStorage`.
- **Storage Key chuẩn:** `'nexora_guest_session'`.
- **Định dạng ID:** Chuỗi bắt đầu bằng tiền tố `guest_` kết hợp giá trị ngẫu nhiên base-36 và timestamp hiện tại (đảm bảo tính duy nhất và độ dài tối thiểu $\ge 5$ ký tự thỏa mãn `MergeCartInputSchema`).

### 2.2. Vận chuyển trong HTTP Requests

- **Storefront Cart API:** Các hàm `cartService.getCart()`, `addItem()`, `updateItem()`, `removeItem()` tự động gửi kèm qua Header `x-guest-session-id: <guestSessionId>`.
- **Ưu tiên nhận diện tại Backend:** Trong `CartService.getOrCreateCart(userId, guestSessionId)` (Dòng 15–38), nếu request có JWT (`userId` hợp lệ), Backend **luôn ưu tiên giỏ hàng của User**. Giỏ hàng khách chỉ được dùng khi không có `userId`.

### 2.3. Thời điểm xóa và dọn dẹp Guest Session (Cleanup Timing)

Quy tắc dọn dẹp bắt buộc đối với Frontend:

1. **Khi Đăng nhập / Đăng ký THÀNH CÔNG (HTTP 200 / 201):**
   - Đọc `guestSessionId` từ `localStorage.getItem('nexora_guest_session')`.
   - Gửi `guestSessionId` trong payload `authService.login()` hoặc `authService.register()`.
   - Ngay khi nhận phản hồi thành công từ API:
     - Thực thi `localStorage.removeItem('nexora_guest_session')`.
     - Kích hoạt làm mới cache giỏ hàng (xem mục 2.4).
2. **Khi Đăng nhập / Đăng ký THẤT BẠI (HTTP 401, 400, 422, 500 hoặc Lỗi mạng):**
   - **TUYỆT ĐỐI KHÔNG XÓA** `localStorage.getItem('nexora_guest_session')`.
   - Khóa lưu trữ của khách phải được giữ nguyên vẹn để người dùng có thể thử đăng nhập lại với mật khẩu đúng, hoặc tiếp tục mua sắm dưới tư cách khách mà không bị mất giỏ hàng đang có.

### 2.4. Đồng bộ Cache TanStack Query (Cập nhật tức thì không cần Reload trang)

Toàn bộ ứng dụng Nexora (`StorefrontHome.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`, `ProductDetailPage.tsx`, `StorefrontHeader.tsx`...) đều lắng nghe giỏ hàng qua TanStack Query:

```typescript
const { data: cart } = useQuery({
  queryKey: ['cart'],
  queryFn: () => cartService.getCart(),
});
```

**Cơ chế cập nhật UI tức thời khi Đăng nhập / Đăng ký thành công:**

- Khi đăng nhập thành công, token được lưu vào `localStorage.setItem('nexora_token', session.token)`.
- Request interceptor của `apiClient.ts` tự động gắn `Authorization: Bearer <token>` cho mọi request tiếp theo.
- Sau khi xóa `nexora_guest_session`, Frontend chỉ cần gọi:
  ```typescript
  queryClient.invalidateQueries({ queryKey: ['cart'] });
  ```
- TanStack Query lập tức thực hiện fetch lại `GET /api/v1/cart` với Bearer Token mới. Backend trả về giỏ hàng người dùng (đã bao gồm các item vừa được auto-merge).
- Biểu tượng giỏ hàng trên Header, Drawer giỏ hàng và trang Cart lập tức hiển thị số lượng và danh sách mới mà **không cần reload trình duyệt**.

---

## 3. Chiến Lược Merge Duy Nhất Được Khóa Chặt (Locked Merge Strategy)

Để đảm bảo hiệu năng cao nhất, loại bỏ hoàn toàn mã thừa và ngăn chặn tuyệt đối tình trạng race condition, kiến trúc M6.1 chốt **duy nhất một chiến lược merge**:

### 3.1. Quyết định lựa chọn: Tích Hợp Auto-Merge Vào Luồng Xác Thực (Auth Flow)

- **Cơ chế chính thức:** Gửi `guestSessionId` trực tiếp trong `POST /api/v1/auth/login` và `POST /api/v1/auth/register`.
- **Lý do kỹ thuật bắt buộc:**
  1. **Hiệu năng & Độ trễ (Single Network Round-trip):** Quá trình đăng nhập và merge giỏ hàng hoàn tất trong một HTTP request duy nhất. Tránh việc client phải gửi thêm một request `POST /api/v1/cart/merge` độc lập sau khi nhận JWT.
  2. **Tính toàn vẹn dữ liệu (Atomic Execution):** Dữ liệu giỏ hàng được gộp và làm sạch ngay trước khi sinh response cho client. Không có khoảng thời gian trễ (lag window) giữa lúc người dùng được coi là "đã đăng nhập" và lúc "giỏ hàng được gộp".
  3. **Không phát sinh Request thừa:** Loại bỏ hoàn toàn nguy cơ client vừa gọi login vừa gọi mergeCart gây dư thừa tài nguyên mạng và server.

### 3.2. Vai trò của Endpoint Độc Lập `POST /api/v1/cart/merge`

- Endpoint `POST /api/v1/cart/merge` (Dòng 15 `apps/api/src/modules/cart/cart.routes.ts`) được xây dựng từ M3 với vai trò là API nghiệp vụ độc lập.
- Trong Frontend M6.1, `cartService.mergeCart(guestSessionId)` vẫn được khai báo trong SDK service như một phương thức chuẩn mực để đảm bảo tính đầy đủ của bộ API Client.
- **Ranh giới thực thi:** Giao diện đăng nhập/đăng ký (`LoginPage.tsx`, `RegisterPage.tsx`) **TUYỆT ĐỐI KHÔNG GỌI** `cartService.mergeCart()` sau khi đăng nhập thành công, vì Backend đã tự động xử lý auto-merge trong cùng luồng auth.

---

## 4. Xử Lý Lỗi & Kịch Bản Thử Lại (Failure & Retry Handling Matrix)

| Kịch bản                                              | Nguyên nhân thực tế                       | Hành vi Backend                                                                                                             | Phản hồi Frontend & Trạng thái Guest Session                                       | Trải nghiệm người dùng (UX)                                                                             |
| :---------------------------------------------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **1. Sai mật khẩu**                                   | Khách nhập sai password                   | Trả về HTTP 401 `INVALID_CREDENTIALS`                                                                                       | `authService.login` ném lỗi. Giữ nguyên `nexora_guest_session` trong localStorage. | Báo lỗi đỏ: "Email hoặc mật khẩu không chính xác". Giỏ hàng khách vẫn còn nguyên.                       |
| **2. Email trùng khi Đăng ký**                        | Email đã được tài khoản khác sử dụng      | Trả về HTTP 409 `EMAIL_EXISTS`                                                                                              | `authService.register` ném lỗi. Giữ nguyên `nexora_guest_session`.                 | Báo lỗi: "Email này đã được sử dụng". Giỏ hàng khách được bảo toàn.                                     |
| **3. Lỗi mạng / Mất kết nối**                         | Đứt cáp, timeout client                   | Không gửi được request hoặc rớt gói tin                                                                                     | Axios ném lỗi Network Error. Giữ nguyên `nexora_guest_session`.                    | Báo toast lỗi kết nối. Dữ liệu giỏ hàng khách không bị mất.                                             |
| **4. Auth thành công nhưng Merge gặp lỗi nội bộ DB**  | Lỗi tạm thời (Deadlock hiếm gặp trong DB) | Luồng merge được bọc trong `try/catch` non-blocking. Backend vẫn trả về HTTP 200 + JWT Token (không có trường `cartMerge`). | Frontend nhận token và đăng nhập thành công. Xóa `nexora_guest_session`.           | Người dùng đăng nhập bình thường. Giỏ hàng khách cũ vẫn còn lưu trong DB và có thể phục hồi qua hỗ trợ. |
| **5. Sản phẩm hết hàng / ngừng kinh doanh khi merge** | Hàng trong giỏ khách vừa hết tồn kho      | Backend tự động loại bỏ item hết hàng, bổ sung thông báo cảnh báo vào `warnings: [...]` của `cartMerge`.                    | Frontend đăng nhập thành công, xóa guest session, invalidate cache giỏ hàng.       | Giỏ hàng người dùng cập nhật sản phẩm hợp lệ, hiển thị warning nếu cần thiết.                           |
| **6. Số lượng vượt quá tồn kho khả dụng**             | Khách chọn 5 cái nhưng kho chỉ còn 2      | Backend điều chỉnh `quantity` về bằng `stockQuantity`, tăng biến `adjustedItemsCount`.                                      | Frontend đăng nhập thành công, cập nhật số lượng khả dụng mới.                     | Số lượng tự điều chỉnh về tồn kho tối đa mà không gây crash hệ thống.                                   |

---

## 5. Ranh Giới UI Freeze Đối Với Admin Returns & Phân Định Phạm Vi M6

### 5.1. Khảo sát cấu trúc thực tế của `AdminDashboardPage.tsx`

Tệp `apps/web/src/features/admin/AdminDashboardPage.tsx` gồm 6.311 dòng code, định nghĩa chính xác 13 Tab quản trị (`AdminTab` - Dòng 7–20):

1. `'dashboard'` — Thống kê doanh thu, đơn hàng, biểu đồ SVG
2. `'orders'` — Danh sách đơn hàng, chi tiết đơn, chuyển trạng thái đơn
3. `'products'` — Danh sách, tìm kiếm, lọc, modal thêm/sửa sản phẩm
4. `'categories'` — Cây danh mục, thêm/sửa/xóa danh mục
5. `'brands'` — Danh sách và quản lý thương hiệu
6. `'inventory'` — Bảng tồn kho và nhật ký xuất nhập tồn (`InventoryLog`)
7. `'coupons'` — Danh sách mã giảm giá, cấu hình khuyến mãi
8. `'flash-sales'` — Chiến dịch Flash Sale, giờ vàng giảm giá
9. `'banners'` — Quản lý banner quảng cáo trang chủ
10. `'posts'` — Quản lý bài viết tin tức công nghệ
11. `'users'` — Quản lý danh sách khách hàng và phân quyền
12. `'reviews'` — Kiểm duyệt và xóa đánh giá sản phẩm
13. `'settings'` — Cấu hình thông tin cửa hàng

### 5.2. Nhận định ranh giới & Quyết định kỹ thuật

- **Hiện trạng:** Trong toàn bộ 6.311 dòng của `AdminDashboardPage.tsx`, **hoàn toàn không có bất kỳ tab, nút bấm, menu item hoặc placeholder nào dành cho Quản lý Đổi/Trả hàng (Returns Management)**. Từ khóa "return" trong tệp chỉ xuất hiện ở các câu lệnh JavaScript `return` và điều kiện kiểm tra trạng thái đơn hàng `o.orderStatus === 'RETURNED'`.
- **Rủi ro vi phạm nguyên tắc:** Nếu bổ sung giao diện quản trị Đổi/Trả hàng vào `AdminDashboardPage.tsx`, lập trình viên bắt buộc phải:
  - Thêm một tab mới vào thanh điều hướng Sidebar.
  - Sửa đổi mảng `AdminTab` và cấu trúc layout chính.
  - Viết thêm hàng trăm dòng mã giao diện (bảng hiển thị, modal duyệt/từ chối, bộ lọc trạng thái).
  - Can thiệp vào các class Tailwind CSS và cấu trúc DOM hiện có.
    $\rightarrow$ **Điều này sẽ vi phạm trực tiếp và nghiêm trọng nguyên tắc cốt lõi: `ABSOLUTE UI FREEZE` (Không thay đổi giao diện, bố cục, CSS/Tailwind hoặc assets).**
- **Quyết định phân định (Boundary Enforcement):**
  - **Giao diện Admin Returns:** Được xác định chính thức là **NẰM NGOÀI PHẠM VI M6.1** và được **HOÃN LẠI (DEFERRED)**. Không tự ý chèn giao diện quản trị mới vào `AdminDashboardPage.tsx`.
  - **Giao diện Khách hàng Đổi/Trả (Customer Returns):** Tại `ProfilePage.tsx` (Tab Returns), giao diện hiện đã có sẵn khung thẻ mẫu tĩnh. Tại Milestone M6.3, việc đấu nối logic gửi yêu cầu đổi/trả (`GET /api/v1/profile/returns`, `POST /api/v1/profile/returns`) sẽ được thực hiện trực tiếp trên khung giao diện có sẵn mà không làm thay đổi cấu trúc bố cục hay CSS.

---

## 6. Phạm Vi Triển Khai Kỹ Thuật Chi Tiết Cho M6.1 (Strict M6.1 Technical Scope)

M6.1 được giới hạn nghiêm ngặt trong việc hoàn thiện nền tảng tích hợp dịch vụ (API Foundation) và khép kín luồng Guest Cart Merge:

### 6.1. Các tệp tin nằm trong phạm vi chỉnh sửa (Files to modify)

1. `apps/web/src/services/authService.ts`:
   - Bổ sung việc tự động đọc `guestSessionId` từ `localStorage.getItem('nexora_guest_session')` khi gọi `login()` và `register()`.
   - Lưu trữ token và user info chuẩn xác.
2. `apps/web/src/services/cartService.ts`:
   - Bổ sung hàm tiện ích `mergeCart(guestSessionId: string): Promise<MergeCartResultDto>`.
   - Xuất hàm hỗ trợ quản lý vòng đời session: `getGuestSessionId()`, `clearGuestSession()`.
3. `apps/web/src/features/auth/LoginPage.tsx`:
   - Cập nhật hàm `handleLogin`: Sau khi `authService.login()` thành công, gọi `clearGuestSession()` để xóa `nexora_guest_session` khỏi `localStorage`.
   - Kích hoạt `queryClient.invalidateQueries({ queryKey: ['cart'] })` để đồng bộ giỏ hàng ngay lập tức.
   - Giữ nguyên toàn bộ layout, form markup, CSS classes và thông điệp lỗi.
4. `apps/web/src/features/auth/RegisterPage.tsx`:
   - Cập nhật hàm `handleRegister`: Sau khi `authService.register()` thành công, gọi `clearGuestSession()`.
   - Kích hoạt `queryClient.invalidateQueries({ queryKey: ['cart'] })`.
   - Giữ nguyên toàn bộ layout, form markup, thanh đo mật khẩu và CSS classes.
5. `apps/web/src/test/m6_1_auth_cart_merge.test.ts` (Tệp kiểm thử mới):
   - Xây dựng bộ Unit & Integration Tests tự động kiểm tra toàn diện vòng đời Guest Session, chuyển đổi giỏ hàng, xóa localStorage khi thành công, bảo toàn khi thất bại và kích hoạt invalidate cache.

### 6.2. Các vùng cấm tuyệt đối (Strictly Forbidden)

- **CẤM:** Thay đổi bất kỳ class CSS/Tailwind nào trong `LoginPage.tsx`, `RegisterPage.tsx` hoặc các trang khác.
- **CẤM:** Sửa đổi mã nguồn Backend (`apps/api`), Database schema (`prisma/schema.prisma`), hoặc tạo migration mới.
- **CẤM:** Tạo thêm tab mới hoặc sửa đổi layout của `AdminDashboardPage.tsx`.
- **CẤM:** Chạm vào thư mục `TechPilot/` hoặc `audit-output/`.

---

## 7. Tiêu Chí Nghiệm Thu M6.1 (Verifiable Acceptance Criteria)

| Mã AC    | Tiêu chí nghiệm thu                                                | Phương thức kiểm chứng                                                                 | Kết quả kỳ vọng                                                              |
| :------- | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **AC-1** | `authService.login()` và `register()` tự động gắn `guestSessionId` | Kiểm tra payload network hoặc unit test mock API call                                  | Body hoặc Header có chứa `guestSessionId` hợp lệ nếu khách có phiên giỏ hàng |
| **AC-2** | Dọn dẹp `nexora_guest_session` khi xác thực thành công             | Kiểm tra `localStorage.getItem('nexora_guest_session')` sau khi login/register 200/201 | Trả về `null` (đã được dọn dẹp sạch sẽ)                                      |
| **AC-3** | Bảo toàn `nexora_guest_session` khi xác thực thất bại              | Kiểm tra `localStorage` sau khi API trả về mã lỗi 401 hoặc 409                         | Khóa `nexora_guest_session` vẫn tồn tại nguyên vẹn                           |
| **AC-4** | Kích hoạt làm mới Cache giỏ hàng tức thời                          | Kiểm tra việc gọi `queryClient.invalidateQueries({ queryKey: ['cart'] })`              | Cache giỏ hàng tự động refetch mà không cần tải lại toàn bộ trang web        |
| **AC-5** | `cartService.mergeCart()` sẵn sàng sử dụng độc lập                 | Gọi phương thức `cartService.mergeCart(sessionId)`                                     | Gửi request `POST /api/v1/cart/merge` có kèm Bearer Token                    |
| **AC-6** | Đảm bảo chất lượng toàn dự án (Zero Regression)                    | Chạy `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`       | 100% Pass, không lỗi cú pháp, không vi phạm kiểu, không lỗi format           |

---

## 8. Kết Luận Kiểm Toán & Trạng Thái Sẵn Sàng (Auditor Sign-off)

1. **Vấn đề Double-Merge:** Đã được chứng minh triệt để bằng cơ chế khóa dòng `FOR UPDATE` và lệnh xóa `tx.cart.delete` trong ACID Transaction của Backend. Không có nguy cơ nhân đôi sản phẩm.
2. **Chiến lược Merge:** Đã chốt phương án tối ưu duy nhất: **Backend Auto-Merge trong Auth Flow**. Tuyệt đối không gọi thêm `cart/merge` sau khi login để tránh phát sinh network hop thừa.
3. **Vòng đời Session:** Được bảo vệ chặt chẽ: chỉ xóa khi auth 200/201; giữ nguyên khi auth thất bại để bảo vệ dữ liệu khách hàng.
4. **Ranh giới UI Freeze:** Khẳng định tôn trọng tuyệt đối yêu cầu của User: hoãn lại (defer) giao diện Admin Returns vì không có placeholder tương thích, kiên quyết không can thiệp layout hay CSS.
5. **Trạng thái Workspace:**
   - Git working tree: Hoàn toàn sạch (`branch: main`, không có file bị sửa đổi ngoài báo cáo xác minh).
   - Backend & Database: Nguyên vẹn 100%.
   - Không có commit hay push nào được thực hiện.

**Hệ thống đã hoàn tất khâu đối soát kỹ thuật và sẵn sàng nhận chỉ thị triển khai Milestone M6.1 từ Người Dùng.**
