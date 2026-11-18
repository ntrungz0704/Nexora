# Security Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Mandatory application, infrastructure, and data protection standards informed by P0/P1 findings in TechPilot.

---

## 1. Authentication & Credential Hygiene (`MUST` / `MUST NOT`)

1. **Password Hashing (`MUST`):** Hash passwords solely via **Argon2id** (`argon2`) or **bcrypt** (`cost >= 12`). **MUST NOT** store plaintext passwords or implement backdoor/equivalence checks (cf. TechPilot `User.php:108-110`).
2. **Secrets Management (`MUST NOT` Commit Secrets):** API keys, JWT/session `AUTH_SECRET`, `DATABASE_URL` passwords, and VNPay secrets MUST load from environment variables only. Never include working sandbox credentials as code fallbacks (cf. TechPilot `config/vnpay.php:39-40`).
3. **Token & Cookie Security (`MUST`):**
   - Hash persistent reset/remember tokens with SHA-256 / HMAC before persisting in DB and compare using constant-time equality (`crypto.timingSafeEqual`).
   - Session/auth cookies MUST set `httpOnly: true`, `sameSite: 'lax'` (or `'strict'`), and `secure: true` whenever running behind HTTPS/production.
4. **Brute-Force Protection (`MUST`):** Login, registration, password reset, and AI endpoints MUST enforce rate limiting (`express-rate-limit`).

---

## 2. Authorization & RBAC (`MUST`)

- **Backend Enforcement Always (`MUST`):** Every protected endpoint MUST pass server-side `requireAuth` + `requireRole([...])` middleware. Hiding links/buttons in React is UX only and NEVER constitutes authorization.
- **Role Hierarchy (Single-Vendor Store):**
  - `Customer`: Access strictly own profile, addresses, cart, orders, returns, reviews.
  - `Seller`: Internal store operations within explicit operational permissions; **MUST NOT** access Admin user/RBAC escalation, system config, or audit log deletion.
  - `Admin`: Full store & system governance (never hardcode single admin ID like `user.id === 1`).
- **IDOR & Bounds Defense (`MUST`):** Every resource lookup (`orders/:id`, `addresses/:id`, `return-requests`) MUST scope by owner (`WHERE id = ? AND userId = currentUser.id`) for customers and verify item ownership + remaining quantity limits (preventing TechPilot `ProfileController::submit_return` unbounded qty bug).

---

## 3. Input, Injection, SSRF & Transport Protections (`MUST`)

1. **Input Validation (`MUST`):** Validate `body`, `params`, and `query` via Zod middleware (`strict` schema stripping unknown properties).
2. **SQL Injection (`MUST`):** Use Prisma Client parameterized queries exclusively. Avoid `$queryRawUnsafe` / string concatenation.
3. **XSS Prevention (`MUST`):** React JSX auto-escapes rendered values; never assign untrusted data via `dangerouslySetInnerHTML`, never store HTML inside error/exception messages, and sanitize rich text/AI outputs before rendering.
4. **HTTP Headers & CORS (`MUST`):** Configure `helmet` security headers cleanly and enforce strict `cors({ origin: ALLOWED_ORIGINS, credentials: true })` allowlist from env config (never wildcard `*` with credentials).
5. **CSRF Protection (`MUST` when cookie-auth is active):** Validate CSRF tokens or double-submit cookies + `Origin`/`Referer` checks on state-changing browser routes when using session cookies (excluding cryptographically signed external gateway webhooks like VNPay IPN).
6. **SSRF Prevention (`MUST`):** Never fetch user/admin-supplied arbitrary URLs cleanly without `https:` scheme lock, DNS resolution rejecting loopback/RFC1918/link-local (`169.254.169.254`) ranges, disabled blind redirects, and domain allowlists.
7. **File Upload Hardening (`MUST`):** Verify magic-byte MIME type (not just file extension), enforce strict file size caps, generate random UUID filenames, and store outside executable source directories.
8. **Payment Webhooks (`MUST`):** Verify HMAC-SHA512 signatures on VNPay return/IPN callbacks via `crypto.timingSafeEqual`, verify amount matches DB `order.grandTotal`, and guarantee idempotent processing inside DB transaction.

---

## 4. Auditability, PII & Dependencies (`MUST`)

- **PII & Logs (`MUST NOT`):** Never commit real customer PII in `prisma/seed.ts` or test fixtures; never log passwords, tokens, or payment secrets; keep `AuditLog` append-only for sensitive admin/seller actions.
- **TLS (`MUST NOT` Downgrade):** Never disable database or outbound TLS certificate verification in production configs.
- **Dependency Hygiene (`SHOULD`):** Run `npm audit` periodically and avoid deprecated/unmaintained packages.
