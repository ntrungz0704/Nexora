# Objective A — Admin RBAC Hardening & Test Evidence

## 1. Vulnerability Details

- **Original Files & Lines:**
  - `apps/api/src/modules/admin/admin.routes.ts:10, 72-74`
  - `apps/api/src/modules/admin/admin.controller.ts:453-475`
  - `apps/api/src/modules/admin/admin.service.ts:927-953`
- **Root Cause:** Router-level `requireAuth(['ADMIN', 'STAFF'])` granted `STAFF` access to `PATCH /api/v1/admin/users/:id/role` and `PATCH /api/v1/admin/users/:id/toggle`. `AdminService.changeUserRole` only blocked `id === 1`, allowing any `STAFF` user to promote themselves or others to `ADMIN`, or demote/lock non-`id=1` `ADMIN` accounts.
- **Security Impact:** Critical/P0 vertical privilege escalation (`STAFF -> ADMIN`) and administrative account takeover/DoS.

## 2. Remediation Implemented

- **Route Layer (`admin.routes.ts:71-74`):** Mounted explicit `requireAuth(['ADMIN'])` middleware on `PATCH /users/:id/toggle` and `PATCH /users/:id/role` while preserving `GET /users` and all legitimate operational routes for `STAFF`.
- **Controller Layer (`admin.controller.ts:453-482`):** Added numeric ID validation and passed `req.user?.sub` + `req.user?.role` to `AdminService`.
- **Service Layer Defense-in-Depth (`admin.service.ts:927-972`):**
  - Enforced `actorRole !== 'ADMIN' -> 403 FORBIDDEN`.
  - Blocked self-role change (`403 SELF_ROLE_CHANGE_FORBIDDEN`) and self-lock (`400 SELF_LOCK_FORBIDDEN`).
  - Blocked toggling status of any `ADMIN` account (`403 PROTECTED_ADMIN`).
  - Blocked role modification of `id === 1` and protected system admin emails (`admin@nexora.local`, `admin@nexora.vn`).

## 3. Automated Test Evidence (`apps/api/tests/phase_a_security_remediation.test.ts`)

| Test ID   | Scenario                                                       | Expected                                             | Actual Result |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------- | ------------- |
| `RBAC-A1` | Unauthenticated `PATCH /users/:id/role` & `/toggle`            | `401 UNAUTHORIZED`                                   | **PASS**      |
| `RBAC-A2` | `CUSTOMER` calling `/role` & `/toggle`                         | `403 FORBIDDEN`                                      | **PASS**      |
| `RBAC-A3` | `STAFF` promoting self or another user to `ADMIN`              | `403 FORBIDDEN` + DB unchanged                       | **PASS**      |
| `RBAC-A4` | `STAFF` demoting/locking `ADMIN` or toggling `CUSTOMER`        | `403 FORBIDDEN`                                      | **PASS**      |
| `RBAC-A5` | `STAFF` accessing dashboard, orders, users list                | `200 OK` (legitimate permissions preserved)          | **PASS**      |
| `RBAC-A6` | `ADMIN` modifying `id=1` or self role                          | `403 PROTECTED_ADMIN` / `SELF_ROLE_CHANGE_FORBIDDEN` | **PASS**      |
| `RBAC-A7` | `ADMIN` promoting/toggling disposable `CUSTOMER` and restoring | `200 OK`                                             | **PASS**      |

## 4. Remaining Limitations

- JWT revocation upon `toggleUserStatus` is not immediate at `requireAuth` middleware (checked at `/auth/me` and next login); deferred to Phase B/F session hardening.
