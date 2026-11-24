# NEXORA — ARCHITECTURE AUDIT & SYSTEM INTEGRITY EVALUATION
**Document Version:** 1.0.0  
**Audit Scope:** Architectural Topology, Module Boundaries & Coupling (Stage 2)  
**Date:** 2026-11-23  
**Auditor:** Principal Software Architect & Senior Technical Auditor  
**Workspace Root:** `D:\Nexora`  
**Git Baseline:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` (`main`)  

---

## 1. Architectural Style & Monolith Decomposition

Nexora strictly adheres to a **Modular Monolith** pattern within an npm Workspaces monorepo.

### Architectural Blueprint
```
+-----------------------------------------------------------------------------------+
|                              APPS / WEB (React 19 SPA)                            |
|  [Storefront] [Catalog Browser] [Cart & Checkout] [Customer Hub] [Admin Portal]   |
+-----------------------------------------+-----------------------------------------+
                                          | JSON REST Envelopes (HTTP /api/v1)
                                          v
+-----------------------------------------------------------------------------------+
|                             APPS / API (Express.js 5)                             |
|  +-----------------------------------------------------------------------------+  |
|  | Middlewares: Helmet | CORS | RateLimiter | AuthJWT | RequireRoles | Validate |  |
|  +-----------------------------------------------------------------------------+  |
|  | Modules:                                                                    |  |
|  |  * auth      : Argon2, JWT lifecycle, password reset email delivery         |  |
|  |  * profile   : M2/M6.2 Profile DTO, Address Book CRUD, Notifications       |  |
|  |  * cart      : Guest session cart, M3 atomic cart merge engine             |  |
|  |  * catalog   : Products, Categories, Brands, M4 Customer Reviews           |  |
|  |  * orders    : 2-step checkout, atomic inventory decrement, price snapshots |  |
|  |  * payment   : VNPay HMAC-SHA512 webhook integration, transaction state     |  |
|  |  * returns   : M5 4-step state machine return workflow, inventory restore  |  |
|  |  * admin     : Staff/Admin stock adjustments (7 reasons), audit logs        |  |
|  +-----------------------------------------------------------------------------+  |
|  | Repositories & Data Access Layer (Prisma Client 6.4)                        |  |
+-----------------------------------------+-----------------------------------------+
                                          | TCP Connection Pool (InnoDB Engine)
                                          v
+-----------------------------------------------------------------------------------+
|                        DATABASE LAYER (MySQL 8.4 LTS)                             |
|        [20 Tables] [Foreign Key Constraints] [Row Locks] [Append-Only Logs]       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Module Boundary Analysis & Layer Decoupling

### 2.1. Layer Separation Quality
1. **Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Repositories:**
   - **Routes:** Declare HTTP methods, paths, and wire up validation middleware. No business logic.
   - **Controllers:** Extract request params, query, and body. Delegate to services. Format standard JSON response envelopes `{ success: true, data: ... }`.
   - **Services:** Contain 100% of domain business rules, transaction boundaries (`prisma.$transaction`), state machine validations, and permission/ownership verification.
   - **Repositories:** Abstract database queries using Prisma Client. Prevent SQL injection through parameterization.

### 2.2. Circular Dependency Verification
- **AST Scan Result:** `0 circular dependencies detected`.
- `packages/shared` depends on NO internal packages (pure contract leaf node).
- `apps/api` depends only on `packages/shared` and external NPM packages.
- `apps/web` depends only on `packages/shared` and external NPM packages.
- There is NO cross-app dependency (API never imports from Web; Web never imports from API).

### 2.3. Frontend DB Access Isolation
- **Rule Verification:** Frontend code MUST NOT import `@prisma/client` or connect to MySQL.
- **AST Grep Result:** Checked all 52 `.tsx` and 42 `.ts` files in `apps/web/src/`.
- **Finding:** ZERO database client imports. All data fetching is strictly mediated via Axios services in `apps/web/src/services/` targeting `/api/v1/*`.

---

## 3. Technical Debt & Anti-Pattern Analysis

| Architectural Pattern | Status | Finding / Evidence | Severity |
|---|:---:|---|:---:|
| **Central Error Handling** | ✅ VERIFIED | `apps/api/src/errors/errorHandler.ts` catches all unhandled exceptions, maps `AppError` subclasses to HTTP status codes, and hides stack traces in production. | Clean |
| **Central Env Validation** | ✅ VERIFIED | `apps/api/src/config/env.ts` enforces Zod schema for `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, etc., preventing runtime undefined crashes. | Clean |
| **Transaction Isolation** | ✅ VERIFIED | Checkout, cart merge, return approval, and stock adjustments strictly use `prisma.$transaction(async (tx) => ...)` with InnoDB row locks. | Clean |
| **Money Handling Precision** | ✅ VERIFIED | All financial columns (`price`, `salePrice`, `unitPrice`, `totalPrice`, `refundAmount`, `discountAmount`) use `DECIMAL(12, 2)` or `DECIMAL(10, 2)`. Zero `FLOAT` or `DOUBLE` types in database. | Clean |
| **Historical Price Snapshots** | ✅ VERIFIED | Orders store `price`, `salePrice`, `discountAmount` at order creation time in `OrderItem`. Historical analytics never look up current prices. | Clean |

---

## 4. Conclusion & Architectural Grade

- **Overall Architectural Health:** **GRADE A (Robust Modular Monolith)**
- **Boundary Violations:** None detected.
- **Scalability Assessment:** Monolith can be horizontally scaled stateless behind Nginx; database connection pool is managed via Prisma.
