import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import type {
  ReviewDto,
  CreateReviewInput,
  UpdateReviewInput,
  ProductReviewsSummary,
  NexoraRole,
} from '@nexora/shared';

export interface PaginatedReviewsResult {
  reviews: ReviewDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ProductReviewsSummary;
}

export class ReviewService {
  constructor(private readonly db: PrismaClient = getPrismaClient()) {}

  /**
   * Tạo hoặc cập nhật đánh giá của khách hàng cho sản phẩm.
   * Yêu cầu xác thực đã mua hàng: khách hàng phải có đơn hàng DELIVERED chứa sản phẩm này.
   */
  async createOrUpdateReview(
    userId: number,
    productId: number,
    input: CreateReviewInput,
  ): Promise<ReviewDto> {
    // 1. Kiểm tra sản phẩm tồn tại và đang hoạt động
    const product = await this.db.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new AppError(
        404,
        'PRODUCT_NOT_FOUND',
        'Không tìm thấy sản phẩm hoặc sản phẩm không còn hoạt động.',
      );
    }

    // 2. Xác thực đã mua hàng (Verified Purchase) từ đơn hàng DELIVERED
    const deliveredItem = await this.db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          orderStatus: 'DELIVERED',
        },
      },
      select: { id: true },
    });

    if (!deliveredItem) {
      throw new AppError(
        403,
        'VERIFIED_PURCHASE_REQUIRED',
        'Chỉ khách hàng đã mua và nhận sản phẩm thành công mới có thể gửi đánh giá.',
      );
    }

    const comment = input.comment && input.comment.trim().length > 0 ? input.comment.trim() : null;

    // 3. Upsert đánh giá: bảo đảm 1 khách hàng chỉ có tối đa 1 đánh giá cho mỗi sản phẩm
    let review;
    try {
      review = await this.db.review.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        create: {
          userId,
          productId,
          rating: input.rating,
          comment,
          isVerifiedPurchase: true,
          status: 'APPROVED',
        },
        update: {
          rating: input.rating,
          comment,
          isVerifiedPurchase: true,
          status: 'APPROVED',
        },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      });
    } catch (err: unknown) {
      if (this.isUserProductUniqueCollision(err)) {
        // Race condition: request đồng thời đã tạo bản ghi trước đó -> Cập nhật bản ghi hiện hữu
        review = await this.db.review.update({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
          data: {
            rating: input.rating,
            comment,
            isVerifiedPurchase: true,
            status: 'APPROVED',
          },
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        });
      } else {
        throw err;
      }
    }

    return this.mapToDto(review);
  }

  /**
   * Lấy danh sách đánh giá công khai (chỉ trạng thái APPROVED) kèm thống kê rating.
   */
  async getProductReviews(
    productIdOrSlug: string | number,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedReviewsResult> {
    const productId = await this.resolveProductId(productIdOrSlug);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const [reviews, total, ratingStats] = await Promise.all([
      this.db.review.findMany({
        where: { productId, status: 'APPROVED' },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.review.count({
        where: { productId, status: 'APPROVED' },
      }),
      this.db.review.groupBy({
        by: ['rating'],
        where: { productId, status: 'APPROVED' },
        _count: { rating: true },
      }),
    ]);

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const stat of ratingStats) {
      const r = Number(stat.rating);
      if (ratingBreakdown[r] !== undefined) {
        ratingBreakdown[r] = stat._count.rating;
        sum += r * stat._count.rating;
      }
    }

    const averageRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    return {
      reviews: reviews.map((r) => this.mapToDto(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        averageRating,
        totalReviews: total,
        ratingBreakdown: ratingBreakdown as {
          1: number;
          2: number;
          3: number;
          4: number;
          5: number;
        },
      },
    };
  }

  /**
   * Khách hàng cập nhật đánh giá của chính mình (chống IDOR).
   */
  async updateReview(
    userId: number,
    userRole: NexoraRole,
    reviewId: number,
    input: UpdateReviewInput,
  ): Promise<ReviewDto> {
    const existing = await this.db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Không tìm thấy đánh giá.');
    }

    // Khách hàng chỉ có quyền chỉnh sửa đánh giá của chính mình (chống IDOR).
    if (existing.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn chỉ có quyền chỉnh sửa đánh giá của chính mình.');
    }

    const comment = input.comment && input.comment.trim().length > 0 ? input.comment.trim() : null;

    const updated = await this.db.review.update({
      where: { id: reviewId },
      data: {
        rating: input.rating,
        comment,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Khách hàng xóa đánh giá của chính mình, hoặc STAFF/ADMIN xóa kiểm duyệt (chống IDOR).
   */
  async deleteReview(
    userId: number,
    userRole: NexoraRole,
    reviewId: number,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Không tìm thấy đánh giá.');
    }

    if (existing.userId !== userId && userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền xóa đánh giá này.');
    }

    await this.db.review.delete({
      where: { id: reviewId },
    });

    return {
      success: true,
      message: 'Đã xóa đánh giá thành công.',
    };
  }

  /**
   * Kiểm tra điều kiện đánh giá và lấy đánh giá hiện có của khách hàng.
   */
  async getReviewEligibility(
    userId: number,
    productIdOrSlug: string | number,
  ): Promise<{ canReview: boolean; existingReview: ReviewDto | null }> {
    const productId = await this.resolveProductId(productIdOrSlug);

    const [deliveredItem, existingReview] = await Promise.all([
      this.db.orderItem.findFirst({
        where: {
          productId,
          order: {
            userId,
            orderStatus: 'DELIVERED',
          },
        },
        select: { id: true },
      }),
      this.db.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
    ]);

    return {
      canReview: !!deliveredItem,
      existingReview: existingReview ? this.mapToDto(existingReview) : null,
    };
  }

  public isUserProductUniqueCollision(err: unknown): boolean {
    if ((err as { code?: string })?.code !== 'P2002') {
      return false;
    }
    const metaTarget = (err as { meta?: { target?: unknown } })?.meta?.target;
    if (!metaTarget) {
      return false;
    }
    if (typeof metaTarget === 'string') {
      const lower = metaTarget.toLowerCase();
      return (
        lower === 'uq_reviews_user_product' ||
        lower === 'reviews_user_id_product_id_key' ||
        lower === 'userid_productid' ||
        lower === 'user_id_product_id'
      );
    }
    if (Array.isArray(metaTarget)) {
      if (metaTarget.length === 0) return false;
      const targets = metaTarget.map((t) => String(t).toLowerCase());
      const hasConstraintName =
        targets.includes('uq_reviews_user_product') ||
        targets.includes('reviews_user_id_product_id_key');
      const hasUserId = targets.includes('user_id') || targets.includes('userid');
      const hasProductId = targets.includes('product_id') || targets.includes('productid');
      return hasConstraintName || (hasUserId && hasProductId);
    }
    return false;
  }

  private async resolveProductId(productIdOrSlug: string | number): Promise<number> {
    if (typeof productIdOrSlug === 'number' || /^\d+$/.test(String(productIdOrSlug))) {
      const id = Number(productIdOrSlug);
      const exists = await this.db.product.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
      }
      return id;
    }

    const product = await this.db.product.findUnique({
      where: { slug: String(productIdOrSlug) },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm với slug tương ứng.');
    }

    return product.id;
  }

  private mapToDto(r: {
    id: number;
    productId: number;
    userId: number;
    rating: number;
    comment: string | null;
    isVerifiedPurchase: boolean;
    status: 'APPROVED' | 'HIDDEN';
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: number;
      fullName: string | null;
      avatarUrl: string | null;
    } | null;
  }): ReviewDto {
    return {
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.user?.fullName || 'Khách hàng',
      userAvatar: r.user?.avatarUrl || null,
      rating: r.rating,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
    };
  }
}
