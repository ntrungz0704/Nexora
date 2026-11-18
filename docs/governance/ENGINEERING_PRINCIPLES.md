# Engineering Principles — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Mandatory design and implementation principles governing all Nexora backend, frontend, database, and DevOps work.

---

## 1. Separation of Concerns (`MUST`)

- **Rule:** Presentation (`apps/web`), HTTP transport (`controllers`/`routes`), business rules (`services`/`use-cases`), and persistence (`repositories`/`prisma`) MUST occupy separate layers.
- **Concrete Example:** React components never execute SQL or calculate coupon caps authoritatively; Express route handlers never embed complex multi-table `prisma.$transaction()` logic inline.

## 2. Single Responsibility (`MUST`)

- **Rule:** Each file, module, service, and React hook MUST own one clear business responsibility. God files exceeding ~400–500 lines (such as TechPilot's 1,953-line `Product.php` or 2,374-line `footer.php`) MUST be decomposed before review approval.

## 3. Explicit Modularity & Dependency Boundaries (`MUST`)

- **Rule:** Modules inside `apps/api/src/modules/` interact strictly through exported service contracts/interfaces and shared DTOs (`@nexora/shared`), NEVER by reaching into another module's internal Prisma queries to mutate foreign-owned tables directly.
- **Direction:** `Apps -> Modules -> Shared Packages`; reverse dependencies (`packages/*` importing from `apps/*`) and circular imports between modules are **MUST NOT**.

## 4. Reusability Without Premature Abstraction (`SHOULD` / Avoid Overengineering)

- **Rule:** Extract shared helpers (`packages/shared`, reusable UI primitives) once a pattern repeats across 2+ real consumers or crosses the API boundary (Zod request/response contracts). **MUST NOT** build speculative generic frameworks, unused DI containers, or empty boilerplate directories for modules not yet in active development.

## 5. Maintainability & Explicit Failure (`MUST`)

- **Rule:** Replace silent fallbacks and fake defaults with structured typed errors and explicit HTTP status codes (`400/422` validation, `401/403` auth, `409` stock conflict, `503` service unavailable). Masking DB failures with demo items or magic values (e.g., TechPilot's `100000` fallback price) is strictly forbidden.

## 6. Security by Design (`MUST`)

- **Rule:** Authentication, RBAC role guards, resource ownership checks, Zod validation, CSRF/XSS defenses, and secret isolation are mandatory structural requirements in the backend core—never afterthoughts or frontend-only button hiding.

## 7. Data & Financial Integrity First (`MUST`)

- **Rule:** Money uses fixed-point MySQL `DECIMAL`; stock & cost movements execute inside ACID transactions with row-level concurrency protection preventing negative balances; historical orders immutably snapshot selling price, allocated discounts, and COGS at transaction time.

## 8. Testability (`MUST`)

- **Rule:** Pure domain calculations (compatibility, promotions, FIFO/WAC COGS, margin formulas) MUST be decoupled from HTTP I/O so they execute deterministically in fast Vitest unit suites, paired with real MySQL/Prisma + Supertest integration tests for persistence and concurrency guarantees.
