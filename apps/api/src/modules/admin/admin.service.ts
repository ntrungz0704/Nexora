import { PrismaClient, type Prisma } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import type { AdminDashboardSummaryDto, ProductDto } from '@nexora/shared';

const prisma = new PrismaClient();

export interface CreateProductInput {
  categoryId: number;
  brandId?: number | null;
  name: string;
  slug?: string;
  sku: string;
  price: string | number;
  salePrice?: string | number | null;
  stockQuantity?: number;
  thumbnailUrl?: string | null;
  shortDescription?: string | null;
  specs?: Record<string, unknown>;
  isFeatured?: boolean;
  isHot?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

export interface UpdateProductInput {
  categoryId?: number;
  brandId?: number | null;
  name?: string;
  slug?: string;
  sku?: string;
  price?: string | number;
  salePrice?: string | number | null;
  stockQuantity?: number;
  thumbnailUrl?: string | null;
  shortDescription?: string | null;
  specs?: Record<string, unknown>;
  isFeatured?: boolean;
  isHot?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    brand: { select: { id: true; name: true; slug: true } };
  };
}>;

export class AdminService {
  async getDashboardSummary(): Promise<AdminDashboardSummaryDto> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      ordersCount,
      paidOrdersAggregate,
      customersCount,
      productsCount,
      activeProductsCount,
      lowStockCount,
      outOfStockCount,
      stockUnitsAggregate,
      soldUnitsAggregate,
      lowStockProducts,
      recentOrders,
      allOrderStatuses,
      last7DaysOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: {
          orderStatus: { not: 'CANCELLED' },
          OR: [{ paymentStatus: 'PAID' }, { orderStatus: 'DELIVERED' }],
        },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { stockQuantity: { gt: 0, lte: 9 } } }),
      prisma.product.count({ where: { stockQuantity: { lte: 0 } } }),
      prisma.product.aggregate({
        _sum: { stockQuantity: true },
      }),
      prisma.orderItem.aggregate({
        where: { order: { orderStatus: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
      }),
      prisma.product.findMany({
        where: { stockQuantity: { gt: 0, lte: 9 } },
        take: 6,
        orderBy: { stockQuantity: 'asc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.order.groupBy({
        by: ['orderStatus'],
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, totalAmount: true, orderStatus: true, paymentStatus: true },
      }),
    ]);

    const totalRevenue = paidOrdersAggregate._sum.totalAmount
      ? paidOrdersAggregate._sum.totalAmount.toString()
      : '0';

    // Order status breakdown
    let pending = 0;
    let shipping = 0;
    let completed = 0;
    let cancelled = 0;
    for (const row of allOrderStatuses) {
      const count = row._count._all;
      if (row.orderStatus === 'PENDING') pending += count;
      else if (
        row.orderStatus === 'CONFIRMED' ||
        row.orderStatus === 'PROCESSING' ||
        row.orderStatus === 'SHIPPING'
      ) {
        shipping += count;
      } else if (row.orderStatus === 'DELIVERED') completed += count;
      else if (row.orderStatus === 'CANCELLED' || row.orderStatus === 'RETURNED')
        cancelled += count;
    }

    // Build 7-day realtime revenue + orders series (inclusive of today)
    const dayMap = new Map<
      string,
      { date: string; isoDate: string; revenue: number; orders: number }
    >();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      dayMap.set(isoDate, { date: label, isoDate, revenue: 0, orders: 0 });
    }
    for (const ord of last7DaysOrders) {
      const d = new Date(ord.createdAt);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const bucket = dayMap.get(isoDate);
      if (bucket) {
        bucket.orders += 1;
        if (
          ord.orderStatus !== 'CANCELLED' &&
          (ord.paymentStatus === 'PAID' || ord.orderStatus === 'DELIVERED')
        ) {
          bucket.revenue += Number(ord.totalAmount);
        }
      }
    }

    return {
      totalRevenue,
      ordersCount,
      customersCount,
      productsCount,
      activeProductsCount,
      lowStockCount,
      outOfStockCount,
      totalUnitsInStock: stockUnitsAggregate._sum.stockQuantity ?? 0,
      totalUnitsSold: soldUnitsAggregate._sum.quantity ?? 0,
      pendingOrdersCount: pending,
      revenueLast7Days: Array.from(dayMap.values()),
      orderStatusBreakdown: {
        pending,
        shipping,
        completed,
        cancelled,
        total: ordersCount,
      },
      lowStockProducts: lowStockProducts.map((p) => this.mapProductToDto(p)),
      recentOrders: recentOrders.map((o) => ({
        id: o.id.toString(),
        orderCode: o.orderCode,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        shippingAddress: o.shippingAddress,
        province: o.province,
        district: o.district,
        ward: o.ward,
        customerNotes: o.customerNotes,
        subtotal: o.subtotal.toString(),
        shippingFee: o.shippingFee.toString(),
        discountAmount: o.discountAmount.toString(),
        totalAmount: o.totalAmount.toString(),
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        couponCode: o.couponCode,
        trackingNumber: o.trackingNumber,
        carrierName: o.carrierName,
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((item) => ({
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
      })),
    };
  }

  // --- Products CRUD + AI Generation ---
  async getProducts(params: {
    search?: string;
    categoryId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ products: ProductDto[]; total: number }> {
    const whereClause: Prisma.ProductWhereInput = {};

    if (params.categoryId) whereClause.categoryId = params.categoryId;
    if (params.search) {
      whereClause.OR = [
        { name: { contains: params.search } },
        { sku: { contains: params.search } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 20,
        skip: params.offset ?? 0,
      }),
    ]);

    return {
      products: products.map((p) => this.mapProductToDto(p)),
      total,
    };
  }

  async createProduct(data: CreateProductInput, actorId?: number): Promise<ProductDto> {
    const created = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          categoryId: Number(data.categoryId),
          brandId: data.brandId ? Number(data.brandId) : null,
          name: data.name,
          slug: data.slug || this.slugify(data.name),
          sku: data.sku,
          price: data.price,
          salePrice: data.salePrice || null,
          stockQuantity: Number(data.stockQuantity || 0),
          thumbnailUrl: data.thumbnailUrl || null,
          shortDescription: data.shortDescription || null,
          specs: (data.specs as Prisma.InputJsonValue) || {},
          isFeatured: Boolean(data.isFeatured),
          isHot: Boolean(data.isHot),
          status: data.status || 'ACTIVE',
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
      });

      if (Number(data.stockQuantity || 0) > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: p.id,
            changeType: 'IMPORT',
            quantity: Number(data.stockQuantity),
            balanceBefore: 0,
            balanceAfter: Number(data.stockQuantity),
            referenceType: 'INITIAL_IMPORT',
            note: 'Khởi tạo tồn kho sản phẩm mới',
            actorId: actorId ?? null,
          },
        });
      }

      return p;
    });

    return this.mapProductToDto(created);
  }

  async updateProduct(id: number, data: UpdateProductInput): Promise<ProductDto> {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        brandId: data.brandId ? Number(data.brandId) : undefined,
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        price: data.price,
        salePrice: data.salePrice !== undefined ? data.salePrice : undefined,
        stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : undefined,
        thumbnailUrl: data.thumbnailUrl !== undefined ? data.thumbnailUrl : undefined,
        shortDescription: data.shortDescription !== undefined ? data.shortDescription : undefined,
        specs: data.specs !== undefined ? (data.specs as Prisma.InputJsonValue) : undefined,
        isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : undefined,
        isHot: data.isHot !== undefined ? Boolean(data.isHot) : undefined,
        status: data.status,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });

    return this.mapProductToDto(updated);
  }

  async deleteProduct(id: number): Promise<{ id: number; deleted: boolean }> {
    await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return { id, deleted: true };
  }

  generateAiProductDescription(
    name: string,
    categoryName?: string,
    specs?: Record<string, unknown>,
  ): string {
    const specsSummary = specs
      ? Object.entries(specs)
          .map(([k, v]) => `- ${k}: ${String(v)}`)
          .join('\n')
      : '';
    return `### Giới thiệu tổng quan về ${name}\n\n${name} là sản phẩm phần cứng đỉnh cao thuộc phân khúc ${categoryName || 'công nghệ chính hãng'}, được thiết kế nhằm đáp ứng tối đa nhu cầu của người dùng khắt khe nhất. Với ngôn ngữ hoàn thiện cao cấp, độ bền vượt trội và linh kiện đạt chứng chỉ kiểm định quốc tế, sản phẩm mang lại sự an tâm tuyệt đối trong suốt quá trình vận hành.\n\n### Đặc điểm nổi bật\n- **Hiệu năng bứt phá**: Tối ưu hóa vi kiến trúc, hạn chế độ trễ và giữ mức nhiệt độ mát mẻ dưới tải nặng liên tục.\n- **Độ tin cậy hàng đầu**: Được bảo hành chính hãng lên tới 24-36 tháng cùng cam kết 1-đổi-1 trong 7 ngày đầu tại Nexora.\n- **Thiết kế công thái học**: Từng đường nét được trau chuốt tỉ mỉ, phù hợp với mọi không gian làm việc và setup gaming hiện đại.\n\n${specsSummary ? `### Thông số kỹ thuật chi tiết\n${specsSummary}\n` : ''}\n### Tại sao nên mua tại Nexora?\n- Cam kết 100% hàng mới nguyên seal, hóa đơn VAT đầy đủ.\n- Giao hàng siêu tốc toàn quốc, miễn phí vận chuyển cho đơn từ 500k.\n- Đội ngũ kỹ sư hỗ trợ kỹ thuật và tư vấn 24/7 qua hotline 1800 2097.`;
  }

  // --- Category CRUD + AI Generation ---
  async getCategories() {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          select: { stockQuantity: true },
        },
      },
    });
    return categories.map(({ products, ...cat }) => ({
      ...cat,
      productsCount: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stockQuantity, 0),
    }));
  }

  async createCategory(data: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug || this.slugify(data.name),
        icon: data.icon || null,
        description: data.description || null,
        sortOrder: Number(data.sortOrder || 0),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateCategory(id: number, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        description: data.description,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });
  }

  generateAiCategory(name: string): { description: string; icon: string; seoTitle: string } {
    let icon = 'fas fa-box';
    const lower = name.toLowerCase();
    if (lower.includes('laptop')) icon = 'fas fa-laptop';
    else if (lower.includes('chuột') || lower.includes('mouse')) icon = 'fas fa-mouse';
    else if (lower.includes('bàn phím') || lower.includes('keyboard')) icon = 'fas fa-keyboard';
    else if (lower.includes('màn hình') || lower.includes('monitor')) icon = 'fas fa-desktop';
    else if (lower.includes('vga') || lower.includes('card')) icon = 'fas fa-microchip';
    else if (lower.includes('tai nghe') || lower.includes('headphone')) icon = 'fas fa-headphones';

    return {
      description: `Khám phá bộ sưu tập ${name} chính hãng giá tốt nhất tại Nexora. Đa dạng mẫu mã từ các thương hiệu hàng đầu thế giới, bảo hành chính hãng, trả góp 0% và giao hàng miễn phí toàn quốc.`,
      icon,
      seoTitle: `Mua ${name} Chính Hãng - Giá Rẻ Nhất, Trả Góp 0% | Nexora`,
    };
  }

  // --- Inventory Management ---
  async getInventoryLogs(productId?: number, limit = 50) {
    const logs = await prisma.inventoryLog.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        actor: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs.map((log) => ({
      ...log,
      id: Number(log.id),
    }));
  }

  async adjustStock(productId: number, quantity: number, reason: string, actorId: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    }

    const newBalance = product.stockQuantity + quantity;
    if (newBalance < 0) {
      throw new AppError(400, 'NEGATIVE_STOCK', 'Số lượng tồn kho không thể âm.');
    }

    const nextStatus =
      newBalance === 0 && product.status === 'ACTIVE'
        ? 'OUT_OF_STOCK'
        : newBalance > 0 && product.status === 'OUT_OF_STOCK'
          ? 'ACTIVE'
          : product.status;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newBalance, status: nextStatus },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          changeType: quantity > 0 ? 'IMPORT' : 'EXPORT',
          quantity,
          balanceBefore: product.stockQuantity,
          balanceAfter: newBalance,
          referenceType: 'MANUAL_ADJUSTMENT',
          note: reason,
          actorId,
        },
      });

      return updated;
    });
  }

  // --- Order Detail ---
  async getOrderDetail(id: bigint | number) {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, thumbnailUrl: true } },
          },
        },
      },
    });
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');
    return {
      ...order,
      id: order.id.toString(),
      subtotal: order.subtotal.toString(),
      shippingFee: order.shippingFee.toString(),
      discountAmount: order.discountAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((it) => ({
        ...it,
        id: it.id.toString(),
        orderId: it.orderId.toString(),
        unitPrice: it.unitPrice.toString(),
        discountAmount: it.discountAmount.toString(),
        subtotal: it.subtotal.toString(),
      })),
    };
  }

  // --- Coupons CRUD ---
  async getCoupons() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  private normalizeCouponType(type?: string): 'PERCENTAGE' | 'FIXED' {
    if (type === 'FIXED' || type === 'FIXED_AMOUNT') return 'FIXED';
    return 'PERCENTAGE';
  }

  async createCoupon(data: {
    code: string;
    description?: string;
    discountType?: 'PERCENTAGE' | 'FIXED' | 'FIXED_AMOUNT';
    discountValue: number | string;
    minOrderValue?: number | string;
    maxDiscount?: number | string | null;
    usageLimit?: number | null;
    startsAt?: Date | string;
    expiresAt?: Date | string;
    isActive?: boolean;
  }) {
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase().trim() },
    });
    if (existing) {
      throw new AppError(409, 'COUPON_EXISTS', 'Mã giảm giá này đã tồn tại.');
    }
    const normalizedType = this.normalizeCouponType(data.discountType);
    const val = Number(data.discountValue);
    if (normalizedType === 'PERCENTAGE' && (val <= 0 || val > 20)) {
      throw new AppError(
        400,
        'COUPON_DISCOUNT_LIMIT',
        'Theo chính sách Nexora, mã giảm phần trăm chỉ được tối đa 20%.',
      );
    }
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase().trim(),
        description: data.description,
        discountType: normalizedType,
        discountValue: val,
        minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : 0,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateCoupon(
    id: number,
    data: {
      code?: string;
      description?: string;
      discountType?: 'PERCENTAGE' | 'FIXED' | 'FIXED_AMOUNT';
      discountValue?: number | string;
      minOrderValue?: number | string;
      maxDiscount?: number | string | null;
      usageLimit?: number | null;
      startsAt?: Date | string;
      expiresAt?: Date | string;
      isActive?: boolean;
    },
  ) {
    const normalizedType = data.discountType
      ? this.normalizeCouponType(data.discountType)
      : undefined;
    if (
      normalizedType === 'PERCENTAGE' &&
      data.discountValue !== undefined &&
      Number(data.discountValue) > 20
    ) {
      throw new AppError(
        400,
        'COUPON_DISCOUNT_LIMIT',
        'Theo chính sách Nexora, mã giảm phần trăm chỉ được tối đa 20%.',
      );
    }
    return prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code ? { code: data.code.toUpperCase().trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(normalizedType ? { discountType: normalizedType } : {}),
        ...(data.discountValue !== undefined ? { discountValue: Number(data.discountValue) } : {}),
        ...(data.minOrderValue !== undefined ? { minOrderValue: Number(data.minOrderValue) } : {}),
        ...(data.maxDiscount !== undefined
          ? { maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null }
          : {}),
        ...(data.usageLimit !== undefined
          ? { usageLimit: data.usageLimit ? Number(data.usageLimit) : null }
          : {}),
        ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}),
        ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async deleteCoupon(id: number) {
    return prisma.coupon.delete({ where: { id } });
  }

  async toggleCouponStatus(id: number) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mã giảm giá.');
    return prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  // --- Flash Sales CRUD ---
  async getFlashSales() {
    return prisma.flashSale.findMany({
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, thumbnailUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFlashSale(data: {
    name: string;
    startTime: Date | string;
    endTime: Date | string;
    isActive?: boolean;
    productIds?: number[];
    discountPercents?: number[];
  }) {
    const flashSale = await prisma.flashSale.create({
      data: {
        name: data.name,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    if (data.productIds && data.productIds.length > 0) {
      for (let i = 0; i < data.productIds.length; i++) {
        const pId = data.productIds[i];
        if (typeof pId === 'number') {
          const prod = await prisma.product.findUnique({ where: { id: pId } });
          if (prod) {
            const discount = data.discountPercents?.[i] || 15;
            const promotionalPrice = Math.round(Number(prod.price) * (1 - discount / 100));
            await prisma.flashSaleItem.create({
              data: {
                flashSaleId: flashSale.id,
                productId: pId,
                flashSalePrice: promotionalPrice,
                quantityLimit: 10,
                quantitySold: 0,
              },
            });
          }
        }
      }
    }

    return flashSale;
  }

  async toggleFlashSaleStatus(id: number) {
    const fs = await prisma.flashSale.findUnique({ where: { id } });
    if (!fs) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy flash sale.');
    return prisma.flashSale.update({
      where: { id },
      data: { isActive: !fs.isActive },
    });
  }

  async deleteFlashSale(id: number) {
    await prisma.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
    return prisma.flashSale.delete({ where: { id } });
  }

  async updateFlashSale(
    id: number,
    data: {
      name?: string;
      startTime?: Date | string;
      endTime?: Date | string;
      isActive?: boolean;
      productIds?: number[];
      items?: Array<{ productId: number; flashSalePrice: number; quantityLimit: number }>;
    },
  ) {
    const fs = await prisma.flashSale.findUnique({ where: { id } });
    if (!fs) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy flash sale.');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.flashSale.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.startTime && { startTime: new Date(data.startTime) }),
          ...(data.endTime && { endTime: new Date(data.endTime) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      if (data.items && Array.isArray(data.items)) {
        await tx.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
        for (const it of data.items) {
          await tx.flashSaleItem.create({
            data: {
              flashSaleId: id,
              productId: it.productId,
              flashSalePrice: it.flashSalePrice,
              quantityLimit: it.quantityLimit || 10,
            },
          });
        }
      } else if (data.productIds && Array.isArray(data.productIds)) {
        const existingItems = await tx.flashSaleItem.findMany({ where: { flashSaleId: id } });
        const existingMap = new Map(existingItems.map((e) => [e.productId, e]));
        await tx.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
        for (const pId of data.productIds) {
          const prev = existingMap.get(pId);
          if (prev) {
            await tx.flashSaleItem.create({
              data: {
                flashSaleId: id,
                productId: pId,
                flashSalePrice: prev.flashSalePrice,
                quantityLimit: prev.quantityLimit,
                quantitySold: prev.quantitySold,
              },
            });
          } else {
            const prod = await tx.product.findUnique({ where: { id: pId } });
            if (prod) {
              await tx.flashSaleItem.create({
                data: {
                  flashSaleId: id,
                  productId: pId,
                  flashSalePrice: Math.round(Number(prod.price) * 0.85),
                  quantityLimit: 10,
                },
              });
            }
          }
        }
      }

      return updated;
    });
  }

  // --- Banners CRUD ---
  async getBanners() {
    return prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createBanner(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string | null;
    placement?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return prisma.banner.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        placement: data.placement || 'hero',
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateBanner(
    id: number,
    data: Partial<{
      title: string;
      imageUrl: string;
      linkUrl: string | null;
      placement: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    return prisma.banner.update({
      where: { id },
      data,
    });
  }

  async deleteBanner(id: number) {
    return prisma.banner.delete({ where: { id } });
  }

  async toggleBannerStatus(id: number) {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy banner.');
    return prisma.banner.update({
      where: { id },
      data: { isActive: !banner.isActive },
    });
  }

  // --- Posts / News CRUD ---
  async getPosts() {
    return prisma.post.findMany({
      include: {
        author: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPost(data: {
    title: string;
    slug?: string;
    excerpt?: string | null;
    content: string;
    thumbnailUrl?: string | null;
    category?: string;
    isPublished?: boolean;
    authorId?: number | null;
  }) {
    const slug = data.slug || this.slugify(data.title);
    return prisma.post.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl || null,
        category: data.category || 'Tech',
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        authorId: data.authorId || null,
        publishedAt: new Date(),
      },
    });
  }

  async updatePost(
    id: number,
    data: Partial<{
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      thumbnailUrl: string | null;
      category: string;
      isPublished: boolean;
    }>,
  ) {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  async deletePost(id: number) {
    return prisma.post.delete({ where: { id } });
  }

  async togglePostStatus(id: number) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy bài viết.');
    return prisma.post.update({
      where: { id },
      data: { isPublished: !post.isPublished },
    });
  }

  // --- Brands CRUD ---
  async getBrands() {
    return prisma.brand.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createBrand(data: {
    name: string;
    slug?: string;
    logoUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
  }) {
    const slug = data.slug || this.slugify(data.name);
    return prisma.brand.create({
      data: {
        name: data.name,
        slug,
        logoUrl: data.logoUrl || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateBrand(
    id: number,
    data: Partial<{
      name: string;
      slug: string;
      logoUrl: string | null;
      description: string | null;
      isActive: boolean;
    }>,
  ) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async deleteBrand(id: number) {
    return prisma.brand.delete({ where: { id } });
  }

  // --- Users / Customers Management ---
  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { wishlists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserStatus(id: number, actorId?: number, actorRole?: string) {
    if (actorRole !== 'ADMIN') {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Chỉ Quản trị viên (ADMIN) mới có quyền khóa hoặc mở khóa tài khoản.',
      );
    }
    if (id === 1) {
      throw new AppError(403, 'PROTECTED_ADMIN', 'Không thể khóa tài khoản Quản trị tối cao.');
    }
    if (actorId && id === actorId) {
      throw new AppError(
        400,
        'SELF_LOCK_FORBIDDEN',
        'Bạn không thể tự khóa tài khoản đang đăng nhập.',
      );
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy người dùng.');
    if (user.role === 'ADMIN') {
      throw new AppError(
        403,
        'PROTECTED_ADMIN',
        'Không thể khóa tài khoản có vai trò Quản trị viên (ADMIN).',
      );
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, email: true, status: true, role: true },
    });
  }

  async changeUserRole(
    id: number,
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN',
    actorId?: number,
    actorRole?: string,
  ) {
    if (actorRole !== 'ADMIN') {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Chỉ Quản trị viên (ADMIN) mới có quyền thay đổi vai trò tài khoản.',
      );
    }
    if (id === 1) {
      throw new AppError(403, 'PROTECTED_ADMIN', 'Không thể thay đổi vai trò Quản trị tối cao.');
    }
    if (actorId && id === actorId) {
      throw new AppError(
        403,
        'SELF_ROLE_CHANGE_FORBIDDEN',
        'Bạn không thể tự thay đổi vai trò của tài khoản đang đăng nhập.',
      );
    }
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy người dùng.');
    }
    if (targetUser.role === 'ADMIN') {
      throw new AppError(
        403,
        'PROTECTED_ADMIN',
        'Không thể thay đổi vai trò tài khoản có vai trò Quản trị viên (ADMIN).',
      );
    }
    return prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  // --- Reviews Moderation ---
  async getReviews(status?: 'APPROVED' | 'HIDDEN') {
    return prisma.review.findMany({
      where: status ? { status } : undefined,
      include: {
        product: { select: { id: true, name: true, thumbnailUrl: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReviewStatus(id: number, status: 'APPROVED' | 'HIDDEN') {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Không tìm thấy đánh giá.');
    }
    return prisma.review.update({
      where: { id },
      data: { status },
      include: {
        product: { select: { id: true, name: true, thumbnailUrl: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async deleteReview(id: number) {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Không tìm thấy đánh giá.');
    }
    await prisma.review.delete({ where: { id } });
    return { success: true, message: 'Đã xóa đánh giá thành công.' };
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private mapProductToDto(product: ProductWithRelations): ProductDto {
    return {
      id: product.id,
      categoryId: product.categoryId,
      brandId: product.brandId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price.toString(),
      salePrice: product.salePrice ? product.salePrice.toString() : null,
      stockQuantity: product.stockQuantity,
      thumbnailUrl: product.thumbnailUrl,
      shortDescription: product.shortDescription,
      specs: product.specs as Record<string, unknown> | null,
      isFeatured: product.isFeatured,
      isHot: product.isHot,
      status: product.status,
      category: product.category,
      brand: product.brand,
    };
  }
}
