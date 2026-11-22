import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { CartService } from '../src/modules/cart/cart.service.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Phase B Milestone M3: Guest Cart Merge Backend Integration Test Suite', () => {
  let app: Express;
  let userToken: string;
  let userId: number;
  let userEmail: string;

  // Test products
  let prodNewId: number; // For Scenario 1
  let prodDupId: number; // For Scenario 2
  let prodOosId: number; // For Scenario 3 (Out of stock)
  let prodInactiveId: number; // For Scenario 4 (Inactive)
  let prodCapId: number; // For Scenario 5 (Stock capping)

  const createdUserIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdCartIds: bigint[] = [];

  beforeAll(async () => {
    app = createApp();
    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // 1. Create Test User
    userEmail = `cart-merge-user-${ts}@nexora.local`;
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        fullName: 'Nguyễn Văn Merge',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userId = user.id;
    createdUserIds.push(user.id);

    userToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.AUTH_SECRET, {
      expiresIn: '1h',
    });

    // 2. Fetch or create a test Category and Brand
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Linh kiện test', slug: `cat-test-${ts}` },
      });
    }

    let brand = await prisma.brand.findFirst();
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: 'Thương hiệu test', slug: `brand-test-${ts}` },
      });
    }

    // 3. Create test products
    // Product 1: In stock, for new product test
    const p1 = await prisma.product.create({
      data: {
        name: `Sản phẩm Mới ${ts}`,
        slug: `sp-moi-${ts}`,
        sku: `SKU-NEW-${ts}`,
        price: 500000,
        stockQuantity: 50,
        status: 'ACTIVE',
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    prodNewId = p1.id;
    createdProductIds.push(p1.id);

    // Product 2: In stock, for duplicate accumulation test
    const p2 = await prisma.product.create({
      data: {
        name: `Sản phẩm Trùng ${ts}`,
        slug: `sp-trung-${ts}`,
        sku: `SKU-DUP-${ts}`,
        price: 300000,
        stockQuantity: 50,
        status: 'ACTIVE',
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    prodDupId = p2.id;
    createdProductIds.push(p2.id);

    // Product 3: Out of stock (stock = 0)
    const p3 = await prisma.product.create({
      data: {
        name: `Sản phẩm Hết Hàng ${ts}`,
        slug: `sp-het-hang-${ts}`,
        sku: `SKU-OOS-${ts}`,
        price: 200000,
        stockQuantity: 0,
        status: 'ACTIVE',
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    prodOosId = p3.id;
    createdProductIds.push(p3.id);

    // Product 4: Inactive product (status = INACTIVE)
    const p4 = await prisma.product.create({
      data: {
        name: `Sản phẩm Ngừng Bán ${ts}`,
        slug: `sp-ngung-ban-${ts}`,
        sku: `SKU-INACT-${ts}`,
        price: 400000,
        stockQuantity: 20,
        status: 'INACTIVE',
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    prodInactiveId = p4.id;
    createdProductIds.push(p4.id);

    // Product 5: Limited stock for capping test (stock = 4)
    const p5 = await prisma.product.create({
      data: {
        name: `Sản phẩm Giới Hạn Kho ${ts}`,
        slug: `sp-gioi-han-${ts}`,
        sku: `SKU-CAP-${ts}`,
        price: 150000,
        stockQuantity: 4,
        status: 'ACTIVE',
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    prodCapId = p5.id;
    createdProductIds.push(p5.id);
  });

  afterAll(async () => {
    try {
      // Clean up cart items and carts
      if (createdUserIds.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { cart: { userId: { in: createdUserIds } } },
        });
        await prisma.cart.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
      }
      if (createdCartIds.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { cartId: { in: createdCartIds } },
        });
        await prisma.cart.deleteMany({
          where: { id: { in: createdCartIds } },
        });
      }
      if (createdProductIds.length > 0) {
        await prisma.product.deleteMany({
          where: { id: { in: createdProductIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } catch {
      // Ignore cleanup error in test tear-down
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // Objective 1: Authentication Requirement & Error Envelope Enforcement
  // =========================================================================
  describe('Objective 1: Authentication Requirement & Error Envelope Enforcement', () => {
    it('MERGE-AUTH-1: Rejects unauthenticated POST /api/v1/cart/merge with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/v1/cart/merge')
        .send({ guestSessionId: 'guest-session-12345' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('MERGE-VAL-1: Rejects merge request with empty guestSessionId with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // Objective 2: Conflict Scenario 1 — New Product Merge
  // =========================================================================
  describe('Objective 2: Conflict Scenario 1 — New Product Merge', () => {
    it('MERGE-SC1: Merges brand new item from guest cart into user cart cleanly, verified in MySQL', async () => {
      const guestSessionId = `guest-sc1-${Date.now()}`;

      // 1. Create a guest cart with Product 1 (qty = 2)
      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodNewId,
              quantity: 2,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      // 2. Perform merge via API
      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedItemsCount).toBe(1);
      expect(res.body.data.adjustedItemsCount).toBe(0);

      // Verify item exists in user's cart in MySQL
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      const userItem = userCart?.items.find((i) => i.productId === prodNewId);
      expect(userItem).toBeDefined();
      expect(userItem?.quantity).toBe(2);

      // Verify guest cart is deleted
      const checkGuestCart = await prisma.cart.findUnique({
        where: { guestSessionId },
      });
      expect(checkGuestCart).toBeNull();
    });
  });

  // =========================================================================
  // Objective 3: Conflict Scenario 2 — Duplicate Product Accumulation
  // =========================================================================
  describe('Objective 3: Conflict Scenario 2 — Duplicate Product Accumulation', () => {
    it('MERGE-SC2: Accumulates quantity when product already exists in user cart, verified in MySQL', async () => {
      const guestSessionId = `guest-sc2-${Date.now()}`;

      // 1. Put Product 2 (qty = 3) into user's cart directly
      const userCart = await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: prodDupId } },
        update: { quantity: 3 },
        create: { cartId: userCart.id, productId: prodDupId, quantity: 3 },
      });

      // 2. Create guest cart with Product 2 (qty = 4)
      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodDupId,
              quantity: 4,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      // 3. Perform merge
      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedItemsCount).toBe(1);

      // 4. Verify in MySQL: 3 + 4 = 7
      const updatedItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: userCart.id, productId: prodDupId } },
      });
      expect(updatedItem?.quantity).toBe(7);
    });
  });

  // =========================================================================
  // Objective 4: Conflict Scenarios 3 & 4 — Unavailable Products
  // =========================================================================
  describe('Objective 4: Conflict Scenarios 3 & 4 — Unavailable Products', () => {
    it('MERGE-SC3: Skips out-of-stock product (stockQuantity = 0) and returns warning', async () => {
      const guestSessionId = `guest-sc3-${Date.now()}`;

      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodOosId,
              quantity: 1,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedItemsCount).toBe(0);
      expect(res.body.data.warnings.length).toBeGreaterThan(0);
      expect(res.body.data.warnings[0]).toContain('hết hàng');

      // Product must NOT be in user's cart
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      const oosItem = userCart?.items.find((i) => i.productId === prodOosId);
      expect(oosItem).toBeUndefined();
    });

    it('MERGE-SC4: Skips inactive product (status = INACTIVE) and returns warning', async () => {
      const guestSessionId = `guest-sc4-${Date.now()}`;

      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodInactiveId,
              quantity: 2,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedItemsCount).toBe(0);
      expect(res.body.data.warnings.length).toBeGreaterThan(0);
      expect(res.body.data.warnings[0]).toContain('ngừng kinh doanh');

      // Inactive product must NOT be in user's cart
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      const inactItem = userCart?.items.find((i) => i.productId === prodInactiveId);
      expect(inactItem).toBeUndefined();
    });
  });

  // =========================================================================
  // Objective 5: Conflict Scenario 5 — Quantity Exceeds Stock (Capping)
  // =========================================================================
  describe('Objective 5: Conflict Scenario 5 — Quantity Exceeds Stock (Capping)', () => {
    it('MERGE-SC5: Caps accumulated quantity to stockQuantity (4) and increments adjustedItemsCount', async () => {
      const guestSessionId = `guest-sc5-${Date.now()}`;

      // User has 2 in cart. Guest has 5. Desired = 7. Stock = 4.
      const userCart = await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: prodCapId } },
        update: { quantity: 2 },
        create: { cartId: userCart.id, productId: prodCapId, quantity: 2 },
      });

      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodCapId,
              quantity: 5,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedItemsCount).toBe(1);
      expect(res.body.data.adjustedItemsCount).toBe(1);
      expect(res.body.data.warnings.some((w: string) => w.includes('điều chỉnh về 4'))).toBe(true);

      // Verify in MySQL that final quantity is strictly 4
      const cappedItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: userCart.id, productId: prodCapId } },
      });
      expect(cappedItem?.quantity).toBe(4);
    });
  });

  // =========================================================================
  // Objective 6: Conflict Scenario 6 — Empty or Missing Guest Cart
  // =========================================================================
  describe('Objective 6: Conflict Scenario 6 — Empty or Missing Guest Cart', () => {
    it('MERGE-SC6: Idempotent no-op when guest cart is empty or missing, user cart unchanged', async () => {
      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId: 'guest-non-existent-99999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mergedItemsCount).toBe(0);
      expect(res.body.data.adjustedItemsCount).toBe(0);
      expect(res.body.data.warnings).toEqual([]);
    });
  });

  // =========================================================================
  // Objective 7: Conflict Scenario 7 — Replay & Idempotency Protection
  // =========================================================================
  describe('Objective 7: Conflict Scenario 7 — Replay & Idempotency Protection', () => {
    it('MERGE-SC7: Replaying the same merge returns 0 merged items because guest cart was deleted', async () => {
      const guestSessionId = `guest-sc7-${Date.now()}`;

      // Create guest cart
      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodNewId,
              quantity: 1,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      // First merge: should succeed and merge 1 item
      const res1 = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });
      expect(res1.status).toBe(200);
      expect(res1.body.data.mergedItemsCount).toBe(1);

      // Second merge with same guestSessionId: must be idempotent no-op (0 merged)
      const res2 = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ guestSessionId });
      expect(res2.status).toBe(200);
      expect(res2.body.data.mergedItemsCount).toBe(0);
      expect(res2.body.data.adjustedItemsCount).toBe(0);

      // Verify guest cart completely deleted from MySQL
      const dbGuestCart = await prisma.cart.findUnique({
        where: { guestSessionId },
      });
      expect(dbGuestCart).toBeNull();
    });
  });

  // =========================================================================
  // Objective 8: Concurrency Serialization
  // =========================================================================
  describe('Objective 8: Concurrency Serialization', () => {
    it('MERGE-CONC: Concurrent merge requests are serialized via InnoDB row lock without deadlocks', async () => {
      const guestSessionId = `guest-conc-${Date.now()}`;

      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodDupId,
              quantity: 1,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      // Fire 3 simultaneous merge requests with the same guestSessionId
      const requests = [1, 2, 3].map(() =>
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ guestSessionId }),
      );

      const responses = await Promise.all(requests);

      // All requests should return 200 without throwing 500 deadlock
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }

      // Exactly one request should have merged the item (mergedItemsCount = 1), others 0
      const totalMerged = responses.reduce(
        (sum, r) => sum + (r.body.data.mergedItemsCount || 0),
        0,
      );
      expect(totalMerged).toBe(1);
    });

    it('MERGE-CONC-CROSS-USER: Two concurrent requests merging the same guestSessionId into DIFFERENT users strictly serializes and prevents double-merge', async () => {
      const ts = Date.now();
      const userB = await prisma.user.create({
        data: {
          email: `cart-merge-user-b-${ts}@nexora.local`,
          fullName: 'Nguyễn Văn B (Cross User)',
          passwordHash: await bcrypt.hash('TestPassword123!', 10),
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
      createdUserIds.push(userB.id);

      const userBToken = jwt.sign(
        { sub: userB.id, email: userB.email, role: userB.role },
        getEnv().AUTH_SECRET,
        { expiresIn: '1h' },
      );

      const guestSessionId = `guest-cross-${ts}`;
      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodNewId,
              quantity: 2,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      // Fire 2 concurrent merge requests: User A and User B simultaneously requesting the SAME guestSessionId
      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ guestSessionId }),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${userBToken}`)
          .send({ guestSessionId }),
      ]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);

      const countA = resA.body.data.mergedItemsCount || 0;
      const countB = resB.body.data.mergedItemsCount || 0;

      // Invariant: Exactly one user got the items (1), the other got 0
      expect(countA + countB).toBe(1);

      // Verify on MySQL: only ONE user's cart has the item with quantity 2
      const userACart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      const userBCart = await prisma.cart.findUnique({
        where: { userId: userB.id },
        include: { items: true },
      });

      const hasItemInA = userACart?.items.some(
        (i) => i.productId === prodNewId && i.quantity === 2,
      );
      const hasItemInB = userBCart?.items.some(
        (i) => i.productId === prodNewId && i.quantity === 2,
      );

      expect(Boolean(hasItemInA) !== Boolean(hasItemInB)).toBe(true);

      // Verify guest cart is cleanly deleted
      const checkGuestCart = await prisma.cart.findUnique({ where: { guestSessionId } });
      expect(checkGuestCart).toBeNull();
    });

    it('MERGE-ROLLBACK: When transaction fails or is aborted, guest cart and items are preserved (atomic rollback)', async () => {
      const ts = Date.now();
      const guestSessionId = `guest-rollback-${ts}`;

      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodDupId,
              quantity: 2,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      const cartService = new CartService(prisma);

      // Attempt merge with a non-existent userId that causes foreign key constraint failure
      await expect(cartService.mergeGuestCartToUser(guestSessionId, 999999999)).rejects.toThrow();

      // Invariant: Guest cart and guest items MUST still exist intact in MySQL
      const preservedGuestCart = await prisma.cart.findUnique({
        where: { guestSessionId },
        include: { items: true },
      });

      expect(preservedGuestCart).not.toBeNull();
      expect(preservedGuestCart?.items.length).toBe(1);
      expect(preservedGuestCart?.items[0].productId).toBe(prodDupId);
      expect(preservedGuestCart?.items[0].quantity).toBe(2);
    });
  });

  // =========================================================================
  // Objective 9: Auth Integration — Merge on Login
  // =========================================================================
  describe('Objective 9: Auth Integration — Merge on Login', () => {
    it('MERGE-AUTH-LOGIN: Calling POST /api/v1/auth/login with guestSessionId merges cart seamlessly', async () => {
      const guestSessionId = `guest-login-${Date.now()}`;

      // Create guest cart with 2 items of prodNewId
      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodNewId,
              quantity: 2,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: userEmail,
        password: 'TestPassword123!',
        guestSessionId,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.cartMerge).toBeDefined();
      expect(res.body.data.cartMerge.mergedItemsCount).toBe(1);

      // Verify guest cart deleted from MySQL
      const dbGuest = await prisma.cart.findUnique({ where: { guestSessionId } });
      expect(dbGuest).toBeNull();
    });
  });

  // =========================================================================
  // Objective 10: Auth Integration — Merge on Register
  // =========================================================================
  describe('Objective 10: Auth Integration — Merge on Register', () => {
    it('MERGE-AUTH-REG: Calling POST /api/v1/auth/register with guestSessionId merges guest cart into new account', async () => {
      const ts = Date.now();
      const guestSessionId = `guest-reg-${ts}`;
      const newEmail = `cart-reg-${ts}@nexora.local`;

      // Create guest cart with 3 items of prodDupId
      const guestCart = await prisma.cart.create({
        data: {
          guestSessionId,
          items: {
            create: {
              productId: prodDupId,
              quantity: 3,
            },
          },
        },
      });
      createdCartIds.push(guestCart.id);

      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: 'Khách Đăng Ký Mới',
        email: newEmail,
        password: 'NewUserPassword2026!',
        phone: '0912345678',
        guestSessionId,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      createdUserIds.push(res.body.data.user.id);
      expect(res.body.data.cartMerge).toBeDefined();
      expect(res.body.data.cartMerge.mergedItemsCount).toBe(1);

      // Verify new user has item in their cart in MySQL
      const newUserCart = await prisma.cart.findUnique({
        where: { userId: res.body.data.user.id },
        include: { items: true },
      });
      expect(newUserCart?.items.length).toBe(1);
      expect(newUserCart?.items[0].productId).toBe(prodDupId);
      expect(newUserCart?.items[0].quantity).toBe(3);

      // Verify guest cart deleted from MySQL
      const dbGuest = await prisma.cart.findUnique({ where: { guestSessionId } });
      expect(dbGuest).toBeNull();
    });
  });
});
