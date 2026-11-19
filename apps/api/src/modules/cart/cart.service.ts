import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import type { CartSummaryDto } from '@nexora/shared';

export class CartService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  private async getOrCreateCart(userId?: number, guestSessionId?: string) {
    if (userId) {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
        });
      }
      return cart;
    }

    if (guestSessionId) {
      let cart = await this.prisma.cart.findUnique({
        where: { guestSessionId },
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { guestSessionId },
        });
      }
      return cart;
    }

    throw new AppError(
      400,
      'CART_IDENTIFIER_REQUIRED',
      'Yêu cầu định danh giỏ hàng (người dùng hoặc phiên khách).',
    );
  }

  async getCartSummary(userId?: number, guestSessionId?: string): Promise<CartSummaryDto> {
    const cart = await this.getOrCreateCart(userId, guestSessionId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            brand: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalItems = 0;
    let subtotalCents = BigInt(0);

    const mappedItems = items.map((item) => {
      totalItems += item.quantity;
      const unitPrice = item.product.salePrice ?? item.product.price;
      // Convert Decimal to BigInt cents/dong
      const priceVal = BigInt(Math.round(Number(unitPrice)));
      subtotalCents += priceVal * BigInt(item.quantity);

      return {
        id: item.id.toString(),
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          categoryId: item.product.categoryId,
          brandId: item.product.brandId,
          name: item.product.name,
          slug: item.product.slug,
          sku: item.product.sku,
          price: item.product.price.toString(),
          salePrice: item.product.salePrice ? item.product.salePrice.toString() : null,
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
      };
    });

    return {
      items: mappedItems,
      totalItems,
      subtotal: subtotalCents.toString(),
    };
  }

  async addItem(params: {
    userId?: number;
    guestSessionId?: string;
    productId: number;
    quantity?: number;
  }): Promise<CartSummaryDto> {
    const qty = Math.max(1, params.quantity ?? 1);
    const cart = await this.getOrCreateCart(params.userId, params.guestSessionId);

    const product = await this.prisma.product.findUnique({
      where: { id: params.productId },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new AppError(
        404,
        'PRODUCT_NOT_AVAILABLE',
        'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.',
      );
    }

    if (product.stockQuantity < qty) {
      throw new AppError(
        400,
        'INSUFFICIENT_STOCK',
        `Số lượng trong kho không đủ (chỉ còn ${product.stockQuantity} sản phẩm).`,
      );
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: params.productId,
        },
      },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + qty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: params.productId,
          quantity: qty,
        },
      });
    }

    return this.getCartSummary(params.userId, params.guestSessionId);
  }

  async updateItem(params: {
    cartItemId: bigint;
    quantity: number;
    userId?: number;
    guestSessionId?: string;
  }): Promise<CartSummaryDto> {
    if (params.quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: params.cartItemId },
      });
    } else {
      await this.prisma.cartItem.update({
        where: { id: params.cartItemId },
        data: { quantity: params.quantity },
      });
    }

    return this.getCartSummary(params.userId, params.guestSessionId);
  }

  async removeItem(params: {
    cartItemId: bigint;
    userId?: number;
    guestSessionId?: string;
  }): Promise<CartSummaryDto> {
    await this.prisma.cartItem.delete({
      where: { id: params.cartItemId },
    });

    return this.getCartSummary(params.userId, params.guestSessionId);
  }
}
