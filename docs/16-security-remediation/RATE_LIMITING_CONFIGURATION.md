# Objective D — API Rate Limiting & Safe Proxy Trust Configuration

## 1. Architectural Overview & Root Cause

- **Vulnerability History:** `express-rate-limit@^8.7.4` was listed in `apps/api/package.json` but was never imported or mounted in the Express application pipeline. Furthermore, `payment.controller.ts:17` directly read untrusted raw `req.headers['x-forwarded-for']` instead of Express's `trust proxy`-validated client IP address.
- **Architectural Scope:** Nexora is deployed as a single-node Modular Monolith application. The rate limiter utilizes `express-rate-limit`'s built-in in-memory `MemoryStore`, which provides zero-latency throttling with zero external database dependencies.
- **Scalability Guardrail:** For horizontal multi-instance deployments (multiple API server replicas behind a load balancer), switching the store to a shared Redis cluster (`rate-limit-redis`) will be required to maintain unified global counters across instances.

---

## 2. Configured Rate Limit Tiers (`apps/api/src/middleware/rateLimit.ts`)

All tiers are configured with a **15-minute window** (`15 * 60 * 1000` ms). The limiters emit `draft-7` compliant `RateLimit`, `RateLimit-Policy`, and `Retry-After` headers and return Nexora's standardized HTTP `429` JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "<Vietnamese guidance message>"
  }
}
```

### Exact Rate Limit Policy Table

| Tier Name              | Endpoints Protected                                            |   Window    |    Limit / IP    | Operational Rationale                                                                                |
| :--------------------- | :------------------------------------------------------------- | :---------: | :--------------: | :--------------------------------------------------------------------------------------------------- |
| `passwordResetRequest` | `POST /api/v1/auth/forgot-password`                            | **15 phút** |  **5 requests**  | Strictest tier to prevent email flooding, user harassment, and SMTP provider quota exhaustion        |
| `passwordResetConfirm` | `POST /api/v1/auth/reset-password`                             | **15 phút** | **10 requests**  | Defends against brute-force password reset token guessing while allowing legitimate typo corrections |
| `authLoginRegister`    | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`        | **15 phút** | **10 requests**  | Mitigates credential stuffing, password spray, and mass bot account generation                       |
| `orderLookup`          | `GET /api/v1/orders/track`, `GET /api/v1/orders/detail/:code`  | **15 phút** | **20 requests**  | Prevents automated order-code and phone enumeration scanners                                         |
| `commerceWrite`        | `POST /api/v1/orders`, `POST /api/v1/payment/vnpay/create-url` | **15 phút** | **30 requests**  | Guards atomic MySQL inventory reservation and VNPay URL generation against transaction flooding      |
| `ai`                   | `POST /api/v1/ai/*` (Chatbot, PC Builder Assistant, Scoring)   | **15 phút** | **30 requests**  | Protects Gemini AI API token quotas and database scoring overhead                                    |
| `globalApi`            | `/api/v1/*` (Global baseline fallback middleware)              | **15 phút** | **300 requests** | Supports normal storefront catalog exploration, search filtering, and SPA data prefetching           |

---

## 3. Safe Reverse Proxy Configuration (`apps/api/src/config/env.ts` & `app.ts`)

- **Environment Variable:** `TRUST_PROXY` (default: `'false'`).
- **Validation Strictness:** `parseTrustProxy()` explicitly rejects arbitrary boolean `'true'`. It only permits `'false'` / `'0'`, well-known CIDRs (`'loopback'`, `'linklocal'`, `'uniquelocal'`), or a bounded integer hop count between `1` and `5`.
- **Production Standard:** When running in containerized production behind a single Nginx reverse proxy, set `TRUST_PROXY=1`. In standalone development or direct test execution, `TRUST_PROXY=false` ensures that spoofed `X-Forwarded-For` request headers are safely discarded and throttling tracks the true client socket address.
- **Client IP Resolution:** Replaced raw `req.headers['x-forwarded-for']` in `payment.controller.ts:17` with `req.ip || req.socket.remoteAddress || '127.0.0.1'`.

---

## 4. Automated Test Evidence (`apps/api/tests/phase_a_security_remediation.test.ts`)

| Test ID   | Scenario                                                                                                   | Expected Result                                                                  | Actual Result |
| :-------- | :--------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :-----------: |
| `RATE-D1` | Auth login exceeds threshold                                                                               | Returns HTTP `429 RATE_LIMIT_EXCEEDED` JSON envelope & `ratelimit-policy` header |   **PASS**    |
| `RATE-D2` | Password reset request exceeds production default (`5 req / 15 min`)                                       | Returns HTTP `429 RATE_LIMIT_EXCEEDED` on 6th request                            |   **PASS**    |
| `RATE-D3` | AI chatbot endpoint exceeds configured threshold                                                           | Returns HTTP `429 RATE_LIMIT_EXCEEDED`                                           |   **PASS**    |
| `RATE-D4` | Order lookup endpoint exceeds configured threshold                                                         | Returns HTTP `429 RATE_LIMIT_EXCEEDED`                                           |   **PASS**    |
| `RATE-D5` | Client attempts to bypass rate limiting using rotating `X-Forwarded-For` headers under `TRUST_PROXY=false` | Headers safely ignored; throttled strictly by client socket IP                   |   **PASS**    |

---

## 5. Architectural & Deployment Guardrails

- **Single-Node Monolith Suitability:** In-memory tracking introduces 0 ms overhead and requires no additional operational infrastructure for Nexora's MVP and initial single-node deployments.
- **Distributed Scaling Roadmap:** When horizontal clustering across multiple Docker containers or Kubernetes pods is introduced in future phases, Redis-backed shared store integration will be required to aggregate request counts globally across instances.
