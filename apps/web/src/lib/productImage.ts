import type { ProductDto } from '@nexora/shared';

export const DEFAULT_PRODUCT_FALLBACK_IMAGE = '/assets/images/placeholder.webp';

type NormalizedCategory =
  | 'laptop'
  | 'laptop-gaming'
  | 'pc'
  | 'monitor'
  | 'mainboard'
  | 'cpu'
  | 'vga'
  | 'ram'
  | 'storage'
  | 'case'
  | 'cooling'
  | 'psu'
  | 'keyboard'
  | 'mouse'
  | 'chair'
  | 'headset'
  | 'speaker'
  | 'console'
  | 'accessories'
  | 'office-equipment'
  | 'power-bank'
  | 'networking';

const CATEGORY_ALIASES: Record<string, NormalizedCategory> = {
  laptop: 'laptop',
  'laptop-gaming': 'laptop-gaming',
  pc: 'pc',
  'pc-nexora': 'pc',
  'pc-techpilot': 'pc',
  'pc-gaming': 'pc',
  'pc-dong-bo': 'pc',
  'pc-van-phong': 'pc',
  'pc-workstation': 'pc',
  monitor: 'monitor',
  'man-hinh': 'monitor',
  mainboard: 'mainboard',
  'bo-mach-chu': 'mainboard',
  cpu: 'cpu',
  'vi-xu-ly': 'cpu',
  vga: 'vga',
  'card-man-hinh': 'vga',
  ram: 'ram',
  'bo-nho-ram': 'ram',
  storage: 'storage',
  'o-cung': 'storage',
  'ssd-hdd': 'storage',
  case: 'case',
  'vo-may-tinh': 'case',
  cooling: 'cooling',
  'tan-nhiet': 'cooling',
  psu: 'psu',
  nguon: 'psu',
  'nguon-may-tinh': 'psu',
  keyboard: 'keyboard',
  'ban-phim': 'keyboard',
  mouse: 'mouse',
  chuot: 'mouse',
  chair: 'chair',
  ghe: 'chair',
  'ghe-gaming': 'chair',
  'ghe-cong-thai-hoc': 'chair',
  headset: 'headset',
  'tai-nghe': 'headset',
  speaker: 'speaker',
  loa: 'speaker',
  console: 'console',
  handheld: 'console',
  'may-choi-game': 'console',
  accessories: 'accessories',
  'phu-kien': 'accessories',
  'office-equipment': 'office-equipment',
  'thiet-bi-van-phong': 'office-equipment',
  'office-gear': 'office-equipment',
  printer: 'office-equipment',
  'may-in': 'office-equipment',
  'power-bank': 'power-bank',
  'sac-du-phong': 'power-bank',
  networking: 'networking',
  'thiet-bi-mang': 'networking',
};

const CATEGORY_DEFAULT_IMAGES: Record<NormalizedCategory, string> = {
  laptop: '/assets/images/placeholders/laptop.png',
  'laptop-gaming': '/assets/images/review/unlinked/rog-zephyrus.jpg',
  pc: '/assets/images/review/unlinked/pc-advanced.jpg',
  monitor: '/assets/images/review/unlinked/display.png',
  mainboard: '/assets/images/categories/category-mainboard.png',
  cpu: '/assets/images/placeholders/cpu.png',
  vga: '/assets/images/placeholders/vga.png',
  ram: '/assets/images/review/unlinked/ram.jpg',
  storage: '/assets/images/placeholders/ssd.png',
  case: '/assets/images/placeholders/case.png',
  cooling: '/assets/images/placeholders/fan.png',
  psu: '/assets/images/placeholders/psu.png',
  keyboard: '/assets/images/review/unlinked/keyboard.png',
  mouse: '/assets/images/review/unlinked/prod_632.jpg',
  chair: '/assets/images/categories/category-chair.png',
  // No dedicated non-banner headset photo exists under public/assets/images yet
  // (category-headset.png is a brand text banner), so keep a neutral placeholder.
  headset: DEFAULT_PRODUCT_FALLBACK_IMAGE,
  speaker: '/assets/images/categories/category-speaker.png',
  console: '/assets/images/review/unlinked/rog-ally-x.jpg',
  accessories: '/assets/images/categories/category-accessories.png',
  'office-equipment': '/assets/images/review/unlinked/printer-canon.jpg',
  'power-bank': '/assets/images/categories/category-power-bank.png',
  networking: '/assets/images/review/unlinked/router-tplink.jpg',
};

function flattenSpecs(rawSpecs: unknown): Record<string, unknown> {
  if (!rawSpecs || typeof rawSpecs !== 'object') return {};
  const record = rawSpecs as Record<string, unknown>;
  const nested =
    record.specs && typeof record.specs === 'object'
      ? (record.specs as Record<string, unknown>)
      : {};
  return { ...nested, ...record };
}

function normalizeVietnameseText(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeCategoryToken(raw: string | null | undefined): NormalizedCategory | null {
  if (!raw) return null;
  const trimmed = raw.toLowerCase().trim();
  if (CATEGORY_ALIASES[trimmed]) return CATEGORY_ALIASES[trimmed];

  const asciiSlug = normalizeVietnameseText(trimmed)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return CATEGORY_ALIASES[asciiSlug] ?? null;
}

function resolveStructuredCategory(
  product: Partial<ProductDto>,
  specs: Record<string, unknown>,
): NormalizedCategory | null {
  const specsCategorySlug = typeof specs.category_slug === 'string' ? specs.category_slug : null;
  const specsParentSlug =
    product.specs &&
    typeof product.specs === 'object' &&
    typeof (product.specs as Record<string, unknown>).category_slug === 'string'
      ? String((product.specs as Record<string, unknown>).category_slug)
      : null;

  return (
    normalizeCategoryToken(product.category?.slug) ??
    normalizeCategoryToken(product.category?.name) ??
    normalizeCategoryToken(specsCategorySlug) ??
    normalizeCategoryToken(specsParentSlug)
  );
}

function inferCategoryFromSpecs(specs: Record<string, unknown>): NormalizedCategory | null {
  if (Object.keys(specs).length === 0) return null;

  const platform = String(specs.platform ?? '').toLowerCase();
  const officeType = String(specs.office_device_type ?? '').toLowerCase();
  const driveType = String(specs.drive_type ?? '').toLowerCase();
  const standard = String(specs.standard ?? '').toLowerCase();
  const os = String(specs.os ?? specs.operating_system ?? '').toLowerCase();

  if (platform.includes('handheld')) return 'console';
  if (officeType.includes('printer') || specs.print_technology || specs.ink || specs.paper) {
    return 'office-equipment';
  }
  if (specs.accessory_type) return 'accessories';
  if (specs.cooler_type || specs.cooling_capacity_w || specs.pumpSpeed || specs.radiatorSize) {
    return 'cooling';
  }
  if (specs.chair_type || specs.armrest || specs.weightLimit || specs.max_load_kg) return 'chair';
  if (specs.speaker_type) return 'speaker';
  if (specs.headset_type) return 'headset';
  if (specs.keyboard_type || specs.switch_type || specs.switch) return 'keyboard';
  if (specs.sensor || specs.max_dpi || specs.pollingRate) return 'mouse';
  if (specs.max_output_w || specs.maxOutput || specs.capacity_mah) return 'power-bank';
  if (specs.gpu_chip || specs.cuda || specs.engine || specs.gpu_vram_gb) return 'vga';
  if (specs.chipset || specs.m2_slots || (specs.memory_type && specs.ram_slots)) {
    return 'mainboard';
  }
  if (specs.module_count || (specs.memory_type && specs.total_capacity_gb)) return 'ram';
  if (driveType || specs.tbw || specs.readSpeed || specs.read_speed_mbps) return 'storage';
  if (specs.efficiency_rating || specs.efficiency || specs.modularity) return 'psu';
  if (specs.radiator_support || specs.max_gpu_length_mm || specs.case_type) return 'case';

  const hasCpuAndGpu = Boolean(specs.cpu_model && specs.gpu_model);
  if (hasCpuAndGpu) {
    if (specs.battery_wh || os.includes('macos')) return 'laptop';
    if (specs.psu_wattage || specs.mainboard_model || specs.case_model) return 'pc';
  }

  if (specs.panel_type || specs.panel || specs.refresh_rate_hz || specs.brightness_nits) {
    return 'monitor';
  }
  if (specs.cpu_cores || (specs.cores && specs.socket) || specs.tdp) return 'cpu';
  if (standard.includes('wi-fi') || (specs.speed && specs.ports)) return 'networking';

  return null;
}

function inferCategoryFromText(product: Partial<ProductDto>): NormalizedCategory | null {
  const name = (product.name || '').toLowerCase();
  const asciiName = normalizeVietnameseText(name);
  const slug = (product.slug || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  const combined = `${asciiName} ${slug} ${sku}`;

  // Check handheld consoles before CPU ('ryzen') and Laptop keywords
  if (
    /\b(console|handheld)\b/.test(combined) ||
    asciiName.includes('may choi game') ||
    combined.includes('rog ally') ||
    combined.includes('steam deck') ||
    combined.includes('legion go') ||
    combined.includes('msi claw')
  ) {
    return 'console';
  }

  // Check power banks & accessories before laptop keywords (e.g. "Sạc nhanh Laptop", "Giá đỡ Laptop")
  if (asciiName.includes('sac du phong') || /\b(power-?bank|pin sac)\b/.test(combined)) {
    return 'power-bank';
  }

  if (
    /\b(hub|usb hub|webcam|dongle|adapter)\b/.test(combined) ||
    asciiName.includes('bo chuyen doi') ||
    asciiName.includes('gia do') ||
    asciiName.includes('phu kien') ||
    asciiName.includes('camera giam sat')
  ) {
    return 'accessories';
  }

  // Strict word-safe printer detection: never match substring 'in' inside inch/cooling/gaming/kingston
  if (
    /\b(may in|printer|ecotank|laserjet)\b/.test(combined) ||
    /\blbp\d+\b/.test(combined) ||
    asciiName.includes('thiet bi van phong')
  ) {
    return 'office-equipment';
  }

  if (
    asciiName.includes('tan nhiet') ||
    /\b(cooler|cooling|aio)\b/.test(combined) ||
    asciiName.includes('quat tan')
  ) {
    return 'cooling';
  }

  // Pre-built PCs contain CPU/VGA specs in title; classify PC before CPU/VGA
  if (
    /^pc[\s-]/.test(asciiName) ||
    /^pc-/.test(slug) ||
    asciiName.includes('may tinh de ban') ||
    asciiName.includes('may bo')
  ) {
    return 'pc';
  }

  if (
    slug.startsWith('lap-') ||
    sku.startsWith('lap-') ||
    /\b(laptop|macbook|thinkpad|vivobook|zenbook|ideapad)\b/.test(combined)
  ) {
    const isGamingLaptop =
      /\b(gaming|rog|tuf|strix|predator|nitro|legion|loq|victus|omen|cyborg)\b/.test(combined);
    return isGamingLaptop ? 'laptop-gaming' : 'laptop';
  }

  if (asciiName.includes('man hinh') || /\b(monitor|odyssey|ultragear)\b/.test(combined)) {
    return 'monitor';
  }

  // Check VGA and Mainboard before CPU since motherboard/PC titles don't reach here,
  // and CPU check only runs once consoles/laptops/PCs have already been ruled out.
  if (
    /\b(vga|geforce|rtx|gtx|radeon)\b/.test(combined) ||
    asciiName.includes('card man hinh') ||
    asciiName.includes('card do hoa')
  ) {
    return 'vga';
  }

  if (
    /\bmainboard\b/.test(combined) ||
    asciiName.includes('bo mach chu') ||
    /\b[zbxh]\d{3}m?\b/.test(combined)
  ) {
    return 'mainboard';
  }

  if (
    /\b(cpu|intel core|core ultra|ryzen|threadripper|athlon)\b/.test(combined) ||
    /\bcore\s+i[3579]\b/.test(combined) ||
    asciiName.includes('vi xu ly')
  ) {
    return 'cpu';
  }

  if (/\b(ram|ddr[345])\b/.test(combined)) return 'ram';
  if (asciiName.includes('o cung') || /\b(ssd|hdd|nvme)\b/.test(combined)) return 'storage';
  if (asciiName.includes('nguon may tinh') || /\b(psu|80 plus)\b/.test(combined)) return 'psu';
  if (
    asciiName.includes('vo may tinh') ||
    asciiName.includes('vo case') ||
    /\bcase\b/.test(combined)
  ) {
    return 'case';
  }
  if (asciiName.includes('ban phim') || /\bkeyboard\b/.test(combined)) return 'keyboard';
  if (asciiName.includes('chuot') || /\bmouse\b/.test(combined)) return 'mouse';
  if (asciiName.includes('ghe') || /\bchair\b/.test(combined)) return 'chair';
  if (asciiName.includes('tai nghe') || /\b(headset|headphone)\b/.test(combined)) return 'headset';
  if (/\b(loa|speaker|soundbar)\b/.test(combined)) return 'speaker';
  if (/\b(router|access point)\b/.test(combined) || asciiName.includes('thiet bi mang')) {
    return 'networking';
  }

  return null;
}

function resolveLaptopImage(searchStr: string, slug: string, isGaming: boolean): string {
  if (searchStr.includes('macbook') && searchStr.includes('air')) {
    return '/assets/images/review/unlinked/macbook-air.jpg';
  }
  if (searchStr.includes('macbook') || searchStr.includes('apple') || slug.includes('mbp')) {
    return '/assets/images/review/unlinked/macbook-pro.jpg';
  }
  if (searchStr.includes('msi')) return '/assets/images/review/unlinked/msi-vector.jpg';
  if (searchStr.includes('asus')) {
    return searchStr.includes('rog') ||
      searchStr.includes('tuf') ||
      searchStr.includes('strix') ||
      searchStr.includes('zephyrus') ||
      isGaming
      ? '/assets/images/review/unlinked/rog-zephyrus.jpg'
      : '/assets/images/placeholders/laptop.png';
  }
  if (searchStr.includes('dell') || searchStr.includes('latitude') || searchStr.includes('xps')) {
    return searchStr.includes('g15') || searchStr.includes('g16') || isGaming
      ? '/assets/images/review/unlinked/dell-g16.jpg'
      : '/assets/images/review/unlinked/hp-pavilion.jpg';
  }
  if (
    searchStr.includes('lenovo') ||
    searchStr.includes('thinkpad') ||
    searchStr.includes('legion')
  ) {
    if (searchStr.includes('thinkpad')) return '/assets/images/review/unlinked/lenovo-thinkpad.jpg';
    return '/assets/images/review/unlinked/lenovo-legion.jpg';
  }
  if (searchStr.includes('acer') || searchStr.includes('predator') || searchStr.includes('nitro')) {
    return searchStr.includes('predator') || searchStr.includes('nitro') || isGaming
      ? '/assets/images/review/unlinked/acer-predator.jpg'
      : '/assets/images/review/unlinked/lenovo-ideapad.jpg';
  }
  if (searchStr.includes('hp') || searchStr.includes('omen') || searchStr.includes('victus')) {
    return searchStr.includes('omen') || isGaming
      ? '/assets/images/review/unlinked/hp-omen.jpg'
      : '/assets/images/review/unlinked/asus-vivobook.jpg';
  }
  if (searchStr.includes('gram') || searchStr.includes('lg')) {
    return '/assets/images/review/unlinked/lg-gram.jpg';
  }
  return isGaming
    ? '/assets/images/review/unlinked/rog-zephyrus.jpg'
    : '/assets/images/placeholders/laptop.png';
}

function resolveCategoryImage(
  category: NormalizedCategory,
  product: Partial<ProductDto>,
  specs: Record<string, unknown>,
): string {
  const brandSlug = (product.brand?.slug || '').toLowerCase();
  const brandName = (product.brand?.name || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const slug = (product.slug || '').toLowerCase();
  const combined = `${name} ${slug} ${brandSlug} ${brandName} ${JSON.stringify(specs).toLowerCase()}`;

  if (category === 'laptop' || category === 'laptop-gaming') {
    const isGaming =
      category === 'laptop-gaming' ||
      /\b(gaming|rog|tuf|strix|predator|nitro|legion|loq|victus|omen|cyborg)\b/.test(combined);
    return resolveLaptopImage(combined, slug, isGaming);
  }

  switch (category) {
    case 'pc':
      return combined.includes('creator') ||
        combined.includes('workstation') ||
        combined.includes('đồ họa')
        ? '/assets/images/review/unlinked/pc-workstation.jpg'
        : '/assets/images/review/unlinked/pc-advanced.jpg';
    case 'monitor':
      if (combined.includes('oled g9') || combined.includes('ultragear') || brandSlug === 'lg') {
        return '/assets/images/review/unlinked/display.png';
      }
      if (combined.includes('odyssey') || brandSlug === 'samsung') {
        return '/assets/images/review/unlinked/display1.png';
      }
      if (brandSlug === 'gigabyte' || combined.includes('gigabyte')) {
        return '/assets/images/review/unlinked/prod_623.jpg';
      }
      if (brandSlug === 'viewsonic' || combined.includes('viewsonic')) {
        return '/assets/images/review/unlinked/prod_622.jpg';
      }
      if (combined.includes('aoc')) {
        return '/assets/images/review/unlinked/prod_621.jpg';
      }
      if (brandSlug === 'msi' || combined.includes('msi')) {
        return '/assets/images/review/unlinked/display3.jpg';
      }
      return '/assets/images/review/unlinked/display.png';
    case 'cpu':
      if (brandSlug === 'amd' || combined.includes('ryzen') || combined.includes('amd')) {
        return '/assets/images/review/unlinked/cpu_ryzen7.jpg';
      }
      if (combined.includes('14900k') || combined.includes('i9') || combined.includes('i7')) {
        return '/assets/images/review/unlinked/cpu_14.png';
      }
      return '/assets/images/placeholders/cpu.png';
    case 'vga':
      return combined.includes('rtx 4070') || combined.includes('tuf')
        ? '/assets/images/review/unlinked/rtx-4070-super.jpg'
        : '/assets/images/placeholders/vga.png';
    case 'ram':
      return combined.includes('xpg') || combined.includes('rgb') || brandSlug === 'corsair'
        ? '/assets/images/review/unlinked/ram-corsair.jpg'
        : '/assets/images/review/unlinked/ram.jpg';
    case 'keyboard':
      return brandSlug === 'logitech' || combined.includes('g913') || combined.includes('g213')
        ? '/assets/images/review/unlinked/logitech-g213.jpg'
        : '/assets/images/review/unlinked/keyboard.png';
    case 'mouse':
      if (brandSlug === 'razer' || combined.includes('razer') || combined.includes('viper')) {
        return '/assets/images/review/unlinked/prod_628.png';
      }
      if (brandSlug === 'logitech' || combined.includes('superlight')) {
        return '/assets/images/review/unlinked/logitech-g-pro-x-wireless.jpg';
      }
      return '/assets/images/review/unlinked/prod_632.jpg';
    case 'accessories': {
      const asciiCombined = normalizeVietnameseText(combined);
      if (asciiCombined.includes('webcam') || asciiCombined.includes('camera')) {
        return '/assets/images/review/unlinked/camera.jpg';
      }
      if (asciiCombined.includes('hub') || asciiCombined.includes('chuyen doi')) {
        return '/assets/images/review/unlinked/prod_627.png';
      }
      return CATEGORY_DEFAULT_IMAGES.accessories;
    }
    default:
      return CATEGORY_DEFAULT_IMAGES[category];
  }
}

function resolveKnownOverrideThumbnail(thumb: string): string | null {
  if (thumb.includes('samsung-odyssey.jpg')) return '/assets/images/review/unlinked/display.png';
  if (thumb.includes('monitor-lg-27.jpg')) return '/assets/images/review/unlinked/display1.png';
  if (thumb.includes('logitech-g913.png'))
    return '/assets/images/review/unlinked/logitech-g213.jpg';
  return null;
}

function shouldIgnoreGenericOrBrokenThumbnail(thumb: string): boolean {
  return (
    thumb.includes('/categories/category-') ||
    thumb.includes('/placeholders/') ||
    thumb.includes('chair-warrior.jpg') ||
    thumb.includes('headset-g733')
  );
}

/**
 * Resolve a valid, semantically accurate local image path for a product.
 * Priority: explicit valid thumbnail -> structured category/slug -> structured specs -> word-safe fallback.
 */
export function getProductImage(product: Partial<ProductDto> | undefined): string {
  if (!product) return DEFAULT_PRODUCT_FALLBACK_IMAGE;

  const thumb = product.thumbnailUrl?.trim();
  if (thumb) {
    const override = resolveKnownOverrideThumbnail(thumb);
    if (override) return override;
    if (!shouldIgnoreGenericOrBrokenThumbnail(thumb)) {
      return thumb;
    }
  }

  const specs = flattenSpecs(product.specs);
  const category =
    resolveStructuredCategory(product, specs) ??
    inferCategoryFromSpecs(specs) ??
    inferCategoryFromText(product);

  if (!category) return DEFAULT_PRODUCT_FALLBACK_IMAGE;
  return resolveCategoryImage(category, product, specs);
}

/**
 * Resolve gallery image list for Product Detail view while preserving DEF-RT-01 primary mapping.
 * Filters out missing/known-broken placeholder URLs and deduplicates entries.
 */
export function resolveProductGalleryImages(
  product: (Partial<ProductDto> & { images?: unknown[] }) | undefined,
): string[] {
  const primary = getProductImage(product);
  const result: string[] = [primary];

  if (product && Array.isArray(product.images)) {
    for (const entry of product.images) {
      if (!entry || typeof entry !== 'object') continue;
      const rawUrl = (entry as { imageUrl?: unknown }).imageUrl;
      if (typeof rawUrl !== 'string') continue;
      const trimmed = rawUrl.trim();
      if (!trimmed) continue;
      const normalized = resolveKnownOverrideThumbnail(trimmed) ?? trimmed;
      if (shouldIgnoreGenericOrBrokenThumbnail(normalized)) continue;
      if (!result.includes(normalized)) {
        result.push(normalized);
      }
    }
  }

  return result;
}
