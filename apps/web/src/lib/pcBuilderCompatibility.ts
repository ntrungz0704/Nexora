import type { ProductDto } from '@nexora/shared';

export type BuilderSlotKey =
  | 'cpu'
  | 'mainboard'
  | 'ram'
  | 'vga'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'monitor'
  | 'mouse'
  | 'keyboard'
  | 'chair';

export type ClassifiedComponentType =
  | BuilderSlotKey
  | 'case-fan'
  | 'pc'
  | 'laptop'
  | 'laptop-gaming'
  | 'console'
  | 'headset'
  | 'speaker'
  | 'accessories'
  | 'office-equipment'
  | 'power-bank'
  | 'networking';

export type CompatStatus = 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNKNOWN';

export interface CompatibilityRuleResult {
  ruleId:
    | 'cpu-mainboard-socket'
    | 'ram-mainboard-type'
    | 'cpu-ram-support'
    | 'cooler-cpu-socket'
    | 'vga-case-length'
    | 'mainboard-case-form-factor'
    | 'cooler-case-clearance'
    | 'psu-case-length'
    | 'psu-wattage-capacity';
  slots: BuilderSlotKey[];
  status: CompatStatus;
  message: string;
}

export interface CandidateCompatibilityEvaluation {
  status: CompatStatus;
  reason: string;
  checks: CompatibilityRuleResult[];
}

export interface BuildSlotSelection {
  product: ProductDto | null;
  isOwned: boolean;
  name?: string;
  price?: number;
}

export interface BuildCompatibilityEvaluation {
  overallStatus: CompatStatus;
  verifiedChecks: CompatibilityRuleResult[];
  incompatibleChecks: CompatibilityRuleResult[];
  unknownChecks: CompatibilityRuleResult[];
  slotStatuses: Partial<Record<BuilderSlotKey, CompatStatus>>;
}

export interface CompatibilityAlert {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

const GROUPED_UMBRELLA_SLUGS = new Set([
  'main-cpu-vga',
  'case-nguon-tan',
  'pc-linh-kien',
  'linh-kien-pc',
  'gaming-gear',
  'office-gear',
]);

const EXACT_CATEGORY_MAP: Record<string, ClassifiedComponentType> = {
  cpu: 'cpu',
  'vi-xu-ly': 'cpu',
  mainboard: 'mainboard',
  motherboard: 'mainboard',
  'bo-mach-chu': 'mainboard',
  ram: 'ram',
  'bo-nho-ram': 'ram',
  vga: 'vga',
  gpu: 'vga',
  'card-man-hinh': 'vga',
  storage: 'storage',
  'o-cung': 'storage',
  'ssd-hdd': 'storage',
  psu: 'psu',
  nguon: 'psu',
  'nguon-may-tinh': 'psu',
  case: 'case',
  'vo-may-tinh': 'case',
  'vo-case': 'case',
  cooling: 'cooler',
  cooler: 'cooler',
  'tan-nhiet': 'cooler',
  'case-fan': 'case-fan',
  'fan-case': 'case-fan',
  'quat-case': 'case-fan',
  monitor: 'monitor',
  'man-hinh': 'monitor',
  mouse: 'mouse',
  chuot: 'mouse',
  'chuot-lot-chuot': 'mouse',
  keyboard: 'keyboard',
  'ban-phim': 'keyboard',
  chair: 'chair',
  ghe: 'chair',
  'ghe-ban': 'chair',
  'ghe-gaming': 'chair',
  'ghe-cong-thai-hoc': 'chair',
  pc: 'pc',
  'pc-nexora': 'pc',
  'pc-techpilot': 'pc',
  'pc-gaming': 'pc',
  'pc-dong-bo': 'pc',
  'pc-van-phong': 'pc',
  'pc-workstation': 'pc',
  laptop: 'laptop',
  'laptop-gaming': 'laptop-gaming',
  console: 'console',
  handheld: 'console',
  'may-choi-game': 'console',
  headset: 'headset',
  'tai-nghe': 'headset',
  speaker: 'speaker',
  loa: 'speaker',
  accessories: 'accessories',
  'phu-kien': 'accessories',
  'office-equipment': 'office-equipment',
  'thiet-bi-van-phong': 'office-equipment',
  'power-bank': 'power-bank',
  'sac-du-phong': 'power-bank',
  networking: 'networking',
  'thiet-bi-mang': 'networking',
  'phan-mem-mang': 'networking',
};

function normalizeVietnameseAscii(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeToken(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.toLowerCase().trim();
  if (!trimmed) return null;
  if (EXACT_CATEGORY_MAP[trimmed]) return trimmed;
  return normalizeVietnameseAscii(trimmed)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractStructuredSpecs(rawSpecs: unknown): {
  flat: Record<string, unknown>;
  compatibility: Record<string, unknown>;
  raw: Record<string, unknown>;
} {
  if (!rawSpecs || typeof rawSpecs !== 'object') {
    return { flat: {}, compatibility: {}, raw: {} };
  }
  const raw = rawSpecs as Record<string, unknown>;
  const nestedSpecs =
    raw.specs && typeof raw.specs === 'object' ? (raw.specs as Record<string, unknown>) : {};
  const compatibility =
    raw.compatibility && typeof raw.compatibility === 'object'
      ? (raw.compatibility as Record<string, unknown>)
      : {};
  return {
    flat: { ...nestedSpecs, ...raw },
    compatibility,
    raw,
  };
}

function isExplicitCaseFan(
  textCombined: string,
  specs: Record<string, unknown>,
  rawSlug: string | null,
): boolean {
  if (rawSlug === 'case-fan' || rawSlug === 'fan-case' || rawSlug === 'quat-case') return true;
  const coolerType = String(specs.cooler_type ?? specs.component_type ?? '').toLowerCase();
  if (coolerType === 'case fan' || coolerType === 'case_fan') return true;
  if (
    /\b(aio|water cooling|liquid cooler|cpu cooler|tan nhiet nuoc|tan nhiet khi)\b/.test(
      textCombined,
    )
  ) {
    return false;
  }
  return /\b(case fan|fan case|quat case|quat thung may|quat thung)\b/.test(textCombined);
}

function inferFromSpecs(
  flat: Record<string, unknown>,
  compatibility: Record<string, unknown>,
  textCombined: string,
): ClassifiedComponentType | null {
  if (Object.keys(flat).length === 0 && Object.keys(compatibility).length === 0) {
    return null;
  }

  const platform = String(flat.platform ?? '').toLowerCase();
  const officeType = String(flat.office_device_type ?? '').toLowerCase();
  const os = String(flat.os ?? flat.operating_system ?? '').toLowerCase();
  const driveType = String(flat.drive_type ?? '').toLowerCase();
  const standard = String(flat.standard ?? '').toLowerCase();

  if (platform.includes('handheld')) return 'console';
  if (officeType.includes('printer') || flat.print_technology || flat.ink || flat.paper) {
    return 'office-equipment';
  }
  if (flat.accessory_type) return 'accessories';
  if (flat.max_output_w || flat.maxOutput || flat.capacity_mah) return 'power-bank';
  if (flat.chair_type || flat.armrest || flat.weightLimit || flat.max_load_kg) return 'chair';
  if (flat.speaker_type) return 'speaker';
  if (flat.headset_type) return 'headset';
  if (flat.keyboard_type || flat.switch_type || flat.switch) return 'keyboard';
  if (flat.sensor || flat.max_dpi || flat.pollingRate) return 'mouse';
  if (flat.panel_type || flat.panel || flat.refresh_rate_hz || flat.brightness_nits) {
    return 'monitor';
  }

  const hasCpuAndGpu = Boolean(flat.cpu_model && flat.gpu_model) || Boolean(flat.cpu && flat.gpu);
  if (hasCpuAndGpu) {
    if (flat.battery_wh || os.includes('macos')) return 'laptop';
    if (flat.psu_wattage || flat.mainboard_model || flat.case_model || flat.mainboard) {
      return 'pc';
    }
  }

  // Case vs Cooler vs PSU disambiguation
  if (
    flat.efficiency_rating ||
    flat.efficiency ||
    flat.modularity ||
    flat.atx_version ||
    (compatibility.wattage && !flat.cooling_capacity_w)
  ) {
    return 'psu';
  }

  if (isExplicitCaseFan(textCombined, flat, null)) {
    return 'case-fan';
  }

  if (
    flat.cooler_type ||
    flat.cooling_capacity_w ||
    compatibility.cooling_capacity_w ||
    flat.pumpSpeed ||
    flat.radiatorSize ||
    flat.supported_sockets
  ) {
    return 'cooler';
  }

  if (
    flat.case_type ||
    flat.max_gpu_length_mm ||
    compatibility.max_gpu_length_mm ||
    flat.max_cpu_cooler_height_mm ||
    compatibility.max_cpu_cooler_height_mm ||
    flat.motherboard_support ||
    flat.radiator_support
  ) {
    return 'case';
  }

  if (flat.gpu_chip || flat.cuda || flat.engine || flat.vram_gb || flat.recommended_psu_w) {
    return 'vga';
  }

  if (flat.chipset || flat.m2_slots || (flat.memory_type && flat.ram_slots)) {
    return 'mainboard';
  }

  if (
    flat.module_count ||
    flat.cas_latency ||
    (flat.memory_type && (flat.total_capacity_gb || flat.speed_mhz))
  ) {
    return 'ram';
  }

  if (
    driveType ||
    flat.tbw ||
    flat.readSpeed ||
    flat.read_speed_mbps ||
    (flat.interface && /nvme|pcie|sata/i.test(String(flat.interface)))
  ) {
    return 'storage';
  }

  if (
    flat.cores ||
    flat.threads ||
    flat.base_clock_ghz ||
    flat.tdp ||
    flat.base_power_w ||
    flat.architecture
  ) {
    return 'cpu';
  }

  if (standard.includes('wi-fi') || (flat.speed && flat.ports)) {
    return 'networking';
  }

  return null;
}

function inferFromText(
  product: Partial<ProductDto>,
  specs: Record<string, unknown>,
): ClassifiedComponentType | null {
  const asciiName = normalizeVietnameseAscii(product.name || '');
  const slug = (product.slug || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  const combined = `${asciiName} ${slug} ${sku}`.trim();

  // Strip known PSU/Case brand token "cooler master" before keyword matching so PSUs/Cases
  // by Cooler Master do not falsely trigger cooling keywords.
  const combinedWithoutBrandNoise = combined.replace(/\bcooler[\s-]+master\b/g, ' ');

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

  if (
    /\b(may in|printer|ecotank|laserjet)\b/.test(combined) ||
    /\blbp\d+\b/.test(combined) ||
    asciiName.includes('thiet bi van phong')
  ) {
    return 'office-equipment';
  }

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

  // Case Fan before Case & CPU Cooler
  if (isExplicitCaseFan(combined, specs, null)) {
    return 'case-fan';
  }

  // PSU before Cooler (even if title contains brand noise or wattage)
  if (
    asciiName.includes('nguon may tinh') ||
    asciiName.includes('bo nguon') ||
    /\b(psu|80 plus)\b/.test(combined) ||
    (/\bnguon\b/.test(asciiName) && /\b\d{3,4}\s*w\b/.test(asciiName))
  ) {
    return 'psu';
  }

  // CPU Cooler / AIO BEFORE Case (AIO titles often mention "hỗ trợ Case ATX")
  if (
    asciiName.includes('tan nhiet') ||
    asciiName.includes('tan nuoc') ||
    asciiName.includes('tan khi') ||
    /\b(aio|water cooling|liquid cooler|air cooler|cpu cooler|heatsink)\b/.test(
      combinedWithoutBrandNoise,
    ) ||
    /\b(cooler|cooling)\b/.test(combinedWithoutBrandNoise)
  ) {
    return 'cooler';
  }

  // VGA before CPU & Mainboard
  if (
    /\b(vga|geforce|rtx|gtx|radeon)\b/.test(combined) ||
    asciiName.includes('card man hinh') ||
    asciiName.includes('card do hoa')
  ) {
    return 'vga';
  }

  // Mainboard before RAM & CPU ("Mainboard ASUS B650 WiFi DDR5" must stay mainboard)
  if (
    /\b(mainboard|motherboard)\b/.test(combined) ||
    asciiName.includes('bo mach chu') ||
    /\b[zbxh]\d{3}m?\b/.test(combined)
  ) {
    return 'mainboard';
  }

  // CPU after PC / Laptop / Console / VGA / Mainboard / Cooler
  if (
    /\b(cpu|intel core|core ultra|ryzen|threadripper|athlon|pentium|celeron)\b/.test(combined) ||
    /\bcore\s+i[3579]\b/.test(combined) ||
    asciiName.includes('vi xu ly')
  ) {
    return 'cpu';
  }

  // Storage before RAM (NVMe SSDs may mention cache)
  if (asciiName.includes('o cung') || /\b(ssd|hdd|nvme)\b/.test(combined)) {
    return 'storage';
  }

  if (/\b(ram|ddr[345]|udimm|sodimm)\b/.test(combined)) {
    return 'ram';
  }

  // Case only after AIO/Cooler, Case Fan, Laptop bags/sleeves have been filtered
  if (
    asciiName.includes('vo may tinh') ||
    asciiName.includes('vo case') ||
    (/\bcase\b/.test(combined) &&
      !/\b(sleeve|tui chong soc|op lung|tablet|ipad|iphone)\b/.test(combined))
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

/**
 * Deterministically classify a catalog product into a canonical hardware type.
 * Precedence: exact non-umbrella category slug -> structured specs -> word-safe name/slug/sku.
 * Never returns true on unknown types and never uses broad substring matching on category slugs.
 */
export function classifyProductComponentType(
  product: Partial<ProductDto> | null | undefined,
): ClassifiedComponentType | null {
  if (!product) return null;

  const { flat, compatibility, raw } = extractStructuredSpecs(product.specs);
  const asciiName = normalizeVietnameseAscii(product.name || '');
  const slug = (product.slug || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  const combined = `${asciiName} ${slug} ${sku}`.trim();

  const catSlugToken = normalizeToken(product.category?.slug);
  const catNameToken = normalizeToken(product.category?.name);
  const specsCatToken = normalizeToken(
    typeof flat.category_slug === 'string'
      ? flat.category_slug
      : typeof raw.category_slug === 'string'
        ? raw.category_slug
        : null,
  );

  const isUmbrella =
    (catSlugToken !== null && GROUPED_UMBRELLA_SLUGS.has(catSlugToken)) ||
    (catNameToken !== null && GROUPED_UMBRELLA_SLUGS.has(catNameToken));

  const resolvedFromExactCategory =
    (catSlugToken && !GROUPED_UMBRELLA_SLUGS.has(catSlugToken)
      ? EXACT_CATEGORY_MAP[catSlugToken]
      : undefined) ??
    (catNameToken && !GROUPED_UMBRELLA_SLUGS.has(catNameToken)
      ? EXACT_CATEGORY_MAP[catNameToken]
      : undefined) ??
    (!isUmbrella && specsCatToken && !GROUPED_UMBRELLA_SLUGS.has(specsCatToken)
      ? EXACT_CATEGORY_MAP[specsCatToken]
      : undefined) ??
    null;

  if (resolvedFromExactCategory) {
    // Disambiguate a pure Case Fan if stored under generic 'cooling'
    if (resolvedFromExactCategory === 'cooler' && isExplicitCaseFan(combined, flat, catSlugToken)) {
      return 'case-fan';
    }
    return resolvedFromExactCategory;
  }

  return inferFromSpecs(flat, compatibility, combined) ?? inferFromText(product, flat);
}

export function isProductEligibleForSlot(
  product: Partial<ProductDto> | null | undefined,
  slotKey: BuilderSlotKey,
): boolean {
  const classified = classifyProductComponentType(product);
  return classified === slotKey;
}

export function isPrebuiltPcProduct(product: Partial<ProductDto> | null | undefined): boolean {
  return classifyProductComponentType(product) === 'pc';
}

function normalizeSocketToken(raw: string): string | null {
  const clean = raw.toUpperCase().replace(/\s+/g, '');
  if (!clean) return null;
  if (/^LGA\d{4}[A-Z]?$/.test(clean) || /^AM[45]$/.test(clean) || /^SP5$/.test(clean)) {
    return clean;
  }
  const lgaMatch = clean.match(/LGA(\d{4})/);
  if (lgaMatch) return `LGA${lgaMatch[1]}`;
  const amMatch = clean.match(/\b(AM[45])\b/) || raw.toUpperCase().match(/\b(AM[45])\b/);
  if (amMatch) return amMatch[1] ?? null;
  return null;
}

export function extractSocket(product: Partial<ProductDto>): string | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const direct = compatibility.socket ?? flat.socket;
  if (typeof direct === 'string') {
    const normalized = normalizeSocketToken(direct);
    if (normalized) return normalized;
  }
  const text = (product.name || '').toUpperCase();
  return normalizeSocketToken(text);
}

export function extractSupportedSockets(product: Partial<ProductDto>): string[] | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const candidate = compatibility.supported_sockets ?? flat.supported_sockets ?? flat.socket;
  const found = new Set<string>();

  if (Array.isArray(candidate)) {
    for (const entry of candidate) {
      if (typeof entry === 'string') {
        const norm = normalizeSocketToken(entry);
        if (norm) found.add(norm);
      }
    }
  } else if (typeof candidate === 'string') {
    // Handle delimited strings such as "LGA1700/1200/115x & AM5/AM4"
    const upper = candidate.toUpperCase();
    const parts = upper.split(/[/,&|]+/);
    let currentFamily = '';
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('LGA')) currentFamily = 'LGA';
      else if (trimmed.startsWith('AM')) currentFamily = 'AM';

      const normDirect = normalizeSocketToken(trimmed);
      if (normDirect) {
        found.add(normDirect);
      } else if (currentFamily === 'LGA' && /^\d{4}$/.test(trimmed)) {
        found.add(`LGA${trimmed}`);
      }
    }
  }

  if (found.size === 0) {
    const fromName = normalizeSocketToken((product.name || '').toUpperCase());
    if (fromName) found.add(fromName);
  }

  return found.size > 0 ? [...found] : null;
}

export function extractRamType(product: Partial<ProductDto>): string | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const candidates = [compatibility.ram_type, flat.ram_type, flat.memory_type];
  for (const val of candidates) {
    if (typeof val === 'string') {
      const upper = val.toUpperCase();
      if (upper.includes('DDR5')) return 'DDR5';
      if (upper.includes('DDR4')) return 'DDR4';
      if (upper.includes('DDR3')) return 'DDR3';
    }
  }
  const upperName = (product.name || '').toUpperCase();
  if (/\bDDR5\b/.test(upperName)) return 'DDR5';
  if (/\bDDR4\b/.test(upperName)) return 'DDR4';
  if (/\bDDR3\b/.test(upperName)) return 'DDR3';
  return null;
}

export function extractCpuSupportedMemory(product: Partial<ProductDto>): string[] | null {
  const { flat } = extractStructuredSpecs(product.specs);
  const raw = flat.supported_memory;
  if (!Array.isArray(raw)) return null;
  const list = raw
    .map((x) => String(x).toUpperCase().trim())
    .filter((x) => x === 'DDR3' || x === 'DDR4' || x === 'DDR5');
  return list.length > 0 ? list : null;
}

function normalizeFormFactor(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean === 'EATX' || clean === 'EXTENDEDATX') return 'E-ATX';
  if (clean === 'ATX') return 'ATX';
  if (clean === 'MICROATX' || clean === 'MATX') return 'Micro-ATX';
  if (clean === 'MINIITX' || clean === 'ITX') return 'Mini-ITX';
  return null;
}

export function extractMainboardFormFactor(product: Partial<ProductDto>): string | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return normalizeFormFactor(compatibility.form_factor ?? flat.form_factor);
}

export function extractCaseFormFactors(product: Partial<ProductDto>): string[] | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const list = compatibility.motherboard_support ?? flat.motherboard_support;
  if (!Array.isArray(list)) return null;
  const normalized = list
    .map((item) => normalizeFormFactor(item))
    .filter((v): v is string => v !== null);
  return normalized.length > 0 ? normalized : null;
}

function parsePositiveNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

export function extractVgaLengthMm(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(compatibility.length_mm ?? flat.length_mm);
}

export function extractCaseMaxGpuLengthMm(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(compatibility.max_gpu_length_mm ?? flat.max_gpu_length_mm);
}

export function extractCoolerClearanceSpecs(product: Partial<ProductDto>): {
  coolerType: 'AIR' | 'AIO' | null;
  heightMm: number | null;
  radiatorSizeMm: number | null;
} {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const rawType = String(flat.cooler_type ?? '').toUpperCase();
  const upperName = (product.name || '').toUpperCase();

  let coolerType: 'AIR' | 'AIO' | null = null;
  if (rawType.includes('AIO') || rawType.includes('LIQUID') || /\bAIO\b/.test(upperName)) {
    coolerType = 'AIO';
  } else if (rawType.includes('AIR') || /\bAIR COOLING\b/.test(upperName)) {
    coolerType = 'AIR';
  }

  const heightMm = parsePositiveNumber(compatibility.height_mm ?? flat.height_mm);
  const radiatorSizeMm = parsePositiveNumber(
    compatibility.radiator_size_mm ?? flat.radiator_size_mm ?? flat.radiatorSize,
  );

  return { coolerType, heightMm, radiatorSizeMm };
}

export function extractCaseCoolerClearance(product: Partial<ProductDto>): {
  maxCoolerHeightMm: number | null;
  radiatorSupportMm: number[] | null;
} {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const maxCoolerHeightMm = parsePositiveNumber(
    compatibility.max_cpu_cooler_height_mm ?? flat.max_cpu_cooler_height_mm,
  );
  const rawRad = compatibility.radiator_support ?? flat.radiator_support;
  let radiatorSupportMm: number[] | null = null;
  if (Array.isArray(rawRad)) {
    const parsed = rawRad
      .map((entry) => parsePositiveNumber(entry))
      .filter((v): v is number => v !== null);
    if (parsed.length > 0) radiatorSupportMm = parsed;
  }
  return { maxCoolerHeightMm, radiatorSupportMm };
}

export function extractPsuWattage(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  const direct = parsePositiveNumber(compatibility.wattage ?? flat.wattage);
  if (direct && direct >= 200) return direct;
  const nameMatch = (product.name || '').match(/\b(\d{3,4})\s*W\b/i);
  if (nameMatch) {
    const n = Number(nameMatch[1]);
    if (n >= 200) return n;
  }
  return null;
}

export function extractPsuLengthMm(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(compatibility.length_mm ?? flat.length_mm);
}

export function extractCaseMaxPsuLengthMm(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(compatibility.max_psu_length_mm ?? flat.max_psu_length_mm);
}

export function extractVgaRequiredPsuW(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(compatibility.required_psu_w ?? flat.recommended_psu_w ?? flat.power);
}

export function extractCpuPowerW(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(
    compatibility.max_power_w ?? flat.max_turbo_power_w ?? flat.base_power_w ?? flat.tdp,
  );
}

export function extractVgaTdpW(product: Partial<ProductDto>): number | null {
  const { flat, compatibility } = extractStructuredSpecs(product.specs);
  return parsePositiveNumber(compatibility.tdp_w ?? flat.tdp_w);
}

function checkCpuMainboardSocket(cpu: ProductDto, mb: ProductDto): CompatibilityRuleResult {
  const cpuSocket = extractSocket(cpu);
  const mbSocket = extractSocket(mb);
  if (!cpuSocket || !mbSocket) {
    return {
      ruleId: 'cpu-mainboard-socket',
      slots: ['cpu', 'mainboard'],
      status: 'UNKNOWN',
      message: 'Thiếu dữ liệu socket để đối chiếu giữa CPU và Mainboard',
    };
  }
  if (cpuSocket !== mbSocket) {
    return {
      ruleId: 'cpu-mainboard-socket',
      slots: ['cpu', 'mainboard'],
      status: 'INCOMPATIBLE',
      message: `Lỗi Socket: CPU (${cpuSocket}) không khớp với Mainboard (${mbSocket})`,
    };
  }
  return {
    ruleId: 'cpu-mainboard-socket',
    slots: ['cpu', 'mainboard'],
    status: 'COMPATIBLE',
    message: `Khớp Socket ${cpuSocket} (CPU & Mainboard)`,
  };
}

function checkMainboardRamType(mb: ProductDto, ram: ProductDto): CompatibilityRuleResult {
  const mbRam = extractRamType(mb);
  const ramType = extractRamType(ram);
  if (!mbRam || !ramType) {
    return {
      ruleId: 'ram-mainboard-type',
      slots: ['mainboard', 'ram'],
      status: 'UNKNOWN',
      message: 'Thiếu chuẩn bộ nhớ RAM (DDR4/DDR5) trên Mainboard hoặc RAM',
    };
  }
  if (mbRam !== ramType) {
    return {
      ruleId: 'ram-mainboard-type',
      slots: ['mainboard', 'ram'],
      status: 'INCOMPATIBLE',
      message: `Lỗi chuẩn RAM: Mainboard hỗ trợ ${mbRam} nhưng RAM là ${ramType}`,
    };
  }
  return {
    ruleId: 'ram-mainboard-type',
    slots: ['mainboard', 'ram'],
    status: 'COMPATIBLE',
    message: `Khớp chuẩn bộ nhớ ${ramType} (Mainboard & RAM)`,
  };
}

function checkCpuRamSupport(cpu: ProductDto, ram: ProductDto): CompatibilityRuleResult | null {
  const cpuMem = extractCpuSupportedMemory(cpu);
  const ramType = extractRamType(ram);
  if (!cpuMem || !ramType) return null;
  if (!cpuMem.includes(ramType)) {
    return {
      ruleId: 'cpu-ram-support',
      slots: ['cpu', 'ram'],
      status: 'INCOMPATIBLE',
      message: `Lỗi RAM: CPU chỉ hỗ trợ ${cpuMem.join('/')} nhưng RAM là ${ramType}`,
    };
  }
  return {
    ruleId: 'cpu-ram-support',
    slots: ['cpu', 'ram'],
    status: 'COMPATIBLE',
    message: `CPU hỗ trợ chuẩn ${ramType}`,
  };
}

function checkCoolerCpuSocket(cooler: ProductDto, cpu: ProductDto): CompatibilityRuleResult {
  const cpuSocket = extractSocket(cpu);
  const coolerSockets = extractSupportedSockets(cooler);
  if (!cpuSocket || !coolerSockets) {
    return {
      ruleId: 'cooler-cpu-socket',
      slots: ['cooler', 'cpu'],
      status: 'UNKNOWN',
      message: 'Thiếu thông số socket hỗ trợ của Tản nhiệt hoặc CPU',
    };
  }
  if (!coolerSockets.includes(cpuSocket)) {
    return {
      ruleId: 'cooler-cpu-socket',
      slots: ['cooler', 'cpu'],
      status: 'INCOMPATIBLE',
      message: `Tản nhiệt (${coolerSockets.join(', ')}) không hỗ trợ socket CPU (${cpuSocket})`,
    };
  }
  return {
    ruleId: 'cooler-cpu-socket',
    slots: ['cooler', 'cpu'],
    status: 'COMPATIBLE',
    message: `Tản nhiệt hỗ trợ socket ${cpuSocket}`,
  };
}

function checkVgaCaseLength(vga: ProductDto, pcCase: ProductDto): CompatibilityRuleResult {
  const vgaLen = extractVgaLengthMm(vga);
  const maxLen = extractCaseMaxGpuLengthMm(pcCase);
  if (!vgaLen || !maxLen) {
    return {
      ruleId: 'vga-case-length',
      slots: ['vga', 'case'],
      status: 'UNKNOWN',
      message: 'Thiếu chiều dài VGA hoặc khoảng trống GPU tối đa của Case',
    };
  }
  if (vgaLen > maxLen) {
    return {
      ruleId: 'vga-case-length',
      slots: ['vga', 'case'],
      status: 'INCOMPATIBLE',
      message: `VGA dài ${vgaLen}mm vượt quá giới hạn Case (${maxLen}mm)`,
    };
  }
  return {
    ruleId: 'vga-case-length',
    slots: ['vga', 'case'],
    status: 'COMPATIBLE',
    message: `Chiều dài VGA ${vgaLen}mm vừa với Case (tối đa ${maxLen}mm)`,
  };
}

function checkMainboardCaseFormFactor(mb: ProductDto, pcCase: ProductDto): CompatibilityRuleResult {
  const mbFf = extractMainboardFormFactor(mb);
  const caseFfs = extractCaseFormFactors(pcCase);
  if (!mbFf || !caseFfs) {
    return {
      ruleId: 'mainboard-case-form-factor',
      slots: ['mainboard', 'case'],
      status: 'UNKNOWN',
      message: 'Thiếu chuẩn kích thước (Form Factor) giữa Mainboard và Case',
    };
  }
  if (!caseFfs.includes(mbFf)) {
    return {
      ruleId: 'mainboard-case-form-factor',
      slots: ['mainboard', 'case'],
      status: 'INCOMPATIBLE',
      message: `Mainboard (${mbFf}) không vừa Case (chỉ hỗ trợ ${caseFfs.join(', ')})`,
    };
  }
  return {
    ruleId: 'mainboard-case-form-factor',
    slots: ['mainboard', 'case'],
    status: 'COMPATIBLE',
    message: `Case hỗ trợ chuẩn Mainboard ${mbFf}`,
  };
}

function checkCoolerCaseClearance(cooler: ProductDto, pcCase: ProductDto): CompatibilityRuleResult {
  const coolerSpecs = extractCoolerClearanceSpecs(cooler);
  const caseSpecs = extractCaseCoolerClearance(pcCase);

  if (
    coolerSpecs.coolerType === 'AIO' &&
    coolerSpecs.radiatorSizeMm &&
    caseSpecs.radiatorSupportMm
  ) {
    const rad = coolerSpecs.radiatorSizeMm;
    const fits = caseSpecs.radiatorSupportMm.some((supported) => supported >= rad);
    if (!fits) {
      return {
        ruleId: 'cooler-case-clearance',
        slots: ['cooler', 'case'],
        status: 'INCOMPATIBLE',
        message: `Radiator tản nhiệt ${rad}mm không vừa Case (hỗ trợ tối đa ${Math.max(...caseSpecs.radiatorSupportMm)}mm)`,
      };
    }
    return {
      ruleId: 'cooler-case-clearance',
      slots: ['cooler', 'case'],
      status: 'COMPATIBLE',
      message: `Case hỗ trợ radiator ${rad}mm`,
    };
  }

  if (coolerSpecs.heightMm && caseSpecs.maxCoolerHeightMm) {
    if (coolerSpecs.heightMm > caseSpecs.maxCoolerHeightMm) {
      return {
        ruleId: 'cooler-case-clearance',
        slots: ['cooler', 'case'],
        status: 'INCOMPATIBLE',
        message: `Tản nhiệt cao ${coolerSpecs.heightMm}mm vượt giới hạn Case (${caseSpecs.maxCoolerHeightMm}mm)`,
      };
    }
    return {
      ruleId: 'cooler-case-clearance',
      slots: ['cooler', 'case'],
      status: 'COMPATIBLE',
      message: `Chiều cao tản nhiệt ${coolerSpecs.heightMm}mm vừa với Case (tối đa ${caseSpecs.maxCoolerHeightMm}mm)`,
    };
  }

  return {
    ruleId: 'cooler-case-clearance',
    slots: ['cooler', 'case'],
    status: 'UNKNOWN',
    message: 'Thiếu kích thước tản nhiệt hoặc giới hạn chiều cao/radiator của Case',
  };
}

function checkPsuCaseLength(psu: ProductDto, pcCase: ProductDto): CompatibilityRuleResult {
  const psuLen = extractPsuLengthMm(psu);
  const maxPsuLen = extractCaseMaxPsuLengthMm(pcCase);
  if (!psuLen || !maxPsuLen) {
    return {
      ruleId: 'psu-case-length',
      slots: ['psu', 'case'],
      status: 'UNKNOWN',
      message: 'Thiếu chiều dài PSU hoặc giới hạn PSU của Case',
    };
  }
  if (psuLen > maxPsuLen) {
    return {
      ruleId: 'psu-case-length',
      slots: ['psu', 'case'],
      status: 'INCOMPATIBLE',
      message: `Nguồn dài ${psuLen}mm vượt giới hạn Case (${maxPsuLen}mm)`,
    };
  }
  return {
    ruleId: 'psu-case-length',
    slots: ['psu', 'case'],
    status: 'COMPATIBLE',
    message: `Chiều dài nguồn ${psuLen}mm vừa với Case (tối đa ${maxPsuLen}mm)`,
  };
}

function checkPsuCapacity(
  psu: ProductDto,
  vga: ProductDto | null,
  cpu: ProductDto | null,
): CompatibilityRuleResult {
  const psuW = extractPsuWattage(psu);
  if (!psuW || (!vga && !cpu)) {
    return {
      ruleId: 'psu-wattage-capacity',
      slots: ['psu'],
      status: 'UNKNOWN',
      message: 'Chưa đủ dữ liệu công suất để đối chiếu Nguồn (PSU)',
    };
  }

  const vgaReqW = vga ? extractVgaRequiredPsuW(vga) : null;
  const cpuPowerW = cpu ? extractCpuPowerW(cpu) : null;
  const vgaTdpW = vga ? extractVgaTdpW(vga) : null;

  // Require concrete wattage data before concluding compatibility
  let requiredMinW: number | null = vgaReqW;
  if (vga && vgaReqW === null && cpuPowerW && vgaTdpW) {
    requiredMinW = Math.ceil(((cpuPowerW + vgaTdpW + 100) * 1.3) / 50) * 50;
  } else if (!vga && cpu && cpuPowerW) {
    requiredMinW = Math.ceil(((cpuPowerW + 100) * 1.3) / 50) * 50;
  }

  if (requiredMinW === null) {
    return {
      ruleId: 'psu-wattage-capacity',
      slots: ['psu'],
      status: 'UNKNOWN',
      message: 'Thiếu thông số công suất yêu cầu từ VGA/CPU để kết luận công suất PSU',
    };
  }

  const involvedSlots: BuilderSlotKey[] = ['psu'];
  if (vga) involvedSlots.push('vga');
  if (cpu && !vgaReqW) involvedSlots.push('cpu');

  if (psuW < requiredMinW) {
    return {
      ruleId: 'psu-wattage-capacity',
      slots: involvedSlots,
      status: 'INCOMPATIBLE',
      message: `Công suất PSU (${psuW}W) thấp hơn mức yêu cầu tối thiểu (${requiredMinW}W)`,
    };
  }

  return {
    ruleId: 'psu-wattage-capacity',
    slots: involvedSlots,
    status: 'COMPATIBLE',
    message: `Công suất PSU ${psuW}W đáp ứng mức yêu cầu ${requiredMinW}W`,
  };
}

function getBuyableProduct(
  config: Partial<Record<string, BuildSlotSelection>>,
  key: BuilderSlotKey,
  overrideKey?: BuilderSlotKey,
  overrideProduct?: ProductDto,
): ProductDto | null {
  if (overrideKey === key) {
    return overrideProduct ?? null;
  }
  const entry = config[key];
  if (!entry || entry.isOwned || !entry.product) return null;
  return entry.product;
}

function collectRuleResults(
  config: Partial<Record<string, BuildSlotSelection>>,
  filterToSlot?: BuilderSlotKey,
  overrideProduct?: ProductDto,
): CompatibilityRuleResult[] {
  const cpu = getBuyableProduct(config, 'cpu', filterToSlot, overrideProduct);
  const mb = getBuyableProduct(config, 'mainboard', filterToSlot, overrideProduct);
  const ram = getBuyableProduct(config, 'ram', filterToSlot, overrideProduct);
  const vga = getBuyableProduct(config, 'vga', filterToSlot, overrideProduct);
  const pcCase = getBuyableProduct(config, 'case', filterToSlot, overrideProduct);
  const cooler = getBuyableProduct(config, 'cooler', filterToSlot, overrideProduct);
  const psu = getBuyableProduct(config, 'psu', filterToSlot, overrideProduct);

  const results: CompatibilityRuleResult[] = [];

  if (cpu && mb && (!filterToSlot || filterToSlot === 'cpu' || filterToSlot === 'mainboard')) {
    results.push(checkCpuMainboardSocket(cpu, mb));
  }
  if (mb && ram && (!filterToSlot || filterToSlot === 'mainboard' || filterToSlot === 'ram')) {
    results.push(checkMainboardRamType(mb, ram));
  }
  if (cpu && ram && (!filterToSlot || filterToSlot === 'cpu' || filterToSlot === 'ram')) {
    const cpuRam = checkCpuRamSupport(cpu, ram);
    if (cpuRam) results.push(cpuRam);
  }
  if (cooler && cpu && (!filterToSlot || filterToSlot === 'cooler' || filterToSlot === 'cpu')) {
    results.push(checkCoolerCpuSocket(cooler, cpu));
  }
  if (vga && pcCase && (!filterToSlot || filterToSlot === 'vga' || filterToSlot === 'case')) {
    results.push(checkVgaCaseLength(vga, pcCase));
  }
  if (mb && pcCase && (!filterToSlot || filterToSlot === 'mainboard' || filterToSlot === 'case')) {
    results.push(checkMainboardCaseFormFactor(mb, pcCase));
  }
  if (cooler && pcCase && (!filterToSlot || filterToSlot === 'cooler' || filterToSlot === 'case')) {
    results.push(checkCoolerCaseClearance(cooler, pcCase));
  }
  if (psu && pcCase && (!filterToSlot || filterToSlot === 'psu' || filterToSlot === 'case')) {
    results.push(checkPsuCaseLength(psu, pcCase));
  }
  if (
    psu &&
    (vga || cpu) &&
    (!filterToSlot || filterToSlot === 'psu' || filterToSlot === 'vga' || filterToSlot === 'cpu')
  ) {
    results.push(checkPsuCapacity(psu, vga, cpu));
  }

  return results;
}

/**
 * Evaluate compatibility for a candidate product before adding it into `slotKey`.
 * Never marks a product COMPATIBLE if no paired rule can be confirmed or required specs are absent.
 */
export function evaluateCandidateForBuild(
  slotKey: BuilderSlotKey,
  candidate: ProductDto,
  config: Partial<Record<string, BuildSlotSelection>>,
): CandidateCompatibilityEvaluation {
  if (!isProductEligibleForSlot(candidate, slotKey)) {
    const actualType = classifyProductComponentType(candidate) || 'không xác định';
    return {
      status: 'INCOMPATIBLE',
      reason: `Sai loại linh kiện: sản phẩm thuộc nhóm "${actualType}", không phù hợp slot ${slotKey}`,
      checks: [],
    };
  }

  const checks = collectRuleResults(config, slotKey, candidate);
  const firstIncompatible = checks.find((c) => c.status === 'INCOMPATIBLE');
  if (firstIncompatible) {
    return {
      status: 'INCOMPATIBLE',
      reason: firstIncompatible.message,
      checks,
    };
  }

  const verified = checks.filter((c) => c.status === 'COMPATIBLE');
  const unknown = checks.filter((c) => c.status === 'UNKNOWN');

  if (checks.length === 0) {
    return {
      status: 'UNKNOWN',
      reason: 'Chưa đủ linh kiện đối chiếu hoặc thiếu dữ liệu ràng buộc',
      checks,
    };
  }

  const firstVerified = verified[0];
  const firstUnknown = unknown[0];

  if (firstVerified && !firstUnknown) {
    return {
      status: 'COMPATIBLE',
      reason: verified.map((c) => c.message).join(' • '),
      checks,
    };
  }

  if (firstVerified && firstUnknown) {
    return {
      status: 'UNKNOWN',
      reason: `${firstVerified.message} (chưa đủ dữ liệu cho: ${firstUnknown.message})`,
      checks,
    };
  }

  return {
    status: 'UNKNOWN',
    reason: firstUnknown?.message || 'Thiếu dữ liệu thông số để kết luận tương thích',
    checks,
  };
}

/**
 * Evaluate compatibility across the entire currently configured build.
 */
export function evaluateBuildCompatibility(
  config: Partial<Record<string, BuildSlotSelection>>,
): BuildCompatibilityEvaluation {
  const checks = collectRuleResults(config);
  const incompatibleChecks = checks.filter((c) => c.status === 'INCOMPATIBLE');
  const verifiedChecks = checks.filter((c) => c.status === 'COMPATIBLE');
  const unknownChecks = checks.filter((c) => c.status === 'UNKNOWN');

  const slotStatuses: Partial<Record<BuilderSlotKey, CompatStatus>> = {};
  for (const check of checks) {
    for (const slot of check.slots) {
      const current = slotStatuses[slot];
      if (check.status === 'INCOMPATIBLE') {
        slotStatuses[slot] = 'INCOMPATIBLE';
      } else if (check.status === 'UNKNOWN' && current !== 'INCOMPATIBLE') {
        slotStatuses[slot] = 'UNKNOWN';
      } else if (check.status === 'COMPATIBLE' && !current) {
        slotStatuses[slot] = 'COMPATIBLE';
      }
    }
  }

  let overallStatus: CompatStatus = 'UNKNOWN';
  if (incompatibleChecks.length > 0) {
    overallStatus = 'INCOMPATIBLE';
  } else if (verifiedChecks.length > 0 && unknownChecks.length === 0) {
    overallStatus = 'COMPATIBLE';
  }

  return {
    overallStatus,
    verifiedChecks,
    incompatibleChecks,
    unknownChecks,
    slotStatuses,
  };
}
