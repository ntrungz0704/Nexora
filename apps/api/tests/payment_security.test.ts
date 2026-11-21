import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { PaymentService } from '../src/modules/payment/payment.service.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Payment Security & VNPay Verification Test Suite', () => {
  let app: Express;
  let paymentService: PaymentService;
  let guestOrderCode: string;
  let guestOrderAmount: number;
  let userOrderCode: string;
  let _userOrderAmount: number;
  let testProductId: number;
  let registeredCust2Email: string;

  let customer1Token: string;
  let customer2Token: string;
  let adminToken: string;

  afterAll(async () => {
    try {
      const orderCodes = [guestOrderCode, userOrderCode].filter(Boolean);
      if (orderCodes.length > 0) {
        const orders = await prisma.order.findMany({
          where: { orderCode: { in: orderCodes } },
          select: { id: true, orderCode: true },
        });
        const orderIds = orders.map((o) => o.id);
        const foundCodes = orders.map((o) => o.orderCode);
        if (orderIds.length > 0) {
          await prisma.inventoryLog.deleteMany({
            where: { referenceType: 'ORDER', referenceId: { in: foundCodes } },
          });
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
      }
      if (testProductId) {
        // Restore 2 units of stock deducted for guest & user orders
        await prisma.product.update({
          where: { id: testProductId },
          data: { stockQuantity: { increment: 2 } },
        });
      }
      if (registeredCust2Email) {
        const u = await prisma.user.findUnique({
          where: { email: registeredCust2Email },
          select: { id: true },
        });
        if (u) {
          const userCarts = await prisma.cart.findMany({
            where: { userId: u.id },
            select: { id: true },
          });
          const cartIds = userCarts.map((c) => c.id);
          if (cartIds.length > 0) {
            await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
            await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
          }
          await prisma.wishlist.deleteMany({ where: { userId: u.id } });
          await prisma.user.delete({ where: { id: u.id } });
        }
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeAll(async () => {
    app = createApp();
    paymentService = new PaymentService();

    // 1. Login Customer 1
    const cust1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(cust1Res.status).toBe(200);
    customer1Token = cust1Res.body.data.token;

    // 2. Register/Login Customer 2
    const randomSuffix = Math.floor(Math.random() * 100000);
    const cust2Email = `customer2_${randomSuffix}@nexora.local`;
    registeredCust2Email = cust2Email;
    const cust2Res = await request(app).post('/api/v1/auth/register').send({
      email: cust2Email,
      password: 'password123',
      fullName: 'Customer Two',
      phone: '0912345678',
    });
    expect(cust2Res.status).toBe(201);
    customer2Token = cust2Res.body.data.token;

    // 3. Login Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexora.local', password: 'password123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 4. Get a product with plenty of available stock
    const product = await prisma.product.findFirstOrThrow({
      where: { stockQuantity: { gte: 10 } },
    });
    testProductId = product.id;

    // 5. Create a Guest Order
    const guestOrderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Khách Vãng Lai',
        customerEmail: 'guest-payer@nexora.local',
        customerPhone: '0988776655',
        shippingAddress: '123 Đường Test, Quận 1',
        paymentMethod: 'VNPAY',
        items: [{ productId: product.id, quantity: 1 }],
      });
    expect(guestOrderRes.status).toBe(201);
    guestOrderCode = guestOrderRes.body.data.orderCode;
    guestOrderAmount = Number(guestOrderRes.body.data.totalAmount);

    // 6. Create a Registered User Order (Customer 1)
    const userOrderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        customerName: 'Khách Hàng Một',
        customerEmail: 'customer@nexora.local',
        customerPhone: '0900112233',
        shippingAddress: '456 Đường Nguyễn Huệ, Quận 1',
        paymentMethod: 'VNPAY',
        items: [{ productId: product.id, quantity: 1 }],
      });
    expect(userOrderRes.status).toBe(201);
    userOrderCode = userOrderRes.body.data.orderCode;
    _userOrderAmount = Number(userOrderRes.body.data.totalAmount);
  });

  // --- OWNERSHIP & AUTHORIZATION CHECKS ---

  it('OWN-1: Rejects payment URL creation for guest order when verification email/phone is missing or wrong', async () => {
    // Missing email and phone
    const resNoCreds = await request(app).post('/api/v1/payment/vnpay/create-url').send({
      orderCode: guestOrderCode,
    });
    expect(resNoCreds.status).toBe(403);
    expect(resNoCreds.body.error.code).toBe('FORBIDDEN');

    // Wrong email
    const resWrongEmail = await request(app).post('/api/v1/payment/vnpay/create-url').send({
      orderCode: guestOrderCode,
      customerEmail: 'hacker@malicious.com',
    });
    expect(resWrongEmail.status).toBe(403);
    expect(resWrongEmail.body.error.code).toBe('FORBIDDEN');
  });

  it('OWN-2: Allows payment URL creation for guest order when matching customerEmail or customerPhone is provided', async () => {
    const res = await request(app).post('/api/v1/payment/vnpay/create-url').send({
      orderCode: guestOrderCode,
      customerEmail: 'guest-payer@nexora.local',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.paymentUrl).toBeDefined();
  });

  it('OWN-3: Rejects payment URL creation for registered user order when unauthenticated (401)', async () => {
    const res = await request(app).post('/api/v1/payment/vnpay/create-url').send({
      orderCode: userOrderCode,
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('OWN-4: Rejects payment URL creation for registered user order when requested by another customer (403 IDOR protection)', async () => {
    const res = await request(app)
      .post('/api/v1/payment/vnpay/create-url')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        orderCode: userOrderCode,
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('OWN-5: Allows payment URL creation for registered user order when requested by the owner', async () => {
    const res = await request(app)
      .post('/api/v1/payment/vnpay/create-url')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        orderCode: userOrderCode,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.paymentUrl).toBeDefined();
  });

  it('OWN-6: Allows payment URL creation for registered user order when requested by Admin', async () => {
    const res = await request(app)
      .post('/api/v1/payment/vnpay/create-url')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderCode: userOrderCode,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.paymentUrl).toBeDefined();
  });

  it('OWN-7: Rejects payment URL creation for non-existent order with 404', async () => {
    const res = await request(app)
      .post('/api/v1/payment/vnpay/create-url')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderCode: 'NX-NON-EXISTENT-ORDER-999',
      });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  // --- INTEGRITY & TAMPER RESISTANCE ---

  it('SEC-1: createVnpayPaymentUrl fetches amount from database and ignores forged client amounts', async () => {
    // Attempt to pass forged amount of 1000 VND
    const res = await request(app).post('/api/v1/payment/vnpay/create-url').send({
      orderCode: guestOrderCode,
      customerEmail: 'guest-payer@nexora.local',
      amount: 1000, // Forged
    });

    expect(res.status).toBe(200);
    const paymentUrl = res.body.data.paymentUrl;
    expect(paymentUrl).toBeDefined();

    // The generated VNPay URL must contain the real server amount (guestOrderAmount * 100), NOT 1000
    const url = new URL(paymentUrl);
    const expectedVnpAmount = Math.round(guestOrderAmount * 100).toString();
    expect(url.searchParams.get('vnp_Amount')).toBe(expectedVnpAmount);
    expect(url.searchParams.get('vnp_Amount')).not.toBe('100000');
  });

  it('SEC-2: verifyVnpayCallback rejects invalid HMAC-SHA512 checksums', async () => {
    const callbackQuery = {
      vnp_Amount: Math.round(guestOrderAmount * 100).toString(),
      vnp_BankCode: 'NCB',
      vnp_ResponseCode: '00',
      vnp_TxnRef: guestOrderCode,
      vnp_SecureHash: 'invalid_fraudulent_hash_signature_123456',
    };

    const res = await request(app).get('/api/v1/payment/vnpay/callback').query(callbackQuery);

    expect(res.status).toBe(200);
    expect(res.body.data.isSuccess).toBe(false);
    expect(res.body.data.message).toContain('Chữ ký checksum VNPay không hợp lệ');
  });

  it('SEC-3: verifyVnpayCallback rejects payment if amount does not match server order total', async () => {
    const secret = process.env.VNPAY_HASH_SECRET || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
    const params: Record<string, string> = {
      vnp_Amount: '10000', // 100 VND, mismatched
      vnp_BankCode: 'NCB',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: guestOrderCode,
    };

    const sortedKeys = Object.keys(params).sort();
    const sorted: Record<string, string> = {};
    for (const k of sortedKeys) sorted[k] = params[k];
    const signData = new URLSearchParams(sorted).toString();
    const hash = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const callbackQuery = { ...params, vnp_SecureHash: hash };

    const res = await request(app).get('/api/v1/payment/vnpay/callback').query(callbackQuery);

    expect(res.status).toBe(200);
    expect(res.body.data.isSuccess).toBe(false);
    expect(res.body.data.message).toContain('Số tiền thanh toán không khớp');
  });

  it('SEC-4: verifyVnpayCallback processes valid callback and enforces idempotency', async () => {
    const secret = process.env.VNPAY_HASH_SECRET || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
    const params: Record<string, string> = {
      vnp_Amount: Math.round(guestOrderAmount * 100).toString(),
      vnp_BankCode: 'NCB',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: guestOrderCode,
    };

    const sortedKeys = Object.keys(params).sort();
    const sorted: Record<string, string> = {};
    for (const k of sortedKeys) sorted[k] = params[k];
    const signData = new URLSearchParams(sorted).toString();
    const hash = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const callbackQuery = { ...params, vnp_SecureHash: hash };

    // First call: Successful payment
    const res1 = await request(app).get('/api/v1/payment/vnpay/callback').query(callbackQuery);

    expect(res1.status).toBe(200);
    expect(res1.body.data.isSuccess).toBe(true);
    expect(res1.body.data.message).toContain('Thanh toán VNPay thành công');

    // Second call: Idempotent return without duplicate processing
    const res2 = await request(app).get('/api/v1/payment/vnpay/callback').query(callbackQuery);

    expect(res2.status).toBe(200);
    expect(res2.body.data.isSuccess).toBe(true);
    expect(res2.body.data.message).toContain('Idempotent');
  });

  it('SEC-4B: Rejects payment URL creation if order is already paid with 400 ORDER_ALREADY_PAID', async () => {
    // guestOrderCode is now paid from SEC-4 test above
    const res = await request(app).post('/api/v1/payment/vnpay/create-url').send({
      orderCode: guestOrderCode,
      customerEmail: 'guest-payer@nexora.local',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ORDER_ALREADY_PAID');
  });

  it('SEC-5: simulatePaymentSuccess throws 403 in production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';

      await expect(paymentService.simulatePaymentSuccess('NX-MOCK-TEST')).rejects.toThrow(
        'Production',
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
