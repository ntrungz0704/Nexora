import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { PUBLIC_PRODUCT_ELIGIBILITY_WHERE } from '../catalog/catalog.repository.js';
import type { CouponDto, FlashSaleDto, PostDto } from '@nexora/shared';

export class MarketingService {
  constructor(private readonly db: PrismaClient = getPrismaClient()) {}

  async getActiveCoupons(): Promise<CouponDto[]> {
    const coupons = await this.db.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue.toString(),
      minOrderValue: c.minOrderValue.toString(),
      maxDiscount: c.maxDiscount ? c.maxDiscount.toString() : null,
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    }));
  }

  async validateCoupon(
    code: string,
    subtotal: number,
  ): Promise<{
    isValid: boolean;
    coupon: CouponDto;
    discountAmount: number;
    finalTotal: number;
  }> {
    const coupon = await this.db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      throw new AppError(
        404,
        'COUPON_NOT_FOUND',
        'Mã giảm giá không tồn tại hoặc đã hết hiệu lực.',
      );
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
      throw new AppError(400, 'COUPON_EXPIRED', 'Mã giảm giá đã hết hạn sử dụng.');
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new AppError(400, 'COUPON_LIMIT_REACHED', 'Mã giảm giá đã hết lượt sử dụng.');
    }

    const minOrderVal = Number(coupon.minOrderValue);
    if (subtotal < minOrderVal) {
      throw new AppError(
        400,
        'MIN_ORDER_NOT_MET',
        `Mã này chỉ áp dụng cho đơn hàng từ ${minOrderVal.toLocaleString('vi-VN')}đ trở lên.`,
      );
    }

    const discountAmount =
      coupon.discountType === 'PERCENTAGE'
        ? coupon.maxDiscount
          ? Math.min((subtotal * Number(coupon.discountValue)) / 100, Number(coupon.maxDiscount))
          : (subtotal * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);

    const finalTotal = Math.max(0, subtotal - discountAmount);

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minOrderValue: coupon.minOrderValue.toString(),
        maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : null,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      },
      discountAmount,
      finalTotal,
    };
  }

  async getActiveFlashSale(): Promise<FlashSaleDto | null> {
    const now = new Date();
    const flashSale = await this.db.flashSale.findFirst({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        items: {
          where: {
            product: PUBLIC_PRODUCT_ELIGIBILITY_WHERE,
          },
          include: {
            product: {
              include: {
                category: { select: { id: true, name: true, slug: true, isActive: true } },
                brand: { select: { id: true, name: true, slug: true, isActive: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!flashSale) return null;

    return {
      id: flashSale.id,
      name: flashSale.name,
      startTime: flashSale.startTime.toISOString(),
      endTime: flashSale.endTime.toISOString(),
      isActive: flashSale.isActive,
      items: flashSale.items
        .filter(
          (item) =>
            item.product &&
            item.product.status === 'ACTIVE' &&
            item.product.category?.isActive === true &&
            (item.product.brandId === null || item.product.brand?.isActive === true),
        )
        .map((item) => ({
          id: item.id,
          productId: item.productId,
          flashSalePrice: item.flashSalePrice.toString(),
          quantityLimit: item.quantityLimit,
          quantitySold: item.quantitySold,
          product: {
            id: item.product.id,
            categoryId: item.product.categoryId,
            brandId: item.product.brandId,
            name: item.product.name,
            slug: item.product.slug,
            sku: item.product.sku,
            price: item.product.price.toString(),
            salePrice: item.flashSalePrice.toString(),
            stockQuantity: item.product.stockQuantity,
            thumbnailUrl: item.product.thumbnailUrl,
            shortDescription: item.product.shortDescription,
            specs: item.product.specs as Record<string, unknown> | null,
            isFeatured: item.product.isFeatured,
            isHot: item.product.isHot,
            status: item.product.status,
            category: item.product.category,
            brand: item.product.brand,
          },
        })),
    };
  }

  async getPublishedPosts(limit = 10): Promise<PostDto[]> {
    const posts = await this.db.post.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      thumbnailUrl: p.thumbnailUrl,
      category: p.category,
      views: p.views,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : p.createdAt.toISOString(),
    }));
  }

  async getPostBySlug(slug: string): Promise<PostDto> {
    const post = await this.db.post.findUnique({
      where: { slug },
    });

    if (!post || !post.isPublished) {
      throw new AppError(404, 'POST_NOT_FOUND', 'Không tìm thấy bài viết.');
    }

    // Increment views
    await this.db.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      category: post.category,
      views: post.views + 1,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : post.createdAt.toISOString(),
    };
  }

  async getPublicReviews(limit = 8) {
    const reviews = await this.db.review.findMany({
      where: { rating: { gte: 4 } },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
      product: r.product,
    }));
  }
}
