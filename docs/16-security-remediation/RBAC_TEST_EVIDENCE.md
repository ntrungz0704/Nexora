# Objective A — Admin RBAC Hardening & Test Evidence

## 1. Vulnerability Details

- **Original Files & Lines:**
  - `apps/api/src/modules/admin/admin.routes.ts:10, 72-74`
  - `apps/api/src/modules/admin/admin.controller.ts:453-475`
  - `apps/api/src/modules/admin/admin.service.ts:978-1055`
- **Root Cause:** Router-level `requireAuth(['ADMIN', 'STAFF'])` granted `STAFF` access to `PATCH /api/v1/admin/users/:id/role` and `PATCH /api/v1/admin/users/:id/toggle`. Furthermore, in `AdminService.changeUserRole`, the service previously only guarded `id === 1`, self-modification, and specific system admin emails (`admin@nexora.local`, `admin@nexora.vn`), which left any second administrator account with an external or non-system email vulnerable to role modification or demotion by another administrator.
- **Security Impact:** Critical/P0 vertical privilege escalation (`STAFF -> ADMIN`) and administrative account takeover/tampering.

## 2. Remediation Implemented

- **Route Layer (`admin.routes.ts:71-74`):** Mounted explicit `requireAuth(['ADMIN'])` middleware on `PATCH /users/:id/toggle` and `PATCH /users/:id/role` while preserving `GET /users` and all legitimate operational routes for `STAFF`.
- **Controller Layer (`admin.controller.ts:453-482`):** Added numeric ID validation and passed authenticated caller context (`req.user?.sub` + `req.user?.role`) to `AdminService`.
- **Service Layer Defense-in-Depth (`admin.service.ts:978-1055`):**
  - **Enforce Caller Privilege:** Enforces `actorRole !== 'ADMIN' -> 403 FORBIDDEN` (code `FORBIDDEN`). Only active `ADMIN` accounts can invoke role mutations or status toggles.
  - **Block Self-Lock & Self-Role Mutation:** Blocks self-role alteration (`403 SELF_ROLE_CHANGE_FORBIDDEN`) and self-lock (`400 SELF_LOCK_FORBIDDEN`).
  - **Shield All ADMIN Accounts from Deactivation:** In `toggleUserStatus()`, any user with `user.role === 'ADMIN'` is strictly protected (`403 PROTECTED_ADMIN`) — no administrator can disable another administrator account.
  - **Shield All ADMIN Accounts from Role Mutation / Demotion:** In `changeUserRole()`, any user with `targetUser.role === 'ADMIN'` is strictly protected (`403 PROTECTED_ADMIN`) regardless of whether their email is a system email or an external corporate email (`admin2@external-partner.org`). No administrator can demote or alter the role of any existing administrator.
  - **Preserve Super Admin & Staff Operational Access:** Protects super administrator `id === 1` and preserves legitimate operational permissions for `STAFF` on read-only catalog, orders, and dashboard endpoints.

## 3. Automated Test Evidence (`apps/api/tests/phase_a_security_remediation.test.ts`)

| Test ID   | Scenario                                                                                       | Expected                                                          | Actual Result |
| --------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| `RBAC-A1` | Unauthenticated `PATCH /users/:id/role` & `/toggle`                                            | `401 UNAUTHORIZED`                                                | **PASS**      |
| `RBAC-A2` | `CUSTOMER` calling `/role` & `/toggle`                                                         | `403 FORBIDDEN`                                                   | **PASS**      |
| `RBAC-A3` | `STAFF` promoting self or another user to `ADMIN`                                              | `403 FORBIDDEN` + DB unchanged                                    | **PASS**      |
| `RBAC-A4` | `STAFF` demoting/locking `ADMIN` or toggling `CUSTOMER`                                        | `403 FORBIDDEN`                                                   | **PASS**      |
| `RBAC-A5` | `STAFF` accessing dashboard, orders, users list                                                | `200 OK` (legitimate permissions preserved)                       | **PASS**      |
| `RBAC-A6` | `ADMIN` modifying `id=1` or self role                                                          | `403 PROTECTED_ADMIN` / `SELF_ROLE_CHANGE_FORBIDDEN`              | **PASS**      |
| `RBAC-A7` | `ADMIN` promoting/toggling disposable `CUSTOMER` and restoring                                 | `200 OK`                                                          | **PASS**      |
| `RBAC-A8` | `ADMIN` attempting to demote or toggle second `ADMIN` account with non-system email (`admin2`) | `403 PROTECTED_ADMIN` on role change & toggle + DB role unchanged | **PASS**      |

## 4. Remaining Limitations

- JWT token revocation upon `toggleUserStatus` occurs at token expiration or next `/auth/me` / refresh token rotation; immediate in-flight JWT revocation via distributed blocklist is deferred to Phase B/F session hardening.
