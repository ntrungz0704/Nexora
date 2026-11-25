import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { createApp } from '../src/app.js';

const prisma = new PrismaClient();

describe('TASK 2 (B-03): AI Product Visibility & Eligibility Validation', () => {
  let app: Express;

  let activeCatId: number;
  let activeCatSlug: string;
  let inactiveCatId: number;
  let inactiveCatSlug: string;

  let activeBrandId: number;
  let inactiveBrandId: number;

  let prodEligible1Id: number;
  let prodEligible2Id: number;
  let prodNoBrandId: number;
  let prodInactiveId: number;
  let prodOutOfStockId: number;
  let prodHiddenCatId: number;
  let prodHiddenBrandId: number;

  let uniqueToken: string;

  const createdProductIds: number[] = [];
  const createdCategoryIds: number[] = [];
  const createdBrandIds: number[] = [];
  const createdSurveyLogPromptMarkers: string[] = [];
  const createdChatSessionIds: string[] = [];

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        globalApi: { limit: 500 },
        ai: { limit: 500 },
      },
    });
    const ts = Date.now();
    uniqueToken = `T2B03TOKEN${ts}`;

    activeCatSlug = `t2-b03-active-cat-${ts}`;
    const activeCat = await prisma.category.create({
      data: { name: `T2 Active Cat ${ts}`, slug: activeCatSlug, isActive: true },
    });
    activeCatId = activeCat.id;
    createdCategoryIds.push(activeCat.id);

    inactiveCatSlug = `t2-b03-hidden-cat-${ts}`;
    const inactiveCat = await prisma.category.create({
      data: { name: `T2 Hidden Cat ${ts}`, slug: inactiveCatSlug, isActive: false },
    });
    inactiveCatId = inactiveCat.id;
    createdCategoryIds.push(inactiveCat.id);

    const activeBrand = await prisma.brand.create({
      data: { name: `T2 Active Brand ${ts}`, slug: `t2-active-brand-${ts}`, isActive: true },
    });
    activeBrandId = activeBrand.id;
    createdBrandIds.push(activeBrand.id);

    const inactiveBrand = await prisma.brand.create({
      data: { name: `T2 Hidden Brand ${ts}`, slug: `t2-hidden-brand-${ts}`, isActive: false },
    });
    inactiveBrandId = inactiveBrand.id;
    createdBrandIds.push(inactiveBrand.id);

    // 1. Eligible product A (ACTIVE + Active Cat + Active Brand)
    const p1 = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `${uniqueToken} Eligible Gaming Laptop A`,
        slug: `t2-elig-1-${ts}`,
        sku: `T2-EL1-${ts}`,
        price: 22000000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodEligible1Id = p1.id;
    createdProductIds.push(p1.id);

    // 2. Eligible product B (ACTIVE + Active Cat + Active Brand) for compareProducts
    const p2 = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `${uniqueToken} Eligible Gaming Laptop B`,
        slug: `t2-elig-2-${ts}`,
        sku: `T2-EL2-${ts}`,
        price: 24000000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodEligible2Id = p2.id;
    createdProductIds.push(p2.id);

    // 3. Eligible unbranded product (brandId = null)
    const pNoBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: null,
        name: `${uniqueToken} NoBrand Eligible Device`,
        slug: `t2-nobrand-${ts}`,
        sku: `T2-NBR-${ts}`,
        price: 18000000,
        stockQuantity: 8,
        status: 'ACTIVE',
      },
    });
    prodNoBrandId = pNoBrand.id;
    createdProductIds.push(pNoBrand.id);

    // 4. Hidden by Product INACTIVE
    const pInactive = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `${uniqueToken}SecretInactiveModel`,
        slug: `t2-inactive-${ts}`,
        sku: `T2-INA-${ts}`,
        price: 19000000,
        stockQuantity: 10,
        status: 'INACTIVE',
      },
    });
    prodInactiveId = pInactive.id;
    createdProductIds.push(pInactive.id);

    // 5. Hidden by Product OUT_OF_STOCK
    const pOos = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `${uniqueToken}SecretOosModel`,
        slug: `t2-oos-${ts}`,
        sku: `T2-OOS-${ts}`,
        price: 19500000,
        stockQuantity: 0,
        status: 'OUT_OF_STOCK',
      },
    });
    prodOutOfStockId = pOos.id;
    createdProductIds.push(pOos.id);

    // 6. Hidden by Category isActive = false
    const pHiddenCat = await prisma.product.create({
      data: {
        categoryId: inactiveCatId,
        brandId: activeBrandId,
        name: `${uniqueToken}SecretHiddenCatModel`,
        slug: `t2-hcat-${ts}`,
        sku: `T2-HCT-${ts}`,
        price: 20000000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodHiddenCatId = pHiddenCat.id;
    createdProductIds.push(pHiddenCat.id);

    // 7. Hidden by Brand isActive = false
    const pHiddenBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: inactiveBrandId,
        name: `${uniqueToken}SecretHiddenBrandModel`,
        slug: `t2-hbrand-${ts}`,
        sku: `T2-HBR-${ts}`,
        price: 21000000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodHiddenBrandId = pHiddenBrand.id;
    createdProductIds.push(pHiddenBrand.id);
  });

  afterAll(async () => {
    try {
      if (createdChatSessionIds.length > 0) {
        await prisma.productAiChatHistory.deleteMany({
          where: { guestSessionId: { in: createdChatSessionIds } },
        });
      }
      if (createdProductIds.length > 0) {
        await prisma.productAiChatHistory.deleteMany({
          where: { productId: { in: createdProductIds } },
        });
        await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
      }
      if (createdCategoryIds.length > 0) {
        await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
      }
      if (createdBrandIds.length > 0) {
        await prisma.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
      }
      for (const marker of createdSurveyLogPromptMarkers) {
        await prisma.aiAssistantLog.deleteMany({
          where: { prompt: { contains: marker } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('Cases 1-7: Survey recommendation & fallback recommend ACTIVE/brandId=null products and exclude INACTIVE/hidden-category/hidden-brand items', async () => {
    createdSurveyLogPromptMarkers.push(activeCatSlug, inactiveCatSlug);

    // Query scoped to activeCatSlug (contains eligible1, eligible2, noBrand, AND hidden inactive/oos/hiddenBrand)
    const surveyRes = await request(app).post('/api/v1/ai/assistant/survey').send({
      persona: 'gaming',
      budgetRange: '15m-25m',
      priority: 'performance',
      categoryPreference: activeCatSlug,
    });

    expect(surveyRes.status).toBe(200);
    expect(surveyRes.body.success).toBe(true);
    expect(surveyRes.body.data.recommendations).toHaveLength(3);

    const recommendedIds: number[] = surveyRes.body.data.recommendations.map(
      (r: { product: { id: number } }) => r.product.id,
    );
    const forbiddenIds = [prodInactiveId, prodOutOfStockId, prodHiddenCatId, prodHiddenBrandId];
    for (const id of recommendedIds) {
      expect(forbiddenIds).not.toContain(id);
      expect([prodEligible1Id, prodEligible2Id, prodNoBrandId]).toContain(id);
    }

    // Verify brandId=null product works in survey when it is the sole eligible candidate in a dedicated category
    const isolatedNoBrandCatSlug = `t2-nobrand-only-${Date.now()}`;
    const isolatedCat = await prisma.category.create({
      data: { name: 'T2 NoBrand Only', slug: isolatedNoBrandCatSlug, isActive: true },
    });
    createdCategoryIds.push(isolatedCat.id);
    const isolatedNoBrandProd = await prisma.product.create({
      data: {
        categoryId: isolatedCat.id,
        brandId: null,
        name: `${uniqueToken} Sole Unbranded Candidate`,
        slug: `t2-sole-nobrand-${Date.now()}`,
        sku: `T2-SNB-${Date.now()}`,
        price: 16500000,
        stockQuantity: 4,
        status: 'ACTIVE',
      },
    });
    createdProductIds.push(isolatedNoBrandProd.id);
    createdSurveyLogPromptMarkers.push(isolatedNoBrandCatSlug);

    const noBrandSurvey = await request(app).post('/api/v1/ai/assistant/survey').send({
      persona: 'office',
      budgetRange: '15m-25m',
      priority: 'mobility',
      categoryPreference: isolatedNoBrandCatSlug,
    });
    expect(noBrandSurvey.status).toBe(200);
    expect(noBrandSurvey.body.data.recommendations[0].product.id).toBe(isolatedNoBrandProd.id);
    expect(noBrandSurvey.body.data.recommendations[0].product.brandId).toBeNull();

    // Case 7: Requesting inactiveCatSlug triggers fallback — fallback MUST NOT return prodHiddenCatId or any hidden product
    const fallbackRes = await request(app).post('/api/v1/ai/assistant/survey').send({
      persona: 'creator',
      budgetRange: '15m-25m',
      priority: 'performance',
      categoryPreference: inactiveCatSlug,
    });
    expect(fallbackRes.status).toBe(200);
    const fallbackIds: number[] = fallbackRes.body.data.recommendations.map(
      (r: { product: { id: number } }) => r.product.id,
    );
    for (const id of fallbackIds) {
      expect(forbiddenIds).not.toContain(id);
    }
    const serialized = JSON.stringify(fallbackRes.body);
    expect(serialized).not.toContain('SecretHiddenCatModel');
    expect(serialized).not.toContain('SecretHiddenBrandModel');
    expect(serialized).not.toContain('SecretInactiveModel');
  });

  it('Case 8: Floating chatbot recommends only eligible/brandId=null products and excludes all hidden products', async () => {
    // 1. Direct query targeting hidden inactive product -> must NOT return it
    const resInactive = await request(app)
      .post('/api/v1/ai/chatbot/query')
      .send({ message: `${uniqueToken}SecretInactiveModel` });
    expect(resInactive.status).toBe(200);
    expect(JSON.stringify(resInactive.body)).not.toContain('SecretInactiveModel');
    expect(resInactive.body.data.suggestedProducts).toBeUndefined();

    // 2. Direct query targeting hidden category product -> must NOT return it
    const resHiddenCat = await request(app)
      .post('/api/v1/ai/chatbot/query')
      .send({ message: `${uniqueToken}SecretHiddenCatModel` });
    expect(resHiddenCat.status).toBe(200);
    expect(JSON.stringify(resHiddenCat.body)).not.toContain('SecretHiddenCatModel');
    expect(resHiddenCat.body.data.suggestedProducts).toBeUndefined();

    // 3. Direct query targeting hidden brand product -> must NOT return it
    const resHiddenBrand = await request(app)
      .post('/api/v1/ai/chatbot/query')
      .send({ message: `${uniqueToken}SecretHiddenBrandModel` });
    expect(resHiddenBrand.status).toBe(200);
    expect(JSON.stringify(resHiddenBrand.body)).not.toContain('SecretHiddenBrandModel');
    expect(resHiddenBrand.body.data.suggestedProducts).toBeUndefined();

    // 4. Query matching uniqueToken returns eligible + noBrand products (never any of the 4 hidden ones)
    const resEligible = await request(app)
      .post('/api/v1/ai/chatbot/query')
      .send({ message: `Tư vấn ${uniqueToken}` });
    expect(resEligible.status).toBe(200);
    expect(resEligible.body.data.intent).toBe('PRODUCT_RECOMMENDATION');
    const suggestedIds = (resEligible.body.data.suggestedProducts || []).map(
      (p: { id: number }) => p.id,
    );
    expect(suggestedIds.length).toBeGreaterThanOrEqual(1);
    for (const id of suggestedIds) {
      expect([prodInactiveId, prodOutOfStockId, prodHiddenCatId, prodHiddenBrandId]).not.toContain(
        id,
      );
    }

    // 5. Query matching specifically NoBrand product -> recommended cleanly
    const resNoBrand = await request(app)
      .post('/api/v1/ai/chatbot/query')
      .send({ message: `NoBrand Eligible Device` });
    expect(resNoBrand.status).toBe(200);
    expect(
      (resNoBrand.body.data.suggestedProducts || []).some(
        (p: { id: number }) => p.id === prodNoBrandId,
      ),
    ).toBe(true);
  });

  it('Case 9: compareProducts blocks comparing any inactive, hidden-category, or hidden-brand product without leaking data', async () => {
    // Valid pair (eligible1 + noBrand in same active category) -> 200
    const validCompare = await request(app)
      .post('/api/v1/ai/compare')
      .send({ productIds: [prodEligible1Id, prodNoBrandId] });
    expect(validCompare.status).toBe(200);
    expect(validCompare.body.data.products).toHaveLength(2);

    // Pair with INACTIVE product -> 400 INSUFFICIENT_PRODUCTS, zero leak
    const withInactive = await request(app)
      .post('/api/v1/ai/compare')
      .send({ productIds: [prodEligible1Id, prodInactiveId] });
    expect(withInactive.status).toBe(400);
    expect(withInactive.body.error.code).toBe('INSUFFICIENT_PRODUCTS');
    expect(JSON.stringify(withInactive.body)).not.toContain('SecretInactiveModel');

    // Pair with OUT_OF_STOCK product -> 400 INSUFFICIENT_PRODUCTS
    const withOos = await request(app)
      .post('/api/v1/ai/compare')
      .send({ productIds: [prodEligible1Id, prodOutOfStockId] });
    expect(withOos.status).toBe(400);
    expect(JSON.stringify(withOos.body)).not.toContain('SecretOosModel');

    // Pair with hidden-category product -> 400 INSUFFICIENT_PRODUCTS
    const withHiddenCat = await request(app)
      .post('/api/v1/ai/compare')
      .send({ productIds: [prodEligible1Id, prodHiddenCatId] });
    expect(withHiddenCat.status).toBe(400);
    expect(JSON.stringify(withHiddenCat.body)).not.toContain('SecretHiddenCatModel');

    // Pair with hidden-brand product -> 400 INSUFFICIENT_PRODUCTS
    const withHiddenBrand = await request(app)
      .post('/api/v1/ai/compare')
      .send({ productIds: [prodEligible1Id, prodHiddenBrandId] });
    expect(withHiddenBrand.status).toBe(400);
    expect(JSON.stringify(withHiddenBrand.body)).not.toContain('SecretHiddenBrandModel');

    // 3 products where 2 eligible + 1 hidden -> hidden product is stripped from output
    const mixedThree = await request(app)
      .post('/api/v1/ai/compare')
      .send({ productIds: [prodEligible1Id, prodEligible2Id, prodHiddenBrandId] });
    expect(mixedThree.status).toBe(200);
    expect(mixedThree.body.data.products.map((p: { id: number }) => p.id)).not.toContain(
      prodHiddenBrandId,
    );
    expect(JSON.stringify(mixedThree.body)).not.toContain('SecretHiddenBrandModel');
  });

  it('Cases 10, 12, 13: queryProductChat blocks hidden items BEFORE AI prompt/history, keeps no-brand working, and handles AI provider failure safely', async () => {
    const sess = `t2-chat-${Date.now()}`;
    createdChatSessionIds.push(sess);

    const prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'fake-gemini-key-for-visibility-test';
    const capturedPrompts: string[] = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      if (init && typeof init.body === 'string') {
        capturedPrompts.push(init.body);
      }
      return new Response(JSON.stringify({ error: 'Simulated provider error' }), { status: 500 });
    });

    try {
      // Hidden products MUST return 404 BEFORE calling Gemini or inserting chat history
      for (const hiddenId of [
        prodInactiveId,
        prodOutOfStockId,
        prodHiddenCatId,
        prodHiddenBrandId,
      ]) {
        const res = await request(app).post('/api/v1/ai/product-chat').send({
          productId: hiddenId,
          question: 'Sản phẩm này chơi game ổn không?',
          sessionId: sess,
        });
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
      }

      // Case 13: Prompt spy confirms NO hidden product names were ever sent to AI provider
      expect(capturedPrompts).toHaveLength(0);
      const historyCountHidden = await prisma.productAiChatHistory.count({
        where: {
          productId: { in: [prodInactiveId, prodOutOfStockId, prodHiddenCatId, prodHiddenBrandId] },
        },
      });
      expect(historyCountHidden).toBe(0);

      // Case 12: Chatbot with generic/category query matching ONLY hidden items while AI provider rejects/fails 500
      // MUST fall back safely without leaking any DB hidden product name, SKU, or price in prompt or response
      const botFailFallback = await request(app)
        .post('/api/v1/ai/chatbot/query')
        .send({ message: `Tư vấn sản phẩm thuộc danh mục T2 Hidden Brand` });
      expect(botFailFallback.status).toBe(200);
      expect(botFailFallback.body.data.intent).toBe('GENERAL_ASSISTANCE');
      expect(botFailFallback.body.data.suggestedProducts).toBeUndefined();
      expect(JSON.stringify(botFailFallback.body)).not.toContain('SecretHiddenBrandModel');
      expect(JSON.stringify(botFailFallback.body)).not.toContain('T2-HBR-');
      expect(JSON.stringify(capturedPrompts)).not.toContain('SecretHiddenBrandModel');
      expect(JSON.stringify(capturedPrompts)).not.toContain('T2-HBR-');

      // Also test network rejection from AI provider on both chatbot and eligible product-chat
      fetchSpy.mockRejectedValueOnce(new Error('Simulated network timeout'));
      const botRejectFallback = await request(app)
        .post('/api/v1/ai/chatbot/query')
        .send({ message: `Tư vấn sản phẩm bí mật chưa kinh doanh` });
      expect(botRejectFallback.status).toBe(200);
      expect(botRejectFallback.body.data.intent).toBe('GENERAL_ASSISTANCE');
      expect(botRejectFallback.body.data.suggestedProducts).toBeUndefined();

      fetchSpy.mockRejectedValueOnce(new Error('Simulated network timeout'));
      // Eligible unbranded product with Gemini provider failing -> falls back cleanly to rule-based response
      const noBrandChat = await request(app).post('/api/v1/ai/product-chat').send({
        productId: prodNoBrandId,
        question: 'Chính sách bảo hành ra sao?',
        sessionId: sess,
      });
      expect(noBrandChat.status).toBe(200);
      expect(noBrandChat.body.data.answer).toContain('NoBrand Eligible Device');
    } finally {
      fetchSpy.mockRestore();
      if (prevKey === undefined) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = prevKey;
      }
    }
  });

  it('Case 11: When ZERO eligible products exist in entire database, survey fallback & chatbot NEVER backfill with hidden products', async () => {
    const previouslyActiveIds = (
      await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      })
    ).map((p) => p.id);

    try {
      await prisma.product.updateMany({
        where: { id: { in: previouslyActiveIds } },
        data: { status: 'INACTIVE' },
      });

      const surveyEmptyRes = await request(app).post('/api/v1/ai/assistant/survey').send({
        persona: 'gaming',
        budgetRange: '15m-25m',
        priority: 'performance',
        categoryPreference: 'laptop',
      });
      expect(surveyEmptyRes.status).toBe(404);
      expect(surveyEmptyRes.body.error.code).toBe('NO_CANDIDATES');
      expect(JSON.stringify(surveyEmptyRes.body)).not.toContain(uniqueToken);

      const chatbotEmptyRes = await request(app)
        .post('/api/v1/ai/chatbot/query')
        .send({ message: 'Tư vấn laptop gaming' });
      expect(chatbotEmptyRes.status).toBe(200);
      expect(chatbotEmptyRes.body.data.suggestedProducts).toBeUndefined();
      expect(chatbotEmptyRes.body.data.intent).toBe('GENERAL_ASSISTANCE');
    } finally {
      if (previouslyActiveIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: previouslyActiveIds } },
          data: { status: 'ACTIVE' },
        });
      }
    }
  });
});
