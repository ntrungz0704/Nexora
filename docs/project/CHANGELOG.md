# Changelog — Nexora

All notable milestones, architectural baselines, and releases in **Nexora** are recorded here chronologically.

## [0.2.0-storefront] — 2026-11-19

### Added

- **Customer E-Commerce Storefront (`apps/web`)**: Rebuilt the entire customer-facing storefront matching `techpilot.io.vn` with top utility bar, main header, search with category selector, 16-category vertical sidebar, interactive hero banner carousel (RTX 50 Series, ROG Zephyrus G16, MacBook Pro M3 Max, PC Gaming Ultra, Odyssey OLED G9), 3 promo feature cards, 5 service feature badges, real-time countdown Flash Sale section, categorized tech product grid, and full footer.
- **Identity & RBAC Module (`apps/api/src/modules/auth`)**: Implemented bcrypt password hashing, JWT authentication, `optionalAuth` and `requireAuth` middlewares, and tabbed `AuthModal` with instant demo login for `ADMIN`, `STAFF`, and `CUSTOMER`.
- **Catalog & Products Module (`apps/api/src/modules/catalog`)**: Added RESTful endpoints for categories hierarchy, banners, brands, product filtering by search/price/flags, flash sales, and product details with Decimal monetary precision.
- **Cart Module & Drawer (`apps/api/src/modules/cart`, `apps/web/src/features/storefront/CartDrawer.tsx`)**: Created persistent cart management for both authenticated users and guests, quantity stepping, and live free shipping progress calculation.
- **Prisma Migration (`20261119044649_init_storefront_and_catalog`)**: Expanded MySQL 8.4 schema with `brands`, `categories`, `products`, `product_images`, `banners`, `carts`, `cart_items`, `wishlists`, `reviews`, and customer addresses.
- **Rich Seed Data (`prisma/seed.ts`)**: Populated authentic synthetic products, brands, categories, and banners using preserved local high-res visual assets.
- **Routing Optimization (`apps/web/src/routes/AppRoutes.tsx`)**: Dedicated `/` to Customer Storefront, preserved Architecture & Foundation monitor at `/foundation`.

## [0.1.0-foundation] — 2026-11-18

### Added

- Completed Phase-0 read-only technical audit synthesis (`docs/governance/AUDIT_DOCUMENT_REVIEW.md`) keeping legacy `TechPilot/` & `audit-output/` untouched.
- Established complete Nexora Governance (`AGENTS.md`, `GEMINI.md`, `PROJECT_CHARTER.md`, `PROJECT_SCOPE.md`, `ENGINEERING_PRINCIPLES.md`, `AI_AGENT_WORKING_RULES.md`, `DEFINITION_OF_DONE.md`, `DECISION_LOG.md`) and 10 Engineering Standards under `docs/standards/`.
- Established Single-Vendor architecture (`Modular Monolith`), Database/ERD/Data Dictionary foundations (`MySQL 8.4 + Prisma`), API conventions, and GitHub governance templates (`.github/`).
- Initialized npm Workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`, `packages/config`, `prisma/`), Docker Compose (`mysql:8.4` + dev setup), Vitest/Supertest/Playwright baseline, and Private GitHub repo `Nexora` with 6 team branches.
