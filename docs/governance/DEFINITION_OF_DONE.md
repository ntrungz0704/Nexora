# Definition of Done (DoD) — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Mandatory verification criteria required before any task, Pull Request, or phase milestone in Nexora may be marked complete.

---

## 1. Acceptance Status Classifications (`MUST` Use Explicitly)

| Status        | Meaning & Usage Rule                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`PASS`**    | Every required check ran after the final edit, executed cleanly with observed zero errors, and all functional/doc criteria are satisfied on disk.                              |
| **`PARTIAL`** | Core implementation exists on disk, but one or more optional checks, downstream environments, or edge criteria could not complete cleanly (must list exact gaps).              |
| **`BLOCKED`** | Cannot finish due to external missing access, credentials, running daemon/service, or unresolved decision requiring user input (must state exact blocker and unblocking step). |
| **`FAIL`**    | Executed check produced actual errors, broken tests, invalid config, or violated locked project rules.                                                                         |

Never declare `PASS` based on memory, code reading alone, or assumptions.

---

## 2. Standard Task & Pull Request DoD Checklist (`MUST`)

A development task or Pull Request is **DONE** only when **ALL** applicable criteria below achieve `PASS`:

1. **Scope Compliance:** Changes strictly adhere to [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md) (Single-Vendor store, no unrequested business modules or stack drift).
2. **Real Working Implementation:** Code is complete on disk without hardcoded mock returns, fake fallback prices, or stub endpoints pretending to work.
3. **Zero Regressions:** Existing capabilities, health endpoints, and related workspace builds continue functioning cleanly.
4. **Type Safety (`tsc --noEmit`):** `npm run typecheck` exits `0` across all workspaces (`apps/web`, `apps/api`, `packages/*`).
5. **Lint & Formatting:** `npm run lint` (`ESLint`) and `npm run format:check` (`Prettier`) pass with `0` errors.
6. **Automated Tests:** Required Vitest unit tests, Supertest API/DB integration tests, and Playwright E2E specs (when applicable) run and pass cleanly (`0` skipped broken assertions).
7. **Production Build Verified:** `npm run build` compiles cleanly for affected packages (`web`, `api`, `shared`).
8. **Database & Migration Integrity (if schema touched):** Valid Prisma schema, append-only Prisma migration replayed on clean MySQL 8.4 DB, accurate `DECIMAL` monetary types, no negative stock risk.
9. **Security & Secret Hygiene Reviewed:** Backend auth/RBAC/ownership enforced, Zod input validation active, zero committed `.env`, API keys, tokens, or personal PII.
10. **Documentation Synchronized:** Updated relevant files in `docs/` (`ERD.md`, `DATA_DICTIONARY.md`, `API_CONVENTIONS.md`, `ADR/`, `CHANGELOG.md`) matching actual implemented behavior.
11. **Verifiable Evidence Provided:** Report lists executed commands, outputs/counts, created/edited paths, and explicit `PASS`/`PARTIAL`/`BLOCKED`/`FAIL` status.
