# ADR-0002: Single-Vendor Store Business Model & Marketplace Exclusion

- **Status:** `Approved`
- **Date:** `2026-11-18`
- **Decision Makers:** Nexora Project Owner & Architecture Team

## Context

Early Phase-0 SellerMargin readiness notes (`audit-output/SELLERMARGIN_INTEGRATION_READINESS.md`) explored multi-store `store_id` tenancy and third-party marketplace adapters (`Shopee`, `TikTok Shop`). Ambiguity between single-store retail and multi-vendor marketplace would distort database schema, checkout order splitting, payouts, and RBAC rules.

## Decision

Nexora **MUST** operate strictly as a **Single-Vendor E-Commerce & Store Management System** belonging to **ONE store only**:

- Official roles are `Guest`, `Customer`, internal `Seller` (store operations employee), and `Admin`.
- **MUST NOT** implement external vendor onboarding, independent storefronts, marketplace commissions, vendor payouts, or multi-vendor order splitting.
- `SellerMargin` operates solely as the internal store profitability analytics module unless separately chartered in a post-thesis phase.

## Alternatives Considered

1. **Multi-vendor Marketplace from Day 1:** Rejected—adds high payout/settlement/dispute complexity irrelevant to operating one specialized tech store.
2. **Multi-tenant `store_id` on every table during MVP:** Rejected for initial Nexora baseline to keep schema clean and focused on single-store 3NF integrity.

## Consequences

- Orders map directly to Nexora's single store without sub-order splitting.
- `Seller` permissions control internal catalog, inventory, purchasing, order fulfillment, RMA, and SellerMargin analytics—controlled centrally by `Admin`.
