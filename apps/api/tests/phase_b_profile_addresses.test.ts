import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Phase B: Profile & Addresses Backend Integration Test Suite', () => {
  let app: Express;
  let customerAToken: string;
  let customerBToken: string;
  let customerAId: number;
  let customerBId: number;

  let addressA1Id: number;
  let addressA2Id: number;
  let notifA1Id: bigint;
  let notifA2Id: bigint;
  let notifB1Id: bigint;

  const createdUserIds: number[] = [];
  const createdAddressIds: number[] = [];
  const createdNotifIds: bigint[] = [];

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        passwordResetConfirm: { limit: 50 },
      },
    });

    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('OldPassword123!', 10);

    // Create Customer A
    const custA = await prisma.user.create({
      data: {
        email: `phaseb-cust-a-${ts}@nexora.local`,
        fullName: 'Nguyễn Văn A',
        phone: '0901111111',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerAId = custA.id;
    createdUserIds.push(custA.id);

    // Create Customer B
    const custB = await prisma.user.create({
      data: {
        email: `phaseb-cust-b-${ts}@nexora.local`,
        fullName: 'Trần Thị B',
        phone: '0902222222',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerBId = custB.id;
    createdUserIds.push(custB.id);

    // Generate valid JWT tokens
    customerAToken = jwt.sign(
      { sub: custA.id, email: custA.email, role: custA.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );
    customerBToken = jwt.sign(
      { sub: custB.id, email: custB.email, role: custB.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    // Pre-populate notifications for Customer A and Customer B
    const nA1 = await prisma.notification.create({
      data: {
        userId: customerAId,
        title: 'Đơn hàng #NX-1001 đã xác nhận',
        message: 'Đơn hàng của bạn đang được đóng gói.',
        type: 'ORDER',
        isRead: false,
      },
    });
    notifA1Id = nA1.id;
    createdNotifIds.push(nA1.id);

    const nA2 = await prisma.notification.create({
      data: {
        userId: customerAId,
        title: 'Ưu đãi thành viên mới',
        message: 'Nhận mã giảm giá 100k cho đơn hàng đầu tiên.',
        type: 'PROMO',
        isRead: false,
      },
    });
    notifA2Id = nA2.id;
    createdNotifIds.push(nA2.id);

    const nB1 = await prisma.notification.create({
      data: {
        userId: customerBId,
        title: 'Thông báo riêng của Customer B',
        message: 'Nội dung riêng tư của Customer B.',
        type: 'SYSTEM',
        isRead: false,
      },
    });
    notifB1Id = nB1.id;
    createdNotifIds.push(nB1.id);
  });

  afterAll(async () => {
    try {
      if (createdAddressIds.length > 0) {
        await prisma.customerAddress.deleteMany({
          where: { id: { in: createdAddressIds } },
        });
      }
      if (createdNotifIds.length > 0) {
        await prisma.notification.deleteMany({
          where: { id: { in: createdNotifIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.customerAddress.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.notification.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // OBJECTIVE 1: AUTHENTICATION ENFORCEMENT & ENVELOPE VERIFICATION
  // =========================================================================
  describe('Objective 1: Authentication Requirement & Error Envelope Enforcement', () => {
    it('AUTH-1: Rejects unauthenticated GET /api/v1/profile with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-2: Rejects unauthenticated PUT /api/v1/profile with 401 UNAUTHORIZED', async () => {
      const res = await request(app).put('/api/v1/profile').send({ fullName: 'Hack Attempt' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-3: Rejects unauthenticated GET /api/v1/profile/addresses with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/profile/addresses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-4: Rejects unauthenticated GET /api/v1/profile/notifications with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/profile/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-5: Rejects unauthenticated PUT /api/v1/profile/password with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .put('/api/v1/profile/password')
        .send({ currentPassword: '1', newPassword: '2', confirmPassword: '2' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // =========================================================================
  // OBJECTIVE 2: PROFILE INFORMATION MANAGEMENT & VALIDATION
  // =========================================================================
  describe('Objective 2: Customer Profile Updates & Validation', () => {
    it('PROF-B1: Customer fetches own profile via GET /api/v1/profile', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerAId);
      expect(res.body.data.fullName).toBe('Nguyễn Văn A');
      expect(res.body.data.email).toContain('phaseb-cust-a');
      expect(res.body.data.role).toBe('CUSTOMER');
    });

    it('PROF-B2: Customer successfully updates fullName and phone, verified in MySQL', async () => {
      const updatePayload = {
        fullName: 'Nguyễn Văn An Cập Nhật',
        phone: '0909999888',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200',
      };

      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Nguyễn Văn An Cập Nhật');
      expect(res.body.data.phone).toBe('0909999888');

      // Verify directly in MySQL database
      const dbUser = await prisma.user.findUnique({
        where: { id: customerAId },
      });
      expect(dbUser?.fullName).toBe('Nguyễn Văn An Cập Nhật');
      expect(dbUser?.phone).toBe('0909999888');
      expect(dbUser?.avatarUrl).toBe(updatePayload.avatarUrl);
    });

    it('PROF-B3: Rejects update with invalid phone format (not 10 digits starting with 0)', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ fullName: 'Nguyễn Văn An', phone: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      // Verify phone in MySQL was NOT corrupted
      const dbUser = await prisma.user.findUnique({
        where: { id: customerAId },
      });
      expect(dbUser?.phone).toBe('0909999888');
    });

    it('PROF-B4: Rejects update with invalid avatarUrl (not a valid URL)', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ fullName: 'Nguyễn Văn An', avatarUrl: 'not-a-valid-url' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // OBJECTIVE 3: CUSTOMER ADDRESS BOOK CRUD & ANTI-IDOR (customer_addresses)
  // =========================================================================
  describe('Objective 3: Customer Address Book Management (customer_addresses)', () => {
    it('ADDR-B1: Creates first address, automatically sets isDefault = true in MySQL', async () => {
      const payload = {
        recipientName: 'Nguyễn Văn A',
        phone: '0901234567',
        streetAddress: 'Số 123 Đường Nguyễn Huệ',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
      };

      const res = await request(app)
        .post('/api/v1/profile/addresses')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipientName).toBe(payload.recipientName);
      expect(res.body.data.isDefault).toBe(true); // First address is auto default

      addressA1Id = res.body.data.id;
      createdAddressIds.push(addressA1Id);

      // Verify in MySQL
      const dbAddr = await prisma.customerAddress.findUnique({
        where: { id: addressA1Id },
      });
      expect(dbAddr?.recipientName).toBe(payload.recipientName);
      expect(dbAddr?.isDefault).toBe(true);
      expect(dbAddr?.userId).toBe(customerAId);
    });

    it('ADDR-B2: Creates second address with isDefault = true, toggles first address to false', async () => {
      const payload = {
        recipientName: 'Nguyễn Văn A - Công Ty',
        phone: '0909888777',
        streetAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ',
        ward: 'Phường 22',
        district: 'Quận Bình Thạnh',
        province: 'TP. Hồ Chí Minh',
        isDefault: true,
      };

      const res = await request(app)
        .post('/api/v1/profile/addresses')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.isDefault).toBe(true);

      addressA2Id = res.body.data.id;
      createdAddressIds.push(addressA2Id);

      // Verify in MySQL that addressA1 is now isDefault = false, addressA2 is true
      const dbAddr1 = await prisma.customerAddress.findUnique({ where: { id: addressA1Id } });
      const dbAddr2 = await prisma.customerAddress.findUnique({ where: { id: addressA2Id } });

      expect(dbAddr1?.isDefault).toBe(false);
      expect(dbAddr2?.isDefault).toBe(true);
    });

    it('ADDR-B3: Rejects address creation with missing province or invalid phone', async () => {
      const res = await request(app)
        .post('/api/v1/profile/addresses')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          recipientName: 'Test',
          phone: '123',
          streetAddress: '123 Test Street',
          province: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('ADDR-B4: Customer A updates their own address details', async () => {
      const res = await request(app)
        .put(`/api/v1/profile/addresses/${addressA1Id}`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          recipientName: 'Nguyễn Văn An (Nhà riêng)',
          streetAddress: 'Số 456 Lê Lợi, Phường Bến Nghé',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.recipientName).toBe('Nguyễn Văn An (Nhà riêng)');
      expect(res.body.data.streetAddress).toBe('Số 456 Lê Lợi, Phường Bến Nghé');

      // Verify in MySQL
      const dbAddr = await prisma.customerAddress.findUnique({ where: { id: addressA1Id } });
      expect(dbAddr?.recipientName).toBe('Nguyễn Văn An (Nhà riêng)');
      expect(dbAddr?.streetAddress).toBe('Số 456 Lê Lợi, Phường Bến Nghé');
    });

    it('ADDR-B5: Sets addressA1 back to default via PATCH /api/v1/profile/addresses/:id/default', async () => {
      const res = await request(app)
        .patch(`/api/v1/profile/addresses/${addressA1Id}/default`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isDefault).toBe(true);

      const dbAddr1 = await prisma.customerAddress.findUnique({ where: { id: addressA1Id } });
      const dbAddr2 = await prisma.customerAddress.findUnique({ where: { id: addressA2Id } });
      expect(dbAddr1?.isDefault).toBe(true);
      expect(dbAddr2?.isDefault).toBe(false);
    });

    it('ADDR-B6 (ANTI-IDOR): Customer B CANNOT update Customer A address (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .put(`/api/v1/profile/addresses/${addressA1Id}`)
        .set('Authorization', `Bearer ${customerBToken}`)
        .send({ recipientName: 'IDOR Overwrite' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify in MySQL that address was NOT modified
      const dbAddr = await prisma.customerAddress.findUnique({ where: { id: addressA1Id } });
      expect(dbAddr?.recipientName).toBe('Nguyễn Văn An (Nhà riêng)');
    });

    it('ADDR-B7 (ANTI-IDOR): Customer B CANNOT delete Customer A address (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .delete(`/api/v1/profile/addresses/${addressA1Id}`)
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify address still exists in MySQL
      const dbAddr = await prisma.customerAddress.findUnique({ where: { id: addressA1Id } });
      expect(dbAddr).not.toBeNull();
    });

    it('ADDR-B8: Customer A deletes own address, promoted remaining address to default', async () => {
      // addressA1 was default. Deleting it should promote addressA2 to default.
      const res = await request(app)
        .delete(`/api/v1/profile/addresses/${addressA1Id}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify addressA1 is deleted from MySQL
      const dbAddr1 = await prisma.customerAddress.findUnique({ where: { id: addressA1Id } });
      expect(dbAddr1).toBeNull();

      // Verify addressA2 is now default in MySQL
      const dbAddr2 = await prisma.customerAddress.findUnique({ where: { id: addressA2Id } });
      expect(dbAddr2?.isDefault).toBe(true);
    });
  });

  // =========================================================================
  // OBJECTIVE 4: NOTIFICATIONS MANAGEMENT & OWNERSHIP ISOLATION
  // =========================================================================
  describe('Objective 4: System Notifications & Ownership Isolation', () => {
    it('NOTIF-B1: Customer A fetches only their own notifications, with unreadCount', async () => {
      const res = await request(app)
        .get('/api/v1/profile/notifications')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications.length).toBe(2);
      expect(res.body.data.unreadCount).toBe(2);

      // Ensure zero leakage of Customer B's notification
      const returnedIds = res.body.data.notifications.map((n: { id: string }) => n.id);
      expect(returnedIds).toContain(notifA1Id.toString());
      expect(returnedIds).toContain(notifA2Id.toString());
      expect(returnedIds).not.toContain(notifB1Id.toString());
    });

    it('NOTIF-B2: Customer A marks notification A1 as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/profile/notifications/${notifA1Id}/read`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);

      // Verify in MySQL
      const dbNotif = await prisma.notification.findUnique({ where: { id: notifA1Id } });
      expect(dbNotif?.isRead).toBe(true);
    });

    it('NOTIF-B3 (ANTI-IDOR): Customer B CANNOT mark Customer A notification as read (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .patch(`/api/v1/profile/notifications/${notifA2Id}/read`)
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify in MySQL that notification A2 is still unread
      const dbNotif = await prisma.notification.findUnique({ where: { id: notifA2Id } });
      expect(dbNotif?.isRead).toBe(false);
    });

    it('NOTIF-B4: Customer A marks all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/notifications/read-all')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1); // 1 remaining unread (notifA2)

      // Verify in MySQL that all of Customer A's notifications are now isRead = true
      const unreadCount = await prisma.notification.count({
        where: { userId: customerAId, isRead: false },
      });
      expect(unreadCount).toBe(0);

      // Customer B's notification must still be unread
      const notifB = await prisma.notification.findUnique({ where: { id: notifB1Id } });
      expect(notifB?.isRead).toBe(false);
    });
  });

  // =========================================================================
  // OBJECTIVE 5: SECURE PASSWORD CHANGE
  // =========================================================================
  describe('Objective 5: Secure Password Change', () => {
    it('PASS-B1: Rejects password change when currentPassword is wrong', async () => {
      const res = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          currentPassword: 'WrongPassword999!',
          newPassword: 'BrandNewPassword2026!',
          confirmPassword: 'BrandNewPassword2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');

      // Verify passwordHash in MySQL was NOT changed
      const dbUser = await prisma.user.findUnique({ where: { id: customerAId } });
      const verifyOld = await bcrypt.compare('OldPassword123!', dbUser?.passwordHash || '');
      expect(verifyOld).toBe(true);
    });

    it('PASS-B2: Rejects password change when newPassword and confirmPassword do not match', async () => {
      const res = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword2026!',
          confirmPassword: 'DifferentPassword2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PASS-B3: Rejects password change with weak password (missing numbers)', async () => {
      const res = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'allletterslongpassword',
          confirmPassword: 'allletterslongpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PASS-B4: Successfully changes password with valid current and new password, verified in MySQL', async () => {
      const res = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword2026!',
          confirmPassword: 'BrandNewPassword2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify directly in MySQL that new password hash matches
      const dbUser = await prisma.user.findUnique({ where: { id: customerAId } });
      const verifyNew = await bcrypt.compare('BrandNewPassword2026!', dbUser?.passwordHash || '');
      const verifyOld = await bcrypt.compare('OldPassword123!', dbUser?.passwordHash || '');

      expect(verifyNew).toBe(true);
      expect(verifyOld).toBe(false);
    });
  });
});
