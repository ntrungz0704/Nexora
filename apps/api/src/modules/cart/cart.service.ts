import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import type { CartSummaryDto, MergeCartResultDto } from '@nexora/shared';

export class CartService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  private async getOrCreateCart(userId?: number, guestSessionId?: string) {
    if (userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (userExists) {
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
    if (!userId && !guestSessionId) {
      return {
        items: [],
        totalItems: 0,
        subtotal: '0',
      };
    }

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

  /**
   * Phase B Milestone M3: Merge Guest Cart into Authenticated User Cart
   * Strictly resolves all 7 conflict scenarios:
   * 1. New product -> added to user cart
   * 2. Duplicate product -> quantity accumulated
   * 3. Out of stock -> skipped with descriptive warning
   * 4. Inactive product -> skipped with descriptive warning
   * 5. Quantity exceeds available stock -> capped to stockQuantity with warning
   * 6. Empty / non-existent guest cart -> idempotent no-op
   * 7. Idempotency & Replay protection -> atomic transaction with InnoDB row lock, guest cart deleted
   */
  async mergeGuestCartToUser(guestSessionId: string, userId: number): Promise<MergeCartResultDto> {
    if (!guestSessionId || !guestSessionId.trim()) {
      const currentCart = await this.getCartSummary(userId);
      return {
        cart: currentCart,
        mergedItemsCount: 0,
        adjustedItemsCount: 0,
        warnings: [],
      };
    }

    const cleanGuestSessionId = guestSessionId.trim();

    // Atomic transaction with exclusive row lock on both Guest Cart and User record in MySQL InnoDB
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Exclusively lock the GUEST CART record first using tx.$queryRaw FOR UPDATE
      // This strictly prevents two concurrent requests (even across DIFFERENT users) from merging the same guest cart simultaneously
      const lockedGuestCarts = await tx.$queryRaw<Array<{ id: bigint; guest_session_id: string }>>`
        SELECT id, guest_session_id FROM carts WHERE guest_session_id = ${cleanGuestSessionId} FOR UPDATE
      `;

      const firstLockedCart =
        lockedGuestCarts && lockedGuestCarts.length > 0 ? lockedGuestCarts[0] : null;

      // Scenario 6: Empty, missing or already merged & deleted guest cart -> idempotent no-op
      if (!firstLockedCart) {
        return {
          mergedItemsCount: 0,
          adjustedItemsCount: 0,
          warnings: [],
        };
      }

      const guestCartId = firstLockedCart.id;

      // 2. Fetch the guest cart with its items and products
      const guestCart = await tx.cart.findUnique({
        where: { id: guestCartId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 3. Exclusively lock the target user record using tx.$queryRaw FOR UPDATE
      await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM users WHERE id = ${userId} FOR UPDATE
      `;

      // Find or create user cart
      let userCart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: true,
        },
      });

      if (!userCart) {
        userCart = await tx.cart.create({
          data: { userId },
          include: { items: true },
        });
      }

      // If guest cart exists but has 0 items: delete empty record and return
      if (!guestCart || guestCart.items.length === 0) {
        if (guestCart) {
          await tx.cart.delete({ where: { id: guestCart.id } });
        }
        return {
          mergedItemsCount: 0,
          adjustedItemsCount: 0,
          warnings: [],
        };
      }

      let mergedItemsCount = 0;
      let adjustedItemsCount = 0;
      const warnings: string[] = [];

      // Map existing user items for fast O(1) lookup
      const userItemMap = new Map<number, (typeof userCart.items)[0]>();
      for (const item of userCart.items) {
        userItemMap.set(item.productId, item);
      }

      for (const guestItem of guestCart.items) {
        const product = guestItem.product;

        // Scenario 4: Inactive product
        if (!product || product.status !== 'ACTIVE') {
          warnings.push(
            `Sản phẩm "${product?.name || `ID ${guestItem.productId}`}" đã ngừng kinh doanh, không thể thêm vào giỏ hàng.`,
          );
          continue;
        }

        // Scenario 3: Out of stock product
        if (product.stockQuantity <= 0) {
          warnings.push(`Sản phẩm "${product.name}" đã hết hàng, không thể thêm vào giỏ hàng.`);
          continue;
        }

        const existingUserItem = userItemMap.get(guestItem.productId);

        if (existingUserItem) {
          // Scenario 2: Duplicate product
          const desiredQty = existingUserItem.quantity + guestItem.quantity;
          let finalQty = desiredQty;

          // Scenario 5: Quantity exceeds available stock
          if (desiredQty > product.stockQuantity) {
            finalQty = product.stockQuantity;
            adjustedItemsCount++;
            warnings.push(
              `Số lượng sản phẩm "${product.name}" đã được điều chỉnh về ${product.stockQuantity} do tồn kho không đủ.`,
            );
          }

          if (finalQty !== existingUserItem.quantity) {
            await tx.cartItem.update({
              where: { id: existingUserItem.id },
              data: { quantity: finalQty },
            });
            existingUserItem.quantity = finalQty;
          }
          mergedItemsCount++;
        } else {
          // Scenario 1: New product (not yet in user cart)
          let finalQty = guestItem.quantity;

          // Scenario 5: Quantity exceeds available stock
          if (finalQty > product.stockQuantity) {
            finalQty = product.stockQuantity;
            adjustedItemsCount++;
            warnings.push(
              `Số lượng sản phẩm "${product.name}" đã được điều chỉnh về ${product.stockQuantity} do tồn kho không đủ.`,
            );
          }

          if (finalQty > 0) {
            const newItem = await tx.cartItem.create({
              data: {
                cartId: userCart.id,
                productId: guestItem.productId,
                quantity: finalQty,
              },
            });
            userItemMap.set(guestItem.productId, newItem);
            mergedItemsCount++;
          }
        }
      }

      // Scenario 7: Idempotency & Replay protection: delete guest cart items and guest cart
      await tx.cartItem.deleteMany({
        where: { cartId: guestCart.id },
      });
      await tx.cart.delete({
        where: { id: guestCart.id },
      });

      return {
        mergedItemsCount,
        adjustedItemsCount,
        warnings,
      };
    });

    const currentCartSummary = await this.getCartSummary(userId);

    return {
      cart: currentCartSummary,
      mergedItemsCount: result.mergedItemsCount,
      adjustedItemsCount: result.adjustedItemsCount,
      warnings: result.warnings,
    };
  }
}
