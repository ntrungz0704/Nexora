import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Phase B Milestone M5: Returns Workflow & Admin CRUD Backend Integration Test Suite', () => {
  let app: Express;

  // Users & Tokens
  let customer1Token: string;
  let customer1Id: number;

  let customer2Token: string;
  let customer2Id: number;

  let staffToken: string;
  let staffId: number;

  let adminToken: string;
  let adminId: number;

  // Categories
  let emptyCatId: number;
  let parentCatId: number;
  let childCatId: number;
  let catWithProdId: number;

  // Products
  let prodAId: number;
  let prodBId: number;
  let prodCId: number;

  // Orders
  let order1DeliveredId: bigint;
  let order1ItemAId: bigint;
  let order1ItemBId: bigint;

  let order2OldDeliveredId: bigint;
  let order2ItemAId: bigint;

  let order3PendingId: bigint;
  let order3ItemAId: bigint;

  let order4Cust2DeliveredId: bigint;
  let order4ItemCId: bigint;

  // Tracking for clean teardown
  const createdReturnIds: number[] = [];
  const createdOrderIds: bigint[] = [];
  const createdProductIds: number[] = [];
  const createdCategoryIds: number[] = [];
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    app = createApp();
    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create Users
    const cust1 = await prisma.user.create({
      data: {
        email: `ret-cust1-${ts}@nexora.local`,
        fullName: 'Nguyễn Văn Đổi Trả 1',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customer1Id = cust1.id;
    createdUserIds.push(cust1.id);
    customer1Token = jwt.sign(
      { sub: cust1.id, email: cust1.email, role: cust1.role },
      env.AUTH_SECRET,
      {
        expiresIn: '1h',
      },
    );

    const cust2 = await prisma.user.create({
      data: {
        email: `ret-cust2-${ts}@nexora.local`,
        fullName: 'Trần Thị Đổi Trả 2',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customer2Id = cust2.id;
    createdUserIds.push(cust2.id);
    customer2Token = jwt.sign(
      { sub: cust2.id, email: cust2.email, role: cust2.role },
      env.AUTH_SECRET,
      {
        expiresIn: '1h',
      },
    );

    const staffUser = await prisma.user.create({
      data: {
        email: `ret-staff-${ts}@nexora.local`,
        fullName: 'Nhân Viên Hỗ Trợ',
        passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });
    staffId = staffUser.id;
    createdUserIds.push(staffUser.id);
    staffToken = jwt.sign(
      { sub: staffUser.id, email: staffUser.email, role: staffUser.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    const adminUser = await prisma.user.create({
      data: {
        email: `ret-admin-${ts}@nexora.local`,
        fullName: 'Quản Trị Viên Nexora',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminId = adminUser.id;
    createdUserIds.push(adminUser.id);
    adminToken = jwt.sign(
      { sub: adminUser.id, email: adminUser.email, role: adminUser.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    // 2. Create Categories
    const emptyCat = await prisma.category.create({
      data: {
        name: `Empty Cat ${ts}`,
        slug: `empty-cat-${ts}`,
      },
    });
    emptyCatId = emptyCat.id;
    createdCategoryIds.push(emptyCat.id);

    const parentCat = await prisma.category.create({
      data: {
        name: `Parent Cat ${ts}`,
        slug: `parent-cat-${ts}`,
      },
    });
    parentCatId = parentCat.id;
    createdCategoryIds.push(parentCat.id);

    const childCat = await prisma.category.create({
      data: {
        parentId: parentCat.id,
        name: `Child Cat ${ts}`,
        slug: `child-cat-${ts}`,
      },
    });
    childCatId = childCat.id;
    createdCategoryIds.push(childCat.id);

    const catWithProd = await prisma.category.create({
      data: {
        name: `Cat With Prod ${ts}`,
        slug: `cat-with-prod-${ts}`,
      },
    });
    catWithProdId = catWithProd.id;
    createdCategoryIds.push(catWithProd.id);

    // 3. Create Products
    const prodA = await prisma.product.create({
      data: {
        categoryId: catWithProdId,
        name: `RAM Corsair Vengeance 32GB ${ts}`,
        slug: `ram-corsair-32gb-${ts}`,
        sku: `RAM-32GB-${ts}`,
        price: 2500000,
        stockQuantity: 50,
      },
    });
    prodAId = prodA.id;
    createdProductIds.push(prodA.id);

    const prodB = await prisma.product.create({
      data: {
        categoryId: catWithProdId,
        name: `Chuột Logitech G Pro X ${ts}`,
        slug: `mouse-logitech-gpro-${ts}`,
        sku: `MOUSE-GPRO-${ts}`,
        price: 3200000,
        stockQuantity: 20,
      },
    });
    prodBId = prodB.id;
    createdProductIds.push(prodB.id);

    const prodC = await prisma.product.create({
      data: {
        categoryId: catWithProdId,
        name: `Bàn Phím Cơ Custom ${ts}`,
        slug: `keyboard-custom-${ts}`,
        sku: `KB-CUSTOM-${ts}`,
        price: 4500000,
        stockQuantity: 10,
      },
    });
    prodCId = prodC.id;
    createdProductIds.push(prodC.id);

    // 4. Create Orders
    // Order 1: Delivered 2 days ago (eligible for return within 7 days)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const order1 = await prisma.order.create({
      data: {
        orderCode: `ORD-RET1-${ts}`,
        userId: customer1Id,
        customerName: 'Nguyễn Văn Đổi Trả 1',
        customerEmail: cust1.email,
        customerPhone: '0901112222',
        shippingAddress: '123 Lê Lợi, Q1, TP.HCM',
        subtotal: 22100000,
        totalAmount: 22100000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: twoDaysAgo,
        deliveredAt: twoDaysAgo,
      },
    });
    order1DeliveredId = order1.id;
    createdOrderIds.push(order1.id);

    const item1A = await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: prodAId,
        productName: prodA.name,
        productSku: prodA.sku,
        unitPrice: 2500000,
        quantity: 5,
        subtotal: 12500000,
      },
    });
    order1ItemAId = item1A.id;

    const item1B = await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: prodBId,
        productName: prodB.name,
        productSku: prodB.sku,
        unitPrice: 3200000,
        quantity: 3,
        subtotal: 9600000,
      },
    });
    order1ItemBId = item1B.id;

    // Order 2: Delivered 10 days ago (expired return window > 7 days)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const order2 = await prisma.order.create({
      data: {
        orderCode: `ORD-RET2-OLD-${ts}`,
        userId: customer1Id,
        customerName: 'Nguyễn Văn Đổi Trả 1',
        customerEmail: cust1.email,
        customerPhone: '0901112222',
        shippingAddress: '123 Lê Lợi, Q1, TP.HCM',
        subtotal: 5000000,
        totalAmount: 5000000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: tenDaysAgo,
        deliveredAt: tenDaysAgo,
      },
    });
    order2OldDeliveredId = order2.id;
    createdOrderIds.push(order2.id);

    const item2A = await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: prodAId,
        productName: prodA.name,
        productSku: prodA.sku,
        unitPrice: 2500000,
        quantity: 2,
        subtotal: 5000000,
      },
    });
    order2ItemAId = item2A.id;

    // Order 3: PENDING (not delivered)
    const order3 = await prisma.order.create({
      data: {
        orderCode: `ORD-RET3-PEND-${ts}`,
        userId: customer1Id,
        customerName: 'Nguyễn Văn Đổi Trả 1',
        customerEmail: cust1.email,
        customerPhone: '0901112222',
        shippingAddress: '123 Lê Lợi, Q1, TP.HCM',
        subtotal: 2500000,
        totalAmount: 2500000,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });
    order3PendingId = order3.id;
    createdOrderIds.push(order3.id);

    const item3A = await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        productId: prodAId,
        productName: prodA.name,
        productSku: prodA.sku,
        unitPrice: 2500000,
        quantity: 1,
        subtotal: 2500000,
      },
    });
    order3ItemAId = item3A.id;

    // Order 4: Customer 2's order, delivered yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const order4 = await prisma.order.create({
      data: {
        orderCode: `ORD-RET4-CUST2-${ts}`,
        userId: customer2Id,
        customerName: 'Trần Thị Đổi Trả 2',
        customerEmail: cust2.email,
        customerPhone: '0903334444',
        shippingAddress: '456 Hai Bà Trưng, Q3, TP.HCM',
        subtotal: 18000000,
        totalAmount: 18000000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: yesterday,
        deliveredAt: yesterday,
      },
    });
    order4Cust2DeliveredId = order4.id;
    createdOrderIds.push(order4.id);

    const item4C = await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        productId: prodCId,
        productName: prodC.name,
        productSku: prodC.sku,
        unitPrice: 4500000,
        quantity: 4,
        subtotal: 18000000,
      },
    });
    order4ItemCId = item4C.id;
  });

  afterAll(async () => {
    // Clean up created entities
    try {
      if (createdReturnIds.length > 0) {
        await prisma.returnAuditLog.deleteMany({
          where: { returnRequestId: { in: createdReturnIds } },
        });
        await prisma.returnItem.deleteMany({
          where: { returnRequestId: { in: createdReturnIds } },
        });
        await prisma.returnRequest.deleteMany({ where: { id: { in: createdReturnIds } } });
      }
      if (createdOrderIds.length > 0) {
        await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
        await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
      }
      if (createdProductIds.length > 0) {
        await prisma.inventoryLog.deleteMany({ where: { productId: { in: createdProductIds } } });
        await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
      }
      if (createdCategoryIds.length > 0) {
        // Delete child before parent
        await prisma.category.deleteMany({ where: { id: childCatId } });
        await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } catch (err) {
      console.error('Teardown error in M5 test suite:', err);
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // SECTION 1: Returns API — Customer Request Creation & Validation (Task A2)
  // =========================================================================
  describe('Customer Return Request Creation & Validations', () => {
    it('RET-01: Should create a valid return request for DELIVERED order within 7 days', async () => {
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order1DeliveredId.toString(),
          reason: 'Sản phẩm RAM bị lỗi sập nguồn liên tục khi bật XMP',
          notes: 'Đã test trên mainboard Z790 và B760 đều bị xanh màn hình khi bật profile XMP.',
          items: [
            {
              orderItemId: order1ItemAId.toString(),
              quantity: 2,
              resolution: 'REFUND',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.returnCode).toMatch(/^RET-\d{8}-[A-Z0-9]+$/);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(2);

      const returnId = res.body.data.id;
      createdReturnIds.push(returnId);

      // Verify directly in MySQL via Prisma
      const dbReturn = await prisma.returnRequest.findUnique({
        where: { id: returnId },
        include: { items: true, auditLogs: true },
      });
      expect(dbReturn).not.toBeNull();
      expect(dbReturn?.userId).toBe(customer1Id);
      expect(dbReturn?.status).toBe('PENDING');
      expect(dbReturn?.resolvedAt).toBeNull();
      expect(dbReturn?.items).toHaveLength(1);
      expect(dbReturn?.items[0].quantity).toBe(2);
      expect(dbReturn?.items[0].isResellable).toBe(false);

      // Verify audit log creation
      expect(dbReturn?.auditLogs).toHaveLength(1);
      expect(dbReturn?.auditLogs[0].fromStatus).toBe('PENDING');
      expect(dbReturn?.auditLogs[0].toStatus).toBe('PENDING');
      expect(dbReturn?.auditLogs[0].actorId).toBe(customer1Id);
      expect(dbReturn?.auditLogs[0].actorRole).toBe('CUSTOMER');

      // Verify customer notification created in MySQL
      const notif = await prisma.notification.findFirst({
        where: { userId: customer1Id, type: 'RETURN' },
        orderBy: { createdAt: 'desc' },
      });
      expect(notif).not.toBeNull();
      expect(notif?.title).toBe('Yêu cầu đổi/trả đã được tiếp nhận');
    });

    it('RET-02: Should reject return request when order does not belong to user (Anti-IDOR)', async () => {
      // Customer 1 tries to request return on Customer 2's Order 4
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order4Cust2DeliveredId.toString(),
          reason: 'Cố tình đổi trả đơn hàng của người khác',
          items: [{ orderItemId: order4ItemCId.toString(), quantity: 1 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('RET-03: Should reject return request if order is NOT DELIVERED', async () => {
      // Order 3 is in PENDING status
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order3PendingId.toString(),
          reason: 'Muốn đổi trả khi đơn hàng chưa giao',
          items: [{ orderItemId: order3ItemAId.toString(), quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ORDER_NOT_DELIVERED');
    });

    it('RET-04: Should reject return request when exceeding 7-day window from deliveredAt', async () => {
      // Order 2 was delivered 10 days ago
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order2OldDeliveredId.toString(),
          reason: 'Đổi trả sau 10 ngày nhận hàng',
          items: [{ orderItemId: order2ItemAId.toString(), quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RETURN_WINDOW_EXPIRED');
    });

    it('RET-05: Should reject return request if item does not belong to the order', async () => {
      // Submitting item4C (from Order 4) on Order 1
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order1DeliveredId.toString(),
          reason: 'Gửi orderItemId của đơn hàng khác',
          items: [{ orderItemId: order4ItemCId.toString(), quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_RETURN_ITEM');
    });

    it('RET-06: Should reject return request if requested quantity exceeds eligible remaining quantity', async () => {
      // On Order 1, itemA has total qty = 5. In RET-01, 2 were already requested.
      // Remaining eligible is 3. Attempting to request 4 should be rejected.
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order1DeliveredId.toString(),
          reason: 'Yêu cầu vượt quá số lượng còn đủ điều kiện',
          items: [{ orderItemId: order1ItemAId.toString(), quantity: 4 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RETURN_QUANTITY_EXCEEDED');
    });

    it('RET-07: Should allow another return request for remaining eligible quantity on the same order', async () => {
      // Remaining for Item A is 3. We request 2 now.
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order1DeliveredId.toString(),
          reason: 'Đổi trả tiếp 2 thanh RAM còn lại do không tương thích',
          items: [{ orderItemId: order1ItemAId.toString(), quantity: 2, resolution: 'REPLACE' }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdReturnIds.push(res.body.data.id);
    });
  });

  // =========================================================================
  // SECTION 2: Customer Returns Views & Anti-IDOR Protection (Task A2)
  // =========================================================================
  describe('Customer Returns Listing & Detail with Anti-IDOR', () => {
    it('RET-08: Customer 1 should list own return requests', async () => {
      const res = await request(app)
        .get('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.returns)).toBe(true);
      expect(res.body.returns.length).toBeGreaterThanOrEqual(2);
      res.body.returns.forEach((r: { userId: number }) => {
        expect(r.userId).toBe(customer1Id);
      });
    });

    it('RET-09: Customer 1 should view detail of own return request', async () => {
      const returnId = createdReturnIds[0];
      const res = await request(app)
        .get(`/api/v1/profile/returns/${returnId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(returnId);
      expect(res.body.data.userId).toBe(customer1Id);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.auditLogs).toBeDefined();
    });

    it('RET-10: Customer 2 must be blocked from viewing Customer 1 return detail (Anti-IDOR)', async () => {
      const returnId = createdReturnIds[0];
      const res = await request(app)
        .get(`/api/v1/profile/returns/${returnId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('RET-11: Unauthenticated request to /profile/returns should return 401', async () => {
      const res = await request(app).get('/api/v1/profile/returns');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // SECTION 3: Admin & Staff Return State Machine (Task A3, A4)
  // =========================================================================
  describe('Admin/Staff Return Management & 4-Step State Machine', () => {
    let testReturnId: number;

    beforeAll(async () => {
      // Create a fresh return for testing the full state machine
      const res = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order1DeliveredId.toString(),
          reason: 'Chuột Logitech bị lỗi click đúp',
          items: [{ orderItemId: order1ItemBId.toString(), quantity: 1, resolution: 'REFUND' }],
        });
      testReturnId = res.body.data.id;
      createdReturnIds.push(testReturnId);
    });

    it('RET-12: Customer should be blocked from Admin returns endpoints (403)', async () => {
      const res1 = await request(app)
        .get('/api/v1/admin/returns')
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .patch(`/api/v1/admin/returns/${testReturnId}/status`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ status: 'APPROVED' });
      expect(res2.status).toBe(403);
    });

    it('RET-13: Staff and Admin can view all returns', async () => {
      const staffRes = await request(app)
        .get('/api/v1/admin/returns')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(200);
      expect(staffRes.body.success).toBe(true);
      expect(staffRes.body.returns.length).toBeGreaterThanOrEqual(1);

      const adminRes = await request(app)
        .get(`/api/v1/admin/returns/${testReturnId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.id).toBe(testReturnId);
    });

    it('RET-14: Transition PENDING -> APPROVED should succeed (Staff)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/returns/${testReturnId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'APPROVED',
          notes: 'Đã xác nhận tình trạng qua video của khách',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.handledBy).toBe(staffId);

      // Verify in DB
      const dbReturn = await prisma.returnRequest.findUnique({
        where: { id: testReturnId },
        include: { auditLogs: true },
      });
      expect(dbReturn?.status).toBe('APPROVED');
      expect(dbReturn?.handledBy).toBe(staffId);
      const latestLog = dbReturn?.auditLogs[dbReturn.auditLogs.length - 1];
      expect(latestLog?.fromStatus).toBe('PENDING');
      expect(latestLog?.toStatus).toBe('APPROVED');
      expect(latestLog?.actorId).toBe(staffId);
      expect(latestLog?.actorRole).toBe('STAFF');
    });

    it('RET-15: Invalid skip transition APPROVED -> COMPLETED should be rejected (400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/returns/${testReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COMPLETED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('RET-16: Transition APPROVED -> PROCESSING should succeed (Admin)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/returns/${testReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PROCESSING',
          notes: 'Đã nhận được hàng tại trung tâm bảo hành, đang kiểm tra kỹ thuật',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PROCESSING');

      const dbReturn = await prisma.returnRequest.findUnique({
        where: { id: testReturnId },
      });
      expect(dbReturn?.status).toBe('PROCESSING');
    });

    it('RET-17: Transition PROCESSING -> REJECTED requires rejectionReason (400 if missing)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/returns/${testReturnId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'REJECTED',
          // rejectionReason omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REJECTION_REASON_REQUIRED');
    });

    it('RET-18: Rejecting a return request with rejectionReason sets resolvedAt and logs audit trail', async () => {
      // Create a separate return to reject
      const createRes = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          orderId: order4Cust2DeliveredId.toString(),
          reason: 'Bàn phím không thích màu sắc',
          items: [{ orderItemId: order4ItemCId.toString(), quantity: 1 }],
        });
      const rejectReturnId = createRes.body.data.id;
      createdReturnIds.push(rejectReturnId);

      const res = await request(app)
        .patch(`/api/v1/admin/returns/${rejectReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'REJECTED',
          rejectionReason:
            'Lý do đổi trả không thuộc diện bảo hành (chỉ đổi trả phần cứng lỗi kỹ thuật).',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toContain('không thuộc diện bảo hành');
      expect(res.body.data.resolvedAt).not.toBeNull();

      // Ensure no further transition allowed from REJECTED
      const tryTransition = await request(app)
        .patch(`/api/v1/admin/returns/${rejectReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      expect(tryTransition.status).toBe(400);
      expect(tryTransition.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // =========================================================================
  // SECTION 4: Task B — Inventory Integrity & Restoration Invariants
  // =========================================================================
  describe('Inventory Integrity & Restoration (Task B)', () => {
    let resellableReturnId: number;
    let nonResellableReturnId: number;
    let returnItemResellableId: number;
    let returnItemNonResellableId: number;

    beforeAll(async () => {
      // 1. Create return request for resellable testing
      const res1 = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          orderId: order4Cust2DeliveredId.toString(),
          reason: 'Khách hàng đổi ý mua bản không dây, nguyên seal chưa mở hộp',
          items: [{ orderItemId: order4ItemCId.toString(), quantity: 2, resolution: 'REFUND' }],
        });
      resellableReturnId = res1.body.data.id;
      returnItemResellableId = res1.body.data.items[0].id;
      createdReturnIds.push(resellableReturnId);

      // Advance to PROCESSING
      await request(app)
        .patch(`/api/v1/admin/returns/${resellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      await request(app)
        .patch(`/api/v1/admin/returns/${resellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      // 2. Create return request for damaged/non-resellable testing
      const res2 = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          orderId: order4Cust2DeliveredId.toString(),
          reason: 'Bàn phím bị đổ nước gãy switch',
          items: [{ orderItemId: order4ItemCId.toString(), quantity: 1, resolution: 'REFUND' }],
        });
      nonResellableReturnId = res2.body.data.id;
      returnItemNonResellableId = res2.body.data.items[0].id;
      createdReturnIds.push(nonResellableReturnId);

      // Advance to PROCESSING
      await request(app)
        .patch(`/api/v1/admin/returns/${nonResellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      await request(app)
        .patch(`/api/v1/admin/returns/${nonResellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });
    });

    it('INV-01: COMPLETED return with isResellable=true restores stock and creates RETURN InventoryLog', async () => {
      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      const initialStock = prodBefore.stockQuantity;

      const res = await request(app)
        .patch(`/api/v1/admin/returns/${resellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COMPLETED',
          items: [{ returnItemId: returnItemResellableId, isResellable: true }],
          notes: 'Sản phẩm còn nguyên seal, đã nhập lại vào kho hàng bán',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.resolvedAt).not.toBeNull();

      // Verify Stock incremented by 2
      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      expect(prodAfter.stockQuantity).toBe(initialStock + 2);

      // Verify InventoryLog in MySQL
      const invLog = await prisma.inventoryLog.findFirst({
        where: {
          productId: prodCId,
          changeType: 'RETURN',
          referenceType: 'RETURN_REQUEST',
          referenceId: res.body.data.returnCode,
        },
      });
      expect(invLog).not.toBeNull();
      expect(invLog?.quantity).toBe(2);
      expect(invLog?.balanceBefore).toBe(initialStock);
      expect(invLog?.balanceAfter).toBe(initialStock + 2);
      expect(invLog?.actorId).toBe(adminId);
    });

    it('INV-02: COMPLETED return with isResellable=false does NOT restore stock and creates NO log', async () => {
      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      const stockBefore = prodBefore.stockQuantity;

      const res = await request(app)
        .patch(`/api/v1/admin/returns/${nonResellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COMPLETED',
          items: [{ returnItemId: returnItemNonResellableId, isResellable: false }],
          notes: 'Sản phẩm hỏng nặng, chuyển tiêu hủy, không hoàn kho',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');

      // Verify Stock remains UNCHANGED
      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      expect(prodAfter.stockQuantity).toBe(stockBefore);

      // Verify NO new InventoryLog created for this returnCode
      const invLog = await prisma.inventoryLog.findFirst({
        where: {
          productId: prodCId,
          referenceId: res.body.data.returnCode,
        },
      });
      expect(invLog).toBeNull();
    });

    it('INV-03: Retrying COMPLETED status on already COMPLETED return does NOT restore stock twice (Idempotency)', async () => {
      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      const stockBefore = prodBefore.stockQuantity;

      // Retry request on the already COMPLETED return
      const res = await request(app)
        .patch(`/api/v1/admin/returns/${resellableReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COMPLETED',
          items: [{ returnItemId: returnItemResellableId, isResellable: true }],
        });

      // State machine rejects transition from COMPLETED to COMPLETED
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');

      // Stock must remain unchanged
      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      expect(prodAfter.stockQuantity).toBe(stockBefore);
    });

    it('INV-04: Concurrent requests attempting to complete the same return request prevent double restoration', async () => {
      // Create a fresh return for concurrent completion
      const createRes = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          orderId: order4Cust2DeliveredId.toString(),
          reason: 'Bàn phím dư không dùng',
          items: [{ orderItemId: order4ItemCId.toString(), quantity: 1, resolution: 'REFUND' }],
        });
      const concReturnId = createRes.body.data.id;
      const concReturnItemId = createRes.body.data.items[0].id;
      createdReturnIds.push(concReturnId);

      // Advance to PROCESSING
      await request(app)
        .patch(`/api/v1/admin/returns/${concReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      await request(app)
        .patch(`/api/v1/admin/returns/${concReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      const initialStock = prodBefore.stockQuantity;

      // Fire 2 concurrent completion requests
      const [resA, resB] = await Promise.all([
        request(app)
          .patch(`/api/v1/admin/returns/${concReturnId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'COMPLETED',
            items: [{ returnItemId: concReturnItemId, isResellable: true }],
          }),
        request(app)
          .patch(`/api/v1/admin/returns/${concReturnId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'COMPLETED',
            items: [{ returnItemId: concReturnItemId, isResellable: true }],
          }),
      ]);

      const statuses = [resA.status, resB.status];
      expect(statuses).toContain(200);
      expect(statuses).toContain(400);

      // Verify stock was incremented by exactly 1 (no double restoration)
      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: prodCId } });
      expect(prodAfter.stockQuantity).toBe(initialStock + 1);

      // Exactly 1 RETURN log was created
      const logsCount = await prisma.inventoryLog.count({
        where: {
          productId: prodCId,
          referenceId: createRes.body.data.returnCode,
        },
      });
      expect(logsCount).toBe(1);
    });

    it('INV-05: Transaction rollback preserves database consistency when an error occurs', async () => {
      // Create a fresh return
      const createRes = await request(app)
        .post('/api/v1/profile/returns')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: order1DeliveredId.toString(),
          reason: 'Chuột hỏng cần đổi',
          items: [{ orderItemId: order1ItemBId.toString(), quantity: 1 }],
        });
      const rollbackReturnId = createRes.body.data.id;
      createdReturnIds.push(rollbackReturnId);

      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: prodBId } });
      const initialStock = prodBefore.stockQuantity;

      // Attempt invalid transition directly from PENDING to COMPLETED
      const res = await request(app)
        .patch(`/api/v1/admin/returns/${rollbackReturnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COMPLETED',
        });

      expect(res.status).toBe(400);

      // Verify stock was NOT changed
      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: prodBId } });
      expect(prodAfter.stockQuantity).toBe(initialStock);

      // Verify return status remains PENDING in MySQL
      const returnInDb = await prisma.returnRequest.findUniqueOrThrow({
        where: { id: rollbackReturnId },
      });
      expect(returnInDb.status).toBe('PENDING');
      expect(returnInDb.resolvedAt).toBeNull();
    });
  });

  // =========================================================================
  // SECTION 5: Task C1 — Safe Category Deletion (Safe DELETE & Cascade Guard)
  // =========================================================================
  describe('Safe Category Deletion (Task C1)', () => {
    it('CAT-01: Reject deleting non-existent category with 404', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/categories/999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('CAT-02: Reject deleting category with associated products (400 CATEGORY_HAS_PRODUCTS)', async () => {
      // catWithProd has prodA, prodB, prodC associated
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${catWithProdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CATEGORY_HAS_PRODUCTS');

      // Verify category and products still exist in DB (no cascade deletion)
      const cat = await prisma.category.findUnique({ where: { id: catWithProdId } });
      expect(cat).not.toBeNull();
      const prodsCount = await prisma.product.count({ where: { categoryId: catWithProdId } });
      expect(prodsCount).toBeGreaterThanOrEqual(1);
    });

    it('CAT-03: Reject deleting parent category that has child categories (400 CATEGORY_HAS_CHILDREN)', async () => {
      // parentCat has childCat
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${parentCatId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CATEGORY_HAS_CHILDREN');

      // Verify parent category still exists in MySQL
      const parent = await prisma.category.findUnique({ where: { id: parentCatId } });
      expect(parent).not.toBeNull();
    });

    it('CAT-04: Successfully delete empty category (200) without cascade effects', async () => {
      // emptyCat has 0 products and 0 child categories
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${emptyCatId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deleted from MySQL
      const deletedCat = await prisma.category.findUnique({ where: { id: emptyCatId } });
      expect(deletedCat).toBeNull();
    });

    it('CAT-05: Customer should be blocked from deleting categories (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${childCatId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
    });
  });
});
