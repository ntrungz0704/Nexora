# 08. Workflow Diagrams (Code-Verified Mermaid Flows)

Tất cả 11 sơ đồ dưới đây được dựng trực tiếp từ luồng xử lý thực tế trong mã nguồn `apps/web` và `apps/api`.

---

## 1. Registration & Login Workflow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as LoginPage / RegisterPage
    participant API as AuthController / AuthService
    participant DB as MySQL (users, carts)

    U->>FE: Submit email, password (+ fullName)
    FE->>API: POST /api/v1/auth/register or /login
    API->>DB: findUnique(email.toLowerCase())
    alt Register
        DB-->>API: null (not exists)
        API->>API: bcrypt.hash(password, 10)
        API->>DB: INSERT users (role=CUSTOMER) + INSERT carts
    else Login
        DB-->>API: user record
        API->>API: check status===ACTIVE & bcrypt.compare()
    end
    API->>API: jwt.sign({ sub, email, role }, AUTH_SECRET, 7d)
    API-->>FE: 200/201 { success: true, data: { user, token } }
    FE->>FE: Save nexora_token & nexora_user in localStorage
```

## 2. Product Browsing, Search & Filtering

```mermaid
flowchart LR
    A["User visits / or /search or /category/:slug"] --> B["StorefrontHome / SearchPage"]
    B --> C["GET /api/v1/catalog/products?q&category&brand&minPrice&maxPrice&specs&sort&page"]
    C --> D["CatalogRepository.findProducts()"]
    D --> E["Normalize category alias (e.g. gaming-gear, pc-nexora)"]
    E --> F["MySQL Query (status=ACTIVE + filters + pagination)"]
    F --> G["Return products + pagination meta"]
    G --> H["ProductCard.extractProductPills() (CPU/RAM/SSD/GPU/Display)"]
```

## 3. Add to Cart (Guest & Authenticated)

```mermaid
sequenceDiagram
    participant U as Guest / Customer
    participant FE as ProductCard / ProductDetailPage
    participant API as CartController / CartService
    participant DB as MySQL (carts, cart_items)

    U->>FE: Click "Thêm vào giỏ hàng"
    FE->>API: POST /api/v1/cart/items (Bearer JWT or x-guest-session-id)
    API->>API: optionalAuth() resolves req.user or guestSessionId
    API->>DB: Find or Create Cart
    API->>DB: Upsert CartItem (check product exists & stock)
    API->>DB: Recompute subtotal & totalItems from DB prices
    API-->>FE: 200 Updated CartDto
    FE->>FE: Invalidate TanStack Query ['cart']
```

## 4. Checkout & Coupon Application

```mermaid
flowchart TD
    A["CartPage / CheckoutPage"] --> B["GET /api/v1/marketing/coupons"]
    B --> C["Display selectable voucher cards + eligibility badge"]
    C --> D["Click Voucher or Submit Code"]
    D --> E["POST /api/v1/marketing/coupons/validate { code, subtotal }"]
    E --> F{"Valid, Active, Not Expired, >= minOrder, < usageLimit?"}
    F -- "Yes" --> G["Return discountAmount & update UI total"]
    F -- "No" --> H["Show red inline error message + toast"]
    G --> I["Submit Order Form -> POST /api/v1/orders"]
```

## 5. COD Order Creation (Atomic Stock Decrement)

```mermaid
sequenceDiagram
    participant FE as CheckoutPage
    participant API as OrderService.createOrder
    participant DB as MySQL InnoDB Transaction

    FE->>API: POST /api/v1/orders (paymentMethod=COD)
    API->>DB: Fetch products & validate coupon on server
    API->>API: Compute subtotal, discount, shipping (>=500k free else 30k)
    API->>DB: BEGIN $transaction
    API->>DB: INSERT orders (NX-xxxxxx-xxxx, PENDING) + order_items snapshot
    API->>DB: Increment coupon.usageCount (if applied)
    loop Sorted by productId ASC (deadlock prevention)
        API->>DB: UPDATE products SET stock = stock - qty WHERE id=? AND stock >= qty
        alt count === 0
            DB-->>API: Rollback -> 400 INSUFFICIENT_STOCK
        else count === 1
            API->>DB: INSERT inventory_logs (SALE, -qty)
        end
    end
    API->>DB: Clear ordered items from user Cart
    API->>DB: COMMIT
    API-->>FE: 201 OrderDto -> Navigate /checkout/success?code=NX-...
```

## 6. VNPay Online Payment & Idempotent Callback

```mermaid
sequenceDiagram
    participant U as Customer
    participant FE as CheckoutPage / CheckoutSuccessPage
    participant API as PaymentService
    participant VNP as VNPay Sandbox Gateway
    participant DB as MySQL (orders)

    FE->>API: POST /api/v1/payment/vnpay/create-url { orderCode }
    API->>DB: Load order & verify ownership (User ID or Guest email/phone)
    API->>API: Sign params with HMAC-SHA512 (amount = DB totalAmount * 100)
    API-->>FE: { paymentUrl }
    FE->>VNP: Redirect user to VNPay
    VNP-->>FE: Redirect back with vnp_* query + vnp_SecureHash
    FE->>API: GET /api/v1/payment/vnpay/callback?vnp_*
    API->>API: Verify HMAC-SHA512 & compare vnp_Amount === totalAmount*100
    alt Already PAID
        API-->>FE: 200 Idempotent success (no double update)
    else responseCode==='00'
        API->>DB: UPDATE orders SET paymentStatus=PAID, orderStatus=CONFIRMED, paidAt=NOW()
        API-->>FE: 200 Thanh toán VNPay thành công
    else Failed
        API->>DB: UPDATE orders SET paymentStatus=FAILED
        API-->>FE: 200 isSuccess=false
    end
```

## 7. Customer Order Cancellation & Stock Restoration

```mermaid
flowchart TD
    A["Customer clicks Cancel on ProfilePage"] --> B["POST /api/v1/orders/:code/cancel (requireAuth)"]
    B --> C{"order.userId === req.user.sub?"}
    C -- "No" --> D["403 FORBIDDEN"]
    C -- "Yes" --> E{"Status PENDING or CONFIRMED?"}
    E -- "No" --> F["400 CANNOT_CANCEL"]
    E -- "Yes" --> G["BEGIN $transaction"]
    G --> H["UPDATE orders SET orderStatus=CANCELLED, cancelledAt=NOW()"]
    H --> I["Restore product.stockQuantity += item.quantity"]
    I --> J["INSERT inventory_logs (RETURN, +qty)"]
    J --> K["COMMIT & Return updated OrderDto"]
```

## 8. Return Request Workflow (Current Audit State)

```mermaid
flowchart LR
    A["Customer opens /profile/return"] --> B["ProfilePage (returns tab)"]
    B --> C["UI Form / Policy Display ONLY"]
    C --> D["GAP: No POST /api/v1/returns endpoint exists yet"]
    D -. "Prisma Model Exists (0 rows)" .-> E[("MySQL: return_requests")]
```

## 9. Password Reset Workflow (Including P0 Route Gap)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as ForgotPasswordPage / ResetPasswordPage
    participant API as AuthService
    participant SMTP as EmailService (Nodemailer)
    participant DB as MySQL (users)

    U->>FE: Enter email on /auth/forgot
    FE->>API: POST /api/v1/auth/forgot-password
    API->>DB: findUnique(email)
    API->>API: Sign JWT (15m, purpose=password_reset, hashSig)
    API->>SMTP: Send email with /auth/reset-password?token=...
    Note over FE,SMTP: P0 BUG: AppRoutes.tsx has /auth/reset & /reset-password, NOT /auth/reset-password (404)!
    API-->>FE: 200 Generic anti-enumeration message
    U->>FE: Submit newPassword on /reset-password?token=...
    FE->>API: POST /api/v1/auth/reset-password
    API->>API: Verify JWT + purpose + hashSig
    API->>DB: Atomic updateMany WHERE id=? AND passwordHash=oldHash
    alt count === 1
        API-->>FE: 200 Password updated (replay/concurrent calls fail)
    else count === 0
        API-->>FE: 400 Token already used
    end
```

## 10. Admin Inventory Adjustment Workflow

```mermaid
flowchart TD
    A["Admin/Staff opens Inventory Modal in AdminDashboardPage"] --> B["Select Product, IMPORT/EXPORT, Qty, Reason (7 options)"]
    B --> C["POST /api/v1/admin/inventory/adjust (requireAuth ADMIN/STAFF)"]
    C --> D["AdminService.adjustStock() inside $transaction"]
    D --> E{"EXPORT & stock < qty?"}
    E -- "Yes" --> F["400 INSUFFICIENT_STOCK (prevent negative inventory)"]
    E -- "No" --> G["UPDATE products SET stockQuantity = newBalance"]
    G --> H["INSERT inventory_logs (balanceBefore, balanceAfter, actorId, note)"]
    H --> I["Return updated product & log"]
```

## 11. AI 5-Step Survey Recommendation Workflow

```mermaid
flowchart TD
    A["Customer completes 5 steps on /ai-assistant"] --> B["POST /api/v1/ai/assistant/survey"]
    B --> C["AiService.runSurveyRecommendation()"]
    C --> D["Fetch ACTIVE products matching categoryPreference (fallback: all ACTIVE)"]
    D --> E["Deterministic 100-pt Scoring: Budget(35) + Persona(35) + Brand(15) + Priority(15)"]
    E --> F["Select 3 Roles: BEST_MATCH, BEST_VALUE (score/price), TOP_PERFORMANCE (max price)"]
    F --> G["INSERT ai_assistant_logs (provider=nexora_scoring_v2)"]
    G --> H["Return 3 scored ProductDto recommendations + matchReasons"]
```
