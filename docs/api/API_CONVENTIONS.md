# API Conventions — Nexora

- **Status:** `Approved` (Foundation Baseline)
- **Last Updated:** `2026-11-18`
- **Scope:** Live foundation endpoints and REST contract conventions under `apps/api` (`/api/v1/*` and `/api/docs`). _(Full reference aligns with [`docs/standards/API_DESIGN_RULES.md`](../standards/API_DESIGN_RULES.md).)_

---

## 1. Global URL & Documentation Conventions

- **REST Prefix:** `/api/v1`
- **OpenAPI / Swagger UI:** `/api/docs` (plus JSON spec at `/api/docs.json`)
- **Envelope Contract:**
  - Success: `{ "success": true, "data": <payload>, "meta": { "timestamp": "<ISO8601>" } }`
  - Error: `{ "success": false, "error": { "code": "<ERROR_CODE>", "message": "<summary>", "details": [...] } }`

---

## 2. Implemented Foundation Endpoints (Phase 1)

| Method & Path                    | Access                 | Response Schema                                                                                             | Purpose                                                                                   |
| -------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET /api/v1/health`             | Public                 | `{ status: 'ok' \| 'degraded', service: 'nexora-api', database: 'up' \| 'down', uptimeSeconds, timestamp }` | Liveness + live MySQL/Prisma connectivity check (`200` healthy, `503` DB down)            |
| `GET /api/v1/system/meta`        | Public                 | `{ name: 'Nexora', businessModel: 'single-vendor', roles: [...], storeSettingsCount, usersCount }`          | Verifies DB read queries against foundation tables (`store_settings`, `users`)            |
| `POST /api/v1/system/echo-check` | Public (Zod Validated) | `{ valid: true, message, receivedAt }`                                                                      | Demonstrates Zod request schema validation & standardized `422` validation error envelope |

_(Note: All future business module endpoints—Auth, Catalog, Cart, Orders, Payments, Purchasing, Inventory, RMA, SellerMargin—remain **`DRAFT / NOT YET IMPLEMENTED`** and will be added incrementally per phase along with OpenAPI JSDoc annotations.)_
