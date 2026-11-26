// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductDto } from '@nexora/shared';
import {
  classifyProductComponentType,
  evaluateBuildCompatibility,
  evaluateCandidateForBuild,
  isPrebuiltPcProduct,
  isProductEligibleForSlot,
} from '../src/lib/pcBuilderCompatibility';
import { PcBuilderPage } from '../src/features/pcBuilder/PcBuilderPage';
import { storefrontService } from '../src/services/storefrontService';
import { cartService } from '../src/services/cartService';

function makeProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 1,
    categoryId: 1,
    brandId: 1,
    name: 'Generic Part',
    slug: 'generic-part',
    sku: 'SKU-1',
    price: '1000000',
    salePrice: null,
    stockQuantity: 10,
    thumbnailUrl: '/assets/images/placeholder.webp',
    shortDescription: 'Test product',
    specs: null,
    isFeatured: false,
    isHot: false,
    status: 'ACTIVE',
    category: { id: 1, name: 'Generic', slug: 'cpu' },
    brand: { id: 1, name: 'ASUS', slug: 'asus' },
    ...overrides,
  };
}

const FIXTURE_CATALOG: ProductDto[] = [
  makeProduct({
    id: 101,
    name: 'CPU Intel Core i5-14400F-C1 Box',
    slug: 'cpu-intel-core-i5-14400f-c1-box',
    sku: 'CPU-INTEL-C1',
    price: '5290000',
    category: { id: 72, name: 'CPU', slug: 'cpu' },
    specs: {
      specs: { socket: 'LGA1700', supported_memory: ['DDR4', 'DDR5'], base_power_w: 65, cores: 10 },
      compatibility: { socket: 'LGA1700', max_power_w: 148 },
      category_slug: 'cpu',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 102,
    name: 'CPU AMD Ryzen 5 7600X-C2 Box',
    slug: 'cpu-amd-ryzen-5-7600x-c2-box',
    sku: 'CPU-AMD-C2',
    price: '6190000',
    category: { id: 72, name: 'CPU', slug: 'cpu' },
    specs: {
      specs: { socket: 'AM5', supported_memory: ['DDR5'], base_power_w: 65, cores: 6 },
      compatibility: { socket: 'AM5', max_power_w: 148 },
      category_slug: 'cpu',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 103,
    name: 'CPU Legacy Model Without Specs',
    slug: 'cpu-legacy-no-specs',
    sku: 'CPU-LEG-1',
    price: '3100000',
    category: { id: 72, name: 'CPU', slug: 'cpu' },
    specs: null,
  }),
  makeProduct({
    id: 201,
    name: 'Mainboard MSI B760 Model-MB2 WiFi DDR5',
    slug: 'mainboard-msi-b760-model-mb2-wifi-ddr5',
    sku: 'MB-MSI-MB2',
    price: '4290000',
    category: { id: 71, name: 'Mainboard', slug: 'mainboard' },
    specs: {
      specs: { socket: 'LGA1700', chipset: 'B760', form_factor: 'Micro-ATX', memory_type: 'DDR5' },
      compatibility: { socket: 'LGA1700', ram_type: 'DDR5' },
      category_slug: 'mainboard',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 202,
    name: 'Mainboard ASUS B650 Model-MB1 WiFi DDR5',
    slug: 'mainboard-asus-b650-model-mb1-wifi-ddr5',
    sku: 'MB-ASUS-MB1',
    price: '5490000',
    category: { id: 71, name: 'Mainboard', slug: 'mainboard' },
    specs: {
      specs: { socket: 'AM5', chipset: 'B650', form_factor: 'ATX', memory_type: 'DDR5' },
      compatibility: { socket: 'AM5', ram_type: 'DDR5' },
      category_slug: 'mainboard',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 301,
    name: 'RAM Corsair Vengeance-R1 16GB (2x8GB) DDR5 6000MHz',
    slug: 'ram-corsair-r1-ddr5',
    sku: 'RAM-CORSAIR-R1',
    price: '1890000',
    category: { id: 74, name: 'RAM', slug: 'ram' },
    specs: {
      specs: { memory_type: 'DDR5', speed_mhz: 6000, module_count: 2, total_capacity_gb: 16 },
      compatibility: { ram_type: 'DDR5' },
      category_slug: 'ram',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 302,
    name: 'RAM TeamGroup Vengeance-R4 16GB (2x8GB) DDR4 3200MHz',
    slug: 'ram-teamgroup-r4-ddr4',
    sku: 'RAM-TG-R4',
    price: '1090000',
    category: { id: 74, name: 'RAM', slug: 'ram' },
    specs: {
      specs: { memory_type: 'DDR4', speed_mhz: 3200, module_count: 2, total_capacity_gb: 16 },
      compatibility: { ram_type: 'DDR4' },
      category_slug: 'ram',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 401,
    name: 'Card màn hình ASUS TUF Gaming GeForce RTX 4070 Ti SUPER 16GB',
    slug: 'vga-asus-tuf-rtx-4070-ti-super',
    sku: 'VGA-ASUS-4070TIS',
    price: '23990000',
    // Grouped seed umbrella category that previously caused VGA -> CPU leak
    category: { id: 4, name: 'Main, CPU, VGA', slug: 'main-cpu-vga' },
    specs: {
      engine: 'NVIDIA® GeForce RTX™ 4070 Ti SUPER',
      cuda: '8448 CUDA Cores',
      power: 'Đề xuất nguồn 750W trở lên (1x 16-pin)',
      length_mm: 340,
    },
  }),
  makeProduct({
    id: 402,
    name: 'VGA MSI GeForce RTX 4060 Ventus-V1 12GB GDDR6X',
    slug: 'vga-msi-rtx-4060-v1',
    sku: 'VGA-MSI-V1',
    price: '8990000',
    category: { id: 73, name: 'VGA', slug: 'vga' },
    specs: {
      specs: { gpu_chip: 'GeForce RTX 4060', length_mm: 280, tdp_w: 115, recommended_psu_w: 550 },
      compatibility: { length_mm: 280, required_psu_w: 550 },
      category_slug: 'vga',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 501,
    name: 'Ổ cứng SSD Samsung 990 PRO 2TB PCIe 4.0 M.2 NVMe DRAM Cache DDR4',
    slug: 'ssd-samsung-990-pro-2tb',
    sku: 'SSD-SS-990PRO',
    price: '4590000',
    category: { id: 75, name: 'Ổ cứng', slug: 'storage' },
    specs: {
      tbw: '1200 TBW',
      interface: 'PCIe Gen 4.0 x4',
      dram_cache: true,
    },
  }),
  makeProduct({
    id: 601,
    name: 'Nguồn PSU Cooler Master Power-PS5 550W 80 Plus Gold',
    slug: 'psu-cooler-master-550w',
    sku: 'PSU-CM-550',
    price: '1690000',
    category: { id: 78, name: 'Nguồn', slug: 'psu' },
    specs: {
      specs: { wattage: 550, length_mm: 160, efficiency_rating: '80 Plus Gold' },
      compatibility: { wattage: 550 },
      category_slug: 'psu',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 602,
    name: 'Nguồn máy tính Corsair RM850e 850W 80 Plus Gold ATX 3.0',
    slug: 'nguon-corsair-rm850e',
    sku: 'PSU-COR-RM850E',
    price: '2990000',
    // Grouped seed umbrella category
    category: { id: 5, name: 'Case, Nguồn, Tản', slug: 'case-nguon-tan' },
    specs: {
      wattage: '850W',
      efficiency: '80 PLUS Gold',
      modularity: 'Full Modular',
    },
  }),
  makeProduct({
    id: 701,
    name: 'Case Montech Air-CS1 Compact Tempered Glass',
    slug: 'case-montech-air-cs1',
    sku: 'CASE-MONTECH-CS1',
    price: '1490000',
    category: { id: 76, name: 'Case', slug: 'case' },
    specs: {
      specs: {
        case_type: 'Mini Tower',
        motherboard_support: ['Micro-ATX', 'Mini-ITX'],
        radiator_support: ['120mm', '240mm'],
        max_gpu_length_mm: 320,
        max_cpu_cooler_height_mm: 160,
        max_psu_length_mm: 170,
      },
      compatibility: { max_gpu_length_mm: 320, max_cpu_cooler_height_mm: 160 },
      category_slug: 'case',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 801,
    name: 'Tản nhiệt nước AIO DeepCool LT720 360mm ARGB hỗ trợ Case ATX',
    slug: 'tan-nuoc-deepcool-lt720-360mm',
    sku: 'COL-DEEP-LT720',
    price: '3090000',
    // Grouped seed umbrella category that previously caused AIO -> Case leak
    category: { id: 5, name: 'Case, Nguồn, Tản', slug: 'case-nguon-tan' },
    specs: {
      radiatorSize: '360mm (3x 120mm FK120 fans)',
      pumpSpeed: '3100 RPM',
      socket: 'LGA1700/1200/115x & AM5/AM4',
    },
  }),
  makeProduct({
    id: 802,
    name: 'Tản nhiệt khí Noctua AM4 Only Tower 170mm',
    slug: 'tan-khi-noctua-am4',
    sku: 'COL-NOCTUA-AM4',
    price: '1990000',
    category: { id: 77, name: 'Tản nhiệt', slug: 'cooling' },
    specs: {
      specs: { cooler_type: 'Air', height_mm: 170, supported_sockets: ['AM4'] },
      compatibility: { height_mm: 170 },
      category_slug: 'cooling',
      schema_version: 1,
    },
  }),
  makeProduct({
    id: 850,
    name: 'Quạt tản nhiệt Case Fan Corsair AF120 RGB',
    slug: 'quat-case-fan-corsair-af120',
    sku: 'FAN-COR-AF120',
    price: '490000',
    category: { id: 77, name: 'Tản nhiệt', slug: 'cooling' },
    specs: {
      specs: { cooler_type: 'Case Fan', fan_size_mm: 120 },
      category_slug: 'cooling',
    },
  }),
  makeProduct({
    id: 901,
    name: 'Máy chơi game cầm tay Lenovo Console-CN31 Ryzen Z1 Extreme 1TB',
    slug: 'lenovo-console-cn31-ryzen',
    sku: 'CON-LEN-CN31',
    price: '17990000',
    category: { id: 84, name: 'Console', slug: 'console' },
    specs: { specs: { platform: 'Handheld', cpu_model: 'Ryzen Z1 Extreme' } },
  }),
  makeProduct({
    id: 902,
    name: 'Laptop MSI Creator Z16 HX Studio Intel Core i7 DDR5 RTX 4060 SSD 1TB',
    slug: 'laptop-msi-creator-z16',
    sku: 'LAP-MSI-Z16',
    price: '45990000',
    category: { id: 1, name: 'Laptop', slug: 'laptop' },
    specs: { specs: { battery_wh: 90, cpu_model: 'Intel Core i7', gpu_model: 'RTX 4060' } },
  }),
  makeProduct({
    id: 903,
    name: 'PC Nexora Gaming P1 AMD Ryzen 5 7600X RTX 4070 Super 12GB 16GB',
    slug: 'pc-nexora-gaming-p1',
    sku: 'PC-TP-P1',
    price: '28990000',
    category: { id: 69, name: 'PC Nexora', slug: 'pc' },
    specs: { specs: { cpu_model: 'AMD Ryzen 5 7600X', gpu_model: 'RTX 4070 Super' } },
  }),
  makeProduct({
    id: 904,
    name: 'Màn hình Samsung Odyssey OLED G9',
    slug: 'man-hinh-samsung-g9',
    sku: 'MON-SS-G9',
    price: '34500000',
    category: { id: 70, name: 'Màn hình', slug: 'monitor' },
  }),
  makeProduct({
    id: 905,
    name: 'Chuột Logitech G Pro X Superlight 2',
    slug: 'chuot-logitech-gpx2',
    sku: 'MOU-LOG-GPX2',
    price: '3290000',
    category: { id: 80, name: 'Chuột', slug: 'mouse' },
  }),
  makeProduct({
    id: 906,
    name: 'Bàn phím cơ Logitech G913 TKL',
    slug: 'ban-phim-logitech-g913',
    sku: 'KB-LOG-G913',
    price: '3890000',
    category: { id: 79, name: 'Bàn phím', slug: 'keyboard' },
  }),
  makeProduct({
    id: 907,
    name: 'Ghế Ergonomic Sihoo Doro C300',
    slug: 'ghe-sihoo-c300',
    sku: 'CHR-SIHOO-C300',
    price: '6190000',
    category: { id: 81, name: 'Ghế', slug: 'chair' },
  }),
];

function renderPcBuilder() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/pc-builder']}>
        <Routes>
          <Route path="/pc-builder" element={<PcBuilderPage />} />
          <Route path="/cart" element={<div>Cart Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DEF-RT-02: PC Builder component classification and compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(storefrontService, 'getCategories').mockResolvedValue([]);
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({
      products: FIXTURE_CATALOG,
      total: FIXTURE_CATALOG.length,
    });
    vi.spyOn(cartService, 'getCart').mockResolvedValue({
      items: [],
      totalItems: 0,
      subtotal: '0',
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('1-8. strictly isolates every slot so wrong hardware types never leak', () => {
    const cpuOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'cpu'));
    const mbOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'mainboard'));
    const ramOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'ram'));
    const vgaOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'vga'));
    const storageOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'storage'));
    const psuOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'psu'));
    const caseOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'case'));
    const coolerOnly = FIXTURE_CATALOG.filter((p) => isProductEligibleForSlot(p, 'cooler'));

    // 1. CPU slot must reject VGA, Console, Laptop, Prebuilt PC
    expect(cpuOnly.map((p) => p.id)).toEqual([101, 102, 103]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 401),
        'cpu',
      ),
    ).toBe(false);
    // 2. CPU slot must reject RAM
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 301),
        'cpu',
      ),
    ).toBe(false);
    // 3. Case slot must reject AIO Cooling and Case Fan
    expect(caseOnly.map((p) => p.id)).toEqual([701]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 801),
        'case',
      ),
    ).toBe(false);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 850),
        'case',
      ),
    ).toBe(false);
    // 4. Cooling slot must reject Case and Cooler Master PSU and Case Fan
    expect(coolerOnly.map((p) => p.id)).toEqual([801, 802]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 701),
        'cooler',
      ),
    ).toBe(false);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 601),
        'cooler',
      ),
    ).toBe(false);
    // 5. GPU slot must reject CPU and Prebuilt PC with RTX in title
    expect(vgaOnly.map((p) => p.id)).toEqual([401, 402]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 101),
        'vga',
      ),
    ).toBe(false);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 903),
        'vga',
      ),
    ).toBe(false);
    // 6. RAM slot must reject SSD mentioning DDR4 DRAM Cache and Mainboard mentioning DDR5
    expect(ramOnly.map((p) => p.id)).toEqual([301, 302]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 501),
        'ram',
      ),
    ).toBe(false);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 201),
        'ram',
      ),
    ).toBe(false);
    // 7. Motherboard slot must reject GPU and Laptop
    expect(mbOnly.map((p) => p.id)).toEqual([201, 202]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 401),
        'mainboard',
      ),
    ).toBe(false);
    // 8. Storage slot must reject PSU and Laptop mentioning SSD 1TB
    expect(storageOnly.map((p) => p.id)).toEqual([501]);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 601),
        'storage',
      ),
    ).toBe(false);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 902),
        'storage',
      ),
    ).toBe(false);
    // PSU slot keeps both direct and grouped seed PSUs
    expect(psuOnly.map((p) => p.id)).toEqual([601, 602]);
  });

  it('9-10. resolves misleading keywords accurately and recognizes all supported categories + Case Fan', () => {
    const vgaMisleading = makeProduct({
      id: 9901,
      name: 'VGA RTX 4080 Intel Core Optimized Edition',
      category: { id: 4, name: 'Main, CPU, VGA', slug: 'main-cpu-vga' },
      specs: null,
    });
    const aioMisleading = makeProduct({
      id: 9902,
      name: 'Tản nhiệt nước AIO 240mm hỗ trợ Case ATX',
      category: { id: 5, name: 'Case, Nguồn, Tản', slug: 'case-nguon-tan' },
      specs: null,
    });
    const psuMisleading = makeProduct({
      id: 9903,
      name: 'Nguồn PSU Cooler Master MWE 750W',
      category: { id: 5, name: 'Case, Nguồn, Tản', slug: 'case-nguon-tan' },
      specs: null,
    });
    const caseFan = FIXTURE_CATALOG.find((p) => p.id === 850)!;
    const laptopCreator = FIXTURE_CATALOG.find((p) => p.id === 902)!;
    const consoleRyzen = FIXTURE_CATALOG.find((p) => p.id === 901)!;

    expect(classifyProductComponentType(vgaMisleading)).toBe('vga');
    expect(classifyProductComponentType(aioMisleading)).toBe('cooler');
    expect(classifyProductComponentType(psuMisleading)).toBe('psu');
    expect(classifyProductComponentType(caseFan)).toBe('case-fan');
    expect(classifyProductComponentType(laptopCreator)).toBe('laptop');
    expect(classifyProductComponentType(consoleRyzen)).toBe('console');
    expect(isPrebuiltPcProduct(laptopCreator)).toBe(false);
    expect(isPrebuiltPcProduct(FIXTURE_CATALOG.find((p) => p.id === 903))).toBe(true);

    // Valid peripheral categories still resolve accurately
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 904),
        'monitor',
      ),
    ).toBe(true);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 905),
        'mouse',
      ),
    ).toBe(true);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 906),
        'keyboard',
      ),
    ).toBe(true);
    expect(
      isProductEligibleForSlot(
        FIXTURE_CATALOG.find((p) => p.id === 907),
        'chair',
      ),
    ).toBe(true);
  });

  it('11. marks missing spec data as UNKNOWN instead of falsely COMPATIBLE or INCOMPATIBLE', () => {
    const cpuNoSpecs = FIXTURE_CATALOG.find((p) => p.id === 103)!;
    const mbLga1700 = FIXTURE_CATALOG.find((p) => p.id === 201)!;

    // Candidate with empty config -> UNKNOWN
    const initialCandidate = evaluateCandidateForBuild('cpu', FIXTURE_CATALOG[0], {});
    expect(initialCandidate.status).toBe('UNKNOWN');

    // Candidate lacking socket spec when Mainboard IS selected -> UNKNOWN, not INCOMPATIBLE
    const missingSocketEval = evaluateCandidateForBuild('cpu', cpuNoSpecs, {
      mainboard: { product: mbLga1700, isOwned: false },
    });
    expect(missingSocketEval.status).toBe('UNKNOWN');

    const buildEval = evaluateBuildCompatibility({
      cpu: { product: cpuNoSpecs, isOwned: false },
      mainboard: { product: mbLga1700, isOwned: false },
    });
    expect(buildEval.overallStatus).toBe('UNKNOWN');
    expect(buildEval.incompatibleChecks).toHaveLength(0);
    expect(buildEval.unknownChecks).toHaveLength(1);
  });

  it('12-13. detects concrete socket, RAM generation, VGA/Cooler/MB Case clearance, and PSU wattage conflicts', () => {
    const cpuLga1700 = FIXTURE_CATALOG.find((p) => p.id === 101)!;
    const cpuAm5 = FIXTURE_CATALOG.find((p) => p.id === 102)!;
    const mbAm5 = FIXTURE_CATALOG.find((p) => p.id === 202)!; // ATX, AM5, DDR5
    const ramDdr4 = FIXTURE_CATALOG.find((p) => p.id === 302)!;
    const vgaLong = FIXTURE_CATALOG.find((p) => p.id === 401)!; // 340mm, 750W
    const psuLow = FIXTURE_CATALOG.find((p) => p.id === 601)!; // 550W
    const smallCase = FIXTURE_CATALOG.find((p) => p.id === 701)!; // Micro-ATX, 320mm GPU, 160mm cooler, 240mm rad
    const aio360 = FIXTURE_CATALOG.find((p) => p.id === 801)!; // 360mm
    const airAm4 = FIXTURE_CATALOG.find((p) => p.id === 802)!; // AM4 only, 170mm

    const badBuild = evaluateBuildCompatibility({
      cpu: { product: cpuLga1700, isOwned: false },
      mainboard: { product: mbAm5, isOwned: false },
      ram: { product: ramDdr4, isOwned: false },
      vga: { product: vgaLong, isOwned: false },
      psu: { product: psuLow, isOwned: false },
      case: { product: smallCase, isOwned: false },
      cooler: { product: aio360, isOwned: false },
    });

    const ruleIds = badBuild.incompatibleChecks.map((c) => c.ruleId);
    expect(badBuild.overallStatus).toBe('INCOMPATIBLE');
    expect(ruleIds).toContain('cpu-mainboard-socket');
    expect(ruleIds).toContain('ram-mainboard-type');
    expect(ruleIds).toContain('vga-case-length');
    expect(ruleIds).toContain('mainboard-case-form-factor');
    expect(ruleIds).toContain('cooler-case-clearance');
    expect(ruleIds).toContain('psu-wattage-capacity');

    // Cooler socket mismatch check (AM4-only air cooler vs AM5 CPU)
    const coolerMismatch = evaluateBuildCompatibility({
      cpu: { product: cpuAm5, isOwned: false },
      cooler: { product: airAm4, isOwned: false },
      case: { product: smallCase, isOwned: false },
    });
    expect(coolerMismatch.incompatibleChecks.map((c) => c.ruleId)).toEqual(
      expect.arrayContaining(['cooler-cpu-socket', 'cooler-case-clearance']),
    );
  });

  it('14-15. renders PC Builder UI: filters strict categories, preserves other parts when swapping to incompatible part, warns clearly, and adds to cart', async () => {
    const addSpy = vi.spyOn(cartService, 'addItem').mockResolvedValue({} as never);
    renderPcBuilder();

    await waitFor(() => expect(screen.getByText('Bộ vi xử lý (CPU)')).toBeInTheDocument());

    // Open CPU modal: verify VGA/Console/Laptop do NOT appear, only 3 CPUs appear
    const cpuRow = screen.getByText('Bộ vi xử lý (CPU)').closest('.pc-builder-row') as HTMLElement;
    fireEvent.click(within(cpuRow).getByRole('button', { name: /Chọn mua/i }));

    const modal = await screen.findByText('Chọn Bộ vi xử lý (CPU)');
    const modalContainer = modal.closest('.pc-modal') as HTMLElement;

    expect(within(modalContainer).getByText('CPU Intel Core i5-14400F-C1 Box')).toBeInTheDocument();
    expect(within(modalContainer).getByText('CPU AMD Ryzen 5 7600X-C2 Box')).toBeInTheDocument();
    expect(
      within(modalContainer).queryByText(/GeForce RTX 4070 Ti SUPER/i),
    ).not.toBeInTheDocument();
    expect(within(modalContainer).queryByText(/Console-CN31/i)).not.toBeInTheDocument();
    expect(within(modalContainer).queryByText(/Laptop MSI Creator/i)).not.toBeInTheDocument();

    // Verify missing paired parts -> shows UNKNOWN neutral message, NOT false "Tương thích tốt"
    expect(within(modalContainer).queryByText('Tương thích tốt')).not.toBeInTheDocument();

    // Pick Intel Core i5-14400F (LGA1700)
    const cpu1Row = within(modalContainer)
      .getByText('CPU Intel Core i5-14400F-C1 Box')
      .closest('.pc-modal-item') as HTMLElement;
    fireEvent.click(within(cpu1Row).getByRole('button', { name: /Chọn mua/i }));

    // Open Mainboard modal -> pick matching MSI B760 (LGA1700, DDR5)
    const mbRow = screen
      .getByText('Bo mạch chủ (Mainboard)')
      .closest('.pc-builder-row') as HTMLElement;
    fireEvent.click(within(mbRow).getByRole('button', { name: /Chọn mua/i }));
    const mbModal = (await screen.findByText('Chọn Bo mạch chủ (Mainboard)')).closest(
      '.pc-modal',
    ) as HTMLElement;
    const b760Row = within(mbModal)
      .getByText('Mainboard MSI B760 Model-MB2 WiFi DDR5')
      .closest('.pc-modal-item') as HTMLElement;
    expect(within(b760Row).getByText(/Tương thích:/)).toBeInTheDocument();
    fireEvent.click(within(b760Row).getByRole('button', { name: /Chọn mua/i }));

    // Now swap CPU to AMD Ryzen 5 7600X (AM5) while B760 (LGA1700) stays selected ->
    // warns INCOMPATIBLE cleanly and DOES NOT silently delete Mainboard
    fireEvent.click(within(cpuRow).getByRole('button', { name: /Đổi/i }));
    const cpuSwapModal = (await screen.findByText('Chọn Bộ vi xử lý (CPU)')).closest(
      '.pc-modal',
    ) as HTMLElement;
    const ryzenRow = within(cpuSwapModal)
      .getByText('CPU AMD Ryzen 5 7600X-C2 Box')
      .closest('.pc-modal-item') as HTMLElement;
    expect(within(ryzenRow).getByText(/Không tương thích:/i)).toBeInTheDocument();
    fireEvent.click(within(ryzenRow).getByRole('button', { name: /Chọn \(Cảnh báo\)/i }));

    // Mainboard must still exist in the build + overall status badge shows INCOMPATIBLE
    expect(screen.getByText('Mainboard MSI B760 Model-MB2 WiFi DDR5')).toBeInTheDocument();
    expect(screen.getByTestId('pc-builder-overall-status')).toHaveTextContent('INCOMPATIBLE');
    expect(screen.getByText(/INCOMPATIBLE: Lỗi Socket: CPU \(AM5\)/i)).toBeInTheDocument();

    // Open Case modal -> verify AIO DeepCool LT720 and Case Fan do NOT appear
    const caseRow = screen
      .getByText('Vỏ máy tính (Case)')
      .closest('.pc-builder-row') as HTMLElement;
    fireEvent.click(within(caseRow).getByRole('button', { name: /Chọn mua/i }));
    const caseModal = (await screen.findByText('Chọn Vỏ máy tính (Case)')).closest(
      '.pc-modal',
    ) as HTMLElement;
    expect(within(caseModal).queryByText(/DeepCool LT720/i)).not.toBeInTheDocument();
    expect(within(caseModal).queryByText(/Case Fan Corsair/i)).not.toBeInTheDocument();
    expect(
      within(caseModal).getByText('Case Montech Air-CS1 Compact Tempered Glass'),
    ).toBeInTheDocument();
    fireEvent.click(within(caseModal).getByRole('button', { name: '×' }));

    // Verify existing Add to Cart still works cleanly without error
    fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ hàng/i }));
    await waitFor(() => expect(addSpy).toHaveBeenCalledTimes(2));
  });
});
