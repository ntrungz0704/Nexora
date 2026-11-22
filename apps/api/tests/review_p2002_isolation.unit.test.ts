import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewService } from '../src/modules/catalog/review.service.js';
import type { PrismaClient } from '@prisma/client';

describe('ReviewService P2002 Target Isolation & Race Condition Unit Tests', () => {
  const service = new ReviewService({} as unknown as PrismaClient);

  describe('isUserProductUniqueCollision predicate isolation', () => {
    it('returns false for non-P2002 errors', () => {
      expect(service.isUserProductUniqueCollision(new Error('Generic failure'))).toBe(false);
      expect(service.isUserProductUniqueCollision({ code: 'P2025' })).toBe(false);
      expect(service.isUserProductUniqueCollision({ code: 'P2003' })).toBe(false);
      expect(service.isUserProductUniqueCollision(null)).toBe(false);
      expect(service.isUserProductUniqueCollision(undefined)).toBe(false);
    });

    it('returns false when meta or meta.target is missing or falsy', () => {
      expect(service.isUserProductUniqueCollision({ code: 'P2002' })).toBe(false);
      expect(service.isUserProductUniqueCollision({ code: 'P2002', meta: {} })).toBe(false);
      expect(service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: null } })).toBe(
        false,
      );
      expect(service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: '' } })).toBe(
        false,
      );
      expect(service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: [] } })).toBe(
        false,
      );
    });

    it('returns false when meta.target is an unrelated string constraint (PRIMARY, email, phone)', () => {
      expect(
        service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: 'PRIMARY' } }),
      ).toBe(false);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: 'users_email_unique' },
        }),
      ).toBe(false);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: 'orders_code_unique' },
        }),
      ).toBe(false);
    });

    it('returns false when meta.target is an array without both user and product identifiers', () => {
      expect(
        service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: ['PRIMARY'] } }),
      ).toBe(false);
      expect(
        service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: ['email'] } }),
      ).toBe(false);
      expect(
        service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: ['user_id'] } }),
      ).toBe(false);
      expect(
        service.isUserProductUniqueCollision({ code: 'P2002', meta: { target: ['product_id'] } }),
      ).toBe(false);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: ['userId', 'status'] },
        }),
      ).toBe(false);
    });

    it('returns true when meta.target is exact constraint name string uq_reviews_user_product', () => {
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: 'uq_reviews_user_product' },
        }),
      ).toBe(true);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: 'UQ_REVIEWS_USER_PRODUCT' },
        }),
      ).toBe(true);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: 'reviews_user_id_product_id_key' },
        }),
      ).toBe(true);
    });

    it('returns true when meta.target array contains constraint name or both user_id and product_id', () => {
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: ['uq_reviews_user_product'] },
        }),
      ).toBe(true);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: ['user_id', 'product_id'] },
        }),
      ).toBe(true);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: ['userId', 'productId'] },
        }),
      ).toBe(true);
      expect(
        service.isUserProductUniqueCollision({
          code: 'P2002',
          meta: { target: ['USER_ID', 'PRODUCT_ID'] },
        }),
      ).toBe(true);
    });
  });

  describe('createOrUpdateReview error handling & re-throw behavior', () => {
    const mockProductFindUnique = vi.fn();
    const mockOrderItemFindFirst = vi.fn();
    const mockReviewUpsert = vi.fn();
    const mockReviewUpdate = vi.fn();

    const mockPrisma = {
      product: { findUnique: mockProductFindUnique },
      orderItem: { findFirst: mockOrderItemFindFirst },
      review: {
        upsert: mockReviewUpsert,
        update: mockReviewUpdate,
      },
    } as unknown as PrismaClient;

    const testService = new ReviewService(mockPrisma);

    const now = new Date();
    const fakeReviewRecord = {
      id: 99,
      userId: 10,
      productId: 20,
      rating: 5,
      comment: 'Tuyệt vời',
      isVerifiedPurchase: true,
      status: 'APPROVED' as const,
      createdAt: now,
      updatedAt: now,
      user: { id: 10, fullName: 'Test User', avatarUrl: null },
    };

    beforeEach(() => {
      vi.clearAllMocks();
      mockProductFindUnique.mockResolvedValue({ id: 20, status: 'ACTIVE' });
      mockOrderItemFindFirst.mockResolvedValue({ id: 100 });
    });

    it('rethrows when P2002 target is PRIMARY and DOES NOT call review.update', async () => {
      const primaryCollisionError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: 'PRIMARY' },
        message: 'Unique constraint failed on the constraint: PRIMARY',
      };
      mockReviewUpsert.mockRejectedValue(primaryCollisionError);

      await expect(
        testService.createOrUpdateReview(10, 20, { rating: 5, comment: 'Tuyệt vời' }),
      ).rejects.toEqual(primaryCollisionError);

      expect(mockReviewUpdate).not.toHaveBeenCalled();
    });

    it('rethrows when P2002 has missing meta.target and DOES NOT call review.update', async () => {
      const unknownTargetError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: undefined,
        message: 'Unique constraint failed without target',
      };
      mockReviewUpsert.mockRejectedValue(unknownTargetError);

      await expect(
        testService.createOrUpdateReview(10, 20, { rating: 5, comment: 'Tuyệt vời' }),
      ).rejects.toEqual(unknownTargetError);

      expect(mockReviewUpdate).not.toHaveBeenCalled();
    });

    it('rethrows when P2002 target is an unrelated array [email] and DOES NOT call review.update', async () => {
      const emailCollisionError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed on email',
      };
      mockReviewUpsert.mockRejectedValue(emailCollisionError);

      await expect(
        testService.createOrUpdateReview(10, 20, { rating: 5, comment: 'Tuyệt vời' }),
      ).rejects.toEqual(emailCollisionError);

      expect(mockReviewUpdate).not.toHaveBeenCalled();
    });

    it('rethrows when non-P2002 Prisma error occurs and DOES NOT call review.update', async () => {
      const connectionError = new Error('Database connection failed');
      mockReviewUpsert.mockRejectedValue(connectionError);

      await expect(
        testService.createOrUpdateReview(10, 20, { rating: 5, comment: 'Tuyệt vời' }),
      ).rejects.toEqual(connectionError);

      expect(mockReviewUpdate).not.toHaveBeenCalled();
    });

    it('catches P2002 with target uq_reviews_user_product, falls back to review.update, and returns DTO', async () => {
      const userProductCollisionError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: 'uq_reviews_user_product' },
        message: 'Unique constraint failed on uq_reviews_user_product',
      };
      mockReviewUpsert.mockRejectedValue(userProductCollisionError);
      mockReviewUpdate.mockResolvedValue(fakeReviewRecord);

      const result = await testService.createOrUpdateReview(10, 20, {
        rating: 5,
        comment: 'Tuyệt vời',
      });

      expect(mockReviewUpdate).toHaveBeenCalledTimes(1);
      expect(mockReviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_productId: {
              userId: 10,
              productId: 20,
            },
          },
        }),
      );
      expect(result.id).toBe(99);
      expect(result.rating).toBe(5);
      expect(result.isVerifiedPurchase).toBe(true);
    });

    it('catches P2002 with target array [user_id, product_id], falls back to review.update, and returns DTO', async () => {
      const arrayTargetCollisionError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['user_id', 'product_id'] },
        message: 'Unique constraint failed on (user_id, product_id)',
      };
      mockReviewUpsert.mockRejectedValue(arrayTargetCollisionError);
      mockReviewUpdate.mockResolvedValue(fakeReviewRecord);

      const result = await testService.createOrUpdateReview(10, 20, {
        rating: 5,
        comment: 'Tuyệt vời',
      });

      expect(mockReviewUpdate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(99);
      expect(result.rating).toBe(5);
    });
  });
});
