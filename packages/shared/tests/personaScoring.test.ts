import { describe, it, expect } from 'vitest';
import {
  calculateProductPersonaScore,
  rankComparedProducts,
  cleanAndParseSpecs,
} from '../src/personaScoring.js';
import type { ProductDto } from '../src/index.js';

describe('Persona Scoring Engine (TechPilot Parity)', () => {
  const highEndGamerLaptop: ProductDto = {
    id: 101,
    name: 'Laptop Gaming ASUS ROG Strix SCAR 16 i9-14900HX RTX 4090 32GB 2TB',
    slug: 'asus-rog-strix-scar-16',
    sku: 'ROG-SCAR-16',
    price: '85000000',
    salePrice: '79990000',
    stockQuantity: 5,
    categoryId: 1,
    brandId: 1,
    isFeatured: true,
    isHot: true,
    status: 'ACTIVE',
    thumbnailUrl: '/assets/images/rog.jpg',
    shortDescription: 'Laptop gaming đỉnh cao RTX 4090',
    specs: {
      cpu: 'Intel Core i9-14900HX',
      gpu: 'NVIDIA GeForce RTX 4090 16GB',
      ram: '32GB DDR5 5600MHz',
      storage: '2TB PCIe 4.0 NVMe M.2 SSD',
      screen: '16 inch QHD+ 240Hz Mini LED',
      weight: '2.5 kg',
    },
    category: { id: 1, name: 'Laptop', slug: 'laptop' },
    brand: { id: 1, name: 'ASUS', slug: 'asus' },
  };

  const budgetStudentLaptop: ProductDto = {
    id: 102,
    name: 'Laptop Acer Aspire 3 A315 i3-1215U 8GB SSD 512GB',
    slug: 'acer-aspire-3-a315',
    sku: 'ACER-A315',
    price: '11990000',
    salePrice: '9990000',
    stockQuantity: 15,
    categoryId: 1,
    brandId: 2,
    isFeatured: false,
    isHot: false,
    status: 'ACTIVE',
    thumbnailUrl: '/assets/images/acer.jpg',
    shortDescription: 'Laptop học tập sinh viên',
    specs: {
      cpu: 'Intel Core i3-1215U',
      gpu: 'Intel UHD Graphics',
      ram: '8GB DDR4',
      storage: '512GB NVMe SSD',
      screen: '15.6 inch FHD 60Hz',
    },
    category: { id: 1, name: 'Laptop', slug: 'laptop' },
    brand: { id: 2, name: 'Acer', slug: 'acer' },
  };

  const missingSpecsProduct: ProductDto = {
    id: 103,
    name: 'Phụ kiện Chuột Gaming Không Dây',
    slug: 'chuot-gaming-khong-day',
    sku: 'MOUSE-01',
    price: '500000',
    salePrice: null,
    stockQuantity: 20,
    categoryId: 2,
    brandId: null,
    isFeatured: false,
    isHot: false,
    status: 'ACTIVE',
    thumbnailUrl: null,
    shortDescription: 'Chuột không dây cơ bản',
    specs: {},
    category: { id: 2, name: 'Chuột', slug: 'mouse' },
    brand: null,
  };

  it('1. correctly parses specs without inventing fake hardware for empty specs', () => {
    const cleanedEmpty = cleanAndParseSpecs(missingSpecsProduct);
    // Specs should remain empty, dataCompleteness = 0
    expect(cleanedEmpty['cpu_model']).toBeUndefined();
    expect(cleanedEmpty['ram_gb']).toBeUndefined();
    expect(cleanedEmpty['storage_gb']).toBeUndefined();

    const score = calculateProductPersonaScore(missingSpecsProduct, 'mouse', 'gamer');
    expect(score.dataCompleteness).toBe(0);
  });

  it('2. grants maximum dataCompleteness (5) to fully specified products', () => {
    const score = calculateProductPersonaScore(highEndGamerLaptop, 'laptop', 'gamer');
    expect(score.dataCompleteness).toBe(5);
    expect(score.totalScore).toBeGreaterThanOrEqual(70);
  });

  it('3. changes scores dynamically when persona switches', () => {
    const gamerScore = calculateProductPersonaScore(highEndGamerLaptop, 'laptop', 'gamer');
    const studentScore = calculateProductPersonaScore(highEndGamerLaptop, 'laptop', 'student');

    // High-end RTX 4090 laptop fits Gamer persona significantly better than Student persona (which penalizes high price)
    expect(gamerScore.personaFit).toBeGreaterThan(studentScore.personaFit);
    expect(gamerScore.totalScore).toBeGreaterThan(studentScore.totalScore);
  });

  it('4. budget student laptop scores higher for student persona than gamer persona', () => {
    const studentScore = calculateProductPersonaScore(budgetStudentLaptop, 'laptop', 'student');
    const gamerScore = calculateProductPersonaScore(budgetStudentLaptop, 'laptop', 'gamer');

    expect(studentScore.personaFit).toBeGreaterThan(gamerScore.personaFit);
  });

  it('5. breaks ties deterministically by product id ASC when totalScore is identical', () => {
    const productA: ProductDto = { ...budgetStudentLaptop, id: 205 };
    const productB: ProductDto = { ...budgetStudentLaptop, id: 104 };

    const ranked = rankComparedProducts([productA, productB], 'laptop', 'student');
    expect(ranked[0].product.id).toBe(104);
    expect(ranked[1].product.id).toBe(205);
  });

  it('6. produces higher valueFit for products with higher performance-to-price ratio', () => {
    const scoreA = calculateProductPersonaScore(budgetStudentLaptop, 'laptop', 'office');
    // Low price (9.99M) gives high (perf / price) ratio -> valueFit 15 or 12
    expect(scoreA.valueFit).toBeGreaterThanOrEqual(12);
  });
});
