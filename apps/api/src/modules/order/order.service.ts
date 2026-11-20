import { PrismaClient, type OrderStatus, type PaymentMethod, type Prisma } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import type { CreateOrderInput, OrderDto } from '@nexora/shared';

const prisma = new PrismaClient();

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export class OrderService {
  async createOrder(userId: number | undefined, input: CreateOrderInput): Promise<OrderDto> {
    // 1. Resolve items
    let rawItems: { productId: number; quantity: number }[] = [];

    if (input.items && input.items.length > 0) {
      rawItems = input.items;
    } else if (userId) {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (!cart || cart.items.length === 0) {
        throw new AppError(400, 'EMPTY_CART', 'Giỏ hàng của bạn đang trống.');
      }
      rawItems = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    } else {
      throw new AppError(400, 'EMPTY_ITEMS', 'Đơn hàng phải có ít nhất một sản phẩm.');
    }

    // 2. Fetch products & validate stock
    const productIds = rawItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== rawItems.length) {
      throw new AppError(400, 'PRODUCT_NOT_FOUND', 'Một số sản phẩm trong đơn hàng không tồn tại.');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotalNumber = 0;
    const orderItemsData: {
      productId: number;
      productName: string;
      productSku: string;
      thumbnailUrl: string | null;
      unitPrice: number;
      quantity: number;
      discountAmount: number;
      subtotal: number;
    }[] = [];

    for (const item of rawItems) {
      const prod = productMap.get(item.productId);
      if (!prod) continue;

      if (prod.stockQuantity < item.quantity) {
        throw new AppError(
          400,
          'INSUFFICIENT_STOCK',
          `Sản phẩm "${prod.name}" không đủ số lượng trong kho (còn ${prod.stockQuantity}).`,
        );
      }

      const unitPrice = Number(prod.salePrice || prod.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotalNumber += itemSubtotal;

      orderItemsData.push({
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        thumbnailUrl: prod.thumbnailUrl,
        unitPrice,
        quantity: item.quantity,
        discountAmount: 0,
        subtotal: itemSubtotal,
      });
    }

    // 3. Coupon validation & discount calculation
    let discountAmountNumber = 0;
    let appliedCouponCode: string | null = null;

    if (input.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: input.couponCode.toUpperCase().trim() },
      });

      if (coupon && coupon.isActive) {
        const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const meetsMin = subtotalNumber >= Number(coupon.minOrderValue);
        const withinLimit = coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit;

        if (isNotExpired && meetsMin && withinLimit) {
          appliedCouponCode = coupon.code;
          if (coupon.discountType === 'PERCENTAGE') {
            const calculated = (subtotalNumber * Number(coupon.discountValue)) / 100;
            discountAmountNumber = coupon.maxDiscount
              ? Math.min(calculated, Number(coupon.maxDiscount))
              : calculated;
          } else {
            discountAmountNumber = Number(coupon.discountValue);
          }
        }
      }
    }

    // 4. Shipping fee calculation (Free ship if subtotal >= 500,000)
    const shippingFeeNumber = subtotalNumber >= 500000 ? 0 : 30000;
    const totalAmountNumber = Math.max(0, subtotalNumber - discountAmountNumber + shippingFeeNumber);

    // 5. Generate unique orderCode
    const timestampSegment = Date.now().toString().slice(-6);
    const randomSegment = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `NX-${timestampSegment}-${randomSegment}`;

    // 6. Prisma Transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          userId: userId ?? null,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          province: input.province ?? null,
          district: input.district ?? null,
          ward: input.ward ?? null,
          customerNotes: input.customerNotes ?? null,
          subtotal: subtotalNumber,
          shippingFee: shippingFeeNumber,
          discountAmount: discountAmountNumber,
          totalAmount: totalAmountNumber,
          paymentMethod: (input.paymentMethod as PaymentMethod) || 'COD',
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          couponCode: appliedCouponCode,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              thumbnailUrl: item.thumbnailUrl,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              discountAmount: item.discountAmount,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Update coupon usage count
      if (appliedCouponCode) {
        await tx.coupon.update({
          where: { code: appliedCouponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Decrement stock & record inventory log in deterministic sorted order to prevent MySQL deadlocks
      const sortedItems = [...rawItems].sort((a, b) => a.productId - b.productId);
      for (const item of sortedItems) {
        // Atomic conditional decrement: strictly check stockQuantity >= item.quantity directly in MySQL InnoDB
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          const currentProd = await tx.product.findUnique({ where: { id: item.productId } });
          throw new AppError(
            400,
            'INSUFFICIENT_STOCK',
            `Sản phẩm "${currentProd?.name || 'Sản phẩm'}" không đủ số lượng trong kho (còn ${currentProd?.stockQuantity ?? 0}).`,
          );
        }

        const refreshed = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const balanceBefore = refreshed.stockQuantity + item.quantity;
        const balanceAfter = refreshed.stockQuantity;

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            changeType: 'SALE',
            quantity: -item.quantity,
            balanceBefore,
            balanceAfter,
            referenceType: 'ORDER',
            referenceId: orderCode,
            note: `Bán lẻ qua đơn hàng ${orderCode}`,
            actorId: userId ?? null,
          },
        });
      }

      // If cart was used, clear cart items
      if (userId && (!input.items || input.items.length === 0)) {
        const cart = await tx.cart.findUnique({ where: { userId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }

      return order;
    });

    return this.mapOrderToDto(createdOrder);
  }

  async getOrderByCode(orderCode: string): Promise<OrderDto> {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { items: true },
    });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Không tìm thấy đơn hàng ${orderCode}.`);
    }
    return this.mapOrderToDto(order);
  }

  async trackOrder(orderCode: string, phone: string): Promise<OrderDto> {
    const order = await prisma.order.findFirst({
      where: {
        orderCode: orderCode.trim().toUpperCase(),
        customerPhone: phone.trim(),
      },
      include: { items: true },
    });
    if (!order) {
      throw new AppError(
        404,
        'ORDER_NOT_FOUND',
        'Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại đã nhập.',
      );
    }
    return this.mapOrderToDto(order);
  }

  async getUserOrders(userId: number): Promise<OrderDto[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.mapOrderToDto(o));
  }

  async cancelOrder(orderCode: string, userId: number, reason: string): Promise<OrderDto> {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { items: true },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền hủy đơn hàng này.');
    }

    if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'CONFIRMED') {
      throw new AppError(
        400,
        'CANNOT_CANCEL',
        `Đơn hàng đang ở trạng thái "${order.orderStatus}", không thể hủy trực tiếp. Vui lòng liên hệ hỗ trợ.`,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
        include: { items: true },
      });

      // Restore stock
      for (const item of order.items) {
        if (!item.productId) continue;
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const newBalance = prod.stockQuantity + item.quantity;
          await tx.product.update({
            where: { id: prod.id },
            data: { stockQuantity: newBalance },
          });

          await tx.inventoryLog.create({
            data: {
              productId: prod.id,
              changeType: 'RETURN',
              quantity: item.quantity,
              balanceBefore: prod.stockQuantity,
              balanceAfter: newBalance,
              referenceType: 'CANCEL_ORDER',
              referenceId: orderCode,
              note: `Hoàn kho do hủy đơn hàng ${orderCode}`,
              actorId: userId,
            },
          });
        }
      }

      return cancelled;
    });

    return this.mapOrderToDto(updated);
  }

  async adminGetOrders(params: {
    status?: OrderStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderDto[]; total: number }> {
    const whereClause: Record<string, unknown> = {};

    if (params.status) {
      whereClause.orderStatus = params.status;
    }

    if (params.search) {
      whereClause.OR = [
        { orderCode: { contains: params.search } },
        { customerName: { contains: params.search } },
        { customerPhone: { contains: params.search } },
        { customerEmail: { contains: params.search } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 20,
        skip: params.offset ?? 0,
      }),
    ]);

    return {
      orders: orders.map((o) => this.mapOrderToDto(o)),
      total,
    };
  }

  async adminUpdateOrderStatus(
    orderId: bigint,
    status?: OrderStatus,
    trackingNumber?: string,
    carrierName?: string,
    paymentStatus?: string,
  ): Promise<OrderDto> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.orderStatus = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (carrierName) updateData.carrierName = carrierName;
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID' && !order.paidAt) {
        updateData.paidAt = new Date();
      }
    }
    if (status === 'DELIVERED' && order.paymentMethod === 'COD' && !paymentStatus) {
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    return this.mapOrderToDto(updated);
  }

  private mapOrderToDto(order: OrderWithItems): OrderDto {
    return {
      id: order.id.toString(),
      orderCode: order.orderCode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      province: order.province,
      district: order.district,
      ward: order.ward,
      customerNotes: order.customerNotes,
      subtotal: order.subtotal.toString(),
      shippingFee: order.shippingFee.toString(),
      discountAmount: order.discountAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      couponCode: order.couponCode,
      trackingNumber: order.trackingNumber,
      carrierName: order.carrierName,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      createdAt: order.createdAt.toISOString(),
      items: order.items?.map((item) => ({
        id: item.id.toString(),
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        thumbnailUrl: item.thumbnailUrl,
        unitPrice: item.unitPrice.toString(),
        quantity: item.quantity,
        discountAmount: item.discountAmount.toString(),
        subtotal: item.subtotal.toString(),
      })),
    };
  }
}
