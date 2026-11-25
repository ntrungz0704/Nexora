import { describe, expect, it } from 'vitest';
import type { ProductDto } from '@nexora/shared';
import { DEFAULT_PRODUCT_FALLBACK_IMAGE, getProductImage } from '../src/lib/productImage';

const makeProduct = (overrides: Partial<ProductDto>): Partial<ProductDto> => ({
  id: 1000,
  categoryId: 1,
  name: 'Generic Product',
  slug: 'generic-product',
  sku: 'GEN-1000',
  price: '1000000',
  stockQuantity: 10,
  isFeatured: false,
  isHot: false,
  status: 'ACTIVE',
  thumbnailUrl: null,
  ...overrides,
});

describe('DEF-RT-01: getProductImage deterministic product mapping', () => {
  it('1. identifies real printers correctly via structured category and fallback keywords', () => {
    const canonByCategory = makeProduct({
      name: 'Máy in Laser HP Office-OF1 Đơn năng wifi A4',
      slug: 'may-in-laser-hp-office-of1',
      category: { id: 86, name: 'Thiết bị văn phòng', slug: 'office-equipment' },
    });
    const printerWithoutCategory = makeProduct({
      name: 'Máy in phun màu Epson EcoTank L3250',
      slug: 'may-in-epson-l3250',
      category: undefined,
    });

    expect(getProductImage(canonByCategory)).toBe(
      '/assets/images/review/unlinked/printer-canon.jpg',
    );
    expect(getProductImage(printerWithoutCategory)).toBe(
      '/assets/images/review/unlinked/printer-canon.jpg',
    );
  });

  it('2. does NOT misclassify monitors containing "inch" or "gaming" as printers', () => {
    const monitorWithCat = makeProduct({
      name: 'Màn hình ASUS Model-M1 27 inch 2560x1440 2K 144Hz',
      slug: 'man-hinh-asus-model-m1-27-inch-2560x1440-2k-144hz',
      category: { id: 70, name: 'Màn hình', slug: 'monitor' },
      brand: { id: 1, name: 'ASUS', slug: 'asus' },
    });
    const monitorNoCat = makeProduct({
      name: 'Màn hình ViewSonic Gaming 27 inch 180Hz',
      slug: 'man-hinh-viewsonic-gaming-27-inch-180hz',
      category: undefined,
    });

    const imgWithCat = getProductImage(monitorWithCat);
    const imgNoCat = getProductImage(monitorNoCat);
    expect(imgWithCat).not.toBe('/assets/images/review/unlinked/printer-canon.jpg');
    expect(imgNoCat).not.toBe('/assets/images/review/unlinked/printer-canon.jpg');
    expect(imgWithCat).toBe('/assets/images/review/unlinked/display.png');
    expect(imgNoCat).toBe('/assets/images/review/unlinked/prod_622.jpg');
  });

  it('3. does NOT misclassify cooling products containing "Cooling" as printers', () => {
    const coolerWithCat = makeProduct({
      name: 'Tản nhiệt Thermalright Frost-CL1 Air Cooling RGB',
      slug: 'tan-nhiet-thermalright-frost-cl1-air-cooling-rgb',
      category: { id: 77, name: 'Tản nhiệt', slug: 'cooling' },
    });
    const coolerNoCat = makeProduct({
      name: 'Tản nhiệt nước AIO DeepCool Cooling 360mm',
      slug: 'tan-nhiet-aio-deepcool-cooling-360mm',
      category: undefined,
    });

    expect(getProductImage(coolerWithCat)).toBe('/assets/images/placeholders/fan.png');
    expect(getProductImage(coolerNoCat)).toBe('/assets/images/placeholders/fan.png');
  });

  it('4. does NOT misclassify PC / Gaming systems containing "Gaming" or "Intel" as printers or VGA', () => {
    const pcRyzen = makeProduct({
      name: 'PC Nexora Gaming P1 AMD Ryzen 5 7600X RTX 4070 Super',
      slug: 'pc-nexora-gaming-p1-amd-ryzen-5-7600x-rtx-4070-super',
      category: { id: 69, name: 'PC Nexora', slug: 'pc' },
    });
    const pcIntel = makeProduct({
      name: 'PC Nexora Gaming P2 Intel Core i5-14400F RTX 4060',
      slug: 'pc-nexora-gaming-p2-intel-core-i5-14400f-rtx-4060',
      category: { id: 69, name: 'PC Nexora', slug: 'pc' },
    });
    const pcNoCat = makeProduct({
      name: 'PC Gaming Creator Workstation RTX 4080 Intel i9',
      slug: 'pc-gaming-creator-workstation',
      category: undefined,
    });

    expect(getProductImage(pcRyzen)).toBe('/assets/images/review/unlinked/pc-advanced.jpg');
    expect(getProductImage(pcIntel)).toBe('/assets/images/review/unlinked/pc-advanced.jpg');
    expect(getProductImage(pcNoCat)).toBe('/assets/images/review/unlinked/pc-workstation.jpg');
  });

  it('5. does NOT misclassify speakers / microphones containing "vi tính" or "mini" as printers', () => {
    const speaker = makeProduct({
      name: 'Loa vi tính Logitech Bass-SP1 2.1 Bluetooth 60W',
      slug: 'loa-vi-tinh-logitech-bass-sp1-21-bluetooth-60w',
      category: { id: 83, name: 'Loa', slug: 'speaker' },
    });
    const speakerNoCat = makeProduct({
      name: 'Loa Bluetooth Gaming Mini RGB 2.0',
      slug: 'loa-bluetooth-gaming-mini',
      category: undefined,
    });

    expect(getProductImage(speaker)).toBe('/assets/images/categories/category-speaker.png');
    expect(getProductImage(speakerNoCat)).toBe('/assets/images/categories/category-speaker.png');
  });

  it('6. does NOT map handheld consoles with Ryzen or placeholder-console-1 to CPU chip images', () => {
    const consoleWithPlaceholder = makeProduct({
      name: 'Máy chơi game cầm tay ASUS Console-CN1 Ryzen Z1 Extreme 1TB',
      slug: 'may-choi-game-cam-tay-asus-console-cn1-ryzen-z1-extreme-1tb',
      thumbnailUrl: '/assets/images/placeholders/placeholder-console-1.png',
      category: { id: 84, name: 'Console', slug: 'console' },
      specs: {
        category_slug: 'console',
        specs: { platform: 'Handheld PC', cpu_model: 'AMD Ryzen Z1 Extreme' },
      },
    });
    const consoleNoCat = makeProduct({
      name: 'Máy chơi game cầm tay Lenovo Legion Go Ryzen Z1 Extreme',
      slug: 'lenovo-legion-go-ryzen-z1-extreme',
      category: undefined,
    });

    const img1 = getProductImage(consoleWithPlaceholder);
    const img2 = getProductImage(consoleNoCat);
    expect(img1).toBe('/assets/images/review/unlinked/rog-ally-x.jpg');
    expect(img2).toBe('/assets/images/review/unlinked/rog-ally-x.jpg');
    expect(img1).not.toContain('cpu_ryzen');
    expect(img2).not.toContain('cpu_ryzen');
  });

  it('7. maps real Ryzen CPUs accurately via category, specs, and non-console CPU fallback', () => {
    const cpuByCat = makeProduct({
      name: 'CPU AMD Ryzen 5 7600X-C2 Box',
      slug: 'cpu-amd-ryzen-5-7600x-c2-box',
      category: { id: 72, name: 'CPU', slug: 'cpu' },
      brand: { id: 15, name: 'AMD', slug: 'amd' },
    });
    const cpuNoCat = makeProduct({
      name: 'CPU AMD Ryzen 7 7800X3D AM5',
      slug: 'cpu-amd-ryzen-7-7800x3d',
      category: undefined,
    });

    expect(getProductImage(cpuByCat)).toBe('/assets/images/review/unlinked/cpu_ryzen7.jpg');
    expect(getProductImage(cpuNoCat)).toBe('/assets/images/review/unlinked/cpu_ryzen7.jpg');
  });

  it('8. falls back safely when category, specs, or product are missing without throwing', () => {
    expect(getProductImage(undefined)).toBe(DEFAULT_PRODUCT_FALLBACK_IMAGE);
    expect(
      getProductImage(
        makeProduct({
          name: 'Sản phẩm phần cứng mới ra mắt',
          slug: 'san-pham-moi',
          category: undefined,
          brand: undefined,
          specs: null,
        }),
      ),
    ).toBe(DEFAULT_PRODUCT_FALLBACK_IMAGE);

    // Structured specs inference when category relation is missing
    expect(
      getProductImage(
        makeProduct({
          name: 'Model X123',
          slug: 'model-x123',
          category: undefined,
          specs: { specs: { platform: 'Handheld PC' } },
        }),
      ),
    ).toBe('/assets/images/review/unlinked/rog-ally-x.jpg');
  });

  it('9. keeps overlapping keywords isolated across categories (Kingston, Laptop, PSU, Chair, Broken thumbs)', () => {
    const ramKingston = makeProduct({
      name: 'RAM Kingston Fury Beast 16GB DDR5',
      slug: 'ram-kingston-fury-beast-16gb-ddr5',
      category: { id: 74, name: 'RAM', slug: 'ram' },
    });
    const ssdKingston = makeProduct({
      name: 'SSD Kingston NV2 1TB PCIe 4.0',
      slug: 'ssd-kingston-nv2-1tb',
      category: { id: 75, name: 'Ổ cứng', slug: 'storage' },
    });
    const powerBankFastLaptop = makeProduct({
      name: 'Pin sạc dự phòng Anker Power-PB1 10000mAh 65W Sạc nhanh Laptop',
      slug: 'pin-sac-du-phong-anker-65w-sac-nhanh-laptop',
      category: { id: 87, name: 'Sạc dự phòng', slug: 'power-bank' },
    });
    const powerBankNoCat = makeProduct({
      name: 'Pin sạc dự phòng Baseus 20000mAh Sạc nhanh Laptop',
      slug: 'sac-du-phong-baseus',
      category: undefined,
    });
    const psuCorsair = makeProduct({
      name: 'Nguồn PSU Corsair Power-PS1 650W 80 Plus Gold',
      slug: 'nguon-psu-corsair-650w',
      category: { id: 78, name: 'Nguồn', slug: 'psu' },
    });
    const chairWithMissingThumb = makeProduct({
      id: 15,
      name: 'Ghế công thái học Ergonomic Sihoo Doro C300',
      slug: 'ghe-sihoo-c300',
      thumbnailUrl: '/assets/images/review/unlinked/chair-warrior.jpg',
      category: { id: 81, name: 'Ghế', slug: 'chair' },
    });

    expect(getProductImage(ramKingston)).toBe('/assets/images/review/unlinked/ram.jpg');
    expect(getProductImage(ssdKingston)).toBe('/assets/images/placeholders/ssd.png');
    expect(getProductImage(powerBankFastLaptop)).toBe(
      '/assets/images/categories/category-power-bank.png',
    );
    expect(getProductImage(powerBankNoCat)).toBe(
      '/assets/images/categories/category-power-bank.png',
    );
    expect(getProductImage(psuCorsair)).toBe('/assets/images/placeholders/psu.png');
    expect(getProductImage(chairWithMissingThumb)).toBe(
      '/assets/images/categories/category-chair.png',
    );
  });
});
