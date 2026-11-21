# 01. Complete Directory Tree — Nexora Workspace

- **Root:** `D:\Nexora`
- **Thời điểm quét:** 2026-11-21T18:04:53.926Z
- **Tổng số thư mục active (đã duyệt đệ quy 100%):** 105
- **Tổng số tệp tin active (liệt kê đầy đủ, không dùng `...`):** 602
- **Tổng số thư mục loại trừ (khai báo minh bạch bên dưới):** 9

## 1. Các thư mục bị loại trừ khỏi cây chi tiết

| Đường dẫn tương đối      | Số tệp tin | Số thư mục con | Dung lượng | Lý do loại trừ                    | Phạm vi kiểm tra thay thế                             |
| ------------------------ | ---------: | -------------: | ---------: | --------------------------------- | ----------------------------------------------------- |
| `.git/`                  |      1,716 |            270 |   60.14 MB | Git VCS internals                 | Kiểm tra qua `git status`, `git log`, `git branch -a` |
| `apps/api/dist/`         |         90 |             16 |    0.34 MB | Build output / compiled artifacts | Kiểm tra qua `npm run build` output                   |
| `apps/api/node_modules/` |          2 |              3 |    0.00 MB | Third-party npm dependencies      | Kiểm tra qua `package.json` & `package-lock.json`     |
| `apps/web/dist/`         |        291 |             15 |   55.85 MB | Build output / compiled artifacts | Kiểm tra qua `npm run build` output                   |
| `apps/web/node_modules/` |      4,010 |            310 |   64.50 MB | Third-party npm dependencies      | Kiểm tra qua `package.json` & `package-lock.json`     |
| `node_modules/`          |     19,121 |          1,974 |  545.15 MB | Third-party npm dependencies      | Kiểm tra qua `package.json` & `package-lock.json`     |
| `packages/config/dist/`  |          3 |              0 |    0.00 MB | Build output / compiled artifacts | Kiểm tra qua `npm run build` output                   |
| `packages/shared/dist/`  |          6 |              0 |    0.06 MB | Build output / compiled artifacts | Kiểm tra qua `npm run build` output                   |
| `test-results/`          |          1 |              0 |    0.00 MB | Generated test/runtime output     | Thư mục generated/baseline                            |

> **Lưu ý về baseline `TechPilot/` và `audit-output/`:** Tại thời điểm kiểm toán trên `D:\Nexora`, thư mục `TechPilot/` và `audit-output/` KHÔNG TỒN TẠI trong root workspace `D:\Nexora` (chỉ có quy tắc loại trừ trong `.gitignore`, `.dockerignore`, `eslint.config.js`; đối chiếu Parity dựa trên baseline tài liệu audit gốc trong `docs/13-migration/` và tham chiếu đã lưu).

## 2. Cây thư mục đệ quy đầy đủ (100% Active Files & Directories)

```text
Nexora/
├── .git/ [EXCLUDED: 1716 files, 270 dirs, 60.14 MB]
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   │   └── ci.yml
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── apps/
│   ├── api/
│   │   ├── dist/ [EXCLUDED: 90 files, 16 dirs, 0.34 MB]
│   │   ├── node_modules/ [EXCLUDED: 2 files, 3 dirs, 0.00 MB]
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── errors.ts
│   │   │   │   ├── http.ts
│   │   │   │   └── prisma.ts
│   │   │   ├── config/
│   │   │   │   ├── env.ts
│   │   │   │   └── swagger.ts
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── notFoundHandler.ts
│   │   │   │   └── validateRequest.ts
│   │   │   ├── modules/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── admin.controller.ts
│   │   │   │   │   ├── admin.routes.ts
│   │   │   │   │   └── admin.service.ts
│   │   │   │   ├── ai/
│   │   │   │   │   ├── ai.controller.ts
│   │   │   │   │   ├── ai.routes.ts
│   │   │   │   │   └── ai.service.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.middleware.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   └── auth.service.ts
│   │   │   │   ├── cart/
│   │   │   │   │   ├── cart.controller.ts
│   │   │   │   │   ├── cart.routes.ts
│   │   │   │   │   └── cart.service.ts
│   │   │   │   ├── catalog/
│   │   │   │   │   ├── catalog.controller.ts
│   │   │   │   │   ├── catalog.repository.ts
│   │   │   │   │   ├── catalog.routes.ts
│   │   │   │   │   └── catalog.service.ts
│   │   │   │   ├── email/
│   │   │   │   │   └── email.service.ts
│   │   │   │   ├── marketing/
│   │   │   │   │   ├── marketing.controller.ts
│   │   │   │   │   ├── marketing.routes.ts
│   │   │   │   │   └── marketing.service.ts
│   │   │   │   ├── order/
│   │   │   │   │   ├── order.controller.ts
│   │   │   │   │   ├── order.routes.ts
│   │   │   │   │   └── order.service.ts
│   │   │   │   ├── payment/
│   │   │   │   │   ├── payment.controller.ts
│   │   │   │   │   ├── payment.routes.ts
│   │   │   │   │   └── payment.service.ts
│   │   │   │   ├── system/
│   │   │   │   │   ├── system.controller.ts
│   │   │   │   │   ├── system.repository.ts
│   │   │   │   │   ├── system.routes.ts
│   │   │   │   │   └── system.service.ts
│   │   │   │   └── wishlist/
│   │   │   │       ├── wishlist.controller.ts
│   │   │   │       ├── wishlist.routes.ts
│   │   │   │       └── wishlist.service.ts
│   │   │   ├── routes/
│   │   │   │   └── index.ts
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   ├── app.test.ts
│   │   │   ├── auth_password_reset_security.test.ts
│   │   │   ├── commerce_and_ai.integration.test.ts
│   │   │   ├── db.integration.test.ts
│   │   │   ├── payment_security.test.ts
│   │   │   ├── rbac_and_concurrency.test.ts
│   │   │   ├── seed_and_auth_credentials.test.ts
│   │   │   └── storefront.integration.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── dist/ [EXCLUDED: 291 files, 15 dirs, 55.85 MB]
│       ├── node_modules/ [EXCLUDED: 4010 files, 310 dirs, 64.50 MB]
│       ├── public/
│       │   ├── assets/
│       │   │   ├── banners/
│       │   │   │   ├── components-desktop.webp
│       │   │   │   ├── components-mobile.webp
│       │   │   │   ├── gaming-gear-desktop.webp
│       │   │   │   ├── gaming-gear-mobile.webp
│       │   │   │   ├── laptop-productivity-desktop.webp
│       │   │   │   ├── laptop-productivity-mobile.webp
│       │   │   │   ├── nexora-hero-desktop.webp
│       │   │   │   ├── nexora-hero-mobile.webp
│       │   │   │   ├── nexora-promo-popup.jpg
│       │   │   │   ├── pc-workstation-desktop.webp
│       │   │   │   └── pc-workstation-mobile.webp
│       │   │   ├── css/
│       │   │   │   ├── category-mega-menu.css
│       │   │   │   ├── news.css
│       │   │   │   ├── pc-builder.css
│       │   │   │   ├── search-filters.css
│       │   │   │   └── style.css
│       │   │   ├── favicon/
│       │   │   │   ├── android-icon-144x144.png
│       │   │   │   ├── android-icon-192x192.png
│       │   │   │   ├── android-icon-36x36.png
│       │   │   │   ├── android-icon-48x48.png
│       │   │   │   ├── android-icon-72x72.png
│       │   │   │   ├── android-icon-96x96.png
│       │   │   │   ├── apple-icon-114x114.png
│       │   │   │   ├── apple-icon-120x120.png
│       │   │   │   ├── apple-icon-144x144.png
│       │   │   │   ├── apple-icon-152x152.png
│       │   │   │   ├── apple-icon-180x180.png
│       │   │   │   ├── apple-icon-57x57.png
│       │   │   │   ├── apple-icon-60x60.png
│       │   │   │   ├── apple-icon-72x72.png
│       │   │   │   ├── apple-icon-76x76.png
│       │   │   │   ├── apple-icon-precomposed.png
│       │   │   │   ├── apple-icon.png
│       │   │   │   ├── browserconfig.xml
│       │   │   │   ├── favicon-16x16.png
│       │   │   │   ├── favicon-32x32.png
│       │   │   │   ├── favicon-96x96.png
│       │   │   │   ├── favicon.ico
│       │   │   │   ├── manifest.json
│       │   │   │   ├── ms-icon-144x144.png
│       │   │   │   ├── ms-icon-150x150.png
│       │   │   │   ├── ms-icon-310x310.png
│       │   │   │   └── ms-icon-70x70.png
│       │   │   ├── images/
│       │   │   │   ├── banners/
│       │   │   │   │   └── popup_mega_sale.jpg
│       │   │   │   ├── brands/
│       │   │   │   │   ├── acer.svg
│       │   │   │   │   ├── amd.svg
│       │   │   │   │   ├── asrock.svg
│       │   │   │   │   ├── asus.svg
│       │   │   │   │   ├── colorful.svg
│       │   │   │   │   ├── cooler-master.svg
│       │   │   │   │   ├── corsair.svg
│       │   │   │   │   ├── crucial.svg
│       │   │   │   │   ├── deepcool.svg
│       │   │   │   │   ├── dell.svg
│       │   │   │   │   ├── g-skill.svg
│       │   │   │   │   ├── gigabyte.svg
│       │   │   │   │   ├── hp.svg
│       │   │   │   │   ├── intel.svg
│       │   │   │   │   ├── kingston.svg
│       │   │   │   │   ├── lenovo.svg
│       │   │   │   │   ├── lexar.svg
│       │   │   │   │   ├── lg.svg
│       │   │   │   │   ├── lian-li.svg
│       │   │   │   │   ├── logitech.svg
│       │   │   │   │   ├── montech.svg
│       │   │   │   │   ├── msi.svg
│       │   │   │   │   ├── nvidia.svg
│       │   │   │   │   ├── nzxt.svg
│       │   │   │   │   ├── razer.svg
│       │   │   │   │   ├── samsung.svg
│       │   │   │   │   ├── teamgroup.svg
│       │   │   │   │   ├── thermalright.svg
│       │   │   │   │   ├── wd.svg
│       │   │   │   │   ├── xigmatek.svg
│       │   │   │   │   └── zotac.svg
│       │   │   │   ├── categories/
│       │   │   │   │   ├── apple.png
│       │   │   │   │   ├── category-accessories.png
│       │   │   │   │   ├── category-case.png
│       │   │   │   │   ├── category-chair.png
│       │   │   │   │   ├── category-console.png
│       │   │   │   │   ├── category-cooling.png
│       │   │   │   │   ├── category-cpu.png
│       │   │   │   │   ├── category-headset.png
│       │   │   │   │   ├── category-keyboard.png
│       │   │   │   │   ├── category-laptop.png
│       │   │   │   │   ├── category-mainboard.png
│       │   │   │   │   ├── category-monitor.png
│       │   │   │   │   ├── category-mouse.png
│       │   │   │   │   ├── category-networking.png
│       │   │   │   │   ├── category-office-equipment.png
│       │   │   │   │   ├── category-pc.png
│       │   │   │   │   ├── category-power-bank.png
│       │   │   │   │   ├── category-psu.png
│       │   │   │   │   ├── category-ram.png
│       │   │   │   │   ├── category-speaker.png
│       │   │   │   │   ├── category-storage.png
│       │   │   │   │   ├── category-vga.png
│       │   │   │   │   ├── gaming-gear.png
│       │   │   │   │   ├── networking.png
│       │   │   │   │   └── office-gear.png
│       │   │   │   ├── news/
│       │   │   │   │   ├── news-build-pc.jpg
│       │   │   │   │   ├── news-intel-ultra.jpg
│       │   │   │   │   ├── news-mouse-gaming.jpg
│       │   │   │   │   └── news-rtx-50.jpg
│       │   │   │   ├── placeholders/
│       │   │   │   │   ├── case.png
│       │   │   │   │   ├── cpu.png
│       │   │   │   │   ├── fan.png
│       │   │   │   │   ├── laptop.png
│       │   │   │   │   ├── màn-hình.png
│       │   │   │   │   ├── placeholder-case-1.png
│       │   │   │   │   ├── placeholder-console-1.png
│       │   │   │   │   ├── placeholder-cooling-1.png
│       │   │   │   │   ├── placeholder-cpu-1.png
│       │   │   │   │   ├── placeholder-laptop-1.png
│       │   │   │   │   ├── placeholder-psu-1.png
│       │   │   │   │   ├── placeholder-ssd-1.png
│       │   │   │   │   ├── placeholder-vga-1.png
│       │   │   │   │   ├── psu.png
│       │   │   │   │   ├── ssd.png
│       │   │   │   │   └── vga.png
│       │   │   │   ├── posts/
│       │   │   │   │   ├── cpu_i9_vs_ryzen7.jpg
│       │   │   │   │   ├── laptop_copilot_ai_2026.jpg
│       │   │   │   │   ├── laptop_sinh_vien_2026.jpg
│       │   │   │   │   ├── pc_workstation_ai_deepseek.jpg
│       │   │   │   │   ├── tin-tuc-1.jpg
│       │   │   │   │   ├── tin-tuc-2.jpg
│       │   │   │   │   ├── tin-tuc-3.jpg
│       │   │   │   │   └── windows11_gaming_opt.jpg
│       │   │   │   ├── products/
│       │   │   │   │   ├── 804ad8fc43d409b9fccbb79d721f93c4.png
│       │   │   │   │   ├── placeholder-component.png
│       │   │   │   │   └── placeholder-component.webp
│       │   │   │   ├── review/
│       │   │   │   │   └── unlinked/
│       │   │   │   │       ├── acer-aspire.jpg
│       │   │   │   │       ├── acer-predator.jpg
│       │   │   │   │       ├── asus-vivobook.jpg
│       │   │   │   │       ├── banner-rtx-bg.jpg
│       │   │   │   │       ├── camera.jpg
│       │   │   │   │       ├── camera1.jpg
│       │   │   │   │       ├── camera2.jpg
│       │   │   │   │       ├── camera3.jpg
│       │   │   │   │       ├── case1.jpg
│       │   │   │   │       ├── case2.jpg
│       │   │   │   │       ├── case4.jpg
│       │   │   │   │       ├── core-i5-12400f.jpg
│       │   │   │   │       ├── corsair-k70.jpg
│       │   │   │   │       ├── cpu_1.jpg
│       │   │   │   │       ├── cpu_10.png
│       │   │   │   │       ├── cpu_11.png
│       │   │   │   │       ├── cpu_12.jpg
│       │   │   │   │       ├── cpu_13.jpg
│       │   │   │   │       ├── cpu_14.png
│       │   │   │   │       ├── cpu_15.jpg
│       │   │   │   │       ├── cpu_17.jpg
│       │   │   │   │       ├── cpu_2.jpg
│       │   │   │   │       ├── cpu_37.jpg
│       │   │   │   │       ├── cpu_4.jpg
│       │   │   │   │       ├── cpu_40.jpg
│       │   │   │   │       ├── cpu_5.jpg
│       │   │   │   │       ├── cpu_6.png
│       │   │   │   │       ├── cpu_7.png
│       │   │   │   │       ├── cpu_8.png
│       │   │   │   │       ├── cpu_9.jpg
│       │   │   │   │       ├── cpu_ryzen5.png
│       │   │   │   │       ├── cpu_ryzen7.jpg
│       │   │   │   │       ├── cpu-i5.jpg
│       │   │   │   │       ├── dell-g16.jpg
│       │   │   │   │       ├── dell-inspiron.jpg
│       │   │   │   │       ├── dell-xps-13.jpg
│       │   │   │   │       ├── display.png
│       │   │   │   │       ├── display1.png
│       │   │   │   │       ├── display2.jpg
│       │   │   │   │       ├── display3.jpg
│       │   │   │   │       ├── gaming-pc-mid.jpg
│       │   │   │   │       ├── gaming-pc-ultra.jpg
│       │   │   │   │       ├── hp-omen.jpg
│       │   │   │   │       ├── hp-pavilion.jpg
│       │   │   │   │       ├── keyboard.png
│       │   │   │   │       ├── keyboard1.png
│       │   │   │   │       ├── keyboard2.png
│       │   │   │   │       ├── keyboard3.png
│       │   │   │   │       ├── keychron-k2.jpg
│       │   │   │   │       ├── laptop-gaming.png
│       │   │   │   │       ├── laptop-van-phong.png
│       │   │   │   │       ├── laptop1.png
│       │   │   │   │       ├── laptop2.png
│       │   │   │   │       ├── laptop3.png
│       │   │   │   │       ├── laptop4.png
│       │   │   │   │       ├── lenovo-ideapad.jpg
│       │   │   │   │       ├── lenovo-legion.jpg
│       │   │   │   │       ├── lenovo-thinkpad.jpg
│       │   │   │   │       ├── lg-gram.jpg
│       │   │   │   │       ├── logitech-g-pro-x-wireless.jpg
│       │   │   │   │       ├── logitech-g-pro.jpg
│       │   │   │   │       ├── logitech-g213.jpg
│       │   │   │   │       ├── macbook-air.jpg
│       │   │   │   │       ├── macbook-pro.jpg
│       │   │   │   │       ├── mainboard-tuf.jpg
│       │   │   │   │       ├── monitor-asus-tuf.jpg
│       │   │   │   │       ├── monitor-asus.jpg
│       │   │   │   │       ├── monitor-lg-27.jpg
│       │   │   │   │       ├── msi-vector.jpg
│       │   │   │   │       ├── office-pc-amd.jpg
│       │   │   │   │       ├── office-pc-intel.jpg
│       │   │   │   │       ├── pc-advanced.jpg
│       │   │   │   │       ├── pc-amd.jpg
│       │   │   │   │       ├── pc-basic.jpg
│       │   │   │   │       ├── pc-build-san.png
│       │   │   │   │       ├── pc-build.jpg
│       │   │   │   │       ├── pc-high-end.jpg
│       │   │   │   │       ├── pc-linh-kien.png
│       │   │   │   │       ├── pc-office.jpg
│       │   │   │   │       ├── pc-workstation.jpg
│       │   │   │   │       ├── pc.jpg
│       │   │   │   │       ├── pc1.png
│       │   │   │   │       ├── pc2.png
│       │   │   │   │       ├── pc3.png
│       │   │   │   │       ├── printer-canon.jpg
│       │   │   │   │       ├── prod_621.jpg
│       │   │   │   │       ├── prod_622.jpg
│       │   │   │   │       ├── prod_623.jpg
│       │   │   │   │       ├── prod_624.jpg
│       │   │   │   │       ├── prod_625.png
│       │   │   │   │       ├── prod_626.png
│       │   │   │   │       ├── prod_627.png
│       │   │   │   │       ├── prod_628.png
│       │   │   │   │       ├── prod_629.png
│       │   │   │   │       ├── prod_630.png
│       │   │   │   │       ├── prod_631.png
│       │   │   │   │       ├── prod_632.jpg
│       │   │   │   │       ├── ram-corsair.jpg
│       │   │   │   │       ├── ram.jpg
│       │   │   │   │       ├── ram1.jpg
│       │   │   │   │       ├── ram2.jpg
│       │   │   │   │       ├── ram3.jpg
│       │   │   │   │       ├── razer-deathadder-v3.jpg
│       │   │   │   │       ├── razer-viper.jpg
│       │   │   │   │       ├── rog-ally-x.jpg
│       │   │   │   │       ├── rog-zephyrus.jpg
│       │   │   │   │       ├── router-tplink.jpg
│       │   │   │   │       ├── rtx-4070-super.jpg
│       │   │   │   │       ├── rtx-banner.jpg
│       │   │   │   │       ├── ryzen-5-5600x.jpg
│       │   │   │   │       ├── samsung-odyssey-g5.jpg
│       │   │   │   │       ├── samsung-odyssey.jpg
│       │   │   │   │       └── ssd-samsung.jpg
│       │   │   │   ├── apple-banner-bg.jpg
│       │   │   │   ├── banner-1.jpg
│       │   │   │   ├── banner-1.png
│       │   │   │   ├── banner-2.jpg
│       │   │   │   ├── banner-2.png
│       │   │   │   ├── banner-3.jpg
│       │   │   │   ├── banner-3.png
│       │   │   │   ├── banner-4.jpg
│       │   │   │   ├── banner-build-pc.jpg
│       │   │   │   ├── banner-pay-later.jpg
│       │   │   │   ├── banner-rtx-bg.jpg
│       │   │   │   ├── banner-trade-in.jpg
│       │   │   │   ├── banner.jpg
│       │   │   │   ├── chatbot-avatar.png
│       │   │   │   ├── feature-cod.jpg
│       │   │   │   ├── feature-return.jpg
│       │   │   │   ├── feature-shipping.jpg
│       │   │   │   ├── feature-support.jpg
│       │   │   │   ├── feature-warranty.jpg
│       │   │   │   ├── installment-banner.jpg
│       │   │   │   ├── logo.png
│       │   │   │   ├── logo.svg
│       │   │   │   ├── nexora-icon-128.png
│       │   │   │   ├── nexora-icon.png
│       │   │   │   ├── nexora-logo-white.png
│       │   │   │   ├── nexora-logo.png
│       │   │   │   ├── placeholder.webp
│       │   │   │   ├── promo-banner-1.jpg
│       │   │   │   ├── promo-banner-2.jpg
│       │   │   │   ├── promo-banner-3.jpg
│       │   │   │   ├── rog-banner-bg.jpg
│       │   │   │   └── rtx-banner.jpg
│       │   │   └── js/
│       │   │       ├── admin-notifications.js
│       │   │       ├── brandLogos.js
│       │   │       ├── category-mega-menu.js
│       │   │       ├── live-search.js
│       │   │       ├── main.js
│       │   │       ├── news.js
│       │   │       ├── search-filters.js
│       │   │       └── vietnam-address.js
│       │   ├── favicon-16x16.png
│       │   ├── favicon-32x32.png
│       │   ├── favicon.ico
│       │   └── favicon.svg
│       ├── src/
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   └── providers.tsx
│       │   ├── components/
│       │   │   └── StatusCard.tsx
│       │   ├── features/
│       │   │   ├── admin/
│       │   │   │   └── AdminDashboardPage.tsx
│       │   │   ├── ai/
│       │   │   │   ├── AiAssistantPage.tsx
│       │   │   │   └── FloatingChatbot.tsx
│       │   │   ├── auth/
│       │   │   │   ├── ForgotPasswordPage.tsx
│       │   │   │   ├── LoginPage.tsx
│       │   │   │   ├── RegisterPage.tsx
│       │   │   │   └── ResetPasswordPage.tsx
│       │   │   ├── cart/
│       │   │   │   └── CartPage.tsx
│       │   │   ├── catalog/
│       │   │   │   ├── ProductDetailPage.tsx
│       │   │   │   └── SearchPage.tsx
│       │   │   ├── checkout/
│       │   │   │   ├── CheckoutPage.tsx
│       │   │   │   └── CheckoutSuccessPage.tsx
│       │   │   ├── compare/
│       │   │   │   └── ComparePage.tsx
│       │   │   ├── errors/
│       │   │   │   └── NotFoundPage.tsx
│       │   │   ├── info/
│       │   │   │   ├── AboutPage.tsx
│       │   │   │   ├── CareersPage.tsx
│       │   │   │   ├── ContactPage.tsx
│       │   │   │   ├── GuidePage.tsx
│       │   │   │   └── TechnicalSupportPage.tsx
│       │   │   ├── news/
│       │   │   │   ├── articlesData.ts
│       │   │   │   ├── NewsPage.tsx
│       │   │   │   └── PostDetailPage.tsx
│       │   │   ├── orderTracking/
│       │   │   │   └── OrderTrackingPage.tsx
│       │   │   ├── pcBuilder/
│       │   │   │   └── PcBuilderPage.tsx
│       │   │   ├── policy/
│       │   │   │   └── PolicyPage.tsx
│       │   │   ├── profile/
│       │   │   │   └── ProfilePage.tsx
│       │   │   ├── storefront/
│       │   │   │   ├── AuthModal.tsx
│       │   │   │   ├── BottomFeatures.tsx
│       │   │   │   ├── CategorySidebar.tsx
│       │   │   │   ├── FlashSaleSection.tsx
│       │   │   │   ├── HeroCarousel.tsx
│       │   │   │   ├── ProductCard.tsx
│       │   │   │   ├── ProductCatalogSection.tsx
│       │   │   │   ├── PromoCards.tsx
│       │   │   │   ├── PromoPopup.tsx
│       │   │   │   ├── ServicePolicyBar.tsx
│       │   │   │   ├── StorefrontFooter.tsx
│       │   │   │   ├── StorefrontHeader.tsx
│       │   │   │   └── StorefrontHome.tsx
│       │   │   ├── stores/
│       │   │   │   └── StoresPage.tsx
│       │   │   ├── system/
│       │   │   │   └── FoundationDashboard.tsx
│       │   │   ├── tradeIn/
│       │   │   │   └── TradeInPage.tsx
│       │   │   └── wishlist/
│       │   │       └── WishlistPage.tsx
│       │   ├── hooks/
│       │   │   └── useSystemHealth.ts
│       │   ├── layouts/
│       │   │   └── MainLayout.tsx
│       │   ├── lib/
│       │   │   ├── apiClient.ts
│       │   │   └── productImage.ts
│       │   ├── routes/
│       │   │   └── AppRoutes.tsx
│       │   ├── services/
│       │   │   ├── authService.ts
│       │   │   ├── cartService.ts
│       │   │   ├── storefrontService.ts
│       │   │   ├── systemService.ts
│       │   │   └── wishlistService.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   ├── index.css
│       │   └── main.tsx
│       ├── tests/
│       │   └── FoundationDashboard.test.tsx
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.tsbuildinfo
│       └── vite.config.ts
├── docker/
│   ├── mysql/
│   │   └── 01-dev-grants.sh
│   ├── nginx/
│   │   └── default.conf
│   ├── api.Dockerfile
│   └── web.Dockerfile
├── docs/
│   ├── 12-phase-reports/
│   │   └── FOUNDATION_REMEDIATION_REPORT.md
│   ├── 13-migration/
│   │   ├── final-audit/
│   │   │   ├── API_CONTRACT_AUDIT.md
│   │   │   ├── BUSINESS_LOGIC_CONSISTENCY_AUDIT.md
│   │   │   ├── DATABASE_INTEGRITY_AUDIT.md
│   │   │   ├── FINAL_RELEASE_READINESS.md
│   │   │   ├── FINAL_REMEDIATION_PLAN.md
│   │   │   ├── FINAL_REMEDIATION_REPORT.md
│   │   │   ├── FINAL_SECURITY_REMEDIATION.md
│   │   │   ├── FINAL_TECHNICAL_MIGRATION_AUDIT.md
│   │   │   ├── LEGACY_DEPENDENCY_AUDIT.md
│   │   │   ├── NEW_REPOSITORY_PREPARATION.md
│   │   │   ├── RELEASE_READINESS_REPORT.md
│   │   │   ├── SECURITY_AUDIT.md
│   │   │   ├── SOURCE_CODE_REWRITE_AUDIT.md
│   │   │   ├── TECHNOLOGY_MIGRATION_MATRIX.md
│   │   │   ├── TEST_EVIDENCE_REPORT.md
│   │   │   ├── UPDATED_AUTH_SECURITY_TEST_REPORT.md
│   │   │   ├── UPDATED_BUSINESS_LOGIC_AUDIT.md
│   │   │   ├── UPDATED_DATABASE_INTEGRITY_AUDIT.md
│   │   │   ├── UPDATED_E2E_COVERAGE_REPORT.md
│   │   │   ├── UPDATED_E2E_TEST_REPORT.md
│   │   │   ├── UPDATED_PAYMENT_SECURITY_REPORT.md
│   │   │   └── UPDATED_SECURITY_AUDIT.md
│   │   ├── reference-screenshots/
│   │   │   ├── step_10_shot_1_mega_menu_open.png
│   │   │   ├── step_10.png
│   │   │   ├── step_12_shot_1_homepage_san_pham_noi_bat.png
│   │   │   ├── step_12_shot_2_homepage_san_pham_ban_chay.png
│   │   │   ├── step_12_shot_3_homepage_ban_chay_gaming_gear.png
│   │   │   ├── step_12_shot_4_homepage_footer.png
│   │   │   ├── step_12.png
│   │   │   ├── step_14_shot_1_search_page.png
│   │   │   ├── step_14.png
│   │   │   ├── step_16_shot_1_category_laptop.png
│   │   │   ├── step_16.png
│   │   │   ├── step_18_shot_1_cart_page.png
│   │   │   ├── step_18.png
│   │   │   ├── step_2_shot_1_homepage_full.png
│   │   │   ├── step_2.png
│   │   │   ├── step_20_shot_1_build_pc_page.png
│   │   │   ├── step_20.png
│   │   │   ├── step_22_shot_1_build_pc_modal.png
│   │   │   ├── step_22.png
│   │   │   ├── step_24_shot_1_thu_cu_doi_moi_page.png
│   │   │   ├── step_24.png
│   │   │   ├── step_26_shot_1_auth_login_page.png
│   │   │   ├── step_26.png
│   │   │   ├── step_28_shot_1_product_detail_page.png
│   │   │   ├── step_28_shot_2_added_to_cart.png
│   │   │   ├── step_28_shot_3_cart_with_items.png
│   │   │   ├── step_28.png
│   │   │   ├── step_4_shot_1_homepage_desktop.png
│   │   │   ├── step_4.png
│   │   │   ├── step_43_shot_1_step_39_shot_1_wishlist_redirect.png
│   │   │   ├── step_43_shot_2_step_39_shot_2_cart_standalone.png
│   │   │   ├── step_6.png
│   │   │   ├── step_8_shot_1_danh_muc_clicked.png
│   │   │   ├── step_8_shot_2_laptop_hovered.png
│   │   │   ├── step_8_shot_3_scroll_section_1.png
│   │   │   ├── step_8_shot_4_scroll_section_2.png
│   │   │   └── step_8.png
│   │   ├── A423103_TARGETED_VERIFICATION.md
│   │   ├── ADMIN_FUNCTIONAL_AUDIT.md
│   │   ├── ADMIN_VISUAL_PARITY_REPORT.md
│   │   ├── ANIMATION_SYSTEM_REPORT.md
│   │   ├── API_MIGRATION_MAPPING.md
│   │   ├── DATABASE_MIGRATION_MAPPING.md
│   │   ├── FINAL_ACCEPTANCE_AUDIT.md
│   │   ├── FINAL_MIGRATION_ACCEPTANCE_REPORT.md
│   │   ├── FINAL_PRODUCT_COMPLETION_REPORT.md
│   │   ├── FINAL_TECHPILOT_TO_NEXORA_MIGRATION_REPORT.md
│   │   ├── FUNCTIONAL_PARITY_MATRIX.md
│   │   ├── INFORMATION_AND_SUPPORT_PAGES_REPORT.md
│   │   ├── LEGACY_SOURCE_DEEP_AUDIT.md
│   │   ├── MIGRATION_PROGRESS_REPORT.md
│   │   ├── NEXORA_BANNER_ASSET_REPORT.md
│   │   ├── RESPONSIVE_AND_VISUAL_REGRESSION_REPORT.md
│   │   ├── ROUTE_PARITY_MATRIX.md
│   │   ├── SECURITY_REMEDIATION_REPORT.md
│   │   ├── TAILWIND_MIGRATION_REPORT.md
│   │   ├── TARGETED_PARITY_AUDIT.md
│   │   ├── TECH_STACK_AND_DATABASE_AUDIT.md
│   │   ├── TECHPILOT_DESIGN_SYSTEM_EXTRACTION.md
│   │   ├── TECHPILOT_LEGACY_INVENTORY.md
│   │   ├── TECHPILOT_TO_NEXORA_PARITY_MATRIX.md
│   │   ├── TEST_EVIDENCE_REPORT.md
│   │   ├── VISUAL_REFERENCE_INVENTORY.md
│   │   └── WORKSPACE_BASELINE.md
│   ├── 14-project-inventory/
│   │   ├── 00_MASTER_PROJECT_INVENTORY.md
│   │   ├── 01_ARCHITECTURE_AND_MODULAR_MONOLITH.md
│   │   ├── 02_BACKEND_EXPRESS_API_AND_SERVICES.md
│   │   ├── 03_DATABASE_PRISMA_MYSQL_SCHEMA.md
│   │   ├── 04_FRONTEND_REACT_VITE_TAILWIND.md
│   │   ├── 05_COMMERCE_CART_CHECKOUT_ORDERS.md
│   │   ├── 06_STOREFRONT_CATALOG_AND_PERSONA.md
│   │   ├── 07_ADMIN_MANAGEMENT_PORTAL.md
│   │   ├── 08_SECURITY_RBAC_AND_DATA_PROTECTION.md
│   │   ├── 09_PAYMENT_AND_TRANSACTION_SAFETY.md
│   │   ├── 10_ASSETS_BRANDING_AND_BANNERS.md
│   │   ├── 11_SUPPORT_AND_COMMUNICATION_SYSTEM.md
│   │   ├── 12_TESTING_AND_QUALITY_ASSURANCE.md
│   │   ├── 13_DEVOPS_DOCKER_AND_CI_CD.md
│   │   ├── 14_MIGRATION_FROM_TECHPILOT.md
│   │   └── 15_FINAL_AUDIT_SUMMARY.md
│   ├── api/
│   │   └── API_CONVENTIONS.md
│   ├── architecture/
│   │   ├── ADR/
│   │   │   ├── ADR-0001-modular-monolith-and-official-stack.md
│   │   │   ├── ADR-0002-single-vendor-store-model.md
│   │   │   └── README.md
│   │   ├── MODULE_BOUNDARIES.md
│   │   ├── NEXORA_ARCHITECTURE.md
│   │   └── SYSTEM_ARCHITECTURE.md
│   ├── database/
│   │   ├── DATA_DICTIONARY.md
│   │   ├── ERD.md
│   │   ├── NEXORA_DATABASE_FOUNDATION.md
│   │   └── README.md
│   ├── evidence/
│   │   └── parity_verification_v3/
│   │       ├── 01_hero_category_aligned.png
│   │       ├── 02_may_tinh_dong_bo_1_row.png
│   │       ├── 03_brand_marquee_track.png
│   │       ├── 04_pc_builder_cpu_filtered.png
│   │       └── 05_compare_table_full_text.png
│   ├── governance/
│   │   ├── AI_AGENT_WORKING_RULES.md
│   │   ├── AUDIT_DOCUMENT_REVIEW.md
│   │   ├── DECISION_LOG.md
│   │   ├── DEFINITION_OF_DONE.md
│   │   ├── ENGINEERING_PRINCIPLES.md
│   │   ├── PROJECT_CHARTER.md
│   │   ├── PROJECT_RULES_SETUP_REPORT.md
│   │   └── PROJECT_SCOPE.md
│   ├── migration/
│   │   └── LEGACY_TO_NEXORA_MIGRATION_MATRIX.md
│   ├── project/
│   │   ├── CHANGELOG.md
│   │   ├── NEXORA_ENVIRONMENT_AUDIT.md
│   │   ├── PHASE_0_MIGRATION_PREPARATION.md
│   │   ├── PHASE_1_FOUNDATION_REPORT.md
│   │   ├── PHASE_2_GITHUB_REPORT.md
│   │   ├── PHASE_STATUS.md
│   │   ├── ROADMAP.md
│   │   └── TECHPILOT_REUSE_INVENTORY.md
│   ├── security/
│   │   └── README.md
│   ├── standards/
│   │   ├── API_DESIGN_RULES.md
│   │   ├── ARCHITECTURE_RULES.md
│   │   ├── BACKEND_RULES.md
│   │   ├── DATABASE_RULES.md
│   │   ├── DOCUMENTATION_RULES.md
│   │   ├── FRONTEND_RULES.md
│   │   ├── GIT_WORKFLOW.md
│   │   ├── MIGRATION_RULES.md
│   │   ├── SECURITY_RULES.md
│   │   └── TESTING_RULES.md
│   └── README.md
├── node_modules/ [EXCLUDED: 19121 files, 1974 dirs, 545.15 MB]
├── packages/
│   ├── config/
│   │   ├── dist/ [EXCLUDED: 3 files, 0 dirs, 0.00 MB]
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── dist/ [EXCLUDED: 6 files, 0 dirs, 0.06 MB]
│       ├── src/
│       │   ├── index.ts
│       │   └── personaScoring.ts
│       ├── tests/
│       │   ├── personaScoring.test.ts
│       │   └── shared.test.ts
│       ├── package.json
│       └── tsconfig.json
├── prisma/
│   ├── migrations/
│   │   ├── 20261118162807_init_foundation/
│   │   │   └── migration.sql
│   │   ├── 20261118175000_rename_user_role_seller_to_staff/
│   │   │   └── migration.sql
│   │   ├── 20261119044649_init_storefront_and_catalog/
│   │   │   └── migration.sql
│   │   ├── 20261119070000_add_orders_coupons_inventory_ai_models/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
├── test-results/ [EXCLUDED: 1 files, 0 dirs, 0.00 MB]
├── tests/
│   ├── e2e/
│   │   ├── foundation.spec.ts
│   │   └── storefront_journeys.spec.ts
│   ├── playwright.config.ts
│   ├── take_all_pages_screenshots.js
│   └── take_screenshots.js
├── .dockerignore
├── .editorconfig
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── .prettierrc
├── AGENTS.md
├── docker-compose.yml
├── eslint.config.js
├── GEMINI.md
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.base.json
└── vitest.config.ts
```
