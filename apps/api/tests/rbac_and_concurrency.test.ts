import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('RBAC & Concurrency Security Test Suite', () => {
  let app: Express;
  let customerToken: string;
  let staffToken: string;
  let adminToken: string;
  const createdProductIds: number[] = [];
  const createdOrderCodes: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrderCodes.length > 0) {
        const orders = await prisma.order.findMany({
          where: { orderCode: { in: createdOrderCodes } },
          select: { id: true },
        });
        const orderIds = orders.map((o) => o.id);
        if (orderIds.length > 0) {
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
      }
      if (createdProductIds.length > 0) {
        await prisma.inventoryLog.deleteMany({ where: { productId: { in: createdProductIds } } });
        await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeAll(async () => {
    app = createApp();

    // 1. Login Customer
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.data.token;

    // 2. Login Staff
    const staffRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@nexora.local', password: 'password123' });
    expect(staffRes.status).toBe(200);
    staffToken = staffRes.body.data.token;

    // 3. Login Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexora.local', password: 'password123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
  });

  it('RBAC-1: Unauthenticated request to /admin/dashboard/summary is rejected with 401', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('RBAC-2: Customer role request to /admin/dashboard/summary is rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('RBAC-3: Staff role request to /admin/dashboard/summary is allowed (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalRevenue');
  });

  it('RBAC-4: Admin role request to /admin/dashboard/summary is allowed (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('ordersCount');
    expect(res.body.data).toHaveProperty('totalRevenue');
    expect(res.body.data).toHaveProperty('customersCount');
  });

  it('CONCURRENCY-1: Order creation rejects request when quantity exceeds current stock', async () => {
    // 1. Create a product with stock = 1 via Admin API
    const prodRes = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sản Phẩm Giới Hạn Kho 1',
        slug: `san-pham-kho-1-${Date.now()}`,
        categoryId: 1,
        price: '500000',
        stockQuantity: 1,
        sku: `SKU-LTD-${Date.now().toString().slice(-4)}`,
        shortDescription: 'Chỉ còn duy nhất 1 sản phẩm',
      });

    expect(prodRes.status).toBe(201);
    const product = prodRes.body.data;
    createdProductIds.push(product.id);

    // 2. Order 1 unit with valid customer info (should succeed)
    const order1 = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Người Mua 1',
        customerEmail: 'buyer1@nexora.local',
        customerPhone: '0901111111',
        shippingAddress: 'Địa chỉ 123 Đường Láng',
        paymentMethod: 'COD',
        items: [{ productId: product.id, quantity: 1 }],
      });
    expect(order1.status).toBe(201);
    if (order1.body?.data?.orderCode) {
      createdOrderCodes.push(order1.body.data.orderCode);
    }

    // 3. Second order for the same product (should fail with 400 due to 0 stock)
    const order2 = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Người Mua 2',
        customerEmail: 'buyer2@nexora.local',
        customerPhone: '0902222222',
        shippingAddress: 'Địa chỉ 456 Đường Giải Phóng',
        paymentMethod: 'COD',
        items: [{ productId: product.id, quantity: 1 }],
      });

    expect(order2.status).toBe(400);
    expect(order2.body.success).toBe(false);
    expect(order2.body.error.message).toContain('không đủ số lượng trong kho');
  });

  it('CONCURRENCY-2: Two simultaneous order requests (Promise.all) for the last single stock unit: exactly ONE succeeds (201) and ONE fails (400)', async () => {
    // 1. Create product with stockQuantity = 1
    const prodRes = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sản Phẩm Đua Đặt Hàng Đồng Thời',
        slug: `san-pham-dua-kho-${Date.now()}`,
        categoryId: 1,
        price: '600000',
        stockQuantity: 1,
        sku: `SKU-RACE-${Date.now().toString().slice(-4)}`,
        shortDescription: 'Thử nghiệm race condition 2 đơn đồng thời',
      });

    expect(prodRes.status).toBe(201);
    const product = prodRes.body.data;
    createdProductIds.push(product.id);

    // 2. Fire 2 simultaneous purchase requests via Promise.all
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .send({
          customerName: 'Người Mua Nhanh A',
          customerEmail: 'buyerA@nexora.local',
          customerPhone: '0901111111',
          shippingAddress: '123 Cầu Giấy, Hà Nội',
          paymentMethod: 'COD',
          items: [{ productId: product.id, quantity: 1 }],
        }),
      request(app)
        .post('/api/v1/orders')
        .send({
          customerName: 'Người Mua Nhanh B',
          customerEmail: 'buyerB@nexora.local',
          customerPhone: '0902222222',
          shippingAddress: '456 Đống Đa, Hà Nội',
          paymentMethod: 'COD',
          items: [{ productId: product.id, quantity: 1 }],
        }),
    ]);

    if (resA.body?.data?.orderCode) createdOrderCodes.push(resA.body.data.orderCode);
    if (resB.body?.data?.orderCode) createdOrderCodes.push(resB.body.data.orderCode);

    const statuses = [resA.status, resB.status].sort();
    // Exactly one must succeed (201) and exactly one must be rejected (400)
    expect(statuses).toEqual([201, 400]);

    const failedRes = resA.status === 400 ? resA : resB;
    expect(failedRes.body.success).toBe(false);
    expect(failedRes.body.error.code).toBe('INSUFFICIENT_STOCK');

    // Verify final stock is exactly 0 in database (no negative stock, no overselling)
    const checkRes = await request(app).get(`/api/v1/catalog/products/${product.slug}`);
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.stockQuantity).toBe(0);
  });

  describe('P1 Auth Security Regression Tests', () => {
    it('AUTH-P1-1: Plaintext fallback "TechPilotAdmin2026!" is strictly rejected with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@nexora.local', password: 'TechPilotAdmin2026!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('AUTH-P1-2: Plaintext fallback "admin123" is strictly rejected with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@nexora.local', password: 'admin123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('AUTH-P1-3: Plaintext fallback "dev123" is strictly rejected with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'customer@nexora.local', password: 'dev123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('AUTH-P1-4: Legitimate bcrypt hashed credentials succeed with 200', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@nexora.local', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('admin@nexora.local');
    });
  });
});
