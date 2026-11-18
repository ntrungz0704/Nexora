# TechPilot Selective Reuse Inventory (Phase 0 Migration Plan)

- **Status:** `Approved`
- **Last Updated:** `2026-11-18`
- **Scope:** Exact inventory of legacy `TechPilot` components earmarked for future TypeScript porting vs permanent exclusion. _(No business modules are ported during Phase 1 Foundation.)_

---

## 1. Eligible Logic & Curated Assets (Port Later via TypeScript Rewrite)

| TechPilot Source Artifact                                                                                                         | Target Nexora Phase & Module            | Reuse Method & Required Fix During Port                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/product-spec-schemas.php` (20 hardware schemas) & `ProductSpecPresenter`, `ProductSpecNormalizer`, `ProductSpecValidator` | Phase 4 (`catalog` + `@nexora/shared`)  | Convert PHP registry into strict TypeScript schemas/Zod definitions; write Vitest unit tests.                                                     |
| `config/product-facets.php` & `ProductFacetService.php`                                                                           | Phase 4 (`catalog`)                     | Rewrite strict allowlisted query-filter engine into TypeScript + Prisma safely.                                                                   |
| `config/product-comparison.php` & `ProductComparisonService.php`                                                                  | Phase 8 (`ai-advisor` / `catalog`)      | Adapt persona comparison matrix to TypeScript & Product Variants/SKUs.                                                                            |
| `app/services/PcCompatibilityService.php`                                                                                         | Phase 8 (`ai-advisor`)                  | Keep PSU 30%-headroom & socket/DDR compatibility math; **discard `PcBuilderController` hardcoded `category_id` `3..14`**.                         |
| `app/services/FlashSaleService.php` & `InventoryService.php`                                                                      | Phase 5–6 (`inventory`, `promotions`)   | Port atomic reservation (`reserved -> committed -> released`) & idempotent movement concepts to Prisma `$transaction`; add FIFO/MWAC cost layers. |
| `app/services/AiService.php` failover logic                                                                                       | Phase 8 (`ai-advisor`)                  | Rewrite Gemini -> Groq -> Qwen failover in TypeScript; fix `provider` vs `active_provider` mismatch; strip arbitrary SSRF URL fetching.           |
| `public/assets/images/brands/*.svg` & `config/brand-logo-sources.php` (30 brand logos)                                            | Phase 4 (`catalog`)                     | Copy ONLY verified clean SVGs (`~10 KB` total) after validating SHA-256 provenance.                                                               |
| `public/assets/js/vietnam-address.js` district/ward dataset & `+84` helper pattern                                                | Phase 3 (`identity` / `@nexora/shared`) | Port clean administrative data & `+84` Zod validator into TypeScript/React.                                                                       |

---

## 2. Permanently Excluded Artifacts (`MUST NOT` Carry Over)

- `TechPilot/.git/` history (contains sandbox VNPay keys in commit `31814ed` & dev history)
- `TechPilot/config/vnpay.php` (hardcoded credentials), `TechPilot/app/models/User.php:108-110` (password equivalence backdoor), `TechPilot/config/database.php:68` (SSL cert bypass)
- `TechPilot/database/seed_dev.sql` real personal PII (`orders:561`, `user_addresses:856`) and corrupted `categories` hierarchy (`parent_id = 4` on IDs `10..18`)
- `TechPilot/app/core/*`, all 27 PHP controllers, all 78 PHP `.php` views (including 2,374-line `footer.php`), `Product::getSampleProducts()` fake catalog fallback, `CartService` `100000` mock price fallback
- Dead code: `RateLimiter.php`, `ProductKnowledgeService.php`, `NewsSeederService.php`, `app/data/category-menu.php`, `app/views/components/category-menu.php`, `scripts/*.php`
- ~32+ MB of unreferenced/duplicate media (`public/assets/images/review/unlinked/` 113 files, `banner-1..3.png` 18.24 MB, 27 orphan favicon files, byte-identical duplicate PNG placeholders)
