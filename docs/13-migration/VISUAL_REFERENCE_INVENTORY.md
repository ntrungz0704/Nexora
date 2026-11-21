# VISUAL REFERENCE INVENTORY & DESIGN AUDIT

- **Reference URL:** `https://techpilot.io.vn/`
- **Audit Timestamp:** 2026-11-19
- **Evidence Storage Directory:** `docs/13-migration/reference-screenshots/`
- **Total Captured Screens:** 35 High-Resolution Screenshots

---

## 1. Visual Evidence Catalog

| Screenshot Name                               | Page / Section                | Key Design & Architectural Observations                                                                                                                                                                                                              |
| --------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `homepage_full.png` / `homepage_desktop.png`  | Homepage (1440x900)           | Top announcement bar (`#0F172A`), sticky header with embedded category search bar, 16-item category sidebar, 16:9 hero carousel, 3 right promo cards, 5-column trust benefit bar, flash sale timer, best-seller tab pills, and 4-column navy footer. |
| `mega_menu_open.png` / `danh_muc_clicked.png` | Mega Menu Flyout              | 3-4 column grid flyout (`bg-white`, `rounded-r-2xl`, `shadow-2xl`) with bold blue subheadings (`THƯƠNG HIỆU`, `GIÁ BÁN`, `CPU INTEL - AMD`, `NHU CẦU SỬ DỤNG`).                                                                                      |
| `homepage_san_pham_noi_bat.png`               | Featured Products Carousel    | 5 visible product cards with spec bullet pills (CPU, RAM, GPU, SSD), discount pill badges, wishlist heart, and green comparison scale buttons.                                                                                                       |
| `homepage_san_pham_ban_chay.png`              | Best Sellers (Default Tab)    | Tab pills: `Laptop` (active solid blue), `Gaming Gear`, `Linh Kiện`, `Màn Hình`, `Phụ Kiện`.                                                                                                                                                         |
| `homepage_ban_chay_gaming_gear.png`           | Best Sellers (Gaming Gear)    | Dynamic tab switching rendering gear accessories and ergonomic chairs.                                                                                                                                                                               |
| `homepage_footer.png`                         | Footer (4 Columns)            | Brand intro + social media icons, "Về chúng tôi" links, "Hỗ trợ khách hàng" links, newsletter signup card + partner badges.                                                                                                                          |
| `search_page.png`                             | Search Results (`/search`)    | Breadcrumb, total count, sort dropdown, faceted filter sidebar (categories, brands, price range, stock status), 4-column product grid, pagination.                                                                                                   |
| `category_laptop.png`                         | Category (`/category/laptop`) | Category breadcrumb, sub-category pills, faceted filter chips (`Sẵn hàng`, `Đang giảm giá`, `Giá`, `Thương hiệu`), responsive catalog.                                                                                                               |
| `cart_page.png`                               | Empty Cart (`/cart`)          | Standalone page with centered empty shopping cart illustration, "Giỏ hàng hiện đang trống", and blue "Tiếp tục mua sắm" CTA.                                                                                                                         |
| `cart_with_items.png`                         | Populated Cart (`/cart`)      | 2-column layout (70% cart items table with quantity steppers + 30% order summary card with total and "Tiến hành thanh toán" CTA).                                                                                                                    |
| `build_pc_page.png`                           | PC Builder (`/build-pc`)      | 12 component rows (CPU, Mainboard, RAM, VGA, SSD, PSU, Case, Cooler, Monitor, Mouse, Keyboard, Chair), PSU wattage calculator sidebar, total price indicator.                                                                                        |
| `build_pc_modal.png`                          | Component Picker Modal        | Component modal with live search, hardware compatibility validation checkmarks (`✓ Tương thích tốt`), spec breakdown, and select button.                                                                                                             |
| `thu_cu_doi_moi_page.png`                     | Trade-In (`/thu-cu-doi-moi`)  | Gradient hero banner, Zalo contact buttons, trade-in value estimator form with component dropdowns, cosmetic condition toggles, accessories checkboxes, and 4-step process guide.                                                                    |
| `auth_login_page.png`                         | Login Page (`/auth/login`)    | Standalone centered authentication card with email/phone input, password input with visibility toggle, remember-me checkbox, forgot password link, Google OAuth CTA, and register redirect.                                                          |

---

## 2. Nexora Implementation Parity Status

1. **Modal / Drawer Elimination:** 100% of routes (`/cart`, `/wishlist`, `/auth/login`, `/auth/register`) operate on dedicated standalone pages matching TechPilot web routing.
2. **Wishlist Auth Protection:** Only authenticated customers can access `/wishlist` or add favorite items; guest clicks redirect to `/auth/login`.
3. **Category Menu Height & Spacing:** Static home sidebar fits within the 560px hero grid without overflowing onto the Service Features bar.
4. **Search Category Normalization:** Enhanced `removeVietnameseTones` helper enables flawless matching across accent marks, spaces, and hyphens.
