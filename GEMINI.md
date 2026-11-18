# GEMINI.md — Gemini / Antigravity Agent Operating Guide

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Supplemental execution guidance for Gemini / Antigravity agents operating inside Nexora. Note: Automatic loading of `GEMINI.md` depends on host IDE/agent support; **`AGENTS.md` remains the universal primary instruction file**.

---

## 1. Session Initialization Protocol

1. **Read `AGENTS.md` first** to establish Nexora's Single-Vendor identity, locked TypeScript/Express/React/MySQL/Prisma stack, and forbidden actions.
2. **Read [`docs/governance/AI_AGENT_WORKING_RULES.md`](docs/governance/AI_AGENT_WORKING_RULES.md)** for the 11-step execution discipline.
3. **Read only task-relevant docs** in `docs/standards/`, `docs/architecture/`, and `docs/database/` instead of loading unrelated specs into context.
4. **Check `git status` and workspace root:** Keep [`TechPilot/`](TechPilot/) and [`audit-output/`](audit-output/) strictly read-only and excluded from Git operations.

---

## 2. Task Execution Workflow

1. **Understand Intent & Phase Boundary:** Verify whether the prompt authorizes governance/foundation only or feature implementation (`docs/governance/PROJECT_SCOPE.md`). Refuse or ask clarification if an instruction violates locked stack/business model without explicit override.
2. **Inspect Existing Code Before Editing:** Locate symbol definitions, Prisma schema contracts, shared Zod types (`packages/shared`), and dependencies first.
3. **Plan Affected Files & Risks Explicitly:** State schema, migration, API, security, and cross-module coupling risks before modifying code.
4. **Implement Cleanly Within Module Boundaries:** Put business rules in `apps/api/src/modules/*/service`, persistence in repositories/Prisma, validation in Zod schemas, and UI state in React features (`apps/web/src/features/*`).
5. **Verify Empirically:** Run targeted `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and Prisma/Docker checks where relevant. Never claim `PASS` from code inspection alone.
6. **Git Commit Language Rule:** All commit messages MUST be in **tiếng Việt không dấu** (e.g. `feat(auth): khoi tao dang nhap`, `fix(db): sua migration role staff`).
7. **Sync Documentation:** Update `docs/architecture/`, `docs/database/`, `docs/api/`, or `CHANGELOG.md` whenever routes, schema, or architecture contracts change.

---

## 3. Handling Blockers & Uncertainty

- If Docker daemon, MySQL server, GitHub CLI auth, or required secrets are unavailable/missing:
  1. **MUST NOT** mock or fabricate passing verification outputs.
  2. Mark the exact acceptance criteria `BLOCKED` or `PARTIAL`.
  3. Report the exact failed command, error output, and minimal user action required to unblock.
- If `docs/database/ERD.md` or `DATA_DICTIONARY.md` shows a module as `DRAFT / NOT YET DESIGNED`, design and record the ADR/schema approval before writing production business tables.

---

## 4. Reporting Checklist

Every final summary from Gemini/Antigravity MUST include:

- Exact modified/created file paths.
- Executed verification commands and observed pass/fail counts.
- Explicit status (`PASS` / `PARTIAL` / `BLOCKED` / `FAIL`) for each acceptance criterion.
- Open risks or decisions requiring team approval.
