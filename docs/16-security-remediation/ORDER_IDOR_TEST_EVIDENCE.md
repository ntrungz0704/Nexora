# Objective B — Order Detail IDOR Remediation & Order Tracking Policy Evidence

## 1. Vulnerability Details & System Overview

- **Original Files & Lines:**
  - `apps/api/src/modules/order/order.routes.ts:11-13`
  - `apps/api/src/modules/order/order.controller.ts:33-73`
  - `apps/api/src/modules/order/order.service.ts:278-368, 602-611`
  - `apps/web/src/features/orderTracking/OrderTrackingPage.tsx:51-115`
- **Root Cause:**
  - `GET /api/v1/orders/detail/:code` originally lacked authentication middleware, ownership enforcement, and guest verification. Any client possessing an `NX-` order code could view private customer details (PII) including full name, plain phone number, unmasked email, complete street address, and internal customer notes.
  - `GET /api/v1/orders/track` required `code` and `phone`, but had no dedicated functional authorization and PII masking test coverage across registered vs guest accounts.
- **Security Impact:** P0 Insecure Direct Object Reference (IDOR) and customer PII leakage.

---

## 2. Policy Distinction: `/orders/detail/:code` vs `/orders/track`

Nexora provides two distinct order retrieval endpoints serving different operational workflows:

| Aspect                        | `GET /api/v1/orders/detail/:code`                          | `GET /api/v1/orders/track`                                                    |
| :---------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Primary Workflow**          | Comprehensive Order Inspection & Account History           | Live Shipment & Delivery Status Tracking                                      |
| **Client UI Consumer**        | Account Profile, Order Confirmation, Admin Support         | Storefront `OrderTrackingPage.tsx`                                            |
| **Input Parameters**          | Route param `:code` + optional `?phone=` / `?email=`       | Query params `?code=` AND `?phone=` (both mandatory)                          |
| **Validation Schema**         | Non-empty code validation                                  | Strict `TrackOrderInputSchema` (`code` + `phone`)                             |
| **Rate Limiting**             | Protected by `orderLookup` (20 req / 15 min / IP)          | Protected by `orderLookup` (20 req / 15 min / IP)                             |
| **`ADMIN` / `STAFF`**         | Full unmasked order DTO                                    | Full unmasked order DTO                                                       |
| **Authenticated Owner**       | Full unmasked order DTO (`order.userId === req.user.sub`)  | Full unmasked order DTO (`order.userId === req.user.sub`)                     |
| **Different Customer**        | Uniform `404 ORDER_NOT_FOUND` (identical to non-existent)  | Sanitized PII-masked DTO (`customerNotes: null`) if phone matches; else `404` |
| **Guest on Guest Order**      | Permitted with matching phone or email; returns masked DTO | Permitted with matching phone; returns masked DTO                             |
| **Guest on Registered Order** | **STRICTLY BLOCKED:** Uniform `404 ORDER_NOT_FOUND`        | Permitted with exact code + phone; returns **sanitized masked DTO**           |
| **Unverified Callers**        | Uniform `401 UNAUTHORIZED` before touching database        | `400 VALIDATION_ERROR` (if phone missing) or `404` (if mismatch)              |
| **Legacy Parity Status**      | Preserved & verified                                       | **NOT VERIFIED** (retained for storefront UX compatibility)                   |

---

## 3. PII Exposure & Minimization Assessment

To prevent account takeover and privacy violations, responses to unauthenticated guests and third parties are sanitized via `mapOrderToSanitizedGuestDto`:

| Order Field       | Authenticated Owner / Admin Response | Unauthenticated Guest Tracking Response | Frontend `OrderTrackingPage` Usage           |
| :---------------- | :----------------------------------- | :-------------------------------------- | :------------------------------------------- |
| `orderCode`       | `NX-123456-7890`                     | `NX-123456-7890`                        | Header title & order reference               |
| `createdAt`       | Full ISO timestamp                   | Full ISO timestamp                      | Displays order date & timeline               |
| `orderStatus`     | Full status enum                     | Full status enum                        | Stepper (PENDING, CONFIRMED, SHIPPING, etc.) |
| `customerName`    | `Nguyễn Văn An`                      | `Nguyễn Văn An`                         | Displays recipient greeting                  |
| `customerPhone`   | `0903456789`                         | **Masked (`090****789`)**               | Confirms delivery recipient                  |
| `customerEmail`   | `customer@nexora.local`              | **Masked (`cu***@nexora.local`)**       | Shielded from unauthenticated viewers        |
| `shippingAddress` | `123 Đường Nguyễn Huệ, Quận 1, HCM`  | **Masked (`***, Quận 1, HCM`)**         | Conceals exact street address & house number |
| `customerNotes`   | `Ghi chú riêng tư khách hàng`        | **`null` (Strictly Omitted)**           | Never exposed outside authenticated owner    |
| `totalAmount`     | `1,500,000`                          | `1,500,000`                             | Displays order financial total               |
| `paymentMethod`   | `COD` / `VNPAY`                      | `COD` / `VNPAY`                         | Displays payment summary                     |
| `carrierName`     | `VNPost Express`                     | `VNPost Express`                        | Displays logistics carrier                   |
| `trackingNumber`  | `VNPOST-88291039`                    | `VNPOST-88291039`                       | Displays shipping waybill tracking           |
| `items`           | Full product items list              | Full product items list                 | Displays package items list & thumbnails     |

---

## 4. Automated Test Evidence (`apps/api/tests/phase_a_security_remediation.test.ts`)

### Part 1: Order Detail IDOR Protection (`GET /orders/detail/:code`)

| Test ID   | Scenario                                                           | Expected Result                                                  | Actual Result |
| :-------- | :----------------------------------------------------------------- | :--------------------------------------------------------------- | :-----------: |
| `IDOR-B1` | Unauthenticated request without phone/email verification           | Identical `401 UNAUTHORIZED` for existing & non-existent orders  |   **PASS**    |
| `IDOR-B2` | Registered order owner (`Customer A`) accessing own order          | `200 OK` with full unmasked details and customerNotes            |   **PASS**    |
| `IDOR-B3` | Different customer (`Customer B`) accessing `Customer A` order     | Uniform `404 ORDER_NOT_FOUND` (identical to non-existent order)  |   **PASS**    |
| `IDOR-B4` | `ADMIN` and `STAFF` accessing customer order                       | `200 OK` with full order DTO via explicit RBAC                   |   **PASS**    |
| `IDOR-B5` | Guest accessing guest order with valid matching `phone` or `email` | `200 OK` with masked phone/email/address & `customerNotes: null` |   **PASS**    |
| `IDOR-B6` | Guest with invalid verification OR targeting registered order      | Uniform `404 ORDER_NOT_FOUND` matching non-existent code         |   **PASS**    |

### Part 2: Order Tracking Authorization & PII Protection (`GET /orders/track`)

| Test ID     | Scenario                                                                                      | Expected Result                                                      | Actual Result |
| :---------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- | :-----------: |
| `TRACK-B7`  | Guest tracking registered order with correct code & matching phone                            | `200 OK` with sanitized masked PII (`customerNotes: null`)           |   **PASS**    |
| `TRACK-B8`  | Guest tracking registered order with incorrect phone number                                   | Uniform `404 ORDER_NOT_FOUND`                                        |   **PASS**    |
| `TRACK-B9`  | Guest tracking non-existent order code                                                        | Uniform `404 ORDER_NOT_FOUND`                                        |   **PASS**    |
| `TRACK-B10` | Authenticated owner (`Customer A`) tracking own order                                         | `200 OK` with full unmasked details and `customerNotes`              |   **PASS**    |
| `TRACK-B11` | Authenticated different customer (`Customer B`) tracking `Customer A` order with code & phone | `200 OK` with **sanitized masked PII** (identical to guest tracking) |   **PASS**    |
| `TRACK-B12` | `ADMIN` and `STAFF` tracking registered order via `/orders/track`                             | `200 OK` with full unmasked operational details                      |   **PASS**    |

---

## 5. Parity & Architecture Summary

- **Anti-Enumeration Guarantee:** Unauthenticated and unauthorized requests receive uniform `404 ORDER_NOT_FOUND` responses with identical JSON payload envelopes, eliminating any timing or status oracle for discovering valid order codes.
- **TechPilot Parity Decision:** Because original TechPilot PHP source code is unavailable in the local workspace, legacy phone-tracking equivalence is formally marked **`NOT VERIFIED`**. However, preserving phone-based tracking for registered orders while enforcing strict PII masking ensures zero disruption to storefront customers tracking packages while eliminating privacy exposure risks.
