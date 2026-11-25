import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';

const prisma = new PrismaClient();

describe('TASK 3 (B-04): Catalog, Marketing & Storefront Visibility + Historical Order/After-Sales Integrity', () => {
  let app: Express;
  let customerToken: string;
  let customerId: number;

  let activeCatId: number;
  let activeCatSlug: string;
  let hiddenCatId: number;
  let hiddenCatSlug: string;

  let activeBrandId: number;
  let activeBrandSlug: string;
  let hiddenBrandId: number;
  let hiddenBrandSlug: string;

  let prodEligibleId: number;
  let prodEligibleSlug: string;
  let prodNoBrandId: number;
  let prodNoBrandSlug: string;
  let prodInactiveId: number;
  let prodInactiveSlug: string;
  let prodHiddenCatId: number;
  let prodHiddenCatSlug: string;
  let prodHiddenBrandId: number;
  let prodHiddenBrandSlug: string;

  let prodLaterHiddenId: number;
  let prodLaterHiddenSlug: string;
  let laterHiddenCatId: number;
  let laterHiddenBrandId: number;
  let historicalOrderCode: string;
  let historicalOrderId: bigint;
  let historicalOrderItemId: bigint;
  let historicalReturnId: number | null = null;
  let historicalReviewId: number;

  let createdFlashSaleId: number;
  let uniqueToken: string;

  const createdProductIds: number[] = [];
  const createdCategoryIds: number[] = [];
  const createdBrandIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdGuestSessions: string[] = [];

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        globalApi: { limit: 500 },
        commerceWrite: { limit: 200 },
        orderLookup: { limit: 200 },
      },
    });
    const env = getEnv();
    const ts = Date.now();
    uniqueToken = `T3B04_${ts}`;

    const customer = await prisma.user.create({
      data: {
        email: `t3-customer-${ts}@nexora.local`,
        fullName: 'Task3 Visibility Customer',
        phone: '0911222333',
        passwordHash: await bcrypt.hash('Password123!', 10),
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerId = customer.id;
    createdUserIds.push(customer.id);
    customerToken = jwt.sign(
      { sub: customer.id, email: customer.email, role: customer.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    activeCatSlug = `t3-active-cat-${ts}`;
    const activeCat = await prisma.category.create({
      data: { name: `T3 Active Cat ${ts}`, slug: activeCatSlug, isActive: true },
    });
    activeCatId = activeCat.id;
    createdCategoryIds.push(activeCat.id);

    hiddenCatSlug = `t3-hidden-cat-${ts}`;
    const hiddenCat = await prisma.category.create({
      data: { name: `T3 Hidden Cat ${ts}`, slug: hiddenCatSlug, isActive: false },
    });
    hiddenCatId = hiddenCat.id;
    createdCategoryIds.push(hiddenCat.id);

    laterHiddenCatId = (
      await prisma.category.create({
        data: { name: `T3 Historical Cat ${ts}`, slug: `t3-hist-cat-${ts}`, isActive: true },
      })
    ).id;
    createdCategoryIds.push(laterHiddenCatId);

    activeBrandSlug = `t3-active-brand-${ts}`;
    const activeBrand = await prisma.brand.create({
      data: { name: `T3ActiveBrand${ts}`, slug: activeBrandSlug, isActive: true },
    });
    activeBrandId = activeBrand.id;
    createdBrandIds.push(activeBrand.id);

    hiddenBrandSlug = `t3-hidden-brand-${ts}`;
    const hiddenBrand = await prisma.brand.create({
      data: { name: `T3HiddenBrand${ts}`, slug: hiddenBrandSlug, isActive: false },
    });
    hiddenBrandId = hiddenBrand.id;
    createdBrandIds.push(hiddenBrand.id);

    laterHiddenBrandId = (
      await prisma.brand.create({
        data: { name: `T3HistBrand${ts}`, slug: `t3-hist-brand-${ts}`, isActive: true },
      })
    ).id;
    createdBrandIds.push(laterHiddenBrandId);

    // 1. Eligible ACTIVE + featured + hot + discount
    prodEligibleSlug = `t3-eligible-${ts}`;
    const pEligible = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `${uniqueToken} Eligible RTX Monitor`,
        slug: prodEligibleSlug,
        sku: `T3-EL-${ts}`,
        price: 12000000,
        salePrice: 10900000,
        stockQuantity: 15,
        isFeatured: true,
        isHot: true,
        status: 'ACTIVE',
      },
    });
    prodEligibleId = pEligible.id;
    createdProductIds.push(pEligible.id);

    // 2. Unbranded (brandId = null) ACTIVE + active category
    prodNoBrandSlug = `t3-nobrand-${ts}`;
    const pNoBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: null,
        name: `${uniqueToken} Unbranded Cable`,
        slug: prodNoBrandSlug,
        sku: `T3-NB-${ts}`,
        price: 490000,
        salePrice: 390000,
        stockQuantity: 25,
        isFeatured: true,
        status: 'ACTIVE',
      },
    });
    prodNoBrandId = pNoBrand.id;
    createdProductIds.push(pNoBrand.id);

    // 3. Inactive Product (discontinued) with positive stock
    prodInactiveSlug = `t3-inactive-${ts}`;
    const pInactive = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `${uniqueToken} Discontinued Mouse`,
        slug: prodInactiveSlug,
        sku: `T3-IN-${ts}`,
        price: 2900000,
        salePrice: 2500000,
        stockQuantity: 40,
        isFeatured: true,
        status: 'INACTIVE',
      },
    });
    prodInactiveId = pInactive.id;
    createdProductIds.push(pInactive.id);

    // 4. Hidden by Category isActive = false
    prodHiddenCatSlug = `t3-hcat-prod-${ts}`;
    const pHiddenCat = await prisma.product.create({
      data: {
        categoryId: hiddenCatId,
        brandId: activeBrandId,
        name: `${uniqueToken} Hidden Category Keyboard`,
        slug: prodHiddenCatSlug,
        sku: `T3-HC-${ts}`,
        price: 3100000,
        salePrice: 2800000,
        stockQuantity: 30,
        isFeatured: true,
        status: 'ACTIVE',
      },
    });
    prodHiddenCatId = pHiddenCat.id;
    createdProductIds.push(pHiddenCat.id);

    // 5. Hidden by Brand isActive = false
    prodHiddenBrandSlug = `t3-hbrand-prod-${ts}`;
    const pHiddenBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: hiddenBrandId,
        name: `${uniqueToken} Hidden Brand Headset`,
        slug: prodHiddenBrandSlug,
        sku: `T3-HB-${ts}`,
        price: 4100000,
        salePrice: 3700000,
        stockQuantity: 22,
        isFeatured: true,
        status: 'ACTIVE',
      },
    });
    prodHiddenBrandId = pHiddenBrand.id;
    createdProductIds.push(pHiddenBrand.id);

    // 6. Product purchased BEFORE deactivation, later hidden cleanly
    prodLaterHiddenSlug = `t3-later-hidden-${ts}`;
    const pLaterHidden = await prisma.product.create({
      data: {
        categoryId: laterHiddenCatId,
        brandId: laterHiddenBrandId,
        name: `${uniqueToken} Historical Purchased GPU`,
        slug: prodLaterHiddenSlug,
        sku: `T3-HIST-${ts}`,
        price: 25000000,
        stockQuantity: 5,
        status: 'ACTIVE',
      },
    });
    prodLaterHiddenId = pLaterHidden.id;
    createdProductIds.push(pLaterHidden.id);

    // Create active Flash Sale containing all 5 test items (3 of which must be filtered out!)
    const now = Date.now();
    const flashSale = await prisma.flashSale.create({
      data: {
        name: `T3 Visibility Flash Sale ${ts}`,
        startTime: new Date(now - 3600_000),
        endTime: new Date(now + 3600_000),
        isActive: true,
        items: {
          create: [
            { productId: prodEligibleId, flashSalePrice: 9900000, quantityLimit: 5, sortOrder: 1 },
            { productId: prodNoBrandId, flashSalePrice: 350000, quantityLimit: 5, sortOrder: 2 },
            { productId: prodInactiveId, flashSalePrice: 1990000, quantityLimit: 5, sortOrder: 3 },
            { productId: prodHiddenCatId, flashSalePrice: 2100000, quantityLimit: 5, sortOrder: 4 },
            {
              productId: prodHiddenBrandId,
              flashSalePrice: 2990000,
              quantityLimit: 5,
              sortOrder: 5,
            },
          ],
        },
      },
    });
    createdFlashSaleId = flashSale.id;

    // Create historical DELIVERED order + APPROVED review BEFORE deactivating pLaterHidden
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    historicalOrderCode = `NX-T3HIST-${ts}`;
    const order = await prisma.order.create({
      data: {
        orderCode: historicalOrderCode,
        userId: customerId,
        customerName: 'Task3 Visibility Customer',
        customerEmail: customer.email,
        customerPhone: '0911222333',
        shippingAddress: '123 Nguyễn Huệ, Q1, TP.HCM',
        subtotal: 25000000,
        totalAmount: 25000000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: twoDaysAgo,
        deliveredAt: twoDaysAgo,
      },
    });
    historicalOrderId = order.id;
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: prodLaterHiddenId,
        productName: pLaterHidden.name,
        productSku: pLaterHidden.sku,
        unitPrice: 25000000,
        quantity: 1,
        subtotal: 25000000,
      },
    });
    historicalOrderItemId = orderItem.id;

    const rev = await prisma.review.create({
      data: {
        productId: prodLaterHiddenId,
        userId: customerId,
        rating: 5,
        comment: `${uniqueToken} Historical Verified Review Preserved`,
        isVerifiedPurchase: true,
        status: 'APPROVED',
      },
    });
    historicalReviewId = rev.id;

    // Now deactivate product, category, and brand after purchase!
    await prisma.product.update({
      where: { id: prodLaterHiddenId },
      data: { status: 'INACTIVE' },
    });
    await prisma.category.update({
      where: { id: laterHiddenCatId },
      data: { isActive: false },
    });
    await prisma.brand.update({
      where: { id: laterHiddenBrandId },
      data: { isActive: false },
    });
  });

  afterAll(async () => {
    try {
      if (historicalReturnId) {
        await prisma.returnAuditLog.deleteMany({ where: { returnRequestId: historicalReturnId } });
        await prisma.returnItem.deleteMany({ where: { returnRequestId: historicalReturnId } });
        await prisma.returnRequest.deleteMany({ where: { id: historicalReturnId } });
      }
      if (historicalOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: historicalOrderId } });
        await prisma.order.deleteMany({ where: { id: historicalOrderId } });
      }
      if (historicalReviewId) {
        await prisma.review.deleteMany({ where: { id: historicalReviewId } });
      }
      if (createdFlashSaleId) {
        await prisma.flashSaleItem.deleteMany({ where: { flashSaleId: createdFlashSaleId } });
        await prisma.flashSale.deleteMany({ where: { id: createdFlashSaleId } });
      }
      if (createdGuestSessions.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { cart: { guestSessionId: { in: createdGuestSessions } } },
        });
        await prisma.cart.deleteMany({
          where: { guestSessionId: { in: createdGuestSessions } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: createdUserIds } } } });
        await prisma.cart.deleteMany({ where: { userId: { in: createdUserIds } } });
      }
      if (createdProductIds.length > 0) {
        await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
      }
      if (createdCategoryIds.length > 0) {
        await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
      }
      if (createdBrandIds.length > 0) {
        await prisma.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('Cases 1-9, 21: Listing, Search, Category filter, Brand filter, Featured, Flash Sale endpoints enforce canonical visibility and preserve unbranded products', async () => {
    const forbiddenIds = [prodInactiveId, prodHiddenCatId, prodHiddenBrandId, prodLaterHiddenId];

    // 1. Search by uniqueToken -> returns ONLY prodEligible & prodNoBrand
    const searchRes = await request(app).get(`/api/v1/catalog/products?q=${uniqueToken}&limit=50`);
    expect(searchRes.status).toBe(200);
    const searchIds = (searchRes.body.data.products as Array<{ id: number }>).map((p) => p.id);
    expect(searchIds).toContain(prodEligibleId);
    expect(searchIds).toContain(prodNoBrandId);
    for (const hiddenId of forbiddenIds) {
      expect(searchIds).not.toContain(hiddenId);
    }

    // 2. General listing without brand filter preserves unbranded products (both seeded if any and synthetic prodNoBrand)
    const generalRes = await request(app).get('/api/v1/catalog/products?limit=1000');
    expect(generalRes.status).toBe(200);
    const generalProducts = generalRes.body.data.products as Array<{
      id: number;
      brandId: number | null;
    }>;
    expect(generalProducts.some((p) => p.id === prodNoBrandId && p.brandId === null)).toBe(true);
    for (const hiddenId of forbiddenIds) {
      expect(generalProducts.some((p) => p.id === hiddenId)).toBe(false);
    }

    // 3. Category filter on activeCatSlug and hiddenCatSlug
    const activeCatRes = await request(app).get(
      `/api/v1/catalog/products?category=${activeCatSlug}&limit=50`,
    );
    expect(activeCatRes.status).toBe(200);
    const activeCatIds = (activeCatRes.body.data.products as Array<{ id: number }>).map(
      (p) => p.id,
    );
    expect(activeCatIds).toContain(prodEligibleId);
    expect(activeCatIds).toContain(prodNoBrandId);
    expect(activeCatIds).not.toContain(prodInactiveId);
    expect(activeCatIds).not.toContain(prodHiddenBrandId);

    const hiddenCatRes = await request(app).get(
      `/api/v1/catalog/products?category=${hiddenCatSlug}&limit=50`,
    );
    expect(hiddenCatRes.status).toBe(200);
    expect(hiddenCatRes.body.data.products).toHaveLength(0);

    // 4. Brand filter on activeBrandSlug and hiddenBrandSlug
    const activeBrandRes = await request(app).get(
      `/api/v1/catalog/products?brand=${activeBrandSlug}&limit=50`,
    );
    expect(activeBrandRes.status).toBe(200);
    const activeBrandProdIds = (activeBrandRes.body.data.products as Array<{ id: number }>).map(
      (p) => p.id,
    );
    expect(activeBrandProdIds).toContain(prodEligibleId);
    expect(activeBrandProdIds).not.toContain(prodInactiveId);
    expect(activeBrandProdIds).not.toContain(prodHiddenCatId);

    const hiddenBrandRes = await request(app).get(
      `/api/v1/catalog/products?brand=${hiddenBrandSlug}&limit=50`,
    );
    expect(hiddenBrandRes.status).toBe(200);
    expect(hiddenBrandRes.body.data.products).toHaveLength(0);

    // 5. Featured & Catalog Flash Sale exclude all hidden products
    const featuredRes = await request(app).get('/api/v1/catalog/products/featured?limit=100');
    expect(featuredRes.status).toBe(200);
    const featuredIds = (featuredRes.body.data as Array<{ id: number }>).map((p) => p.id);
    for (const hiddenId of forbiddenIds) {
      expect(featuredIds).not.toContain(hiddenId);
    }

    const catFlashRes = await request(app).get('/api/v1/catalog/products/flash-sale?limit=100');
    expect(catFlashRes.status).toBe(200);
    const catFlashIds = (catFlashRes.body.data as Array<{ id: number }>).map((p) => p.id);
    for (const hiddenId of forbiddenIds) {
      expect(catFlashIds).not.toContain(hiddenId);
    }
  });

  it('Cases 10, 11: Active Flash Sale & public Brand listing exclude inactive entities while preserving unbranded Flash Sale items', async () => {
    const otherActiveFlashSaleIds = (
      await prisma.flashSale.findMany({
        where: { isActive: true, id: { not: createdFlashSaleId } },
        select: { id: true },
      })
    ).map((f) => f.id);

    try {
      if (otherActiveFlashSaleIds.length > 0) {
        await prisma.flashSale.updateMany({
          where: { id: { in: otherActiveFlashSaleIds } },
          data: { isActive: false },
        });
      }

      const flashRes = await request(app).get('/api/v1/marketing/flash-sales/active');
      expect(flashRes.status).toBe(200);
      expect(flashRes.body.data).not.toBeNull();
      expect(flashRes.body.data.id).toBe(createdFlashSaleId);
      const flashItemProdIds = (flashRes.body.data.items as Array<{ productId: number }>).map(
        (i) => i.productId,
      );
      expect(flashItemProdIds).toContain(prodEligibleId);
      expect(flashItemProdIds).toContain(prodNoBrandId);
      expect(flashItemProdIds).not.toContain(prodInactiveId);
      expect(flashItemProdIds).not.toContain(prodHiddenCatId);
      expect(flashItemProdIds).not.toContain(prodHiddenBrandId);
    } finally {
      if (otherActiveFlashSaleIds.length > 0) {
        await prisma.flashSale.updateMany({
          where: { id: { in: otherActiveFlashSaleIds } },
          data: { isActive: true },
        });
      }
    }

    // Public Brand listing excludes inactive brands
    const brandsRes = await request(app).get('/api/v1/catalog/brands');
    expect(brandsRes.status).toBe(200);
    const publicBrandSlugs = (brandsRes.body.data as Array<{ slug: string }>).map((b) => b.slug);
    expect(publicBrandSlugs).toContain(activeBrandSlug);
    expect(publicBrandSlugs).not.toContain(hiddenBrandSlug);
  });

  it('Cases 13, 15, 17, 18: Product detail returns 200 unavailable metadata for existing hidden products, 404 for non-existent, and blocks Cart/Order purchase', async () => {
    // 1. Discontinued product -> 200 OK with unavailable metadata (NOT 404)
    const inactiveDetail = await request(app).get(`/api/v1/catalog/products/${prodInactiveSlug}`);
    expect(inactiveDetail.status).toBe(200);
    expect(inactiveDetail.body.data.status).toBe('INACTIVE');
    expect(inactiveDetail.body.data.isPurchasable).toBe(false);
    expect(inactiveDetail.body.data.unavailableReason).toBe('DISCONTINUED');

    // 2. Hidden Category product -> 200 OK with CATEGORY_INACTIVE metadata
    const hiddenCatDetail = await request(app).get(`/api/v1/catalog/products/${prodHiddenCatSlug}`);
    expect(hiddenCatDetail.status).toBe(200);
    expect(hiddenCatDetail.body.data.category.isActive).toBe(false);
    expect(hiddenCatDetail.body.data.isPurchasable).toBe(false);
    expect(hiddenCatDetail.body.data.unavailableReason).toBe('CATEGORY_INACTIVE');

    // 3. Hidden Brand product -> 200 OK with BRAND_INACTIVE metadata
    const hiddenBrandDetail = await request(app).get(
      `/api/v1/catalog/products/${prodHiddenBrandSlug}`,
    );
    expect(hiddenBrandDetail.status).toBe(200);
    expect(hiddenBrandDetail.body.data.brand.isActive).toBe(false);
    expect(hiddenBrandDetail.body.data.isPurchasable).toBe(false);
    expect(hiddenBrandDetail.body.data.unavailableReason).toBe('BRAND_INACTIVE');

    // 4. Eligible unbranded product -> 200 OK purchasable
    const noBrandDetail = await request(app).get(`/api/v1/catalog/products/${prodNoBrandSlug}`);
    expect(noBrandDetail.status).toBe(200);
    expect(noBrandDetail.body.data.brandId).toBeNull();
    expect(noBrandDetail.body.data.isPurchasable).toBe(true);
    expect(noBrandDetail.body.data.unavailableReason).toBeNull();

    // 5. Truly non-existent slug -> 404 PRODUCT_NOT_FOUND
    const missingDetail = await request(app).get(
      `/api/v1/catalog/products/totally-non-existent-slug-${Date.now()}`,
    );
    expect(missingDetail.status).toBe(404);
    expect(missingDetail.body.error.code).toBe('PRODUCT_NOT_FOUND');

    // 6. Cart and Order API reject all 3 hidden variants even if stock > 0
    const guestSess = `t3-cart-${Date.now()}`;
    createdGuestSessions.push(guestSess);
    for (const badId of [prodInactiveId, prodHiddenCatId, prodHiddenBrandId]) {
      const cartRes = await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSess)
        .send({ productId: badId, quantity: 1 });
      expect(cartRes.status).toBe(400);
      expect(cartRes.body.error.code).toBe('PRODUCT_UNAVAILABLE');

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerName: 'Task3 Visibility Customer',
          customerEmail: `t3-customer@nexora.local`,
          customerPhone: '0911222333',
          shippingAddress: '123 Nguyễn Huệ, Q1, TP.HCM',
          paymentMethod: 'COD',
          items: [{ productId: badId, quantity: 1 }],
        });
      expect(orderRes.status).toBe(400);
      expect(orderRes.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    }
  });

  it('Cases 19, 20 & Reviews policy: Historical orders, snapshots, returns/warranty, and approved reviews remain intact after hiding product/category/brand', async () => {
    // 1. Order detail & tracking & my-orders still work with original snapshot
    const detailRes = await request(app)
      .get(`/api/v1/orders/detail/${historicalOrderCode}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.items[0].productSku).toMatch(/^T3-HIST-/);
    expect(Number(detailRes.body.data.items[0].unitPrice)).toBe(25000000);

    const trackRes = await request(app).get(
      `/api/v1/orders/track?code=${historicalOrderCode}&phone=0911222333`,
    );
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.orderCode).toBe(historicalOrderCode);

    // 2. Historical product detail still reachable via direct link with review intact
    const histDetailRes = await request(app).get(`/api/v1/catalog/products/${prodLaterHiddenSlug}`);
    expect(histDetailRes.status).toBe(200);
    expect(histDetailRes.body.data.isPurchasable).toBe(false);
    expect(
      (histDetailRes.body.data.reviews as Array<{ id: number }>).some(
        (r) => r.id === historicalReviewId,
      ),
    ).toBe(true);

    // 3. Public reviews endpoint preserves historical verified review without deleting/purging it
    const pubReviewsRes = await request(app).get('/api/v1/marketing/reviews?limit=50');
    expect(pubReviewsRes.status).toBe(200);
    expect(
      (pubReviewsRes.body.data as Array<{ id: number; comment: string }>).some(
        (r) =>
          r.id === historicalReviewId && r.comment.includes('Historical Verified Review Preserved'),
      ),
    ).toBe(true);

    // 4. Customer can still file warranty/return request for delivered historical order item
    const returnRes = await request(app)
      .post('/api/v1/profile/returns')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: historicalOrderId.toString(),
        reason: 'Lỗi bảo hành phát sinh sau khi sản phẩm ngừng kinh doanh',
        notes: 'Kiểm tra quyền bảo hành lịch sử',
        items: [
          {
            orderItemId: historicalOrderItemId.toString(),
            quantity: 1,
            resolution: 'REPAIR',
          },
        ],
      });
    expect(returnRes.status).toBe(201);
    historicalReturnId = returnRes.body.data.id;
  });
});
