# API Design Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** RESTful HTTP API contract standards for `apps/api` (`/api/v1/*`) and Swagger/OpenAPI documentation.

---

## 1. Versioning & Resource Naming (`MUST`)

- **Base Prefix:** All business and operational endpoints live under **`/api/v1/`** (e.g., `/api/v1/health`, `/api/v1/products`, `/api/v1/orders`).
- **Resource Nouns (`MUST`):** Use lowercase kebab-case plural nouns (`/api/v1/purchase-orders`, `/api/v1/return-requests`, `/api/v1/store-settings`). Actions not cleanly expressed as CRUD use explicit sub-resources (`POST /api/v1/orders/:id/cancel`, `POST /api/v1/orders/:id/reorder`).
- **HTTP Methods (`MUST`):** `GET` (safe/idempotent read), `POST` (create or non-idempotent command unless idempotency key provided), `PUT`/`PATCH` (full/partial update), `DELETE` (remove/archive). Never trigger state mutations via `GET`.

---

## 2. Standard JSON Envelopes (`MUST`)

### Success Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-11-18T15:00:00.000Z"
  }
}
```

Paginated responses include `meta.pagination`: `{ "page": 1, "limit": 20, "total": 100, "totalPages": 5 }`.

### Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error summary",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

---

## 3. HTTP Status Codes & Validation (`MUST`)

| Status                                         | Standard Usage                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `200 OK`                                       | Successful `GET`, `PATCH`/`PUT`, or action command                                       |
| `201 Created`                                  | Resource created (`POST`)                                                                |
| `204 No Content`                               | Deletion without response body                                                           |
| `400 Bad Request` / `422 Unprocessable Entity` | Malformed syntax or Zod schema validation failure                                        |
| `401 Unauthorized`                             | Missing, expired, or invalid authentication credential                                   |
| `403 Forbidden`                                | Authenticated user lacks required RBAC role or resource ownership                        |
| `404 Not Found`                                | Resource does not exist (also used when hiding unauthorized resources where appropriate) |
| `409 Conflict`                                 | Duplicate unique slug/SKU/email, insufficient stock, or invalid state transition         |
| `429 Too Many Requests`                        | Rate limit exceeded                                                                      |
| `500` / `503`                                  | Unexpected server error / downstream MySQL or dependency unavailable                     |

---

## 4. Querying, Idempotency & Security Controls (`MUST`)

1. **Pagination Bounds (`MUST`):** All list endpoints MUST enforce bounded pagination (`default limit = 20`, `max limit = 100`) and return deterministic default sort order (`createdAt DESC`).
2. **Allowlisted Filters & Sorting (`MUST`):** Validate `sort`, `order`, and filter params strictly via Zod allowlists; never forward raw client field names directly to Prisma `orderBy`.
3. **Idempotency (`MUST` for Checkout & Webhooks):** Checkout submission and payment gateway callbacks (VNPay IPN) MUST enforce idempotency keys / transaction reference deduplication to prevent duplicate orders or double stock deduction.
4. **Rate Limiting & Documentation (`MUST`):** Auth, public AI, and high-cost endpoints enforce Express rate limiting; every endpoint added in `apps/api` MUST update OpenAPI/Swagger specs served at `/api/docs`.
