# NEXORA — API & BUSINESS LOGIC AUDIT
**Document Version:** 1.0.0  
**Audit Scope:** REST API Contracts, RBAC, IDOR Protection & Business Logic Workflows (Stage 2)  
**Date:** 2026-11-23  
**Auditor:** Principal Software Architect & Lead Security Reviewer  
**Workspace Root:** `D:\Nexora`  
**Git Baseline:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` (`main`)  

---

## 1. REST API Routing & Contract Inventory

The Nexora API surfaces 42 RESTful endpoints structured under `/api/v1/`:

```
/api/v1
├── /auth
│   ├── POST /register               # Customer registration with argon2 hash & cart merge
│   ├── POST /login                  # Customer/Staff/Admin login with JWT issuance & cart merge
│   ├── POST /forgot-password        # Secure password reset token generation & email delivery
│   └── POST /reset-password         # Single-use token verification & atomic password reset
├── /profile (M2 / M6.2)
│   ├── GET  /                       # Fetch customer profile (name, email, phone, avatar)
│   ├── PUT  /                       # Update customer profile with Zod validation
│   ├── GET  /addresses              # Fetch customer address book
│   ├── POST /addresses              # Create address (auto-default if first address)
│   ├── PUT  /addresses/:id          # Update customer address (ownership verified)
│   ├── DELETE /addresses/:id        # Delete address (auto-promotes remaining address if default)
│   ├── PATCH /addresses/:id/default # Set specific address as default (atomic transaction)
│   ├── GET  /notifications          # Customer notification inbox with unread count
│   ├── PATCH /notifications/:id/read# Mark notification as read (ownership verified)
│   ├── PATCH /notifications/read-all# Mark all notifications as read
│   └── POST /change-password        # Authenticated password change with argon2 verify
├── /cart (M3 / M6.1)
│   ├── GET  /                       # Fetch active cart (Guest session or Customer)
│   ├── POST /items                  # Add item to cart with stock validation
│   ├── PUT  /items/:id              # Update cart item quantity
│   ├── DELETE /items/:id            # Remove line item from cart
│   ├── DELETE /clear                # Clear all cart items
│   └── POST /merge                  # M3 7-scenario atomic guest-to-customer cart merge
├── /catalog
│   ├── GET  /products               # Search, paginate, sort, and filter products
│   ├── GET  /products/:slugOrId     # Product detail by slug or integer ID
│   ├── GET  /categories             # List active product categories
│   ├── GET  /brands                 # List hardware manufacturers
│   ├── GET  /reviews/:productId     # M4 Paginated verified customer reviews
│   ├── POST /reviews                # M4 Submit verified purchase review (ownership checked)
│   └── DELETE /reviews/:id          # M4 Delete customer's own review
├── /orders
│   ├── POST /                       # 2-step checkout order creation (snapshot prices, inventory decrement)
│   ├── GET  /                       # Customer order history (filtered by auth token user ID)
│   └── GET  /:orderCode             # Order detail (IDOR protected: customer can only view own order)
├── /returns (M5)
│   ├── POST /                       # Create return request (7-day delivered check, max qty check)
│   ├── GET  /                       # Customer return requests list
│   └── GET  /:returnCode            # Return detail (IDOR protected)
└── /admin
    ├── GET  /orders                 # Staff/Admin order management
    ├── PATCH /orders/:id/status     # Staff/Admin order status transition
    ├── GET  /returns                # Staff/Admin return requests queue
    ├── PATCH /returns/:id/process   # Staff/Admin 4-step state machine processing (APPROVE/REJECT)
    ├── PATCH /returns/:id/complete  # Staff/Admin completion & atomic inventory restoration
    ├── POST /inventory/adjust       # Staff/Admin stock adjustment (7 reasons + audit log)
    └── GET  /users                  # Admin user management & role assignment
```

---

## 2. Authentication, RBAC & IDOR Defense Verification

### 2.1. Role-Based Access Control (RBAC) Matrix
| Endpoint Group | `GUEST` (Anonymous) | `CUSTOMER` | `STAFF` | `ADMIN` | Enforcing Middleware |
|---|:---:|:---:|:---:|:---:|---|
| Public Catalog & News | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | None (Public) |
| Guest Cart Operations | ✅ Allowed | ❌ (uses user cart) | ❌ | ❌ | `optionalAuth` |
| Customer Profile & Address Book | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | `requireAuth` |
| Place Order & View Own Orders | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed | `requireAuth` |
| Customer Reviews Submission | ❌ 401 | ✅ Verified purchase | ✅ | ✅ | `requireAuth` + `verifyPurchase` |
| Staff Order Management | ❌ 401 | ❌ 403 | ✅ Allowed | ✅ Allowed | `requireRoles(['STAFF', 'ADMIN'])` |
| Stock Adjustment & Inventory Logs | ❌ 401 | ❌ 403 | ✅ Allowed | ✅ Allowed | `requireRoles(['STAFF', 'ADMIN'])` |
| Admin User Management & Roles | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed | `requireRoles(['ADMIN'])` |

### 2.2. Insecure Direct Object Reference (IDOR) Hardening
- **Customer Address Book:** Every `PUT`, `DELETE`, and `PATCH /addresses/:id` query includes `WHERE id = :id AND userId = :currentUserId`. Tampering with `:id` belonging to another user returns `404 Not Found` (never leaks existence).
- **Orders & Returns:** `GET /orders/:orderCode` and `GET /returns/:returnCode` check if the requesting user is the owner, unless user possesses `STAFF` or `ADMIN` role. Tested and verified in `apps/api/tests/phase_a_security_remediation.test.ts`.
- **Reviews:** `DELETE /reviews/:id` strictly checks `userId === currentUserId` for customers.

---

## 3. Core Business Workflow Integrity (Phase B Milestones)

### 3.1. M3 Guest Cart Merge (7 Conflict Scenarios)
- **Scenario 1 (New Item):** Item cleanly merged into user cart.
- **Scenario 2 (Duplicate Item):** Quantities accumulated idempotently.
- **Scenario 3 & 4 (Unavailable/Inactive Item):** Skipped with user warning returned in envelope.
- **Scenario 5 (Quantity > Stock):** Quantity capped to available `stockQuantity` with warning.
- **Scenario 6 (Price Drift):** Price refreshed to live product price.
- **Scenario 7 (Replay):** Guest cart atomically deleted on merge; replay returns 0 items safely.
- **Concurrency:** Verified serialized via InnoDB row lock without deadlocks (`MERGE-CONC`).

### 3.2. M5 Returns Workflow & Inventory Restoration
- **7-Day Eligibility Policy:** Explicit check against `order.deliveredAt` (null `deliveredAt` rejects return).
- **Quantity Cap:** Return item quantity cannot exceed purchased `orderItem.quantity`.
- **4-Step State Machine:** `REQUESTED` $\rightarrow$ `APPROVED` $\rightarrow$ `RECEIVED` $\rightarrow$ `COMPLETED` (or `REJECTED`). Disallows out-of-order transitions.
- **Inventory Restoration Idempotency:** Stock restored ONLY once upon reaching `COMPLETED`. Concurrent completion attempts strictly serialized (`INV-04`).
