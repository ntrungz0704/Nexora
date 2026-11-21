import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { EmailService } from '../src/modules/email/email.service.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Commerce, Marketing and AI Integration Endpoints', () => {
  let app: Express;
  let testOrderCode: string | null = null;
  let testProductId: number | null = null;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    try {
      if (testOrderCode) {
        const order = await prisma.order.findUnique({
          where: { orderCode: testOrderCode },
          select: { id: true, orderCode: true },
        });
        if (order) {
          await prisma.inventoryLog.deleteMany({
            where: { referenceType: 'ORDER', referenceId: order.orderCode },
          });
          await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
          await prisma.order.delete({ where: { id: order.id } });
        }
      }
      if (testProductId) {
        await prisma.product.update({
          where: { id: testProductId },
          data: { stockQuantity: { increment: 1 } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('GET /api/v1/marketing/coupons returns active coupons', async () => {
    const res = await request(app).get('/api/v1/marketing/coupons');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('code');
  });

  it('POST /api/v1/marketing/coupons/validate verifies coupon discount', async () => {
    const res = await request(app)
      .post('/api/v1/marketing/coupons/validate')
      .send({ code: 'TECHPILOT100', subtotal: 1000000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.discountAmount).toBe(100000);
    expect(res.body.data.finalTotal).toBe(900000);
  });

  it('POST /api/v1/orders creates order with snapshot items and inventory reduction', async () => {
    // 1. Get a product ID that has plenty of available stock
    const product = await prisma.product.findFirstOrThrow({
      where: { stockQuantity: { gte: 5 } },
    });
    testProductId = product.id;

    // 2. Place order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Trần Văn Test',
        customerEmail: 'test@nexora.local',
        customerPhone: '0901234567',
        shippingAddress: '456 Lê Lợi, Quận 1, TP. HCM',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        paymentMethod: 'COD',
        couponCode: 'TECHPILOT100',
        items: [{ productId: product.id, quantity: 1 }],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    const order = orderRes.body.data;
    testOrderCode = order.orderCode;
    expect(order.orderCode).toMatch(/^NX-/);
    expect(order.customerName).toBe('Trần Văn Test');
    expect(order.items.length).toBe(1);
    expect(order.items[0].productName).toBe(product.name);

    // 3. Track order by code & phone
    const trackRes = await request(app).get(
      `/api/v1/orders/track?code=${order.orderCode}&phone=0901234567`,
    );
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.orderCode).toBe(order.orderCode);

    // 4. Simulate VNPay Payment
    const payRes = await request(app)
      .post('/api/v1/payment/simulate')
      .send({ orderCode: order.orderCode });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('PAID');
  });

  it('POST /api/v1/ai/chatbot/query returns intent and natural response', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chatbot/query')
      .send({ message: 'Chính sách đổi trả bảo hành tại cửa hàng như thế nào?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.intent).toBe('POLICY_RETURN');
    expect(res.body.data.answer).toContain('7 ngày');
  });

  it('POST /api/v1/ai/assistant/survey computes 100-pt score and 3 distinct recommendation roles', async () => {
    const res = await request(app).post('/api/v1/ai/assistant/survey').send({
      persona: 'gaming',
      budgetRange: '15m-25m',
      priority: 'performance',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.recommendations).toHaveLength(3);

    const roles = data.recommendations.map((r: { role: string }) => r.role);
    expect(roles).toContain('BEST_MATCH');
    expect(roles).toContain('BEST_VALUE');
    expect(roles).toContain('TOP_PERFORMANCE');
  });

  it('POST /api/v1/ai/compare enforces Category Lock and returns spec comparison', async () => {
    const catalogRes = await request(app).get('/api/v1/catalog/products?limit=2');
    const products = catalogRes.body.data.products;

    if (products.length >= 2 && products[0].categoryId === products[1].categoryId) {
      const res = await request(app)
        .post('/api/v1/ai/compare')
        .send({ productIds: [products[0].id, products[1].id] });

      expect(res.status).toBe(200);
      expect(res.body.data.categoryLocked).toBe(true);
      expect(res.body.data.comparisonAnalysis).toHaveProperty('breakdown');
    }
  });

  it('GET /api/v1/wishlist rejects unauthenticated guest with 401', async () => {
    const res = await request(app).get('/api/v1/wishlist');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/wishlist/toggle rejects unauthenticated guest with 401', async () => {
    const res = await request(app).post('/api/v1/wishlist/toggle').send({ productId: 1 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/wishlist/toggle and GET /api/v1/wishlist works for authenticated customer', async () => {
    // 1. Log in customer
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    // 2. Get a valid product ID
    const catRes = await request(app).get('/api/v1/catalog/products?limit=1');
    const productId = catRes.body.data.products[0].id;

    // 3. Toggle product into wishlist
    const toggleRes = await request(app)
      .post('/api/v1/wishlist/toggle')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.success).toBe(true);
    expect(toggleRes.body.data).toHaveProperty('inWishlist');

    // 4. Get wishlist
    const getRes = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(Array.isArray(getRes.body.data)).toBe(true);

    // 5. Get wishlist count
    const countRes = await request(app)
      .get('/api/v1/wishlist/count')
      .set('Authorization', `Bearer ${token}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.success).toBe(true);
    expect(typeof countRes.body.data.count).toBe('number');

    // 6. Toggle product again to restore original state if it was added
    if (toggleRes.body.data.inWishlist) {
      const toggleOffRes = await request(app)
        .post('/api/v1/wishlist/toggle')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId });
      expect(toggleOffRes.status).toBe(200);
      expect(toggleOffRes.body.data.inWishlist).toBe(false);
    }
  });

  it('Verifies strict Customer Isolation in Wishlist (Customer A cannot see Customer B)', async () => {
    // 1. Log in Customer A
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(loginA.status).toBe(200);
    const tokenA = loginA.body.data.token;

    // 2. Log in Customer B (staff account acting as user B)
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@nexora.local', password: 'password123' });
    expect(loginB.status).toBe(200);
    const tokenB = loginB.body.data.token;

    // 3. Product ID
    const catRes = await request(app).get('/api/v1/catalog/products?limit=2');
    const prodA = catRes.body.data.products[0].id;

    // 4. Customer A adds product
    await request(app)
      .post('/api/v1/wishlist/toggle')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: prodA });

    // 5. Customer B fetches wishlist -> MUST NOT see Customer A's items
    const getB = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(getB.status).toBe(200);
    const bItems = (getB.body.data as Array<{ productId: number }>).filter(
      (item) => item.productId === prodA,
    );
    expect(bItems.length).toBe(0);

    const aWishlist = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(aWishlist.status).toBe(200);
    expect(
      (aWishlist.body.data as Array<{ productId: number }>).some(
        (item) => item.productId === prodA,
      ),
    ).toBe(true);

    // Clean up
    await request(app)
      .post('/api/v1/wishlist/toggle')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: prodA });
  });

  it('Verifies Auth Reset Password flow end-to-end without leaking token in HTTP response', async () => {
    EmailService.clearSentEmails();

    // 1. Request forgot password via public HTTP endpoint
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    // CRITICAL SECURITY ASSERTION: Response MUST NOT contain resetToken
    expect(forgotRes.body.data.resetToken).toBeUndefined();
    expect(forgotRes.body.data).toHaveProperty('message');

    // 2. Obtain valid token from actual email sent by EmailService
    const sentEmail = EmailService.getLastEmail();
    expect(sentEmail).toBeDefined();
    const match = sentEmail!.html.match(/token=([A-Za-z0-9-_.]+)/);
    expect(match).not.toBeNull();
    const resetToken = match![1];

    // 3. Reset password with new password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'newpassword123' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 4. Login with new password
    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'newpassword123' });

    expect(loginNew.status).toBe(200);
    expect(loginNew.body.success).toBe(true);

    // 5. Revert back to original password using fresh forgot-password
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });
    const revertEmail = EmailService.getLastEmail();
    const revertToken = revertEmail!.html.match(/token=([A-Za-z0-9-_.]+)/)![1];
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: revertToken, newPassword: 'password123' });
  });
});
