# 23. Complete Project Metrics (Empirical & Scope-Defined)

- **Phạm vi thống kê:** Toàn bộ workspace `D:\Nexora` tại commit `1aa6ed2`. **KHÔNG tính** `node_modules`, `.git`, `dist`, `test-results` vào Handwritten Source LOC.

## 1. Structure Metrics

| Metric                                                                |      Value |
| --------------------------------------------------------------------- | ---------: |
| Active directories (đệ quy)                                           |    **105** |
| Active files (đệ quy)                                                 |    **602** |
| Hidden files (trong active tree)                                      |     **12** |
| Binary files (trong active tree)                                      |    **282** |
| Excluded directories (`node_modules`, `.git`, `dist`, `test-results`) |      **9** |
| Excluded files total                                                  | **25,240** |

## 2. Source Code Metrics (Handwritten Only)

| Extension / Category                                                          | File Count |                Lines of Code (LOC) |
| ----------------------------------------------------------------------------- | ---------: | ---------------------------------: |
| TypeScript (`.ts`)                                                            |         74 | _(gồm trong Source + Test + Seed)_ |
| TypeScript React (`.tsx`)                                                     |         49 |        _(gồm trong Source + Test)_ |
| JavaScript (`.js`, gồm 8 file legacy public JS + config/scripts)              |         11 |      _(gồm trong Source + Public)_ |
| CSS (`.css`: 5 public + 1 `src/index.css`)                                    |          6 |                         **10,475** |
| HTML (`.html`)                                                                |          1 |                             **34** |
| Prisma Schema (`.prisma`) + Migrations (`.sql`)                               |          5 |                          **1,057** |
| **Handwritten Application Source LOC (TS/TSX/JS/HTML, loại trừ Test & Docs)** |    **106** |                         **31,274** |
| **Automated Test LOC (Vitest/Supertest/Playwright)**                          |     **13** |                          **1,923** |
| **Documentation LOC (`docs/` trước khi sinh bộ handover này)**                |    **151** |                          **6,659** |

## 3. Application Architecture Metrics

| Metric                                                                |                              Value |
| --------------------------------------------------------------------- | ---------------------------------: |
| Frontend Pages (`*Page.tsx`, `StorefrontHome`, `FoundationDashboard`) |                             **29** |
| Total React Components parsed (PascalCase functions/consts in TSX)    |                            **104** |
| Custom React Hooks parsed                                             |                              **3** |
| Frontend Routes (`AppRoutes.tsx`)                                     |                             **82** |
| Backend Domain Modules (`apps/api/src/modules/*`)                     |       **11** (10 routed + `email`) |
| Backend REST API Endpoints                                            | **85** (+2 Swagger docs endpoints) |
| Backend Services (`*.service.ts`)                                     |                             **11** |
| Backend Middleware Files                                              |                              **4** |
| Prisma Models / MySQL Tables                                          |  **24 models / 25 runtime tables** |
| Prisma Enums                                                          |                              **9** |
| Prisma Migrations                                                     |                **4** (all applied) |

## 4. Quality & Test Metrics

| Metric                           |                                                                               Value |
| -------------------------------- | ----------------------------------------------------------------------------------: |
| Vitest / Supertest Test Files    |  **10** (Unit: 2 shared + 1 web component + 1 api app; Integration/Security: 6 api) |
| Playwright E2E Spec Files        | **2** (`foundation.spec.ts`, `storefront_journeys.spec.ts`) + 1 DB integration spec |
| Vitest Test Cases Executed       |                                                **64 passed / 0 failed / 0 skipped** |
| Playwright E2E Test Cases Listed |                  **9 tests** (runtime execution: `NOT VERIFIED` in read-only audit) |
| Explicit `any` count in TS/TSX   |                                                                               **0** |
| `TODO` / `FIXME` / `HACK` count  |                                                                               **0** |
| Prettier Formatting Drift        |                                                                       **145 files** |

## 5. Assets, Dependencies & Storage Metrics

| Metric                                                              |                                                                  Value |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------: |
| Static Assets (`apps/web/public/`)                                  | **288 files** (Images/SVG/ICO: 273, CSS: 5, Legacy JS: 8, XML/JSON: 2) |
| Production Dependency Declarations (across 5 workspaces)            |                                                     **26** (21 unique) |
| Development Dependency Declarations (across 5 workspaces)           |                                                     **34** (34 unique) |
| Source + Tests + Prisma Size                                        |                                                            **1.36 MB** |
| Static Assets Size (`apps/web/public/`)                             |                                                           **54.72 MB** |
| Documentation Size (`docs/` pre-handover)                           |                                                           **11.01 MB** |
| Total Active Workspace Size (excl. ignored/deps)                    |                                                           **67.38 MB** |
| Excluded Dirs Size (`node_modules`, `.git`, `dist`, `test-results`) |                                                          **726.06 MB** |
| **Total Disk Footprint (`D:\Nexora`)**                              |                                                          **793.44 MB** |
