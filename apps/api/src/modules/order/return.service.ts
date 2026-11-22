import {
  PrismaClient,
  type ReturnRequestStatus,
  type ReturnResolution,
  type UserRole,
} from '@prisma/client';
import {
  type CreateReturnRequestInput,
  CreateReturnRequestInputSchema,
  type UpdateReturnStatusInput,
  UpdateReturnStatusInputSchema,
  type ReturnRequestDto,
} from '@nexora/shared';
import { AppError } from '../../common/errors.js';

const prisma = new PrismaClient();

interface ReturnRequestRawEntity {
  id: number;
  returnCode: string;
  orderId: bigint;
  userId: number;
  reason: string;
  rejectionReason?: string | null;
  handledBy?: number | null;
  status: ReturnRequestStatus;
  notes?: string | null;
  images?: unknown;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: { id: bigint; orderCode: string } | null;
  user?: { id: number; fullName: string; email: string } | null;
  handler?: { id: number; fullName: string } | null;
  items?: Array<{
    id: number;
    returnRequestId: number;
    orderItemId: bigint;
    productId: number;
    quantity: number;
    resolution: ReturnResolution;
    isResellable: boolean;
    createdAt: Date;
    product?: {
      id: number;
      name: string;
      sku: string;
      thumbnailUrl?: string | null;
    } | null;
  }>;
  auditLogs?: Array<{
    id: number;
    returnRequestId: number;
    fromStatus: ReturnRequestStatus;
    toStatus: ReturnRequestStatus;
    actorId: number;
    actorRole: UserRole;
    notes?: string | null;
    createdAt: Date;
    actor?: {
      id: number;
      fullName: string;
      role: UserRole;
    } | null;
  }>;
}

const ALLOWED_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'REJECTED'],
  PROCESSING: ['COMPLETED', 'REJECTED'],
  REJECTED: [],
  COMPLETED: [],
};

export class ReturnService {
  /**
   * Khách hàng tạo yêu cầu đổi/trả
   */
  async createReturnRequest(
    userId: number,
    rawInput: CreateReturnRequestInput,
  ): Promise<ReturnRequestDto> {
    const parseResult = CreateReturnRequestInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu đổi/trả không hợp lệ.', details);
    }
    const input = parseResult.data;

    // 1. Kiểm tra tài khoản người dùng
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(403, 'FORBIDDEN', 'Tài khoản không tồn tại hoặc đã bị khóa.');
    }

    // 2. Tìm đơn hàng tương ứng
    let orderWhere: Record<string, unknown>;
    if (input.orderId) {
      orderWhere = { id: BigInt(input.orderId) };
    } else if (input.orderCode) {
      orderWhere = { orderCode: input.orderCode.trim().toUpperCase() };
    } else {
      throw new AppError(
        400,
        'ORDER_IDENTIFIER_REQUIRED',
        'Vui lòng cung cấp mã đơn hàng hoặc orderId.',
      );
    }

    const order = await prisma.order.findFirst({
      where: orderWhere,
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy thông tin đơn hàng.');
    }

    // 3. Kiểm tra quyền sở hữu đơn hàng (Anti-IDOR)
    if (order.userId !== userId) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Bạn không có quyền gửi yêu cầu đổi/trả cho đơn hàng của người khác.',
      );
    }

    // 4. Kiểm tra trạng thái đơn hàng (Bắt buộc DELIVERED)
    if (order.orderStatus !== 'DELIVERED') {
      throw new AppError(
        400,
        'ORDER_NOT_DELIVERED',
        'Chỉ những đơn hàng đã giao thành công (DELIVERED) mới đủ điều kiện yêu cầu đổi/trả.',
      );
    }

    // 5. Kiểm tra thời hạn đổi/trả 7 ngày tính từ deliveredAt (bắt buộc deliveredAt xác thực, không fallback)
    if (!order.deliveredAt) {
      throw new AppError(
        400,
        'ORDER_MISSING_DELIVERED_DATE',
        'Đơn hàng chưa có mốc thời gian giao hàng xác thực (deliveredAt) để đối soát thời hạn đổi/trả 7 ngày.',
      );
    }

    const deliveryDate = order.deliveredAt;
    const now = new Date();
    const diffMs = now.getTime() - deliveryDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      throw new AppError(
        400,
        'RETURN_WINDOW_EXPIRED',
        'Thời hạn gửi yêu cầu đổi/trả (7 ngày kể từ khi nhận hàng thành công) đã hết.',
      );
    }

    // 6. Kiểm tra các sản phẩm yêu cầu đổi/trả và số lượng còn đủ điều kiện
    const orderItemsMap = new Map(order.items.map((item) => [item.id.toString(), item]));

    // Lấy tất cả các yêu cầu đổi trả hiện có của đơn hàng này (không tính các yêu cầu đã bị REJECTED)
    const existingReturns = await prisma.returnRequest.findMany({
      where: {
        orderId: order.id,
        status: { not: 'REJECTED' },
      },
      include: {
        items: true,
      },
    });

    // Tính tổng số lượng đã yêu cầu đổi trả trước đó theo từng orderItemId
    const previouslyRequestedQty = new Map<string, number>();
    for (const ret of existingReturns) {
      for (const retItem of ret.items) {
        const key = retItem.orderItemId.toString();
        const current = previouslyRequestedQty.get(key) || 0;
        previouslyRequestedQty.set(key, current + retItem.quantity);
      }
    }

    const validatedItems: Array<{
      orderItemId: bigint;
      productId: number;
      quantity: number;
      resolution: ReturnResolution;
    }> = [];

    for (const item of input.items) {
      const orderItemIdStr = item.orderItemId.toString();
      const orderItem = orderItemsMap.get(orderItemIdStr);

      if (!orderItem) {
        throw new AppError(
          400,
          'INVALID_RETURN_ITEM',
          `Sản phẩm (orderItemId: ${item.orderItemId}) không thuộc đơn hàng này.`,
        );
      }

      if (item.quantity <= 0) {
        throw new AppError(
          400,
          'INVALID_RETURN_QUANTITY',
          `Số lượng đổi/trả cho "${orderItem.productName}" phải lớn hơn 0.`,
        );
      }

      const alreadyRequested = previouslyRequestedQty.get(orderItemIdStr) || 0;
      const remainingEligible = orderItem.quantity - alreadyRequested;

      if (remainingEligible <= 0) {
        throw new AppError(
          400,
          'RETURN_QUANTITY_EXCEEDED',
          `Sản phẩm "${orderItem.productName}" đã được tạo yêu cầu đổi/trả toàn bộ số lượng trước đó.`,
        );
      }

      if (item.quantity > remainingEligible) {
        throw new AppError(
          400,
          'RETURN_QUANTITY_EXCEEDED',
          `Số lượng yêu cầu đổi/trả (${item.quantity}) vượt quá số lượng còn đủ điều kiện (${remainingEligible}) cho sản phẩm "${orderItem.productName}".`,
        );
      }

      if (!orderItem.productId) {
        throw new AppError(
          400,
          'PRODUCT_NOT_FOUND',
          `Sản phẩm "${orderItem.productName}" không hợp lệ.`,
        );
      }

      validatedItems.push({
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        quantity: item.quantity,
        resolution: (item.resolution as ReturnResolution) || 'REFUND',
      });
    }

    // 7. Tạo mã return_code duy nhất
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const returnCode = `RET-${dateStr}-${randomHex}`;

    // 8. Thực thi lưu trữ nguyên tử trong Prisma transaction
    const created = await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.create({
        data: {
          returnCode,
          orderId: order.id,
          userId,
          reason: input.reason.trim(),
          notes: input.notes?.trim() || null,
          images: input.images ? input.images : undefined,
          status: 'PENDING',
        },
      });

      // Tạo các return_items
      await tx.returnItem.createMany({
        data: validatedItems.map((item) => ({
          returnRequestId: returnRequest.id,
          orderItemId: item.orderItemId,
          productId: item.productId,
          quantity: item.quantity,
          resolution: item.resolution,
          isResellable: false,
        })),
      });

      // Ghi audit log tạo yêu cầu
      await tx.returnAuditLog.create({
        data: {
          returnRequestId: returnRequest.id,
          fromStatus: 'PENDING',
          toStatus: 'PENDING',
          actorId: userId,
          actorRole: 'CUSTOMER',
          notes: 'Khách hàng tạo yêu cầu đổi/trả mới.',
        },
      });

      // Tạo thông báo hệ thống cho khách hàng
      await tx.notification.create({
        data: {
          userId,
          title: 'Yêu cầu đổi/trả đã được tiếp nhận',
          message: `Yêu cầu đổi/trả #${returnCode} cho đơn hàng #${order.orderCode} đã được ghi nhận vào hệ thống.`,
          type: 'RETURN',
        },
      });

      return returnRequest;
    });

    return this.getReturnDetailInternal(created.id);
  }

  /**
   * Khách hàng lấy danh sách yêu cầu đổi/trả của chính mình
   */
  async getOwnReturns(
    userId: number,
    query: { page?: number; limit?: number } = {},
  ): Promise<{ returns: ReturnRequestDto[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 10)));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.returnRequest.count({ where: { userId } }),
      prisma.returnRequest.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderCode: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, thumbnailUrl: true } },
            },
          },
          auditLogs: {
            include: { actor: { select: { id: true, fullName: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    return {
      returns: items.map((item) => this.mapToDto(item)),
      total,
      page,
      limit,
    };
  }

  /**
   * Khách hàng xem chi tiết yêu cầu đổi/trả của chính mình (chống IDOR)
   */
  async getOwnReturnDetail(userId: number, returnId: number): Promise<ReturnRequestDto> {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: { select: { id: true, orderCode: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, thumbnailUrl: true } },
          },
        },
        auditLogs: {
          include: { actor: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!returnRequest) {
      throw new AppError(404, 'RETURN_NOT_FOUND', 'Không tìm thấy yêu cầu đổi/trả.');
    }

    if (returnRequest.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập yêu cầu đổi/trả này.');
    }

    return this.mapToDto(returnRequest);
  }

  /**
   * Quản trị viên/Staff lấy danh sách tất cả yêu cầu đổi/trả
   */
  async getAdminReturns(query: {
    status?: ReturnRequestStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ returns: ReturnRequestDto[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { returnCode: { contains: term } },
        { order: { orderCode: { contains: term } } },
        { user: { fullName: { contains: term } } },
        { user: { email: { contains: term } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          order: { select: { id: true, orderCode: true } },
          handler: { select: { id: true, fullName: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, thumbnailUrl: true } },
            },
          },
          auditLogs: {
            include: { actor: { select: { id: true, fullName: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    return {
      returns: items.map((item) => this.mapToDto(item)),
      total,
      page,
      limit,
    };
  }

  /**
   * Quản trị viên/Staff xem chi tiết yêu cầu đổi/trả
   */
  async getAdminReturnDetail(returnId: number): Promise<ReturnRequestDto> {
    return this.getReturnDetailInternal(returnId);
  }

  /**
   * Quản trị viên/Staff cập nhật trạng thái yêu cầu đổi/trả theo State Machine
   */
  async updateReturnStatus(
    returnId: number,
    actor: { id: number; role: UserRole },
    rawInput: UpdateReturnStatusInput,
  ): Promise<ReturnRequestDto> {
    const parseResult = UpdateReturnStatusInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Dữ liệu cập nhật trạng thái không hợp lệ.',
        details,
      );
    }
    const input = parseResult.data;
    const targetStatus = input.status;

    // 1. Kiểm tra lý do từ chối nếu targetStatus === 'REJECTED'
    if (targetStatus === 'REJECTED' && !input.rejectionReason?.trim()) {
      throw new AppError(
        400,
        'REJECTION_REASON_REQUIRED',
        'Lý do từ chối là bắt buộc khi từ chối yêu cầu đổi/trả.',
      );
    }

    // 2. Thực thi giao dịch an toàn với locking trên MySQL 8.4
    await prisma.$transaction(async (tx) => {
      // Khóa bản ghi return_request để tránh race condition / lost updates
      const lockedRows = await tx.$queryRaw<Array<{ id: number; status: ReturnRequestStatus }>>`
        SELECT id, status FROM return_requests WHERE id = ${returnId} FOR UPDATE
      `;
      const current = lockedRows[0];
      if (!current) {
        throw new AppError(404, 'RETURN_NOT_FOUND', 'Không tìm thấy yêu cầu đổi/trả.');
      }

      const currentStatus = current.status;

      // Không cho phép chuyển sang cùng trạng thái
      if (currentStatus === targetStatus) {
        throw new AppError(
          400,
          'INVALID_STATUS_TRANSITION',
          `Yêu cầu đổi/trả đã ở trạng thái ${targetStatus}. Không thể cập nhật lại.`,
        );
      }

      // Kiểm tra State Machine transition
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(targetStatus)) {
        throw new AppError(
          400,
          'INVALID_STATUS_TRANSITION',
          `Không thể chuyển trạng thái từ "${currentStatus}" sang "${targetStatus}". Các trạng thái hợp lệ tiếp theo: [${allowedNext.join(', ')}].`,
        );
      }

      // Đọc thông tin chi tiết các items của return request
      const returnRequest = await tx.returnRequest.findUnique({
        where: { id: returnId },
        include: {
          items: true,
          order: true,
        },
      });

      if (!returnRequest) {
        throw new AppError(404, 'RETURN_NOT_FOUND', 'Không tìm thấy yêu cầu đổi/trả.');
      }

      // Cập nhật thuộc tính isResellable cho từng return_item nếu admin cung cấp
      if (input.items && input.items.length > 0) {
        for (const itemInput of input.items) {
          await tx.returnItem.updateMany({
            where: {
              id: itemInput.returnItemId,
              returnRequestId: returnId,
            },
            data: {
              isResellable: Boolean(itemInput.isResellable),
            },
          });
        }
      }

      // 3. TASK B — INVENTORY RESTORATION khi COMPLETED
      if (targetStatus === 'COMPLETED') {
        // Đọc lại items sau khi cập nhật isResellable
        const refreshedItems = await tx.returnItem.findMany({
          where: { returnRequestId: returnId },
        });

        for (const rItem of refreshedItems) {
          // Chỉ hoàn kho khi sản phẩm được xác nhận có thể bán lại (isResellable === true)
          if (rItem.isResellable) {
            // Khóa sản phẩm để cập nhật tồn kho an toàn
            const product = await tx.product.findUnique({
              where: { id: rItem.productId },
            });

            if (!product) {
              throw new AppError(
                404,
                'PRODUCT_NOT_FOUND',
                `Không tìm thấy sản phẩm #${rItem.productId} để hoàn kho.`,
              );
            }

            const balanceBefore = product.stockQuantity;
            const balanceAfter = balanceBefore + rItem.quantity;

            // Cộng lại kho nguyên tử
            await tx.product.update({
              where: { id: rItem.productId },
              data: {
                stockQuantity: { increment: rItem.quantity },
              },
            });

            // Ghi InventoryLog loại RETURN
            await tx.inventoryLog.create({
              data: {
                productId: rItem.productId,
                changeType: 'RETURN',
                quantity: rItem.quantity,
                balanceBefore,
                balanceAfter,
                referenceType: 'RETURN_REQUEST',
                referenceId: returnRequest.returnCode,
                note: `Hoàn kho từ yêu cầu đổi/trả ${returnRequest.returnCode}`,
                actorId: actor.id,
              },
            });
          }
        }
      }

      // 4. Cập nhật trạng thái ReturnRequest
      const updateData: Record<string, unknown> = {
        status: targetStatus,
        handledBy: actor.id,
      };

      if (targetStatus === 'REJECTED') {
        updateData.rejectionReason = input.rejectionReason?.trim();
        updateData.resolvedAt = new Date();
      } else if (targetStatus === 'COMPLETED') {
        updateData.resolvedAt = new Date();
      }

      await tx.returnRequest.update({
        where: { id: returnId },
        data: updateData,
      });

      // 5. Ghi Audit Log chuyển trạng thái
      await tx.returnAuditLog.create({
        data: {
          returnRequestId: returnId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          actorId: actor.id,
          actorRole: actor.role,
          notes:
            input.notes?.trim() ||
            (targetStatus === 'REJECTED'
              ? `Từ chối yêu cầu: ${input.rejectionReason?.trim()}`
              : `Chuyển trạng thái sang ${targetStatus}`),
        },
      });

      // 6. Gửi thông báo hệ thống cho khách hàng
      await tx.notification.create({
        data: {
          userId: returnRequest.userId,
          title: `Cập nhật yêu cầu đổi/trả #${returnRequest.returnCode}`,
          message:
            targetStatus === 'REJECTED'
              ? `Yêu cầu đổi/trả #${returnRequest.returnCode} đã bị từ chối. Lý do: ${input.rejectionReason?.trim()}`
              : `Yêu cầu đổi/trả #${returnRequest.returnCode} đã được chuyển sang trạng thái: ${targetStatus}.`,
          type: 'RETURN',
        },
      });
    });

    return this.getReturnDetailInternal(returnId);
  }

  /**
   * Internal helper để lấy chi tiết ReturnRequest đầy đủ
   */
  private async getReturnDetailInternal(returnId: number): Promise<ReturnRequestDto> {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        order: { select: { id: true, orderCode: true } },
        handler: { select: { id: true, fullName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, thumbnailUrl: true } },
          },
        },
        auditLogs: {
          include: { actor: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!returnRequest) {
      throw new AppError(404, 'RETURN_NOT_FOUND', 'Không tìm thấy yêu cầu đổi/trả.');
    }

    return this.mapToDto(returnRequest);
  }

  /**
   * Map raw Prisma entity to ReturnRequestDto
   */
  private mapToDto(entity: ReturnRequestRawEntity): ReturnRequestDto {
    return {
      id: entity.id,
      returnCode: entity.returnCode,
      orderId: entity.orderId.toString(),
      orderCode: entity.order?.orderCode,
      userId: entity.userId,
      customerName: entity.user?.fullName,
      customerEmail: entity.user?.email,
      reason: entity.reason,
      rejectionReason: entity.rejectionReason || null,
      handledBy: entity.handledBy || null,
      handlerName: entity.handler?.fullName || null,
      status: entity.status,
      notes: entity.notes || null,
      images: entity.images || null,
      resolvedAt: entity.resolvedAt ? entity.resolvedAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      items: entity.items?.map((item) => ({
        id: item.id,
        returnRequestId: item.returnRequestId,
        orderItemId: item.orderItemId.toString(),
        productId: item.productId,
        productName: item.product?.name,
        productSku: item.product?.sku,
        thumbnailUrl: item.product?.thumbnailUrl || null,
        quantity: item.quantity,
        resolution: item.resolution,
        isResellable: item.isResellable,
        createdAt: item.createdAt.toISOString(),
      })),
      auditLogs: entity.auditLogs?.map((log) => ({
        id: log.id,
        returnRequestId: log.returnRequestId,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        actorId: log.actorId,
        actorRole: log.actorRole,
        actorName: log.actor?.fullName,
        notes: log.notes || null,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }
}

export const returnService = new ReturnService();
