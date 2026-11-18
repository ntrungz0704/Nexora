# TechPilot Migration & Legacy Isolation Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Governs how domain knowledge and curated assets from legacy `TechPilot/` may be referenced and rebuilt into `Nexora` (`MIGRATION_RULES`).

---

## 1. Source Protection & Isolation (`MUST` / `MUST NOT`)

1. **TechPilot Is Read-Only Archive (`MUST`):** [`TechPilot/`](../../TechPilot/) MUST remain untouched (never modified, pruned, or used as Nexora's Git remote).
2. **Audit Output Is Read-Only Reference (`MUST`):** [`audit-output/`](../../audit-output/) MUST remain intact outside Nexora's tracked Git index (excluded via `.gitignore`).
3. **Zero Legacy Contamination (`MUST NOT`):** NEVER copy from `TechPilot`:
   - `.git/` directory or any commit history
   - PHP MVC core (`app/core/`, controllers, views, `index.php`, `router.php`)
   - Legacy raw SQL dumps (`database/schema.sql`, `seed_dev.sql` containing PII) or broken migration history
   - Hardcoded secrets/credentials (`config/vnpay.php`, `User.php` backdoor, API keys)
   - Dead code (`RateLimiter.php`, `ProductKnowledgeService.php`, `NewsSeederService.php`, `category-menu.php`, `getSampleProducts()`, `scripts/*.php`)
   - Unreferenced binary bloat (`review/unlinked/`, oversized `banner-*.png`, orphan favicons, duplicate placeholders)

---

## 2. Selective Module Rebuild Workflow (`MUST`)

We adopt **`REBUILD SELECTED MODULES`** into TypeScript (NOT copy-paste PHP). Only validated business logic/rules from TechPilot may be ported when their corresponding Nexora phase begins:

1. **Inspect Source Logic:** Read exact TechPilot service/config behavior and verify edge cases against `audit-output/TECHPILOT_FUNCTIONAL_AUDIT.md`.
2. **Check Dependencies & Schema Assumptions:** Strip hardcoded database IDs (e.g., `PcBuilderController` IDs `3..14`, `user_id = 1`) and legacy schema mismatches.
3. **Eliminate Known Bugs & Security Holes:** Fix `Order.php:105` price averaging, `AdminCouponController` `00:00:00` dates, `ProfileController::submit_return` IDOR, `SpecScraperService` SSRF, and `AiProductAssistantService` `provider` key mismatch during rewrite.
4. **Rewrite Cleanly in TypeScript (`apps/api`, `packages/shared`, `apps/web`):** Apply Zod validation, Prisma transactions, and Express/React patterns.
5. **Write Vitest/Supertest Verification:** Ported rules (`PcCompatibilityService`, `ProductSpecNormalizer`, `ProductFacetService`, `ProductComparisonService`, `FlashSaleService`) MUST have unit/integration tests proving parity + bug fixes.
6. **Asset Licensing & Optimization (`MUST`):** When migrating brand SVGs (`TechPilot/public/assets/images/brands/`) in the future Catalog phase, verify `config/brand-logo-sources.php` provenance/SHA-256 and convert/optimize images cleanly (`WebP`/`SVG`).

---

## 3. Migration Verification & Rollback (`MUST`)

- **Verification:** Check `git status` and `.gitignore` before any commit so legacy paths never enter tracking; run `eslint`, `tsc`, and Vitest suites after each ported service.
- **Rollback:** Because legacy `TechPilot/` stays untouched and Nexora ports incrementally per module PR, faulty ports revert cleanly via `git revert` on `main` without endangering original reference files.
