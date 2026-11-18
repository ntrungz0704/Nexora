# Nexora — Single-Vendor Tech E-Commerce & Store Management Platform

> **Status:** `Phase 1–2 Foundation Complete` | **Architecture:** `Modular Monolith (npm Monorepo)` | **Business Model:** `Single-Vendor Store` _(NOT Marketplace)_

Nexora is the modernized, clean-architecture rebuild replacing legacy `TechPilot`, specializing in desktop PCs, laptops, hardware components, accessories, and peripherals, with integrated internal store management and **SellerMargin** profitability foundation.

---

## 1. Official Technology Stack

- **Frontend (`apps/web`):** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form, Zod, Axios
- **Backend (`apps/api`):** Node.js 22 LTS, TypeScript, Express.js, Prisma Client, Zod, Helmet, CORS, Swagger/OpenAPI (`/api/docs`)
- **Database (`prisma/`):** MySQL 8.4 LTS (`utf8mb4`), Prisma ORM, Prisma Migrate, TypeScript seeders
- **Quality & DevOps:** npm Workspaces, ESLint, Prettier, Vitest, Supertest, Playwright, Docker, Docker Compose, GitHub Actions

---

## 2. Repository Structure

```text
Nexora/
├── AGENTS.md / GEMINI.md    # AI coding agent root instructions
├── .github/                 # PR template, issue templates, CODEOWNERS, CI workflow
├── apps/
│   ├── web/                 # @nexora/web — React + Vite + Tailwind CSS SPA
│   └── api/                 # @nexora/api — Express + Prisma REST API
├── packages/
│   ├── config/              # @nexora/config — Shared non-secret store constants
│   └── shared/              # @nexora/shared — Shared Zod DTO contracts & envelopes
├── prisma/                  # MySQL 8.4 schema, migrations, synthetic seed script
├── docker/                  # Dockerfiles for API & Web services
├── docker-compose.yml       # MySQL 8.4 + API + Web containerized local environment
├── docs/                    # Governance, Engineering Standards, Architecture, DB, API, Roadmap
├── tests/                   # Playwright E2E configuration & specs
├── TechPilot/               # [IGNORED] Preserved read-only legacy archive
└── audit-output/            # [IGNORED] Phase-0 audit deliverables
```

---

## 3. Prerequisites & Quickstart

### Prerequisites

- **Node.js** `>= 20` (tested on `v22.23.4`) and **npm** `>= 10` (`10.9.9`)
- **Docker** & **Docker Compose** (for MySQL 8.4 container)

### Local Development Setup

```bash
# 1. Copy environment template and fill local dev values
cp .env.example .env

# 2. Install monorepo dependencies
npm install

# 3. Start MySQL 8.4 container and wait for healthy check
docker compose up -d mysql

# 4. Generate Prisma Client, run migrations, and seed synthetic dev baseline
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start API (http://localhost:3000) & Web (http://localhost:5173) concurrently
npm run dev
```

### Verification & Quality Commands

```bash
npm run typecheck     # Build shared packages & typecheck api + web
npm run lint          # ESLint across entire monorepo
npm run format:check  # Prettier formatting verification
npm run test          # Vitest unit & integration test suites
npm run build         # Production build across all workspaces
```

### Docker Compose Full Stack (`mysql` + `api` + `web`)

```bash
docker compose up -d --build
docker compose down   # Stops containers safely without deleting persistent MySQL volume
```

---

## 4. Governance & Branch Workflow

- Always read [`AGENTS.md`](AGENTS.md) and [`docs/README.md`](docs/README.md) before modifying code.
- **Official Branches:** `main` (protected integration), `trung`, `hieu`, `kim`, `dinh`, `phuc`. All contributions enter `main` via Pull Request with passing CI checks.
