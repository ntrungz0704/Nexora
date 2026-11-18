# Testing Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Testing strategy, tools, and verification standards for `apps/api`, `apps/web`, `packages/*`, and `tests/`.

---

## 1. Approved Testing Stack (`MUST`)

- **Static Checks:** TypeScript (`tsc --noEmit`), ESLint (`eslint`), Prettier (`prettier --check`)
- **Unit Tests:** **Vitest** (`packages/*`, frontend components/hooks, backend pure domain services)
- **Backend & DB Integration Tests:** **Vitest + Supertest** executing against an isolated **MySQL test database** via Prisma
- **End-to-End (E2E) Browser Tests:** **Playwright** against running frontend + API + MySQL stack

_(Policy Note: Specific percentage coverage thresholds are intentionally NOT invented in Phase 0–1 until test baselines exist across active business modules; future PRs may introduce module coverage targets via an approved ADR.)_

---

## 2. Test Organization & Naming (`MUST`)

- Place unit/component/API integration tests near workspaces or under workspace `tests/` folders using `.test.ts` / `.test.tsx` (Vitest) and E2E browser specs under root `tests/e2e/*.spec.ts` (Playwright).
- Name test descriptions clearly around observable behavior and guarantees (e.g., `returns 409 when order quantity exceeds available SKU stock`).

---

## 3. Mocking vs Real Database Policy (`MUST` / `MUST NOT`)

1. **Unit Tests (`MAY` Mock I/O):** Pure logic (Zod schemas, compatibility formulas, pricing/coupon math, SellerMargin allocation rules) MUST be tested fast without network or DB using deterministic inputs.
2. **Critical Business Integration Tests (`MUST NOT` Mock Away Persistence):** Checkout concurrency, inventory reservation/deduction, MySQL transactions/rollback, Prisma constraint checks, payment IPN idempotency, and RBAC guards **MUST** be tested against real MySQL + Prisma (`Supertest`), because mocking Prisma hides SQL constraint errors and race conditions.
3. **Database Isolation (`MUST`):** Never execute tests against development or shared databases containing user data; reset/truncate or rollback per test suite cleanly against an isolated test DB (`nexora_test`).
4. **Deterministic Synthetic Fixtures (`MUST`):** Build helper factories producing fake users, SKUs, and orders without real PII.

---

## 4. Forbidden Testing Practices (`MUST NOT`)

1. **No Duplicated Logic Testing:** Never copy implementation functions into test files like TechPilot's `EnvParserEdgeCaseTest.php`—always import and execute the real production module!
2. **No Check-Theatre / Silent Pass Bugs:** Tests MUST fail loudly with non-zero exit codes whenever assertions fail (unlike TechPilot `verify-install.php:809` calling `vPass` in failure branches).
3. **No False Reporting:** Never declare `PASS` unless tests actually executed cleanly after the latest edits. Always distinguish `PASS` / `PARTIAL` / `BLOCKED` / `FAIL`.

---

## 5. Mandatory Regression Matrix for Future Business Phases

As modules are built in upcoming phases, integration & E2E coverage MUST cover all 16 critical flows: Register/Login, RBAC enforcement, Product CRUD, Product Variants, SKU uniqueness, Cart sync, Checkout, Concurrent stock contention, Payment IPN idempotency, Order lifecycle states, Reorder price/stock revalidation, Purchase Orders, Goods Receipts, COGS layer deduction, SellerMargin formulas, and Returns/Refund reversals.
