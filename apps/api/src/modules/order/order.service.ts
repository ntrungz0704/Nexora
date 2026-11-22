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
    const totalAmountNumber = Math.max(
      0,
      subtotalNumber - discountAmountNumber + shippingFeeNumber,
    );

    // 5. Transaction with Concurrency & Deadlock Resilience
    let attempts = 0;
    const maxAttempts = 3;
    let createdOrder: OrderWithItems;

    while (true) {
      attempts++;
      const timestampSegment = Date.now().toString().slice(-6);
      const randomSegment = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `NX-${timestampSegment}-${randomSegment}`;

      try {
        createdOrder = await prisma.$transaction(
          async (tx) => {
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

              const refreshed = await tx.product.findUniqueOrThrow({
                where: { id: item.productId },
              });
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

            // Clear ordered items from authenticated user's cart
            if (userId) {
              const cart = await tx.cart.findUnique({ where: { userId } });
              if (cart) {
                if (!input.items || input.items.length === 0) {
                  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
                } else {
                  await tx.cartItem.deleteMany({
                    where: {
                      cartId: cart.id,
                      productId: { in: rawItems.map((i) => i.productId) },
                    },
                  });
                }
              }
            }

            return order;
          },
          {
            maxWait: 5000,
            timeout: 10000,
          },
        );
        break;
      } catch (err: unknown) {
        const errorRecord = err as { code?: string; message?: string };
        if (
          errorRecord?.code === 'P2034' ||
          errorRecord?.message?.includes('deadlock') ||
          errorRecord?.message?.includes('write conflict')
        ) {
          // Check if any product was exhausted by the competing concurrent transaction
          for (const item of rawItems) {
            const currentProd = await prisma.product.findUnique({ where: { id: item.productId } });
            if (currentProd && currentProd.stockQuantity < item.quantity) {
              throw new AppError(
                400,
                'INSUFFICIENT_STOCK',
                `Sản phẩm "${currentProd.name}" không đủ số lượng trong kho (còn ${currentProd.stockQuantity}).`,
              );
            }
          }

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
            continue;
          }
        }
        throw err;
      }
    }

    return this.mapOrderToDto(createdOrder);
  }

  async getOrderByCode(
    orderCode: string,
    context: {
      requester?: { sub: number; role: string; email?: string };
      phone?: string;
      email?: string;
    } = {},
  ): Promise<OrderDto> {
    const normalizedCode = orderCode.trim().toUpperCase();
    const providedPhone = context.phone?.trim() || '';
    const providedEmail = context.email?.trim().toLowerCase() || '';

    // Reject completely unauthenticated requests with no guest verification BEFORE querying DB
    if (!context.requester && !providedPhone && !providedEmail) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Vui lòng đăng nhập hoặc cung cấp số điện thoại/email đặt hàng để xem chi tiết đơn hàng.',
      );
    }

    // Uniform 404 prevents attackers from distinguishing non-existent codes vs unauthorized orders
    const uniformNotFound = () =>
      new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy thông tin đơn hàng phù hợp.');

    const order = await prisma.order.findUnique({
      where: { orderCode: normalizedCode },
      include: { items: true },
    });

    if (!order) {
      throw uniformNotFound();
    }

    // 1. Privileged internal roles (ADMIN / STAFF) follow explicit RBAC
    const isPrivileged = context.requester?.role === 'ADMIN' || context.requester?.role === 'STAFF';
    if (isPrivileged) {
      return this.mapOrderToDto(order);
    }

    // 2. Authenticated customer accessing their own order
    if (
      context.requester &&
      order.userId !== null &&
      Number(order.userId) === Number(context.requester.sub)
    ) {
      return this.mapOrderToDto(order);
    }

    // 3. Guest-order verification policy:
    //    Only orders without an owning account (userId === null) may be looked up via matching phone or email.
    //    Registered customer orders require authenticated owner (or ADMIN/STAFF) access.
    if (order.userId === null && (providedPhone || providedEmail)) {
      const phoneMatches = providedPhone.length > 0 && providedPhone === order.customerPhone.trim();
      const emailMatches =
        providedEmail.length > 0 && providedEmail === order.customerEmail.trim().toLowerCase();

      if (phoneMatches || emailMatches) {
        return this.mapOrderToSanitizedGuestDto(order);
      }
    }

    throw uniformNotFound();
  }

  async trackOrder(
    orderCode: string,
    phone: string,
    requester?: { sub: number; role: string; email?: string },
  ): Promise<OrderDto> {
    const order = await prisma.order.findFirst({
      where: {
        orderCode: orderCode.trim().toUpperCase(),
        customerPhone: phone.trim(),
      },
      include: { items: true },
    });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy thông tin đơn hàng phù hợp.');
    }

    const isPrivileged = requester?.role === 'ADMIN' || requester?.role === 'STAFF';
    const isOwner =
      requester && order.userId !== null && Number(order.userId) === Number(requester.sub);
    if (isPrivileged || isOwner) {
      return this.mapOrderToDto(order);
    }

    // Minimize PII exposure for unauthenticated order tracking responses
    return this.mapOrderToSanitizedGuestDto(order);
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
    actorId?: number,
  ): Promise<OrderDto> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
    }

    const effectivePaymentStatus = paymentStatus || order.paymentStatus;
    if (
      order.paymentMethod === 'VNPAY' &&
      status &&
      ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED'].includes(status) &&
      effectivePaymentStatus !== 'PAID'
    ) {
      throw new AppError(
        400,
        'VNPAY_UNPAID_ORDER',
        'Đơn VNPay phải thanh toán thành công (PAID) mới được xác nhận hoặc giao hàng.',
      );
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
    if (status === 'DELIVERED') {
      if (order.paymentMethod === 'COD' && !paymentStatus) {
        updateData.paymentStatus = 'PAID';
        updateData.paidAt = new Date();
      }
      if (!order.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }
    if (status === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = 'admin_cancelled';
    }

    const isNewlyCancelled = status === 'CANCELLED' && order.orderStatus !== 'CANCELLED';

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });

      // Restore stock & write immutable inventory audit log when Admin cancels an order
      if (isNewlyCancelled) {
        for (const item of order.items) {
          if (!item.productId) continue;
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newBalance = prod.stockQuantity + item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                stockQuantity: newBalance,
                ...(prod.status === 'OUT_OF_STOCK' && newBalance > 0 ? { status: 'ACTIVE' } : {}),
              },
            });
            await tx.inventoryLog.create({
              data: {
                productId: prod.id,
                changeType: 'RETURN',
                quantity: item.quantity,
                balanceBefore: prod.stockQuantity,
                balanceAfter: newBalance,
                referenceType: 'ADMIN_CANCEL',
                referenceId: order.orderCode,
                note: `Hoàn tồn kho từ đơn hàng ${order.orderCode} (Lý do: admin_cancelled)`,
                actorId: actorId ?? null,
              },
            });
          }
        }
      }

      return saved;
    });

    return this.mapOrderToDto(updated);
  }

  private maskPhone(phone: string): string {
    const clean = phone.trim();
    if (clean.length <= 6) return '***';
    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
  }

  private maskEmail(email: string): string {
    const clean = email.trim();
    const [local, domain] = clean.split('@');
    if (!local || !domain) return '***';
    const prefix = local.slice(0, Math.min(2, local.length));
    return `${prefix}***@${domain}`;
  }

  private maskAddress(address: string): string {
    const parts = address
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length <= 1) return '*** (địa chỉ đã được ẩn để bảo mật)';
    return `***, ${parts.slice(-2).join(', ')}`;
  }

  private mapOrderToSanitizedGuestDto(order: OrderWithItems): OrderDto {
    const dto = this.mapOrderToDto(order);
    return {
      ...dto,
      customerEmail: this.maskEmail(dto.customerEmail),
      customerPhone: this.maskPhone(dto.customerPhone),
      shippingAddress: this.maskAddress(dto.shippingAddress),
      customerNotes: null,
    };
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
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
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
