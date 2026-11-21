# WORKSPACE BASELINE & SOURCE INTEGRITY REPORT

- **Project:** Nexora (Full Modern Rebuild of TechPilot)
- **Snapshot Date:** 2026-11-19
- **TechPilot Local Baseline:** `D:\Nexora\TechPilot` (Strictly Read-Only Reference)
- **TechPilot Remote Git:** `https://github.com/ntrungz0704/TechPilot.git` (`main` branch)
- **TechPilot Commit SHA:** `13861a83c4671440669c5a6469b2c607743f1eb0`
- **TechPilot Live Reference URL:** `https://techpilot.io.vn/`
- **Nexora Target Repo:** `https://github.com/ntrungz0704/Nexora.git` (`main` branch)

---

## 1. Source Preservation Protocol

1. `D:\Nexora\TechPilot` is kept strictly intact, clean, and tracked on `main`. No files have been deleted, moved, or altered.
2. `audit-output/` is preserved as historic audit data.
3. Nexora modern architecture is isolated within:
   - `apps/web/`: React 19 + TypeScript + Vite + Tailwind CSS 4
   - `apps/api/`: Node.js + Express 5 + TypeScript + Prisma ORM
   - `packages/shared/`: Shared Zod DTO contracts and interfaces
   - `packages/config/`: Shared linting & tsconfig rules
   - `prisma/`: MySQL 8.4 schema and migration history

---

## 2. Legacy Metric Verification

- **Total Views:** 78 view PHP files (55 page-level views + 23 layouts/partials)
- **Total Routes:** 182 route declarations in `router.php`
- **Database Tables:** 28 MySQL tables
- **Assets:** 228 images, 4 core CSS files (`style.css`, `category-mega-menu.css`, `news.css`, `search-filters.css`)
- **Controllers:** 26 Controllers in `TechPilot/app/controllers/`
- **Services:** 28 Services in `TechPilot/app/services/`
