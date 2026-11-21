# Objective D — API Rate Limiting & Safe Proxy Trust Configuration

## 1. Root Cause

- `express-rate-limit@^8.7.4` was listed in `apps/api/package.json` but never imported or mounted in `apps/api/src/`.
- `apps/api/src/modules/payment/payment.controller.ts:17` trusted arbitrary `req.headers['x-forwarded-for']` directly instead of Express's `trust proxy`-validated `req.ip`.

## 2. Configured Rate Limit Tiers (`apps/api/src/middleware/rateLimit.ts`)

All limiters emit `draft-7` `RateLimit` / `RateLimit-Policy` headers and return Nexora's standardized HTTP `429` JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "<Vietnamese guidance message>"
  }
}
```

| Tier                   | Endpoints Protected                                            | Window | Limit / IP | Rationale                                                                                |
| ---------------------- | -------------------------------------------------------------- | -----: | ---------: | ---------------------------------------------------------------------------------------- |
| `passwordResetRequest` | `POST /api/v1/auth/forgot-password`                            | 15 min |      **5** | Strictest limit to prevent email bombing & SMTP quota exhaustion                         |
| `passwordResetConfirm` | `POST /api/v1/auth/reset-password`                             | 15 min |     **10** | Blocks token brute-force attempts while permitting typo retries                          |
| `authLoginRegister`    | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`        | 15 min |     **10** | Stops credential stuffing & bulk fake account creation without disrupting normal users   |
| `orderLookup`          | `GET /api/v1/orders/track`, `GET /api/v1/orders/detail/:code`  | 15 min |     **20** | Prevents automated order-code/phone guessing                                             |
| `commerceWrite`        | `POST /api/v1/orders`, `POST /api/v1/payment/vnpay/create-url` | 15 min |     **30** | Protects inventory lock & VNPay URL generation from automated abuse                      |
| `ai`                   | `POST /api/v1/ai/*` (4 AI engines)                             | 15 min |     **30** | Protects Gemini API quota & DB scoring load while allowing natural customer Q&A          |
| `globalApi`            | `/api/v1/*` (baseline catch-all)                               | 15 min |    **300** | Allows normal catalog browsing, filtering, and SPA polling while capping runaway clients |

## 3. Safe Reverse Proxy Configuration (`apps/api/src/config/env.ts` & `app.ts`)

- Added `TRUST_PROXY` env var (default: `'false'`).
- `parseTrustProxy()` only accepts `'false'`/`'0'`, `'loopback'`/`'linklocal'`/`'uniquelocal'`, or a bounded integer hop count `1..5` (rejects unsafe `'true'` that trusts arbitrary proxy chains).
- When running behind a single Nginx reverse proxy in Docker/production, set `TRUST_PROXY=1`.
- Replaced raw `req.headers['x-forwarded-for']` in `payment.controller.ts:17` with `req.ip || req.socket.remoteAddress || '127.0.0.1'`.

## 4. Automated Test Evidence (`apps/api/tests/phase_a_security_remediation.test.ts`)

- `RATE-D1`: Auth login returns HTTP `429 RATE_LIMIT_EXCEEDED` + `ratelimit-policy` header once threshold is exceeded — **PASS**.
- `RATE-D2`: Password reset request enforces real production default (`5 req / 15m`) and rejects 6th request with `429` — **PASS**.
- `RATE-D3`: AI chatbot endpoint returns `429` after threshold — **PASS**.
- `RATE-D4`: Order tracking endpoint returns `429` after threshold — **PASS**.
- `RATE-D5`: Rotating spoofed `X-Forwarded-For` headers (`1.1.1.1`, `2.2.2.2`, `3.3.3.3`) does NOT bypass rate limiting under `TRUST_PROXY=false` — **PASS**.

## 5. Remaining Limitations

- Current store uses `express-rate-limit`'s default in-memory `MemoryStore`, which is ideal for Nexora's single-node Modular Monolith deployment. If horizontally scaled to multiple API replicas in the future, switch to a shared Redis store.
