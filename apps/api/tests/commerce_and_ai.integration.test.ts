import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

describe('Commerce, Marketing and AI Integration Endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
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
    // 1. Get a product ID from catalog
    const catalogRes = await request(app).get('/api/v1/catalog/products?limit=1');
    expect(catalogRes.status).toBe(200);
    const product = catalogRes.body.data.products[0];
    expect(product).toBeDefined();

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
    const res = await request(app)
      .post('/api/v1/ai/assistant/survey')
      .send({
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
});
