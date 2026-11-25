import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';

const prisma = new PrismaClient();
const secondaryPrisma = new PrismaClient();

describe('B-01: OrderService.createOrder Product, Category & Brand Eligibility Validation', () => {
  let app: Express;
  let customerToken: string;
  let customerId: number;
  let customerEmail: string;

  let activeCatId: number;
  let inactiveCatId: number;
  let raceCatId: number;

  let activeBrandId: number;
  let inactiveBrandId: number;

  let prodEligibleId: number;
  let prodEligible2Id: number;
  let prodInactiveId: number;
  let prodOutOfStockFlaggedId: number;
  let prodHiddenCategoryId: number;
  let prodHiddenBrandId: number;
  let prodNoBrandId: number;
  let prodRaceStockId: number;
  let prodTxAnchorAId: number;
  let prodTxToggleBId: number;
  let prodTxCatToggleId: number;

  const createdOrderCodes: string[] = [];
  const createdProductIds: number[] = [];
  const createdCategoryIds: number[] = [];
  const createdBrandIds: number[] = [];
  const createdUserIds: number[] = [];

  const baseOrderPayload = () => ({
    customerName: 'Nguyễn Văn Kiểm Thử',
    customerEmail,
    customerPhone: '0901234567',
    shippingAddress: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    paymentMethod: 'COD' as const,
  });

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        commerceWrite: { limit: 200 },
        orderLookup: { limit: 200 },
      },
    });
    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('Password123!', 10);

    customerEmail = `b01-cust-${ts}@nexora.local`;
    const customer = await prisma.user.create({
      data: {
        email: customerEmail,
        fullName: 'Nguyễn Văn Kiểm Thử',
        passwordHash,
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

    // Categories
    const activeCat = await prisma.category.create({
      data: { name: `B01 Active Cat ${ts}`, slug: `b01-active-cat-${ts}`, isActive: true },
    });
    activeCatId = activeCat.id;
    createdCategoryIds.push(activeCat.id);

    const inactiveCat = await prisma.category.create({
      data: { name: `B01 Hidden Cat ${ts}`, slug: `b01-hidden-cat-${ts}`, isActive: false },
    });
    inactiveCatId = inactiveCat.id;
    createdCategoryIds.push(inactiveCat.id);

    const raceCat = await prisma.category.create({
      data: { name: `B01 Race Cat ${ts}`, slug: `b01-race-cat-${ts}`, isActive: true },
    });
    raceCatId = raceCat.id;
    createdCategoryIds.push(raceCat.id);

    // Brands
    const activeBrand = await prisma.brand.create({
      data: { name: `B01 Active Brand ${ts}`, slug: `b01-active-brand-${ts}`, isActive: true },
    });
    activeBrandId = activeBrand.id;
    createdBrandIds.push(activeBrand.id);

    const inactiveBrand = await prisma.brand.create({
      data: { name: `B01 Hidden Brand ${ts}`, slug: `b01-hidden-brand-${ts}`, isActive: false },
    });
    inactiveBrandId = inactiveBrand.id;
    createdBrandIds.push(inactiveBrand.id);

    // Products (created sequentially so ascending IDs are deterministic for TX lock order tests)
    const prodEligible = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 Eligible Product 1 ${ts}`,
        slug: `b01-eligible-1-${ts}`,
        sku: `B01-ELIG1-${ts}`,
        price: 1500000,
        salePrice: 1200000,
        stockQuantity: 20,
        status: 'ACTIVE',
      },
    });
    prodEligibleId = prodEligible.id;
    createdProductIds.push(prodEligible.id);

    const prodEligible2 = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 Eligible Product 2 ${ts}`,
        slug: `b01-eligible-2-${ts}`,
        sku: `B01-ELIG2-${ts}`,
        price: 800000,
        stockQuantity: 15,
        status: 'ACTIVE',
      },
    });
    prodEligible2Id = prodEligible2.id;
    createdProductIds.push(prodEligible2.id);

    const prodInactive = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 Inactive Product ${ts}`,
        slug: `b01-inactive-${ts}`,
        sku: `B01-INACT-${ts}`,
        price: 900000,
        stockQuantity: 25,
        status: 'INACTIVE',
      },
    });
    prodInactiveId = prodInactive.id;
    createdProductIds.push(prodInactive.id);

    const prodOutOfStockFlagged = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 OutOfStock Status Product ${ts}`,
        slug: `b01-oos-status-${ts}`,
        sku: `B01-OOS-${ts}`,
        price: 750000,
        stockQuantity: 10,
        status: 'OUT_OF_STOCK',
      },
    });
    prodOutOfStockFlaggedId = prodOutOfStockFlagged.id;
    createdProductIds.push(prodOutOfStockFlagged.id);

    const prodHiddenCategory = await prisma.product.create({
      data: {
        categoryId: inactiveCatId,
        brandId: activeBrandId,
        name: `B01 Hidden Cat Product ${ts}`,
        slug: `b01-hidden-cat-prod-${ts}`,
        sku: `B01-HCAT-${ts}`,
        price: 1100000,
        stockQuantity: 12,
        status: 'ACTIVE',
      },
    });
    prodHiddenCategoryId = prodHiddenCategory.id;
    createdProductIds.push(prodHiddenCategory.id);

    const prodHiddenBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: inactiveBrandId,
        name: `B01 Hidden Brand Product ${ts}`,
        slug: `b01-hidden-brand-prod-${ts}`,
        sku: `B01-HBRD-${ts}`,
        price: 1300000,
        stockQuantity: 12,
        status: 'ACTIVE',
      },
    });
    prodHiddenBrandId = prodHiddenBrand.id;
    createdProductIds.push(prodHiddenBrand.id);

    const prodNoBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: null,
        name: `B01 Unbranded Product ${ts}`,
        slug: `b01-unbranded-${ts}`,
        sku: `B01-NOBRD-${ts}`,
        price: 600000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodNoBrandId = prodNoBrand.id;
    createdProductIds.push(prodNoBrand.id);

    const prodRaceStock = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 Limited Stock Race ${ts}`,
        slug: `b01-race-stock-${ts}`,
        sku: `B01-RACE-${ts}`,
        price: 1000000,
        stockQuantity: 1,
        status: 'ACTIVE',
      },
    });
    prodRaceStockId = prodRaceStock.id;
    createdProductIds.push(prodRaceStock.id);

    const prodTxAnchorA = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 TX Anchor A ${ts}`,
        slug: `b01-tx-anchor-a-${ts}`,
        sku: `B01-TXA-${ts}`,
        price: 500000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodTxAnchorAId = prodTxAnchorA.id;
    createdProductIds.push(prodTxAnchorA.id);

    const prodTxToggleB = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B01 TX Toggle B ${ts}`,
        slug: `b01-tx-toggle-b-${ts}`,
        sku: `B01-TXB-${ts}`,
        price: 500000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodTxToggleBId = prodTxToggleB.id;
    createdProductIds.push(prodTxToggleB.id);

    const prodTxCatToggle = await prisma.product.create({
      data: {
        categoryId: raceCatId,
        brandId: activeBrandId,
        name: `B01 TX Cat Toggle ${ts}`,
        slug: `b01-tx-cat-toggle-${ts}`,
        sku: `B01-TXC-${ts}`,
        price: 500000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodTxCatToggleId = prodTxCatToggle.id;
    createdProductIds.push(prodTxCatToggle.id);
  });

  afterAll(async () => {
    try {
      if (createdOrderCodes.length > 0) {
        const orders = await prisma.order.findMany({
          where: { orderCode: { in: createdOrderCodes } },
          select: { id: true },
        });
        const orderIds = orders.map((o) => o.id);
        if (orderIds.length > 0) {
          const returns = await prisma.returnRequest.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true },
          });
          const returnIds = returns.map((r) => r.id);
          if (returnIds.length > 0) {
            await prisma.returnAuditLog.deleteMany({
              where: { returnRequestId: { in: returnIds } },
            });
            await prisma.returnItem.deleteMany({
              where: { returnRequestId: { in: returnIds } },
            });
            await prisma.returnRequest.deleteMany({
              where: { id: { in: returnIds } },
            });
          }
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
      }

      if (createdUserIds.length > 0) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: createdUserIds } } } });
        await prisma.cart.deleteMany({ where: { userId: { in: createdUserIds } } });
      }

      if (createdProductIds.length > 0) {
        await prisma.inventoryLog.deleteMany({ where: { productId: { in: createdProductIds } } });
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
      await secondaryPrisma.$disconnect();
    }
  });

  it('Case 1: Allows ordering an ACTIVE product in an active category and active brand, decrementing stock and persisting snapshots', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        ...baseOrderPayload(),
        items: [{ productId: prodEligibleId, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderCode).toMatch(/^NX-/);
    createdOrderCodes.push(res.body.data.orderCode);

    expect(res.body.data.subtotal).toBe('2400000');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].productId).toBe(prodEligibleId);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.items[0].unitPrice).toBe('1200000');

    const updatedProd = await prisma.product.findUniqueOrThrow({ where: { id: prodEligibleId } });
    expect(updatedProd.stockQuantity).toBe(18);

    const logCount = await prisma.inventoryLog.count({
      where: { productId: prodEligibleId, referenceId: res.body.data.orderCode },
    });
    expect(logCount).toBe(1);
  });

  it('Case 2: Rejects ordering an INACTIVE or OUT_OF_STOCK product even when stockQuantity > 0', async () => {
    const resInactive = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [{ productId: prodInactiveId, quantity: 1 }],
      });

    expect(resInactive.status).toBe(400);
    expect(resInactive.body.success).toBe(false);
    expect(resInactive.body.error.code).toBe('PRODUCT_UNAVAILABLE');

    const resOos = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [{ productId: prodOutOfStockFlaggedId, quantity: 1 }],
      });

    expect(resOos.status).toBe(400);
    expect(resOos.body.success).toBe(false);
    expect(resOos.body.error.code).toBe('PRODUCT_UNAVAILABLE');

    const prodInactiveDb = await prisma.product.findUniqueOrThrow({
      where: { id: prodInactiveId },
    });
    const prodOosDb = await prisma.product.findUniqueOrThrow({
      where: { id: prodOutOfStockFlaggedId },
    });
    expect(prodInactiveDb.stockQuantity).toBe(25);
    expect(prodOosDb.stockQuantity).toBe(10);

    const logs = await prisma.inventoryLog.count({
      where: { productId: { in: [prodInactiveId, prodOutOfStockFlaggedId] } },
    });
    expect(logs).toBe(0);
  });

  it('Case 3: Rejects ordering an ACTIVE product belonging to an inactive category (isActive = false)', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [{ productId: prodHiddenCategoryId, quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PRODUCT_UNAVAILABLE');

    const dbProd = await prisma.product.findUniqueOrThrow({ where: { id: prodHiddenCategoryId } });
    expect(dbProd.stockQuantity).toBe(12);
    expect(await prisma.inventoryLog.count({ where: { productId: prodHiddenCategoryId } })).toBe(0);
  });

  it('Case 4: Rejects ordering an ACTIVE product belonging to an inactive brand (isActive = false)', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [{ productId: prodHiddenBrandId, quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PRODUCT_UNAVAILABLE');

    const dbProd = await prisma.product.findUniqueOrThrow({ where: { id: prodHiddenBrandId } });
    expect(dbProd.stockQuantity).toBe(12);
    expect(await prisma.inventoryLog.count({ where: { productId: prodHiddenBrandId } })).toBe(0);
  });

  it('Case 5: Allows ordering an ACTIVE product in an active category when brandId is null', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [{ productId: prodNoBrandId, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdOrderCodes.push(res.body.data.orderCode);

    const dbProd = await prisma.product.findUniqueOrThrow({ where: { id: prodNoBrandId } });
    expect(dbProd.stockQuantity).toBe(8);
  });

  it('Case 6: Allows ordering multiple eligible products and aggregates duplicate productId entries cleanly', async () => {
    const beforeP1 = (await prisma.product.findUniqueOrThrow({ where: { id: prodEligibleId } }))
      .stockQuantity;
    const beforeP2 = (await prisma.product.findUniqueOrThrow({ where: { id: prodEligible2Id } }))
      .stockQuantity;

    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [
          { productId: prodEligibleId, quantity: 1 },
          { productId: prodEligible2Id, quantity: 2 },
          { productId: prodEligibleId, quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdOrderCodes.push(res.body.data.orderCode);

    // prodEligible aggregated to qty 3 (3 * 1,200,000 = 3,600,000) + prodEligible2 qty 2 (2 * 800,000 = 1,600,000)
    expect(res.body.data.subtotal).toBe('5200000');
    expect(res.body.data.items).toHaveLength(2);

    const afterP1 = (await prisma.product.findUniqueOrThrow({ where: { id: prodEligibleId } }))
      .stockQuantity;
    const afterP2 = (await prisma.product.findUniqueOrThrow({ where: { id: prodEligible2Id } }))
      .stockQuantity;
    expect(afterP1).toBe(beforeP1 - 3);
    expect(afterP2).toBe(beforeP2 - 2);
  });

  it('Case 7: Rejects mixed-cart order atomically with zero partial order or stock decrement (both direct items & DB cart fallback)', async () => {
    const stockBeforeDirect = (
      await prisma.product.findUniqueOrThrow({ where: { id: prodEligibleId } })
    ).stockQuantity;
    const ordersCountBefore = await prisma.order.count();
    const orderItemsCountBefore = await prisma.orderItem.count();

    // 7a: Direct items checkout mixing 1 eligible + 1 INACTIVE
    const mixedDirectRes = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        items: [
          { productId: prodEligibleId, quantity: 1 },
          { productId: prodInactiveId, quantity: 1 },
        ],
      });

    expect(mixedDirectRes.status).toBe(400);
    expect(mixedDirectRes.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: prodEligibleId } })).stockQuantity,
    ).toBe(stockBeforeDirect);
    expect(await prisma.order.count()).toBe(ordersCountBefore);
    expect(await prisma.orderItem.count()).toBe(orderItemsCountBefore);

    // 7b: Authenticated DB Cart fallback mixing 1 eligible + 1 hidden-category product
    const cart = await prisma.cart.upsert({
      where: { userId: customerId },
      create: { userId: customerId },
      update: {},
    });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.createMany({
      data: [
        { cartId: cart.id, productId: prodEligible2Id, quantity: 1 },
        { cartId: cart.id, productId: prodHiddenCategoryId, quantity: 1 },
      ],
    });
    const stockP2BeforeCart = (
      await prisma.product.findUniqueOrThrow({ where: { id: prodEligible2Id } })
    ).stockQuantity;

    const mixedCartRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(baseOrderPayload());

    expect(mixedCartRes.status).toBe(400);
    expect(mixedCartRes.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: prodEligible2Id } })).stockQuantity,
    ).toBe(stockP2BeforeCart);
    expect(await prisma.order.count()).toBe(ordersCountBefore);
  });

  it('Case 8: Ignores client-supplied spoofed price/unitPrice/subtotal fields and uses authoritative DB pricing', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        ...baseOrderPayload(),
        subtotal: 1,
        totalAmount: 1,
        items: [
          {
            productId: prodEligibleId,
            quantity: 1,
            unitPrice: 1,
            price: 1,
            subtotal: 1,
            productName: 'Hacked Product',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdOrderCodes.push(res.body.data.orderCode);

    // Database salePrice of prodEligible is 1,200,000 (>= 500,000 => shippingFee 0)
    expect(res.body.data.items[0].unitPrice).toBe('1200000');
    expect(res.body.data.items[0].subtotal).toBe('1200000');
    expect(res.body.data.items[0].productName).toContain('B01 Eligible Product 1');
    expect(res.body.data.subtotal).toBe('1200000');
    expect(res.body.data.totalAmount).toBe('1200000');
  });

  it('Case 9: Preserves historical order reading, guest tracking, and warranty/return requests after product/category/brand become inactive', async () => {
    const ts = Date.now();
    const histCat = await prisma.category.create({
      data: { name: `B01 Hist Cat ${ts}`, slug: `b01-hist-cat-${ts}`, isActive: true },
    });
    createdCategoryIds.push(histCat.id);

    const histBrand = await prisma.brand.create({
      data: { name: `B01 Hist Brand ${ts}`, slug: `b01-hist-brand-${ts}`, isActive: true },
    });
    createdBrandIds.push(histBrand.id);

    const histProd = await prisma.product.create({
      data: {
        categoryId: histCat.id,
        brandId: histBrand.id,
        name: `B01 Historical Snapshot GPU ${ts}`,
        slug: `b01-hist-gpu-${ts}`,
        sku: `B01-HIST-${ts}`,
        price: 15000000,
        stockQuantity: 5,
        status: 'ACTIVE',
      },
    });
    createdProductIds.push(histProd.id);

    // Place order while active
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        ...baseOrderPayload(),
        items: [{ productId: histProd.id, quantity: 1 }],
      });
    expect(createRes.status).toBe(201);
    const histOrderCode = createRes.body.data.orderCode as string;
    const histOrderId = BigInt(createRes.body.data.id as string);
    const histOrderItemId = createRes.body.data.items[0].id as string;
    createdOrderCodes.push(histOrderCode);

    // Mark delivered so return/warranty eligibility succeeds
    await prisma.order.update({
      where: { id: histOrderId },
      data: {
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    // Now deactivate product, category, and brand
    await prisma.product.update({ where: { id: histProd.id }, data: { status: 'INACTIVE' } });
    await prisma.category.update({ where: { id: histCat.id }, data: { isActive: false } });
    await prisma.brand.update({ where: { id: histBrand.id }, data: { isActive: false } });

    // Historical reads must still succeed with snapshot intact
    const detailRes = await request(app)
      .get(`/api/v1/orders/detail/${histOrderCode}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.items[0].productName).toBe(histProd.name);

    const myOrdersRes = await request(app)
      .get('/api/v1/orders/my-orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(myOrdersRes.status).toBe(200);
    expect(
      myOrdersRes.body.data.some((o: { orderCode: string }) => o.orderCode === histOrderCode),
    ).toBe(true);

    const trackRes = await request(app).get(
      `/api/v1/orders/track?code=${histOrderCode}&phone=0901234567`,
    );
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.orderCode).toBe(histOrderCode);

    // Return / warranty request on the historical delivered order must still succeed
    const returnRes = await request(app)
      .post('/api/v1/profile/returns')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: histOrderId.toString(),
        reason: 'Lỗi kỹ thuật cần bảo hành sản phẩm đã mua',
        items: [{ orderItemId: histOrderItemId, quantity: 1, resolution: 'REPAIR' }],
      });
    expect(returnRes.status).toBe(201);
    expect(returnRes.body.success).toBe(true);

    // New checkout for the deactivated historical product MUST be blocked
    const newOrderBlocked = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        ...baseOrderPayload(),
        items: [{ productId: histProd.id, quantity: 1 }],
      });
    expect(newOrderBlocked.status).toBe(400);
    expect(newOrderBlocked.body.error.code).toBe('PRODUCT_UNAVAILABLE');
  });

  it('Case 10a: Concurrent checkout on stock = 1 permits only 1 order and prevents negative stock', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .send({ ...baseOrderPayload(), items: [{ productId: prodRaceStockId, quantity: 1 }] }),
      request(app)
        .post('/api/v1/orders')
        .send({ ...baseOrderPayload(), items: [{ productId: prodRaceStockId, quantity: 1 }] }),
    ]);

    const statuses = [res1.status, res2.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 400]);

    for (const r of [res1, res2]) {
      if (r.status === 201) {
        createdOrderCodes.push(r.body.data.orderCode);
      } else {
        expect(r.body.error.code).toBe('INSUFFICIENT_STOCK');
      }
    }

    const dbProd = await prisma.product.findUniqueOrThrow({ where: { id: prodRaceStockId } });
    expect(dbProd.stockQuantity).toBe(0);
  });

  it('Case 10b: Mid-transaction admin deactivation of product or category rolls back entire order and earlier item stock decrements atomically', async () => {
    // 10b-1: Toggle prodTxToggleB -> INACTIVE while order transaction waits on prodTxAnchorA lock
    let resolveLocked!: () => void;
    const lockedPromise = new Promise<void>((resolve) => {
      resolveLocked = resolve;
    });

    const lockAndToggleProductTx = secondaryPrisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'SELECT id FROM products WHERE id = ? FOR UPDATE',
        prodTxAnchorAId,
      );
      resolveLocked();
      await new Promise((r) => setTimeout(r, 250));
      await tx.product.update({
        where: { id: prodTxToggleBId },
        data: { status: 'INACTIVE' },
      });
    });

    await lockedPromise;
    const [, orderRes1] = await Promise.all([
      lockAndToggleProductTx,
      request(app)
        .post('/api/v1/orders')
        .send({
          ...baseOrderPayload(),
          items: [
            { productId: prodTxAnchorAId, quantity: 2 },
            { productId: prodTxToggleBId, quantity: 1 },
          ],
        }),
    ]);

    expect(orderRes1.status).toBe(400);
    expect(orderRes1.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: prodTxAnchorAId } })).stockQuantity,
    ).toBe(10);
    expect(await prisma.inventoryLog.count({ where: { productId: prodTxAnchorAId } })).toBe(0);

    // 10b-2: Toggle raceCat -> isActive: false while order transaction waits on prodTxAnchorA lock
    let resolveCatLocked!: () => void;
    const catLockedPromise = new Promise<void>((resolve) => {
      resolveCatLocked = resolve;
    });

    const lockAndToggleCategoryTx = secondaryPrisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'SELECT id FROM products WHERE id = ? FOR UPDATE',
        prodTxAnchorAId,
      );
      resolveCatLocked();
      await new Promise((r) => setTimeout(r, 250));
      await tx.category.update({
        where: { id: raceCatId },
        data: { isActive: false },
      });
    });

    await catLockedPromise;
    const [, orderRes2] = await Promise.all([
      lockAndToggleCategoryTx,
      request(app)
        .post('/api/v1/orders')
        .send({
          ...baseOrderPayload(),
          items: [
            { productId: prodTxAnchorAId, quantity: 2 },
            { productId: prodTxCatToggleId, quantity: 1 },
          ],
        }),
    ]);

    expect(orderRes2.status).toBe(400);
    expect(orderRes2.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: prodTxAnchorAId } })).stockQuantity,
    ).toBe(10);
    expect(await prisma.inventoryLog.count({ where: { productId: prodTxAnchorAId } })).toBe(0);
  });
});
