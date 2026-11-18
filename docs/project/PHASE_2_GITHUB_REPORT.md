# Phase 2 — GitHub Repository Foundation Specification

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Documents clean Git initialization and GitHub Private repository configuration executed at the conclusion of Nexora Foundation setup.

---

## 1. Repository & Branch Specification

- **GitHub Repository:** `https://github.com/ntrungz0704/Nexora` (`Private`)
- **Default Branch:** `main`
- **Git Strategy:** Brand-new orphan history initialized inside `D:\Nexora\` (zero `.git` history, zero credentials, and zero PII carried over from `TechPilot/`). Both `TechPilot/` and `audit-output/` remain untracked and excluded via `.gitignore`.
- **Official 6 Branches (Branched Identically From Initial Commit):**
  1. `main` — Protected integration branch
  2. `trung` — Trung
  3. `hieu` — Hiếu
  4. `kim` — Kim
  5. `dinh` — Đinh
  6. `phuc` — Phúc

_(Exact initial commit SHA and live `gh repo view` / branch push verification outputs are reported in the Phase 0–2 completion summary immediately after pushing.)_
