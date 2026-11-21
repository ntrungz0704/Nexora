import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Phase A Security Remediation Suite (RBAC, Order IDOR & Rate Limiting)', () => {
  let app: Express;
  let adminToken: string;
  let staffToken: string;
  let customerAToken: string;
  let customerBToken: string;

  let adminUserId: number;
  let staffUserId: number;
  let customerAId: number;
  let customerBId: number;
  let disposableUserId: number;

  let customerAOrderCode: string;
  let guestOrderCode: string;
  const guestPhone = '0987654321';
  const guestEmail = 'guest-idor-test@nexora.local';
  const createdOrderCodes: string[] = [];
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        // Keep production-like thresholds active; dedicated rate-limit describe block tests exact 429 trigger
        authLoginRegister: { limit: 30 },
        orderLookup: { limit: 50 },
        commerceWrite: { limit: 30 },
      },
    });

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create isolated Customer B and a disposable test user for RBAC mutation verification
    const ts = Date.now();
    const custB = await prisma.user.create({
      data: {
        email: `phasea-custb-${ts}@nexora.local`,
        fullName: 'Phase A Customer B',
        phone: '0912000111',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerBId = custB.id;
    createdUserIds.push(custB.id);

    const disposable = await prisma.user.create({
      data: {
        email: `phasea-target-${ts}@nexora.local`,
        fullName: 'Phase A Role Target',
        phone: '0912000222',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    disposableUserId = disposable.id;
    createdUserIds.push(disposable.id);

    // Login Admin, Staff, Customer A, Customer B
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexora.local', password: 'password123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
    adminUserId = adminRes.body.data.user.id;

    const staffRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@nexora.local', password: 'password123' });
    expect(staffRes.status).toBe(200);
    staffToken = staffRes.body.data.token;
    staffUserId = staffRes.body.data.user.id;

    const custARes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(custARes.status).toBe(200);
    customerAToken = custARes.body.data.token;
    customerAId = custARes.body.data.user.id;

    const custBRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: custB.email, password: 'password123' });
    expect(custBRes.status).toBe(200);
    customerBToken = custBRes.body.data.token;

    // Find an active in-stock product to create 1 Customer A order and 1 Guest order
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE', stockQuantity: { gte: 5 } },
      orderBy: { id: 'asc' },
    });
    expect(product).not.toBeNull();

    const custAOrderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        customerName: 'Nguyễn Văn An',
        customerEmail: 'customer@nexora.local',
        customerPhone: '0903456789',
        shippingAddress: '123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
        customerNotes: 'Ghi chú riêng tư khách hàng A',
        paymentMethod: 'COD',
        items: [{ productId: product!.id, quantity: 1 }],
      });
    expect(custAOrderRes.status).toBe(201);
    customerAOrderCode = custAOrderRes.body.data.orderCode;
    createdOrderCodes.push(customerAOrderCode);

    const guestOrderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Khách Vãng Lai Test',
        customerEmail: guestEmail,
        customerPhone: guestPhone,
        shippingAddress: '456 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
        customerNotes: 'Gọi trước khi giao hàng',
        paymentMethod: 'COD',
        items: [{ productId: product!.id, quantity: 1 }],
      });
    expect(guestOrderRes.status).toBe(201);
    guestOrderCode = guestOrderRes.body.data.orderCode;
    createdOrderCodes.push(guestOrderCode);
  });

  afterAll(async () => {
    try {
      if (createdOrderCodes.length > 0) {
        const orders = await prisma.order.findMany({
          where: { orderCode: { in: createdOrderCodes } },
          include: { items: true },
        });
        for (const order of orders) {
          for (const item of order.items) {
            if (item.productId) {
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } },
              });
            }
          }
          await prisma.inventoryLog.deleteMany({ where: { referenceId: order.orderCode } });
          await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
          await prisma.order.delete({ where: { id: order.id } });
        }
      }
      if (createdUserIds.length > 0) {
        await prisma.cart.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // OBJECTIVE A: ADMIN RBAC PRIVILEGE ESCALATION TESTS
  // =========================================================================
  describe('Objective A — Admin RBAC & User Management Hardening', () => {
    it('RBAC-A1: Unauthenticated requests to role/toggle endpoints return 401', async () => {
      const r1 = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/role`)
        .send({ role: 'ADMIN' });
      expect(r1.status).toBe(401);
      expect(r1.body.error.code).toBe('UNAUTHORIZED');

      const r2 = await request(app).patch(`/api/v1/admin/users/${disposableUserId}/toggle`);
      expect(r2.status).toBe(401);
      expect(r2.body.error.code).toBe('UNAUTHORIZED');
    });

    it('RBAC-A2: CUSTOMER receives 403 on role change and user toggle', async () => {
      const r1 = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/role`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ role: 'ADMIN' });
      expect(r1.status).toBe(403);
      expect(r1.body.error.code).toBe('FORBIDDEN');

      const r2 = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/toggle`)
        .set('Authorization', `Bearer ${customerAToken}`);
      expect(r2.status).toBe(403);
      expect(r2.body.error.code).toBe('FORBIDDEN');
    });

    it('RBAC-A3: STAFF receives 403 when attempting to promote self or another user to ADMIN', async () => {
      const selfEscalate = await request(app)
        .patch(`/api/v1/admin/users/${staffUserId}/role`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'ADMIN' });
      expect(selfEscalate.status).toBe(403);
      expect(selfEscalate.body.error.code).toBe('FORBIDDEN');

      const otherEscalate = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/role`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'ADMIN' });
      expect(otherEscalate.status).toBe(403);
      expect(otherEscalate.body.error.code).toBe('FORBIDDEN');

      // Verify DB was NOT modified
      const dbStaff = await prisma.user.findUniqueOrThrow({ where: { id: staffUserId } });
      expect(dbStaff.role).toBe('STAFF');
    });

    it('RBAC-A4: STAFF receives 403 when attempting to demote or lock an ADMIN or toggle user status', async () => {
      const demoteAdmin = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'CUSTOMER' });
      expect(demoteAdmin.status).toBe(403);

      const lockAdmin = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(lockAdmin.status).toBe(403);

      const lockCustomer = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(lockCustomer.status).toBe(403);
    });

    it('RBAC-A5: STAFF retains legitimate operational permissions (dashboard, orders, users read)', async () => {
      const dash = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(dash.status).toBe(200);

      const orders = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(orders.status).toBe(200);

      const users = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(users.status).toBe(200);
    });

    it('RBAC-A6: Protected ADMIN accounts cannot be modified or locked even by another ADMIN', async () => {
      // Cannot change own role
      const selfRole = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'CUSTOMER' });
      expect(selfRole.status).toBe(403);

      // Cannot modify super admin id=1
      const superRole = await request(app)
        .patch('/api/v1/admin/users/1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'CUSTOMER' });
      expect(superRole.status).toBe(403);

      const superToggle = await request(app)
        .patch('/api/v1/admin/users/1/toggle')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(superToggle.status).toBe(403);
    });

    it('RBAC-A7: ADMIN can perform authorized role change & status toggle on non-privileged user', async () => {
      const promoteRes = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'STAFF' });
      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.data.role).toBe('STAFF');

      const toggleOff = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(toggleOff.status).toBe(200);
      expect(toggleOff.body.data.status).toBe('INACTIVE');

      // Restore role and status
      const restoreRole = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'CUSTOMER' });
      expect(restoreRole.status).toBe(200);
      expect(restoreRole.body.data.role).toBe('CUSTOMER');

      const toggleOn = await request(app)
        .patch(`/api/v1/admin/users/${disposableUserId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(toggleOn.status).toBe(200);
      expect(toggleOn.body.data.status).toBe('ACTIVE');
    });
  });

  // =========================================================================
  // OBJECTIVE B: ORDER DETAIL IDOR & GUEST LOOKUP POLICY TESTS
  // =========================================================================
  describe('Objective B — Order Detail IDOR Protection & Anti-Enumeration', () => {
    it('IDOR-B1: Unauthenticated request without verification returns 401 for BOTH existing and non-existent orders', async () => {
      const resExisting = await request(app).get(`/api/v1/orders/detail/${customerAOrderCode}`);
      const resMissing = await request(app).get('/api/v1/orders/detail/NX-000000-9999');

      expect(resExisting.status).toBe(401);
      expect(resMissing.status).toBe(401);
      expect(resExisting.body.error.code).toBe(resMissing.body.error.code);
      expect(resExisting.body.error.message).toBe(resMissing.body.error.message);
    });

    it('IDOR-B2: Order owner (Customer A) can access own order with full details', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/detail/${customerAOrderCode}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toBe(customerAOrderCode);
      expect(res.body.data.customerEmail).toBe('customer@nexora.local');
      expect(res.body.data.customerPhone).toBe('0903456789');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('IDOR-B3: Different customer (Customer B) CANNOT access Customer A order (identical 404 to non-existent order)', async () => {
      const resOther = await request(app)
        .get(`/api/v1/orders/detail/${customerAOrderCode}`)
        .set('Authorization', `Bearer ${customerBToken}`);
      const resNonExistent = await request(app)
        .get('/api/v1/orders/detail/NX-000000-8888')
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(resOther.status).toBe(404);
      expect(resNonExistent.status).toBe(404);
      expect(resOther.body.error.code).toBe('ORDER_NOT_FOUND');
      expect(resOther.body.error.message).toBe(resNonExistent.body.error.message);
      expect(customerBId).not.toBe(customerAId);
    });

    it('IDOR-B4: ADMIN and STAFF can access customer orders via explicit RBAC', async () => {
      const resAdmin = await request(app)
        .get(`/api/v1/orders/detail/${customerAOrderCode}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.orderCode).toBe(customerAOrderCode);

      const resStaff = await request(app)
        .get(`/api/v1/orders/detail/${customerAOrderCode}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(resStaff.status).toBe(200);
      expect(resStaff.body.data.orderCode).toBe(customerAOrderCode);
    });

    it('IDOR-B5: Guest lookup with valid phone/email succeeds for guest order AND minimizes PII exposure', async () => {
      const resByPhone = await request(app).get(
        `/api/v1/orders/detail/${guestOrderCode}?phone=${encodeURIComponent(guestPhone)}`,
      );
      expect(resByPhone.status).toBe(200);
      expect(resByPhone.body.data.orderCode).toBe(guestOrderCode);
      // Verify PII is masked/minimized for unauthenticated response
      expect(resByPhone.body.data.customerPhone).toContain('****');
      expect(resByPhone.body.data.customerPhone).not.toBe(guestPhone);
      expect(resByPhone.body.data.customerEmail).toContain('***@');
      expect(resByPhone.body.data.customerEmail).not.toBe(guestEmail);
      expect(resByPhone.body.data.shippingAddress).toContain('***');
      expect(resByPhone.body.data.customerNotes).toBeNull();

      const resByEmail = await request(app).get(
        `/api/v1/orders/detail/${guestOrderCode}?email=${encodeURIComponent(guestEmail)}`,
      );
      expect(resByEmail.status).toBe(200);
      expect(resByEmail.body.data.orderCode).toBe(guestOrderCode);
    });

    it('IDOR-B6: Guest lookup with invalid verification OR targeting registered user order returns uniform 404', async () => {
      const wrongPhone = await request(app).get(
        `/api/v1/orders/detail/${guestOrderCode}?phone=0900000000`,
      );
      const nonExistent = await request(app).get(
        '/api/v1/orders/detail/NX-000000-7777?phone=0900000000',
      );
      const registeredOrderAsGuest = await request(app).get(
        `/api/v1/orders/detail/${customerAOrderCode}?phone=0903456789`,
      );

      expect(wrongPhone.status).toBe(404);
      expect(nonExistent.status).toBe(404);
      expect(registeredOrderAsGuest.status).toBe(404);
      expect(wrongPhone.body.error.message).toBe(nonExistent.body.error.message);
      expect(registeredOrderAsGuest.body.error.message).toBe(nonExistent.body.error.message);
    });
  });

  // =========================================================================
  // OBJECTIVE D: API RATE LIMITING & SAFE PROXY TRUST TESTS
  // =========================================================================
  describe('Objective D — API Rate Limiting & Proxy Trust Safety', () => {
    it('RATE-D1: Auth login returns consistent HTTP 429 JSON envelope when limit is exceeded', async () => {
      const limitedApp = createApp({
        rateLimitOverrides: {
          authLoginRegister: { limit: 3, windowMs: 60_000 },
        },
      });

      for (let i = 0; i < 3; i++) {
        const res = await request(limitedApp)
          .post('/api/v1/auth/login')
          .send({ email: 'nonexistent@nexora.local', password: 'wrongpassword' });
        expect(res.status).toBe(401);
      }

      const blocked = await request(limitedApp)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@nexora.local', password: 'wrongpassword' });
      expect(blocked.status).toBe(429);
      expect(blocked.body.success).toBe(false);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(blocked.headers['ratelimit-policy']).toBeDefined();
    });

    it('RATE-D2: Password reset enforces stricter production default (5 req / 15m) and blocks 6th request with 429', async () => {
      const prodDefaultApp = createApp();
      for (let i = 0; i < 5; i++) {
        const res = await request(prodDefaultApp)
          .post('/api/v1/auth/forgot-password')
          .send({ email: `no-account-${i}@nexora.local` });
        expect(res.status).toBe(200);
      }

      const sixth = await request(prodDefaultApp)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'no-account-6@nexora.local' });
      expect(sixth.status).toBe(429);
      expect(sixth.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('RATE-D3: AI endpoints enforce rate limiting and return 429', async () => {
      const aiApp = createApp({
        rateLimitOverrides: {
          ai: { limit: 2, windowMs: 60_000 },
        },
      });

      const r1 = await request(aiApp)
        .post('/api/v1/ai/chatbot/query')
        .send({ message: 'chính sách bảo hành' });
      const r2 = await request(aiApp)
        .post('/api/v1/ai/chatbot/query')
        .send({ message: 'chính sách bảo hành' });
      const r3 = await request(aiApp)
        .post('/api/v1/ai/chatbot/query')
        .send({ message: 'chính sách bảo hành' });

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(429);
      expect(r3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('RATE-D4: Order lookup endpoints enforce rate limiting and return 429', async () => {
      const lookupApp = createApp({
        rateLimitOverrides: {
          orderLookup: { limit: 2, windowMs: 60_000 },
        },
      });

      const r1 = await request(lookupApp).get('/api/v1/orders/track?code=NX-000&phone=0900000000');
      const r2 = await request(lookupApp).get('/api/v1/orders/track?code=NX-000&phone=0900000000');
      const r3 = await request(lookupApp).get('/api/v1/orders/track?code=NX-000&phone=0900000000');

      expect(r1.status).toBe(404);
      expect(r2.status).toBe(404);
      expect(r3.status).toBe(429);
      expect(r3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('RATE-D5: Arbitrary X-Forwarded-For spoofing does NOT bypass rate limits under safe default TRUST_PROXY=false', async () => {
      const spoofApp = createApp({
        rateLimitOverrides: {
          authLoginRegister: { limit: 2, windowMs: 60_000 },
        },
      });

      const r1 = await request(spoofApp)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send({ email: 'nobody@nexora.local', password: 'wrongpassword' });
      const r2 = await request(spoofApp)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '2.2.2.2')
        .send({ email: 'nobody@nexora.local', password: 'wrongpassword' });
      const r3 = await request(spoofApp)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '3.3.3.3')
        .send({ email: 'nobody@nexora.local', password: 'wrongpassword' });

      expect(r1.status).toBe(401);
      expect(r2.status).toBe(401);
      expect(r3.status).toBe(429);
      expect(r3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
