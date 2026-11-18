# Architecture Decision Records (ADR) Guide

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Standards for recording significant architectural, database, security, or scope decisions in `docs/architecture/ADR/`.

---

## When to Create an ADR (`MUST`)

Create a numbered ADR (`ADR-XXXX-short-kebab-title.md`) whenever a decision alters:

- Technology stack, core dependencies, or database engine
- Monorepo / Modular Monolith structure or cross-module boundaries
- Financial/COGS calculation semantics (`FIFO` vs `Moving Weighted Average`, rounding rules)
- Authentication, session, RBAC, or payment gateway contracts

## Mandatory ADR Template

```markdown
# ADR-XXXX: <Concise Decision Title>

- **Status:** Proposed | Approved | Superseded | Deprecated
- **Date:** YYYY-MM-DD
- **Decision Makers:** <Role / Team>

## Context

What architectural problem, TechPilot finding, or business constraint requires a decision?

## Decision

What exact architectural/technical choice was decided? Use MUST / MUST NOT statements where binding.

## Alternatives Considered

What other viable choices were evaluated and why were they rejected?

## Consequences

Positive outcomes, trade-offs, operational/testing impacts, and affected files/docs.
```

## Existing ADRs

- [`ADR-0001-modular-monolith-and-official-stack.md`](ADR-0001-modular-monolith-and-official-stack.md) — Approved TS/React/Express/MySQL/Prisma Modular Monolith
- [`ADR-0002-single-vendor-store-model.md`](ADR-0002-single-vendor-store-model.md) — Approved Single-Vendor E-Commerce & Store Operations Scope
