import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { CartService } from '../src/modules/cart/cart.service.js';

const prisma = new PrismaClient();

describe('TASK 1: CartService.removeItem IDOR Security & Ownership Validation', () => {
  let app: Express;
  let cartService: CartService;

  let userAId: number;
  let userAToken: string;
  let userBId: number;
  let userBToken: string;

  let categoryId: number;
  let brandId: number;
  let prod1Id: number;
  let prod2Id: number;
  let prod3Id: number;
  let prodWillDeactivateId: number;

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
    cartService = new CartService(prisma);

    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const userA = await prisma.user.create({
      data: {
        email: `t1-usera-${ts}@nexora.local`,
        fullName: 'Task1 User A',
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
      { expiresIn: '1h' },
    );

    const userB = await prisma.user.create({
      data: {
        email: `t1-userb-${ts}@nexora.local`,
        fullName: 'Task1 User B',
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
      { expiresIn: '1h' },
    );

    const category = await prisma.category.create({
      data: { name: `T1 Cat ${ts}`, slug: `t1-cat-${ts}`, isActive: true },
    });
    categoryId = category.id;
    createdCategoryIds.push(category.id);

    const brand = await prisma.brand.create({
      data: { name: `T1 Brand ${ts}`, slug: `t1-brand-${ts}`, isActive: true },
    });
    brandId = brand.id;
    createdBrandIds.push(brand.id);

    const p1 = await prisma.product.create({
      data: {
        categoryId,
        brandId,
        name: `T1 Secret Victim Laptop ${ts}`,
        slug: `t1-prod1-${ts}`,
        sku: `T1-P1-${ts}`,
        price: 15000000,
        stockQuantity: 20,
        status: 'ACTIVE',
      },
    });
    prod1Id = p1.id;
    createdProductIds.push(p1.id);

    const p2 = await prisma.product.create({
      data: {
        categoryId,
        brandId,
        name: `T1 Keeper Mouse ${ts}`,
        slug: `t1-prod2-${ts}`,
        sku: `T1-P2-${ts}`,
        price: 500000,
        stockQuantity: 20,
        status: 'ACTIVE',
      },
    });
    prod2Id = p2.id;
    createdProductIds.push(p2.id);

    const p3 = await prisma.product.create({
      data: {
        categoryId,
        brandId,
        name: `T1 Guest Merge Monitor ${ts}`,
        slug: `t1-prod3-${ts}`,
        sku: `T1-P3-${ts}`,
        price: 4500000,
        stockQuantity: 20,
        status: 'ACTIVE',
      },
    });
    prod3Id = p3.id;
    createdProductIds.push(p3.id);

    const pDeact = await prisma.product.create({
      data: {
        categoryId,
        brandId,
        name: `T1 Later Inactive SSD ${ts}`,
        slug: `t1-deact-${ts}`,
        sku: `T1-DEACT-${ts}`,
        price: 1200000,
        stockQuantity: 10,
        status: 'ACTIVE',
      },
    });
    prodWillDeactivateId = pDeact.id;
    createdProductIds.push(pDeact.id);
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
    }
  });

  it('Cases 1, 2, 3, 8: Authenticated customers can delete only their own cart items without cross-user IDOR, info leak, or deleting sibling items', async () => {
    // Customer A adds prod1 and prod2; Customer B adds prod1
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ productId: prod1Id, quantity: 1 });
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ productId: prod2Id, quantity: 2 });
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ productId: prod1Id, quantity: 3 });

    const cartA = await prisma.cart.findUniqueOrThrow({ where: { userId: userAId } });
    const cartB = await prisma.cart.findUniqueOrThrow({ where: { userId: userBId } });

    const itemA1 = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cartA.id, productId: prod1Id } },
    });
    const itemA2 = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cartA.id, productId: prod2Id } },
    });
    const itemB1 = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cartB.id, productId: prod1Id } },
    });

    // Case 2: Customer A tries deleting Customer B's item -> 403 FORBIDDEN, zero leak
    const crossAtoB = await request(app)
      .delete(`/api/v1/cart/items/${itemB1.id.toString()}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(crossAtoB.status).toBe(403);
    expect(crossAtoB.body.success).toBe(false);
    expect(crossAtoB.body.error.code).toBe('FORBIDDEN');
    expect(JSON.stringify(crossAtoB.body)).not.toContain('T1 Secret Victim Laptop');
    expect(JSON.stringify(crossAtoB.body)).not.toContain(cartB.id.toString());
    expect(await prisma.cartItem.findUnique({ where: { id: itemB1.id } })).not.toBeNull();

    // Case 3: Customer B tries deleting Customer A's item -> 403 FORBIDDEN
    const crossBtoA = await request(app)
      .delete(`/api/v1/cart/items/${itemA1.id.toString()}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(crossBtoA.status).toBe(403);
    expect(crossBtoA.body.error.code).toBe('FORBIDDEN');
    expect(await prisma.cartItem.findUnique({ where: { id: itemA1.id } })).not.toBeNull();

    // Direct service-layer call also rejects cross-user IDOR (defense in depth)
    await expect(
      cartService.removeItem({ cartItemId: itemB1.id, userId: userAId }),
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });

    // Customer A tries spoofing cartB.id in body/query when deleting itemA1 -> 403 FORBIDDEN
    const spoofCartBody = await request(app)
      .delete(`/api/v1/cart/items/${itemA1.id.toString()}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ cartId: cartB.id.toString() });
    expect(spoofCartBody.status).toBe(403);
    expect(await prisma.cartItem.findUnique({ where: { id: itemA1.id } })).not.toBeNull();

    const spoofCartQuery = await request(app)
      .delete(`/api/v1/cart/items/${itemA1.id.toString()}?cartId=${cartB.id.toString()}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(spoofCartQuery.status).toBe(403);
    expect(await prisma.cartItem.findUnique({ where: { id: itemA1.id } })).not.toBeNull();

    // Case 1 & 8: Customer A deletes own itemA1 -> 200 OK; itemA2 and itemB1 remain untouched
    const ownDelete = await request(app)
      .delete(`/api/v1/cart/items/${itemA1.id.toString()}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(ownDelete.status).toBe(200);
    expect(ownDelete.body.success).toBe(true);
    expect(ownDelete.body.data.items.map((i: { id: string }) => i.id)).toEqual([
      itemA2.id.toString(),
    ]);
    expect(await prisma.cartItem.findUnique({ where: { id: itemA1.id } })).toBeNull();
    expect(await prisma.cartItem.findUnique({ where: { id: itemA2.id } })).not.toBeNull();
    expect(await prisma.cartItem.findUnique({ where: { id: itemB1.id } })).not.toBeNull();
  });

  it('Cases 4, 5: Guests can delete own items (including later-deactivated products) while cross-guest and customer-to-guest spoof attempts are blocked', async () => {
    const ts = Date.now();
    const guestA = `t1-guest-a-${ts}`;
    const guestB = `t1-guest-b-${ts}`;
    createdGuestSessions.push(guestA, guestB);

    await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestA)
      .send({ productId: prodWillDeactivateId, quantity: 1 });
    await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestA)
      .send({ productId: prod2Id, quantity: 1 });
    await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestB)
      .send({ productId: prod1Id, quantity: 2 });

    const cartGA = await prisma.cart.findUniqueOrThrow({ where: { guestSessionId: guestA } });
    const cartGB = await prisma.cart.findUniqueOrThrow({ where: { guestSessionId: guestB } });

    const itemGA1 = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cartGA.id, productId: prodWillDeactivateId } },
    });
    const itemGA2 = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cartGA.id, productId: prod2Id } },
    });
    const itemGB1 = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cartGB.id, productId: prod1Id } },
    });

    // Deactivate prodWillDeactivateId AFTER Guest A added it — owner MUST still be allowed to remove stale item
    await prisma.product.update({
      where: { id: prodWillDeactivateId },
      data: { status: 'INACTIVE' },
    });

    // Case 5a: Guest A tries deleting Guest B's item -> 403 FORBIDDEN
    const crossGuest = await request(app)
      .delete(`/api/v1/cart/items/${itemGB1.id.toString()}`)
      .set('x-guest-session-id', guestA);
    expect(crossGuest.status).toBe(403);
    expect(crossGuest.body.error.code).toBe('FORBIDDEN');
    expect(JSON.stringify(crossGuest.body)).not.toContain('T1 Secret Victim Laptop');
    expect(await prisma.cartItem.findUnique({ where: { id: itemGB1.id } })).not.toBeNull();

    // Case 5b: Authenticated User A sends Guest B's x-guest-session-id trying to delete Guest B's item -> 403 FORBIDDEN
    const authSpoofGuestHeader = await request(app)
      .delete(`/api/v1/cart/items/${itemGB1.id.toString()}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-guest-session-id', guestB);
    expect(authSpoofGuestHeader.status).toBe(403);
    expect(await prisma.cartItem.findUnique({ where: { id: itemGB1.id } })).not.toBeNull();

    // Case 5c: Guest A tries deleting Customer B's item -> 403 FORBIDDEN
    const cartB = await prisma.cart.findUniqueOrThrow({ where: { userId: userBId } });
    const itemB1 = await prisma.cartItem.findFirstOrThrow({ where: { cartId: cartB.id } });
    const guestToUser = await request(app)
      .delete(`/api/v1/cart/items/${itemB1.id.toString()}`)
      .set('x-guest-session-id', guestA);
    expect(guestToUser.status).toBe(403);
    expect(await prisma.cartItem.findUnique({ where: { id: itemB1.id } })).not.toBeNull();

    // Case 4: Guest A deletes own stale inactive itemGA1 -> 200 OK, itemGA2 and itemGB1 untouched
    const guestOwnDelete = await request(app)
      .delete(`/api/v1/cart/items/${itemGA1.id.toString()}`)
      .set('x-guest-session-id', guestA);
    expect(guestOwnDelete.status).toBe(200);
    expect(guestOwnDelete.body.data.items.map((i: { id: string }) => i.id)).toEqual([
      itemGA2.id.toString(),
    ]);
    expect(await prisma.cartItem.findUnique({ where: { id: itemGA1.id } })).toBeNull();
    expect(await prisma.cartItem.findUnique({ where: { id: itemGB1.id } })).not.toBeNull();
  });

  it('Cases 6, 7: Rejects unauthenticated/missing-session calls cleanly, handles non-existent and malformed cartItemId, and keeps concurrency race safe', async () => {
    const ts = Date.now();
    const guestSess = `t1-guest-edge-${ts}`;
    createdGuestSessions.push(guestSess);

    await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestSess)
      .send({ productId: prod2Id, quantity: 1 });
    const cart = await prisma.cart.findUniqueOrThrow({ where: { guestSessionId: guestSess } });
    const item = await prisma.cartItem.findUniqueOrThrow({
      where: { cartId_productId: { cartId: cart.id, productId: prod2Id } },
    });

    // Case 7: Missing auth and missing guest session -> 401 UNAUTHORIZED
    const noAuthRes = await request(app).delete(`/api/v1/cart/items/${item.id.toString()}`);
    expect(noAuthRes.status).toBe(401);
    expect(noAuthRes.body.error.code).toBe('UNAUTHORIZED');

    // Whitespace guest header without JWT -> 401 UNAUTHORIZED
    const blankGuestRes = await request(app)
      .delete(`/api/v1/cart/items/${item.id.toString()}`)
      .set('x-guest-session-id', '   ');
    expect(blankGuestRes.status).toBe(401);

    // Invalid JWT without guest session -> 401 UNAUTHORIZED
    const badJwtRes = await request(app)
      .delete(`/api/v1/cart/items/${item.id.toString()}`)
      .set('Authorization', 'Bearer invalid.jwt.token');
    expect(badJwtRes.status).toBe(401);

    // Case 6a: Non-existent cart item -> 404 CART_ITEM_NOT_FOUND
    const missingItemRes = await request(app)
      .delete('/api/v1/cart/items/999999999')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(missingItemRes.status).toBe(404);
    expect(missingItemRes.body.error.code).toBe('CART_ITEM_NOT_FOUND');

    // Case 6b: Malformed / non-positive cartItemId -> 400 VALIDATION_ERROR (never 500 SyntaxError)
    const malformedRes = await request(app)
      .delete('/api/v1/cart/items/not-a-number')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error.code).toBe('VALIDATION_ERROR');

    const zeroIdRes = await request(app)
      .delete('/api/v1/cart/items/0')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(zeroIdRes.status).toBe(400);

    // Item still intact after all invalid attempts
    expect(await prisma.cartItem.findUnique({ where: { id: item.id } })).not.toBeNull();

    // Concurrent delete on same owned item: one succeeds (200), second sees 404 CART_ITEM_NOT_FOUND (no 500)
    const [d1, d2] = await Promise.all([
      request(app)
        .delete(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess),
      request(app)
        .delete(`/api/v1/cart/items/${item.id.toString()}`)
        .set('x-guest-session-id', guestSess),
    ]);
    expect([d1.status, d2.status].sort((a, b) => a - b)).toEqual([200, 404]);
    expect(await prisma.cartItem.findUnique({ where: { id: item.id } })).toBeNull();
  });

  it('Cases 9, 10: Guest Cart Merge and getCart/updateItem continue working cleanly after removeItem hardening', async () => {
    const ts = Date.now();
    const guestMerge = `t1-guest-merge-${ts}`;
    createdGuestSessions.push(guestMerge);

    // Add 2 items as guest, update 1, remove the other, then merge into Customer B
    const add1 = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestMerge)
      .send({ productId: prod2Id, quantity: 1 });
    expect(add1.status).toBe(200);

    const add2 = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestMerge)
      .send({ productId: prod3Id, quantity: 1 });
    expect(add2.status).toBe(200);

    const guestItemProd2 = add2.body.data.items.find(
      (i: { productId: number }) => i.productId === prod2Id,
    );
    const guestItemProd3 = add2.body.data.items.find(
      (i: { productId: number }) => i.productId === prod3Id,
    );

    const updRes = await request(app)
      .patch(`/api/v1/cart/items/${guestItemProd3.id}`)
      .set('x-guest-session-id', guestMerge)
      .send({ quantity: 2 });
    expect(updRes.status).toBe(200);

    const remRes = await request(app)
      .delete(`/api/v1/cart/items/${guestItemProd2.id}`)
      .set('x-guest-session-id', guestMerge);
    expect(remRes.status).toBe(200);
    expect(remRes.body.data.items.map((i: { productId: number }) => i.productId)).toEqual([
      prod3Id,
    ]);

    const mergeRes = await request(app)
      .post('/api/v1/cart/merge')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ guestSessionId: guestMerge });
    expect(mergeRes.status).toBe(200);
    expect(mergeRes.body.data.mergedItemsCount).toBe(1);

    const summaryRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(summaryRes.status).toBe(200);
    expect(
      summaryRes.body.data.items.find((i: { productId: number }) => i.productId === prod3Id)
        ?.quantity,
    ).toBe(2);
  });
});
