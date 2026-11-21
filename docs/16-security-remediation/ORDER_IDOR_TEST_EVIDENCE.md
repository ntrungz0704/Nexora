# Objective B — Order Detail IDOR Remediation & Test Evidence

## 1. Vulnerability Details

- **Original Files & Lines:**
  - `apps/api/src/modules/order/order.routes.ts:12`
  - `apps/api/src/modules/order/order.controller.ts:33-44`
  - `apps/api/src/modules/order/order.service.ts:233-242`
  - `apps/web/src/features/orderTracking/OrderTrackingPage.tsx:62-67`
- **Root Cause:** `GET /api/v1/orders/detail/:code` had no authentication middleware, no ownership check, and no guest verification. Any caller knowing or guessing an `NX-` order code could read another customer's full name, email, phone number, shipping address, notes, and line items.
- **Security Impact:** P0 Insecure Direct Object Reference (IDOR) and customer PII exposure.

## 2. Documented Access & Guest Verification Policy

1. **Unauthenticated without verification (`!requester && !phone && !email`):** Rejected immediately with `401 UNAUTHORIZED` before querying the database (prevents order-code existence enumeration).
2. **`ADMIN` and `STAFF`:** Authorized via JWT RBAC to inspect full order details.
3. **Authenticated `CUSTOMER`:** Permitted ONLY when `order.userId === req.user.sub` (returns full order DTO). Access to any other customer's order returns the exact same `404 ORDER_NOT_FOUND` payload as a non-existent order.
4. **Guest Order Lookup (`order.userId === null`):** Permitted ONLY with matching `phone` or `email` query parameter, protected by `orderLookup` rate limiter (`20 req / 15 min`), and returns a **PII-minimized DTO** (`customerPhone` masked `098****321`, `customerEmail` masked `gu***@domain`, street address masked `***, District, Province`, `customerNotes: null`).
5. **Registered Customer Orders vs Guest Lookup:** Unauthenticated calls to `/orders/detail/:code` targeting a registered user's order (`userId !== null`) are rejected with the same uniform `404 ORDER_NOT_FOUND`.
6. **Frontend Sync (`OrderTrackingPage.tsx`):** Sends `Authorization: Bearer <token>` when logged in, and requires phone number verification when unauthenticated.

## 3. Automated Test Evidence (`apps/api/tests/phase_a_security_remediation.test.ts`)

| Test ID   | Scenario                                                                             | Expected                                                         | Actual Result |
| --------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------- |
| `IDOR-B1` | Unauthenticated without phone/email (existing vs non-existent code)                  | Identical `401 UNAUTHORIZED`                                     | **PASS**      |
| `IDOR-B2` | Order owner (`Customer A`) accessing own order                                       | `200 OK` with full details, no internal secrets                  | **PASS**      |
| `IDOR-B3` | Different customer (`Customer B`) accessing `Customer A` order vs non-existent order | Identical `404 ORDER_NOT_FOUND` status & message                 | **PASS**      |
| `IDOR-B4` | `ADMIN` and `STAFF` accessing customer order                                         | `200 OK`                                                         | **PASS**      |
| `IDOR-B5` | Guest accessing guest order with valid `phone` or `email`                            | `200 OK` with masked phone/email/address & `customerNotes: null` | **PASS**      |
| `IDOR-B6` | Guest with invalid verification OR targeting registered order via `/detail/:code`    | Uniform `404 ORDER_NOT_FOUND` matching non-existent code         | **PASS**      |

## 4. Remaining Limitations

- `GET /api/v1/orders/track?code=&phone=` still supports phone-based tracking for registered orders (for customers tracking on a device where they are not signed in), now protected by `orderLookup` rate limiting (`20 req / 15 min`) and PII masking when unauthenticated.
