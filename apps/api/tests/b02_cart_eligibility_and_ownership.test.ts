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

describe('B-02: CartService Eligibility, Accumulation, Merge & IDOR Ownership Validation', () => {
  let app: Express;

  let userAId: number;
  let userAToken: string;
  let userBId: number;
  let userBToken: string;

  let activeCatId: number;
  let inactiveCatId: number;
  let toggleCatId: number;

  let activeBrandId: number;
  let inactiveBrandId: number;

  let prodEligibleId: number;
  let prodInactiveId: number;
  let prodHiddenCatId: number;
  let prodHiddenBrandId: number;
  let prodNoBrandId: number;
  let prodStock5Id: number;
  let prodConcAddId: number;
  let prodMergeStock5Id: number;
  let prodUpdateTargetId: number;
  let prodToggleCatId: number;

  const createdUserIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdCategoryIds: number[] = [];
  const createdBrandIds: number[] = [];
  const createdGuestSessions: string[] = [];

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        globalApi: { limit: 500 },
        commerceWrite: { limit: 200 },
      },
    });
    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const userA = await prisma.user.create({
      data: {
        email: `b02-usera-${ts}@nexora.local`,
        fullName: 'Nguyễn Văn A',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userAId = userA.id;
    createdUserIds.push(userA.id);
    userAToken = jwt.sign(
      { sub: userA.id, email: userA.email, role: userA.role },
      env.AUTH_SECRET,
      {
        expiresIn: '1h',
      },
    );

    const userB = await prisma.user.create({
      data: {
        email: `b02-userb-${ts}@nexora.local`,
        fullName: 'Trần Thị B',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userBId = userB.id;
    createdUserIds.push(userB.id);
    userBToken = jwt.sign(
      { sub: userB.id, email: userB.email, role: userB.role },
      env.AUTH_SECRET,
      {
        expiresIn: '1h',
      },
    );

    // Categories
    const activeCat = await prisma.category.create({
      data: { name: `B02 Active Cat ${ts}`, slug: `b02-active-cat-${ts}`, isActive: true },
    });
    activeCatId = activeCat.id;
    createdCategoryIds.push(activeCat.id);

    const inactiveCat = await prisma.category.create({
      data: { name: `B02 Hidden Cat ${ts}`, slug: `b02-hidden-cat-${ts}`, isActive: false },
    });
    inactiveCatId = inactiveCat.id;
    createdCategoryIds.push(inactiveCat.id);

    const toggleCat = await prisma.category.create({
      data: { name: `B02 Toggle Cat ${ts}`, slug: `b02-toggle-cat-${ts}`, isActive: true },
    });
    toggleCatId = toggleCat.id;
    createdCategoryIds.push(toggleCat.id);

    // Brands
    const activeBrand = await prisma.brand.create({
      data: { name: `B02 Active Brand ${ts}`, slug: `b02-active-brand-${ts}`, isActive: true },
    });
    activeBrandId = activeBrand.id;
    createdBrandIds.push(activeBrand.id);

    const inactiveBrand = await prisma.brand.create({
      data: { name: `B02 Hidden Brand ${ts}`, slug: `b02-hidden-brand-${ts}`, isActive: false },
    });
    inactiveBrandId = inactiveBrand.id;
    createdBrandIds.push(inactiveBrand.id);

    // Products
    const pEligible = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B02 Eligible Product ${ts}`,
        slug: `b02-eligible-${ts}`,
        sku: `B02-ELIG-${ts}`,
        price: 1000000,
        stockQuantity: 20,
        status: 'ACTIVE',
      },
    });
    prodEligibleId = pEligible.id;
    createdProductIds.push(pEligible.id);

    const pInactive = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B02 Inactive Product ${ts}`,
        slug: `b02-inactive-${ts}`,
        sku: `B02-INACT-${ts}`,
        price: 1000000,
        stockQuantity: 15,
        status: 'INACTIVE',
      },
    });
    prodInactiveId = pInactive.id;
    createdProductIds.push(pInactive.id);

    const pHiddenCat = await prisma.product.create({
      data: {
        categoryId: inactiveCatId,
        brandId: activeBrandId,
        name: `B02 Hidden Cat Prod ${ts}`,
        slug: `b02-hidden-cat-prod-${ts}`,
        sku: `B02-HCAT-${ts}`,
        price: 1000000,
        stockQuantity: 15,
        status: 'ACTIVE',
      },
    });
    prodHiddenCatId = pHiddenCat.id;
    createdProductIds.push(pHiddenCat.id);

    const pHiddenBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: inactiveBrandId,
        name: `B02 Hidden Brand Prod ${ts}`,
        slug: `b02-hidden-brand-prod-${ts}`,
        sku: `B02-HBRD-${ts}`,
        price: 1000000,
        stockQuantity: 15,
        status: 'ACTIVE',
      },
    });
    prodHiddenBrandId = pHiddenBrand.id;
    createdProductIds.push(pHiddenBrand.id);

    const pNoBrand = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: null,
        name: `B02 Unbranded Prod ${ts}`,
        slug: `b02-nobrand-${ts}`,
        sku: `B02-NOBRD-${ts}`,
        price: 500000,
        stockQuantity: 12,
        status: 'ACTIVE',
      },
    });
    prodNoBrandId = pNoBrand.id;
    createdProductIds.push(pNoBrand.id);

    const pStock5 = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B02 Stock 5 Prod ${ts}`,
        slug: `b02-stock5-${ts}`,
        sku: `B02-STK5-${ts}`,
        price: 700000,
        stockQuantity: 5,
        status: 'ACTIVE',
      },
    });
    prodStock5Id = pStock5.id;
    createdProductIds.push(pStock5.id);

    const pConcAdd = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B02 Conc Add Stock 4 ${ts}`,
        slug: `b02-conc-add-${ts}`,
        sku: `B02-CONC-${ts}`,
        price: 700000,
        stockQuantity: 4,
        status: 'ACTIVE',
      },
    });
    prodConcAddId = pConcAdd.id;
    createdProductIds.push(pConcAdd.id);

    const pMergeStock5 = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B02 Merge Stock 5 ${ts}`,
        slug: `b02-merge-stk5-${ts}`,
        sku: `B02-MRG5-${ts}`,
        price: 800000,
        stockQuantity: 5,
        status: 'ACTIVE',
      },
    });
    prodMergeStock5Id = pMergeStock5.id;
    createdProductIds.push(pMergeStock5.id);

    const pUpdateTarget = await prisma.product.create({
      data: {
        categoryId: activeCatId,
        brandId: activeBrandId,
        name: `B02 Update Target ${ts}`,
        slug: `b02-upd-target-${ts}`,
        sku: `B02-UPD-${ts}`,
        price: 900000,
        stockQuantity: 6,
        status: 'ACTIVE',
      },
    });
    prodUpdateTargetId = pUpdateTarget.id;
    createdProductIds.push(pUpdateTarget.id);

    const pToggleCat = await prisma.product.create({
      data: {
        categoryId: toggleCatId,
        brandId: activeBrandId,
        name: `B02 Toggle Cat Prod ${ts}`,
        slug: `b02-toggle-cat-prod-${ts}`,
        sku: `B02-TGC-${ts}`,
        price: 900000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodToggleCatId = pToggleCat.id;
    createdProductIds.push(pToggleCat.id);
  });

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: createdUserIds } } } });
        await prisma.cart.deleteMany({ where: { userId: { in: createdUserIds } } });
      }
      if (createdGuestSessions.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { cart: { guestSessionId: { in: createdGuestSessions } } },
        });
        await prisma.cart.deleteMany({
          where: { guestSessionId: { in: createdGuestSessions } },
        });
      }
      if (createdProductIds.length > 0) {
        await prisma.cartItem.deleteMany({ where: { productId: { in: createdProductIds } } });
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

  // =========================================================================
  // Group 1: CartService.addItem (Tests 1-10 + Concurrency)
  // =========================================================================
  describe('Add to Cart (Cases 1-10 & Concurrency)', () => {
    it('Cases 1, 5, 6: Allows adding ACTIVE product with active category/brand and unbranded product (brandId = null)', async () => {
      const resActive = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodEligibleId, quantity: 2 });
      expect(resActive.status).toBe(200);
      expect(resActive.body.success).toBe(true);
      expect(
        resActive.body.data.items.find((i: { productId: number }) => i.productId === prodEligibleId)
          ?.quantity,
      ).toBe(2);

      const resNoBrand = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodNoBrandId, quantity: 3 });
      expect(resNoBrand.status).toBe(200);
      expect(
        resNoBrand.body.data.items.find((i: { productId: number }) => i.productId === prodNoBrandId)
          ?.quantity,
      ).toBe(3);
    });

    it('Cases 2, 3, 4, 10: Rejects adding INACTIVE product, inactive category, or inactive brand without creating/mutating cart items', async () => {
      const countBefore = await prisma.cartItem.count({ where: { cart: { userId: userAId } } });

      const resInact = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodInactiveId, quantity: 1 });
      expect(resInact.status).toBe(400);
      expect(resInact.body.error.code).toBe('PRODUCT_UNAVAILABLE');

      const resHiddenCat = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodHiddenCatId, quantity: 1 });
      expect(resHiddenCat.status).toBe(400);
      expect(resHiddenCat.body.error.code).toBe('PRODUCT_UNAVAILABLE');

      const resHiddenBrand = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodHiddenBrandId, quantity: 1 });
      expect(resHiddenBrand.status).toBe(400);
      expect(resHiddenBrand.body.error.code).toBe('PRODUCT_UNAVAILABLE');

      const countAfter = await prisma.cartItem.count({ where: { cart: { userId: userAId } } });
      expect(countAfter).toBe(countBefore);
    });

    it('Cases 7, 8, 9, 10: Enforces accumulation within stock, rejects overflow accumulation & zero/negative quantities without mutating existing item', async () => {
      // Invalid quantities 0 and -2 MUST be rejected (not coerced to 1)
      const resZero = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodStock5Id, quantity: 0 });
      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe('INVALID_QUANTITY');

      const resNegative = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodStock5Id, quantity: -2 });
      expect(resNegative.status).toBe(400);
      expect(resNegative.body.error.code).toBe('INVALID_QUANTITY');

      // Add 2 (total 2 <= 5) -> OK
      const add2 = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodStock5Id, quantity: 2 });
      expect(add2.status).toBe(200);

      // Accumulate +2 -> total 4 <= 5 -> OK
      const addMore2 = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodStock5Id, quantity: 2 });
      expect(addMore2.status).toBe(200);
      expect(
        addMore2.body.data.items.find((i: { productId: number }) => i.productId === prodStock5Id)
          ?.quantity,
      ).toBe(4);

      // Accumulate +2 -> total 6 > 5 -> MUST reject and keep quantity = 4!
      const addOverflow = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodStock5Id, quantity: 2 });
      expect(addOverflow.status).toBe(400);
      expect(addOverflow.body.error.code).toBe('INSUFFICIENT_STOCK');

      const dbItem = await prisma.cartItem.findFirstOrThrow({
        where: { cart: { userId: userAId }, productId: prodStock5Id },
      });
      expect(dbItem.quantity).toBe(4);
    });

    it('Concurrency: Two simultaneous addItem(3) requests on stock = 4 permit only 1 and never exceed stockQuantity', async () => {
      const guestSess = `b02-conc-add-${Date.now()}`;
      createdGuestSessions.push(guestSess);

      const [r1, r2] = await Promise.all([
        request(app)
          .post('/api/v1/cart/items')
          .set('x-guest-session-id', guestSess)
          .send({ productId: prodConcAddId, quantity: 3 }),
        request(app)
          .post('/api/v1/cart/items')
          .set('x-guest-session-id', guestSess)
          .send({ productId: prodConcAddId, quantity: 3 }),
      ]);

      const statuses = [r1.status, r2.status].sort((a, b) => a - b);
      expect(statuses).toEqual([200, 400]);

      const cartInDb = await prisma.cart.findUniqueOrThrow({
        where: { guestSessionId: guestSess },
        include: { items: true },
      });
      const concItem = cartInDb.items.find((i) => i.productId === prodConcAddId);
      expect(concItem?.quantity).toBe(3);
    });
  });

  // =========================================================================
  // Group 2: mergeGuestCartToUser (Cases 11-18)
  // =========================================================================
  describe('Guest Cart Merge Eligibility & Capping (Cases 11-18)', () => {
    it('Cases 11-18: Skips INACTIVE product, inactive category, inactive brand; accumulates & caps stock; idempotent on replay', async () => {
      const guestSess = `b02-merge-${Date.now()}`;
      createdGuestSessions.push(guestSess);

      // Prepare User B's cart with prodMergeStock5 (qty = 3, stock = 5)
      const userBCart = await prisma.cart.upsert({
        where: { userId: userBId },
        create: { userId: userBId },
        update: {},
      });
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: userBCart.id, productId: prodMergeStock5Id } },
        create: { cartId: userBCart.id, productId: prodMergeStock5Id, quantity: 3 },
        update: { quantity: 3 },
      });

      // Guest cart contains:
      // 1) prodNoBrand (ACTIVE, cat active, brandId null, qty 2) => merges cleanly
      // 2) prodMergeStock5 (ACTIVE, qty 4; 3 + 4 = 7 > 5) => accumulated & capped at 5 with warning
      // 3) prodInactive (INACTIVE) => skipped with warning
      // 4) prodHiddenCat (Category isActive=false) => skipped with warning
      // 5) prodHiddenBrand (Brand isActive=false) => skipped with warning
      await prisma.cart.create({
        data: {
          guestSessionId: guestSess,
          items: {
            create: [
              { productId: prodNoBrandId, quantity: 2 },
              { productId: prodMergeStock5Id, quantity: 4 },
              { productId: prodInactiveId, quantity: 1 },
              { productId: prodHiddenCatId, quantity: 1 },
              { productId: prodHiddenBrandId, quantity: 1 },
            ],
          },
        },
      });

      const mergeRes = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ guestSessionId: guestSess });

      expect(mergeRes.status).toBe(200);
      expect(mergeRes.body.success).toBe(true);
      expect(mergeRes.body.data.mergedItemsCount).toBe(2);
      expect(mergeRes.body.data.adjustedItemsCount).toBe(1);
      expect(mergeRes.body.data.warnings).toHaveLength(4); // 3 skipped + 1 capped

      const dbItems = await prisma.cartItem.findMany({ where: { cartId: userBCart.id } });
      expect(dbItems.find((i) => i.productId === prodNoBrandId)?.quantity).toBe(2);
      expect(dbItems.find((i) => i.productId === prodMergeStock5Id)?.quantity).toBe(5);
      expect(dbItems.find((i) => i.productId === prodInactiveId)).toBeUndefined();
      expect(dbItems.find((i) => i.productId === prodHiddenCatId)).toBeUndefined();
      expect(dbItems.find((i) => i.productId === prodHiddenBrandId)).toBeUndefined();

      // Replay / retry MUST be idempotent (0 merged, quantities unchanged)
      const replayRes = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ guestSessionId: guestSess });
      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.mergedItemsCount).toBe(0);
      expect(replayRes.body.data.adjustedItemsCount).toBe(0);
      const dbItemsAfterReplay = await prisma.cartItem.findMany({
        where: { cartId: userBCart.id },
      });
      expect(dbItemsAfterReplay.find((i) => i.productId === prodMergeStock5Id)?.quantity).toBe(5);
    });
  });

  // =========================================================================
  // Group 3: Ownership & Anti-IDOR Protection (Cases 19-25)
  // =========================================================================
  describe('Update Cart Ownership & Anti-IDOR (Cases 19-25)', () => {
    it('Cases 19-25: Allows owner updates, blocks cross-user/cross-guest/cartId-spoof IDOR with 403 without leaking or mutating target cart', async () => {
      // Ensure User A has itemA and User B has itemB
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: prodUpdateTargetId, quantity: 1 });
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ productId: prodUpdateTargetId, quantity: 2 });

      const cartA = await prisma.cart.findUniqueOrThrow({ where: { userId: userAId } });
      const cartB = await prisma.cart.findUniqueOrThrow({ where: { userId: userBId } });
      const itemA = await prisma.cartItem.findUniqueOrThrow({
        where: { cartId_productId: { cartId: cartA.id, productId: prodUpdateTargetId } },
      });
      const itemB = await prisma.cartItem.findUniqueOrThrow({
        where: { cartId_productId: { cartId: cartB.id, productId: prodUpdateTargetId } },
      });

      // Guest A & Guest B carts
      const guestSessA = `b02-guest-a-${Date.now()}`;
      const guestSessB = `b02-guest-b-${Date.now()}`;
      createdGuestSessions.push(guestSessA, guestSessB);

      await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSessB)
        .send({ productId: prodUpdateTargetId, quantity: 2 });
      const guestCartB = await prisma.cart.findUniqueOrThrow({
        where: { guestSessionId: guestSessB },
      });
      const guestItemB = await prisma.cartItem.findUniqueOrThrow({
        where: { cartId_productId: { cartId: guestCartB.id, productId: prodUpdateTargetId } },
      });

      // 19. User A updates User A's own item -> 200
      const okOwn = await request(app)
        .patch(`/api/v1/cart/items/${itemA.id.toString()}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: 3 });
      expect(okOwn.status).toBe(200);
      expect(
        okOwn.body.data.items.find((i: { id: string }) => i.id === itemA.id.toString())?.quantity,
      ).toBe(3);

      // 20 & 22. User A tries updating User B's itemId directly -> 403 FORBIDDEN, no Cart B data in response
      const crossUserRes = await request(app)
        .patch(`/api/v1/cart/items/${itemB.id.toString()}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: 5 });
      expect(crossUserRes.status).toBe(403);
      expect(crossUserRes.body.success).toBe(false);
      expect(crossUserRes.body.error.code).toBe('FORBIDDEN');
      expect(JSON.stringify(crossUserRes.body)).not.toContain(cartB.id.toString());
      expect(JSON.stringify(crossUserRes.body)).not.toContain('B02 Update Target');

      // 21. User A passes User B's cartId in body while updating itemA (or itemB) -> 403 FORBIDDEN
      const spoofCartIdOnItemA = await request(app)
        .patch(`/api/v1/cart/items/${itemA.id.toString()}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ cartId: cartB.id.toString(), quantity: 4 });
      expect(spoofCartIdOnItemA.status).toBe(403);
      expect(spoofCartIdOnItemA.body.error.code).toBe('FORBIDDEN');

      const spoofCartIdOnAdd = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ cartId: cartB.id.toString(), productId: prodEligibleId, quantity: 1 });
      expect(spoofCartIdOnAdd.status).toBe(403);
      expect(spoofCartIdOnAdd.body.error.code).toBe('FORBIDDEN');

      // 23. Guest A tries updating Guest B's item AND User B's item; anonymous call without token/guestId
      const guestCrossGuest = await request(app)
        .patch(`/api/v1/cart/items/${guestItemB.id.toString()}`)
        .set('x-guest-session-id', guestSessA)
        .send({ quantity: 4 });
      expect(guestCrossGuest.status).toBe(403);

      const guestCrossUser = await request(app)
        .patch(`/api/v1/cart/items/${itemB.id.toString()}`)
        .set('x-guest-session-id', guestSessA)
        .send({ quantity: 4 });
      expect(guestCrossUser.status).toBe(403);

      const anonCall = await request(app)
        .patch(`/api/v1/cart/items/${itemB.id.toString()}`)
        .send({ quantity: 4 });
      expect(anonCall.status).toBe(401);

      // 25. User B and Guest B quantities remain untouched in DB
      const dbItemB = await prisma.cartItem.findUniqueOrThrow({ where: { id: itemB.id } });
      const dbGuestItemB = await prisma.cartItem.findUniqueOrThrow({
        where: { id: guestItemB.id },
      });
      expect(dbItemB.quantity).toBe(2);
      expect(dbGuestItemB.quantity).toBe(2);
    });
  });

  // =========================================================================
  // Group 4: Update Quantity Eligibility, Stock, Race Conditions (Cases 26-32)
  // =========================================================================
  describe('Update Cart Item Eligibility, Stock & Concurrency (Cases 26-32)', () => {
    it('Cases 26-30, 32: Blocks quantity <= 0, stock overflow, and deactivated product/category/brand updates without corrupting cart', async () => {
      const guestSess = `b02-upd-rules-${Date.now()}`;
      createdGuestSessions.push(guestSess);

      const cat = await prisma.category.create({
        data: {
          name: `B02 Upd Cat ${Date.now()}`,
          slug: `b02-upd-cat-${Date.now()}`,
          isActive: true,
        },
      });
      createdCategoryIds.push(cat.id);

      const brand = await prisma.brand.create({
        data: {
          name: `B02 Upd Brand ${Date.now()}`,
          slug: `b02-upd-brand-${Date.now()}`,
          isActive: true,
        },
      });
      createdBrandIds.push(brand.id);

      const prod = await prisma.product.create({
        data: {
          categoryId: cat.id,
          brandId: brand.id,
          name: `B02 Dynamic Item ${Date.now()}`,
          slug: `b02-dyn-item-${Date.now()}`,
          sku: `B02-DYN-${Date.now()}`,
          price: 500000,
          stockQuantity: 5,
          status: 'ACTIVE',
        },
      });
      createdProductIds.push(prod.id);

      await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSess)
        .send({ productId: prod.id, quantity: 2 });

      const item = await prisma.cartItem.findFirstOrThrow({
        where: { cart: { guestSessionId: guestSess }, productId: prod.id },
      });

      // 29. Valid quantity within stock -> 200
      const resValid = await request(app)
        .patch(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess)
        .send({ quantity: 4 });
      expect(resValid.status).toBe(200);

      // Zero or negative rejected (must not silently delete)
      const resZero = await request(app)
        .patch(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess)
        .send({ quantity: 0 });
      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe('INVALID_QUANTITY');

      // 30. Exceed stock (6 > 5) -> 400 INSUFFICIENT_STOCK
      const resOverflow = await request(app)
        .patch(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess)
        .send({ quantity: 6 });
      expect(resOverflow.status).toBe(400);
      expect(resOverflow.body.error.code).toBe('INSUFFICIENT_STOCK');
      expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(
        4,
      );

      // 26. Product becomes INACTIVE -> rejected, quantity stays 4
      await prisma.product.update({ where: { id: prod.id }, data: { status: 'INACTIVE' } });
      const resProdInact = await request(app)
        .patch(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess)
        .send({ quantity: 5 });
      expect(resProdInact.status).toBe(400);
      expect(resProdInact.body.error.code).toBe('PRODUCT_UNAVAILABLE');
      expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(
        4,
      );

      // Reactivate product; 27. Category becomes INACTIVE -> rejected
      await prisma.product.update({ where: { id: prod.id }, data: { status: 'ACTIVE' } });
      await prisma.category.update({ where: { id: cat.id }, data: { isActive: false } });
      const resCatInact = await request(app)
        .patch(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess)
        .send({ quantity: 5 });
      expect(resCatInact.status).toBe(400);
      expect(resCatInact.body.error.code).toBe('PRODUCT_UNAVAILABLE');
      expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(
        4,
      );

      // Reactivate category; 28. Brand becomes INACTIVE -> rejected
      await prisma.category.update({ where: { id: cat.id }, data: { isActive: true } });
      await prisma.brand.update({ where: { id: brand.id }, data: { isActive: false } });
      const resBrandInact = await request(app)
        .patch(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess)
        .send({ quantity: 5 });
      expect(resBrandInact.status).toBe(400);
      expect(resBrandInact.body.error.code).toBe('PRODUCT_UNAVAILABLE');
      expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(
        4,
      );
    });

    it('Case 31: Concurrent updateItem and mid-flight category deactivation serialize cleanly via FOR UPDATE / FOR SHARE locks', async () => {
      const guestSess = `b02-upd-conc-${Date.now()}`;
      createdGuestSessions.push(guestSess);

      await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSess)
        .send({ productId: prodToggleCatId, quantity: 1 });

      const cart = await prisma.cart.findUniqueOrThrow({ where: { guestSessionId: guestSess } });
      const item = await prisma.cartItem.findUniqueOrThrow({
        where: { cartId_productId: { cartId: cart.id, productId: prodToggleCatId } },
      });

      // Concurrent valid + overflow updates settle cleanly without exceeding stock (10)
      const [rValid, rOverflow] = await Promise.all([
        request(app)
          .patch(`/api/v1/cart/items/${item.id.toString()}`)
          .set('x-guest-session-id', guestSess)
          .send({ quantity: 8 }),
        request(app)
          .patch(`/api/v1/cart/items/${item.id.toString()}`)
          .set('x-guest-session-id', guestSess)
          .send({ quantity: 15 }),
      ]);
      expect([rValid.status, rOverflow.status].sort((a, b) => a - b)).toEqual([200, 400]);
      expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(
        8,
      );

      // Mid-flight category deactivation holding FOR UPDATE lock while updateItem requests quantity=9
      let resolveLock!: () => void;
      const lockReady = new Promise<void>((r) => {
        resolveLock = r;
      });
      const adminToggleTx = secondaryPrisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          'SELECT id FROM categories WHERE id = ? FOR UPDATE',
          toggleCatId,
        );
        resolveLock();
        await new Promise((r) => setTimeout(r, 200));
        await tx.category.update({ where: { id: toggleCatId }, data: { isActive: false } });
      });

      await lockReady;
      const [, updateAfterToggle] = await Promise.all([
        adminToggleTx,
        request(app)
          .patch(`/api/v1/cart/items/${item.id.toString()}`)
          .set('x-guest-session-id', guestSess)
          .send({ quantity: 9 }),
      ]);

      expect(updateAfterToggle.status).toBe(400);
      expect(updateAfterToggle.body.error.code).toBe('PRODUCT_UNAVAILABLE');
      expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(
        8,
      );
    });
  });
});
