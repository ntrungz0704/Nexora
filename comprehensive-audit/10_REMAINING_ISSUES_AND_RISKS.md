# NEXORA — REMAINING ISSUES & RISKS ASSESSMENT
**Document Version:** 1.0.0  
**Audit Scope:** Residual Technical Debt, Phase A Limitations & Future Milestone Scope (Stage 3 & 4)  
**Date:** 2026-11-23  
**Auditor:** Principal Software Architect & Lead Security Reviewer  
**Workspace Root:** `D:\Nexora`  
**Git Baseline:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` (`main`)  

---

## 1. Residual Issues Classification Matrix

In accordance with **Section 18 (Classification Rules)**, all findings are categorized by severity:

| Issue ID | Severity | Category | Module | Status | Notes / Plan |
|---|:---:|---|---|:---:|---|
| `ISSUE-P1-01` | P1 | Data Completeness | Database / Catalog | ✅ **FIXED** | 651 products imported from TechPilot `seed_dev.sql`. |
| `ISSUE-P2-01` | P2 | UI / Data Duplication| Frontend Catalog (`SearchPage.tsx`) | ✅ **FIXED** | Sidebar duplicate categories & multi-highlight resolved. |
| `ISSUE-P2-02` | P2 | Content / UI Display | Frontend News (`NewsPage.tsx`, `PostDetail`) | ✅ **FIXED** | Distinct cover images & clean HTML formatting restored. |
| `ISSUE-P2-03` | P2 | Visual Parity | Storefront (`ProductCatalogSection.tsx`) | ✅ **FIXED** | 20 circular PNG category icons restored to TechPilot parity. |
| `ISSUE-P2-04` | P2 | Interaction / UX | Storefront Sliders (`ProductSliderRow`) | ✅ **FIXED** | Carousel slices expanded to 15 items; smooth scroll verified. |
| `LIMIT-SEC-01` | P3 | Security Limitation | Auth (`auth.service.ts`) | 🟡 **DOCUMENTED** | Phase A Limitation: In-memory token revocation latency. |
| `LIMIT-SEC-02` | P3 | Security Limitation | Rate Limiter (`rateLimiter.ts`) | 🟡 **DOCUMENTED** | Phase A Limitation: Local process memory store for rate limiter. |
| `LIMIT-PAY-01` | P3 | Payment Gateway | Payment (`vnpay.service.ts`) | 🟡 **DOCUMENTED** | Phase A Limitation: Configured for VNPay Sandbox environment. |
| `SCOPE-M63-01`| P4 | Future Milestone | Catalog / Reviews | ⚪ **FUTURE SCOPE** | M6.3 Customer Reviews Frontend (Backend M4 is ready). |
| `SCOPE-M64-01`| P4 | Future Milestone | Orders / Returns | ⚪ **FUTURE SCOPE** | M6.4 Customer Returns Frontend (Backend M5 is ready). |
| `SCOPE-M65-01`| P4 | Future Milestone | Testing & QA | ⚪ **FUTURE SCOPE** | M6.5 E2E Playwright Integration Testing & Staging QA. |

---

## 2. In-Depth Analysis of Documented Limitations

### 2.1. LIMIT-SEC-01: JWT Revocation Latency
- **Context:** JWT access tokens are signed with a 15-minute TTL. When an administrator deactivates an account or an address is deleted, in-flight access tokens remain cryptographically valid until expiry unless token blacklist is queried.
- **Current Mitigation:** Database ownership checks on sensitive endpoints (`/orders`, `/profile`, `/returns`) actively query user status in MySQL, neutralizing unauthorized data access.
- **Production Recommendation (Phase 4):** Deploy Redis-backed distributed token denylist for instant revocation across clustered instances.

### 2.2. LIMIT-SEC-02: In-Memory Rate Limiting
- **Context:** `express-rate-limit` currently tracks IP hit counts in Node.js process memory.
- **Risk:** In a multi-replica Docker Swarm or Kubernetes deployment, client requests hitting different container pods have distributed counters.
- **Current Mitigation:** The system is currently deployed as a single-container API instance behind Nginx, where in-memory limiting is 100% effective.
- **Production Recommendation (Phase 4):** Connect `rate-limit-redis` store when scaling beyond one replica.

### 2.3. LIMIT-PAY-01: VNPay Production Credentials
- **Context:** VNPay HMAC-SHA512 integration is fully functional and tested against VNPay Sandbox test accounts.
- **Action Required for Production:** Project owner must supply production `VNP_TMN_CODE` and `VNP_HASH_SECRET` before taking real bank payments.

---

## 3. Strict Boundary Reminders (Forbidden Actions)

1. **Nexora is NOT a Marketplace:** Single-vendor hardware architecture is locked. No seller registration, commission calculation, or marketplace payouts.
2. **STAFF Scope Boundary:** STAFF role exists in Prisma enum (`CUSTOMER`, `STAFF`, `ADMIN`), but NO staff workflow, portal, dashboard, or permission expansion is permitted at this stage (governed by `FUTURE_STAFF_SCOPE_AND_GOVERNANCE.md`).
3. **Protected Historical Data:** Applied Prisma migrations (1 through 8) are permanently locked.
