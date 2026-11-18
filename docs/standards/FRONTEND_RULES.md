# Frontend Rules — Nexora

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Standards for `apps/web` built with React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, and Zod.

---

## 1. Mandatory Technology Stack (`MUST`)

`apps/web` **MUST** exclusively use:

- **React + TypeScript + Vite** (JSX/TSX strict mode enabled)
- **Tailwind CSS** for styling (no ad-hoc CSS frameworks alongside Tailwind unless explicitly justified)
- **React Router** for client-side routing (`routes/`)
- **TanStack Query** for all server state caching, loading states, invalidation, and retries
- **React Hook Form + `@hookform/resolvers/zod` + Zod** for form state & client validation
- **Axios or Fetch API** wrapped cleanly inside `lib/apiClient.ts` and `services/*`

**Prohibited (`MUST NOT`):** Next.js, Angular, Vanilla JS parallel apps, jQuery, inline DOM SQL/HTML template strings (`innerHTML`), or direct database access.

---

## 2. Directory Structure & Component Organization (`MUST`)

```
apps/web/src/
├── app/          # Root App, QueryClientProvider, RouterProvider, global error boundary
├── components/   # Reusable domain-agnostic UI primitives (Button, Card, StatusBadge, Modal)
├── features/     # Self-contained vertical UI features (e.g., features/system/, later catalog/, cart/)
├── hooks/        # Reusable custom React hooks
├── layouts/      # StorefrontLayout, SellerAdminLayout, AuthLayout
├── lib/          # Typed HTTP client, queryClient config, formatting helpers
├── routes/       # Route definitions & React-level navigation guards (UX only, never security!)
├── services/     # API client functions calling apps/api REST endpoints
└── types/        # Frontend-local view types (wire DTOs come from @nexora/shared)
```

---

## 3. State Management, Data Fetching & Forms (`MUST`)

1. **No Raw `fetch` Scattered Inside Components (`MUST`):** All HTTP calls go through `services/*.ts` using the centralized API client (`baseURL`, credentials, error normalization) and are consumed via TanStack Query (`useQuery`, `useMutation`).
2. **Share Wire Contracts (`MUST`):** Validate forms against Zod schemas imported from or aligned with `@nexora/shared` so client error messages match server validation cleanly.
3. **No Business or Financial Authority in UI (`MUST NOT`):** Frontend components **MAY** format VND prices or preview totals for UX, **MUST NOT** compute final discounts, stock availability, COGS, or permissions authoritatively—backend remains the single source of truth.
4. **Never Duplicate Reusable Components (`SHOULD`):** Avoid copying card/table/form markup across pages; extract shared UI primitives into `components/`.

---

## 4. UI Quality, States, Accessibility & Responsive Design (`MUST`)

1. **Four Required Async View States (`MUST`):** Every remote data view MUST explicitly render **Loading** (skeleton/spinner), **Error** (clear retry action without leaking internals), **Empty** (helpful state CTA), and **Populated** states.
2. **Accessibility (`MUST`):** Use semantic HTML landmarks (`header`, `nav`, `main`, `footer`), `<label htmlFor>` associations on every form input, keyboard-accessible buttons/dialogs, and visible focus outlines.
3. **Responsive Mobile-First Layout (`MUST`):** Build cleanly across `sm`, `md`, `lg`, `xl` Tailwind breakpoints without horizontal scroll overflow.
4. **No Fake Auth Guards (`MUST NOT`):** Hiding buttons for `Customer` vs `Seller` vs `Admin` in React is UX polish only; authorization MUST be enforced by `apps/api` middleware.
5. **No Unescaped Raw HTML Injection (`MUST NOT`):** Avoid `dangerouslySetInnerHTML`. If Markdown/HTML rendering is later required for specs/articles, sanitize explicitly with a vetted library (e.g. `DOMPurify`) before rendering.
