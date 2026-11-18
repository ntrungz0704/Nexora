# AI Agent Working Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Mandatory operational protocol for all AI coding assistants operating on the Nexora repository.

---

## 1. Mandatory 11-Step Execution Protocol (`MUST`)

Every AI Agent executing any coding, configuration, database, or refactoring task in Nexora **MUST** follow these steps sequentially:

1. **Read Root Instructions:** Read [`AGENTS.md`](../../AGENTS.md) first (and [`GEMINI.md`](../../GEMINI.md) if applicable).
2. **Read Specialized Standards:** Read only the relevant rulebook(s) in [`docs/standards/`](../standards/) and design docs in [`docs/architecture/`](../architecture/) / [`docs/database/`](../database/) matching the task domain.
3. **Inspect Live Source State:** Inspect current files, directory contents, Prisma schema, and `git status` before designing changes. Never assume earlier docs match code without verification.
4. **Define Exact Objective & Scope:** Confirm the task stays strictly within [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md) (Single-Vendor store, current phase).
5. **Map Affected Files & Contracts:** Identify every impacted workspace (`apps/web`, `apps/api`, `packages/shared`, `packages/config`, `prisma/`).
6. **Identify Critical Risks Before Editing:** Highlight data-loss, concurrency, RBAC, migration, or breaking API changes prior to touching code.
7. **Implement Real, Complete Changes:** Write production-quality code matching ESLint/TypeScript rules; avoid stub modules or fake UI placeholders.
8. **Run Appropriate Verification Commands:** Execute real `typecheck`, `lint`, `test`, `build`, and/or `db:generate`/`db:migrate` checks applicable to affected packages.
9. **Fix All Self-Induced Regressions:** Never leave broken builds, lint warnings/errors, or failing tests caused by your changes.
10. **Synchronize Documentation:** Update `ERD.md`, `DATA_DICTIONARY.md`, `API_CONVENTIONS.md`, `MODULE_BOUNDARIES.md`, `ADR/`, or `CHANGELOG.md` whenever contracts change.
11. **Report With Verifiable Evidence:** Summarize file changes, executed commands, observed exit statuses, and explicit `PASS`/`PARTIAL`/`BLOCKED`/`FAIL` verdicts.

---

## 2. Hard Prohibitions (`MUST NOT`)

An AI Agent **MUST NOT**:

1. **Plan & Stop Early:** Never stop at a proposal or TODO list when the user explicitly authorized execution.
2. **Create Empty Skeletons:** Never generate dozens of empty/placeholder files or controllers just to look thorough.
3. **Mutate Tech Stack Silently:** Never introduce PHP, Laravel, NestJS, Next.js, Angular, PostgreSQL, MongoDB, or microservices without an approved ADR.
4. **Expand Business Scope Unilaterally:** Never convert Nexora into a Marketplace or add unrequested modules outside the authorized phase.
5. **Delete Files Blindly:** Never delete existing files/assets without checking all static/dynamic imports, configs, and scripts first; **never** modify or delete [`TechPilot/`](../../TechPilot/) or [`audit-output/`](../../audit-output/).
6. **Fabricate Verification Evidence:** Never claim `PASS` on typecheck, tests, migrations, Docker, or GitHub actions without executing them and observing passing output.
7. **Fabricate GitHub State or Hashes:** Never invent commit SHAs, branch status, PR links, or usernames in `CODEOWNERS`.

---

## 3. Out-of-Scope Bug Discovery Protocol (`SHOULD`)

If an Agent discovers a security vulnerability, data flaw, or broken behavior outside the current task's scope:

1. **Log it:** Document the exact `file:line`, reproduction/evidence, and severity assessment.
2. **Do Not Scope-Creep:** Do **NOT** silently rewrite unrelated modules unless blocking or dangerous (e.g., immediate secret leak).
3. **Propose Follow-up:** Recommend a targeted follow-up task or issue entry using `.github/ISSUE_TEMPLATE/bug_report.md`.
