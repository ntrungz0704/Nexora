import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Phase B Milestone M4: Customer Reviews Backend Integration Test Suite', () => {
  let app: Express;

  // Users & Tokens
  let tokenA: string;
  let userAId: number;

  let tokenB: string;
  let userBId: number;

  let tokenC: string;
  let userCId: number;

  let tokenD: string;
  let userDId: number;

  let staffToken: string;

  let adminToken: string;

  // Products
  let prodAId: number;
  let prodASlug: string;
  let prodBId: number;
  let prodBSlug: string;
  let prodInactiveId: number;

  // Track created entities for clean teardown
  const createdUserIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdOrderIds: bigint[] = [];
  const createdReviewIds: number[] = [];

  beforeAll(async () => {
    app = createApp();
    const env = getEnv();
    const ts = Date.now();
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // 1. Create Test Users
    // Customer A: has DELIVERED order for prodA
    const userA = await prisma.user.create({
      data: {
        email: `review-cust-a-${ts}@nexora.local`,
        fullName: 'Nguyễn Văn Đánh Giá A',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userAId = userA.id;
    createdUserIds.push(userA.id);
    tokenA = jwt.sign({ sub: userA.id, email: userA.email, role: userA.role }, env.AUTH_SECRET, {
      expiresIn: '1h',
    });

    // Customer B: has DELIVERED order for prodB
    const userB = await prisma.user.create({
      data: {
        email: `review-cust-b-${ts}@nexora.local`,
        fullName: 'Trần Thị Nhận Xét B',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userBId = userB.id;
    createdUserIds.push(userB.id);
    tokenB = jwt.sign({ sub: userB.id, email: userB.email, role: userB.role }, env.AUTH_SECRET, {
      expiresIn: '1h',
    });

    // Customer C: has PENDING order for prodA (not delivered)
    const userC = await prisma.user.create({
      data: {
        email: `review-cust-c-${ts}@nexora.local`,
        fullName: 'Lê Văn Chờ Hàng C',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userCId = userC.id;
    createdUserIds.push(userC.id);
    tokenC = jwt.sign({ sub: userC.id, email: userC.email, role: userC.role }, env.AUTH_SECRET, {
      expiresIn: '1h',
    });

    // Customer D: has CANCELLED order for prodA (cancelled)
    const userD = await prisma.user.create({
      data: {
        email: `review-cust-d-${ts}@nexora.local`,
        fullName: 'Phạm Văn Hủy Đơn D',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    userDId = userD.id;
    createdUserIds.push(userD.id);
    tokenD = jwt.sign({ sub: userD.id, email: userD.email, role: userD.role }, env.AUTH_SECRET, {
      expiresIn: '1h',
    });

    // Staff User
    const staff = await prisma.user.create({
      data: {
        email: `review-staff-${ts}@nexora.local`,
        fullName: 'Nhân Viên Hỗ Trợ',
        passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });
    createdUserIds.push(staff.id);
    staffToken = jwt.sign(
      { sub: staff.id, email: staff.email, role: staff.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    // Admin User
    const admin = await prisma.user.create({
      data: {
        email: `review-admin-${ts}@nexora.local`,
        fullName: 'Quản Trị Viên Nexora',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    createdUserIds.push(admin.id);
    adminToken = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    // 2. Category & Brand
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Màn hình test', slug: `cat-rev-${ts}` },
      });
    }

    // 3. Create Products
    prodASlug = `man-hinh-gaming-a-${ts}`;
    const prodA = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Màn Hình Gaming A',
        slug: prodASlug,
        sku: `SKU-REV-A-${ts}`,
        price: 5000000,
        stockQuantity: 20,
        status: 'ACTIVE',
      },
    });
    prodAId = prodA.id;
    createdProductIds.push(prodA.id);

    prodBSlug = `ban-phim-co-b-${ts}`;
    const prodB = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Bàn Phím Cơ B',
        slug: prodBSlug,
        sku: `SKU-REV-B-${ts}`,
        price: 1500000,
        stockQuantity: 30,
        status: 'ACTIVE',
      },
    });
    prodBId = prodB.id;
    createdProductIds.push(prodB.id);

    const prodInactive = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Sản Phẩm Đã Ngừng Bán',
        slug: `san-pham-ngung-ban-${ts}`,
        sku: `SKU-REV-INACT-${ts}`,
        price: 200000,
        stockQuantity: 0,
        status: 'INACTIVE',
      },
    });
    prodInactiveId = prodInactive.id;
    createdProductIds.push(prodInactive.id);

    // 4. Create Orders
    // Order 1: DELIVERED for Customer A with prodA
    const order1 = await prisma.order.create({
      data: {
        orderCode: `ORD-DELIV-A-${ts}`,
        userId: userAId,
        recipientName: 'Nguyễn Văn Đánh Giá A',
        phone: '0901112233',
        streetAddress: '123 Đường Test A',
        subtotal: 5000000,
        totalAmount: 5000000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        items: {
          create: {
            productId: prodAId,
            productName: prodA.name,
            productSku: prodA.sku,
            unitPrice: 5000000,
            quantity: 1,
            subtotal: 5000000,
          },
        },
      },
    });
    createdOrderIds.push(order1.id);

    // Order 2: DELIVERED for Customer B with prodB
    const order2 = await prisma.order.create({
      data: {
        orderCode: `ORD-DELIV-B-${ts}`,
        userId: userBId,
        recipientName: 'Trần Thị Nhận Xét B',
        phone: '0902223344',
        streetAddress: '456 Đường Test B',
        subtotal: 1500000,
        totalAmount: 1500000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        items: {
          create: {
            productId: prodBId,
            productName: prodB.name,
            productSku: prodB.sku,
            unitPrice: 1500000,
            quantity: 1,
            subtotal: 1500000,
          },
        },
      },
    });
    createdOrderIds.push(order2.id);

    // Order 3: PENDING for Customer C with prodA
    const order3 = await prisma.order.create({
      data: {
        orderCode: `ORD-PEND-C-${ts}`,
        userId: userCId,
        recipientName: 'Lê Văn Chờ Hàng C',
        phone: '0903334455',
        streetAddress: '789 Đường Test C',
        subtotal: 5000000,
        totalAmount: 5000000,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: {
            productId: prodAId,
            productName: prodA.name,
            productSku: prodA.sku,
            unitPrice: 5000000,
            quantity: 1,
            subtotal: 5000000,
          },
        },
      },
    });
    createdOrderIds.push(order3.id);

    // Order 4: CANCELLED for Customer D with prodA
    const order4 = await prisma.order.create({
      data: {
        orderCode: `ORD-CANC-D-${ts}`,
        userId: userDId,
        recipientName: 'Phạm Văn Hủy Đơn D',
        phone: '0904445566',
        streetAddress: '101 Đường Test D',
        subtotal: 5000000,
        totalAmount: 5000000,
        orderStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        items: {
          create: {
            productId: prodAId,
            productName: prodA.name,
            productSku: prodA.sku,
            unitPrice: 5000000,
            quantity: 1,
            subtotal: 5000000,
          },
        },
      },
    });
    createdOrderIds.push(order4.id);
  });

  afterAll(async () => {
    try {
      if (createdProductIds.length > 0) {
        await prisma.review.deleteMany({
          where: { productId: { in: createdProductIds } },
        });
      }
      if (createdOrderIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { orderId: { in: createdOrderIds } },
        });
        await prisma.order.deleteMany({
          where: { id: { in: createdOrderIds } },
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
      // Ignored during teardown
    } finally {
      await prisma.$disconnect();
    }
  });

  describe('Group 1: Authentication & Input Validation', () => {
    it('REV-UNAUTH: Calling POST review endpoint without token returns 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .send({ rating: 5, comment: 'Sản phẩm xuất sắc!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('UNAUTHORIZED');
    });

    it('REV-VAL-RATING-LOW: Rating = 0 is rejected with 400 validation error', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 0, comment: 'Đánh giá 0 sao' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('REV-VAL-RATING-HIGH: Rating = 6 is rejected with 400 validation error', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 6, comment: 'Đánh giá 6 sao' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('REV-VAL-RATING-FLOAT: Non-integer rating = 4.5 is rejected with 400 validation error', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 4.5, comment: 'Đánh giá 4.5 sao' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('REV-VAL-COMMENT-SHORT: Comment with 3 characters is rejected with 400 validation error', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'Tốt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('REV-VAL-COMMENT-LONG: Comment with 1001 characters is rejected with 400 validation error', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('REV-VAL-INVALID-ID: Non-numeric product ID returns 400 INVALID_PRODUCT_ID', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/products/abc/reviews')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'Sản phẩm rất tốt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('INVALID_PRODUCT_ID');
    });

    it('REV-PROD-NOT-FOUND: Non-existent product ID returns 404 PRODUCT_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/products/999999/reviews')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'Sản phẩm không có thực' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('REV-PROD-INACTIVE: Product with INACTIVE status returns 404 PRODUCT_NOT_FOUND', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodInactiveId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'Sản phẩm đã dừng bán' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('Group 2: Verified Purchase Enforcement', () => {
    it('REV-VERIFY-UNPURCHASED: Customer B (never bought prodA) is rejected with 403 VERIFIED_PURCHASE_REQUIRED', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ rating: 5, comment: 'Tôi chưa mua nhưng muốn khen' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('VERIFIED_PURCHASE_REQUIRED');
    });

    it('REV-VERIFY-PENDING: Customer C (bought prodA but order is PENDING) is rejected with 403 VERIFIED_PURCHASE_REQUIRED', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ rating: 4, comment: 'Tôi đang đợi nhận hàng' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('VERIFIED_PURCHASE_REQUIRED');
    });

    it('REV-VERIFY-CANCELLED: Customer D (bought prodA but order is CANCELLED) is rejected with 403 VERIFIED_PURCHASE_REQUIRED', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenD}`)
        .send({ rating: 1, comment: 'Đơn hàng của tôi đã bị hủy' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('VERIFIED_PURCHASE_REQUIRED');
    });

    it('REV-VERIFY-DELIVERED-SUCCESS: Customer A (with DELIVERED order for prodA) successfully posts review', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'Màn hình rất đẹp, hiển thị màu chuẩn 100% sRGB!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.productId).toBe(prodAId);
      expect(res.body.data.userId).toBe(userAId);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe('Màn hình rất đẹp, hiển thị màu chuẩn 100% sRGB!');
      expect(res.body.data.isVerifiedPurchase).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      createdReviewIds.push(res.body.data.id);
    });

    it('REV-SPOOF-PROTECTION: Client attempting to send isVerifiedPurchase=false or status=HIDDEN is ignored by backend', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          rating: 5,
          comment: 'Thử giả mạo cờ xác thực mua hàng',
          isVerifiedPurchase: false,
          status: 'HIDDEN',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Backend must strictly enforce verified purchase and approved status
      expect(res.body.data.isVerifiedPurchase).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('Group 3: Upsert & Concurrency Safety (1 Review Per User Per Product)', () => {
    it('REV-UPSERT-UPDATE: Submitting a new review for the same product updates the existing record', async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${prodAId}/reviews`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 4, comment: 'Sau 1 tuần dùng thấy ổn, trừ chân đế hơi chiếm chỗ.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe('Sau 1 tuần dùng thấy ổn, trừ chân đế hơi chiếm chỗ.');

      // Verify in MySQL that there is still ONLY 1 review for Customer A on prodA
      const count = await prisma.review.count({
        where: { userId: userAId, productId: prodAId },
      });
      expect(count).toBe(1);
    });

    it('REV-CONCURRENT-SAFETY: 4 concurrent review submissions from Customer B on prodB are serialized without duplicate key error', async () => {
      const promises = [1, 2, 3, 4].map((i) =>
        request(app)
          .post(`/api/v1/catalog/products/${prodBId}/reviews`)
          .set('Authorization', `Bearer ${tokenB}`)
          .send({ rating: 5, comment: `Đánh giá đồng thời thử nghiệm lần thứ ${i}` }),
      );

      const results = await Promise.all(promises);

      for (const res of results) {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      }

      // Verify strictly 1 review record persists in MySQL
      const count = await prisma.review.count({
        where: { userId: userBId, productId: prodBId },
      });
      expect(count).toBe(1);
    });
  });

  describe('Group 4: Eligibility & Single Product Detail Integration', () => {
    it('REV-ELIGIBILITY-PURCHASED: Customer A queries eligibility -> canReview: true, has existingReview', async () => {
      const res = await request(app)
        .get(`/api/v1/catalog/products/${prodAId}/reviews/eligibility`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canReview).toBe(true);
      expect(res.body.data.existingReview).not.toBeNull();
      expect(res.body.data.existingReview.rating).toBe(4);
    });

    it('REV-ELIGIBILITY-UNPURCHASED: Customer C queries eligibility -> canReview: false, existingReview: null', async () => {
      const res = await request(app)
        .get(`/api/v1/catalog/products/${prodAId}/reviews/eligibility`)
        .set('Authorization', `Bearer ${tokenC}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canReview).toBe(false);
      expect(res.body.data.existingReview).toBeNull();
    });

    it('REV-PUBLIC-BY-SLUG: GET /api/v1/catalog/products/:slug includes approved reviews with isVerifiedPurchase', async () => {
      const res = await request(app).get(`/api/v1/catalog/products/${prodASlug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toBeDefined();
      expect(res.body.data.reviews.length).toBeGreaterThanOrEqual(1);

      const review = res.body.data.reviews.find(
        (r: { id: number }) => r.id === createdReviewIds[0],
      );
      expect(review).toBeDefined();
      expect(review.isVerifiedPurchase).toBe(true);
    });
  });

  describe('Group 5: Public Review Listing, Pagination & Stats', () => {
    it('REV-PUBLIC-LIST-STATS: Public GET /products/:id/reviews returns reviews, pagination and calculated rating stats', async () => {
      const res = await request(app).get(`/api/v1/catalog/products/${prodAId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);

      // Pagination check
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.total).toBe(1);

      // Rating Stats check
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalReviews).toBe(1);
      expect(res.body.stats.averageRating).toBe(4);
      expect(res.body.stats.ratingBreakdown).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 0,
      });
    });
  });

  describe('Group 6: Anti-IDOR & Customer Review Modification / Deletion', () => {
    it('REV-IDOR-UPDATE: Customer B attempting to update Customer A review is rejected with 403 FORBIDDEN', async () => {
      const reviewA = await prisma.review.findFirst({
        where: { userId: userAId, productId: prodAId },
      });
      expect(reviewA).not.toBeNull();

      const res = await request(app)
        .put(`/api/v1/catalog/reviews/${reviewA!.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ rating: 1, comment: 'Cố tình sửa đánh giá của người khác' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('REV-OWNER-UPDATE: Customer A successfully updates their own review via PUT /api/v1/catalog/reviews/:id', async () => {
      const reviewA = await prisma.review.findFirst({
        where: { userId: userAId, productId: prodAId },
      });
      expect(reviewA).not.toBeNull();

      const res = await request(app)
        .put(`/api/v1/catalog/reviews/${reviewA!.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rating: 5, comment: 'Đã mua thêm giá treo màn hình, dùng cực kỳ ưng ý!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe('Đã mua thêm giá treo màn hình, dùng cực kỳ ưng ý!');
    });

    it('REV-IDOR-DELETE: Customer B attempting to delete Customer A review is rejected with 403 FORBIDDEN', async () => {
      const reviewA = await prisma.review.findFirst({
        where: { userId: userAId, productId: prodAId },
      });
      expect(reviewA).not.toBeNull();

      const res = await request(app)
        .delete(`/api/v1/catalog/reviews/${reviewA!.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('REV-OWNER-DELETE: Customer B successfully deletes their own review via DELETE /api/v1/catalog/reviews/:id', async () => {
      const reviewB = await prisma.review.findFirst({
        where: { userId: userBId, productId: prodBId },
      });
      expect(reviewB).not.toBeNull();

      const res = await request(app)
        .delete(`/api/v1/catalog/reviews/${reviewB!.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion in database
      const dbCheck = await prisma.review.findUnique({ where: { id: reviewB!.id } });
      expect(dbCheck).toBeNull();
    });
  });

  describe('Group 7: ADMIN & STAFF Moderation Workflows', () => {
    it('REV-ADMIN-LIST: STAFF and ADMIN can list all reviews via GET /api/v1/admin/reviews', async () => {
      const resStaff = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resStaff.status).toBe(200);
      expect(resStaff.body.success).toBe(true);
      expect(Array.isArray(resStaff.body.data)).toBe(true);

      const resAdmin = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.success).toBe(true);
    });

    it('REV-ADMIN-HIDE: STAFF hides an inappropriate review via PATCH /api/v1/admin/reviews/:id/status', async () => {
      const reviewA = await prisma.review.findFirst({
        where: { userId: userAId, productId: prodAId },
      });
      expect(reviewA).not.toBeNull();

      const res = await request(app)
        .patch(`/api/v1/admin/reviews/${reviewA!.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'HIDDEN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('HIDDEN');
    });

    it('REV-HIDDEN-EXCLUDED-PUBLIC: Hidden review is excluded from public reviews list and average rating', async () => {
      const res = await request(app).get(`/api/v1/catalog/products/${prodAId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Because Customer A's review was HIDDEN, it should not appear in public
      expect(res.body.data.length).toBe(0);
      expect(res.body.stats.totalReviews).toBe(0);
      expect(res.body.stats.averageRating).toBe(0);

      // Check product detail by slug as well
      const resSlug = await request(app).get(`/api/v1/catalog/products/${prodASlug}`);
      expect(resSlug.status).toBe(200);
      expect(resSlug.body.data.reviews.length).toBe(0);
    });

    it('REV-ADMIN-DELETE: ADMIN permanently deletes review via DELETE /api/v1/admin/reviews/:id', async () => {
      const reviewA = await prisma.review.findFirst({
        where: { userId: userAId, productId: prodAId },
      });
      expect(reviewA).not.toBeNull();

      const res = await request(app)
        .delete(`/api/v1/admin/reviews/${reviewA!.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbCheck = await prisma.review.findUnique({ where: { id: reviewA!.id } });
      expect(dbCheck).toBeNull();
    });
  });
});
