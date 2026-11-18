# Database Operations Guide — Nexora

- **Status:** `Approved` (Foundation Baseline)
- **Last Updated:** `2026-11-18`
- **Scope:** Local setup, Prisma Migrate, seeding, reset policy, and backup instructions for **MySQL 8.4 LTS + Prisma ORM**.

---

## 1. Engine & Tooling Stack (`MUST`)

- **Database Engine:** MySQL `8.4` (`mysql:8.4` container in [`docker-compose.yml`](../../docker-compose.yml))
- **Charset / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`
- **ORM / Migrations:** Prisma Schema (`prisma/schema.prisma`), Prisma Migrate (`prisma/migrations/`), Prisma Client (`@prisma/client`)

---

## 2. Standard Developer Commands (`npm` Root Scripts)

| Command               | Action                                                               | Rule / Notes                                                  |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `npm run db:generate` | Generates Prisma Client types from `prisma/schema.prisma`            | Run after any schema pull/edit                                |
| `npm run db:migrate`  | Runs `prisma migrate dev` (applies/creates SQL migration in dev)     | **MUST NOT** edit already-committed migration files afterward |
| `npm run db:deploy`   | Runs `prisma migrate deploy` (non-interactive CI/staging/prod apply) | Never auto-resets or drops data                               |
| `npm run db:seed`     | Executes idempotent TypeScript seed (`prisma/seed.ts`)               | Uses synthetic non-PII dev data only                          |

---

## 3. Reset & Backup Policy (`MUST`)

1. **Development Reset (`MAY` in local dev only):** `npx prisma migrate reset` cleanly drops/recreates the **local dev database**, replays all migrations from scratch, and runs `prisma/seed.ts`. **MUST NOT** ever run against staging/production DBs or share Docker volume instructions that instruct teammates to wipe other projects' volumes.
2. **Backup & Restore (`SHOULD`):** Before schema upgrades on persistent staging/production MySQL instances, capture a consistent snapshot:
   ```bash
   mysqldump --single-transaction --routines --triggers -u "$DB_USER" -p "$DB_NAME" > nexora_backup_$(date +%F).sql
   ```
   Verify restore cleanly in an isolated staging DB before promotion.
