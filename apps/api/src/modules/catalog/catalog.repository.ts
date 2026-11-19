import type { PrismaClient, Category, Banner, Brand, Prisma } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';

export interface ProductFilterOptions {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  isFeatured?: boolean;
  isHot?: boolean;
  hasDiscount?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export class CatalogRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  async getCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getBanners(placement?: string): Promise<Banner[]> {
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getBrands(): Promise<Brand[]> {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getProducts(options: ProductFilterOptions = {}) {
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
    };

    if (options.categorySlug) {
      where.category = { slug: options.categorySlug };
    }

    if (options.brandSlug) {
      where.brand = { slug: options.brandSlug };
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { shortDescription: { contains: options.search } },
      ];
    }

    if (options.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured;
    }

    if (options.isHot !== undefined) {
      where.isHot = options.isHot;
    }

    if (options.hasDiscount) {
      where.salePrice = { not: null };
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      const priceFilter: Prisma.DecimalFilter = {};
      if (options.minPrice !== undefined) {
        priceFilter.gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        priceFilter.lte = options.maxPrice;
      }
      where.price = priceFilter;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
        take: options.limit ?? 24,
        skip: options.offset ?? 0,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async getProductBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }
}
