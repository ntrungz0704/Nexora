import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import type { CartSummaryDto, MergeCartResultDto } from '@nexora/shared';

type CartProductEligibility = {
  id: number;
  name: string;
  status: string;
  stockQuantity: number;
  brandId: number | null;
  category: { id: number; name: string; isActive: boolean } | null;
  brand: { id: number; name: string; isActive: boolean } | null;
};

export class CartService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  private assertProductEligibleForCart(
    product: CartProductEligibility | null,
  ): CartProductEligibility {
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_AVAILABLE', 'Sản phẩm không tồn tại.');
    }

    if (product.status !== 'ACTIVE') {
      throw new AppError(
        400,
        'PRODUCT_UNAVAILABLE',
        product.status === 'INACTIVE'
          ? `Sản phẩm "${product.name}" hiện đã ngừng kinh doanh hoặc tạm ẩn.`
          : `Sản phẩm "${product.name}" hiện không khả dụng.`,
      );
    }

    if (!product.category || !product.category.isActive) {
      throw new AppError(
        400,
        'PRODUCT_UNAVAILABLE',
        `Danh mục của sản phẩm "${product.name}" hiện đang tạm ẩn.`,
      );
    }

    if (product.brandId !== null && (!product.brand || !product.brand.isActive)) {
      throw new AppError(
        400,
        'PRODUCT_UNAVAILABLE',
        `Thương hiệu của sản phẩm "${product.name}" hiện đang tạm ẩn.`,
      );
    }

    return product;
  }

  private getMergeIneligibilityReason(
    product: CartProductEligibility | null | undefined,
    fallbackProductId: number,
  ): string | null {
    if (!product || product.status !== 'ACTIVE') {
      return `Sản phẩm "${product?.name || `ID ${fallbackProductId}`}" đã ngừng kinh doanh, không thể thêm vào giỏ hàng.`;
    }
    if (!product.category || !product.category.isActive) {
      return `Danh mục của sản phẩm "${product.name}" hiện đang tạm ẩn, không thể thêm vào giỏ hàng.`;
    }
    if (product.brandId !== null && (!product.brand || !product.brand.isActive)) {
      return `Thương hiệu của sản phẩm "${product.name}" hiện đang tạm ẩn, không thể thêm vào giỏ hàng.`;
    }
    if (product.stockQuantity <= 0) {
      return `Sản phẩm "${product.name}" đã hết hàng, không thể thêm vào giỏ hàng.`;
    }
    return null;
  }

  private async lockProductDependenciesShare(tx: Prisma.TransactionClient, productId: number) {
    await tx.$queryRaw`
      SELECT p.id
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.id = ${productId}
      FOR SHARE
    `;
  }

  private isCallerCartOwner(
    cart: { userId: number | null; guestSessionId: string | null },
    userId?: number,
    guestSessionId?: string,
  ): boolean {
    if (userId !== undefined) {
      return cart.userId !== null && Number(cart.userId) === Number(userId);
    }
    const cleanGuest = guestSessionId?.trim();
    return Boolean(cleanGuest && cart.userId === null && cart.guestSessionId === cleanGuest);
  }

  private async assertRequestedCartOwned(
    requestedCartId: bigint | undefined,
    userId?: number,
    guestSessionId?: string,
  ): Promise<void> {
    if (requestedCartId === undefined) return;
    const targetCart = await this.prisma.cart.findUnique({
      where: { id: requestedCartId },
      select: { id: true, userId: true, guestSessionId: true },
    });
    if (!targetCart || !this.isCallerCartOwner(targetCart, userId, guestSessionId)) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thao tác trên giỏ hàng này.');
    }
  }

  private async getOrCreateCart(userId?: number, guestSessionId?: string) {
    if (userId !== undefined) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!userExists) {
        throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản người dùng không hợp lệ.');
      }
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
      });
      if (!cart) {
        try {
          cart = await this.prisma.cart.create({
            data: { userId },
          });
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code;
          if (code === 'P2002') {
            cart = await this.prisma.cart.findUniqueOrThrow({ where: { userId } });
          } else {
            throw err;
          }
        }
      }
      return cart;
    }

    const cleanGuest = guestSessionId?.trim();
    if (cleanGuest) {
      let cart = await this.prisma.cart.findUnique({
        where: { guestSessionId: cleanGuest },
      });
      if (!cart) {
        try {
          cart = await this.prisma.cart.create({
            data: { guestSessionId: cleanGuest },
          });
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code;
          if (code === 'P2002') {
            cart = await this.prisma.cart.findUniqueOrThrow({
              where: { guestSessionId: cleanGuest },
            });
          } else {
            throw err;
          }
        }
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
    requestedCartId?: bigint;
  }): Promise<CartSummaryDto> {
    if (!Number.isInteger(params.productId) || params.productId <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Mã sản phẩm không hợp lệ.');
    }

    const qty = params.quantity === undefined ? 1 : params.quantity;
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError(
        400,
        'INVALID_QUANTITY',
        'Số lượng sản phẩm phải là số nguyên dương lớn hơn 0.',
      );
    }

    const cleanGuest = params.guestSessionId?.trim() || undefined;
    if (params.userId === undefined && !cleanGuest) {
      throw new AppError(
        400,
        'CART_IDENTIFIER_REQUIRED',
        'Yêu cầu định danh giỏ hàng (người dùng hoặc phiên khách).',
      );
    }

    if (params.userId !== undefined) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true },
      });
      if (!userExists) {
        throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản người dùng không hợp lệ.');
      }
    }

    await this.assertRequestedCartOwned(params.requestedCartId, params.userId, cleanGuest);

    // Fast fail eligibility/stock pre-check before creating an empty cart shell
    const precheckProduct = await this.prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        category: { select: { id: true, name: true, isActive: true } },
        brand: { select: { id: true, name: true, isActive: true } },
      },
    });
    const validatedPrecheck = this.assertProductEligibleForCart(precheckProduct);
    if (validatedPrecheck.stockQuantity <= 0 || qty > validatedPrecheck.stockQuantity) {
      throw new AppError(
        400,
        'INSUFFICIENT_STOCK',
        `Số lượng trong kho không đủ (chỉ còn ${validatedPrecheck.stockQuantity} sản phẩm).`,
      );
    }

    const cart = await this.getOrCreateCart(params.userId, cleanGuest);
    if (params.requestedCartId !== undefined && cart.id !== params.requestedCartId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thao tác trên giỏ hàng này.');
    }

    await this.prisma.$transaction(async (tx) => {
      const lockedCart = await tx.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM carts WHERE id = ${cart.id} FOR UPDATE
      `;
      if (!lockedCart || lockedCart.length === 0) {
        throw new AppError(409, 'CART_MODIFIED', 'Giỏ hàng đã thay đổi, vui lòng thử lại.');
      }

      // Lock product + category + brand in shared mode BEFORE snapshot read so concurrent admin deactivation is visible
      await this.lockProductDependenciesShare(tx, params.productId);

      const product = await tx.product.findUnique({
        where: { id: params.productId },
        include: {
          category: { select: { id: true, name: true, isActive: true } },
          brand: { select: { id: true, name: true, isActive: true } },
        },
      });
      const eligibleProduct = this.assertProductEligibleForCart(product);

      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: params.productId,
          },
        },
      });

      const desiredQuantity = (existingItem?.quantity ?? 0) + qty;
      if (eligibleProduct.stockQuantity <= 0 || desiredQuantity > eligibleProduct.stockQuantity) {
        throw new AppError(
          400,
          'INSUFFICIENT_STOCK',
          `Số lượng trong kho không đủ (chỉ còn ${eligibleProduct.stockQuantity} sản phẩm).`,
        );
      }

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: desiredQuantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: params.productId,
            quantity: desiredQuantity,
          },
        });
      }
    });

    return this.getCartSummary(params.userId, cleanGuest);
  }

  async updateItem(params: {
    cartItemId: bigint;
    quantity: number;
    userId?: number;
    guestSessionId?: string;
    requestedCartId?: bigint;
  }): Promise<CartSummaryDto> {
    if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
      throw new AppError(
        400,
        'INVALID_QUANTITY',
        'Số lượng sản phẩm phải là số nguyên dương lớn hơn 0.',
      );
    }

    const cleanGuest = params.guestSessionId?.trim() || undefined;
    if (params.userId === undefined && !cleanGuest) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Vui lòng đăng nhập hoặc cung cấp phiên giỏ hàng hợp lệ.',
      );
    }

    await this.assertRequestedCartOwned(params.requestedCartId, params.userId, cleanGuest);

    await this.prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<
        Array<{
          id: bigint;
          cart_id: bigint;
          product_id: number;
          quantity: number;
          user_id: number | null;
          guest_session_id: string | null;
        }>
      >`
        SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, c.user_id, c.guest_session_id
        FROM cart_items ci
        INNER JOIN carts c ON c.id = ci.cart_id
        WHERE ci.id = ${params.cartItemId}
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ hàng.');
      }

      const row = lockedRows[0]!;
      const rowCartId = BigInt(row.cart_id);
      if (params.requestedCartId !== undefined && rowCartId !== params.requestedCartId) {
        throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thao tác trên giỏ hàng này.');
      }

      if (
        !this.isCallerCartOwner(
          {
            userId: row.user_id !== null ? Number(row.user_id) : null,
            guestSessionId: row.guest_session_id,
          },
          params.userId,
          cleanGuest,
        )
      ) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Bạn không có quyền chỉnh sửa sản phẩm trong giỏ hàng này.',
        );
      }

      const productId = Number(row.product_id);
      await this.lockProductDependenciesShare(tx, productId);

      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          category: { select: { id: true, name: true, isActive: true } },
          brand: { select: { id: true, name: true, isActive: true } },
        },
      });
      const eligibleProduct = this.assertProductEligibleForCart(product);

      if (eligibleProduct.stockQuantity <= 0 || params.quantity > eligibleProduct.stockQuantity) {
        throw new AppError(
          400,
          'INSUFFICIENT_STOCK',
          `Số lượng trong kho không đủ (chỉ còn ${eligibleProduct.stockQuantity} sản phẩm).`,
        );
      }

      await tx.cartItem.update({
        where: { id: params.cartItemId },
        data: { quantity: params.quantity },
      });
    });

    return this.getCartSummary(params.userId, cleanGuest);
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

      // 2. Exclusively lock target user record & existing user cart BEFORE reading products to maintain deadlock-free lock order
      await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM users WHERE id = ${userId} FOR UPDATE
      `;
      await tx.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM carts WHERE user_id = ${userId} FOR UPDATE
      `;

      // Lock product, category, and brand rows of guest items in shared mode so concurrent admin deactivations are observed cleanly
      await tx.$queryRaw`
        SELECT p.id
        FROM products p
        INNER JOIN cart_items ci ON ci.product_id = p.id
        INNER JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE ci.cart_id = ${guestCartId}
        FOR SHARE
      `;

      // 3. Fetch the guest cart with current product, category, and brand visibility from DB
      const guestCart = await tx.cart.findUnique({
        where: { id: guestCartId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: { select: { id: true, name: true, isActive: true } },
                  brand: { select: { id: true, name: true, isActive: true } },
                },
              },
            },
          },
        },
      });

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
        if (guestItem.quantity <= 0) {
          continue;
        }

        const product = guestItem.product;
        const skipReason = this.getMergeIneligibilityReason(product, guestItem.productId);
        if (skipReason || !product) {
          warnings.push(
            skipReason ||
              `Sản phẩm ID ${guestItem.productId} không khả dụng, không thể thêm vào giỏ hàng.`,
          );
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
