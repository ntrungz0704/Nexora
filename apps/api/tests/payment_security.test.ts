import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { PaymentService } from '../src/modules/payment/payment.service.js';
import type { Express } from 'express';

describe('Payment Security & VNPay Verification Test Suite', () => {
  let app: Express;
  let paymentService: PaymentService;
  let testOrderCode: string;
  let testOrderAmount: number;

  beforeAll(async () => {
    app = createApp();
    paymentService = new PaymentService();

    // 1. Create a real test order
    const catalogRes = await request(app).get('/api/v1/catalog/products?limit=1');
    const product = catalogRes.body.data.products[0];

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Kiểm Thử Thanh Toán',
        customerEmail: 'payment-test@nexora.local',
        customerPhone: '0988776655',
        shippingAddress: '123 Đường Test, Quận 1',
        paymentMethod: 'VNPAY',
        items: [{ productId: product.id, quantity: 1 }],
      });

    expect(orderRes.status).toBe(201);
    testOrderCode = orderRes.body.data.orderCode;
    testOrderAmount = Number(orderRes.body.data.totalAmount);
  });

  it('SEC-1: createVnpayPaymentUrl fetches amount from database and ignores forged client amounts', async () => {
    // Attempt to pass forged amount of 1000 VND
    const res = await request(app)
      .post('/api/v1/payment/vnpay/create-url')
      .send({
        orderCode: testOrderCode,
        amount: 1000, // Forged
      });

    expect(res.status).toBe(200);
    const paymentUrl = res.body.data.paymentUrl;
    expect(paymentUrl).toBeDefined();

    // The generated VNPay URL must contain the real server amount (testOrderAmount * 100), NOT 1000
    const url = new URL(paymentUrl);
    const expectedVnpAmount = (Math.round(testOrderAmount * 100)).toString();
    expect(url.searchParams.get('vnp_Amount')).toBe(expectedVnpAmount);
    expect(url.searchParams.get('vnp_Amount')).not.toBe('100000');
  });

  it('SEC-2: verifyVnpayCallback rejects invalid HMAC-SHA512 checksums', async () => {
    const callbackQuery = {
      vnp_Amount: (Math.round(testOrderAmount * 100)).toString(),
      vnp_BankCode: 'NCB',
      vnp_ResponseCode: '00',
      vnp_TxnRef: testOrderCode,
      vnp_SecureHash: 'invalid_fraudulent_hash_signature_123456',
    };

    const res = await request(app)
      .get('/api/v1/payment/vnpay/callback')
      .query(callbackQuery);

    expect(res.status).toBe(200);
    expect(res.body.data.isSuccess).toBe(false);
    expect(res.body.data.message).toContain('Chữ ký checksum VNPay không hợp lệ');
  });

  it('SEC-3: verifyVnpayCallback rejects payment if amount does not match server order total', async () => {
    // Generate valid hash for mismatched amount (e.g. 100 VND)
    const secret = process.env.VNPAY_HASH_SECRET || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
    const params: Record<string, string> = {
      vnp_Amount: '10000', // 100 VND, mismatched
      vnp_BankCode: 'NCB',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: testOrderCode,
    };

    const sortedKeys = Object.keys(params).sort();
    const sorted: Record<string, string> = {};
    for (const k of sortedKeys) sorted[k] = params[k];
    const signData = new URLSearchParams(sorted).toString();
    const hash = crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');

    const callbackQuery = { ...params, vnp_SecureHash: hash };

    const res = await request(app)
      .get('/api/v1/payment/vnpay/callback')
      .query(callbackQuery);

    expect(res.status).toBe(200);
    expect(res.body.data.isSuccess).toBe(false);
    expect(res.body.data.message).toContain('Số tiền thanh toán không khớp');
  });

  it('SEC-4: verifyVnpayCallback processes valid callback and enforces idempotency', async () => {
    const secret = process.env.VNPAY_HASH_SECRET || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
    const params: Record<string, string> = {
      vnp_Amount: (Math.round(testOrderAmount * 100)).toString(),
      vnp_BankCode: 'NCB',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: testOrderCode,
    };

    const sortedKeys = Object.keys(params).sort();
    const sorted: Record<string, string> = {};
    for (const k of sortedKeys) sorted[k] = params[k];
    const signData = new URLSearchParams(sorted).toString();
    const hash = crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');

    const callbackQuery = { ...params, vnp_SecureHash: hash };

    // First call: Successful payment
    const res1 = await request(app)
      .get('/api/v1/payment/vnpay/callback')
      .query(callbackQuery);

    expect(res1.status).toBe(200);
    expect(res1.body.data.isSuccess).toBe(true);
    expect(res1.body.data.message).toContain('Thanh toán VNPay thành công');

    // Second call: Idempotent return without duplicate processing
    const res2 = await request(app)
      .get('/api/v1/payment/vnpay/callback')
      .query(callbackQuery);

    expect(res2.status).toBe(200);
    expect(res2.body.data.isSuccess).toBe(true);
    expect(res2.body.data.message).toContain('Idempotent');
  });

  it('SEC-5: simulatePaymentSuccess throws 403 in production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';

      await expect(
        paymentService.simulatePaymentSuccess('NX-MOCK-TEST')
      ).rejects.toThrow('Production');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
