# Git Workflow & Team Branch Governance — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Authoritative Git branching, commits, Pull Requests, reviews, and repository safety rules for Nexora.

---

## 1. Repository & Official Branch Topology (`MUST`)

- **GitHub Repository:** `Nexora` (`Private`)
- **Default Branch:** `main` (Protected integration branch)
- **Official Branches (Exactly 6 Initial Branches):**

| Branch  | Owner                 | Role                                     |
| ------- | --------------------- | ---------------------------------------- |
| `main`  | Protected Integration | Clean integrated baseline verified by CI |
| `trung` | Trung                 | Active development branch for Trung      |
| `hieu`  | Hiếu                  | Active development branch for Hiếu       |
| `kim`   | Kim                   | Active development branch for Kim        |
| `dinh`  | Đinh                  | Active development branch for Đinh       |
| `phuc`  | Phúc                  | Active development branch for Phúc       |

**Constraint (`MUST NOT`):** Do **NOT** create unapproved extra branches (`develop`, `staging`, ad-hoc global branches) in the initial repository structure unless formally amended via team governance.

---

## 2. Branch Ownership & Daily Development Flow (`MUST`)

1. Each contributor works strictly on their assigned personal branch (`trung`, `hieu`, `kim`, `dinh`, `phuc`).
2. **MUST NOT** push or commit directly to `main`.
3. **MUST NOT** push commits to another member's branch or rewrite shared branch history (`git push --force` on `main` or others' branches is forbidden).
4. **MUST NOT** create commits pretending to represent another team member.
5. Before starting new work or opening a PR, sync cleanly from `main` via `git fetch origin && git rebase origin/main` (or controlled merge if shared).

---

## 3. Commit Conventions (`MUST`)

Follow Conventional Commits (`<type>(<scope>): <imperative summary>`):

- `feat(api): add product variant query endpoint`
- `fix(web): handle loading state in health banner`
- `chore(prisma): add initial foundation migration`
- `docs(standards): clarify decimal precision rule`
- `test(api): add health endpoint integration test`

**Forbidden in Commit Messages & Diffs (`MUST NOT`):** API keys, passwords, VNPay `TmnCode` / `HashSecret`, `.env` files, or real personal PII.

---

## 4. Pull Request, Code Review & Merge Strategy (`MUST`)

1. Every integration into `main` requires a **Pull Request** using [`.github/pull_request_template.md`](../../.github/pull_request_template.md).
2. **Pre-PR Verification (`MUST`):** Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build` locally before requesting review.
3. **Merge Gate:** Do not merge any PR failing GitHub Actions CI or lacking peer review when branch protection is active.
4. **Merge Strategy (`SHOULD`):** Prefer **Squash and Merge** (or clean rebase merge) into `main` to maintain linear traceable commits, while team members rebase/sync their personal branch cleanly from updated `main` afterward.

---

## 5. Hotfix & Rollback Protocol (`MUST`)

- **Rollback:** Revert broken merges on `main` using `git revert -m 1 <merge-sha>` via an urgent PR rather than rewriting `main` history (`reset --hard` + force push).
- **Hotfix:** Branch or patch on maintainer branch -> run full checks -> open urgent PR to `main` referencing affected issue.
- **Migration Rollback Safety:** Because applied Prisma migrations MUST NEVER be deleted/edited, schema fixes during rollback must apply a forward corrective migration unless restoring a pre-deploy DB backup.
