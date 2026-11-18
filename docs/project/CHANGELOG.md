# Changelog — Nexora

All notable milestones, architectural baselines, and releases in **Nexora** are recorded here chronologically.

## [0.1.0-foundation] — 2026-11-18

### Added

- Completed Phase-0 read-only technical audit synthesis (`docs/governance/AUDIT_DOCUMENT_REVIEW.md`) keeping legacy `TechPilot/` & `audit-output/` untouched.
- Established complete Nexora Governance (`AGENTS.md`, `GEMINI.md`, `PROJECT_CHARTER.md`, `PROJECT_SCOPE.md`, `ENGINEERING_PRINCIPLES.md`, `AI_AGENT_WORKING_RULES.md`, `DEFINITION_OF_DONE.md`, `DECISION_LOG.md`) and 10 Engineering Standards under `docs/standards/`.
- Established Single-Vendor architecture (`Modular Monolith`), Database/ERD/Data Dictionary foundations (`MySQL 8.4 + Prisma`), API conventions, and GitHub governance templates (`.github/`).
- Initialized npm Workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`, `packages/config`, `prisma/`), Docker Compose (`mysql:8.4` + dev setup), Vitest/Supertest/Playwright baseline, and Private GitHub repo `Nexora` with 6 team branches.
