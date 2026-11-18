# Security Documentation — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Security baseline index referencing [`docs/standards/SECURITY_RULES.md`](../standards/SECURITY_RULES.md) and threat mitigations carried over from the TechPilot audit.

---

## Authoritative Security Standard

All authentication, RBAC, validation, transport, secret, webhook, and SSRF controls are defined in [`docs/standards/SECURITY_RULES.md`](../standards/SECURITY_RULES.md).

## Legacy Vulnerabilities Explicitly Eliminated by Nexora Foundation

1. **Committed Sandbox Payment Keys (`TechPilot config/vnpay.php`):** Zero secret fallback literals in code; all keys load strictly via validated environment config.
2. **Hardcoded Login Equivalence Backdoor (`TechPilot User.php:108-110`):** Eliminated via clean future Argon2id/bcrypt service without literal overrides.
3. **Unrestricted SSRF (`TechPilot SpecScraperService.php`):** No arbitrary URL scraper enabled; future integrations MUST restrict scheme/IP/redirects cleanly.
4. **Disabled MySQL TLS Cert Verification (`TechPilot config/database.php:68`):** Remote TLS verification will never silently fall back to `false`.
5. **PII / Seed Data Exposure (`TechPilot seed_dev.sql`):** Synthetic non-personal fixtures strictly enforced in `prisma/seed.ts`.
