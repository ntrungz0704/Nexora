# Documentation Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Standards for repository documentation, ADRs, API/DB specs, changelogs, and code comments across Nexora.

---

## 1. Document Metadata & Quality Standard (`MUST`)

Every Markdown specification in `docs/` and root MUST declare:

- **Status** (`Approved`, `Proposed`, `Draft`, or `Deprecated`)
- **Last Updated** (`YYYY-MM-DD`)
- **Scope** (exact target directories, layers, or phases)
- Actionable rules tagged explicitly with **`MUST`**, **`MUST NOT`**, **`SHOULD`**, or **`MAY`** (avoid vague slogans like "write clean code" without verifiable criteria).

---

## 2. Truthfulness & Sync Guarantee (`MUST` / `MUST NOT`)

1. **No Documentation Fiction (`MUST NOT`):** Do NOT copy legacy `TechPilot/docs/` tables/endpoints or invent future database entities, ERDs, or Swagger routes as if implemented (`TechPilot` had major drift in `LUONG_HOAT_DONG_HE_THONG.md` & `techpilot-system-design.md`). Mark unapproved future structures explicitly as **`DRAFT / NOT YET DESIGNED`**.
2. **Code-Doc Synchronization (`MUST`):** Any PR changing Prisma schema (`prisma/schema.prisma`), API routes, module boundaries, or setup steps MUST update the matching doc (`ERD.md`, `DATA_DICTIONARY.md`, `API_CONVENTIONS.md`, `MODULE_BOUNDARIES.md`, `README.md`, `CHANGELOG.md`) in the **same Pull Request**.
3. **Single Source of Truth (`SHOULD`):** Avoid copy-pasting entire standards between `AGENTS.md`, `README.md`, and `docs/standards/*` — link cleanly to the canonical file.

---

## 3. Managed Documentation Catalog

| Artifact                                                            | Purpose & Update Trigger                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `README.md`                                                         | Developer quickstart, Docker commands, workspace scripts; update when setup changes |
| `AGENTS.md` / `GEMINI.md`                                           | AI execution routing & hard boundaries; update when governance/stack changes        |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` & `MODULE_BOUNDARIES.md` | Monorepo topology & domain ownership; update when modules are added                 |
| `docs/architecture/ADR/*`                                           | Decision rationale for structural/stack/DB choices (`ADR/README.md` format)         |
| `docs/database/ERD.md` & `DATA_DICTIONARY.md`                       | Exact Prisma/MySQL entity relationships & columns; update with every migration      |
| `docs/api/API_CONVENTIONS.md` & Swagger `/api/docs`                 | API envelope & route contracts; update with every new route                         |
| `docs/project/ROADMAP.md` & `CHANGELOG.md`                          | Phase milestones & observable changes                                               |

---

## 4. Inline Code Comments Policy (`MUST` / `SHOULD`)

- **Explain WHY, Not WHAT (`SHOULD`):** Comment non-obvious accounting invariants, concurrency lock order, or security rationale (e.g., why coupon remainder adjusts the last line).
- **No Obvious Noise (`MUST NOT`):** Avoid redundant comments restating variable names or obvious syntax (`// increment counter by 1`). Keep existing accurate comments intact during localized fixes.
