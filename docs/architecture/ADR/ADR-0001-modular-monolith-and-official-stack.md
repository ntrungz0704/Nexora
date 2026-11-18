# ADR-0001: Modular Monolith & Official TypeScript Full-Stack Baseline

- **Status:** `Approved`
- **Date:** `2026-11-18`
- **Decision Makers:** Nexora Project Owner & Architecture Team

## Context

Legacy repository `TechPilot` suffered from un-namespaced PHP MVC coupling, direct SQL queries inside templates, missing automated quality gates, and diverging exploratory stack proposals in Phase-0 audit docs (`Laravel 12` vs `Next.js + NestJS + PostgreSQL`). Nexora requires one cohesive, modern, strongly typed stack optimized for a thesis team and maintainable real-world growth.

## Decision

Nexora **MUST** adopt a **Modular Monolith** inside an **npm Workspaces Monorepo** built exclusively on:

- **Frontend (`apps/web`):** HTML5, CSS3, Tailwind CSS, TypeScript, ReactJS, Vite, React Router, TanStack Query, React Hook Form, Zod, Axios/Fetch.
- **Backend (`apps/api`):** Node.js, TypeScript, Express.js, REST API, Prisma ORM, Zod, Swagger/OpenAPI.
- **Database (`prisma/`):** MySQL 8.4 LTS managed strictly via Prisma Schema, Prisma Migrate, and Prisma Client.
- **DevOps & Testing:** Docker, Docker Compose, GitHub Actions, ESLint, Prettier, Vitest, Supertest, Playwright.

PHP, Laravel, NestJS, Next.js, Angular, PostgreSQL, MongoDB, and Microservices **MUST NOT** be introduced.

## Alternatives Considered

1. **Refactor TechPilot PHP in place:** Rejected due to P0 credential/SSRF vulnerabilities, polluted Git history, and lack of Variant/PO/COGS/SellerMargin structure.
2. **Laravel 12 Monolith:** Rejected in favor of unified TypeScript across frontend and backend (`packages/shared` contracts).
3. **Microservices:** Rejected as unnecessary operational and distributed-transaction overhead for a single-vendor store.

## Consequences

- Shared TypeScript DTOs and Zod validation run across React and Express via `@nexora/shared`.
- Ported domain rules from `TechPilot` (`PcCompatibilityService`, `ProductSpecNormalizer`, `ProductFacetService`, `ProductComparisonService`, `FlashSaleService`) require clean TypeScript rewrites backed by Vitest suites.
