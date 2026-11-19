import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export class WishlistService {
  private get prisma() {
    return getPrismaClient();
  }

  async getWishlist(userId: number) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            images: {
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        price: Number(item.product.price),
        salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
        stockQuantity: item.product.stockQuantity,
        thumbnailUrl: item.product.thumbnailUrl,
        shortDescription: item.product.shortDescription,
        category: item.product.category,
        brand: item.product.brand,
        specs: item.product.specs,
      },
    }));
  }

  async toggleWishlist(userId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Sản phẩm không tồn tại.');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let inWishlist: boolean;

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      inWishlist = false;
    } else {
      await this.prisma.wishlist.create({
        data: {
          userId,
          productId,
        },
      });
      inWishlist = true;
    }

    const count = await this.prisma.wishlist.count({
      where: { userId },
    });

    return {
      inWishlist,
      count,
      message: inWishlist
        ? 'Đã thêm sản phẩm vào danh sách yêu thích.'
        : 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
    };
  }

  async removeFromWishlist(userId: number, productId: number) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
    }

    const count = await this.prisma.wishlist.count({
      where: { userId },
    });

    return {
      success: true,
      count,
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
    };
  }

  async getCount(userId?: number): Promise<number> {
    if (!userId) return 0;
    return this.prisma.wishlist.count({
      where: { userId },
    });
  }
}

export const wishlistService = new WishlistService();
