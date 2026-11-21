# Objective C — Password-Reset Canonical URL & End-to-End Flow Evidence

## 1. Defect Details

- **Original Files & Lines:**
  - `apps/api/src/modules/auth/auth.service.ts:163` (generates `${clientUrl}/auth/reset-password?token=...`)
  - `apps/web/src/routes/AppRoutes.tsx:121, 125` (only declared `/auth/reset` and `/reset-password`)
  - `apps/web/src/features/auth/ResetPasswordPage.tsx:22-49` (no empty-token pre-check; generic `err.message` on Axios failure)
- **Root Cause:** Route mismatch between backend email link (`/auth/reset-password`) and React Router definitions caused users clicking the email link to hit `NotFoundPage` (404).
- **Functional Impact:** P1 broken password recovery journey in browser.

## 2. Remediation Implemented

- **Canonical URL established:** `/auth/reset-password?token=<jwt>` (consistent across `auth.service.ts`, `AppRoutes.tsx`, `auth_password_reset_security.test.ts`, and `ResetPasswordFlow.test.tsx`).
- **Frontend Routes (`AppRoutes.tsx:117-127`):** Added `<Route path="/auth/reset-password" element={<ResetPasswordPage />} />` and `/auth/forgot-password` while keeping `/auth/reset` and `/reset-password` aliases.
- **Frontend Validation & Error UX (`ResetPasswordPage.tsx:22-56`, `authService.ts:36-43`):**
  - Blocks submission if `token` query param is empty.
  - Sends `{ token, newPassword, password }` to `POST /api/v1/auth/reset-password`.
  - Surfaces exact backend error envelope message (`err.response?.data?.error?.message`).
- **Preserved Backend Security Properties (`auth.service.ts`):**
  - Generic 200 response for unknown emails (anti-enumeration).
  - Never returns `resetToken` in HTTP response; never logs token or full URL.
  - Strict 15-minute JWT expiration, `purpose: 'password_reset'`, `hashSig` binding, and single-use atomic `updateMany` preventing replay and race conditions.

## 3. Automated Test Evidence

### Backend Live MySQL Security Suite (`apps/api/tests/auth_password_reset_security.test.ts` — 8/8 PASS)

1. `SEC-RESET-1`: Dispatches real email containing `/auth/reset-password?token=...`; never leaks token in HTTP response; verifies 15m TTL & `purpose`.
2. `SEC-RESET-2`: Non-existent email returns identical generic message without dispatching email.
3. `SEC-RESET-2B`: Email provider failure returns `500 EMAIL_DELIVERY_FAILED` (no false positive).
4. `SEC-RESET-3`: Rejects standard access token (`INVALID_TOKEN_PURPOSE`).
5. `SEC-RESET-4`: Rejects expired reset token (`400`).
6. `SEC-RESET-5`: Rejects forged/tampered signature (`400`).
7. `SEC-RESET-6`: Full E2E reset via emailed token, verifies login with new password, rejects sequential token replay.
8. `SEC-RESET-7`: Concurrency regression (`Promise.all` with same token): exactly ONE succeeds and ONE fails.

### Frontend Canonical Route & Component Flow Suite (`apps/web/tests/ResetPasswordFlow.test.tsx` — 4/4 PASS)

1. `RESET-FE-1`: Opening `/auth/reset-password?token=valid-reset-jwt-123` via `AppRoutes` renders `ResetPasswordPage` (not 404), submits token + new password, displays success state.
2. `RESET-FE-2`: Displays backend error message on expired/reused/invalid token rejection.
3. `RESET-FE-3`: Blocks submit with validation error when `token` query param is missing.
4. `RESET-FE-4`: Legacy aliases `/auth/reset` and `/reset-password` continue to render `ResetPasswordPage`.

## 4. Remaining Limitations

- Full browser-level Playwright test with a live SMTP inbox trap (e.g., Mailpit) is not part of Phase A and can be added in Phase C/D.
