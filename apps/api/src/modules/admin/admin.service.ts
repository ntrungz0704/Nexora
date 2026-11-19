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
    const [
      orders,
      paidOrdersAggregate,
      customersCount,
      productsCount,
      lowStockCount,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.product.count({ where: { stockQuantity: { lt: 5 } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
    ]);

    const totalRevenue = paidOrdersAggregate._sum.totalAmount
      ? paidOrdersAggregate._sum.totalAmount.toString()
      : '0';

    return {
      totalRevenue,
      ordersCount: orders,
      customersCount,
      productsCount,
      lowStockCount,
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

  generateAiProductDescription(name: string, categoryName?: string, specs?: Record<string, unknown>): string {
    const specsSummary = specs ? Object.entries(specs).map(([k, v]) => `- ${k}: ${String(v)}`).join('\n') : '';
    return `### Giới thiệu tổng quan về ${name}\n\n${name} là sản phẩm phần cứng đỉnh cao thuộc phân khúc ${categoryName || 'công nghệ chính hãng'}, được thiết kế nhằm đáp ứng tối đa nhu cầu của người dùng khắt khe nhất. Với ngôn ngữ hoàn thiện cao cấp, độ bền vượt trội và linh kiện đạt chứng chỉ kiểm định quốc tế, sản phẩm mang lại sự an tâm tuyệt đối trong suốt quá trình vận hành.\n\n### Đặc điểm nổi bật\n- **Hiệu năng bứt phá**: Tối ưu hóa vi kiến trúc, hạn chế độ trễ và giữ mức nhiệt độ mát mẻ dưới tải nặng liên tục.\n- **Độ tin cậy hàng đầu**: Được bảo hành chính hãng lên tới 24-36 tháng cùng cam kết 1-đổi-1 trong 7 ngày đầu tại Nexora.\n- **Thiết kế công thái học**: Từng đường nét được trau chuốt tỉ mỉ, phù hợp với mọi không gian làm việc và setup gaming hiện đại.\n\n${specsSummary ? `### Thông số kỹ thuật chi tiết\n${specsSummary}\n` : ''}\n### Tại sao nên mua tại Nexora?\n- Cam kết 100% hàng mới nguyên seal, hóa đơn VAT đầy đủ.\n- Giao hàng siêu tốc toàn quốc, miễn phí vận chuyển cho đơn từ 500k.\n- Đội ngũ kỹ sư hỗ trợ kỹ thuật và tư vấn 24/7 qua hotline 1800 2097.`;
  }

  // --- Category CRUD + AI Generation ---
  async getCategories() {
    return prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
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
    return prisma.inventoryLog.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        actor: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
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

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newBalance },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          changeType: quantity > 0 ? 'IMPORT' : 'ADJUSTMENT',
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
