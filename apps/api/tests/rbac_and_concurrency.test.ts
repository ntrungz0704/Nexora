import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

describe('RBAC & Concurrency Security Test Suite', () => {
  let app: Express;
  let customerToken: string;
  let staffToken: string;
  let adminToken: string;

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
});
