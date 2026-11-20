import type { ProductDto } from './index.js';

export interface PersonaScoreBreakdown {
  personaFit: number;
  performanceFit: number;
  valueFit: number;
  longevity: number;
  categoryQuality: number;
  dataCompleteness: number;
  totalScore: number;
}

export interface PersonaScoredProduct {
  product: ProductDto;
  totalScore: number;
  breakdown: PersonaScoreBreakdown;
  strengths: string[];
}

export function cleanAndParseSpecs(product: ProductDto): Record<string, string> {
  const cleaned: Record<string, string> = {};
  let rawSpecs: Record<string, unknown> = {};

  if (product.specs) {
    if (typeof product.specs === 'string') {
      try {
        rawSpecs = JSON.parse(product.specs);
      } catch {
        rawSpecs = {};
      }
    } else if (typeof product.specs === 'object') {
      rawSpecs = product.specs as Record<string, unknown>;
    }
  }

  // If specs has inner 'specs' object (TechPilot normalized schema)
  const inner =
    rawSpecs.specs && typeof rawSpecs.specs === 'object' && !Array.isArray(rawSpecs.specs)
      ? (rawSpecs.specs as Record<string, unknown>)
      : rawSpecs;

  const excluded = new Set([
    'schema_version',
    'category_slug',
    'use_cases',
    'compatibility',
    'model',
    'id',
    'sku',
  ]);

  for (const [k, v] of Object.entries(inner)) {
    if (excluded.has(k.toLowerCase()) || v === null || v === undefined || v === '') continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      cleaned[k] = String(v).trim();
    }
  }

  // Extract from product name if missing (TechPilot parity)
  const name = product.name;
  if (!cleaned['cpu_model'] && !cleaned['cpu']) {
    const m = name.match(/(Intel Core i\d[-\w]*|AMD Ryzen \d[-\w]*|Apple M\d\w*)/i);
    if (m && m[1]) cleaned['cpu_model'] = m[1];
  }
  if (!cleaned['gpu_model'] && !cleaned['gpu'] && !cleaned['vga']) {
    const m = name.match(
      /(RTX\s*\d{4}[-\w]*|GTX\s*\d{4}[-\w]*|Radeon\s*RX\s*\d{4}[-\w]*|Intel\s*Arc\s*[-\w]*)/i,
    );
    if (m && m[1]) cleaned['gpu_model'] = m[1];
  }
  if (!cleaned['ram_gb'] && !cleaned['ram']) {
    const m = name.match(/(\d{1,2})GB\s*(DDR\d)?/i);
    if (m && m[1]) cleaned['ram_gb'] = m[1];
  }
  if (!cleaned['storage_gb'] && !cleaned['storage'] && !cleaned['ssd']) {
    const m = name.match(
      /(SSD\s*\d{3,4}GB|SSD\s*1TB|2TB|\d{3,4}GB\s*SSD|1TB\s*SSD|2TB\s*SSD)/i,
    );
    if (m && m[1]) cleaned['storage_gb'] = m[1];
  }

  return cleaned;
}

export function calculateProductPersonaScore(
  product: ProductDto,
  categoryKey: string,
  persona: string,
): PersonaScoreBreakdown {
  const specs = cleanAndParseSpecs(product);
  const name = product.name.toLowerCase();
  const effectivePrice = Number(product.salePrice || product.price) || 0;
  const cat = categoryKey.toLowerCase();
  const pers = persona.toLowerCase();

  // 1. calcPersonaFit (Base: 25, Max: 35)
  let personaFit = 25;
  if (cat === 'prebuilt_pc' || cat === 'pc') {
    if (
      pers === 'aaa_gaming' &&
      (name.includes('rtx 4070') || name.includes('rtx 4080') || name.includes('rtx 4090'))
    ) {
      personaFit += 10;
    } else if (
      pers === 'esports' &&
      (name.includes('rtx 4060') || name.includes('i5') || name.includes('ryzen 5'))
    ) {
      personaFit += 8;
    } else if (pers === 'ai_ml' && name.includes('rtx 40')) {
      personaFit += 10;
    } else if (pers === 'office' && (name.includes('i3') || name.includes('văn phòng'))) {
      personaFit += 8;
    }
  } else if (cat === 'laptop') {
    if (pers === 'gamer' && (name.includes('gaming') || name.includes('rtx'))) {
      personaFit += 10;
    } else if (
      pers === 'developer' &&
      (name.includes('i7') || name.includes('ryzen 7') || name.includes('32gb'))
    ) {
      personaFit += 8;
    } else if (
      pers === 'business_travel' &&
      (name.includes('slim') || name.includes('oled') || name.includes('zenbook'))
    ) {
      personaFit += 8;
    } else if (pers === 'office' && (name.includes('i3') || name.includes('văn phòng'))) {
      personaFit += 8;
    } else if (
      pers === 'student' &&
      (name.includes('vivobook') ||
        name.includes('ideapad') ||
        name.includes('aspire') ||
        name.includes('i3') ||
        name.includes('i5'))
    ) {
      personaFit += 8;
    } else if (
      pers === 'creator' &&
      (name.includes('oled') ||
        name.includes('creator') ||
        name.includes('rtx') ||
        name.includes('proart'))
    ) {
      personaFit += 10;
    }
  } else if (cat === 'monitor') {
    if (
      pers === 'esports' &&
      (name.includes('180hz') || name.includes('240hz') || name.includes('144hz'))
    ) {
      personaFit += 10;
    } else if (
      pers === 'creator' &&
      (name.includes('4k') || name.includes('2k') || name.includes('ips') || name.includes('oled'))
    ) {
      personaFit += 8;
    } else if (
      pers === 'office' &&
      (name.includes('ips') || name.includes('fhd') || name.includes('văn phòng'))
    ) {
      personaFit += 8;
    }
  }
  personaFit = Math.min(35, personaFit);

  // 2. calcPerformanceFit (Base: 18, Max: 25)
  let performanceFit = 18;
  if (
    name.includes('i9') ||
    name.includes('ryzen 9') ||
    name.includes('rtx 4080') ||
    name.includes('rtx 4090')
  ) {
    performanceFit = 25;
  } else if (name.includes('i7') || name.includes('ryzen 7') || name.includes('rtx 4070')) {
    performanceFit = 22;
  } else if (name.includes('i5') || name.includes('ryzen 5') || name.includes('rtx 4060')) {
    performanceFit = 20;
  }

  // 3. calcValueFit (9, 12, or 15)
  let valueFit: number;
  if (effectivePrice <= 0) {
    valueFit = 10;
  } else {
    const valRatio = (performanceFit * 1000000) / effectivePrice;
    if (valRatio >= 1.0) valueFit = 15;
    else if (valRatio >= 0.7) valueFit = 12;
    else valueFit = 9;
  }

  // 4. calcLongevityUpgrade (7, 9, or 10)
  let longevity = 7;
  if (cat === 'prebuilt_pc' || cat === 'pc') {
    longevity = 10;
  } else if (name.includes('32gb') || name.includes('1tb') || name.includes('dễ nâng cấp')) {
    longevity = 9;
  }

  // 5. calcCategoryQuality (7 or 10)
  const brandName = (product.brand?.name || '').toLowerCase();
  const tier1Brands = [
    'asus',
    'msi',
    'dell',
    'gigabyte',
    'apple',
    'razer',
    'corsair',
    'lenovo',
    'hp',
    'acer',
  ];
  const categoryQuality = tier1Brands.some((b) => brandName.includes(b) || name.includes(b))
    ? 10
    : 7;

  // 6. calcDataCompleteness (0, 1, 3, or 5) — STRICTLY PENALIZES MISSING DATA WITHOUT INVENTING HARDWARE SPECS
  const specCount = Object.keys(specs).length;
  let dataCompleteness: number;
  if (specCount >= 5) dataCompleteness = 5;
  else if (specCount >= 3) dataCompleteness = 3;
  else if (specCount >= 1) dataCompleteness = 1;
  else dataCompleteness = 0;

  // Total Score: bounded between 50 and 99
  const rawTotal =
    personaFit + performanceFit + valueFit + longevity + categoryQuality + dataCompleteness;
  const totalScore = Math.min(99, Math.max(50, Math.round(rawTotal)));

  return {
    personaFit,
    performanceFit,
    valueFit,
    longevity,
    categoryQuality,
    dataCompleteness,
    totalScore,
  };
}

export function rankComparedProducts(
  products: ProductDto[],
  categoryKey: string,
  persona: string,
): PersonaScoredProduct[] {
  const scored = products.map((p) => {
    const breakdown = calculateProductPersonaScore(p, categoryKey, persona);
    const specs = cleanAndParseSpecs(p);
    const strengths: string[] = [];
    if (breakdown.totalScore >= 90) {
      strengths.push(`Điểm đánh giá tổng thể cao vượt trội (${breakdown.totalScore}/100)`);
    }
    if (specs['cpu_model'] || specs['cpu']) {
      strengths.push(`Bộ vi xử lý mạnh mẽ: ${specs['cpu_model'] || specs['cpu']}`);
    }
    if (specs['gpu_model'] || specs['gpu'] || specs['vga']) {
      strengths.push(`Card đồ họa xử lý mượt: ${specs['gpu_model'] || specs['gpu'] || specs['vga']}`);
    }
    if (specs['ram_gb'] || specs['ram']) {
      strengths.push(`Bộ nhớ RAM đáp ứng tốt tác vụ: ${specs['ram_gb'] || specs['ram']}`);
    }
    if (strengths.length === 0) {
      strengths.push('Sản phẩm chính hãng chất lượng cao');
    }

    return {
      product: p,
      totalScore: breakdown.totalScore,
      breakdown,
      strengths: strengths.slice(0, 3),
    };
  });

  // Stable sort: totalScore DESC, tie-breaking by id ASC (exact TechPilot parity)
  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.product.id - b.product.id;
  });

  return scored;
}
