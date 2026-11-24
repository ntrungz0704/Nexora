# NEXORA — FRONTEND & TECHPILOT PARITY AUDIT
**Document Version:** 1.0.0  
**Audit Scope:** React 19 Frontend, UI/UX, Design Tokens & TechPilot Feature Parity (Stage 2)  
**Date:** 2026-11-23  
**Auditor:** Principal Frontend Architect & Senior UI/UX Auditor  
**Workspace Root:** `D:\Nexora`  
**Frontend Framework:** React 19, Vite, Tailwind CSS 4, TanStack Query, React Hook Form, Zod  

---

## 1. Frontend Route Map & Page Inventory

Nexora's frontend architecture is structured across 15 high-level routes defined in `apps/web/src/App.tsx`:

| Path | Component / Feature | Access Policy | Verified TechPilot Parity |
|---|---|:---:|:---:|
| `/` | `StorefrontPage` (Hero, 20 Categories, Best Sellers, Sliders, Tech News, AI Hub) | Public | ✅ Full Parity (All 20 PNG category icons restored) |
| `/search` | `SearchPage` (Multi-facet filter, categories sidebar, price ranges, brand filter) | Public | ✅ Full Parity (Fixed sidebar deduplication) |
| `/product/:idOrSlug`| `ProductDetailPage` (Specs accordion, image gallery, reviews, related products) | Public | ✅ Full Parity (M4 verified purchase reviews) |
| `/cart` | `CartPage` (Dedicated cart management, quantity stepper, coupon box) | Public | ✅ Full Parity (M3/M6.1 guest-to-customer merge) |
| `/checkout` | `CheckoutPage` (Address picker, VNPay / COD payment, order summary) | Customer | ✅ Full Parity (M6.2 address book integration) |
| `/account/profile` | `CustomerProfilePage` (Profile, Address Book CRUD, Notifications, Password) | Customer | ✅ Full Parity (M6.2 4-in-1 account hub) |
| `/orders` | `OrderHistoryPage` (Status tracking stepper, order search, details modal) | Customer | ✅ Full Parity |
| `/returns` | `ReturnListPage` (M5 customer return requests, tracking, status badges) | Customer | ✅ Full Parity |
| `/wishlist` | `WishlistPage` (Customer saved hardware items, move-to-cart action) | Customer | ✅ Full Parity (Customer isolation enforced) |
| `/compare` | `ComparePage` (Side-by-side hardware spec comparison, 100-pt AI scoring) | Public | ✅ Full Parity (Exact scoring algorithm parity) |
| `/build-pc` | `PcBuilderPage` (10-component configurator, PSU wattage & socket checks) | Public | ✅ Full Parity |
| `/news` | `NewsPage` (Hardware news listing, search, category pills, distinct covers) | Public | ✅ Full Parity (Unique cover images per post) |
| `/post/:slug` | `PostDetailPage` (Rich article body, safe HTML formatting, related articles) | Public | ✅ Full Parity (Zero raw `<p>` tags) |
| `/ai-assistant` | `AiAssistantPage` (5-question survey, 3 hardware build recommendations) | Public | ✅ Full Parity |
| `/admin` | `AdminDashboardPage` (Orders, Stock adjustments with 7 reasons, Audit logs) | Staff/Admin | ✅ Full Parity (RBAC protected) |

---

## 2. TechPilot Parity & Visual Audit Findings

### 2.1. Circular Category Strip (Parity Restoration)
- **TechPilot Reference (Image 4):** Displayed 20 round category images on transparent backgrounds with smooth hover elevation.
- **Defect Identified (Image 3):** Nexora previously loaded dynamic slugs that 404'd, falling back to FontAwesome icons.
- **Resolution:** Re-anchored to the 20 official PNG assets in `apps/web/public/assets/images/categories/category-<slug>.png`. Hover scale `1.08` and elevation restored.

### 2.2. Product Sliders & Arrow Navigation
- **TechPilot Reference (Image 5):** Allowed horizontal scrolling across 10-15 products with left/right buttons.
- **Defect Identified:** Slices were previously hardcoded to 5 items (`.slice(0, 5)`), making scrolling impossible since 5 items already filled the viewport width.
- **Resolution:** Expanded slice count to 15 items; enhanced `ProductSliderRow` button z-index and smooth `scrollBy` distance.

### 2.3. News Articles & HTML Rendering
- **Defect Identified (Image 1, 2, 7):**
  - All news cards displayed the same blue CPU image.
  - Article detail literally rendered `<p>` and `</p>` tags as raw text strings.
- **Resolution:**
  - Seeded 8 distinct articles with unique high-resolution hardware cover images.
  - Implemented safe HTML paragraph rendering via `dangerouslySetInnerHTML` in `PostDetailPage.tsx`.
  - Stripped all HTML and summary markers from excerpts in `NewsPage.tsx` and `ProductCatalogSection.tsx`.

### 2.4. Catalog Search Sidebar (Image `media_1795366198661_c5c61ca8.png`)
- **Defect Identified:** Duplicate category listings ("Ổ cứng SSD & HDD" and "Ổ cứng", "Bàn phím" twice) and simultaneous blue highlighting of multiple categories.
- **Resolution:**
  - Implemented `sidebarCategories` filtering out legacy duplicate alias slugs.
  - Fixed `isCatActive()` logic to only activate exact matching categories or 1-to-1 aliases.
  - Added `CATEGORY_DEFAULT_ICONS` for crisp FontAwesome iconography across all 21 categories.

---

## 3. Accessibility & Responsive Verification

- **Color Contrast:** Primary `#0A5BFF` on white surface exceeds WCAG 2.1 AA (contrast ratio > 4.5:1).
- **Responsive Breakpoints:**
  - Desktop (> 1024px): 10 columns for category strip, 5 columns for product grid.
  - Tablet (640px - 1024px): 5 columns for category strip, 3 columns for product grid.
  - Mobile (< 640px): 3 columns for category strip, 2 columns for product grid.
- **Semantic HTML:** Correct usage of `<header>`, `<main>`, `<aside>`, `<section>`, `<footer>`, `<nav>`, `<article>`, and `<h1>`-`<h4>` hierarchy.
