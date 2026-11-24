# NEXORA — REMEDIATION CHANGELOG
**Document Version:** 1.0.0  
**Audit Scope:** Controlled Remediation Execution (Stage 4)  
**Date:** 2026-11-23  
**Auditor:** Principal Software Architect & Senior Full-Stack Engineer  
**Workspace Root:** `D:\Nexora`  
**Git Baseline:** `b5ba48b0d74a7e5246828e3ef06f5a4cf05288b1` (`main`)  

---

## 1. Summary of Executed Controlled Remediations

All remediations were executed in strict compliance with the **Controlled Remediation Rules (Section 19 & 20)**:
- 0 changes to applied migrations.
- 0 changes to Phase B API contracts.
- 0 changes to single-vendor business rules.
- 0 breaking changes to test invariants.

---

## 2. Itemized Remediation Details

### FIX-DUP-01: Catalog Search Sidebar Category Duplication & Active Multi-Highlight
- **Issue ID:** `ISSUE-P2-01`
- **Files Modified:** `apps/web/src/features/catalog/SearchPage.tsx`
- **Symptom:** In Image `media_1795366198661_c5c61ca8.png`, sidebar displayed duplicate categories ("Bàn phím" twice, "Chuột" twice, "Ổ cứng" twice, "Tai nghe" twice). When viewing `/search?cat=gaming-gear`, both "Bàn phím" and "Chuột" were highlighted simultaneously in blue.
- **Root Cause:**
  1. Database held both the 21 primary TechPilot categories and 15 legacy seed alias categories.
  2. `SearchPage.tsx` mapped all categories without filtering out alias slugs.
  3. `isActive` check used `.includes(cleanCat)` on parent virtual groups, marking all child items active at once.
- **Fix Applied:**
  1. Defined `sidebarCategories` filtering out legacy duplicate alias slugs (`ban-phim`, `chuot-lot-chuot`, `tai-nghe`, `o-cung`, etc.).
  2. Refactored `isCatActive()`: highlights only exact matches or 1-to-1 aliases, preventing virtual groups from mass-activating child buttons.
  3. Added `CATEGORY_DEFAULT_ICONS` map for crisp FontAwesome iconography across all 21 categories.
- **Verification:** Verified via live browser subagent; sidebar displays 100% unique categories, clicking "Bàn phím" highlights only "Bàn phím", heading displays "Tìm thấy 31 mẫu sản phẩm phù hợp".

---

### FIX-NEWS-01: News Cards Image Duplication & Literal `<p>` Tag Escaping
- **Issue ID:** `ISSUE-P2-02`
- **Files Modified:** 
  - `apps/web/src/features/news/PostDetailPage.tsx`
  - `apps/web/src/features/news/NewsPage.tsx`
  - `apps/web/src/features/storefront/ProductCatalogSection.tsx`
- **Symptom (Images 1, 2, 7):**
  - All news cards displayed the same blue CPU image (`tin-tuc-1.jpg`).
  - Article detail literally rendered `<p>` and `</p>` tags as text strings on screen.
- **Root Cause:**
  1. Database posts had non-existent paths that triggered `onError` to fall back to the same image.
  2. `PostDetailPage.tsx` wrapped pre-formatted HTML paragraphs in extra `<p>` tags.
- **Fix Applied:**
  1. Seeded 8 distinct articles with unique high-resolution hardware cover images.
  2. Implemented safe HTML paragraph rendering via `dangerouslySetInnerHTML` in `PostDetailPage.tsx`.
  3. Stripped HTML and summary markers from excerpts across all news listing components.
  4. Implemented `NEWS_FALLBACK_IMAGES` rotating fallback array so cards never share an image even on network error.
- **Verification:** Verified in browser; distinct cover images displayed across homepage and `/news`, article body renders formatted paragraphs with 0 raw `<p>` tags.

---

### FIX-CAT-01: Circular Category Strip PNG Restoration & TechPilot Rebranding
- **Issue ID:** `ISSUE-P2-03`
- **Files Modified:** 
  - `apps/web/src/features/storefront/ProductCatalogSection.tsx`
  - MySQL `Category` table
- **Symptom (Image 3 vs 4):**
  - Homepage category strip displayed FontAwesome icons instead of the 20 round PNG product images from TechPilot.
  - "PC TechPilot" appeared as a category label.
- **Root Cause:**
  - Component tried to construct image URLs from dynamic database slugs (`category-main-cpu-vga.png`), triggering 404s and falling back to icon glyphs.
- **Fix Applied:**
  - Set `categoryItems = POPULAR_CATEGORIES` referencing the 20 official PNG assets in `apps/web/public/assets/images/categories/`.
  - Rebranded category in database from `PC TechPilot` to `PC Nexora` / `PC`.
- **Verification:** Verified via browser subagent; all 20 PNG product images render cleanly with smooth hover elevation matching TechPilot Image 4.

---

### FIX-SLIDE-01: Product Slider Arrow Navigation & Carousel Slices
- **Issue ID:** `ISSUE-P2-04`
- **Files Modified:** `apps/web/src/features/storefront/ProductCatalogSection.tsx`
- **Symptom (Image 5):**
  - "Sản phẩm mới về" had left `<` and right `>` arrows, but clicking them did not scroll across products.
- **Root Cause:**
  - Product array was sliced to only 5 products (`.slice(0, 5)`). Because 5 cards filled the viewport width exactly, `scrollWidth === clientWidth`, leaving no hidden items to scroll to.
- **Fix Applied:**
  - Expanded product slices to 15 products (`.slice(0, 15)`) across new arrivals, laptops, PCs, components, monitors, and gear.
  - Enhanced `scroll` method in `ProductSliderRow` to scroll by 80% viewport width smoothly.
  - Added button hover animations, higher `z-index: 20`, and visible pointer interactions.
- **Verification:** Verified via browser subagent; right arrow scrolls smoothly (+1104px) across 15 products; left arrow scrolls smoothly back to origin.

---

### FIX-DB-01: Full TechPilot Catalog Database Import
- **Issue ID:** `ISSUE-P1-01`
- **Files Created:** `prisma/seed_techpilot_full.ts`
- **Symptom (Image 6):**
  - Searching `/category/thiet-bi-van-phong` returned "Tìm thấy 0 mẫu sản phẩm phù hợp".
- **Root Cause:**
  - Database only contained 23 baseline test products for laptop/components and zero office equipment or power bank products.
- **Fix Applied:**
  - Parsed `TechPilot/database/seed_dev.sql` and imported:
    - 651 products (specs JSON, price, salePrice, stockQuantity, status ACTIVE).
    - 21 categories & 30 brands.
    - 500 product images.
    - Replaced all "TechPilot" strings with "Nexora".
  - Mapped virtual group `thiet-bi-van-phong` in `SearchPage.tsx` to include `office-equipment` and `power-bank`.
- **Verification:** `/search?cat=thiet-bi-van-phong` now displays 65 products (31 office printers/scanners, 31 power banks, plus accessories) with 100% working subcategory filters.
